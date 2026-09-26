from sqlalchemy import String, Integer

from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_mixin import TimestampMixin


class CompetitionAthlete(Base, TimestampMixin):
    __tablename__ = "competition_athletes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    level: Mapped[str] = mapped_column(String(50), nullable=False)
    event: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)

    def __repr__(self) -> str:
        return f"<CompetitionAthlete id={self.id} name={self.name} level={self.level} event={self.event}>"