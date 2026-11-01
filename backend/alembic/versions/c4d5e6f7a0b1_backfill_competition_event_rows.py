"""backfill missing event rows for already-registered competition athletes

Revision ID: c4d5e6f7a0b1
Revises: b3c4d5e6f7a0
Create Date: 2026-10-31 13:00:00.000000

Athletes used to be registered only for the events picked in the modal. Now
every athlete has a row for every event of their level, so scores, heats and
lines can be entered for any event.

SAFE: INSERT only. Existing rows (scores, heats, lines, tiebreakers) are not
touched, and the athlete's original `level` spelling is copied to new rows.
Running it twice inserts nothing the second time.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c4d5e6f7a0b1"
down_revision: Union[str, None] = "b3c4d5e6f7a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Row events (2 lives on the combined "Event 1&2" row, event number 1)
ROW_EVENTS = [1, 3, 4, 5, 6, 7, 8, 9]
LEVEL_MAX_EVENT = {"beginner": 8, "intermediate": 8, "advanced": 9}


def upgrade() -> None:
    conn = op.get_bind()

    rows = conn.execute(
        sa.text("SELECT name, level, event FROM competition_athletes")
    ).fetchall()

    athletes: dict[tuple[str, str], tuple[str, set[int]]] = {}
    for name, level, event in rows:
        key = (name, str(level).strip().lower())
        _, have = athletes.setdefault(key, (level, set()))
        have.add(int(event))

    to_insert = []
    for (name, lvl), (level_str, have) in athletes.items():
        max_event = LEVEL_MAX_EVENT.get(lvl)
        if max_event is None:
            continue  # unknown level — leave it alone
        for ev in ROW_EVENTS:
            if ev <= max_event and ev not in have:
                to_insert.append({"name": name, "level": level_str, "event": ev})

    if to_insert:
        table = sa.table(
            "competition_athletes",
            sa.column("name", sa.String),
            sa.column("level", sa.String),
            sa.column("event", sa.Integer),
        )
        # created_at / updated_at come from their server defaults
        op.bulk_insert(table, to_insert)


def downgrade() -> None:
    # Backfilled rows are indistinguishable from real ones, so nothing is
    # removed on downgrade (deleting could destroy entered scores).
    pass