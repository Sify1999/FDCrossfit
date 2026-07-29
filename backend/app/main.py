from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import auth, health

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup / shutdown logic."""
    # TODO: Initialize DB connection pool, check DB connectivity.
    # TODO: Run any startup health checks.
    yield
    # TODO: Cleanup resources if needed.


app = FastAPI(
    title="FD Crossfit API",
    version="0.1.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")


# TODO: Add gym-specific routers:
#   - /api/leads — visitor lead capture
#   - /api/bookings — free trial session booking
#   - /api/members — member management
#   - /api/plans — subscription plans & pricing
#   - /api/payments — payment gateway integration