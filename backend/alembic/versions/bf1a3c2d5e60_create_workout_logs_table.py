"""create workout_logs table

Revision ID: bf1a3c2d5e60
Revises: 3c4d5e6f7a8b
Create Date: 2026-09-07 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "bf1a3c2d5e60"
down_revision: Union[str, None] = "3c4d5e6f7a8b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "workout_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("workout_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "log_data", postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]", nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["workout_id"], ["workouts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workout_id", "user_id", name="uq_workout_log_user"),
    )
    op.create_index(op.f("ix_workout_logs_workout_id"), "workout_logs", ["workout_id"], unique=False)
    op.create_index(op.f("ix_workout_logs_user_id"), "workout_logs", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_workout_logs_user_id"), table_name="workout_logs")
    op.drop_index(op.f("ix_workout_logs_workout_id"), table_name="workout_logs")
    op.drop_table("workout_logs")