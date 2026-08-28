"""Section Template router — CRUD for reusable section templates."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_coach
from app.db.session import get_db
from app.models.user import User
from app.schemas.section_template import (
    SectionTemplateCreate,
    SectionTemplateRead,
    SectionTemplateUpdate,
)
from app.services.section_template import (
    create_template,
    delete_template,
    get_template_by_id,
    list_templates,
    update_template,
)

router = APIRouter(prefix="/section-templates", tags=["section-templates"])


@router.get("", response_model=list[SectionTemplateRead])
async def list_section_templates(
    q: str | None = Query(default=None, description="Search by template name"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> list[SectionTemplateRead]:
    """Coach/admin only — list your saved section templates."""
    templates = await list_templates(db, user_id=current_user.id, q=q)
    return [SectionTemplateRead.model_validate(t) for t in templates]


@router.get("/{template_id}", response_model=SectionTemplateRead)
async def get_section_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> SectionTemplateRead:
    """Coach/admin only — get a single section template by ID."""
    template = await get_template_by_id(db, template_id, user_id=current_user.id)
    if template is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Template not found")
    return SectionTemplateRead.model_validate(template)


@router.post("", response_model=SectionTemplateRead, status_code=status.HTTP_201_CREATED)
async def create_section_template(
    data: SectionTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> SectionTemplateRead:
    """Coach/admin only — save a section as a reusable template."""
    template = await create_template(db, data, user_id=current_user.id)
    return SectionTemplateRead.model_validate(template)


@router.put("/{template_id}", response_model=SectionTemplateRead)
async def update_section_template(
    template_id: int,
    data: SectionTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> SectionTemplateRead:
    """Coach/admin only — update a saved template."""
    template = await update_template(db, template_id, data, user_id=current_user.id)
    if template is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Template not found")
    return SectionTemplateRead.model_validate(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> None:
    """Coach/admin only — delete a saved template."""
    deleted = await delete_template(db, template_id, user_id=current_user.id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Template not found")