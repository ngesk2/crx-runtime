"""RetrieverWorker — persistent worker that retrieves context for events.

Runs continuously, reading events from RepositoryAuthority,
fetching related context from Qdrant, and storing the result
as context packs for the ReasonerWorker.
"""

import json
from typing import Optional, Dict, Any, List
from urllib.request import Request, urlopen

from runtime.workers.worker_base import WorkerBase
from runtime.config import config
from runtime.authorities.repository_authority import RepositoryAuthority
from runtime.authorities.identity_authority import IdentityAuthority


class RetrieverWorker(WorkerBase):
    """Persistent retrieval worker. Maintains a persistent Qdrant HTTP client."""

    name = 'RetrieverWorker'
    poll_interval = 2.0
    batch_size = 5

    def __init__(self):
        super().__init__()
        self._qdrant_url: str = ''
        self._qdrant_collection: str = ''
        self._qdrant_api_key: str = ''

    def setup(self):
        qcfg = config().get_qdrant_config()
        self._qdrant_url = qcfg.get('url', 'http://localhost:6333')
        self._qdrant_collection = qcfg.get('collection', 'constitutional_memory')
        self._qdrant_api_key = qcfg.get('api_key', '')

    def poll(self) -> List[Dict[str, Any]]:
        """Fetch events that haven't been retrieved for context yet."""
        try:
            with RepositoryAuthority._get_adapter().get_cursor() as cur:
                cur.execute("""
                    SELECT e.event_id, e.event_type, e.event_data, e.timestamp,
                           e.aggregate_id, e.aggregate_type
                    FROM events e
                    LEFT JOIN context_packs cp ON cp.event_id = e.event_id
                    WHERE cp.id IS NULL AND e.event_type != 'SYSTEM_EVENT'
                    ORDER BY e.timestamp ASC
                    LIMIT %s
                """, (self.batch_size,))
                return [dict(r) for r in cur.fetchall()]
        except Exception as e:
            self.log.error(f'Poll query failed: {e}')
            return []

    def process_event(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Search Qdrant for related vectors and store as context pack."""
        event_type = event.get('event_type', '')
        event_id = event.get('event_id', '')
        event_data = event.get('event_data', {})
        if isinstance(event_data, str):
            event_data = json.loads(event_data)

        # Build search query from event content
        query_text = ''
        if isinstance(event_data, dict):
            query_text = event_data.get('title', '') or event_data.get('document_name', '') or event_data.get('content', '')
        query_text = query_text[:500]

        related = []
        if query_text:
            # Search Qdrant for similar vectors
            payload = {'vector': self._text_to_vector(query_text), 'limit': 5}
            result = self._qdrant_search(payload)
            related = [
                {'event_id': p.get('payload', {}).get('event_id', ''), 'score': p.get('score', 0)}
                for p in result if p.get('payload')
            ]

        # Store context pack
        with RepositoryAuthority._get_adapter().get_cursor() as cur:
            context_id = IdentityAuthority.generate_id()
            cur.execute("""
                INSERT INTO context_packs (id, event_id, event_type, query, related_events, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
            """, (context_id, event_id, event_type, query_text[:1000], json.dumps(related)))

        return {'event_id': event_id, 'related_count': len(related)}

    def _text_to_vector(self, text: str) -> list:
        """Generate a deterministic vector from text."""
        import hashlib
        h = hashlib.sha256(text.encode()).hexdigest()
        seed = int(h[:8], 16)
        rng = self._mulberry32(seed)
        dim = 768
        v = [(rng() - 0.5) * 2 for _ in range(dim)]
        norm = sum(x * x for x in v) ** 0.5
        return [x / norm for x in v]

    def _qdrant_search(self, payload: dict) -> list:
        url = f'{self._qdrant_url}/collections/{self._qdrant_collection}/points/search'
        data = json.dumps(payload).encode()
        req = Request(url, data=data, method='POST')
        req.add_header('Content-Type', 'application/json')
        if self._qdrant_api_key:
            req.add_header('api-key', self._qdrant_api_key)
        try:
            with urlopen(req, timeout=10) as resp:
                body = json.loads(resp.read().decode())
                return body.get('result', [])
        except Exception:
            return []

    @staticmethod
    def _mulberry32(a: int):
        def _rng():
            nonlocal a; a |= 0; a = a + 0x6D2B79F5 | 0
            t = (a ^ a >> 15) * (1 | a)
            t = (t + (t ^ t >> 7) * (61 | t)) ^ t
            return ((t ^ t >> 14) >> 0) / 4294967296
        return _rng


if __name__ == '__main__':
    worker = RetrieverWorker()
    worker.run_forever()
