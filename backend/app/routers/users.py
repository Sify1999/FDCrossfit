from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_coach
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserRead
from app.services.user import list_members

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def read_current_user(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get("", response_model=list[UserRead])
async def list_athletes(
    q: str | None = Query(default=None, description="Search by username, email, or full name"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> list[UserRead]:
    """Coach/admin only — backs the athlete roster in the dashboard.
    Was previously missing entirely, which is why the roster always came
    back empty regardless of search."""
    members = await list_members(db, search=q)
    return [UserRead.model_validate(m) for m in members]