from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.comment import Comment
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentRead
from app.services.comment import create_comment, delete_comment, get_comment_by_id, get_comments_for_workout
from app.services.comment_moderation import (
    check_cooldown,
    check_duplicate,
    check_hourly_limit,
    record_comment,
)
from app.services.workout import get_workout_by_date

router = APIRouter(prefix="/workouts/{workout_date}/comments", tags=["comments"])


@router.get("", response_model=list[CommentRead])
async def list_comments(
    workout_date: date,
    db: AsyncSession = Depends(get_db),
) -> list[CommentRead]:
    """Public — anyone can view comments on a workout (no auth required)."""
    workout = await get_workout_by_date(db, workout_date)
    if workout is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workout not found")
    return await get_comments_for_workout(db, workout.id)


@router.post("", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
async def add_comment(
    workout_date: date,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommentRead:
    """Logged-in users can post a comment or reply to an existing comment."""
    workout = await get_workout_by_date(db, workout_date)
    if workout is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workout not found")

    # ── Rate limiting ──────────────────────────────────────────────
    err = check_cooldown(current_user.id)
    if err:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, err)

    err = check_hourly_limit(current_user.id)
    if err:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, err)

    # ── Duplicate detection ────────────────────────────────────────
    # Fetch the user's last 5 comments to check for duplicates.
    recent = await db.execute(
        select(Comment.content)
        .where(Comment.user_id == current_user.id)
        .order_by(Comment.created_at.desc())
        .limit(5)
    )
    recent_contents = list(recent.scalars().all())
    err = check_duplicate(current_user.id, data.content, recent_contents)
    if err:
        raise HTTPException(status.HTTP_409_CONFLICT, err)

    # Validate parent_id references a real comment if provided.
    if data.parent_id is not None:
        parent = await get_comment_by_id(db, data.parent_id)
        if parent is None or parent.workout_id != workout.id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Parent comment not found")
        # Prevent nesting deeper than one level: if the target is already a reply,
        # redirect the new reply to the top-level comment instead.
        if parent.parent_id is not None:
            data.parent_id = parent.parent_id

    comment = await create_comment(db, workout.id, current_user.id, data)

    # Record the successful post for rate-limiting purposes.
    record_comment(current_user.id)

    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_comment(
    workout_date: date,
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a comment. Owner can delete their own; coaches/admins can
    delete any comment."""
    is_coach = current_user.role in ("coach", "admin")
    deleted = await delete_comment(db, comment_id, current_user.id, is_coach)
    if not deleted:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Comment not found or you don't have permission to delete it",
        )