from sqlalchemy import Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_mixin import TimestampMixin


class CompetitionEvent(Base, TimestampMixin):
    """A competition event (identified by level + event number).

    Each event holds a set of heats, and every heat has its own start/end
    time so athletes can be scheduled dynamically.
    """

    __tablename__ = "competition_events"
    __table_args__ = (
        UniqueConstraint("level", "event_number", name="uq_competition_events_level_number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    level: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    event_number: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    day: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    date: Mapped[str | None] = mapped_column(String(50), nullable=True, default=None)

    heats: Mapped[list["CompetitionHeat"]] = relationship(
        back_populates="event",
        cascade="all, delete-orphan",
        order_by="CompetitionHeat.heat_number",
    )