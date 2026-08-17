"""Athlete PR log service — one JSONB row per user, upserted wholesale."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.athlete_record import AthleteRecord
from app.schemas.athlete_record import AthleteRecordUpsert


async def get_athlete_record(db: AsyncSession, user_id: int) -> AthleteRecord | None:
    result = await db.execute(select(AthleteRecord).where(AthleteRecord.user_id == user_id))
    return result.scalar_one_or_none()


async def upsert_athlete_record(
    db: AsyncSession, user_id: int, data: AthleteRecordUpsert
) -> AthleteRecord:
    row = await get_athlete_record(db, user_id)

    # Drop rows with no value — an "unset" lift shouldn't take up storage,
    # and it means the frontend can always merge fresh data against its
    # default exercise list without ever piling up empty duplicates.
    records_dump = [r.model_dump() for r in data.records if r.value.strip()]

    if row is None:
        row = AthleteRecord(user_id=user_id, records=records_dump)
        db.add(row)
    else:
        row.records = records_dump

    await db.flush()
    await db.refresh(row)
    return row