"""backfill event-6 heat/line from the combined Event 5&6 session

Revision ID: f7a6b5c4d3e2
Revises: e6f5a4b3c2d1
Create Date: 2026-11-04 13:30:00.000000

Events 5 & 6 are one combined schedule session ("Event 5&6"). The heat and
line are stored on the Event 5 scoring row and mirrored onto the Event 6
scoring row so the score-entry modal shows both.

This migration copies each athlete's Event 5 heat/line onto their Event 6
row for athletes that were registered before the propagation existed.
Athletes are matched by exact name and case-insensitive level — identical
to how the service resolves rows.

SAFE / data-preserving:
  - UPDATE only touches heat + line (and updated_at) on Event 6 rows;
  - scores, reps, tiebreakers and every other column are untouched;
  - heat_id on Event 6 is NOT set (it stays NULL) — the schedule page links
    each athlete to a heat through the Event 5 row only, so nobody shows up
    twice in the schedule;
  - running it twice changes nothing.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f7a6b5c4d3e2"
down_revision: Union[str, None] = "e6f5a4b3c2d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "UPDATE competition_athletes "
            "SET heat = a5.heat, line = a5.line, updated_at = now() "
            "FROM competition_athletes a5 "
            "WHERE competition_athletes.event = 6 "
            "AND a5.event = 5 "
            "AND competition_athletes.name = a5.name "
            "AND lower(competition_athletes.level) = lower(a5.level) "
            "AND (competition_athletes.heat IS DISTINCT FROM a5.heat "
            "   OR competition_athletes.line IS DISTINCT FROM a5.line)"
        )
    )


def downgrade() -> None:
    # Not reversible: the copied values represent the same combined session and
    # are meant to stay in sync. Nothing to restore.
    pass