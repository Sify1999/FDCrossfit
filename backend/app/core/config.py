from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    POSTGRES_USER: str = "fd_crossfit"
    POSTGRES_PASSWORD: str = "changeme"
    POSTGRES_DB: str = "fd_crossfit"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def database_url_sync(self) -> str:
        """Synchronous URL for Alembic migrations (uses psycopg2 or default)."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def database_url_async(self) -> str:
        """Async URL alias, used by Alembic's async migration runner."""
        return self.database_url
    # Backend
    BACKEND_PORT: int = 8000
    SECRET_KEY: str = "change-this-to-a-long-random-string"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Frontend (CORS)
    FRONTEND_URL: str = "http://localhost:3000"

    # Algorithm for JWT
    ALGORITHM: str = "HS256"
    ENVIRONMENT: str = "development"

@lru_cache
def get_settings() -> Settings:
    return Settings()