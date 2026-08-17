from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_mixin import TimestampMixin


class AthleteRecord(Base, TimestampMixin):
    __tablename__ = "athlete_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # One row per user — the whole PR log lives in a single JSONB blob,
    # same pattern as Workout.sections. Unique+indexed so "get my log" and
    # "save my log" are both single-row lookups, no per-exercise table.
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    records: Mapped[list[dict]] = mapped_column(JSONB, default=list, server_default="[]")

    def __repr__(self) -> str:
        return f"<AthleteRecord user_id={self.user_id} count={len(self.records)}>"