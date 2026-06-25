#!/usr/bin/env python3
"""
Event Dispatcher

Maps event types to handlers and dispatches events for processing.
"""

import logging
from typing import Dict, Callable, Any, Optional
from dataclasses import dataclass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class Event:
    """Event data structure."""
    event_id: str
    event_type: str
    timestamp: str
    aggregate_id: str
    aggregate_type: str
    event_data: Dict[str, Any]
    causation_id: Optional[str] = None
    correlation_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


EventHandler = Callable[[Event], Optional[Event]]


class EventDispatcher:
    """Dispatches events to registered handlers."""

    def __init__(self):
        self.handlers: Dict[str, EventHandler] = {}
        logger.info("EventDispatcher initialized")

    def register_handler(self, event_type: str, handler: EventHandler):
        """Register a handler for an event type."""
        self.handlers[event_type] = handler
        logger.info(f"Registered handler for event type: {event_type}")

    def dispatch(self, event: Event) -> Optional[Event]:
        """Dispatch event to registered handler."""
        handler = self.handlers.get(event.event_type)

        if handler is None:
            logger.warning(f"No handler registered for event type: {event.event_type}")
            return None

        try:
            logger.info(f"Dispatching event {event.event_id} of type {event.event_type}")
            result = handler(event)
            logger.info(f"Event {event.event_id} processed successfully")
            return result
        except Exception as e:
            logger.error(f"Error processing event {event.event_id}: {e}")
            raise

    def get_registered_handlers(self) -> Dict[str, EventHandler]:
        """Get all registered handlers."""
        return self.handlers.copy()


# Global dispatcher instance
dispatcher = EventDispatcher()


def register_event_handlers():
    """Register all constitutional event handlers."""
    # Import handlers here to avoid circular imports
    from workers.observation_worker import handle_document_imported
    from workers.claim_worker import handle_observation_created
    from workers.replay_worker import handle_claim_generated
    from workers.witness_worker import handle_replay_executed
    from workers.lineage_worker import handle_witness_created
    from workers.projection_worker import handle_lineage_created

    # Register handlers
    dispatcher.register_handler("DOCUMENT_IMPORTED", handle_document_imported)
    dispatcher.register_handler("OBSERVATION_CREATED", handle_observation_created)
    dispatcher.register_handler("CLAIM_GENERATED", handle_claim_generated)
    dispatcher.register_handler("REPLAY_EXECUTED", handle_replay_executed)
    dispatcher.register_handler("WITNESS_CREATED", handle_witness_created)
    dispatcher.register_handler("LINEAGE_CREATED", handle_lineage_created)

    logger.info("All event handlers registered")


def get_dispatcher() -> EventDispatcher:
    """Get the global dispatcher instance."""
    return dispatcher
