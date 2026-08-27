"""Orchestrates AEO survey batches: fans prompts x repetitions out to Gemini,
parses every response for all tracked brands, and aggregates per-brand
statistics.

Runs synchronously within a single request/response instead of a
BackgroundTasks job polled through server-side state: the deploy target is
Vercel serverless, where a function is not guaranteed to keep running (or
keep its in-memory state) once a response has been sent, and there's no
guarantee a later poll hits the same warm instance. Deliberately still no
Redis/Postgres (see DECISIONS.md) - the "no external state store" call
still holds, it just means the survey result and history now live in the
browser (localStorage) instead of a process-local dict, since a request/
response is the only unit of state Vercel functions actually guarantee.
"""

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.core.prompts import CALIBRATED_PROMPTS
from backend.app.models.schemas import PromptEvaluationResult
from backend.app.services.gemini_client import GeminiAsyncClient
from backend.app.services.metrics_engine import MetricsEngine
from backend.app.services.parser import HeuristicParser

# Single shared client so GEMINI_MAX_CONCURRENCY is a true process-wide cap,
# whether calls come from a batch survey or a one-off live evaluation.
_client = GeminiAsyncClient()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_parser() -> HeuristicParser:
    return HeuristicParser(target_brand=settings.TARGET_BRAND, competitors=list(settings.COMPETITORS))


async def _run_one_iteration(
    prompt: dict, rep: int, model_name: str, temperature: float, parser: HeuristicParser
) -> PromptEvaluationResult:
    raw = await _client.generate_content(prompt=prompt["text"], model=model_name, temperature=temperature)
    text = raw.get("text", "")
    entities = parser.extract_entities(text)

    target_entity = next(
        (e for e in entities if e.brand_name.lower() == settings.TARGET_BRAND.lower()), None
    )

    return PromptEvaluationResult(
        iteration_id=f"{prompt['id']}_REP_{rep + 1}",
        prompt_id=prompt["id"],
        prompt_text=prompt["text"],
        category=prompt["category"],
        language=prompt["language"],
        model_name=raw.get("model", model_name),
        raw_response=text,
        latency_ms=raw.get("latency_ms", 0.0),
        is_simulated=raw.get("is_simulated", False),
        target_mentioned=target_entity is not None,
        target_rank=target_entity.rank if target_entity else None,
        target_sentiment=target_entity.sentiment if target_entity else "Neutro",
        co_occurring_brands=[e.brand_name for e in entities],
        parsed_entities=entities,
    )


def _build_key_findings(target: str, metrics_by_brand: Dict[str, dict]) -> List[str]:
    target_m = metrics_by_brand[target]
    competitors = {b: m for b, m in metrics_by_brand.items() if b != target}
    findings = [
        f"{target} aparece en el {target_m['visibility_rate']:.0f}% de las respuestas "
        f"(posición media #{target_m['avg_position']:.1f}, desviación estándar {target_m['position_std_dev']:.2f})."
    ]
    if competitors:
        closest = max(competitors.values(), key=lambda m: m["visibility_rate"])
        gap = target_m["visibility_rate"] - closest["visibility_rate"]
        if abs(gap) < 1:
            findings.append(f"{target} empata en visibilidad con su competidor más visible ({closest['brand']}).")
        else:
            verb = "supera a" if gap > 0 else "queda detrás de"
            findings.append(
                f"{target} {verb} su competidor más visible ({closest['brand']}) por {abs(gap):.0f} puntos de visibilidad."
            )
    findings.append(
        f"Top-of-mind (posición #1): {target_m['top_of_mind_rate']:.0f}% de las menciones de {target}."
    )
    findings.append(
        f"Entropía de posición: {target_m['entropy_score']:.2f} bits "
        f"(más alto = el modelo varía más el lugar donde ubica a {target} entre repeticiones)."
    )
    return findings


async def run_survey(iterations_per_prompt: int, temperature: float, model_name: Optional[str]) -> dict:
    """Runs the full calibrated batch to completion and returns the finished
    survey - status is always "completed" or the call raises, since there's
    no separate polling step for the caller to observe "running" through."""
    survey_id = f"SRV-{uuid.uuid4().hex[:8].upper()}"
    model = model_name or settings.GEMINI_DEFAULT_MODEL
    parser = _new_parser()
    created_at = _now()
    total = len(CALIBRATED_PROMPTS) * iterations_per_prompt

    results: List[PromptEvaluationResult] = []
    tasks = [
        _run_one_iteration(prompt, rep, model, temperature, parser)
        for prompt in CALIBRATED_PROMPTS
        for rep in range(iterations_per_prompt)
    ]
    completed = await asyncio.gather(*tasks, return_exceptions=True)

    for item in completed:
        if isinstance(item, PromptEvaluationResult):
            results.append(item)
        else:
            logger.error("survey_iteration_failed survey_id=%s error=%s", survey_id, item)

    brand_metrics = {
        brand: MetricsEngine.calculate_metrics(results, brand).model_dump()
        for brand in settings.all_brands
    }

    logger.info("survey_completed survey_id=%s samples=%s", survey_id, len(results))

    return {
        "survey_id": survey_id,
        "status": "completed",
        "created_at": created_at,
        "completed_at": _now(),
        "progress": total,
        "total": total,
        "error": None,
        "target_brand": settings.TARGET_BRAND,
        "brand_metrics": list(brand_metrics.values()),
        "results": [r.model_dump() for r in results],
        "key_findings": _build_key_findings(settings.TARGET_BRAND, brand_metrics),
    }


async def evaluate_single(prompt_text: str, temperature: float) -> dict:
    parser = _new_parser()
    raw = await _client.generate_content(prompt=prompt_text, model=settings.GEMINI_DEFAULT_MODEL, temperature=temperature)
    text = raw.get("text", "")
    entities = parser.extract_entities(text)
    target_entity = next((e for e in entities if e.brand_name.lower() == settings.TARGET_BRAND.lower()), None)

    return {
        "prompt": prompt_text,
        "response": text,
        "model_used": raw.get("model", settings.GEMINI_DEFAULT_MODEL),
        "is_simulated": raw.get("is_simulated", False),
        "latency_ms": raw.get("latency_ms", 0.0),
        "target_mentioned": target_entity is not None,
        "target_rank": target_entity.rank if target_entity else None,
        "target_sentiment": target_entity.sentiment if target_entity else "Neutro",
        "other_brands": [e.brand_name for e in entities],
        "timestamp": _now(),
    }
