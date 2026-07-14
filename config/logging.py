"""
Structured logging configuration using structlog.

Phase 14: REPLACE - Replace print statements with structlog for deterministic, replay-safe logging.

This is infrastructure only - no constitutional code changes.
"""

import structlog
from typing import Any
from config.settings import get_settings


def configure_logging() -> None:
    """Configure structlog for structured logging (Phase 14: REPLACE)"""
    settings = get_settings()
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer() if settings.log_format == "json" else structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(settings.log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structured logger with the given name"""
    return structlog.get_logger(name)
