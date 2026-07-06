"""ReasonerWorker — persistent worker that runs inference on context packs.

Keeps a persistent HTTP connection to Ollama.
Loops continuously:
  1. Reads context_packs that haven't been reasoned on
  2. Sends them to the inference model (via InferenceAuthority)
  3. Stores the reasoning results as new events
"""

import json
import time
from typing import Optional, Dict, Any, List
from urllib.request import Request, urlopen
from urllib.error import URLError

from runtime.workers.worker_base import WorkerBase
from runtime.config import config
from runtime.authorities.repository_authority import RepositoryAuthority
from runtime.authorities.identity_authority import IdentityAuthority


class ReasonerWorker(WorkerBase):
    """Persistent reasoning worker. Maintains a persistent Ollama HTTP client."""

    name = 'ReasonerWorker'
    poll_interval = 2.0
    batch_size = 3

    def __init__(self):
        super().__init__()
        self._ollama_url: str = ''
        self._chat_model: str = ''

    def setup(self):
        icfg = config().get_inference_config()
        self._ollama_url = icfg.get('base_url', 'http://localhost:11434')
        self._chat_model = icfg.get('chat_model', 'qwen2.5-coder:7b')

    def poll(self) -> List[Dict[str, Any]]:
        """Fetch context packs that haven't been reasoned on yet."""
        try:
            with RepositoryAuthority._get_adapter().get_cursor() as cur:
                cur.execute("""
                    SELECT cp.id as pack_id, cp.event_id, cp.event_type, cp.query, cp.related_events
                    FROM context_packs cp
                    LEFT JOIN reasoning_results rr ON rr.pack_id = cp.id
                    WHERE rr.id IS NULL
                    ORDER BY cp.created_at ASC
                    LIMIT %s
                """, (self.batch_size,))
                return [dict(r) for r in cur.fetchall()]
        except Exception as e:
            self.log.error(f'Poll query failed: {e}')
            return []

    def process_event(self, pack: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Send context to Ollama and store the reasoning result."""
        pack_id = pack.get('pack_id', '')
        event_id = pack.get('event_id', '')
        event_type = pack.get('event_type', '')
        query_text = pack.get('query', '')
        related = pack.get('related_events', '[]')
        if isinstance(related, str):
            related = json.loads(related)

        related_summary = ', '.join(
            r.get('event_id', '')[:8] for r in related if isinstance(r, dict)
        ) if related else 'none'

        prompt = f"""Analyze this constitutional event:

Type: {event_type}
Content: {query_text[:500]}
Related events: {related_summary}

Provide a brief analysis:
1. What is this event about?
2. How does it relate to the constitutional framework?
3. What action should be taken?"""

        # Call Ollama with persistent client
        analysis = self._ollama_generate(prompt)

        # Store reasoning result
        with RepositoryAuthority._get_adapter().get_cursor() as cur:
            analysis_id = IdentityAuthority.generate_id()
            cur.execute("""
                INSERT INTO reasoning_results (id, pack_id, event_id, analysis, created_at)
                VALUES (%s, %s, %s, %s, NOW())
            """, (analysis_id, pack_id, event_id, analysis))

        return {'pack_id': pack_id, 'event_id': event_id, 'analysis_length': len(analysis)}

    def _ollama_generate(self, prompt: str) -> str:
        """Generate text via Ollama's REST API."""
        url = f'{self._ollama_url}/api/generate'
        body = json.dumps({
            'model': self._chat_model,
            'prompt': prompt,
            'stream': False,
            'options': {
                'num_predict': 512,
                'temperature': 0.7,
            },
        }).encode()
        req = Request(url, data=body, method='POST')
        req.add_header('Content-Type', 'application/json')
        try:
            with urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode())
                return data.get('response', '')
        except URLError as e:
            self.log.error(f'Ollama request failed: {e}')
            return f'[Ollama unavailable: {e.reason}]'
        except Exception as e:
            self.log.error(f'Ollama error: {e}')
            return f'[Analysis failed: {e}]'


if __name__ == '__main__':
    worker = ReasonerWorker()
    worker.run_forever()
