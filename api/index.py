"""Vercel serverless entrypoint for the FastAPI backend."""

import sys
from pathlib import Path

# backend/ must be on sys.path so "from app.*" imports resolve
_backend = str(Path(__file__).resolve().parent.parent / "backend")
if _backend not in sys.path:
    sys.path.insert(0, _backend)

from app.main import app  # noqa: E402

handler = app
