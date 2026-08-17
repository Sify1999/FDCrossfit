"""
User service — business logic for user creation and retrieval.

TODO: Add gym-specific service methods:
      - create_lead: handle visitor lead capture
      - create_booking: handle free trial session bookings
      - create_member: upgrade user to member with plan selection
      - purchase_subscription: handle subscription/payment flow
"""

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.schemas.user import UserCreate


async def create_user(db: AsyncSession, data: UserCreate) -> User:
    """Create a new user with hashed password."""
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Look up a user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    """Look up a user by username."""
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user_by_identifier(db: AsyncSession, identifier: str) -> User | None:
    """Look up a user by either email or username — used at login, where
    the person can type either into the same field. We treat anything
    containing "@" as an email attempt; everything else as a username."""
    identifier = identifier.strip()
    if "@" in identifier:
        return await get_user_by_email(db, identifier)
    return await get_user_by_username(db, identifier)


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """Look up a user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def list_members(db: AsyncSession, search: str | None = None) -> list[User]:
    """List member-role users, optionally filtered by a substring match on
    username, email, or full name. Backs the coach-facing athlete roster —
    coaches and admins aren't listed here since they aren't "athletes" to
    browse records for."""
    stmt = select(User).where(User.role == UserRole.member).order_by(User.username)

    if search and search.strip():
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                User.username.ilike(pattern),
                User.email.ilike(pattern),
                User.full_name.ilike(pattern),
            )
        )

    result = await db.execute(stmt)
    return list(result.scalars().all())