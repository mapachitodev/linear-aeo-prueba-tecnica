"""Async Gemini REST client with bounded concurrency and jittered retries.

Uses the raw `generateContent` REST endpoint via httpx instead of the
`google-genai` SDK: one dependency less, full control over concurrency
(asyncio.Semaphore) and retry/backoff behaviour, and no opaque wrapper
between us and the documented API contract.
"""

import asyncio
import random
import time
from typing import Optional, Dict, Any

import httpx

from backend.app.core.config import settings
from backend.app.core.logging import logger


class GeminiClientError(RuntimeError):
    """Raised when Gemini cannot be reached after all retries."""


class GeminiAsyncClient:
    """Non-blocking Gemini API client with a shared concurrency guard."""

    def __init__(self, api_key: Optional[str] = None, max_concurrency: Optional[int] = None):
        self.api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        self._semaphore = asyncio.Semaphore(max_concurrency or settings.GEMINI_MAX_CONCURRENCY)
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate_content(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        """Runs one prompt through Gemini. Falls back to a clearly-flagged
        simulated response when no API key is configured, so local dev and
        tests don't require live network access."""
        model_name = model or settings.GEMINI_DEFAULT_MODEL
        start = time.perf_counter()

        if not self.is_configured:
            await asyncio.sleep(0.05)
            return {
                "text": (
                    "1. Linear - seguimiento de incidencias rápido y centrado en el teclado, "
                    "pensado para equipos de software.\n"
                    "2. Jira - el estándar empresarial para organizaciones grandes con "
                    "requisitos de cumplimiento.\n"
                    "3. Asana - coordinación multifuncional amplia para marketing y operaciones."
                ),
                "latency_ms": (time.perf_counter() - start) * 1000.0,
                "model": model_name,
                "is_simulated": True,
            }

        url = f"{self.base_url}/models/{model_name}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {
                "parts": [{
                    "text": (
                        "Responde siempre en español neutro, sin importar el idioma en el que "
                        "esté redactada la pregunta. No traduzcas ni alteres nombres propios de "
                        "marcas o productos (p. ej. Linear, Jira, Asana, Monday, Notion)."
                    )
                }]
            },
            "generationConfig": {"temperature": temperature, "topK": 40, "topP": 0.95},
        }

        async with self._semaphore:
            last_error: Optional[Exception] = None
            for attempt in range(1, max_retries + 1):
                try:
                    async with httpx.AsyncClient(timeout=settings.GEMINI_TIMEOUT_SECONDS) as client:
                        response = await client.post(url, json=payload)
                        response.raise_for_status()
                        data = response.json()

                    candidates = data.get("candidates", [])
                    text = ""
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        text = "".join(part.get("text", "") for part in parts)

                    return {
                        "text": text,
                        "latency_ms": (time.perf_counter() - start) * 1000.0,
                        "model": model_name,
                        "is_simulated": False,
                    }
                except httpx.HTTPStatusError as exc:
                    last_error = exc
                    # Only rate-limit (429) and server errors (5xx) are worth
                    # retrying. A 404 (bad model name) or 400 (bad request)
                    # will fail identically every time - retrying just adds
                    # latency without any chance of succeeding.
                    if exc.response.status_code not in (429,) and exc.response.status_code < 500:
                        raise GeminiClientError(f"Gemini rejected the request ({exc.response.status_code}): {exc}") from exc
                    logger.warning(
                        "gemini_call_failed attempt=%s/%s status=%s prompt=%.40s",
                        attempt, max_retries, exc.response.status_code, prompt,
                    )
                    if attempt < max_retries:
                        backoff = 0.5 * (2 ** (attempt - 1)) + random.uniform(0, 0.25)
                        await asyncio.sleep(backoff)
                except httpx.RequestError as exc:
                    last_error = exc
                    logger.warning(
                        "gemini_call_failed attempt=%s/%s error=%s prompt=%.40s",
                        attempt, max_retries, exc, prompt,
                    )
                    if attempt < max_retries:
                        backoff = 0.5 * (2 ** (attempt - 1)) + random.uniform(0, 0.25)
                        await asyncio.sleep(backoff)

            raise GeminiClientError(f"Gemini request failed after {max_retries} attempts: {last_error}")
