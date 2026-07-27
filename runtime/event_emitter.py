"""Shared event emitter — canonical Observation Layer connection.

Wires existing subsystems (providers, oracle, replay, hermes) to emit
canonical events into the event store + NATS, reusing the SAME path
as the /events API (EventEnvelope.create -> persist -> publish).

This is a CONNECTION, not new infrastructure (WAVE 4B philosophy):
every important state transition emits a canonical event, making the
runtime observable (Step 1 of the intelligence-runtime transition).

Per the north star: observe -> understand -> propose -> act -> verify.
Nothing here is new; it connects already-built pieces
(EventEnvelope, EventModel store, NATS transport, EventBus projection).
"""

import logging
from datetime import datetime, timezone
from typing import Any

from constitution.models.event import EventEnvelope, InfrastructureEvent
from storage.postgres.database import get_session
from storage.postgres.models import EventModel
from transport.nats.transport import get_nats_transport

logger = logging.getLogger(__name__)


async def emit_event(
    event_type: str,
    payload: dict[str, Any],
    producer_id: str | None = None,
    correlation_id: str | None = None,
    occurred_at: datetime | None = None,
) -> str:
    """Emit a canonical InfrastructureEvent into the store + NATS.

    Mirrors the /events POST path: EventEnvelope.create -> persist
    EventModel -> publish to NATS (EventBus re-projects). No new
    infrastructure — this is a wiring connection, not a new layer.

    Best-effort: a producer (e.g. a notification provider) must
    NEVER fail because BI event persistence is unavailable. Any
    error is logged and swallowed.
    """
    try:
        occurred = occurred_at or datetime.now(timezone.utc)
        event = InfrastructureEvent.create(
            event_type=event_type,
            event_category="InfrastructureEvent",
            payload=payload,
            occurred_at=occurred,
            recorded_at=datetime.now(timezone.utc),
            schema_version="1.0.0",
            global_sequence=0,  # Database assigns the real sequence
            producer_id=producer_id,
            correlation_id=correlation_id,
        )

        # Persist (feeds BI layer: /business, /ceo read the store)
        try:
            async with get_session() as session:
                event_record = EventModel(
                    event_id=event.event_id,
                    event_type=event.event_type,
                    event_category=event.event_category,
                    payload=event.payload,
                    occurred_at=event.occurred_at,
                    recorded_at=event.recorded_at,
                    correlation_id=event.correlation_id,
                    producer_id=event.producer_id,
                    schema_version=event.schema_version,
                    global_sequence=event.global_sequence,
                    event_hash=event.event_id,
                )
                session.add(event_record)
                await session.commit()
        except Exception as e:
            logger.warning(
                "emit_event: persistence failed (event still published if NATS up)",
                event_type=event_type, error=str(e),
            )

        # Publish to NATS (EventBus re-projects; downstream observes)
        try:
            nats_transport = await get_nats_transport()
            await nats_transport.publish(
                f"constitutional.events.{event.event_type}",
                event.model_dump(mode='json'),
            )
        except Exception as e:
            logger.warning(
                "emit_event: NATS publish failed (event persisted)",
                event_type=event_type, error=str(e),
            )

        return event.event_id
    except Exception as e:
        # Never fail the caller (a provider send, a replay step, etc.)
        logger.warning(
            "emit_event: skipped", event_type=event_type, error=str(e),
        )
        return ""
