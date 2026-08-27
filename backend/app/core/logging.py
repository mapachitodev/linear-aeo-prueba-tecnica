"""Minimal structured-ish logging setup (stdlib only, no extra dependency)."""

import logging
import sys

from backend.app.core.config import settings

logger = logging.getLogger("aeo.analytics")


def setup_logging() -> None:
    """Configures a single stdout handler with a compact, greppable format."""
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s", datefmt="%Y-%m-%dT%H:%M:%S")
    )

    logger.handlers.clear()
    logger.addHandler(handler)
    logger.setLevel(level)
    logger.propagate = False
