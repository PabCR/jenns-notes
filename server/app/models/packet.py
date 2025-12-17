"""Packet model for storing user resource collections."""
from sqlalchemy import Column, String, Text, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.types import TIMESTAMP
from app.db import Base
import uuid


class Packet(Base):
    """Packet model representing collections of resources."""
    
    __tablename__ = "packets"
    
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
    name = Column(
        Text,
        nullable=False
    )
    description = Column(
        Text,
        nullable=True
    )
    share_link = Column(
        String,
        nullable=False,
        unique=True,
        index=True
    )
    resource_ids = Column(
        ARRAY(UUID(as_uuid=True)),
        nullable=False,
        server_default="{}"
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
        CheckConstraint("char_length(name) >= 1", name="check_name_length"),
        Index("idx_packets_user_id", "user_id"),
        Index("idx_packets_share_link", "share_link"),
        Index("idx_packets_resource_ids_gin", "resource_ids", postgresql_using="gin"),
    )
