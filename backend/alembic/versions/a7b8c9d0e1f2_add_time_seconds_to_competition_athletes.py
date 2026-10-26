"""add time_seconds columns to competition_athletes

Revision ID: a7b8c9d0e1f2
Revises: a5b6c7d8e9f1
Create Date: 2026-10-25 14:00:00.000000

The time_seconds column stores the raw performance time (total seconds)
for time-based events, keeping it independent from the leaderboard `score`
field which holds the athlete's points.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, None] = "a5b6c7d8e9f1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("competition_athletes", sa.Column("time_seconds", sa.Integer(), nullable=True))
    op.add_column("competition_athletes", sa.Column("time_seconds_2", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("competition_athletes", "time_seconds_2")
    op.drop_column("competition_athletes", "time_seconds")
