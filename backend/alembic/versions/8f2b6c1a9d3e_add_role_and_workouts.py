"""add user role and workouts table

Revision ID: 8f2b6c1a9d3e
Revises: d998f481c6a1
Create Date: 2026-08-16 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '8f2b6c1a9d3e'
down_revision: Union[str, None] = 'd998f481c6a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=20), nullable=False, server_default="member"),
    )

    op.create_table(
        "workouts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("coach_name", sa.String(length=255), nullable=True),
        sa.Column(
            "sections", postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]", nullable=False,
        ),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_workouts_date"), "workouts", ["date"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_workouts_date"), table_name="workouts")
    op.drop_table("workouts")
    op.drop_column("users", "role")