"""Section Template service — CRUD for reusable section templates."""

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.section_template import SectionTemplate
from app.schemas.section_template import SectionTemplateCreate, SectionTemplateUpdate


async def list_templates(
    db: AsyncSession, user_id: int, q: str | None = None, limit: int = 50
) -> list[SectionTemplate]:
    stmt = (
        select(SectionTemplate)
        .where(SectionTemplate.user_id == user_id)
        .order_by(SectionTemplate.updated_at.desc())
    )

    if q and q.strip():
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(SectionTemplate.name.ilike(pattern))

    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_template_by_id(
    db: AsyncSession, template_id: int, user_id: int
) -> SectionTemplate | None:
    result = await db.execute(
        select(SectionTemplate).where(
            SectionTemplate.id == template_id,
            SectionTemplate.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def create_template(
    db: AsyncSession, data: SectionTemplateCreate, user_id: int
) -> SectionTemplate:
    template = SectionTemplate(
        user_id=user_id,
        name=data.name.strip(),
        section_type=data.section_type,
        section_data=data.section_data,
    )
    db.add(template)
    await db.flush()
    await db.refresh(template)
    return template


async def update_template(
    db: AsyncSession, template_id: int, data: SectionTemplateUpdate, user_id: int
) -> SectionTemplate | None:
    template = await get_template_by_id(db, template_id, user_id)
    if template is None:
        return None

    if data.name is not None:
        template.name = data.name.strip()
    if data.section_data is not None:
        template.section_data = data.section_data

    await db.flush()
    await db.refresh(template)
    return template


async def delete_template(
    db: AsyncSession, template_id: int, user_id: int
) -> bool:
    template = await get_template_by_id(db, template_id, user_id)
    if template is None:
        return False
    await db.delete(template)
    return True