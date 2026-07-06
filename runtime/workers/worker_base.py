"""WorkerBase — persistent worker loop with pooled connections.

Every worker runs:
  while True:
      events = RepositoryAuthority.next()
      context = RetrievalAuthority.retrieve(events)
      answer = InferenceAuthority.generate(context)
      ProjectionAuthority.store(answer)
      RepositoryAuthority.append(answer)

Each worker keeps a persistent HTTP client, a pool connection,
and a polling interval.  No worker exits between requests.
"""

import os
import sys
import time
import json
import signal
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from runtime.config import config
from runtime.authorities.repository_authority import RepositoryAuthority


logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
)


class WorkerBase:
    """Base class for persistent workers.

    Subclasses override poll() or process_event().
    """

    name: str = 'worker'
    poll_interval: float = 5.0
    batch_size: int = 1

    def __init__(self, name: Optional[str] = None):
        if name:
            self.name = name
        self.log = logging.getLogger(self.name)
        self._running = True
        self._total_processed = 0
        self._total_errors = 0
        self._cfg = config()  # ConfigurationAuthority singleton
        self._cycle_interval = self._cfg.get_worker_config().get('cycle_interval', 5)
        self.poll_interval = float(self._cycle_interval)
        signal.signal(signal.SIGTERM, self._handle_signal)
        signal.signal(signal.SIGINT, self._handle_signal)

    def _handle_signal(self, signum, frame):
        self.log.info(f'Received signal {signum}, shutting down...')
        self._running = False

    def setup(self):
        """Override for one-time setup (e.g., creating HTTP clients, verifying connections)."""
        pass

    def poll(self) -> List[Dict[str, Any]]:
        """Override to return a batch of work items. Returns empty list when no work."""
        return []

    def process_event(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Override to process a single event. Returns result dict or None."""
        raise NotImplementedError

    def teardown(self):
        """Override for cleanup on shutdown."""
        pass

    def run_forever(self):
        """Main loop: poll → process → repeat."""
        self.log.info(f'{self.name} starting (poll_interval={self.poll_interval}s, batch={self.batch_size})')
        self.setup()
        while self._running:
            try:
                events = self.poll()
                if events:
                    self.log.info(f'Processing {len(events)} event(s)')
                    for event in events:
                        try:
                            result = self.process_event(event)
                            self._total_processed += 1
                            if result:
                                self.log.debug(f'Result: {json.dumps(result, default=str)[:200]}')
                        except Exception as e:
                            self._total_errors += 1
                            self.log.error(f'Error processing event: {e}')
                else:
                    self.log.debug('No events to process, sleeping')
                time.sleep(self.poll_interval)
            except Exception as e:
                self.log.error(f'Poll loop error: {e}')
                time.sleep(self.poll_interval * 2)
        self.teardown()
        self.log.info(f'{self.name} stopped (processed={self._total_processed}, errors={self._total_errors})')

    @property
    def health(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'running': self._running,
            'total_processed': self._total_processed,
            'total_errors': self._total_errors,
            'poll_interval': self.poll_interval,
        }
