from sqlalchemy import Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_mixin import TimestampMixin


class CompetitionParticipant(Base, TimestampMixin):
    """One row per athlete per level — tracks elimination status."""

    __tablename__ = "competition_participants"
    __table_args__ = (
        UniqueConstraint("name", "level", name="uq_competition_participants_name_level"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    # Always stored lowercase: beginner / intermediate / advanced
    level: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # "active" | "eliminated"
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active", server_default="active"
    )
    eliminated_after_stage: Mapped[int | None] = mapped_column(
        Integer, nullable=True, default=None
    )

    def __repr__(self) -> str:
        return f"<CompetitionParticipant {self.name} {self.level} {self.status}>"