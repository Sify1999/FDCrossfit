from app.db.base import Base

# Import all models so Alembic can detect them.
# TODO: Add Lead, Booking, Member, Plan models for gym entities:
#   - Lead: visitors who fill out the contact / free trial form
#   - Booking: free trial session with a time slot
#   - Member: gym member extending User with membership info
#   - Plan: subscription tiers with pricing

from app.models.user import User  # noqa: F401, E402

__all__ = ["User"]