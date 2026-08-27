"""Movement router — browse/search/create movements."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_coach
from app.db.session import get_db
from app.models.user import User
from app.schemas.movement import MovementCreate, MovementRead
from app.services.movement import (
    create_movement,
    get_movement_by_normalized_name,
    search_movements,
)

router = APIRouter(prefix="/movements", tags=["movements"])


@router.get("", response_model=list[MovementRead])
async def list_movements(
    q: str | None = Query(default=None, description="Search by movement name"),
    db: AsyncSession = Depends(get_db),
) -> list[MovementRead]:
    """Public — anyone can browse the movement library."""
    movements = await search_movements(db, q=q)
    return [MovementRead.model_validate(m) for m in movements]


@router.post("", response_model=MovementRead, status_code=status.HTTP_201_CREATED)
async def create_movement_endpoint(
    data: MovementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> MovementRead:
    """Coach/admin only — create a new movement. Prevents accidental duplicates
    via normalized name comparison."""
    normalized = data.name.strip().lower()
    existing = await get_movement_by_normalized_name(db, normalized)
    if existing:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f'A movement named "{existing.name}" already exists',
        )
    movement = await create_movement(db, data, created_by_id=current_user.id)
    return MovementRead.model_validate(movement)