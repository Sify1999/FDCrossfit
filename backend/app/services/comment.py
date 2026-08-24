"""Comment service — CRUD for workout comments with threaded replies."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.comment import Comment
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentRead


async def get_comments_for_workout(
    db: AsyncSession, workout_id: int
) -> list[CommentRead]:
    """Fetch all top-level comments (parent_id IS NULL) for a workout, each
    with its replies eagerly loaded and sorted oldest-first so the
    conversation reads chronologically."""

    # Eagerly load user and child replies for every comment.
    stmt = (
        select(Comment)
        .where(Comment.workout_id == workout_id, Comment.parent_id.is_(None))
        .options(
            selectinload(Comment.replies).selectinload(Comment.user),
            selectinload(Comment.user),
        )
        .order_by(Comment.created_at)
    )
    result = await db.execute(stmt)
    comments = list(result.scalars().all())

    return [_comment_to_read(c) for c in comments]


async def create_comment(
    db: AsyncSession, workout_id: int, user_id: int, data: CommentCreate
) -> CommentRead:
    comment = Comment(
        workout_id=workout_id,
        user_id=user_id,
        parent_id=data.parent_id,
        content=data.content,
    )
    db.add(comment)
    await db.flush()
    await db.refresh(comment, ["user", "replies"])

    return _comment_to_read(comment)


async def delete_comment(
    db: AsyncSession, comment_id: int, user_id: int, is_coach: bool
) -> bool:
    """Delete a comment. The owner can always delete; coaches/admins can
    delete any comment on workouts they coach."""
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()
    if comment is None:
        return False

    if comment.user_id != user_id and not is_coach:
        return False

    await db.delete(comment)
    return True


async def get_comment_by_id(db: AsyncSession, comment_id: int) -> Comment | None:
    """Fetch a single comment by ID."""
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    return result.scalar_one_or_none()


# ─── Helpers ───────────────────────────────────────────────────────────


def _comment_to_read(comment: Comment) -> CommentRead:
    """Convert a Comment ORM object (with .user loaded) to a CommentRead."""
    username = ""
    full_name = None
    if comment.user:
        username = comment.user.username
        full_name = comment.user.full_name

    replies = []
    # The relationship "replies" is loaded via selectinload above.
    for reply in sorted(comment.replies, key=lambda r: r.created_at):
        reply_username = ""
        reply_full_name = None
        if reply.user:
            reply_username = reply.user.username
            reply_full_name = reply.user.full_name

        replies.append(
            CommentRead(
                id=reply.id,
                workout_id=reply.workout_id,
                user_id=reply.user_id,
                parent_id=reply.parent_id,
                content=reply.content,
                created_at=reply.created_at,
                updated_at=reply.updated_at,
                username=reply_username,
                full_name=reply_full_name,
                replies=[],
            )
        )

    return CommentRead(
        id=comment.id,
        workout_id=comment.workout_id,
        user_id=comment.user_id,
        parent_id=comment.parent_id,
        content=comment.content,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        username=username,
        full_name=full_name,
        replies=replies,
    )