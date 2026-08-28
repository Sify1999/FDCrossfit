"""
Alembic env.py — wired to pydantic-settings so migrations use the same .env as the app.

No hardcoded URLs. Everything flows from `app.core.config.get_settings().database_url_sync`.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import get_settings

# Alembic Config object
config = context.config

# Set the SQLAlchemy URL from pydantic-settings (sync URL for Alembic)
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url_sync)

# Set up Python logging from the alembic.ini section
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import all models so Alembic's autogenerate can detect them
from app.db.base import Base  # noqa: E402
from app.models import User, Workout, AthleteRecord, Comment, Movement, Complex, SectionTemplate  # noqa: E402, F401

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — generates SQL script without connecting."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
  """Run migrations in 'online' mode using the async engine."""
  configuration = config.get_section(config.config_ini_section, {})

  # Use the async URL for async_engine_from_config
  configuration["sqlalchemy.url"] = settings.database_url_async

  connectable = async_engine_from_config(
      configuration,
      prefix="sqlalchemy.",
      poolclass=pool.NullPool,
  )
  async with connectable.connect() as connection:
    await connection.run_sync(do_run_migrations)
  await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()