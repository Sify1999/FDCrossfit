"""fix competition event data (normalize names, drop legacy event 2)

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-10-23 18:00:00.000000

Events are pre-built: "Event 1&2", "Event 3" … "Event 9" using event
numbers 1, 3, 4, 5, 6, 7, 8, 9 (2 is merged into "Event 1&2").

Databases created before this design may carry legacy rows, e.g. a
wrongly-named "Event 1 2" or a standalone `event_number = 2` labelled
"Event 3". This migration repairs that data:
  - deletes any event whose event_number is not part of the pre-built set,
  - normalizes the names of the pre-built events.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d2e3f4a5b6c7"
down_revision: Union[str, None] = "c1d2e3f4a5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PREBUILT = {
    1: "Event 1&2",
    3: "Event 3",
    4: "Event 4",
    5: "Event 5",
    6: "Event 6",
    7: "Event 7",
    8: "Event 8",
    9: "Event 9",
}


def upgrade() -> None:
    conn = op.get_bind()

    # Materialize first so we can run DELETE/UPDATE while iterating.
    result = conn.execute(
        sa.text("SELECT id, event_number FROM competition_events")
    )
    rows = [(int(r[0]), int(r[1])) for r in result]

    for event_id, event_number in rows:
        if event_number not in PREBUILT:
            # Legacy event (e.g. an old standalone event 2) — its heats are
            # cascade-deleted and athlete heat links are set NULL by the FKs.
            conn.execute(
                sa.text("DELETE FROM competition_events WHERE id = :id").bindparams(id=event_id)
            )
        else:
            # Normalize the display name of a pre-built event.
            conn.execute(
                sa.text(
                    "UPDATE competition_events SET name = :name, updated_at = now() WHERE id = :id"
                ).bindparams(name=PREBUILT[event_number], id=event_id)
            )


def downgrade() -> None:
    # Data repair only — nothing to restore.
    pass