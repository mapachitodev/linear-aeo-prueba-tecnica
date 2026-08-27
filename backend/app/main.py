"""FastAPI application factory & ASGI entrypoint."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.core.config import settings
from backend.app.core.logging import setup_logging, logger
from backend.app.api.v1.router import router as api_v1_router

# The Docker image builds the Vite frontend into ./static (see Dockerfile) so
# a single process serves the SPA and the API on one origin/port - one URL
# to deploy and open, per the brief. In local dev this directory doesn't
# exist and is simply skipped; run `npm run dev` separately instead.
STATIC_DIR = Path(__file__).resolve().parent.parent.parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(
        "starting_aeo_analytics_api environment=%s model=%s gemini_configured=%s",
        settings.ENVIRONMENT, settings.GEMINI_DEFAULT_MODEL, bool(settings.GEMINI_API_KEY),
    )
    yield
    logger.info("shutting_down_aeo_analytics_api")


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["Health"])
    async def root_health():
        return {"status": "healthy", "service": "AEO Analytics Backend", "version": settings.VERSION}

    app.include_router(api_v1_router, prefix=settings.API_V1_STR)

    if STATIC_DIR.is_dir():
        app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def spa_fallback(full_path: str):
            candidate = STATIC_DIR / full_path
            if full_path and candidate.is_file():
                return FileResponse(candidate)
            return FileResponse(STATIC_DIR / "index.html")

    return app


app = create_application()
