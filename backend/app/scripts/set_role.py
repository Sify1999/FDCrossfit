"""
One-off CLI to change an existing user's role.

Usage (from inside the backend container, or with `uv run` locally):

    python -m app.scripts.set_role you@example.com admin
    python -m app.scripts.set_role coach@example.com coach

Valid roles: member, coach, admin
"""

import asyncio
import sys

from sqlalchemy import select

from app.db.session import async_session_factory
from app.models.user import User, UserRole


async def set_role(email: str, role: UserRole) -> None:
    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is None:
            print(f"No user found with email: {email}")
            return

        old_role = user.role
        user.role = role
        await session.commit()
        print(f"{email}: {old_role.value} -> {role.value}")


def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: python -m app.scripts.set_role <email> <member|coach|admin>")
        sys.exit(1)

    email, role_str = sys.argv[1], sys.argv[2]

    try:
        role = UserRole(role_str)
    except ValueError:
        valid = ", ".join(r.value for r in UserRole)
        print(f"Invalid role '{role_str}'. Valid roles: {valid}")
        sys.exit(1)

    asyncio.run(set_role(email, role))


if __name__ == "__main__":
    main()