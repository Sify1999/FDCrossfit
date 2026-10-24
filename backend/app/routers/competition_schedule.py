from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.competition_schedule import (
    CompetitionEventCreate,
    CompetitionEventRead,
    CompetitionEventUpdate,
    CompetitionHeatCreate,
    CompetitionHeatRead,
    CompetitionHeatUpdate,
    CompetitionScheduleResponse,
)
from app.services.competition_schedule import (
    create_event,
    create_heat,
    delete_event,
    delete_heat,
    get_event,
    get_heat,
    get_schedule,
    serialize_event,
    serialize_heat,
    update_event,
    update_heat,
)

router = APIRouter(prefix="/competition", tags=["competition-schedule"])


def _guard(exc: ValueError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/schedule", response_model=CompetitionScheduleResponse)
async def get_schedule_endpoint(
    level: str | None = Query(None, description="Filter by level key (beginner/intermediate/advanced)"),
    db: AsyncSession = Depends(get_db),
) -> CompetitionScheduleResponse:
    """Public endpoint — returns the full competition schedule with heats & their times."""
    events = await get_schedule(db, level=level)
    return CompetitionScheduleResponse(events=[serialize_event(e) for e in events])


@router.post("/events", response_model=CompetitionEventRead, status_code=201)
async def add_event(
    data: CompetitionEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> CompetitionEventRead:
    """Admin only — create a new event."""
    try:
        created = await create_event(db, data)
    except ValueError as exc:
        raise _guard(exc) from exc
    event = await get_event(db, created.id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return serialize_event(event)


@router.patch("/events/{event_id}", response_model=CompetitionEventRead)
async def edit_event(
    event_id: int,
    data: CompetitionEventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> CompetitionEventRead:
    """Admin only — update an event."""
    updated = await update_event(db, event_id, data)
    event = await get_event(db, event_id)
    if not updated or event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return serialize_event(event)


@router.delete("/events/{event_id}", status_code=204)
async def remove_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> None:
    """Admin only — delete an event and all of its heats."""
    deleted = await delete_event(db, event_id)
    if deleted == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return None


@router.post("/heats", response_model=CompetitionHeatRead, status_code=201)
async def add_heat(
    data: CompetitionHeatCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> CompetitionHeatRead:
    """Admin only — add a heat with a start/end time to an event."""
    try:
        created = await create_heat(db, data)
    except ValueError as exc:
        raise _guard(exc) from exc
    heat = await get_heat(db, created.id)
    if heat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Heat not found")
    return serialize_heat(heat)


@router.patch("/heats/{heat_id}", response_model=CompetitionHeatRead)
async def edit_heat(
    heat_id: int,
    data: CompetitionHeatUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> CompetitionHeatRead:
    """Admin only — update a heat (number, start and/or end time)."""
    updated = await update_heat(db, heat_id, data)
    heat = await get_heat(db, heat_id)
    if not updated or heat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Heat not found")
    return serialize_heat(heat)


@router.delete("/heats/{heat_id}", status_code=204)
async def remove_heat(
    heat_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> None:
    """Admin only — delete a heat. Athletes keep their heat number but the
    link to this heat record is cleared (heat_id → NULL)."""
    deleted = await delete_heat(db, heat_id)
    if deleted == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Heat not found")
    return None