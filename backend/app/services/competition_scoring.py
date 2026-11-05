"""Per-event scoring rules.

Every event has a sort-key function: it takes an athlete's row and returns a
tuple where SMALLER = BETTER, or None if the athlete has no result yet.
Equal keys share the same rank (1, 2, 2, 4).

Event numbers 1 and 2 both live on the combined "Event 1&2" row (event == 1):
Event 1 uses reps / time_seconds, Event 2 uses reps_2 / time_seconds_2.

EVERY STAGE RE-RANKS ITS EVENTS among the athletes who reached it:
    stage 1 = everyone, events 1-3
    stage 2 = the top 20 of stage 1, events 1-6
    stage 3 = the top 10 of stage 2, events 1-9 (1-8 for beginner/intermediate)
Nothing is stored — ranks are always derived from the raw results.

Events 4, 8 and 9 share one rule ("time or DNF"):
    - Finishers (a time was saved): lower time wins, equal time -> lower
      tie-breaker time wins.
    - Non-finishers (no time, `reps` saved): more wins, equal -> lower
      tie-breaker time wins. `reps` holds the TOTAL METERS for Event 8 of the
      advanced level and the REPS everywhere else.
    - Every finisher ranks above every non-finisher.

Event 7 is entered by hand: the coach types a rank into `score`. Like every
other event it is re-ranked among the athletes of the stage (typed 1, 4, 5 for
the three who advanced become 1, 2, 3; equal typed numbers share a rank).

To change how an event is scored, edit RULES at the bottom — nothing else.
"""

from __future__ import annotations

from collections.abc import Callable

from app.models.competition_athlete import CompetitionAthlete

INF = float("inf")

TOTAL_STAGES = 3
STAGE_EVENTS: dict[int, list[int]] = {
    1: [1, 2, 3],
    2: [1, 2, 3, 4, 5, 6],
    3: [1, 2, 3, 4, 5, 6, 7, 8, 9],
}
# Stage 1 / 2: a tie on the stage total is broken by the rank in this event
# (lower is better). Stage 3 uses "more 1st places, then the final event".
STAGE_TIEBREAK_EVENT: dict[int, int] = {1: 3, 2: 4}
LEVEL_MAX_EVENT: dict[str, int] = {"beginner": 8, "intermediate": 8, "advanced": 9}
EVENT3_TIME_CAP = 540  # seconds (9 min)

Key = tuple | None
KeyFn = Callable[[CompetitionAthlete], Key]


def normalize_level(level: str) -> str:
    return level.strip().lower()


def is_valid_level(level: str) -> bool:
    return normalize_level(level) in LEVEL_MAX_EVENT


def is_advanced(r: CompetitionAthlete) -> bool:
    return normalize_level(r.level) == "advanced"


def stage_events(level: str, stage: int) -> list[int]:
    max_event = LEVEL_MAX_EVENT.get(normalize_level(level), 9)
    return [e for e in STAGE_EVENTS[stage] if e <= max_event]


def row_event_for(event_no: int) -> int:
    """Event 2 is stored on the combined Event 1&2 row."""
    return 1 if event_no == 2 else event_no


def event3_finished(r: CompetitionAthlete) -> bool:
    """Event 3: True only if the athlete finished BEFORE the 9:00 cap.

    Hitting the cap (stored as 09:00, whatever the hundredths) or having no
    time at all is NOT a finish — those athletes are ranked by meters.
    """
    t = r.time_seconds
    return t is not None and t < EVENT3_TIME_CAP


def event4_finished(r: CompetitionAthlete) -> bool:
    """Events 4, 8 and 9: finished = a completion time was saved.

    A did-not-finish is saved with NO time and the reps / meters completed, so
    there is no cap to compare against (penalties can legitimately push a
    finisher's time past the cap).
    """
    return r.time_seconds is not None


# ─── Rules ────────────────────────────────────────────────────────────

def _ev12(part: int) -> KeyFn:
    """Events 1 & 2: reps (higher better), tiebreaker time + hundredths (lower better)."""
    sfx = "" if part == 1 else "_2"

    def key(r: CompetitionAthlete) -> Key:
        reps = getattr(r, f"reps{sfx}")
        if reps is None:
            return None
        t = getattr(r, f"time_seconds{sfx}")
        if t is None:
            return (-reps, INF)
        th = getattr(r, f"time_hundredths{sfx}") or 0
        return (-reps, t + th / 100.0)

    return key


def _ev3(r: CompetitionAthlete) -> Key:
    """Event 3:
    - Finishers (time under the 9:00 cap): lower time wins; equal time →
      lower tie-breaker time wins.
    - Non-finishers: more meters wins; equal meters → lower tie-breaker time wins.
    - Every finisher ranks above every non-finisher.
    """
    tb = r.tiebreaker_value if r.tiebreaker_value is not None else INF

    if event3_finished(r):
        th = r.time_hundredths or 0
        return (0, (r.time_seconds or 0) + th / 100.0, tb)

    if r.time_seconds is None and r.reps is None:
        return None  # nothing entered yet

    return (1, 0, -(r.reps or 0), tb)


def _time_or_dnf(r: CompetitionAthlete) -> Key:
    """Events 4, 8 and 9 (see the module docstring)."""
    tb = r.tiebreaker_value if r.tiebreaker_value is not None else INF

    if event4_finished(r):
        th = r.time_hundredths or 0
        return (0, (r.time_seconds or 0) + th / 100.0, tb)

    if r.reps is None:
        return None  # nothing entered yet

    return (1, 0, -r.reps, tb)


def _ev5(r: CompetitionAthlete) -> Key:
    """Event 5: reps (more better), tiebreaker = r2 time (lower better)."""
    if r.reps is None:
        return None
    tb = r.tiebreaker_value if r.tiebreaker_value is not None else INF
    return (-r.reps, tb)


def _ev6(r: CompetitionAthlete) -> Key:
    """Event 6: reps (more better), tiebreaker = r1 time (lower better)."""
    if r.reps is None:
        return None
    tb = r.tiebreaker_value if r.tiebreaker_value is not None else INF
    return (-r.reps, tb)


def _ev7(r: CompetitionAthlete) -> Key:
    """Event 7: MANUAL — the coach types a rank into `score` (lower = better).
    It is re-ranked among the athletes of the stage like any other event, so
    typed 1, 4, 5 become 1, 2, 3 for the three athletes who advanced."""
    return None if r.score is None else (r.score,)


def _auto(r: CompetitionAthlete) -> Key:
    """Placeholder for events without a dedicated rule: detects what the
    coach entered — time (lower better), weight (higher), or reps (higher) —
    with tiebreaker_value (lower better) as tiebreaker."""
    tb = r.tiebreaker_value if r.tiebreaker_value is not None else INF
    if r.time_seconds is not None:
        return (0, r.time_seconds, tb)
    if r.weight is not None:
        return (1, -r.weight, tb)
    if r.reps is not None:
        return (2, -r.reps, tb)
    return None


RULES: dict[int, KeyFn] = {
    1: _ev12(1),
    2: _ev12(2),
    3: _ev3,
    4: _time_or_dnf,
    5: _ev5,
    6: _ev6,
    7: _ev7,
    8: _time_or_dnf,   # advanced: meters on a DNF · beginner/intermediate: reps
    9: _time_or_dnf,   # advanced only: reps on a DNF
}


def event_key(r: CompetitionAthlete, event_no: int) -> Key:
    return RULES.get(event_no, _auto)(r)


# ─── Ranking ──────────────────────────────────────────────────────────

def rank_event(rows_by_name: dict[str, CompetitionAthlete], event_no: int) -> dict[str, int]:
    """name -> rank (standard competition ranking: 1, 2, 2, 4) among ONLY the
    athletes passed in. Athletes with no result for this event are left out.

    Callers pass just the athletes of the stage, which is what re-scales the
    ranks in stages 2 and 3."""
    scored: list[tuple[tuple, str]] = []
    for name, row in rows_by_name.items():
        key = event_key(row, event_no)
        if key is not None:
            scored.append((key, name))
    scored.sort(key=lambda x: (x[0], x[1].lower()))

    ranks: dict[str, int] = {}
    prev: tuple | None = None
    rank = 0
    for i, (key, name) in enumerate(scored, start=1):
        if key != prev:
            rank = i
            prev = key
        ranks[name] = rank
    return ranks


# ─── Display ──────────────────────────────────────────────────────────

def fmt_time(total: int, hundredths: int | None = None) -> str:
    if hundredths is not None:
        return f"{total // 60:02d}:{total % 60:02d}.{hundredths:02d}"
    return f"{total // 60:02d}:{total % 60:02d}"


def display_result(r: CompetitionAthlete, event_no: int) -> str | None:
    """Short raw result shown under the rank, e.g. "42 reps", "05:30"."""
    if event_no in (1, 2):
        reps = r.reps if event_no == 1 else r.reps_2
        return f"{reps} reps" if reps is not None else None
    if event_no == 3:
        if event3_finished(r):
            return fmt_time(r.time_seconds or 0, r.time_hundredths)
        return f"{r.reps} m" if r.reps is not None else None
    # Events 4, 8 and 9: a DNF shows meters (event 8, advanced) or reps.
    if event_no in (4, 8, 9) and r.time_seconds is None and r.reps is not None:
        unit = "m" if (event_no == 8 and is_advanced(r)) else "reps"
        return f"{r.reps} {unit}"
    # Everything else (incl. Event 7): time if finished, otherwise weight / reps.
    if r.time_seconds is not None:
        return fmt_time(r.time_seconds, r.time_hundredths)
    if r.weight is not None:
        return f"{r.weight} kg"
    if r.reps is not None:
        return f"{r.reps} reps"
    return None