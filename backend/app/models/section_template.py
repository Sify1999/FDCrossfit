from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_mixin import TimestampMixin


class SectionTemplate(Base, TimestampMixin):
    __tablename__ = "section_templates"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # The coach who created/saved this template
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # User-defined name for the template (e.g. "Heavy Day Warmup")
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Section type discriminator: "single", "complex", "conditioning", "text"
    section_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # The full section data as JSONB — mirrors WorkoutSection fields
    # so it can be used directly when loading into the builder.
    # Includes all fields: id, label, content, type, movement_id, ...
    section_data: Mapped[dict] = mapped_column(JSONB, nullable=False)

    def __repr__(self) -> str:
        return f"<SectionTemplate id={self.id} name={self.name} type={self.section_type}>"