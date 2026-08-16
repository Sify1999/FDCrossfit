"""Reusable dependency injection for FastAPI."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User, UserRole
from app.services.user import get_user_by_id

# auto_error=False so a missing header raises our own 401 with a clear
# message instead of FastAPI's generic "Not authenticated".
bearer_scheme = HTTPBearer(auto_error=False)


def get_settings_dependency() -> Settings:
    return get_settings()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Decode the bearer token and load the user. Rejects missing/invalid
    tokens, wrong token type (a refresh token can't be used here — this was
    previously unchecked anywhere), and deactivated accounts."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise unauthorized

    subject = payload.get("sub")
    try:
        user_id = int(str(subject))
    except (TypeError, ValueError):
        raise unauthorized

    user = await get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise unauthorized

    return user


def require_roles(*roles: UserRole):
    """Dependency factory — 403s unless current_user.role is in `roles`."""

    async def _check(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to perform this action",
            )
        return user

    return _check


require_coach = require_roles(UserRole.coach, UserRole.admin)