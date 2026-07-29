# FD Crossfit

A full-stack web application for managing a Crossfit gym — built with FastAPI (async Python) + Next.js (React) + PostgreSQL, fully containerized with Docker Compose.

## Tech Stack

| Layer       | Technology                                                    |
| ----------- | ------------------------------------------------------------- |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy (async), Alembic, Pydantic   |
| **Frontend**| Next.js 15, React 19, TypeScript, Tailwind CSS, next-intl     |
| **Database**| PostgreSQL 16                                                 |
| **Auth**    | JWT (access + refresh tokens), bcrypt password hashing        |
| **DevOps**  | Docker Compose, multi-stage Dockerfiles, uv (Python package mgmt) |

## Features

- 🔐 **Authentication** — Register / Login / Token Refresh using JWT
- 🌐 **i18n** — Built-in Persian (Farsi) & English, RTL support
- 🐳 **Dockerized** — One command to start the entire stack
- 🗄️ **Database Migrations** — Alembic wired to pydantic-settings (no hardcoded URLs)
- 🧩 **Modular Architecture** — Models, schemas, services, routers separation

## Quick Start

### Prerequisites

- Docker & Docker Compose

### Run the full stack

```bash
docker compose up --build
```

This starts:
- **PostgreSQL** on port `5432`
- **Backend API** on <http://localhost:8000>
- **Frontend** on <http://localhost:3000>

### Environment

Copy the example env file and adjust as needed:

```bash
cp .env.example .env
```

Key variables:

| Variable              | Description                        | Default                         |
| --------------------- | ---------------------------------- | ------------------------------- |
| `DATABASE_URL`        | Async PostgreSQL connection string | `postgresql+asyncpg://postgres:postgres@db:5432/fd_crossfit` |
| `SECRET_KEY`          | JWT signing secret                 | *(auto-generated placeholder)*  |
| `FRONTEND_URL`        | Allowed CORS origin                | `http://localhost:3000`         |
| `NEXT_PUBLIC_API_URL` | API base URL for the frontend      | `http://localhost:8000`         |

## Project Structure

```
FD Crossfit/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, security, dependencies
│   │   ├── db/            # Database session, Base
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── routers/       # API endpoints
│   ├── alembic/           # Database migrations
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── lib/           # API client, i18n, routing
│   │   └── messages/      # Translation files
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env.example
```

## Development

### Backend (without Docker)

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

### Frontend (without Docker)

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Path                 | Description             |
| ------ | -------------------- | ----------------------- |
| GET    | `/api/health`        | Health check            |
| POST   | `/api/auth/register` | Register a new user     |
| POST   | `/api/auth/login`    | Login, get JWT tokens   |
| POST   | `/api/auth/refresh`  | Refresh access token    |

## Roadmap / TODO

- [ ] Gym-specific models: Leads, Bookings, Memberships, Plans, Payments
- [ ] Admin dashboard with member management
- [ ] Payment gateway integration (ZarinPal / IDPay)
- [ ] Free trial session booking flow
- [ ] Stripe / international payment support
- [ ] Comprehensive test suite (pytest for backend, Vitest for frontend)

## License

MIT