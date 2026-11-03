from typing import Literal

from pydantic import BaseModel, Field

StageState = Literal["locked", "open", "closed"]
RowStatus = Literal["active", "advanced", "eliminated"]
CutPhase = Literal["pending", "live", "final"]


class EventCell(BaseModel):
    rank: int | None = None
    display: str | None = None


class StandingRow(BaseModel):
    position: int
    name: str
    level: str
    events: dict[str, EventCell]
    total: int
    firsts: int
    completed: int
    status: RowStatus


class TieInfo(BaseModel):
    """Legacy: preview of a tie across a manual 'close stage' cut."""
    names: list[str]
    slots: int


class CutInfo(BaseModel):
    """The automatic cut line of a stage (20 after stage 1, 10 after stage 2)."""
    limit: int                      # how many advance (20 / 10)
    after: int                      # rows above the line (limit, or more when a tie spans it)
    active: bool                    # False -> no line is drawn (nobody is cut yet)
    phase: CutPhase                 # pending = waiting for results, live = results coming in, final = all in
    next_stage: int
    tied: list[str] = Field(default_factory=list)  # athletes tied across the line (all of them advance)


class StageStanding(BaseModel):
    level: str
    stage: int
    state: StageState
    events: list[int]
    advance_count: int | None = None
    tie: TieInfo | None = None
    cut: CutInfo | None = None      # None for the last stage
    entry_cut: int | None = None    # the cut that decided who is in THIS stage (None = everyone)
    provisional: bool = False       # who is in this stage can still change
    rows: list[StandingRow]


class StageSummary(BaseModel):
    stage: int
    state: StageState
    advance_count: int | None = None
    cut_limit: int | None = None
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