from datetime import datetime

from pydantic import BaseModel, Field


class MovementCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class MovementRead(BaseModel):
    id: int
    name: str
    default_unit: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MovementSearchResult(BaseModel):
    items: list[MovementRead]
    total: int