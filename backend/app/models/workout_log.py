from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_mixin import TimestampMixin


class WorkoutLog(Base, TimestampMixin):
    __tablename__ = "workout_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    workout_id: Mapped[int] = mapped_column(
        ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    log_data: Mapped[list[dict]] = mapped_column(JSONB, default=list, server_default="[]")

    __table_args__ = (
        UniqueConstraint("workout_id", "user_id", name="uq_workout_log_user"),
    )

    def __repr__(self) -> str:
        return f"<WorkoutLog workout_id={self.workout_id} user_id={self.user_id}>"