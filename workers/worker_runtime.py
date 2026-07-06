#!/usr/bin/env python3
"""
Worker Runtime

Drives the constitutional worker pipeline via durable event_processing table:
  Polls /events/unprocessed → dispatches to registered handlers →
  marks processed via POST /events/processed → continues.
"""

import os
import sys
import time
import json
import logging
import urllib.request
import urllib.parse
import urllib.error

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from kernel.event_dispatcher import dispatcher, register_event_handlers, Event

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GATEWAY_URL = os.environ.get('GATEWAY_URL', 'http://gateway:8080')
POLL_INTERVAL = float(os.environ.get('POLL_INTERVAL', '5.0'))
MAX_RETRIES = int(os.environ.get('MAX_RETRIES', '3'))
WORKER_NAME = os.environ.get('WORKER_NAME', 'worker_runtime')


def _request(method, path, body=None):
    """Make an HTTP request to the gateway API."""
    url = f'{GATEWAY_URL}{path}'
    data = json.dumps(body).encode('utf-8') if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        logger.error(f'HTTP {e.code} from {method} {path}: {e.read().decode("utf-8", errors="replace")}')
        return None
    except Exception as e:
        logger.error(f'Request failed {method} {path}: {e}')
        return None


def fetch_unprocessed(limit=50):
    """Fetch unprocessed events via /events/unprocessed."""
    result = _request('GET', f'/events/unprocessed?limit={limit}')
    if result:
        return result.get('events', [])
    return []


def mark_processed(event_id):
    """Mark event as processed via POST /events/processed."""
    return _request('POST', '/events/processed', {
        'event_id': event_id,
        'worker': WORKER_NAME
    })


def mark_failed(event_id, error):
    """Mark event as failed via POST /events/failed."""
    return _request('POST', '/events/failed', {
        'event_id': event_id,
        'worker': WORKER_NAME,
        'error': str(error)
    })


def event_from_api(raw):
    """Convert API event dict to Event dataclass."""
    raw_event_data = raw.get('payload') or {}
    return Event(
        event_id=raw.get('event_id', ''),
        event_type=raw.get('event_type', ''),
        timestamp=str(raw.get('timestamp', '0')),
        aggregate_id=raw.get('aggregate_id', ''),
        aggregate_type=raw.get('aggregate_type', ''),
        event_data=raw_event_data,
        causation_id=raw.get('causation_id'),
        correlation_id=raw.get('correlation_id'),
        metadata=None,
    )


def main():
    register_event_handlers()
    logger.info(f'Worker runtime started. Polling {GATEWAY_URL} every {POLL_INTERVAL}s')

    consecutive_errors = 0

    while True:
        try:
            events = fetch_unprocessed()
            consecutive_errors = 0

            if not events:
                time.sleep(POLL_INTERVAL)
                continue

            logger.info(f'Fetched {len(events)} unprocessed events')

            for raw in events:
                eid = raw.get('event_id', '')
                event_type = raw.get('event_type', 'unknown')

                event = event_from_api(raw)
                logger.info(f'Dispatching {event_type}: {eid}')

                try:
                    result = dispatcher.dispatch(event)
                    mark_processed(eid)
                    if result:
                        logger.info(f'{event_type} → {result.event_type}: {result.event_id}')
                    else:
                        logger.info(f'{event_type}: {eid} processed (no output event)')
                except Exception as dispatch_err:
                    logger.error(f'Dispatch failed for {eid}: {dispatch_err}')
                    mark_failed(eid, dispatch_err)

            time.sleep(POLL_INTERVAL)

        except KeyboardInterrupt:
            logger.info('Worker runtime shutting down')
            break
        except Exception as loop_err:
            consecutive_errors += 1
            logger.error(f'Runtime loop error ({consecutive_errors}): {loop_err}')
            if consecutive_errors >= MAX_RETRIES:
                logger.critical(f'Too many consecutive errors ({consecutive_errors}), shutting down')
                break
            time.sleep(POLL_INTERVAL * 2)


if __name__ == '__main__':
    main()
