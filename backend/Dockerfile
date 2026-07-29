FROM python:3.12-slim

WORKDIR /app

# Install system dependencies needed by psycopg/asyncpg
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files first for layer caching
COPY pyproject.toml ./

# Install pip upgrade AND install all dependencies listed in pyproject.toml
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# Copy the rest of the application
COPY . .

# Set Python path
ENV PYTHONPATH=/app

# Expose the backend port
EXPOSE 8000

# Default command: run migrations then start uvicorn
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]