"""add reps and weight columns to competition_athletes

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-10-23 20:00:00.000000

Each athlete/event entry now records repetitions and weight lifted, in
addition to the existing score and (always time-based) tiebreaker.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e3f4a5b6c7d8"
down_revision: Union[str, None] = "d2e3f4a5b6c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("competition_athletes", sa.Column("reps", sa.Integer(), nullable=True))
    op.add_column("competition_athletes", sa.Column("weight", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("competition_athletes", "weight")
    op.drop_column("competition_athletes", "reps")