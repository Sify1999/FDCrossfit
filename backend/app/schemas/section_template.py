from datetime import datetime

from pydantic import BaseModel, Field


class SectionTemplateCreate(BaseModel):
    """Body for POST /api/section-templates — save a new section template."""
    name: str = Field(min_length=1, max_length=255)
    section_type: str = Field(min_length=1, max_length=50)
    section_data: dict


class SectionTemplateUpdate(BaseModel):
    """Body for PUT /api/section-templates/{id}."""
    name: str | None = Field(default=None, max_length=255)
    section_data: dict | None = None


class SectionTemplateRead(BaseModel):
    id: int
    user_id: int
    name: str
    section_type: str
    section_data: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}