from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_coach
from app.db.session import get_db
from app.models.user import User
from app.schemas.workout import WorkoutRead, WorkoutUpsert
from app.services.workout import (
    delete_workout,
    get_workout_by_date,
    list_workouts_in_range,
    upsert_workout,
)

router = APIRouter(prefix="/workouts", tags=["workouts"])

# A little past 6 months — keeps someone from requesting date_from=1900
# and having Postgres scan/serialize the whole table in one response.
MAX_RANGE_DAYS = 186


@router.get("", response_model=list[WorkoutRead])
async def list_workouts(
    date_from: date,
    date_to: date,
    db: AsyncSession = Depends(get_db),
) -> list[WorkoutRead]:
    """Public — anyone (logged in or not) can view the schedule."""
    if date_to < date_from:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "date_to must be on or after date_from")
    if (date_to - date_from).days > MAX_RANGE_DAYS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Range cannot exceed {MAX_RANGE_DAYS} days")

    workouts = await list_workouts_in_range(db, date_from, date_to)
    return [WorkoutRead.model_validate(w) for w in workouts]


@router.get("/{workout_date}", response_model=WorkoutRead)
async def get_workout(workout_date: date, db: AsyncSession = Depends(get_db)) -> WorkoutRead:
    workout = await get_workout_by_date(db, workout_date)
    if workout is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No workout programmed for this date")
    return WorkoutRead.model_validate(workout)


@router.put("/{workout_date}", response_model=WorkoutRead)
async def upsert_workout_endpoint(
    workout_date: date,
    data: WorkoutUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> WorkoutRead:
    """Coach/admin only — create or replace the workout for a date."""
    workout = await upsert_workout(db, workout_date, data, created_by_id=current_user.id)
    return WorkoutRead.model_validate(workout)


@router.delete("/{workout_date}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout_endpoint(
    workout_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> None:
    deleted = await delete_workout(db, workout_date)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No workout programmed for this date")