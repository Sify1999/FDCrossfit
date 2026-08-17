from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.athlete_record import AthleteRecordRead, AthleteRecordUpsert
from app.services.athlete_record import get_athlete_record, upsert_athlete_record

router = APIRouter(prefix="/athlete-records", tags=["athlete-records"])


@router.get("/me", response_model=AthleteRecordRead)
async def read_my_records(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AthleteRecordRead:
    row = await get_athlete_record(db, current_user.id)
    if row is None:
        # No log saved yet — return an empty one instead of 404, so the
        # frontend never needs a special "first time" error branch.
        return AthleteRecordRead(records=[], updated_at=datetime.now(timezone.utc))
    return AthleteRecordRead.model_validate(row)


@router.put("/me", response_model=AthleteRecordRead)
async def upsert_my_records(
    data: AthleteRecordUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AthleteRecordRead:
    row = await upsert_athlete_record(db, current_user.id, data)
    return AthleteRecordRead.model_validate(row)