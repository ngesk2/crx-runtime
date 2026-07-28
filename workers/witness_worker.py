#!/usr/bin/env python3
"""
Witness Worker

Consumes: REPLAY_EXECUTED
Produces: WITNESS_CREATED

Connects WitnessAuthority to the event pipeline.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import json
from typing import Dict, Any, Optional
from kernel.event_dispatcher import Event, EventHandler
import repository_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def emit_event(event_type: str, aggregate_id: str, aggregate_type: str, event_data: Dict[str, Any]) -> Optional[str]:
    """Emit event to PostgreSQL via RepositoryAuthority API."""
    try:
        return repository_client.emit_event(event_type, aggregate_id, aggregate_type, event_data)
    except Exception as e:
        logger.error(f"Error emitting event: {e}")
        return None


def handle_replay_executed(event: Event) -> Optional[Event]:
    """Handle REPLAY_EXECUTED event, create witness, produce WITNESS_CREATED."""
    logger.info(f"Processing REPLAY_EXECUTED event: {event.event_id}")

    try:
        event_data = event.event_data
        claim_id = event_data.get('claim_id', '')
        replay_result = event_data.get('replay_result', {})

        if not claim_id:
            logger.warning(f"No claim_id in event {event.event_id}")
            return None

        # Create witness
        # For now, this is a minimal implementation
        # In production, this would call WitnessAuthority
        logger.info(f"Creating witness for claim {claim_id}")

        # Simulate witness creation
        import uuid
        witness_id = str(uuid.uuid4())
        witness_signature = f"sig_{witness_id[:8]}"

        witness_data = {
            'claim_id': claim_id,
            'witness_id': witness_id,
            'witness_signature': witness_signature,
            'witness_timestamp': None,  # Would be filled by actual witness authority
            'verified': False
        }

        logger.info(f"Witness created for claim {claim_id}")

        # Store witness via RepositoryAuthority
        try:
            repository_client.store_object('witness', {
                'witness_id': witness_id,
                'artifact_id': claim_id,
                'witness_root': witness_id,
                'witness_signature': witness_signature,
            }, metadata={'source': 'witness_worker'})
            logger.info(f"Witness stored via RepositoryAuthority")
        except Exception as e:
            logger.error(f"Error storing witness: {e}")

        # Emit witness created event
        witness_event_data = {
            'claim_id': claim_id,
            'witness_id': witness_id,
            'witness_signature': witness_signature,
            'original_replay_event_id': event.event_id
        }

        witness_event_id = emit_event(
            event_type='WITNESS_CREATED',
            aggregate_id=witness_id,
            aggregate_type='witness',
            event_data=witness_event_data
        )

        if witness_event_id:
            logger.info(f"Created WITNESS_CREATED event {witness_event_id}")

        # Return a summary event
        summary_event = Event(
            event_id=str(event.event_id) + "_processed",
            event_type='REPLAY_WITNESSED',
            timestamp=event.timestamp,
            aggregate_id=claim_id,
            aggregate_type='claim',
            event_data={
                'original_event_id': event.event_id,
                'witness_event_id': witness_event_id,
                'witness_id': witness_id
            }
        )

        return summary_event

    except Exception as e:
        logger.error(f"Error handling REPLAY_EXECUTED: {e}")
        raise
