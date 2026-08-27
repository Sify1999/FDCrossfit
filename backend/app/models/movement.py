from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_mixin import TimestampMixin


class Movement(Base, TimestampMixin):
    __tablename__ = "movements"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Normalized (lowercase, stripped) name for duplicate detection.
    normalized_name: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True
    )
    # Default measurement unit — "reps", "cal", "m", "sec", "distance", "weight"
    default_unit: Mapped[str] = mapped_column(
        String(50), nullable=False, default="reps"
    )
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    def __repr__(self) -> str:
        return f"<Movement id={self.id} name={self.name}>"