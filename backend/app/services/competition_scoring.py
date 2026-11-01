"""Per-event scoring rules.

Every event has a sort-key function: it takes an athlete's row and returns a
tuple where SMALLER = BETTER, or None if the athlete has no result yet.
Equal keys share the same rank (1, 2, 2, 4).

Event numbers 1 and 2 both live on the combined "Event 1&2" row (event == 1):
Event 1 uses reps / time_seconds, Event 2 uses reps_2 / time_seconds_2.

To change how an event is scored, edit RULES at the bottom — nothing else.
"""

from __future__ import annotations

from collections.abc import Callable

from app.models.competition_athlete import CompetitionAthlete

INF = float("inf")

TOTAL_STAGES = 3
STAGE_EVENTS: dict[int, list[int]] = {1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9]}
LEVEL_MAX_EVENT: dict[str, int] = {"beginner": 8, "intermediate": 8, "advanced": 9}
EVENT3_TIME_CAP = 540  # seconds (9 min)

Key = tuple | None
KeyFn = Callable[[CompetitionAthlete], Key]


def normalize_level(level: str) -> str:
    return level.strip().lower()


def is_valid_level(level: str) -> bool:
    return normalize_level(level) in LEVEL_MAX_EVENT


def stage_events(level: str, stage: int) -> list[int]:
    max_event = LEVEL_MAX_EVENT.get(normalize_level(level), 9)
    return [e for e in STAGE_EVENTS[stage] if e <= max_event]


def row_event_for(event_no: int) -> int:
    """Event 2 is stored on the combined Event 1&2 row."""
    return 1 if event_no == 2 else event_no


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
    """Event 3: finishers by time+hundredths (lower better), then non-finishers by
    meters/reps (higher better). Equal times tie-break by higher reps."""
    t, reps = r.time_seconds, r.reps
    if t is not None and t <= EVENT3_TIME_CAP:
        th = r.time_hundredths or 0
        if t < EVENT3_TIME_CAP or (t == EVENT3_TIME_CAP and th == 0):
            # finished — rank by total time ASC, then reps DESC
            return (0, t + th / 100.0, -(reps or 0))
    if t is None and reps is None:
        return None
    return (1, 0, -(reps or 0))


def _ev4(r: CompetitionAthlete) -> Key:
    """Event 4: time (lower better), tiebreaker = round 1 time (lower better)."""
    if r.time_seconds is None:
        return None
    tb = r.tiebreaker_value if r.tiebreaker_value is not None else INF
    return (r.time_seconds, tb)


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


def _auto(r: CompetitionAthlete) -> Key:
    """Placeholder for events without a dedicated rule yet: detects what the
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
    4: _ev4,
    5: _ev5,
    6: _ev6,
    # 7-9 → _auto until their real rules are defined
}


def event_key(r: CompetitionAthlete, event_no: int) -> Key:
    return RULES.get(event_no, _auto)(r)


# ─── Ranking ──────────────────────────────────────────────────────────

def rank_event(rows_by_name: dict[str, CompetitionAthlete], event_no: int) -> dict[str, int]:
    """name -> rank (standard competition ranking). Athletes with no result
    for this event are left out."""
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
        if r.time_seconds is not None and r.time_seconds <= EVENT3_TIME_CAP:
            return fmt_time(r.time_seconds, r.time_hundredths)
        return f"{r.reps} m" if r.reps is not None else None
    if r.time_seconds is not None:
        return fmt_time(r.time_seconds, r.time_hundredths)
    if r.weight is not None:
        return f"{r.weight} kg"
    if r.reps is not None:
        return f"{r.reps} reps"
    return None