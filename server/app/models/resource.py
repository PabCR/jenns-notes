"""Resource model for storing user resources (notes, PDFs, links)."""
from sqlalchemy import Column, String, Text, Boolean, ARRAY, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.types import TIMESTAMP
from app.db import Base
import uuid


class Resource(Base):
    """Resource model representing notes, PDFs, and links."""
    
    __tablename__ = "resources"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )
    user_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )
    title = Column(
        Text,
        nullable=False
    )
    description = Column(
        Text,
        nullable=True
    )
    type = Column(
        String(10),
        nullable=False
    )
    content = Column(
        Text,
        nullable=False
    )
    tags = Column(
        ARRAY(String),
        nullable=False,
        default=[],
        server_default="{}"
    )
    auto_tagged = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false"
    )
    condition = Column(
        Text,
        nullable=True
    )
    audience = Column(
        Text,
        nullable=True
    )
    topic = Column(
        Text,
        nullable=True
    )
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint("char_length(title) >= 1", name="check_title_length"),
        CheckConstraint("type IN ('pdf', 'link', 'note')", name="check_type_enum"),
        Index("idx_resources_user_id", "user_id"),
        Index("idx_resources_type", "type"),
        Index("idx_resources_created_at", "created_at", postgresql_ops={"created_at": "DESC"}),
    )

