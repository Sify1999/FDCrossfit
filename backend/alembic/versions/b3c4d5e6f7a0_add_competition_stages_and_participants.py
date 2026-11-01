"""add competition_participants and competition_stages tables

Revision ID: b3c4d5e6f7a0
Revises: a1b2c3d4e5f6
Create Date: 2026-10-31 12:00:00.000000

Stages (1: events 1-3, 2: events 4-6, 3: events 7-9) each end with a cut.
Participants hold elimination status. They are created lazily by the
standings service, so no backfill here.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b3c4d5e6f7a0"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "competition_participants",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("level", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="active", nullable=False),
        sa.Column("eliminated_after_stage", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", "level", name="uq_competition_participants_name_level"),
    )
    op.create_index(op.f("ix_competition_participants_name"), "competition_participants", ["name"], unique=False)
    op.create_index(op.f("ix_competition_participants_level"), "competition_participants", ["level"], unique=False)

    op.create_table(
        "competition_stages",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("level", sa.String(length=50), nullable=False),
        sa.Column("stage_number", sa.Integer(), nullable=False),
        sa.Column("advance_count", sa.Integer(), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("level", "stage_number", name="uq_competition_stages_level_stage"),
    )
    op.create_index(op.f("ix_competition_stages_level"), "competition_stages", ["level"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_competition_stages_level"), table_name="competition_stages")
    op.drop_table("competition_stages")
    op.drop_index(op.f("ix_competition_participants_level"), table_name="competition_participants")
    op.drop_index(op.f("ix_competition_participants_name"), table_name="competition_participants")
    op.drop_table("competition_participants")