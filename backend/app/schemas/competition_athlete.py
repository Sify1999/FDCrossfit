from datetime import datetime

from pydantic import BaseModel, Field


class CompetitionAthleteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255, description="Athlete's full name")
    level: str = Field(
        min_length=1, max_length=50,
        description="Skill level — e.g. Beginner, Intermediate, Advanced",
    )
    event: int = Field(
        ge=1, le=4,
        description="Event number (1–4) the athlete is registered for",
    )


class CompetitionAthleteBulkCreate(BaseModel):
    """Create an athlete registered for multiple events at once."""
    name: str = Field(min_length=1, max_length=255, description="Athlete's full name")
    level: str = Field(
        min_length=1, max_length=50,
        description="Skill level — e.g. Beginner, Intermediate, Advanced",
    )
    events: list[int] = Field(
        min_length=1, max_length=4,
        description="Event numbers (1–4) the athlete is registered for",
    )


class CompetitionAthleteUpdate(BaseModel):
    """Update score for an athlete/event combo."""
    score: int | None = Field(None, ge=0, description="Athlete's score for the event")


class CompetitionAthleteRead(BaseModel):
    id: int
    name: str
    level: str
    event: int
    score: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CompetitionAthleteList(BaseModel):
    athletes: list[CompetitionAthleteRead]