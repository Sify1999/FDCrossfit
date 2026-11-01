from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.services.competition_scoring import is_valid_level


def _validate_level(v: str) -> str:
    if not is_valid_level(v):
        raise ValueError("Level must be Beginner, Intermediate or Advanced")
    return v


class CompetitionAthleteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255, description="Athlete's full name")
    level: str = Field(
        min_length=1, max_length=50,
        description="Skill level — e.g. Beginner, Intermediate, Advanced",
    )
    event: int = Field(
        ge=1, le=9,
        description="Event number (1–9) the athlete is registered for",
    )
    tiebreaker_type: str | None = Field(None, description="Type — reps, weight, or time")


class CompetitionAthleteBulkCreate(BaseModel):
    """Register an athlete. Rows for EVERY event of the level are created
    automatically; only heat / line assignments are provided."""
    name: str = Field(min_length=1, max_length=255, description="Athlete's full name")
    level: str = Field(
        min_length=1, max_length=50,
        description="Skill level — e.g. Beginner, Intermediate, Advanced",
    )
    heats: dict[int, int | None] | None = Field(
        None,
        description="Map of event number → heat number (null clears). Events not listed are left as they are.",
    )
    lines: dict[int, int | None] | None = Field(
        None,
        description="Map of event number → line (lane) number (null clears). Events not listed are left as they are.",
    )

    _check_level = field_validator("level")(_validate_level)


class CompetitionAthleteUpdateRegistration(BaseModel):
    """Update an existing athlete's level, heats and lines.

    Never deletes anything: scores, reps, times and tiebreakers are kept, and
    missing event rows are added. Events not present in `heats` / `lines` are
    left exactly as they are.
    """
    level: str = Field(
        min_length=1, max_length=50,
        description="Skill level — e.g. Beginner, Intermediate, Advanced",
    )
    heats: dict[int, int | None] | None = Field(
        None,
        description="Map of event number → heat number (null clears). Events not listed are left as they are.",
    )
    lines: dict[int, int | None] | None = Field(
        None,
        description="Map of event number → line (lane) number (null clears). Events not listed are left as they are.",
    )

    _check_level = field_validator("level")(_validate_level)


class CompetitionAthleteUpdate(BaseModel):
    """Update score, reps/weight, time-seconds and tiebreaker for an athlete/event combo.

    The combined "Event 1&2" entry stores Event 1's data in score/reps/weight/time_seconds
    and Event 2's data in the corresponding _2 fields.
    """
    score: int | None = Field(None, ge=0, description="Athlete's score / leaderboard points for the event (Event 1 for 1&2)")
    reps: int | None = Field(None, ge=0, description="Repetitions completed in the event (Event 1 for 1&2)")
    weight: int | None = Field(None, ge=0, description="Weight lifted (kg) in the event (Event 1 for 1&2)")
    time_seconds: int | None = Field(None, ge=0, description="Raw performance time (total seconds) — for time-based events (Event 1 for 1&2)")
    time_hundredths: int | None = Field(None, ge=0, le=99, description="Hundredths-of-a-second part (0–99)")
    score_2: int | None = Field(None, ge=0, description="Event 2 score for the combined Event 1&2")
    reps_2: int | None = Field(None, ge=0, description="Event 2 repetitions for the combined Event 1&2")
    weight_2: int | None = Field(None, ge=0, description="Event 2 weight (kg) for the combined Event 1&2")
    time_seconds_2: int | None = Field(None, ge=0, description="Event 2 raw performance time (total seconds)")
    time_hundredths_2: int | None = Field(None, ge=0, le=99, description="Event 2 hundredths-of-a-second part (0–99)")
    tiebreaker_type: str | None = Field(None, description="Tiebreaker type — always 'time' in the UI")
    tiebreaker_value: int | None = Field(None, ge=0, description="Tiebreaker value (seconds for time)")
    tiebreaker_value_2: int | None = Field(None, ge=0, description="Event 2 tiebreaker value (seconds for time)")


class CompetitionAthleteRead(BaseModel):
    id: int
    name: str
    level: str
    event: int
    score: int | None = None
    reps: int | None = None
    weight: int | None = None
    time_seconds: int | None = None
    time_hundredths: int | None = None
    score_2: int | None = None
    reps_2: int | None = None
    weight_2: int | None = None
    time_seconds_2: int | None = None
    time_hundredths_2: int | None = None
    tiebreaker_type: str | None = None
    tiebreaker_value: int | None = None
    tiebreaker_value_2: int | None = None
    heat: int | None = None
    line: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CompetitionAthleteList(BaseModel):
    athletes: list[CompetitionAthleteRead]