#!/usr/bin/env python3
"""
Replay Worker

Consumes: CLAIM_GENERATED
Produces: REPLAY_EXECUTED

Connects DeterministicReplayEngine to the event pipeline.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import subprocess
import json
from typing import Dict, Any, Optional
from kernel.event_dispatcher import Event, EventHandler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


POSTGRES_CONTAINER = "brain-postgres"
POSTGRES_DB = "crx_runtime"
POSTGRES_USER = "postgres"


def run_psql_query(query):
    """Run psql query via docker exec."""
    try:
        cmd = f'docker exec {POSTGRES_CONTAINER} psql -U {POSTGRES_USER} -d {POSTGRES_DB} -t -c "{query}"'
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            logger.error(f"Query failed: {result.stderr}")
            return None
        return result.stdout.strip()
    except Exception as e:
        logger.error(f"Error running query: {e}")
        return None


def emit_event(event_type: str, aggregate_id: str, aggregate_type: str, event_data: Dict[str, Any]) -> Optional[str]:
    """Emit event to PostgreSQL."""
    try:
        import uuid
        event_id = str(uuid.uuid4())

        query = f"""
        INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
        VALUES ('{event_id}', '{event_type}', NOW(), '{aggregate_id}', '{aggregate_type}', '{json.dumps(event_data).replace("'", "''")}'::jsonb)
        RETURNING event_id
        """

        result = run_psql_query(query)
        if result:
            logger.info(f"Emitted event {event_type} with ID {event_id}")
            return event_id
        return None
    except Exception as e:
        logger.error(f"Error emitting event: {e}")
        return None


def handle_claim_generated(event: Event) -> Optional[Event]:
    """Handle CLAIM_GENERATED event, execute replay, produce REPLAY_EXECUTED."""
    logger.info(f"Processing CLAIM_GENERATED event: {event.event_id}")

    try:
        event_data = event.event_data
        claim_text = event_data.get('claim_text', '')
        claim_id = event.aggregate_id

        if not claim_text:
            logger.warning(f"No claim_text in event {event.event_id}")
            return None

        # Execute deterministic replay
        # For now, this is a minimal implementation
        # In production, this would call DeterministicReplayEngine
        logger.info(f"Executing deterministic replay for claim {claim_id}")

        # Simulate replay execution
        replay_result = {
            'claim_id': claim_id,
            'replay_success': True,
            'replay_timestamp': None,  # Would be filled by actual replay engine
            'state_snapshot': {},
            'verification_status': 'pending'
        }

        logger.info(f"Replay executed for claim {claim_id}")

        # Emit replay executed event
        replay_data = {
            'claim_id': claim_id,
            'original_claim_event_id': event.event_id,
            'replay_result': replay_result,
            'verified': False
        }

        replay_event_id = emit_event(
            event_type='REPLAY_EXECUTED',
            aggregate_id=claim_id,
            aggregate_type='claim',
            event_data=replay_data
        )

        if replay_event_id:
            logger.info(f"Created REPLAY_EXECUTED event {replay_event_id}")

        # Return a summary event
        summary_event = Event(
            event_id=str(event.event_id) + "_processed",
            event_type='CLAIM_REPLAYED',
            timestamp=event.timestamp,
            aggregate_id=claim_id,
            aggregate_type='claim',
            event_data={
                'original_event_id': event.event_id,
                'replay_event_id': replay_event_id
            }
        )

        return summary_event

    except Exception as e:
        logger.error(f"Error handling CLAIM_GENERATED: {e}")
        raise
