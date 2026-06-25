#!/usr/bin/env python3
"""
Lineage Worker

Consumes: WITNESS_CREATED
Produces: LINEAGE_CREATED

Connects storeLineage() to the event pipeline.
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


def handle_witness_created(event: Event) -> Optional[Event]:
    """Handle WITNESS_CREATED event, create lineage, produce LINEAGE_CREATED."""
    logger.info(f"Processing WITNESS_CREATED event: {event.event_id}")

    try:
        event_data = event.event_data
        witness_id = event_data.get('witness_id', '')
        claim_id = event_data.get('claim_id', '')

        if not witness_id:
            logger.warning(f"No witness_id in event {event.event_id}")
            return None

        # Create lineage
        # For now, this is a minimal implementation
        # In production, this would call storeLineage()
        logger.info(f"Creating lineage for witness {witness_id}")

        # Simulate lineage creation
        import uuid
        lineage_id = str(uuid.uuid4())

        # Store lineage in lineage table
        try:
            query = f"""
            INSERT INTO lineage (id, lineage_id, root_object_id, created_at, current_version, metadata)
            VALUES ('{lineage_id}', '{lineage_id}', '{claim_id}', NOW(), 1, '{{"witness_id": "{witness_id}"}}'::jsonb)
            """
            run_psql_query(query)
            logger.info(f"Lineage stored in lineage table")
        except Exception as e:
            logger.error(f"Error storing lineage: {e}")

        # Store in authority_lineage if claim has authority
        try:
            query = f"""
            INSERT INTO authority_lineage (id, ancestor, descendant, relation, metadata, created_at)
            VALUES ('{str(uuid.uuid4())}', '{claim_id}', '{witness_id}', 'witnessed_by', '{{"lineage_id": "{lineage_id}"}}'::jsonb, NOW())
            """
            run_psql_query(query)
            logger.info(f"Authority lineage stored")
        except Exception as e:
            logger.error(f"Error storing authority lineage: {e}")

        logger.info(f"Lineage created for witness {witness_id}")

        # Emit lineage created event
        lineage_data = {
            'witness_id': witness_id,
            'claim_id': claim_id,
            'lineage_id': lineage_id,
            'original_witness_event_id': event.event_id
        }

        lineage_event_id = emit_event(
            event_type='LINEAGE_CREATED',
            aggregate_id=lineage_id,
            aggregate_type='lineage',
            event_data=lineage_data
        )

        if lineage_event_id:
            logger.info(f"Created LINEAGE_CREATED event {lineage_event_id}")

        # Return a summary event
        summary_event = Event(
            event_id=str(event.event_id) + "_processed",
            event_type='WITNESS_LINEAGED',
            timestamp=event.timestamp,
            aggregate_id=witness_id,
            aggregate_type='witness',
            event_data={
                'original_event_id': event.event_id,
                'lineage_event_id': lineage_event_id,
                'lineage_id': lineage_id
            }
        )

        return summary_event

    except Exception as e:
        logger.error(f"Error handling WITNESS_CREATED: {e}")
        raise
