from datetime import datetime

from pydantic import BaseModel, Field


class AthleteRecordItem(BaseModel):
    id: str
    label: str = Field(min_length=1, max_length=100)
    # Free text on purpose — "140kg", "5 reps @ 100kg", "1:45" all need to
    # fit, and forcing a numeric+unit schema would block bodyweight/time-
    # based lifts. Simplicity here beats structure.
    value: str = Field(default="", max_length=100)


class AthleteRecordUpsert(BaseModel):
    records: list[AthleteRecordItem] = Field(default_factory=list)


class AthleteRecordRead(BaseModel):
    records: list[AthleteRecordItem]
    updated_at: datetime

    model_config = {"from_attributes": True}