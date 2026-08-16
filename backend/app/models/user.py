from enum import Enum as PyEnum

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_mixin import TimestampMixin


class UserRole(str, PyEnum):
    member = "member"
    coach = "coach"
    admin = "admin"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    # native_enum=False stores this as a plain VARCHAR instead of a Postgres
    # ENUM type — adding new roles later is a normal column, not an
    # ALTER TYPE migration.
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=False, length=20),
        default=UserRole.member,
        server_default=UserRole.member.value,
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"