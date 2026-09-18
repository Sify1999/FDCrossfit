from datetime import datetime

from pydantic import BaseModel, Field


class LogMovementItem(BaseModel):
    """Per-movement entry — the athlete fills in sets/reps/weight."""

    movement_name: str = Field(default="")
    sets: str = Field(default="")
    reps: str = Field(default="")
    weight: str = Field(default="")
    notes: str = Field(default="")
    # EMOM: per-round reps and weight
    repsPerRound: list[str] | None = None
    weightPerRound: list[str] | None = None


class LogSectionEntry(BaseModel):
    """Per-section entry — groups movements under a section label."""

    section_id: str = Field(default="")
    section_label: str = Field(default="")
    score: str = Field(default="")
    movements: list[LogMovementItem] = Field(default_factory=list)
    # Coach-prescribed intensity / effort fields
    rpe: str = Field(default="")
    effort: str = Field(default="")
    zone: str = Field(default="")
    # Per-section note
    note: str = Field(default="")
    # Section metadata for viewer detection
    format: str | None = None
    rounds: int | None = None


class WorkoutLogUpsert(BaseModel):
    """Body for PUT /workouts/{workout_date}/log — athlete submits their log."""

    log_data: list[LogSectionEntry] = Field(default_factory=list)


class WorkoutLogRead(BaseModel):
    user_id: int | None = None
    log_data: list[dict]
    updated_at: datetime

    model_config = {"from_attributes": True}