"""Pydantic schemas for Gemini structured output."""
from pydantic import BaseModel, Field
from typing import List, Optional


class ResourceMetadata(BaseModel):
    """Structured metadata extracted from resource content using Gemini AI."""
    tags: List[str] = Field(
        description="5-8 relevant tags for oncology nursing resources",
        min_length=0,
        max_length=10
    )
    description: Optional[str] = Field(
        default=None,
        description="Patient-friendly 1-2 sentence description"
    )
    condition: Optional[str] = Field(
        default=None,
        description="Cancer type or medical condition if applicable"
    )
    audience: Optional[str] = Field(
        default=None,
        description="Target audience (e.g., 'patients', 'nurses', 'caregivers')"
    )
    topic: Optional[str] = Field(
        default=None,
        description="Primary topic or category"
    )
