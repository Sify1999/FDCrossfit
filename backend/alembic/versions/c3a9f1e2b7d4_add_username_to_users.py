"""add username to users

Revision ID: c3a9f1e2b7d4
Revises: 8f2b6c1a9d3e
Create Date: 2026-08-16 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c3a9f1e2b7d4'
down_revision: Union[str, None] = '8f2b6c1a9d3e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add nullable first so existing rows in dev don't break the migration.
    op.add_column('users', sa.Column('username', sa.String(length=50), nullable=True))

    # Backfill any existing accounts with a unique placeholder so we can
    # safely enforce NOT NULL + UNIQUE right after. Anyone with a
    # placeholder should just set a real username manually afterward
    # (UPDATE users SET username = '...' WHERE id = ...).
    op.execute("UPDATE users SET username = 'user_' || id::text WHERE username IS NULL")

    op.alter_column('users', 'username', nullable=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_column('users', 'username') 