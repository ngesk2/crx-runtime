"""PostHog Mirror - PING delivers canonical business events to PostHog.

PING guarantees delivery; HPP owns interpretation.
PostHog is a projection of canonical events, not the source of truth
(BI Boundary). PING reads dashboards read-only.

Delivery is best-effort: if PostHog is not configured (no API key) or a
delivery fails, the event is still persisted in the canonical event store.
"""

import os
import logging
from typing import Any

logger = logging.getLogger(__name__)


class PostHogMirror:
    """Best-effort delivery of canonical events to PostHog."""

    def __init__(self) -> None:
        self.api_key = os.getenv("POSTHOG_API_KEY")
        self.host = os.getenv("POSTHOG_HOST", "https://app.posthog.com")
        self.enabled = bool(self.api_key)

    async def deliver(self, event: dict[str, Any]) -> None:
        """Deliver a canonical event to PostHog. Non-fatal on failure."""
        if not self.enabled:
            return
        try:
            import httpx

            payload = {
                "api_key": self.api_key,
                "event": event.get("event_type"),
                "properties": {
                    **(event.get("payload") or {}),
                    "event_id": event.get("event_id"),
                },
                "timestamp": event.get("occurred_at") or event.get("recorded_at"),
            }
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{self.host}/capture/",
                    json=payload,
                    timeout=5.0,
                )
        except Exception as e:  # noqa: BLE001 - best-effort mirror
            logger.warning("PostHog delivery failed (non-fatal)", error=str(e))
