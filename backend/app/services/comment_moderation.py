"""
Comment moderation service — XSS prevention, spam filtering, profanity filter,
duplicate detection, and rate limiting.

Kept as a standalone service so it can be extended or swapped out without
touching the router or the ORM service layer.
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field

# ─── Configurable limits ──────────────────────────────────────────
# These can be promoted to Settings later if needed.

COMMENT_COOLDOWN_SECONDS: int = 15
"""Minimum seconds between two comments from the same user."""

COMMENT_MAX_PER_HOUR: int = 20
"""Hard cap on comments+replies per user per rolling hour."""

COMMENT_MIN_LENGTH: int = 3
"""Minimum characters for a comment's content (whitespace stripped)."""

COMMENT_MAX_LENGTH: int = 1000
"""Maximum characters for a comment's content."""

REPEATED_CHAR_LIMIT: int = 15
"""If *any single character* is repeated more than this many times in a row,
the comment is rejected (e.g. "aaaaaaaaaaaaaaaa")."""

# ─── Profanity / spam blocklist ───────────────────────────────────
BLOCKED_WORDS: set[str] = {
    "spam", "buy now", "click here", "free money",
    "act now", "limited offer", "congratulations you won",
}

# ─── In-memory rate-limit store ───────────────────────────────────
@dataclass
class RateLimitStore:
    cooldown: dict[int, float] = field(default_factory=dict)
    hourly: dict[int, list[float]] = field(default_factory=dict)

    def _get_hourly(self, user_id: int) -> list[float]:
        if user_id not in self.hourly:
            self.hourly[user_id] = []
        return self.hourly[user_id]

_rate_store = RateLimitStore()

def reset_rate_store_for_testing() -> None:
    _rate_store.cooldown.clear()
    _rate_store.hourly.clear()
def check_cooldown(user_id: int) -> str | None:
    """Return an error message if the user is still in the cooldown window."""
    last = _rate_store.cooldown.get(user_id)
    if last is not None:
        elapsed = time.time() - last
        if elapsed < COMMENT_COOLDOWN_SECONDS:
            remaining = int(COMMENT_COOLDOWN_SECONDS - elapsed) + 1
            return f"You can comment again in ~{remaining}s"
    return None


def check_hourly_limit(user_id: int) -> str | None:
    """Return an error message if the hourly cap is exceeded."""
    now = time.time()
    window_start = now - 3600
    timestamps = _rate_store._get_hourly(user_id)
    _rate_store.hourly[user_id] = [t for t in timestamps if t > window_start]
    if len(_rate_store.hourly[user_id]) >= COMMENT_MAX_PER_HOUR:
        return f"You have reached the limit of {COMMENT_MAX_PER_HOUR} comments per hour"
    return None


def record_comment(user_id: int) -> None:
    """Store the fact that `user_id` just posted a comment."""
    now = time.time()
    _rate_store.cooldown[user_id] = now
    _rate_store._get_hourly(user_id).append(now)


def check_duplicate(user_id: int, content: str, recent_comments: list[str]) -> str | None:
    """Return an error if the user has already posted identical content."""
    stripped = content.strip().lower()
    for existing in recent_comments:
        if existing.strip().lower() == stripped:
            return "You already posted this exact comment — please write something new"
    return None


def sanitize_content(raw: str) -> str:
    """Strip HTML tags and dangerous patterns from user-submitted text."""
    text = raw.strip()
    text = _strip_html_tags(text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def check_repeated_chars(content: str) -> str | None:
    """Reject comments with excessive repeated characters."""
    for char in set(content):
        pattern = re.escape(char) + r"{" + str(REPEATED_CHAR_LIMIT + 1) + r",}"
        if re.search(pattern, content):
            return f"Please don't repeat the same character more than {REPEATED_CHAR_LIMIT} times"
    return None


def check_profanity(content: str) -> str | None:
    """Return an error if content contains a blocked word/phrase."""
    lower = content.lower()
    for word in BLOCKED_WORDS:
        if word in lower:
            return "Your comment contains language that isn't allowed"
    return None


def validate_content_length(content: str) -> str | None:
    """Check min/max length after sanitization."""
    cleaned = sanitize_content(content)
    if len(cleaned) < COMMENT_MIN_LENGTH:
        return f"Comment must be at least {COMMENT_MIN_LENGTH} characters"
    if len(cleaned) > COMMENT_MAX_LENGTH:
        return f"Comment must be {COMMENT_MAX_LENGTH} characters or fewer"
    return None


def _strip_html_tags(text: str) -> str:
    """Remove HTML/XML tags, including self-closing and malformed ones."""
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    text = re.sub(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<\s*style[^>]*>.*?<\s*/\s*style\s*>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<[^>]*>", "", text)
    return text