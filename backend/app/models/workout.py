from datetime import date as date_type

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_mixin import TimestampMixin


class Workout(Base, TimestampMixin):
    __tablename__ = "workouts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # One workout per calendar day — unique+indexed so upserts are a single lookup.
    date: Mapped[date_type] = mapped_column(Date, unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    coach_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Sections (warmup/wod/etc) are flexible per-workout, so JSONB beats a
    # separate child table here — you're not querying inside sections.
    sections: Mapped[list[dict]] = mapped_column(JSONB, default=list, server_default="[]")
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    def __repr__(self) -> str:
        return f"<Workout id={self.id} date={self.date} title={self.title}>"