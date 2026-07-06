"""ProjectionWorker — persistent worker that projects events to Qdrant.

Keeps a persistent Qdrant HTTP client and Postgres pool connection.
Loops continuously, reading unprojected events from RepositoryAuthority
and projecting them to the configured Qdrant collection.
"""

import os
import json
import hashlib
from typing import Optional, Dict, Any, List
from urllib.request import Request, urlopen
from urllib.error import URLError

from runtime.workers.worker_base import WorkerBase
from runtime.config import config
from runtime.authorities.repository_authority import RepositoryAuthority


class ProjectionWorker(WorkerBase):
    """Persistent projection worker. Runs inside the worker pool."""

    name = 'ProjectionWorker'
    poll_interval = 3.0
    batch_size = 10

    def __init__(self):
        super().__init__()
        self._qdrant_url: str = ''
        self._qdrant_collection: str = ''
        self._qdrant_api_key: str = ''
        self._embedding_dim: int = 768

    def setup(self):
        qcfg = config().get_qdrant_config()
        self._qdrant_url = qcfg.get('url', 'http://localhost:6333')
        self._qdrant_collection = qcfg.get('collection', 'constitutional_memory')
        self._qdrant_api_key = qcfg.get('api_key', '')
        icfg = config().get_inference_config()
        self._embedding_dim = int(os.getenv('EMBEDDING_DIMENSION', '768'))

        # Ensure collection exists
        self._qdrant_request(
            f'/collections/{self._qdrant_collection}',
            method='PUT',
            body={
                'vectors': {
                    'size': self._embedding_dim,
                    'distance': 'Cosine',
                }
            },
        )

    def poll(self) -> List[Dict[str, Any]]:
        """Fetch unprojected events from the pool."""
        try:
            with RepositoryAuthority._get_adapter().get_cursor() as cur:
                cur.execute("""
                    SELECT id, event_id, event_type, aggregate_id, aggregate_type, event_data, timestamp
                    FROM events
                    WHERE (projected_to_qdrant IS NULL OR projected_to_qdrant = false)
                    ORDER BY timestamp ASC
                    LIMIT %s
                """, (self.batch_size,))
                return [dict(r) for r in cur.fetchall()]
        except Exception as e:
            self.log.error(f'Poll query failed: {e}')
            return []

    def process_event(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Embed and project a single event to Qdrant."""
        from runtime.authorities.identity_authority import IdentityAuthority

        event_id = event.get('event_id', '')
        event_type = event.get('event_type', '')
        aggregate_type = event.get('aggregate_type', '')
        event_data = event.get('event_data', {})
        if isinstance(event_data, str):
            event_data = json.loads(event_data)

        # Build text for embedding
        parts = [f'Event: {event_type}', f'Type: {aggregate_type}', f'ID: {event_id}']
        if isinstance(event_data, dict):
            for key in ('title', 'content', 'document_name', 'source'):
                val = event_data.get(key)
                if val:
                    parts.append(f'{key.capitalize()}: {val}')
        text = '\n'.join(parts)

        # Deterministic embedding via SHA-256 (matches gateway pipeline)
        hash_digest = hashlib.sha256(text.encode()).hexdigest()
        # Generate deterministic vector from hash
        seed = int(hash_digest[:8], 16)
        rng = self._mulberry32(seed)
        vector = [(rng() - 0.5) * 2 for _ in range(self._embedding_dim)]
        norm = sum(v * v for v in vector) ** 0.5
        vector = [v / norm for v in vector]

        # Upsert to Qdrant
        point_id = event_id.replace('-', '')
        self._qdrant_request(
            f'/collections/{self._qdrant_collection}/points',
            method='PUT',
            body={
                'points': [{
                    'id': point_id,
                    'vector': vector,
                    'payload': {
                        'event_id': event_id,
                        'event_type': event_type,
                        'aggregate_type': aggregate_type,
                        'aggregate_id': event.get('aggregate_id', ''),
                        'content_hash': hash_digest,
                        'timestamp': str(event.get('timestamp', '')),
                        'text_preview': text[:500],
                    },
                }],
            },
        )

        # Mark projected
        row_id = event.get('id')
        if row_id:
            with RepositoryAuthority._get_adapter().get_cursor() as cur:
                cur.execute(
                    "UPDATE events SET projected_to_qdrant = true, projected_at = NOW() WHERE id = %s",
                    (row_id,),
                )

        return {'event_id': event_id, 'projected': True}

    def _qdrant_request(self, path: str, method: str = 'GET', body: Optional[dict] = None) -> dict:
        """Make an HTTP request to the Qdrant REST API."""
        url = f'{self._qdrant_url}{path}'
        data = json.dumps(body).encode() if body else None
        req = Request(url, data=data, method=method)
        req.add_header('Content-Type', 'application/json')
        if self._qdrant_api_key:
            req.add_header('api-key', self._qdrant_api_key)
        try:
            with urlopen(req, timeout=10) as resp:
                return json.loads(resp.read().decode())
        except URLError as e:
            self.log.error(f'Qdrant request failed: {e}')
            return {}
        except json.JSONDecodeError:
            return {}

    @staticmethod
    def _mulberry32(a: int):
        """Mulberry32 PRNG for deterministic embeddings."""
        def _rng():
            nonlocal a
            a |= 0
            a = a + 0x6D2B79F5 | 0
            t = (a ^ a >> 15) * (1 | a)
            t = (t + (t ^ t >> 7) * (61 | t)) ^ t
            return ((t ^ t >> 14) >> 0) / 4294967296
        return _rng


if __name__ == '__main__':
    worker = ProjectionWorker()
    worker.run_forever()
