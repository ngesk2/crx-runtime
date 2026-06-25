#!/usr/bin/env python3
"""
Observation Worker

Consumes: DOCUMENT_IMPORTED
Produces: OBSERVATION_CREATED

Extracts chunks from document text and creates observation events.
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


def handle_document_imported(event: Event) -> Optional[Event]:
    """Handle DOCUMENT_IMPORTED event, produce OBSERVATION_CREATED events."""
    logger.info(f"Processing DOCUMENT_IMPORTED event: {event.event_id}")

    try:
        event_data = event.event_data
        content = event_data.get('content', '')
        document_id = event.aggregate_id

        if not content:
            logger.warning(f"No content in event {event.event_id}")
            return None

        # Simple chunking: split by paragraphs
        chunks = []
        paragraphs = content.split('\n\n')
        chunk_size = 3  # paragraphs per chunk

        for i in range(0, len(paragraphs), chunk_size):
            chunk_text = '\n\n'.join(paragraphs[i:i+chunk_size])
            if chunk_text.strip():
                chunks.append(chunk_text)

        logger.info(f"Extracted {len(chunks)} chunks from document {document_id}")

        # Emit observation events for each chunk
        for i, chunk in enumerate(chunks):
            observation_data = {
                'document_id': document_id,
                'chunk_index': i,
                'chunk_text': chunk,
                'chunk_id': f"{document_id}_chunk_{i}",
                'source': event_data.get('source', 'unknown')
            }

            observation_event_id = emit_event(
                event_type='OBSERVATION_CREATED',
                aggregate_id=document_id,
                aggregate_type='document',
                event_data=observation_data
            )

            if observation_event_id:
                logger.info(f"Created observation {observation_event_id} for chunk {i}")

        # Return a summary event
        summary_event = Event(
            event_id=str(event.event_id) + "_processed",
            event_type='DOCUMENT_PROCESSED',
            timestamp=event.timestamp,
            aggregate_id=document_id,
            aggregate_type='document',
            event_data={
                'original_event_id': event.event_id,
                'chunks_created': len(chunks)
            }
        )

        return summary_event

    except Exception as e:
        logger.error(f"Error handling DOCUMENT_IMPORTED: {e}")
        raise
