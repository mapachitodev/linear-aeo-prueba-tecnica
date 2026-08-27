"""FastAPI v1 routes: health, survey execution, and live single-prompt evaluation."""

from datetime import datetime, timezone

from fastapi import APIRouter

from backend.app.core.config import settings
from backend.app.models.schemas import (
    EvaluateRequest,
    EvaluateResponse,
    HealthResponse,
    SurveyRunRequest,
    SurveyStatusResponse,
)
from backend.app.services import survey_service

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        gemini_configured=bool(settings.GEMINI_API_KEY),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.post("/survey/run", response_model=SurveyStatusResponse, tags=["Surveys"])
async def run_survey(payload: SurveyRunRequest) -> SurveyStatusResponse:
    """Runs the full 18-prompt calibrated audit to completion and returns the
    finished result in one response. Deliberately synchronous (no background
    task, no server-side survey-id to poll): the deploy target is Vercel
    serverless, where nothing guarantees a function keeps running - or a
    later poll hits the same instance - once a response has been sent. The
    frontend persists the result client-side (localStorage) for "latest" and
    "history" instead of asking the server to remember it (see
    survey_service.run_survey and DECISIONS.md)."""
    result = await survey_service.run_survey(payload.iterations_per_prompt, payload.temperature, payload.model_name)
    return SurveyStatusResponse(**result)


@router.post("/evaluate", response_model=EvaluateResponse, tags=["Live"])
async def evaluate_prompt(payload: EvaluateRequest) -> EvaluateResponse:
    """Runs a single ad-hoc prompt through Gemini for the 'live query' explorer tab."""
    result = await survey_service.evaluate_single(payload.prompt, payload.temperature)
    return EvaluateResponse(**result)
