"""add Event 2 tiebreaker column to competition_athletes

Revision ID: a5b6c7d8e9f1
Revises: f4a5b6c7d8e9
Create Date: 2026-10-24 08:00:00.000000

Separate the combined "Event 1&2" tiebreaker (always time) into two values:
Event 1 uses tiebreaker_value and Event 2 uses tiebreaker_value_2.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a5b6c7d8e9f1"
down_revision: Union[str, None] = "f4a5b6c7d8e9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("competition_athletes", sa.Column("tiebreaker_value_2", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("competition_athletes", "tiebreaker_value_2")