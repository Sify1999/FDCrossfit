from datetime import date, datetime

from pydantic import BaseModel, Field


class WorkoutSection(BaseModel):
    id: str
    label: str = ""
    content: str = ""

    # ── Structured fields (all optional — backward compat) ────────────
    # Section type discriminator: "single", "complex", "conditioning",
    # "text", or None (treat as "text" for backward compat).
    type: str | None = None

    # Single-movement fields
    movement_id: int | None = None
    movement_name: str | None = None
    sets: int | None = None
    reps: str | None = None
    weight: str | None = None
    rest_seconds: int | None = None
    tempo: str | None = None

    # Complex fields
    complex_id: int | None = None
    complex_name: str | None = None
    # Each entry: {"movement_id": int, "movement_name": str, "reps": str}
    movements: list[dict] | None = None

    # Conditioning fields
    format: str | None = None  # "AMRAP", "EMOM", "FOR_TIME", "RFT", "TABATA", "CHIPPER"
    duration_minutes: int | None = None
    interval_minutes: int | None = None
    time_cap_minutes: int | None = None
    rounds: int | None = None
    work_seconds: int | None = None
    rest_seconds_interval: int | None = None

    # Generic notes (used by all types)
    notes: str | None = None


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