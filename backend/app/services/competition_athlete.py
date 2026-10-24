"""Competition athlete service — create & list athletes for the scoreboard."""

from sqlalchemy import case, delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competition_athlete import CompetitionAthlete
from app.models.competition_event import CompetitionEvent
from app.models.competition_heat import CompetitionHeat
from app.schemas.competition_athlete import (
    CompetitionAthleteBulkCreate,
    CompetitionAthleteCreate,
    CompetitionAthleteUpdate,
    CompetitionAthleteUpdateRegistration,
)


async def list_athletes(
    db: AsyncSession,
    level: str | None = None,
    event: int | None = None,
    name: str | None = None,
) -> list[CompetitionAthlete]:
    stmt = select(CompetitionAthlete)

    if level is not None:
        stmt = stmt.where(CompetitionAthlete.level == level)
    if event is not None:
        stmt = stmt.where(CompetitionAthlete.event == event)
    if name is not None:
        stmt = stmt.where(CompetitionAthlete.name.ilike(f"%{name}%"))

    # Ranking: highest score first. On a tie, time tiebreakers rank by the
    # LOWEST time (negate → DESC gives ascending time), everything else by the
    # highest value. NULLs always sink to the bottom.
    tiebreak_order = case(
        (CompetitionAthlete.tiebreaker_type == "time", -CompetitionAthlete.tiebreaker_value),
        else_=CompetitionAthlete.tiebreaker_value,
    )
    stmt = stmt.order_by(
        CompetitionAthlete.score.asc().nullslast(),
        tiebreak_order.desc().nullslast(),
        CompetitionAthlete.event,
        CompetitionAthlete.name,
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def list_distinct_names(
    db: AsyncSession,
    query: str | None = None,
) -> list[str]:
    """Return distinct athlete names, optionally filtered by search query."""
    from sqlalchemy import func

    stmt = select(CompetitionAthlete.name).distinct().order_by(CompetitionAthlete.name)
    if query:
        stmt = stmt.where(CompetitionAthlete.name.ilike(f"%{query}%"))
    result = await db.execute(stmt)
    return [row[0] for row in result.all()]


async def get_athlete_entries(
    db: AsyncSession,
    name: str,
) -> list[CompetitionAthlete]:
    """Get all competition entries for a specific athlete name."""
    stmt = (
        select(CompetitionAthlete)
        .where(CompetitionAthlete.name == name)
        .order_by(CompetitionAthlete.event)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_athlete(
    db: AsyncSession,
    data: CompetitionAthleteCreate,
) -> CompetitionAthlete:
    athlete = CompetitionAthlete(
        name=data.name,
        level=data.level,
        event=data.event,
        score=None,  # score starts empty — filled later per event
    )
    db.add(athlete)
    await db.flush()
    await db.refresh(athlete)
    return athlete


async def create_athlete_bulk(
    db: AsyncSession,
    data: CompetitionAthleteBulkCreate,
) -> list[CompetitionAthlete]:
    """Create an athlete registered for multiple events, each optionally assigned to a heat.

    When a matching heat record exists for (event, heat number) we also wire the
    athlete's ``heat_id`` to it, connecting the athlete to the timed heat.
    """
    heats = data.heats or {}

    # Look up existing heat records for this athlete's level so we can link heat_id.
    heat_id_map: dict[tuple[int, int], int] = {}
    if heats:
        result = await db.execute(
            select(CompetitionHeat.id, CompetitionEvent.event_number, CompetitionHeat.heat_number)
            .join(CompetitionEvent, CompetitionHeat.event_id == CompetitionEvent.id)
            .where(CompetitionEvent.level == data.level.strip().lower())
        )
        for heat_id, event_number, heat_number in result.all():
            heat_id_map[(int(event_number), int(heat_number))] = int(heat_id)

    athletes = []
    for event in data.events:
        heat_number = heats.get(event)
        heat_id = heat_id_map.get((event, heat_number)) if heat_number is not None else None
        athlete = CompetitionAthlete(
            name=data.name,
            level=data.level,
            event=event,
            score=None,
            heat=heat_number,
            heat_id=heat_id,
        )
        db.add(athlete)
        athletes.append(athlete)
    await db.flush()
    for a in athletes:
        await db.refresh(a)
    return athletes


async def update_athlete_registration(
    db: AsyncSession,
    name: str,
    data: CompetitionAthleteUpdateRegistration,
) -> list[CompetitionAthlete]:
    """Reconcile an athlete's registration for events & heats.

    Events that remain keep their scores/tiebreakers; new events are created
    and removed events are deleted. Heat records are linked like in bulk create.
    """
    # Resolve heat record ids for this level's (event, heat) pairs.
    heat_id_map: dict[tuple[int, int], int] = {}
    if data.heats:
        result = await db.execute(
            select(CompetitionHeat.id, CompetitionEvent.event_number, CompetitionHeat.heat_number)
            .join(CompetitionEvent, CompetitionHeat.event_id == CompetitionEvent.id)
            .where(CompetitionEvent.level == data.level.strip().lower())
        )
        for heat_id, event_number, heat_number in result.all():
            heat_id_map[(int(event_number), int(heat_number))] = int(heat_id)

    existing = await get_athlete_entries(db, name)
    existing_by_event = {e.event: e for e in existing}
    target_events = set(data.events)
    heats = data.heats or {}

    # Update kept events (level / heat number / heat_id) and create new ones.
    for event in data.events:
        heat_number = heats.get(event)
        heat_id = heat_id_map.get((event, heat_number)) if heat_number is not None else None
        cur = existing_by_event.get(event)
        if cur is None:
            db.add(
                CompetitionAthlete(
                    name=name,
                    level=data.level,
                    event=event,
                    score=None,
                    heat=heat_number,
                    heat_id=heat_id,
                )
            )
        else:
            if cur.level != data.level or cur.heat != heat_number or cur.heat_id != heat_id:
                cur.level = data.level
                cur.heat = heat_number
                cur.heat_id = heat_id

    # Delete events that are no longer selected.
    to_delete = [ev for ev in existing_by_event if ev not in target_events]
    if to_delete:
        await db.execute(
            delete(CompetitionAthlete).where(
                CompetitionAthlete.name == name,
                CompetitionAthlete.event.in_(to_delete),
            )
        )

    await db.flush()
    return await get_athlete_entries(db, name)


async def delete_athlete_entries(
    db: AsyncSession,
    name: str,
) -> int:
    """Delete all competition entries for a given athlete name. Returns count of deleted rows."""
    stmt = delete(CompetitionAthlete).where(CompetitionAthlete.name == name)
    result = await db.execute(stmt)
    await db.flush()
    return result.rowcount


async def update_athlete_score(
    db: AsyncSession,
    athlete_id: int,
    score: int | None,
    tiebreaker_type: str | None = None,
    tiebreaker_value: int | None = None,
    reps: int | None = None,
    weight: int | None = None,
    score_2: int | None = None,
    reps_2: int | None = None,
    weight_2: int | None = None,
    tiebreaker_value_2: int | None = None,
) -> CompetitionAthlete | None:
    """Update the score, reps/weight and tiebreaker fields of a specific athlete entry."""
    values: dict = {"score": score}
    if tiebreaker_type is not None:
        values["tiebreaker_type"] = tiebreaker_type
    if tiebreaker_value is not None:
        values["tiebreaker_value"] = tiebreaker_value
    if reps is not None:
        values["reps"] = reps
    if weight is not None:
        values["weight"] = weight
    if score_2 is not None:
        values["score_2"] = score_2
    if reps_2 is not None:
        values["reps_2"] = reps_2
    if weight_2 is not None:
        values["weight_2"] = weight_2
    if tiebreaker_value_2 is not None:
        values["tiebreaker_value_2"] = tiebreaker_value_2
    stmt = (
        update(CompetitionAthlete)
        .where(CompetitionAthlete.id == athlete_id)
        .values(**values)
    )
    await db.execute(stmt)
    await db.flush()

    # Fetch and return updated row
    result = await db.execute(
        select(CompetitionAthlete).where(CompetitionAthlete.id == athlete_id)
    )
    return result.scalar_one_or_none()