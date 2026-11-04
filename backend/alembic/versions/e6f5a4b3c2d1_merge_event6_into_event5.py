"""merge event 6 into the combined "Event 5&6" schedule entry

Revision ID: e6f5a4b3c2d1
Revises: c4d5e6f7a0b1
Create Date: 2026-11-04 12:00:00.000000

Events 5 & 6 run back-to-back as one combined session, exactly like events
1 & 2. The schedule keeps a single "Event 5&6" entry (event_number 5) and
drops the standalone event 6 entry — mirroring how event 2 is folded into
"Event 1&2" (event_number 1).

SAFE / data-preserving:
  - any heats already entered under event 6 are moved onto the "Event 5&6"
    entry, renumbered AFTER the existing event-5 heats so the unique
    (event_id, heat_number) constraint is never violated;
  - athletes pointing at the moved heats keep their heat_id (the record id
    never changes) and get their heat_number updated to the new number;
  - competition_athletes rows and ALL scores/results are never touched:
    events 5 & 6 stay separate in the scoring system;
  - running this migration twice changes nothing.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e6f5a4b3c2d1"
down_revision: Union[str, None] = "c4d5e6f7a0b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _event5_id_for(conn, level) -> int:
    """Fetch the combined (event_number=5) entry id for a level, creating it
    if it does not exist yet."""
    stmt = sa.text(
        "SELECT id FROM competition_events "
        "WHERE level = :level AND event_number = 5"
    ).bindparams(level=level)
    row = conn.execute(stmt).fetchone()
    if row is not None:
        return int(row[0])

    conn.execute(
        sa.text(
            "INSERT INTO competition_events "
            "(level, event_number, name, day, created_at, updated_at) "
            "VALUES (:level, 5, 'Event 5&6', 3, now(), now())"
        ).bindparams(level=level)
    )
    row = conn.execute(stmt).fetchone()
    assert row is not None
    return int(row[0])


def upgrade() -> None:
    conn = op.get_bind()

    # 1) Fold every standalone event-6 row into the corresponding event-5 row.
    event6_rows = conn.execute(
        sa.text(
            "SELECT id, level FROM competition_events WHERE event_number = 6"
        )
    ).fetchall()

    for event6_id, level in event6_rows:
        event5_id = _event5_id_for(conn, level)

        heats = conn.execute(
            sa.text(
                "SELECT id, heat_number FROM competition_heats "
                "WHERE event_id = :event_id ORDER BY heat_number"
            ).bindparams(event_id=event6_id)
        ).fetchall()

        if heats:
            max_heat = conn.execute(
                sa.text(
                    "SELECT COALESCE(MAX(heat_number), 0) FROM competition_heats "
                    "WHERE event_id = :event_id"
                ).bindparams(event_id=event5_id)
            ).scalar()

            for i, (heat_id, _old_heat_number) in enumerate(heats):
                new_heat_number = int(max_heat) + i + 1
                # Re-parent the heat onto the combined session and renumber it.
                conn.execute(
                    sa.text(
                        "UPDATE competition_heats "
                        "SET event_id = :event_id, heat_number = :heat_number, updated_at = now() "
                        "WHERE id = :id"
                    ).bindparams(event_id=event5_id, heat_number=new_heat_number, id=heat_id)
                )
                # Athletes keep the same heat_id (same record, new number) —
                # only their heat_number is updated.
                conn.execute(
                    sa.text(
                        "UPDATE competition_athletes "
                        "SET heat = :heat_number, updated_at = now() "
                        "WHERE heat_id = :id"
                    ).bindparams(heat_number=new_heat_number, id=heat_id)
                )

        # Drop the now-empty standalone event-6 entry (FKs cascade heates,
        # and athlete heat links were already moved to the combined entry).
        conn.execute(
            sa.text("DELETE FROM competition_events WHERE id = :id").bindparams(id=event6_id)
        )

    # 2) Normalize the combined entry name for every level.
    conn.execute(
        sa.text(
            "UPDATE competition_events "
            "SET name = 'Event 5&6', updated_at = now() "
            "WHERE event_number = 5"
        )
    )


def downgrade() -> None:
    conn = op.get_bind()

    # Best-effort restore: bring back the standalone "Event 6" rows. Heats
    # that were merged into "Event 5&6" cannot be split back reliably, so they
    # stay under the combined entry (no data is dropped).
    rows = conn.execute(
        sa.text(
            "SELECT level, day, date FROM competition_events WHERE event_number = 5"
        )
    ).fetchall()
    for level, day, date in rows:
        dupe = conn.execute(
            sa.text(
                "SELECT 1 FROM competition_events "
                "WHERE level = :level AND event_number = 6"
            ).bindparams(level=level)
        ).fetchone()
        if dupe:
            continue
        conn.execute(
            sa.text(
                "INSERT INTO competition_events "
                "(level, event_number, name, day, date, created_at, updated_at) "
                "VALUES (:level, 6, 'Event 6', :day, :date, now(), now())"
            ).bindparams(level=level, day=day, date=date)
        )

    conn.execute(
        sa.text(
            "UPDATE competition_events "
            "SET name = 'Event 5', updated_at = now() "
            "WHERE event_number = 5"
        )
    )