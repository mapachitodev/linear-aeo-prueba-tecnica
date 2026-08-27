"""Vercel entrypoint: re-exports the FastAPI ASGI app.

Vercel's Python runtime auto-detects a module-level `app` in files under
/api and serves it directly as an ASGI application - no adapter needed.
vercel.json rewrites every /api/* request to this one function so FastAPI's
own router (backend/app/api/v1/router.py) handles the sub-paths.
"""

from backend.app.main import app  # noqa: F401
