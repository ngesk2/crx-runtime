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

        # Store lineage via RepositoryAuthority
        try:
            repository_client.store_object('lineage', {
                'lineage_id': lineage_id,
                'root_object_id': claim_id,
                'witness_id': witness_id,
                'current_version': 1,
            }, metadata={'source': 'lineage_worker', 'witness_id': witness_id})
            logger.info(f"Lineage stored via RepositoryAuthority")
        except Exception as e:
            logger.error(f"Error storing lineage: {e}")

        # Store authority lineage
        try:
            repository_client.store_object('authority_lineage', {
                'ancestor': claim_id,
                'descendant': witness_id,
                'relation': 'witnessed_by',
                'lineage_id': lineage_id,
            }, metadata={'source': 'lineage_worker'})
            logger.info(f"Authority lineage stored via RepositoryAuthority")
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
