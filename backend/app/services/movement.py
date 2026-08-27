"""Movement service — CRUD for the movement library."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.movement import Movement
from app.schemas.movement import MovementCreate


def normalize_name(name: str) -> str:
    return name.strip().lower()


async def search_movements(
    db: AsyncSession, q: str | None = None, limit: int = 50
) -> list[Movement]:
    stmt = select(Movement).order_by(Movement.name)

    if q and q.strip():
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(Movement.normalized_name.ilike(pattern))

    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_movement_by_id(db: AsyncSession, movement_id: int) -> Movement | None:
    result = await db.execute(select(Movement).where(Movement.id == movement_id))
    return result.scalar_one_or_none()


async def get_movement_by_normalized_name(
    db: AsyncSession, normalized: str
) -> Movement | None:
    result = await db.execute(
        select(Movement).where(Movement.normalized_name == normalized)
    )
    return result.scalar_one_or_none()


async def create_movement(
    db: AsyncSession, data: MovementCreate, created_by_id: int | None = None
) -> Movement:
    normalized = normalize_name(data.name)
    movement = Movement(
        name=data.name.strip(),
        normalized_name=normalized,
        created_by_id=created_by_id,
    )
    db.add(movement)
    await db.flush()
    await db.refresh(movement)
    return movement


async def get_recent_movements(
    db: AsyncSession, limit: int = 10
) -> list[Movement]:
    """Return the most recently created movements (used for 'recently used' picker)."""
    stmt = select(Movement).order_by(Movement.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())