"""rename time_ms → time_hundredths in competition_athletes

Revision ID: a1b2c3d4e5f6
Revises: a0b1c2d3e4f5
Create Date: 2026-10-29 10:00:00.000000

Renames the columns to reflect they store hundredths of a second (0–99).
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "a0b1c2d3e4f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("competition_athletes", "time_ms", new_column_name="time_hundredths")
    op.alter_column("competition_athletes", "time_ms_2", new_column_name="time_hundredths_2")


def downgrade() -> None:
    op.alter_column("competition_athletes", "time_hundredths", new_column_name="time_ms")
    op.alter_column("competition_athletes", "time_hundredths_2", new_column_name="time_ms_2")