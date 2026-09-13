from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_coach
from app.db.session import get_db
from app.models.user import User
from app.schemas.workout_log import WorkoutLogRead, WorkoutLogUpsert
from app.services.workout import get_workout_by_date
from app.services.workout_log import (
    get_workout_log,
    list_logs_for_workout,
    upsert_workout_log,
)
from app.services.user import get_user_by_id

router = APIRouter(
    prefix="/workouts/{workout_date}/logs", tags=["workout-logs"]
)


async def _resolve_workout(workout_date: str, db: AsyncSession):
    from datetime import date as date_type

    try:
        parsed = date_type.fromisoformat(workout_date)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date format")

    workout = await get_workout_by_date(db, parsed)
    if workout is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "No workout programmed for this date"
        )
    return workout


# ─── Athlete endpoints (logged-in user manages their own log) ──────────


@router.get("/mine", response_model=WorkoutLogRead)
async def read_my_log(
    workout_date: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkoutLogRead:
    workout = await _resolve_workout(workout_date, db)
    row = await get_workout_log(db, workout.id, current_user.id)
    if row is None:
        return WorkoutLogRead(
            log_data=[], updated_at=datetime.now(timezone.utc), user_id=current_user.id
        )
    return WorkoutLogRead(
        user_id=row.user_id,
        log_data=row.log_data,
        updated_at=row.updated_at,
    )


@router.put("/mine", response_model=WorkoutLogRead)
async def upsert_my_log(
    workout_date: str,
    data: WorkoutLogUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkoutLogRead:
    workout = await _resolve_workout(workout_date, db)
    row = await upsert_workout_log(db, workout.id, current_user.id, data)
    return WorkoutLogRead(
        user_id=row.user_id,
        log_data=row.log_data,
        updated_at=row.updated_at,
    )


# ─── Coach/admin endpoints (view all logs or a specific athlete) ───────


@router.get("", response_model=list[WorkoutLogRead])
async def list_all_logs(
    workout_date: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> list[WorkoutLogRead]:
    workout = await _resolve_workout(workout_date, db)
    rows = await list_logs_for_workout(db, workout.id)
    # Explicit construction to avoid model_validate field-mapping issues
    return [
        WorkoutLogRead(
            user_id=r.user_id,
            log_data=r.log_data,
            updated_at=r.updated_at,
        )
        for r in rows
    ]


@router.get("/{user_id}", response_model=WorkoutLogRead)
async def read_athlete_log(
    workout_date: str,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> WorkoutLogRead:
    athlete = await get_user_by_id(db, user_id)
    if athlete is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Athlete not found")

    workout = await _resolve_workout(workout_date, db)
    row = await get_workout_log(db, workout.id, user_id)
    if row is None:
        return WorkoutLogRead(
            log_data=[], updated_at=datetime.now(timezone.utc), user_id=user_id
        )
    return WorkoutLogRead(
        user_id=row.user_id,
        log_data=row.log_data,
        updated_at=row.updated_at,
    )