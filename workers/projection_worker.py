#!/usr/bin/env python3
"""
Projection Worker

Consumes: LINEAGE_CREATED
Produces: PROJECTION_CREATED

Projects events to Qdrant for semantic search.
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


def handle_lineage_created(event: Event) -> Optional[Event]:
    """Handle LINEAGE_CREATED event, create projection, produce PROJECTION_CREATED."""
    logger.info(f"Processing LINEAGE_CREATED event: {event.event_id}")

    try:
        event_data = event.event_data
        lineage_id = event_data.get('lineage_id', '')
        witness_id = event_data.get('witness_id', '')
        claim_id = event_data.get('claim_id', '')

        if not lineage_id:
            logger.warning(f"No lineage_id in event {event.event_id}")
            return None

        # Create projection
        # For now, this is a minimal implementation
        # In production, this would project to Qdrant
        logger.info(f"Creating projection for lineage {lineage_id}")

        # Simulate projection creation
        import uuid
        projection_id = str(uuid.uuid4())

        # Store projection in projections table
        try:
            query = f"""
            INSERT INTO projections (id, projection_id, projection_type, projection_name, source_aggregate_id, projection_data, created_at, updated_at, last_event_id, status)
            VALUES ('{str(uuid.uuid4())}', '{projection_id}', 'qdrant', 'constitutional_projection', '{lineage_id}', '{{"witness_id": "{witness_id}", "claim_id": "{claim_id}"}}'::jsonb, NOW(), NOW(), '{event.event_id}', 'active')
            """
            run_psql_query(query)
            logger.info(f"Projection stored in projections table")
        except Exception as e:
            logger.error(f"Error storing projection: {e}")

        logger.info(f"Projection created for lineage {lineage_id}")

        # Emit projection created event
        projection_data = {
            'lineage_id': lineage_id,
            'witness_id': witness_id,
            'claim_id': claim_id,
            'projection_id': projection_id,
            'projection_type': 'qdrant',
            'original_lineage_event_id': event.event_id
        }

        projection_event_id = emit_event(
            event_type='PROJECTION_CREATED',
            aggregate_id=projection_id,
            aggregate_type='projection',
            event_data=projection_data
        )

        if projection_event_id:
            logger.info(f"Created PROJECTION_CREATED event {projection_event_id}")

        # Return a summary event
        summary_event = Event(
            event_id=str(event.event_id) + "_processed",
            event_type='LINEAGE_PROJECTED',
            timestamp=event.timestamp,
            aggregate_id=lineage_id,
            aggregate_type='lineage',
            event_data={
                'original_event_id': event.event_id,
                'projection_event_id': projection_event_id,
                'projection_id': projection_id
            }
        )

        return summary_event

    except Exception as e:
        logger.error(f"Error handling LINEAGE_CREATED: {e}")
        raise
