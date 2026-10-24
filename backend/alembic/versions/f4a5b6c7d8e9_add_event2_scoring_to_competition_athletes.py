"""add Event 2 scoring columns to competition_athletes

Revision ID: f4a5b6c7d8e9
Revises: e3f4a5b6c7d8
Create Date: 2026-10-23 22:00:00.000000

The combined "Event 1&2" entry keeps Event 1's data in score/reps/weight and
stores Event 2's data in the new score_2/reps_2/weight_2 columns, so the
scoreboard can show and rank Event 1 and Event 2 separately.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f4a5b6c7d8e9"
down_revision: Union[str, None] = "e3f4a5b6c7d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("competition_athletes", sa.Column("score_2", sa.Integer(), nullable=True))
    op.add_column("competition_athletes", sa.Column("reps_2", sa.Integer(), nullable=True))
    op.add_column("competition_athletes", sa.Column("weight_2", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("competition_athletes", "weight_2")
    op.drop_column("competition_athletes", "reps_2")
    op.drop_column("competition_athletes", "score_2")