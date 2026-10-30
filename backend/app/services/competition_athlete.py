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
    lines = data.lines or {}

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
            line=lines.get(event),
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
    lines = data.lines or {}

    # Update kept events (level / heat number / heat_id / line) and create new ones.
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
                    line=lines.get(event),
                )
            )
        else:
            line_number = lines.get(event)
            if (
                cur.level != data.level
                or cur.heat != heat_number
                or cur.heat_id != heat_id
                or cur.line != line_number
            ):
                cur.level = data.level
                cur.heat = heat_number
                cur.heat_id = heat_id
                cur.line = line_number

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


# Sentinel for "the caller didn't pass this argument at all".
# Distinguishes "not provided" from "explicitly set to None".
_UNSET = object()

async def update_athlete_score(
    db: AsyncSession,
    athlete_id: int,
    score: int | None | object = _UNSET,
    tiebreaker_type: str | None = _UNSET,
    tiebreaker_value: int | None = _UNSET,
    reps: int | None = _UNSET,
    weight: int | None = _UNSET,
    time_seconds: int | None = _UNSET,
    time_hundredths: int | None = _UNSET,
    score_2: int | None = _UNSET,
    reps_2: int | None = _UNSET,
    weight_2: int | None = _UNSET,
    time_seconds_2: int | None = _UNSET,
    tiebreaker_value_2: int | None = _UNSET,
    time_hundredths_2: int | None = _UNSET,
) -> CompetitionAthlete | None:
    """Update score, reps/weight, time-seconds and tiebreaker fields.

    Each optional field uses a sentinel default (``_UNSET``) so that
    ``None`` is treated as *explicitly clear the column*.  Callers
    that only want to set a few fields pass keyword arguments for the
    ones they care about.
    """
    values: dict = {}
    if score is not _UNSET:
        values["score"] = score
    if tiebreaker_type is not _UNSET:
        values["tiebreaker_type"] = tiebreaker_type
    if tiebreaker_value is not _UNSET:
        values["tiebreaker_value"] = tiebreaker_value
    if reps is not _UNSET:
        values["reps"] = reps
    if weight is not _UNSET:
        values["weight"] = weight
    if time_seconds is not _UNSET:
        values["time_seconds"] = time_seconds
    if time_hundredths is not _UNSET:
        values["time_hundredths"] = time_hundredths
    if score_2 is not _UNSET:
        values["score_2"] = score_2
    if reps_2 is not _UNSET:
        values["reps_2"] = reps_2
    if weight_2 is not _UNSET:
        values["weight_2"] = weight_2
    if time_seconds_2 is not _UNSET:
        values["time_seconds_2"] = time_seconds_2
    if time_hundredths_2 is not _UNSET:
        values["time_hundredths_2"] = time_hundredths_2
    if not values:
        return None
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
async def recompute_event_ranks(
    db: AsyncSession,
    event_number: int,
    time_cap_seconds: int | None = None,
) -> None:
    """
    Recompute scores for all athletes in a given event by ranking them.

    Event 1 (combined 1&2)
        rank by reps DESC, time_seconds ASC  →  score = rank
    Event 3 (for-time with cap)
        finished  (time <= cap) sorted by time ASC
        unfinished (time > cap or NULL) sorted by reps DESC
        score = rank
    """
    from sqlalchemy import update as upd

    stmt = select(CompetitionAthlete).where(
        CompetitionAthlete.event == event_number
    )
    result = await db.execute(stmt)
    athletes = list(result.scalars().all())

    # Group by level so each level gets its own 1..N ranking
    by_level: dict[str, list[CompetitionAthlete]] = {}
    for a in athletes:
        by_level.setdefault(a.level, []).append(a)

    if event_number == 1:
        for level, group in by_level.items():
            ev1 = sorted(group, key=lambda a: (
                -(a.reps or 0),
                a.time_seconds if a.time_seconds is not None else float("inf"),
            ))
            ev2 = sorted(group, key=lambda a: (
                -(a.reps_2 or 0),
                a.time_seconds_2 if a.time_seconds_2 is not None else float("inf"),
            ))
            rank_map = {}
            for r, a in enumerate(ev1, start=1):
                rank_map.setdefault(a.id, (r, 0))
            for r, a in enumerate(ev2, start=1):
                cur = rank_map.get(a.id, (0, 0))
                rank_map[a.id] = (cur[0], r)
            for aid, (r1, r2) in rank_map.items():
                await db.execute(
                    upd(CompetitionAthlete)
                    .where(CompetitionAthlete.id == aid)
                    .values(score=r1, score_2=r2)
                )
    elif event_number == 2:
        # Event 2 uses the same combined entry — handled by event=1 above
        return
    elif event_number == 3:
        cap = time_cap_seconds or 540  # default 9 min

        for level, group in by_level.items():
            def _key(a: CompetitionAthlete) -> tuple:
                total = (a.time_seconds or 0) + ((a.time_hundredths or 0) / 100.0)
                if (a.time_seconds is not None and
                    a.time_seconds <= cap and
                    (a.time_seconds < cap or (a.time_seconds == cap and (a.time_hundredths or 0) == 0))):
                    return (0, total, -(a.reps or 0))  # finished => time ASC, then reps DESC
                return (1, 0, -(a.reps or 0))         # unfinished => reps DESC
            group.sort(key=_key)
            for rank, athlete in enumerate(group, start=1):
                if athlete.score != rank:
                    await db.execute(
                        upd(CompetitionAthlete)
                        .where(CompetitionAthlete.id == athlete.id)
                        .values(score=rank)
                    )
    else:
        return  # not auto-scored

    await db.flush()