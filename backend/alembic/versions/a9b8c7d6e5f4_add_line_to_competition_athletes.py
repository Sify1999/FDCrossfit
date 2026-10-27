"""add line column to competition_athletes

Revision ID: a9b8c7d6e5f4
Revises: a7b8c9d0e1f2
Create Date: 2026-10-27 10:00:00.000000

Each competition entry can now optionally hold a line (lane) number for the
event — entered per event alongside the heat when registering an athlete.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a9b8c7d6e5f4"
down_revision: Union[str, None] = "a7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("competition_athletes", sa.Column("line", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("competition_athletes", "line")
