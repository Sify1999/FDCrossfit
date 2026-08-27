from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_mixin import TimestampMixin


class Complex(Base, TimestampMixin):
    __tablename__ = "complexes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Ordered list of movements — each entry is a dict with movement_id,
    # movement_name, and reps. JSONB keeps ordering trivial.
    # Example:
    #   [{"movement_id": 1, "movement_name": "Power Clean", "reps": "1"},
    #    {"movement_id": 2, "movement_name": "Front Squat", "reps": "1"}]
    movements: Mapped[list[dict]] = mapped_column(JSONB, default=list, server_default="[]")
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    def __repr__(self) -> str:
        return f"<Complex id={self.id} name={self.name}>"