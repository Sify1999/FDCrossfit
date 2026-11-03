"""Stage standings, the automatic cut line, and closing / reopening a stage.

EVERY STAGE RE-RANKS ALL OF ITS EVENTS among the athletes who reached it:

    Stage 1  everyone                      events 1-3     cut: top 20 advance
    Stage 2  the top 20 of stage 1         events 1-6     cut: top 10 advance
    Stage 3  the top 10 of stage 2         events 1-9*    (* 1-8 for beginner / intermediate)

Stage total = the sum of that stage's event ranks (as re-ranked among the
athletes in the stage). Nothing is carried over from earlier stages.

Ties on the stage total are broken by:
    stage 1: the better rank in event 3
    stage 2: the better rank in event 4
    stage 3: more 1st places IN THE STAGE 3 TABLE (ranks are re-scaled there),
             then the better rank in the final event (8, or 9 for advanced)
Athletes still equal after that share the position and — at a cut line — all
advance (nobody is cut because of the alphabetical order).

Everything is derived from the raw results on every request — nothing is
written — so entering or correcting a result updates every stage live. Levels
are always computed separately.

The manual close / reopen endpoints below still work as before and are purely
additive: athletes they eliminate stay out of later stages.

To change the cut sizes, edit STAGE_CUTS — nothing else.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competition_athlete import CompetitionAthlete
from app.models.competition_participant import CompetitionParticipant
from app.models.competition_stage import CompetitionStage
from app.schemas.competition_standings import (
    CutInfo,
    EventCell,
    StageStanding,
    StageSummary,
    StandingRow,
    StandingsResponse,
    TieInfo,
)
from app.services.competition_scoring import (
    STAGE_EVENTS,
    STAGE_TIEBREAK_EVENT,
    TOTAL_STAGES,
    display_result,
    normalize_level,
    rank_event,
    row_event_for,
    stage_events,
)

# stage -> how many athletes advance to the NEXT stage (same for every level)
STAGE_CUTS: dict[int, int] = {1: 20, 2: 10}

# Sorts "no rank" after every real rank.
NO_RANK = 999_999


# ─── Internal structures ──────────────────────────────────────────────

@dataclass
class _Row:
    participant: CompetitionParticipant
    cells: dict[int, tuple[int | None, str | None]] = field(default_factory=dict)
    total: int = 0
    firsts: int = 0
    completed: int = 0
    position: int = 0
    tie_key: tuple = ()     # equal tie_key == genuinely tied (the name is not part of it)

    @property
    def name(self) -> str:
        return self.participant.name


@dataclass
class _Computation:
    state: str  # "locked" | "open" | "closed"
    events: list[int]
    rows: list[_Row]
    stage_row: CompetitionStage | None


@dataclass
class _Data:
    """Everything one request needs, loaded once."""
    lv: str
    participants: list[CompetitionParticipant]
    stages: dict[int, CompetitionStage]
    by_event: dict[int, dict[str, CompetitionAthlete]]


@dataclass
class _Cut:
    limit: int
    active: bool        # False -> nobody is cut (yet)
    after: int          # rows above the line
    tied: list[str]
    final: bool         # every athlete in the stage has every event entered
    determined: bool    # enough results exist to trust the line (gates the next stage's cut)
    qualified: set[str]


@dataclass
class _Stage:
    comp: _Computation
    cut: _Cut | None
    entry_cut: int | None
    provisional: bool


# ─── Loading helpers ──────────────────────────────────────────────────

async def ensure_participants(db: AsyncSession, level: str) -> list[CompetitionParticipant]:
    """Sync participants with the athletes registered in this level: create
    missing ones, drop ones whose athlete was removed. Status of existing
    participants is never touched here.

    New rows are inserted with ON CONFLICT DO NOTHING, so two visitors loading
    the scoreboard at the same moment can no longer collide on the unique
    (name, level) constraint."""
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
    have = {p.name for p in existing}

    changed = False
    for p in existing:
        if p.name not in names:
            await db.delete(p)
            changed = True

    missing = sorted(names - have)
    if missing:
        await db.execute(
            pg_insert(CompetitionParticipant)
            .values([{"name": n, "level": lv, "status": "active"} for n in missing])
            .on_conflict_do_nothing(index_elements=["name", "level"])
        )
        changed = True

    if changed:
        await db.flush()
        existing = list(
            (
                await db.execute(
                    select(CompetitionParticipant).where(CompetitionParticipant.level == lv)
                )
            )
            .scalars()
            .all()
        )

    return [p for p in existing if p.name in names]


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


async def _load(db: AsyncSession, lv: str) -> _Data:
    participants = await ensure_participants(db, lv)
    stages = await _stages(db, lv)

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

    return _Data(lv=lv, participants=participants, stages=stages, by_event=by_event)


# ─── Core computation (pure — no database access) ─────────────────────

def _rank_in(r: _Row, ev: int) -> int:
    cell = r.cells.get(ev)
    return cell[0] if cell is not None and cell[0] is not None else NO_RANK


def _has_rank(r: _Row, ev: int) -> bool:
    cell = r.cells.get(ev)
    return cell is not None and cell[0] is not None


def _stage_key(stage: int, events: list[int], r: _Row) -> tuple:
    """Sort key of an athlete inside a stage — SMALLER = BETTER. Two athletes
    with an equal key are genuinely tied (same position)."""
    base = (-r.completed, r.total)

    # Stage 1 / 2: a tie on the total goes to the better rank in one event.
    tb_event = STAGE_TIEBREAK_EVENT.get(stage)
    if tb_event is not None and tb_event in events:
        return (*base, _rank_in(r, tb_event))

    # Last stage: more 1st places (in THIS stage's table), then the final event.
    final_event = max(events) if events else 0
    return (*base, -r.firsts, _rank_in(r, final_event))


def _compute(data: _Data, stage: int, only: set[str] | None = None) -> _Computation:
    """Standings of one stage. `only` limits it to the athletes who qualified
    for it (None = everyone who is still in the competition). Every event is
    ranked among exactly those athletes, which is what re-scales the ranks."""
    state = _state(data.stages, stage)
    events = stage_events(data.lv, stage)

    # Athletes still in the competition when this stage started.
    in_stage = [
        p
        for p in data.participants
        if (p.eliminated_after_stage is None or p.eliminated_after_stage >= stage)
        and (only is None or p.name in only)
    ]
    names = {p.name for p in in_stage}
    rows = [_Row(participant=p) for p in in_stage]

    for ev in events:
        src = data.by_event.get(row_event_for(ev), {})
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

    for row in rows:
        row.tie_key = _stage_key(stage, events, row)

    rows.sort(key=lambda r: (r.tie_key, r.name.lower()))
    prev: tuple | None = None
    pos = 0
    for i, row in enumerate(rows, start=1):
        if row.tie_key != prev:
            pos = i
            prev = row.tie_key
        row.position = pos

    return _Computation(state, events, rows, data.stages.get(stage))


def _make_cut(stage: int, comp: _Computation, enabled: bool, new_events: list[int]) -> _Cut | None:
    """The automatic cut line of a stage (None for the last stage).

    `new_events` are the events this stage adds on top of the previous one
    (all of them for stage 1). The line is only drawn once enough athletes
    have a result in them, so it never splits athletes alphabetically."""
    limit = STAGE_CUTS.get(stage)
    if limit is None:
        return None

    rows = comp.rows
    n = len(rows)
    everyone = {r.name for r in rows}
    final = n > 0 and all(r.completed >= len(comp.events) for r in rows)

    def inactive(determined: bool) -> _Cut:
        return _Cut(limit, False, n, [], final, determined, everyone)

    # A later cut only means something once the cut before it is trustworthy.
    if not enabled or n == 0:
        return inactive(False)

    # Need enough athletes with a result to place the line. With a small
    # level that is every athlete (nothing to cut, but the field is known).
    scored = sum(1 for r in rows if any(_has_rank(r, ev) for ev in new_events))
    if scored < min(n, limit + 1):
        return inactive(False)

    if n <= limit:
        return inactive(True)  # everyone advances

    # Athletes with exactly equal standing straddling the line all advance.
    last_in = rows[limit - 1].tie_key
    if rows[limit].tie_key == last_in:
        idx = [i for i, r in enumerate(rows) if r.tie_key == last_in]
        after = max(idx) + 1
        tied = [rows[i].name for i in idx]
    else:
        after = limit
        tied = []

    qualified = {r.name for r in rows[:after]}
    return _Cut(limit, True, after, tied, final, True, qualified)


def _build_chain(data: _Data, upto: int) -> list[_Stage]:
    """Stage 1 .. `upto`, each one limited to the athletes who got past the
    previous stage's cut line."""
    out: list[_Stage] = []
    only: set[str] | None = None
    entry_cut: int | None = None
    provisional = False
    prev_determined = True
    prev_events: set[int] = set()

    for s in range(1, upto + 1):
        comp = _compute(data, s, only)
        new_events = [e for e in comp.events if e not in prev_events]

        cut = _make_cut(s, comp, enabled=prev_determined, new_events=new_events)
        out.append(_Stage(comp=comp, cut=cut, entry_cut=entry_cut, provisional=provisional))

        prev_events = set(comp.events)
        if cut is None:
            break
        only = cut.qualified
        entry_cut = cut.limit if cut.active else None
        provisional = provisional or not cut.final
        prev_determined = cut.determined

    return out


def _tie_at_cut(rows: list[_Row], n: int) -> TieInfo | None:
    """Legacy (manual close): athletes tied across the line at position n."""
    if not 0 < n < len(rows):
        return None
    k = rows[n - 1].tie_key
    if rows[n].tie_key != k:
        return None
    group = [r for r in rows if r.tie_key == k]
    better = sum(1 for r in rows if r.tie_key < k)
    return TieInfo(names=[r.name for r in group], slots=n - better)


# ─── Public API ───────────────────────────────────────────────────────

async def get_standings(
    db: AsyncSession,
    level: str,
    stage: int | None = None,
    preview_advance: int | None = None,
) -> StandingsResponse:
    lv = normalize_level(level)
    data = await _load(db, lv)
    stages = data.stages

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
            cut_limit=STAGE_CUTS.get(s),
            events=stage_events(lv, s),
        )
        for s in range(1, TOTAL_STAGES + 1)
    ]

    chain = _build_chain(data, stage)
    cur = chain[-1]
    comp = cur.comp

    advance_count: int | None = None
    if comp.state == "closed" and comp.stage_row is not None:
        advance_count = comp.stage_row.advance_count
    elif comp.state == "open":
        advance_count = preview_advance

    tie = _tie_at_cut(comp.rows, advance_count) if comp.state == "open" and advance_count else None

    cut_info: CutInfo | None = None
    if cur.cut is not None:
        c = cur.cut
        phase = "pending" if not c.determined else ("final" if c.final else "live")
        cut_info = CutInfo(
            limit=c.limit,
            after=c.after,
            active=c.active,
            phase=phase,
            next_stage=stage + 1,
            tied=c.tied,
        )

    out_rows: list[StandingRow] = []
    for r in comp.rows:
        if comp.state == "closed":
            status = "eliminated" if r.participant.eliminated_after_stage == stage else "advanced"
        else:
            status = "active"

        out_rows.append(
            StandingRow(
                position=r.position,
                name=r.name,
                level=r.participant.level,
                events={
                    str(ev): EventCell(rank=cell[0], display=cell[1])
                    for ev, cell in r.cells.items()
                },
                total=r.total,
                firsts=r.firsts,
                completed=r.completed,
                status=status,
            )
        )

    return StandingsResponse(
        stages=summaries,
        standing=StageStanding(
            level=lv,
            stage=stage,
            state=comp.state,
            events=comp.events,
            advance_count=advance_count,
            tie=tie,
            cut=cut_info,
            entry_cut=cur.entry_cut,
            provisional=cur.provisional,
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

    data = await _load(db, lv)
    comp = _compute(data, stage, None)
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
        k = rows[advance_count - 1].tie_key
        advancing = {r.name for r in rows if r.tie_key < k} | set(winners)
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