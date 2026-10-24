"""seed pre-built competition events for all levels

Revision ID: c1d2e3f4a5b6
Revises: b1c2d3e4f5a6
Create Date: 2026-10-23 16:00:00.000000

Events are pre-built so coaches only add heats & their times.
Events 1 & 2 run back-to-back as one combined session → "Event 1&2",
followed by the regular Event 3 through Event 9 (8 event entries per level).

Event numbers used: 1, 3, 4, 5, 6, 7, 8, 9 (2 is skipped because it is
part of the combined "Event 1&2" session).

Idempotent: the app may have already auto-seeded these rows via
ensure_default_events() before this migration ran, so only the
(level, event_number) pairs that don't exist yet are inserted.
"""
from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, None] = "b1c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_EVENTS = [
    (1, "Event 1&2"),
    (3, "Event 3"),
    (4, "Event 4"),
    (5, "Event 5"),
    (6, "Event 6"),
    (7, "Event 7"),
    (8, "Event 8"),
    (9, "Event 9"),
]
LEVELS = ["beginner", "intermediate", "advanced"]


def upgrade() -> None:
    conn = op.get_bind()

    # Collect the (level, event_number) pairs that already exist so the seed is
    # idempotent — the app may have auto-seeded them before this migration ran.
    existing: set[tuple[str, int]] = set()
    result = conn.execute(
        sa.text("SELECT level, event_number FROM competition_events")
    )
    for row in result:
        existing.add((str(row[0]), int(row[1])))

    events = sa.table(
        "competition_events",
        sa.column("level", sa.String),
        sa.column("event_number", sa.Integer),
        sa.column("name", sa.String),
        sa.column("day", sa.Integer),
        sa.column("date", sa.String),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    now = datetime.now(timezone.utc)
    rows = []
    for level in LEVELS:
        for idx, (num, name) in enumerate(DEFAULT_EVENTS):
            if (level, num) in existing:
                continue
            # Two events share a day → 4 days total (day 1..4).
            rows.append(
                {
                    "level": level,
                    "event_number": num,
                    "name": name,
                    "day": idx // 2 + 1,
                    "date": None,
                    "created_at": now,
                    "updated_at": now,
                }
            )
    if rows:
        op.bulk_insert(events, rows)


def downgrade() -> None:
    conn = op.get_bind()
    for level in LEVELS:
        conn.execute(
            sa.text(
                "DELETE FROM competition_events WHERE level = :level"
            ).bindparams(level=level)
        )