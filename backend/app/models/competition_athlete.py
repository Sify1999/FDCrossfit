from sqlalchemy import ForeignKey, String, Integer

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_mixin import TimestampMixin


class CompetitionAthlete(Base, TimestampMixin):
    __tablename__ = "competition_athletes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    level: Mapped[str] = mapped_column(String(50), nullable=False)
    event: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    reps: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    weight: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    # Raw result for time-based events (total seconds) — independent of `score`.
    time_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    # Second part of the combined "Event 1&2" — Event 1 uses score/reps/weight/time_seconds,
    # Event 2 uses the _2 variants so the scoreboard can separate them.
    score_2: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    reps_2: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    weight_2: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    time_seconds_2: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    tiebreaker_type: Mapped[str | None] = mapped_column(String(10), nullable=True, default=None)
    tiebreaker_value: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    tiebreaker_value_2: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    heat: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    # Lane / line number the athlete competes in for this event (optional).
    line: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    heat_id: Mapped[int | None] = mapped_column(
        ForeignKey("competition_heats.id", ondelete="SET NULL"),
        nullable=True,
        default=None,
        index=True,
    )

    heat_ref: Mapped["CompetitionHeat | None"] = relationship(back_populates="athletes")

    def __repr__(self) -> str:
        return f"<CompetitionAthlete id={self.id} name={self.name} level={self.level} event={self.event}>"