"""Stage standings, closing a stage (the cut) and reopening it.

Stage total = sum of this stage's event ranks, ranked among the athletes still
active in the stage. Totals start from zero in every stage, and are always
derived from raw results — nothing is overwritten at a cut, so entering or
correcting a result updates the standings live.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competition_athlete import CompetitionAthlete
from app.models.competition_participant import CompetitionParticipant
from app.models.competition_stage import CompetitionStage
from app.schemas.competition_standings import (
    EventCell,
    StageStanding,
    StageSummary,
    StandingRow,
    StandingsResponse,
    TieInfo,
)
from app.services.competition_scoring import (
    STAGE_EVENTS,
    TOTAL_STAGES,
    display_result,
    normalize_level,
    rank_event,
    row_event_for,
    stage_events,
)


# ─── Internal structures ──────────────────────────────────────────────

@dataclass
class _Row:
    participant: CompetitionParticipant
    cells: dict[int, tuple[int | None, str | None]] = field(default_factory=dict)
    total: int = 0
    firsts: int = 0
    completed: int = 0
    position: int = 0

    @property
    def name(self) -> str:
        return self.participant.name

    @property
    def key(self) -> tuple:
        # Ascending = better: more completed events first (so half-entered
        # results don't look better than complete ones), then lower total,
        # then more first places.
        return (-self.completed, self.total, -self.firsts)


@dataclass
class _Computation:
    state: str  # "locked" | "open" | "closed"
    events: list[int]
    rows: list[_Row]
    stage_row: CompetitionStage | None


# ─── Loading helpers ──────────────────────────────────────────────────

async def ensure_participants(db: AsyncSession, level: str) -> list[CompetitionParticipant]:
    """Sync participants with the athletes registered in this level: create
    missing ones, drop ones whose athlete was removed. Status of existing
    participants is never touched here."""
    lv = normalize_level(level)

    names_result = await db.execute(
        select(CompetitionAthlete.name)
        .where(func.lower(CompetitionAthlete.level) == lv)
        .distinct()
    )
    names = set(names_result.scalars().all())

    existing = list(
        (
            await db.execute(
                select(CompetitionParticipant).where(CompetitionParticipant.level == lv)
            )
        )
        .scalars()
        .all()
    )

    result: list[CompetitionParticipant] = []
    have: set[str] = set()
    for p in existing:
        if p.name in names:
            result.append(p)
            have.add(p.name)
        else:
            await db.delete(p)

    for name in sorted(names - have):
        p = CompetitionParticipant(name=name, level=lv, status="active")
        db.add(p)
        result.append(p)

    await db.flush()
    return result


async def _stages(db: AsyncSession, lv: str) -> dict[int, CompetitionStage]:
    rows = (
        (await db.execute(select(CompetitionStage).where(CompetitionStage.level == lv)))
        .scalars()
        .all()
    )
    return {s.stage_number: s for s in rows}


def _is_closed(stages: dict[int, CompetitionStage], stage: int) -> bool:
    s = stages.get(stage)
    return bool(s and s.closed_at)


def _state(stages: dict[int, CompetitionStage], stage: int) -> str:
    if _is_closed(stages, stage):
        return "closed"
    if stage == 1 or _is_closed(stages, stage - 1):
        return "open"
    return "locked"


# ─── Core computation ─────────────────────────────────────────────────

async def _compute(db: AsyncSession, lv: str, stage: int) -> _Computation:
    participants = await ensure_participants(db, lv)
    stages = await _stages(db, lv)
    state = _state(stages, stage)
    events = stage_events(lv, stage)

    if state == "locked":
        # Still compute rows so the standings are visible — locking only
        # prevents closing this stage until the previous one is closed.
        pass

    # Athletes who were still in the competition when this stage started.
    in_stage = [
        p
        for p in participants
        if p.eliminated_after_stage is None or p.eliminated_after_stage >= stage
    ]
    names = {p.name for p in in_stage}

    athlete_rows = (
        (
            await db.execute(
                select(CompetitionAthlete).where(func.lower(CompetitionAthlete.level) == lv)
            )
        )
        .scalars()
        .all()
    )
    by_event: dict[int, dict[str, CompetitionAthlete]] = {}
    for a in athlete_rows:
        by_event.setdefault(a.event, {})[a.name] = a

    rows = [_Row(participant=p) for p in in_stage]

    for ev in events:
        src = by_event.get(row_event_for(ev), {})
        ranks = rank_event({n: r for n, r in src.items() if n in names}, ev)
        for row in rows:
            rank = ranks.get(row.name)
            athlete = src.get(row.name)
            raw = display_result(athlete, ev) if athlete is not None and rank is not None else None
            row.cells[ev] = (rank, raw)
            if rank is not None:
                row.total += rank
                row.completed += 1
                if rank == 1:
                    row.firsts += 1

    # Build the full sort key: completed count (more = better),
    # stage total (lower = better), first-places (more = better),
    # then each event's rank in reverse order so the last event
    # breaks ties first (lower rank = better), then name.
    def _full_key(r: _Row) -> tuple:
        return (
            -r.completed,
            r.total,
            -r.firsts,
            *[r.cells.get(ev, (999999, None))[0] or 999999 for ev in reversed(events)],
            r.name.lower(),
        )

    rows.sort(key=_full_key)
    prev: tuple | None = None
    pos = 0
    for i, row in enumerate(rows, start=1):
        key = _full_key(row)
        if key != prev:
            pos = i
            prev = key
        row.position = pos

    return _Computation(state, events, rows, stages.get(stage))


def _tie_at_cut(rows: list[_Row], n: int) -> TieInfo | None:
    """Athletes tied across the cut line (position n and n+1 equal)."""
    if not 0 < n < len(rows):
        return None
    k = rows[n - 1].key
    if rows[n].key != k:
        return None
    group = [r for r in rows if r.key == k]
    better = sum(1 for r in rows if r.key < k)
    return TieInfo(names=[r.name for r in group], slots=n - better)


# ─── Public API ───────────────────────────────────────────────────────

async def get_standings(
    db: AsyncSession,
    level: str,
    stage: int | None = None,
    preview_advance: int | None = None,
) -> StandingsResponse:
    lv = normalize_level(level)
    stages = await _stages(db, lv)

    if stage is None:
        stage = next(
            (s for s in range(1, TOTAL_STAGES + 1) if not _is_closed(stages, s)),
            TOTAL_STAGES,
        )

    summaries = [
        StageSummary(
            stage=s,
            state=_state(stages, s),
            advance_count=stages[s].advance_count if _is_closed(stages, s) else None,
            events=stage_events(lv, s),
        )
        for s in range(1, TOTAL_STAGES + 1)
    ]

    comp = await _compute(db, lv, stage)

    advance_count: int | None = None
    if comp.state == "closed" and comp.stage_row is not None:
        advance_count = comp.stage_row.advance_count
    elif comp.state == "open":
        advance_count = preview_advance

    tie = _tie_at_cut(comp.rows, advance_count) if comp.state == "open" and advance_count else None

    out_rows: list[StandingRow] = []
    # Pre-compute Stage 1 ranks (shared across all rows) when viewing stage 2+
    stage1_ranks: dict[str, int] = {}
    if stage >= 2:
        comp1 = await _compute(db, lv, 1)
        for sr in comp1.rows:
            stage1_ranks[sr.name] = sr.position

    for r in comp.rows:
        if comp.state == "closed":
            status = "eliminated" if r.participant.eliminated_after_stage == stage else "advanced"
        else:
            status = "active"

        stage1_rank: int | None = stage1_ranks.get(r.name)

        # Stage 2+ total = events total + Stage 1 rank
        adj_total = r.total
        if stage >= 2 and stage1_rank is not None:
            adj_total += stage1_rank

        out_rows.append(
            StandingRow(
                position=r.position,
                name=r.name,
                level=r.participant.level,
                stage1_rank=stage1_rank,
                events={
                    str(ev): EventCell(rank=cell[0], display=cell[1])
                    for ev, cell in r.cells.items()
                },
                total=adj_total,
                firsts=r.firsts,
                completed=r.completed,
                status=status,
            )
        )

    # For stage 2+, re-sort by the adjusted total (incl. Stage 1 rank) and reassign positions
    if stage >= 2:
        out_rows.sort(key=lambda r: (r.total, r.name.lower()))
        for i, row in enumerate(out_rows, start=1):
            row.position = i

    return StandingsResponse(
        stages=summaries,
        standing=StageStanding(
            level=lv,
            stage=stage,
            state=comp.state,
            events=comp.events,
            advance_count=advance_count,
            tie=tie,
            rows=out_rows,
        ),
    )


async def close_stage(
    db: AsyncSession,
    level: str,
    stage: int,
    advance_count: int,
    tie_winners: list[str] | None = None,
) -> None:
    """Close a stage: the top `advance_count` advance, everyone else is
    eliminated. If the cut line splits a tie, `tie_winners` must name exactly
    the athletes (from the tied group) who advance."""
    lv = normalize_level(level)
    if stage not in STAGE_EVENTS:
        raise ValueError("Invalid stage")

    comp = await _compute(db, lv, stage)
    if comp.state != "open":
        raise ValueError(
            "This stage is already closed."
            if comp.state == "closed"
            else "Close the previous stage first."
        )

    rows = comp.rows
    if not rows:
        raise ValueError("There are no athletes in this stage.")
    if not 1 <= advance_count <= len(rows):
        raise ValueError(f"Number of advancing athletes must be between 1 and {len(rows)}.")

    tie = _tie_at_cut(rows, advance_count)
    if tie:
        winners = tie_winners or []
        if len(set(winners)) != tie.slots or any(w not in tie.names for w in winners):
            raise ValueError(
                f"The cut splits a tie — choose exactly {tie.slots} of: {', '.join(tie.names)}."
            )
        k = rows[advance_count - 1].key
        advancing = {r.name for r in rows if r.key < k} | set(winners)
    else:
        advancing = {r.name for r in rows[:advance_count]}

    for r in rows:
        if r.name not in advancing:
            r.participant.status = "eliminated"
            r.participant.eliminated_after_stage = stage

    stage_row = comp.stage_row
    if stage_row is None:
        stage_row = CompetitionStage(level=lv, stage_number=stage, advance_count=advance_count)
        db.add(stage_row)
    stage_row.advance_count = advance_count
    stage_row.closed_at = datetime.now(timezone.utc)
    await db.flush()


async def reopen_stage(db: AsyncSession, level: str, stage: int) -> None:
    """Undo a cut: athletes eliminated in this stage become active again."""
    lv = normalize_level(level)
    stages = await _stages(db, lv)

    if not _is_closed(stages, stage):
        raise ValueError("This stage is not closed.")
    if _is_closed(stages, stage + 1):
        raise ValueError("Reopen the later stage first.")

    participants = await ensure_participants(db, lv)
    for p in participants:
        if p.eliminated_after_stage == stage:
            p.status = "active"
            p.eliminated_after_stage = None

    stages[stage].closed_at = None
    await db.flush()