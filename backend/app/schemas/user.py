from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ─── Create ───────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str | None = None
    phone: str | None = None


class UserCreateResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    phone: str | None
    created_at: datetime


# ─── Read ─────────────────────────────────────────────────────────────
class UserRead(BaseModel):
    id: int
    email: str
    full_name: str | None
    phone: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Auth ─────────────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str