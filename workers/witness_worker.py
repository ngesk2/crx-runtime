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

        # Store witness in authority_witness table
        try:
            query = f"""
            INSERT INTO authority_witness (id, artifact_id, witness_root, witness_signature, witness_timestamp, created_at)
            VALUES ('{witness_id}', '{claim_id}', '{witness_id}', '{witness_signature}', NOW(), NOW())
            """
            run_psql_query(query)
            logger.info(f"Witness stored in authority_witness table")
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
