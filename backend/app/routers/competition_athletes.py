from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_coach
from app.db.session import get_db
from app.models.user import User
from app.schemas.competition_athlete import (
    CompetitionAthleteBulkCreate,
    CompetitionAthleteCreate,
    CompetitionAthleteList,
    CompetitionAthleteRead,
    CompetitionAthleteUpdate,
)
from app.services.competition_athlete import (
    create_athlete,
    create_athlete_bulk,
    delete_athlete_entries,
    get_athlete_entries,
    list_athletes,
    list_distinct_names,
    update_athlete_score,
)

router = APIRouter(prefix="/competition-athletes", tags=["competition-athletes"])


@router.get("", response_model=CompetitionAthleteList)
async def get_competition_athletes(
    level: str | None = Query(None, description="Filter by level"),
    event: int | None = Query(None, ge=1, le=4, description="Filter by event number"),
    name: str | None = Query(None, description="Search by athlete name"),
    db: AsyncSession = Depends(get_db),
) -> CompetitionAthleteList:
    """Public endpoint — returns all registered competition athletes,
    optionally filtered by level and/or event and/or name."""
    athletes = await list_athletes(db, level=level, event=event, name=name)
    return CompetitionAthleteList(
        athletes=[CompetitionAthleteRead.model_validate(a) for a in athletes]
    )


@router.get("/names", response_model=list[str])
async def get_competition_athlete_names(
    q: str | None = Query(None, description="Search query to filter athletes"),
    db: AsyncSession = Depends(get_db),
) -> list[str]:
    """Public endpoint — returns distinct athlete names, optionally filtered."""
    return await list_distinct_names(db, query=q)


@router.get("/{name}", response_model=CompetitionAthleteList)
async def get_single_athlete_entries(
    name: str,
    db: AsyncSession = Depends(get_db),
) -> CompetitionAthleteList:
    """Get all competition entries for a specific athlete by name."""
    athletes = await get_athlete_entries(db, name)
    return CompetitionAthleteList(
        athletes=[CompetitionAthleteRead.model_validate(a) for a in athletes]
    )


@router.post("", response_model=CompetitionAthleteRead, status_code=201)
async def add_competition_athlete(
    data: CompetitionAthleteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> CompetitionAthleteRead:
    """Coach/admin only — register a new athlete for a single event."""
    athlete = await create_athlete(db, data)
    return CompetitionAthleteRead.model_validate(athlete)


@router.post("/bulk", response_model=CompetitionAthleteList, status_code=201)
async def add_competition_athlete_bulk(
    data: CompetitionAthleteBulkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> CompetitionAthleteList:
    """Coach/admin only — register an athlete for multiple events at once."""
    athletes = await create_athlete_bulk(db, data)
    return CompetitionAthleteList(
        athletes=[CompetitionAthleteRead.model_validate(a) for a in athletes]
    )


@router.patch("/{athlete_id}", response_model=CompetitionAthleteRead)
async def update_competition_athlete_score(
    athlete_id: int,
    data: CompetitionAthleteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> CompetitionAthleteRead:
    """Coach/admin only — update the score for a specific athlete entry."""
    updated = await update_athlete_score(db, athlete_id, data.score)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete entry not found",
        )
    return CompetitionAthleteRead.model_validate(updated)


@router.delete("/{name}", status_code=204)
async def delete_competition_athlete(
    name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_coach),
) -> None:
    """Coach/admin only — delete all entries for an athlete by name."""
    deleted_count = await delete_athlete_entries(db, name)
    if deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No athlete found with name '{name}'",
        )
    return None