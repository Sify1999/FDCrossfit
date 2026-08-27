"""Complex router — browse/search/create reusable complexes."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_coach
from app.db.session import get_db
from app.models.user import User
from app.schemas.complex import ComplexCreate, ComplexRead
from app.services.complex import create_complex, search_complexes

router = APIRouter(prefix="/complexes", tags=["complexes"])


@router.get("", response_model=list[ComplexRead])
async def list_complexes(
    q: str | None = Query(default=None, description="Search by complex name"),
    db: AsyncSession = Depends(get_db),
) -> list[ComplexRead]:
    """Public — anyone can browse existing complexes."""
    complexes = await search_complexes(db, q=q)
    return [ComplexRead.model_validate(c) for c in complexes]


@router.post("", response_model=ComplexRead, status_code=status.HTTP_201_CREATED)
async def create_complex_endpoint(
    data: ComplexCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> ComplexRead:
    """Coach/admin only — create a reusable complex."""
    complex_obj = await create_complex(db, data, created_by_id=current_user.id)
    return ComplexRead.model_validate(complex_obj)