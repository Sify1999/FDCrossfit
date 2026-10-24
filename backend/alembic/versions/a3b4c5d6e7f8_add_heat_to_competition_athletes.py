"""add heat column to competition_athletes

Revision ID: a3b4c5d6e7f8
Revises: a2b3c4d5e6f7
Create Date: 2026-10-23 12:00:00.000000

Each competition entry can now optionally belong to a heat (heat number),
so an athlete may compete in different heats per event.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a3b4c5d6e7f8"
down_revision: Union[str, None] = "a2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("competition_athletes", sa.Column("heat", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("competition_athletes", "heat")