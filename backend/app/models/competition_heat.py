from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_mixin import TimestampMixin


class CompetitionHeat(Base, TimestampMixin):
    """A single heat inside a competition event, with its own schedule time."""

    __tablename__ = "competition_heats"
    __table_args__ = (
        UniqueConstraint("event_id", "heat_number", name="uq_competition_heats_event_number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("competition_events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    heat_number: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[str] = mapped_column(String(5), nullable=False)
    end_time: Mapped[str] = mapped_column(String(5), nullable=False)

    event: Mapped["CompetitionEvent"] = relationship(back_populates="heats")
    athletes: Mapped[list["CompetitionAthlete"]] = relationship(
        back_populates="heat_ref",
        foreign_keys="CompetitionAthlete.heat_id",
    )