# MERQATO Super Agent — Backend

FastAPI backend for the MERQATO Super Agent. Provides client onboarding, local storage, and administrative API endpoints.

## Quick start

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env        # set a real admin token
uvicorn app.main:app --reload
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Service health |
| POST | `/api/clients` | Bearer | Create a client |
| GET | `/api/clients/{id}` | Bearer | Get a client |

## Tests

```bash
pip install pytest
pytest -v
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MERQATO_ADMIN_TOKEN` | *(empty)* | Bearer token for admin endpoints |
| `MERQATO_DATABASE_URL` | `sqlite:///./merqato.db` | SQLAlchemy database URL |
| `MERQATO_STORAGE_ROOT` | `storage` | Root directory for client storage |
