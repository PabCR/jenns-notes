"""Pytest configuration and fixtures for testing."""
import pytest
import json
from datetime import datetime
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy import Column, String, Text, Boolean, TypeDecorator
from typing import AsyncGenerator
from uuid import uuid4
from httpx import ASGITransport

from app.main import app
from app.db import get_db
from app.models.resource import Resource
from app.utils.auth import get_current_user
from sqlalchemy.orm import declarative_base


# Test database URL
# Prefer PostgreSQL test database if available, otherwise use SQLite (limited)
import os
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "sqlite+aiosqlite:///:memory:"  # Fallback to SQLite
)
USE_POSTGRES = TEST_DATABASE_URL.startswith("postgresql")

# Separate Base for test models to avoid conflicts
TestBase = declarative_base()


# Custom type for tags that converts list to JSON string
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


# Custom type for UUID that converts to string for SQLite
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


# Create a SQLite-compatible Resource table for testing
# Note: This is NOT a pytest test class - it's a SQLAlchemy model
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
    created_at = Column(String, nullable=False, server_default="", default=lambda: datetime.now().isoformat())
    updated_at = Column(String, nullable=False, server_default="", default=lambda: datetime.now().isoformat())


@pytest.fixture(scope="function")
async def test_engine():
    """Create a test database engine."""
    if USE_POSTGRES:
        # Use actual Resource model with PostgreSQL
        from app.db import Base
        engine = create_async_engine(
            TEST_DATABASE_URL,
            pool_pre_ping=True,
            pool_size=1,
            max_overflow=0,
        )
        
        # Create tables using actual Base metadata
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        yield engine
        
        # Cleanup
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()
    else:
        # Use SQLite with TestResource (limited compatibility)
        engine = create_async_engine(
            TEST_DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        
        # Create tables using TestBase metadata
        async with engine.begin() as conn:
            await conn.run_sync(TestResourceModel.metadata.create_all)
        
        yield engine
        
        # Cleanup
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


@pytest.fixture(scope="function")
async def client(
    test_session: AsyncSession, test_user_dict: dict
) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database override."""
    # Override get_db dependency
    async def override_get_db():
        yield test_session
    
    # Override get_current_user dependency with a mock user
    def override_get_current_user():
        return test_user_dict
    
    original_table = None
    if not USE_POSTGRES:
        # For SQLite, we need to patch Resource model
        from app.models.resource import Resource
        from sqlalchemy import event
        import json
        
        # Intercept Resource before_insert to convert for SQLite
        @event.listens_for(Resource, "before_insert", propagate=True)
        def prepare_resource_for_sqlite(mapper, connection, target):
            """Prepare Resource for SQLite: convert tags to JSON, UUIDs to strings, set timestamps."""
            from uuid import UUID as UUIDType
            
            # Convert tags list to JSON string
            if hasattr(target, 'tags') and isinstance(target.tags, list):
                target.tags = json.dumps(target.tags)
            
            # Convert UUID objects to strings for SQLite
            if hasattr(target, 'id') and target.id:
                if isinstance(target.id, UUIDType):
                    target.id = str(target.id)
            if hasattr(target, 'user_id') and target.user_id:
                if isinstance(target.user_id, UUIDType):
                    target.user_id = str(target.user_id)
            
            # Set timestamps
            if not hasattr(target, 'created_at') or target.created_at is None:
                target.created_at = datetime.now().isoformat()
            elif hasattr(target.created_at, 'isoformat'):
                target.created_at = target.created_at.isoformat()
            if not hasattr(target, 'updated_at') or target.updated_at is None:
                target.updated_at = datetime.now().isoformat()
            elif hasattr(target.updated_at, 'isoformat'):
                target.updated_at = target.updated_at.isoformat()
        
        # Patch Resource table for SQLite compatibility
        original_table = Resource.__table__
        Resource.__table__ = TestResourceModel.__table__
        
        # Replace column types
        for col in list(Resource.__table__.columns):
            if col.name == 'tags':
                col.type = JSONListType()
            elif col.name in ('id', 'user_id'):
                col.type = StringUUIDType()
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    
    # Cleanup
    if not USE_POSTGRES and original_table is not None:
        from app.models.resource import Resource
        Resource.__table__ = original_table
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_id() -> str:
    """Return a test user ID."""
    return str(uuid4())


@pytest.fixture
def test_user_dict(test_user_id: str) -> dict:
    """Return a test user dictionary."""
    return {
        "id": test_user_id,
        "email": "test@example.com"
    }


@pytest.fixture
async def sample_resource(
    test_session: AsyncSession, test_user_id: str
):
    """Create a sample resource for testing."""
    from uuid import UUID
    
    if USE_POSTGRES:
        # Use actual Resource model with UUID objects for PostgreSQL
        resource = Resource(
            user_id=UUID(test_user_id),
            title="Test Resource",
            description="Test description",
            type="note",
            content="Test content",
            tags=["tag1", "tag2"]
        )
    else:
        # Use TestResourceModel for SQLite
        resource = TestResourceModel(
            user_id=test_user_id,
            title="Test Resource",
            description="Test description",
            type="note",
            content="Test content",
            tags=["tag1", "tag2"]  # Will be converted to JSON automatically
        )
    
    test_session.add(resource)
    await test_session.commit()
    await test_session.refresh(resource)
    return resource


@pytest.fixture
def valid_resource_data() -> dict:
    """Return valid resource creation data."""
    return {
        "title": "Test Note",
        "description": "A test note description",
        "type": "note",
        "content": "This is the note content",
        "tags": ["test", "note"]
    }


