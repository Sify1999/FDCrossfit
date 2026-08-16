"""Workout service — CRUD for the daily programming shown on /book."""

from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workout import Workout
from app.schemas.workout import WorkoutUpsert


async def list_workouts_in_range(db: AsyncSession, start: date, end: date) -> list[Workout]:
    result = await db.execute(
        select(Workout).where(Workout.date >= start, Workout.date <= end).order_by(Workout.date)
    )
    return list(result.scalars().all())


async def get_workout_by_date(db: AsyncSession, day: date) -> Workout | None:
    result = await db.execute(select(Workout).where(Workout.date == day))
    return result.scalar_one_or_none()


async def upsert_workout(
    db: AsyncSession, day: date, data: WorkoutUpsert, created_by_id: int | None
) -> Workout:
    workout = await get_workout_by_date(db, day)
    sections_dump = [s.model_dump() for s in data.sections]

    if workout is None:
        workout = Workout(
            date=day,
            title=data.title,
            coach_name=data.coach_name,
            sections=sections_dump,
            created_by_id=created_by_id,
        )
        db.add(workout)
    else:
        workout.title = data.title
        workout.coach_name = data.coach_name
        workout.sections = sections_dump

    await db.flush()
    await db.refresh(workout)
    return workout


async def delete_workout(db: AsyncSession, day: date) -> bool:
    workout = await get_workout_by_date(db, day)
    if workout is None:
        return False
    await db.delete(workout)
    return True