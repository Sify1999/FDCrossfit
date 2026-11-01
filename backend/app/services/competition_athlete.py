"""Competition athlete service — create & list athletes for the scoreboard."""

from sqlalchemy import case, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competition_athlete import CompetitionAthlete
from app.models.competition_event import CompetitionEvent
from app.models.competition_heat import CompetitionHeat
from app.schemas.competition_athlete import (
    CompetitionAthleteBulkCreate,
    CompetitionAthleteCreate,
    CompetitionAthleteUpdateRegistration,
)
from app.services.competition_scoring import LEVEL_MAX_EVENT, normalize_level

# Row events: Event 2 lives on the combined "Event 1&2" row (event number 1).
ROW_EVENTS = [1, 3, 4, 5, 6, 7, 8, 9]


def level_row_events(level: str) -> list[int]:
    """Event rows every athlete of this level has (beginner/intermediate: 1-8,
    advanced: 1-9)."""
    max_event = LEVEL_MAX_EVENT.get(normalize_level(level), 9)
    return [e for e in ROW_EVENTS if e <= max_event]


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


# ─── Registration (no event picker) ───────────────────────────────────

async def _heat_id_map(db: AsyncSession, level: str) -> dict[tuple[int, int], int]:
    """(event number, heat number) -> heat record id, for this level."""
    result = await db.execute(
        select(CompetitionHeat.id, CompetitionEvent.event_number, CompetitionHeat.heat_number)
        .join(CompetitionEvent, CompetitionHeat.event_id == CompetitionEvent.id)
        .where(CompetitionEvent.level == normalize_level(level))
    )
    return {(int(ev), int(hn)): int(hid) for hid, ev, hn in result.all()}


async def _rows_for(db: AsyncSession, name: str, level: str) -> list[CompetitionAthlete]:
    result = await db.execute(
        select(CompetitionAthlete)
        .where(
            CompetitionAthlete.name == name,
            func.lower(CompetitionAthlete.level) == normalize_level(level),
        )
        .order_by(CompetitionAthlete.event)
    )
    return list(result.scalars().all())


async def ensure_event_rows(db: AsyncSession, name: str, level: str) -> None:
    """Make sure the athlete has a row for every event of their level.
    INSERT-ONLY: existing rows (scores, heats, lines) are never touched."""
    have = {r.event for r in await _rows_for(db, name, level)}
    for ev in level_row_events(level):
        if ev not in have:
            db.add(CompetitionAthlete(name=name, level=level, event=ev, score=None))
    await db.flush()


async def _apply_assignments(
    db: AsyncSession,
    name: str,
    level: str,
    heats: dict[int, int | None],
    lines: dict[int, int | None],
) -> None:
    """Set heat / line ONLY for the events present in the maps (None clears).
    Events that aren't mentioned are left exactly as they are."""
    if not heats and not lines:
        return
    heat_ids = await _heat_id_map(db, level) if heats else {}
    for row in await _rows_for(db, name, level):
        if row.event in heats:
            hn = heats[row.event]
            row.heat = hn
            row.heat_id = heat_ids.get((row.event, hn)) if hn is not None else None
        if row.event in lines:
            row.line = lines[row.event]
    await db.flush()


async def create_athlete_bulk(
    db: AsyncSession,
    data: CompetitionAthleteBulkCreate,
) -> list[CompetitionAthlete]:
    """Register an athlete: one row per event of their level, then apply the
    optional heat / line assignments. If the athlete already exists in this
    level, missing event rows are added and nothing is duplicated or lost."""
    await ensure_event_rows(db, data.name, data.level)
    await _apply_assignments(db, data.name, data.level, data.heats or {}, data.lines or {})
    return await _rows_for(db, data.name, data.level)


async def update_athlete_registration(
    db: AsyncSession,
    name: str,
    data: CompetitionAthleteUpdateRegistration,
) -> list[CompetitionAthlete]:
    """Update an athlete's level, heats and lines. NEVER deletes rows or
    clears scores — missing event rows are simply added."""
    for row in await get_athlete_entries(db, name):
        if row.level != data.level:
            row.level = data.level
    await db.flush()

    await ensure_event_rows(db, name, data.level)
    await _apply_assignments(db, name, data.level, data.heats or {}, data.lines or {})
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
    if tiebreaker_value_2 is not _UNSET:
        values["tiebreaker_value_2"] = tiebreaker_value_2
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
    LEGACY — writes the old `score` column for events 1 and 3 across ALL
    athletes. The new stage standings don't read it (ranks are derived from the
    raw results), so it is harmless; it can be removed later.
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
        # Combined Event 1&2: two separate ranks per level
        # Event 1 by reps DESC + time(+hundredths) ASC → score
        # Event 2 by reps_2 DESC + time_2(+hundredths_2) ASC → score_2
        for level, group in by_level.items():
            ev1 = sorted(group, key=lambda a: (
                -(a.reps or 0),
                (a.time_seconds or 0) + ((a.time_hundredths or 0) / 100.0)
                if a.time_seconds is not None else float("inf"),
            ))
            ev2 = sorted(group, key=lambda a: (
                -(a.reps_2 or 0),
                (a.time_seconds_2 or 0) + ((a.time_hundredths_2 or 0) / 100.0)
                if a.time_seconds_2 is not None else float("inf"),
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
        return  # Event 2 handled by event 1 above
    elif event_number == 3:
        cap = time_cap_seconds or 540  # default 9 min

        for level, group in by_level.items():
            def _ev3_key(a: CompetitionAthlete) -> tuple:
                total = (a.time_seconds or 0) + ((a.time_hundredths or 0) / 100.0)
                if (a.time_seconds is not None and
                    a.time_seconds <= cap and
                    (a.time_seconds < cap or (a.time_seconds == cap and (a.time_hundredths or 0) == 0))):
                    return (0, total, -(a.reps or 0))   # finished => time ASC, then reps DESC
                return (1, 0, -(a.reps or 0))            # unfinished => reps DESC
            group.sort(key=_ev3_key)
            for rank, athlete in enumerate(group, start=1):
                if athlete.score != rank:
                    await db.execute(
                        upd(CompetitionAthlete)
                        .where(CompetitionAthlete.id == athlete.id)
                        .values(score=rank)
                    )
    elif event_number == 4:
        # Event 4: time ASC (lower better), tiebreaker_value ASC (lower better)
        for level, group in by_level.items():
            group.sort(key=lambda a: (
                a.time_seconds if a.time_seconds is not None else float("inf"),
                a.tiebreaker_value if a.tiebreaker_value is not None else float("inf"),
            ))
            for rank, athlete in enumerate(group, start=1):
                if athlete.score != rank:
                    await db.execute(
                        upd(CompetitionAthlete)
                        .where(CompetitionAthlete.id == athlete.id)
                        .values(score=rank)
                    )
    elif event_number in (5, 6):
        # Events 5 & 6: reps DESC (more better), tiebreaker_value ASC (lower better)
        for level, group in by_level.items():
            group.sort(key=lambda a: (
                -(a.reps or 0),
                a.tiebreaker_value if a.tiebreaker_value is not None else float("inf"),
            ))
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