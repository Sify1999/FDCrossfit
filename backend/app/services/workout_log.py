"""Workout log service — one JSONB row per athlete per workout, upserted wholesale."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workout_log import WorkoutLog
from app.schemas.workout_log import WorkoutLogUpsert


async def get_workout_log(
    db: AsyncSession, workout_id: int, user_id: int
) -> WorkoutLog | None:
    result = await db.execute(
        select(WorkoutLog).where(
            WorkoutLog.workout_id == workout_id,
            WorkoutLog.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def upsert_workout_log(
    db: AsyncSession,
    workout_id: int,
    user_id: int,
    data: WorkoutLogUpsert,
) -> WorkoutLog:
    row = await get_workout_log(db, workout_id, user_id)

    # Serialize: drop empty movement entries
    logs_dump = [s.model_dump() for s in data.log_data]

    if row is None:
        row = WorkoutLog(workout_id=workout_id, user_id=user_id, log_data=logs_dump)
        db.add(row)
    else:
        row.log_data = logs_dump

    await db.flush()
    await db.refresh(row)
    return row


async def list_logs_for_workout(
    db: AsyncSession, workout_id: int
) -> list[WorkoutLog]:
    result = await db.execute(
        select(WorkoutLog).where(WorkoutLog.workout_id == workout_id)
    )
    return list(result.scalars().all())