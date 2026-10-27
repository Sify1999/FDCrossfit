from pydantic import BaseModel, Field

# 24h "HH:MM" time format, e.g. "08:00" or "23:59"
TIME_PATTERN = r"^([01]\d|2[0-3]):[0-5]\d$"


class CompetitionEventCreate(BaseModel):
    level: str = Field(min_length=1, max_length=20, description="Level key — beginner, intermediate or advanced")
    event_number: int = Field(ge=1, le=9, description="Event number (1–9)")
    name: str = Field(min_length=1, max_length=255, description="Event name shown on the schedule")
    day: int | None = Field(None, ge=1, le=9, description="Competition day (1–4)")
    date: str | None = Field(None, max_length=50, description="Date label, e.g. Sat, Jun 14")


class CompetitionEventUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    event_number: int | None = Field(None, ge=1, le=9)
    day: int | None = Field(None, ge=1, le=9)
    date: str | None = Field(None, max_length=50)


class CompetitionHeatCreate(BaseModel):
    event_id: int
    heat_number: int = Field(ge=1)
    start_time: str = Field(pattern=TIME_PATTERN, description="Start time in 24h HH:MM")
    end_time: str = Field(pattern=TIME_PATTERN, description="End time in 24h HH:MM")


class CompetitionHeatUpdate(BaseModel):
    heat_number: int | None = Field(None, ge=1)
    start_time: str | None = Field(None, pattern=TIME_PATTERN)
    end_time: str | None = Field(None, pattern=TIME_PATTERN)


class CompetitionHeatAthlete(BaseModel):
    """Athlete registered in a heat, with their optional line (lane) number."""
    name: str
    line: int | None = None


class CompetitionHeatRead(BaseModel):
    id: int
    event_id: int
    heat_number: int
    start_time: str
    end_time: str
    athletes: list[CompetitionHeatAthlete] = Field(
        default_factory=list,
        description="Athletes registered in this heat (name + optional line)",
    )

    model_config = {"from_attributes": True}


class CompetitionEventRead(BaseModel):
    id: int
    level: str
    event_number: int
    name: str
    day: int | None = None
    date: str | None = None
    heats: list[CompetitionHeatRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class CompetitionScheduleResponse(BaseModel):
    events: list[CompetitionEventRead]