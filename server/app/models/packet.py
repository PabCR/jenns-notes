"""Packet model for storing user resource collections."""
from sqlalchemy import Column, String, Text, Integer, CheckConstraint, Index, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
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
    
    # Relationships
    resources = relationship(
        "Resource",
        secondary="packet_resources",
        lazy="selectin"
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint("char_length(name) >= 1", name="check_name_length"),
        Index("idx_packets_user_id", "user_id"),
        Index("idx_packets_share_link", "share_link"),
    )


class PacketResource(Base):
    """Join table for packet-resource relationships."""
    
    __tablename__ = "packet_resources"
    
    packet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("packets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    resource_id = Column(
        UUID(as_uuid=True),
        ForeignKey("resources.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    position = Column(
        Integer,
        nullable=False,
        server_default="0"
    )
    
    # Composite primary key
    __table_args__ = (
        PrimaryKeyConstraint("packet_id", "resource_id"),
        Index("idx_packet_resources_packet_id", "packet_id"),
        Index("idx_packet_resources_resource_id", "resource_id"),
    )
