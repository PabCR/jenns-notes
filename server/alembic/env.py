"""Alembic migration environment configuration."""
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine
import os
import sys
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from alembic import context
# Import Base and models after environment is loaded
from app.db import Base
# Import models to register them with Base.metadata
import app.models.resource  # noqa: F401
import app.models.packet  # noqa: F401

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Get database URL from environment
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise ValueError("DATABASE_URL environment variable is required")

# Convert asyncpg URL to psycopg2 for Alembic (Alembic uses sync SQLAlchemy)
# Replace postgresql+asyncpg:// with postgresql+psycopg2://
sync_database_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
if sync_database_url == database_url:
    # If no replacement happened, try without the +asyncpg part
    sync_database_url = database_url.replace("postgresql://", "postgresql+psycopg2://")

# Override sqlalchemy.url with environment variable
config.set_main_option("sqlalchemy.url", sync_database_url)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
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


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    from sqlalchemy import create_engine
    
    connectable = create_engine(
        sync_database_url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        do_run_migrations(connection)


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
