from datetime import date, datetime

from pydantic import BaseModel, Field


class WorkoutSection(BaseModel):
    id: str
    label: str
    content: str


class WorkoutBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    coach_name: str | None = Field(default=None, max_length=255)
    sections: list[WorkoutSection] = Field(default_factory=list)


class WorkoutUpsert(WorkoutBase):
    """Body for PUT /api/workouts/{date} — creates the workout if it doesn't
    exist yet, otherwise fully replaces it. Simpler mental model than
    separate POST/PATCH for a "one workout per date" resource."""


class WorkoutRead(WorkoutBase):
    id: int
    date: date
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}