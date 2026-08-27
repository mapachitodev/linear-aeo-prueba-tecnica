"""Application configuration loaded from environment variables."""

from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the AEO Analytics backend."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # API metadata
    PROJECT_NAME: str = "AEO Analytics API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development")
    LOG_LEVEL: str = Field(default="INFO")

    # Gemini API
    # No default value on purpose: an empty key must fail loudly rather than
    GEMINI_API_KEY: str = Field(default="")
    # "gemini-flash-latest" is a rolling alias Google repoints to its current
    # flash model - pinning to a dated model name (e.g. gemini-2.5-flash) is
    # a real trap here: Google retires those for new API keys with a hard
    # 404 ("no longer available to new users"), discovered while testing this.
    GEMINI_DEFAULT_MODEL: str = Field(default="gemini-flash-latest")
    GEMINI_MAX_CONCURRENCY: int = Field(default=8, ge=1, le=50)
    GEMINI_TIMEOUT_SECONDS: float = Field(default=30.0, gt=0)

    # Survey defaults (AEO audit scope, per the SearchBrand brief). COMPETITORS
    # is a comma-separated string for the same reason as CORS_ORIGINS_RAW
    # below - pydantic-settings would otherwise try (and fail) to JSON-decode
    # a plain "a,b,c" env value before any custom parsing runs.
    TARGET_BRAND: str = Field(default="Linear")
    COMPETITORS_RAW: str = Field(default="Jira,Asana,Monday,Notion", alias="COMPETITORS")
    DEFAULT_ITERATIONS_PER_PROMPT: int = Field(default=5, ge=1, le=20)

    @property
    def COMPETITORS(self) -> List[str]:  # noqa: N802 - matches env var name
        return [c.strip() for c in self.COMPETITORS_RAW.split(",") if c.strip()]

    # CORS - comma separated list of allowed origins. Kept as a plain str
    # field (not List[str]) because pydantic-settings tries to JSON-decode
    # complex-typed env vars before any validator runs, which breaks on a
    # plain "a,b,c" value from .env.
    CORS_ORIGINS_RAW: str = Field(
        default="http://localhost:5173,http://localhost:8000", alias="CORS_ORIGINS"
    )

    @property
    def CORS_ORIGINS(self) -> List[str]:  # noqa: N802 - matches env var name
        return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(",") if origin.strip()]

    @property
    def all_brands(self) -> List[str]:
        return [self.TARGET_BRAND, *self.COMPETITORS]


settings = Settings()
