from datetime import datetime

from pydantic import BaseModel, Field


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
    """Create an athlete registered for multiple events at once."""
    name: str = Field(min_length=1, max_length=255, description="Athlete's full name")
    level: str = Field(
        min_length=1, max_length=50,
        description="Skill level — e.g. Beginner, Intermediate, Advanced",
    )
    events: list[int] = Field(
        min_length=1, max_length=9,
        description="Event numbers (1–9) the athlete is registered for",
    )
    heats: dict[int, int] | None = Field(
        None,
        description="Optional map of event number → heat number for the registered events",
    )


class CompetitionAthleteUpdateRegistration(BaseModel):
    """Reconcile an existing athlete's registration (level, events & heats).

    Events that stay registered keep their existing scores / tiebreakers;
    removed events are deleted and new events are created.
    """
    level: str = Field(
        min_length=1, max_length=50,
        description="Skill level — e.g. Beginner, Intermediate, Advanced",
    )
    events: list[int] = Field(
        min_length=1, max_length=9,
        description="Event numbers (1–9) the athlete is registered for",
    )
    heats: dict[int, int] | None = Field(
        None,
        description="Optional map of event number → heat number for the registered events",
    )


class CompetitionAthleteUpdate(BaseModel):
    """Update score, reps/weight and tiebreaker for an athlete/event combo.

    The combined "Event 1&2" entry stores Event 1's data in score/reps/weight
    and Event 2's data in score_2/reps_2/weight_2.
    """
    score: int | None = Field(None, ge=0, description="Athlete's score for the event (Event 1 for 1&2)")
    reps: int | None = Field(None, ge=0, description="Repetitions completed in the event (Event 1 for 1&2)")
    weight: int | None = Field(None, ge=0, description="Weight lifted (kg) in the event (Event 1 for 1&2)")
    score_2: int | None = Field(None, ge=0, description="Event 2 score for the combined Event 1&2")
    reps_2: int | None = Field(None, ge=0, description="Event 2 repetitions for the combined Event 1&2")
    weight_2: int | None = Field(None, ge=0, description="Event 2 weight (kg) for the combined Event 1&2")
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
    score_2: int | None = None
    reps_2: int | None = None
    weight_2: int | None = None
    tiebreaker_type: str | None = None
    tiebreaker_value: int | None = None
    tiebreaker_value_2: int | None = None
    heat: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CompetitionAthleteList(BaseModel):
    athletes: list[CompetitionAthleteRead]