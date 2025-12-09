"""Database fixtures and lightweight test models for resource tests."""
import json
import os
from datetime import datetime
from typing import AsyncGenerator
from uuid import uuid4

import pytest
from sqlalchemy import Column, String, Text, Boolean, TypeDecorator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import StaticPool

# Test database URL - prefer PostgreSQL if available, otherwise use SQLite (limited)
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "sqlite+aiosqlite:///:memory:",
)
USE_POSTGRES = TEST_DATABASE_URL.startswith("postgresql")

# Separate Base for test models to avoid conflicts
TestBase = declarative_base()


class JSONListType(TypeDecorator):
    """Converts list to JSON string for SQLite."""

    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            if isinstance(value, list):
                return json.dumps(value)
            return value
        return "[]"

    def process_result_value(self, value, dialect):
        if value is not None:
            if isinstance(value, str):
                return json.loads(value)
            return value
        return []


class StringUUIDType(TypeDecorator):
    """Converts UUID to string for SQLite."""

    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            from uuid import UUID as UUIDType

            if isinstance(value, UUIDType):
                return str(value)
            return str(value) if value else None
        return None

    def process_result_value(self, value, dialect):
        if value is not None:
            return str(value)
        return None


class TestResourceModel(TestBase):
    """SQLite-compatible version of Resource for testing."""

    __tablename__ = "resources"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, nullable=False, index=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(10), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(JSONListType, nullable=False, default=[])  # Auto-converts list to JSON
    auto_tagged = Column(Boolean, nullable=False, default=False)
    condition = Column(Text, nullable=True)
    audience = Column(Text, nullable=True)
    topic = Column(Text, nullable=True)
    created_at = Column(
        String,
        nullable=False,
        server_default="",
        default=lambda: datetime.now().isoformat(),
    )
    updated_at = Column(
        String,
        nullable=False,
        server_default="",
        default=lambda: datetime.now().isoformat(),
    )


@pytest.fixture(scope="function")
async def test_engine():
    """Create a test database engine."""
    if USE_POSTGRES:
        from app.db import Base

        engine = create_async_engine(
            TEST_DATABASE_URL,
            pool_pre_ping=True,
            pool_size=1,
            max_overflow=0,
        )

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        yield engine

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()
    else:
        engine = create_async_engine(
            TEST_DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

        async with engine.begin() as conn:
            await conn.run_sync(TestResourceModel.metadata.create_all)

        yield engine

        async with engine.begin() as conn:
            await conn.run_sync(TestResourceModel.metadata.drop_all)
        await engine.dispose()


@pytest.fixture(scope="function")
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session_maker() as session:
        yield session
