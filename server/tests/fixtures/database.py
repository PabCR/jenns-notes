"""Database fixtures configured for PostgreSQL-backed tests."""
import os
from typing import AsyncGenerator

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db import Base

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if not TEST_DATABASE_URL or not TEST_DATABASE_URL.startswith("postgresql"):
    pytest.skip(
        "Tests require TEST_DATABASE_URL pointing at a PostgreSQL database",
        allow_module_level=True,
    )


@pytest.fixture(scope="function")
async def test_engine():
    """Provision a fresh database schema for each test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        pool_pre_ping=True,
        pool_size=1,
        max_overflow=0,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    try:
        yield engine
    finally:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()


@pytest.fixture(scope="function")
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Yield an AsyncSession bound to the test engine."""
    async_session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session_maker() as session:
        yield session
