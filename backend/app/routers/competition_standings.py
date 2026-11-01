from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.competition_standings import (
    CloseStageRequest,
    ReopenStageRequest,
    StandingsResponse,
)
from app.services.competition_scoring import is_valid_level
from app.services.competition_standings import close_stage, get_standings, reopen_stage

router = APIRouter(prefix="/competition", tags=["competition-standings"])


def _check_level(level: str) -> None:
    if not is_valid_level(level):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Level must be beginner, intermediate or advanced",
        )


@router.get("/standings", response_model=StandingsResponse)
async def standings_endpoint(
    level: str = Query(..., description="beginner / intermediate / advanced"),
    stage: int | None = Query(None, ge=1, le=3, description="Defaults to the current stage"),
    advance: int | None = Query(
        None, ge=1, description="Preview: draw the cut line after this many athletes"
    ),
    db: AsyncSession = Depends(get_db),
) -> StandingsResponse:
    """Public — standings for one level and stage."""
    _check_level(level)
    return await get_standings(db, level, stage, advance)


@router.post("/stages/close", response_model=StandingsResponse)
async def close_stage_endpoint(
    data: CloseStageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> StandingsResponse:
    """Admin only — close a stage and eliminate everyone below the cut."""
    _check_level(data.level)
    try:
        await close_stage(db, data.level, data.stage, data.advance_count, data.tie_winners)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return await get_standings(db, data.level, data.stage)


@router.post("/stages/reopen", response_model=StandingsResponse)
async def reopen_stage_endpoint(
    data: ReopenStageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> StandingsResponse:
    """Admin only — undo a cut."""
    _check_level(data.level)
    try:
        await reopen_stage(db, data.level, data.stage)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return await get_standings(db, data.level, data.stage)