from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_mixin import TimestampMixin


class Comment(Base, TimestampMixin):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    workout_id: Mapped[int] = mapped_column(
        ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships for eager loading in services/comment.py
    user: Mapped["User"] = relationship(back_populates="comments", lazy="selectin")  # noqa: F821
    replies: Mapped[list["Comment"]] = relationship(
        back_populates="parent_comment",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    parent_comment: Mapped["Comment | None"] = relationship(
        back_populates="replies", remote_side=[id], lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Comment id={self.id} workout_id={self.workout_id} user_id={self.user_id}>"