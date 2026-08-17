import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

RoleLiteral = Literal["member", "coach", "admin"]

USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_]+$")


# ─── Create ───────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=20)

    @field_validator("username")
    @classmethod
    def username_format(cls, v: str) -> str:
        if not USERNAME_PATTERN.match(v):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        return v

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        # Length alone doesn't stop "aaaaaaaa" — require at least one
        # letter and one digit. Not bulletproof, but a meaningful floor.
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("Password must contain at least one letter and one number")
        return v


class UserCreateResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str | None
    phone: str | None
    created_at: datetime


# ─── Read ─────────────────────────────────────────────────────────────
class UserRead(BaseModel):
    id: int
    email: str
    username: str
    full_name: str | None
    phone: str | None
    is_active: bool
    role: RoleLiteral
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
    # Accepts either an email address or a username — the router decides
    # which lookup to run based on whether it contains "@".
    identifier: str = Field(min_length=1, max_length=255)
    password: str