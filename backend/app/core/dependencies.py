"""
Reusable dependency injection for FastAPI.

TODO: Add `get_current_user` dependency when auth is fully wired.
      Future: role-based access control (admin vs member vs visitor).
"""

from app.core.config import get_settings, Settings


def get_settings_dependency() -> Settings:
    """FastAPI dependency for settings injection."""
    return get_settings()