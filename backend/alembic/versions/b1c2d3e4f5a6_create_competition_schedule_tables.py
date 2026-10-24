"""create competition schedule tables (events + heats) and link athletes to heats

Revision ID: b1c2d3e4f5a6
Revises: a3b4c5d6e7f8
Create Date: 2026-10-23 14:00:00.000000

Events and heats (with their start/end times) are now stored dynamically.
Athletes link to a heat record via competition_athletes.heat_id, which lets
us show each athlete in their scheduled heat/time.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, None] = "a3b4c5d6e7f8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "competition_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("level", sa.String(length=20), nullable=False),
        sa.Column("event_number", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("day", sa.Integer(), nullable=True),
        sa.Column("date", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("level", "event_number", name="uq_competition_events_level_number"),
    )
    op.create_index(op.f("ix_competition_events_level"), "competition_events", ["level"], unique=False)

    op.create_table(
        "competition_heats",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("heat_number", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.String(length=5), nullable=False),
        sa.Column("end_time", sa.String(length=5), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["competition_events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "heat_number", name="uq_competition_heats_event_number"),
    )
    op.create_index(op.f("ix_competition_heats_event_id"), "competition_heats", ["event_id"], unique=False)

    op.add_column("competition_athletes", sa.Column("heat_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_competition_athletes_heat_id",
        "competition_athletes",
        "competition_heats",
        ["heat_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_competition_athletes_heat_id"), "competition_athletes", ["heat_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_competition_athletes_heat_id"), table_name="competition_athletes")
    op.drop_constraint("fk_competition_athletes_heat_id", "competition_athletes", type_="foreignkey")
    op.drop_column("competition_athletes", "heat_id")
    op.drop_index(op.f("ix_competition_heats_event_id"), table_name="competition_heats")
    op.drop_table("competition_heats")
    op.drop_index(op.f("ix_competition_events_level"), table_name="competition_events")
    op.drop_table("competition_events")