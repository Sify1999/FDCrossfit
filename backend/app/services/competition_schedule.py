"""Competition schedule service — manage events, heats and their times."""

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.competition_event import CompetitionEvent
from app.models.competition_heat import CompetitionHeat
from app.schemas.competition_schedule import (
    CompetitionEventCreate,
    CompetitionEventRead,
    CompetitionEventUpdate,
    CompetitionHeatCreate,
    CompetitionHeatRead,
    CompetitionHeatUpdate,
)

# Pre-built events. Events 1 & 2 run back-to-back as one combined session,
# so it is a single entry labeled "Event 1&2"; event number 2 is skipped.
DEFAULT_EVENT_LEVELS = ("beginner", "intermediate", "advanced")
DEFAULT_EVENT_NUMBERS = [1, 3, 4, 5, 6, 7, 8, 9]
DEFAULT_EVENT_NAMES = {
    1: "Event 1&2",
    3: "Event 3",
    4: "Event 4",
    5: "Event 5",
    6: "Event 6",
    7: "Event 7",
    8: "Event 8",
    9: "Event 9",
}


async def ensure_default_events(db: AsyncSession) -> None:
    """Idempotently ensure the pre-built events exist for every level, so
    coaches only need to add heats & their times. Any missing (level,
    event_number) is inserted (two events share a day → 4 days)."""
    for level in DEFAULT_EVENT_LEVELS:
        result = await db.execute(
            select(CompetitionEvent).where(CompetitionEvent.level == level)
        )
        existing_numbers = {e.event_number for e in result.scalars().all()}
        for idx, number in enumerate(DEFAULT_EVENT_NUMBERS):
            if number in existing_numbers:
                continue
            db.add(
                CompetitionEvent(
                    level=level,
                    event_number=number,
                    name=DEFAULT_EVENT_NAMES[number],
                    day=idx // 2 + 1,
                    date=None,
                )
            )
    await db.flush()


async def get_schedule(
    db: AsyncSession,
    level: str | None = None,
) -> list[CompetitionEvent]:
    """Return all events (with heats and their athletes), optionally filtered by level."""
    await ensure_default_events(db)
    stmt = (
        select(CompetitionEvent)
        .options(
            selectinload(CompetitionEvent.heats).selectinload(CompetitionHeat.athletes)
        )
        .order_by(CompetitionEvent.day, CompetitionEvent.event_number)
    )
    if level is not None:
        stmt = stmt.where(CompetitionEvent.level == level)
    result = await db.execute(stmt)
    return list(result.scalars().unique().all())


async def get_event(
    db: AsyncSession,
    event_id: int,
) -> CompetitionEvent | None:
    """Fetch a single event with heats + athletes eager loaded (async-safe)."""
    stmt = (
        select(CompetitionEvent)
        .options(
            selectinload(CompetitionEvent.heats).selectinload(CompetitionHeat.athletes)
        )
        .where(CompetitionEvent.id == event_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_heat(
    db: AsyncSession,
    heat_id: int,
) -> CompetitionHeat | None:
    """Fetch a single heat with its athletes eager loaded (async-safe)."""
    stmt = (
        select(CompetitionHeat)
        .options(selectinload(CompetitionHeat.athletes))
        .where(CompetitionHeat.id == heat_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


def serialize_heat(heat: CompetitionHeat) -> CompetitionHeatRead:
    """Build a heat response, converting athlete relations to plain names."""
    return CompetitionHeatRead(
        id=heat.id,
        event_id=heat.event_id,
        heat_number=heat.heat_number,
        start_time=heat.start_time,
        end_time=heat.end_time,
        athletes=sorted({a.name for a in heat.athletes}),
    )


def serialize_event(ev: CompetitionEvent) -> CompetitionEventRead:
    """Build a response model, converting athlete relations to plain names."""
    return CompetitionEventRead(
        id=ev.id,
        level=ev.level,
        event_number=ev.event_number,
        name=ev.name,
        day=ev.day,
        date=ev.date,
        heats=[serialize_heat(h) for h in ev.heats],
    )


async def create_event(
    db: AsyncSession,
    data: CompetitionEventCreate,
) -> CompetitionEvent:
    existing = await db.execute(
        select(CompetitionEvent).where(
            CompetitionEvent.level == data.level,
            CompetitionEvent.event_number == data.event_number,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ValueError("An event with this number already exists for this level.")

    event = CompetitionEvent(**data.model_dump())
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return event


async def update_event(
    db: AsyncSession,
    event_id: int,
    data: CompetitionEventUpdate,
) -> CompetitionEvent | None:
    values = data.model_dump(exclude_unset=True)
    if values:
        await db.execute(update(CompetitionEvent).where(CompetitionEvent.id == event_id).values(**values))
        await db.flush()
    result = await db.execute(select(CompetitionEvent).where(CompetitionEvent.id == event_id))
    return result.scalar_one_or_none()


async def delete_event(
    db: AsyncSession,
    event_id: int,
) -> int:
    result = await db.execute(delete(CompetitionEvent).where(CompetitionEvent.id == event_id))
    await db.flush()
    return result.rowcount


async def create_heat(
    db: AsyncSession,
    data: CompetitionHeatCreate,
) -> CompetitionHeat:
    existing = await db.execute(
        select(CompetitionHeat).where(
            CompetitionHeat.event_id == data.event_id,
            CompetitionHeat.heat_number == data.heat_number,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ValueError("A heat with this number already exists for this event.")

    heat = CompetitionHeat(**data.model_dump())
    db.add(heat)
    await db.flush()
    await db.refresh(heat)
    return heat


async def update_heat(
    db: AsyncSession,
    heat_id: int,
    data: CompetitionHeatUpdate,
) -> CompetitionHeat | None:
    values = data.model_dump(exclude_unset=True)
    if values:
        await db.execute(update(CompetitionHeat).where(CompetitionHeat.id == heat_id).values(**values))
        await db.flush()
    result = await db.execute(select(CompetitionHeat).where(CompetitionHeat.id == heat_id))
    return result.scalar_one_or_none()


async def delete_heat(
    db: AsyncSession,
    heat_id: int,
) -> int:
    # Athletes pointing to this heat get heat_id SET NULL by the DB constraint.
    result = await db.execute(delete(CompetitionHeat).where(CompetitionHeat.id == heat_id))
    await db.flush()
    return result.rowcount