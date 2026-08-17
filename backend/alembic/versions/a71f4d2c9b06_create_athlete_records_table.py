"""create athlete_records table

Revision ID: a71f4d2c9b06
Revises: c3a9f1e2b7d4
Create Date: 2026-08-17 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a71f4d2c9b06'
down_revision: Union[str, None] = 'c3a9f1e2b7d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "athlete_records",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "records", postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]", nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_athlete_records_user_id"), "athlete_records", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_athlete_records_user_id"), table_name="athlete_records")
    op.drop_table("athlete_records")