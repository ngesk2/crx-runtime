#!/usr/bin/env python3
"""
Claim Worker

Consumes: OBSERVATION_CREATED
Produces: CLAIM_GENERATED

Generates propositions from observations using a small local model.
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


def handle_observation_created(event: Event) -> Optional[Event]:
    """Handle OBSERVATION_CREATED event, produce CLAIM_GENERATED events."""
    logger.info(f"Processing OBSERVATION_CREATED event: {event.event_id}")

    try:
        event_data = event.event_data
        chunk_text = event_data.get('chunk_text', '')
        document_id = event_data.get('document_id', '')
        chunk_id = event_data.get('chunk_id', '')

        if not chunk_text:
            logger.warning(f"No chunk_text in event {event.event_id}")
            return None

        # Simple proposition extraction: extract sentences that look like claims
        # This is a minimal implementation - in production, use a real model
        import re

        # Split into sentences
        sentences = re.split(r'[.!?]+', chunk_text)

        # Filter for sentences that look like claims (have certain keywords)
        claim_keywords = ['is', 'are', 'should', 'must', 'will', 'can', 'because', 'therefore', 'thus', 'since']
        claims = []

        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 20 and any(keyword in sentence.lower() for keyword in claim_keywords):
                claims.append(sentence)

        logger.info(f"Extracted {len(claims)} claims from observation {chunk_id}")

        # Emit claim events for each claim
        for i, claim_text in enumerate(claims):
            claim_data = {
                'document_id': document_id,
                'chunk_id': chunk_id,
                'claim_text': claim_text,
                'claim_index': i,
                'confidence': 0.7,  # Placeholder confidence
                'verified': False
            }

            claim_event_id = emit_event(
                event_type='CLAIM_GENERATED',
                aggregate_id=chunk_id,
                aggregate_type='observation',
                event_data=claim_data
            )

            if claim_event_id:
                logger.info(f"Created claim {claim_event_id} for claim {i}")

        # Return a summary event
        summary_event = Event(
            event_id=str(event.event_id) + "_processed",
            event_type='OBSERVATION_PROCESSED',
            timestamp=event.timestamp,
            aggregate_id=chunk_id,
            aggregate_type='observation',
            event_data={
                'original_event_id': event.event_id,
                'claims_created': len(claims)
            }
        )

        return summary_event

    except Exception as e:
        logger.error(f"Error handling OBSERVATION_CREATED: {e}")
        raise
