from typing import Literal

from pydantic import BaseModel, Field

StageState = Literal["locked", "open", "closed"]
RowStatus = Literal["active", "advanced", "eliminated"]


class EventCell(BaseModel):
    rank: int | None = None
    display: str | None = None


class StandingRow(BaseModel):
    position: int
    name: str
    level: str
    stage1_rank: int | None = None
    events: dict[str, EventCell]
    total: int
    firsts: int
    completed: int
    status: RowStatus


class TieInfo(BaseModel):
    names: list[str]
    slots: int


class StageStanding(BaseModel):
    level: str
    stage: int
    state: StageState
    events: list[int]
    advance_count: int | None = None
    tie: TieInfo | None = None
    rows: list[StandingRow]


class StageSummary(BaseModel):
    stage: int
    state: StageState
    advance_count: int | None = None
    events: list[int]


class StandingsResponse(BaseModel):
    stages: list[StageSummary]
    standing: StageStanding


class CloseStageRequest(BaseModel):
    level: str = Field(min_length=1, max_length=50)
    stage: int = Field(ge=1, le=3)
    advance_count: int = Field(ge=1)
    tie_winners: list[str] | None = None


class ReopenStageRequest(BaseModel):
    level: str = Field(min_length=1, max_length=50)
    stage: int = Field(ge=1, le=3)