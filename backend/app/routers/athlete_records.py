from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_coach
from app.db.session import get_db
from app.models.user import User
from app.schemas.athlete_record import AthleteRecordRead, AthleteRecordUpsert
from app.services.athlete_record import get_athlete_record, upsert_athlete_record
from app.services.user import get_user_by_id

router = APIRouter(prefix="/athlete-records", tags=["athlete-records"])


@router.get("/me", response_model=AthleteRecordRead)
async def read_my_records(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AthleteRecordRead:
    row = await get_athlete_record(db, current_user.id)
    if row is None:
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


# ─── Coach/admin: view or edit another athlete's log ──────────────────
# Registered after "/me" so "/me" is always matched as the literal path
# first; these two use an int path param and would 422 (not silently
# match) if a request to "/me" ever fell through to them.

@router.get("/{user_id}", response_model=AthleteRecordRead)
async def read_athlete_records(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> AthleteRecordRead:
    athlete = await get_user_by_id(db, user_id)
    if athlete is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Athlete not found")

    row = await get_athlete_record(db, user_id)
    if row is None:
        return AthleteRecordRead(records=[], updated_at=datetime.now(timezone.utc))
    return AthleteRecordRead.model_validate(row)


@router.put("/{user_id}", response_model=AthleteRecordRead)
async def upsert_athlete_records(
    user_id: int,
    data: AthleteRecordUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> AthleteRecordRead:
    athlete = await get_user_by_id(db, user_id)
    if athlete is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Athlete not found")

    row = await upsert_athlete_record(db, user_id, data)
    return AthleteRecordRead.model_validate(row)