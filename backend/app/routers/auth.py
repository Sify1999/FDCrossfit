"""Auth router — registration and login endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.db.session import get_db
from app.schemas.user import (
    LoginRequest,
    TokenRefreshRequest,
    TokenResponse,
    UserCreate,
    UserCreateResponse,
)
from app.services.user import create_user, get_user_by_email, get_user_by_id

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserCreateResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)) -> UserCreateResponse:
    existing = await get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )
    user = await create_user(db, data)
    return UserCreateResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        created_at=user.created_at,
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    user = await get_user_by_email(db, data.email)
    # Same generic message whether the email doesn't exist, the password is
    # wrong, or the account is deactivated — don't leak which case it was.
    if not user or not verify_password(data.password, user.hashed_password) or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: TokenRefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    payload = decode_token(data.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")

    try:
        user_id = int(str(payload["sub"]))
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")

    # This is the fix: previously any syntactically valid refresh token
    # minted a new access token forever, even for a deleted/deactivated user.
    user = await get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")

    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)