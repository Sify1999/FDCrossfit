from datetime import datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_mixin import TimestampMixin


class CompetitionStage(Base, TimestampMixin):
    """Per level, per stage: how many advanced and whether it has been closed."""

    __tablename__ = "competition_stages"
    __table_args__ = (
        UniqueConstraint("level", "stage_number", name="uq_competition_stages_level_stage"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    level: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    stage_number: Mapped[int] = mapped_column(Integer, nullable=False)
    advance_count: Mapped[int] = mapped_column(Integer, nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )