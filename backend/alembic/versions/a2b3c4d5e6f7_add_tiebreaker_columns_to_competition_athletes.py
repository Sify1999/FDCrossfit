"""add tiebreaker columns to competition_athletes

Revision ID: a2b3c4d5e6f7
Revises: af1f122acf9a
Create Date: 2026-10-16 15:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a2b3c4d5e6f7"
down_revision: Union[str, None] = "af1f122acf9a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("competition_athletes", sa.Column("tiebreaker_type", sa.String(10), nullable=True))
    op.add_column("competition_athletes", sa.Column("tiebreaker_value", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("competition_athletes", "tiebreaker_value")
    op.drop_column("competition_athletes", "tiebreaker_type")