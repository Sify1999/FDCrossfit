from datetime import datetime

from pydantic import BaseModel, Field


class ComplexMovementItem(BaseModel):
    movement_id: int
    movement_name: str
    reps: str = Field(default="1", max_length=50)


class ComplexCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    movements: list[ComplexMovementItem] = Field(min_length=1)


class ComplexRead(BaseModel):
    id: int
    name: str
    movements: list[ComplexMovementItem]
    created_by_id: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}