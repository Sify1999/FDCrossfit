"""add time_ms column to competition_athletes

Revision ID: a0b1c2d3e4f5
Revises: a9b8c7d6e5f4
Create Date: 2026-10-28 10:00:00.000000

Adds milliseconds-precision columns for time-based events (Event 3 completion
time, Event 1&2 tiebreaker).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a0b1c2d3e4f5"
down_revision: Union[str, None] = "a9b8c7d6e5f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("competition_athletes", sa.Column("time_ms", sa.Integer(), nullable=True))
    op.add_column("competition_athletes", sa.Column("time_ms_2", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("competition_athletes", "time_ms_2")
    op.drop_column("competition_athletes", "time_ms")