#!/usr/bin/env python3
"""
Constitutional Runtime

Continuous event consumer that processes events through the constitutional pipeline.

Pipeline:
DOCUMENT_IMPORTED → OBSERVATION_CREATED → CLAIM_GENERATED → REPLAY_EXECUTED → WITNESS_CREATED → LINEAGE_CREATED → PROJECTION_CREATED
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import subprocess
import json
import time
import uuid
from typing import List, Dict, Any, Optional
from kernel.event_dispatcher import Event, get_dispatcher, register_event_handlers

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


POSTGRES_CONTAINER = "brain-postgres"
POSTGRES_DB = "crx_runtime"
POSTGRES_USER = "postgres"
SLEEP_INTERVAL = 0.5  # seconds
BATCH_SIZE = 10


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


def fetch_unprocessed_events(limit: int = BATCH_SIZE) -> List[Event]:
    """Fetch unprocessed events from PostgreSQL."""
    try:
        # Get events that are not in event_processing table
        query = f"""
        SELECT e.event_id, e.event_type, e.timestamp, e.aggregate_id, e.aggregate_type, e.event_data
        FROM events e
        LEFT JOIN event_processing ep ON e.event_id = ep.event_id
        WHERE ep.event_id IS NULL
        ORDER BY e.timestamp ASC
        LIMIT {limit}
        """

        output = run_psql_query(query)
        if not output:
            return []

        events = []
        for line in output.split('\n'):
            line = line.strip()
            if line and '|' in line:
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 6 and parts[0] != 'event_id':
                    try:
                        event_data = json.loads(parts[5]) if parts[5] else {}
                        events.append(Event(
                            event_id=parts[0],
                            event_type=parts[1],
                            timestamp=parts[2],
                            aggregate_id=parts[3],
                            aggregate_type=parts[4],
                            event_data=event_data
                        ))
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse event_data for event {parts[0]}")

        logger.info(f"Fetched {len(events)} unprocessed events")
        return events

    except Exception as e:
        logger.error(f"Error fetching unprocessed events: {e}")
        return []


def mark_event_processed(event_id: str, worker: str = "constitutional_runtime"):
    """Mark event as processed in event_processing table."""
    try:
        query = f"""
        INSERT INTO event_processing (event_id, processed, processed_at, worker, retries)
        VALUES ('{event_id}', TRUE, NOW(), '{worker}', 0)
        ON CONFLICT (event_id) DO UPDATE SET
            processed = TRUE,
            processed_at = NOW(),
            worker = '{worker}',
            retries = event_processing.retries
        """

        result = run_psql_query(query)
        if result:
            logger.info(f"Marked event {event_id} as processed")
            return True
        return False

    except Exception as e:
        logger.error(f"Error marking event {event_id} as processed: {e}")
        return False


def mark_event_failed(event_id: str, error: str, worker: str = "constitutional_runtime"):
    """Mark event as failed in event_processing table."""
    try:
        query = f"""
        INSERT INTO event_processing (event_id, processed, processed_at, worker, retries, last_error)
        VALUES ('{event_id}', FALSE, NOW(), '{worker}', 1, '{error.replace("'", "''")}')
        ON CONFLICT (event_id) DO UPDATE SET
            processed = FALSE,
            processed_at = NOW(),
            worker = '{worker}',
            retries = event_processing.retries + 1,
            last_error = '{error.replace("'", "''")}'
        """

        result = run_psql_query(query)
        if result:
            logger.info(f"Marked event {event_id} as failed")
            return True
        return False

    except Exception as e:
        logger.error(f"Error marking event {event_id} as failed: {e}")
        return False


def process_event(event: Event, dispatcher) -> bool:
    """Process a single event through the dispatcher."""
    try:
        logger.info(f"Processing event {event.event_id} of type {event.event_type}")

        # Dispatch event to handler
        result = dispatcher.dispatch(event)

        # Mark as processed
        mark_event_processed(event.event_id)

        logger.info(f"Successfully processed event {event.event_id}")
        return True

    except Exception as e:
        logger.error(f"Error processing event {event.event_id}: {e}")
        mark_event_failed(event.event_id, str(e))
        return False


def run_runtime_loop():
    """Main runtime loop."""
    logger.info("=" * 60)
    logger.info("Starting Constitutional Runtime")
    logger.info("=" * 60)

    # Register event handlers
    register_event_handlers()

    # Get dispatcher
    dispatcher = get_dispatcher()

    logger.info("Runtime loop started")
    iteration = 0

    try:
        while True:
            iteration += 1
            logger.info(f"Runtime iteration {iteration}")

            # Fetch unprocessed events
            events = fetch_unprocessed_events(BATCH_SIZE)

            if not events:
                logger.info("No unprocessed events, sleeping...")
                time.sleep(SLEEP_INTERVAL)
                continue

            # Process each event
            processed_count = 0
            failed_count = 0

            for event in events:
                if process_event(event, dispatcher):
                    processed_count += 1
                else:
                    failed_count += 1

            logger.info(f"Processed {processed_count} events, {failed_count} failed")

            # Small sleep between batches
            time.sleep(SLEEP_INTERVAL)

    except KeyboardInterrupt:
        logger.info("Runtime interrupted by user")
    except Exception as e:
        logger.error(f"Fatal error in runtime loop: {e}")
        raise


def main():
    """Main entry point."""
    try:
        run_runtime_loop()
    except Exception as e:
        logger.error(f"Runtime failed: {e}")
        return 1

    logger.info("Runtime stopped")
    return 0


if __name__ == '__main__':
    exit(main())
