"""Complex service — CRUD for reusable workout complexes."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complex import Complex
from app.schemas.complex import ComplexCreate


async def search_complexes(
    db: AsyncSession, q: str | None = None, limit: int = 50
) -> list[Complex]:
    stmt = select(Complex).order_by(Complex.name)

    if q and q.strip():
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(Complex.name.ilike(pattern))

    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_complex_by_id(db: AsyncSession, complex_id: int) -> Complex | None:
    result = await db.execute(select(Complex).where(Complex.id == complex_id))
    return result.scalar_one_or_none()


async def create_complex(
    db: AsyncSession, data: ComplexCreate, created_by_id: int | None = None
) -> Complex:
    movements_dump = [m.model_dump() for m in data.movements]
    complex_obj = Complex(
        name=data.name.strip(),
        movements=movements_dump,
        created_by_id=created_by_id,
    )
    db.add(complex_obj)
    await db.flush()
    await db.refresh(complex_obj)
    return complex_obj