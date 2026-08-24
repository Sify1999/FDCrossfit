from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.services.comment_moderation import (
    COMMENT_MAX_LENGTH,
    COMMENT_MIN_LENGTH,
    check_profanity,
    check_repeated_chars,
    sanitize_content,
)


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=COMMENT_MAX_LENGTH)
    parent_id: int | None = Field(default=None)

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        # Strip HTML tags to prevent XSS
        cleaned = sanitize_content(v)
        if len(cleaned) < COMMENT_MIN_LENGTH:
            raise ValueError(f"Comment must be at least {COMMENT_MIN_LENGTH} characters after removing HTML")
        # Check for excessive repeated characters
        err = check_repeated_chars(cleaned)
        if err:
            raise ValueError(err)
        # Check profanity
        err = check_profanity(cleaned)
        if err:
            raise ValueError(err)
        return cleaned


class CommentRead(BaseModel):
    id: int
    workout_id: int
    user_id: int
    parent_id: int | None
    content: str
    created_at: datetime
    updated_at: datetime
    # Nested fields populated at read time by the service.
    username: str = ""
    full_name: str | None = None
    replies: list["CommentRead"] = Field(default_factory=list)

    model_config = {"from_attributes": True}


CommentRead.model_rebuild()  # resolve forward-refs for replies