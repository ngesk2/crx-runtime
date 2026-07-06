"""PlannerWorker — persistent worker that plans next operations.

Reads events and reasoning results, then emits mission cards
and execution plans for the system to act on.
"""

import json
from typing import Optional, Dict, Any, List
from urllib.request import Request, urlopen

from runtime.workers.worker_base import WorkerBase
from runtime.config import config
from runtime.authorities.repository_authority import RepositoryAuthority
from runtime.authorities.identity_authority import IdentityAuthority


class PlannerWorker(WorkerBase):
    """Persistent planning worker. Creates mission cards from events + reasoning."""

    name = 'PlannerWorker'
    poll_interval = 10.0
    batch_size = 5

    def __init__(self):
        super().__init__()
        self._ollama_url: str = ''
        self._chat_model: str = ''

    def setup(self):
        icfg = config().get_inference_config()
        self._ollama_url = icfg.get('base_url', 'http://localhost:11434')
        self._chat_model = icfg.get('chat_model', 'qwen2.5-coder:7b')

    def poll(self) -> List[Dict[str, Any]]:
        """Fetch reasoning results that haven't been planned on yet."""
        try:
            with RepositoryAuthority._get_adapter().get_cursor() as cur:
                cur.execute("""
                    SELECT rr.id as result_id, rr.pack_id, rr.event_id, rr.analysis
                    FROM reasoning_results rr
                    LEFT JOIN mission_cards mc ON mc.result_id = rr.id
                    WHERE mc.id IS NULL
                    ORDER BY rr.created_at ASC
                    LIMIT %s
                """, (self.batch_size,))
                return [dict(r) for r in cur.fetchall()]
        except Exception as e:
            self.log.error(f'Poll query failed: {e}')
            return []

    def process_event(self, result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Determine next action from analysis and emit mission card."""
        result_id = result.get('result_id', '')
        event_id = result.get('event_id', '')
        analysis = result.get('analysis', '')

        # Simple classification from analysis text
        if 'unavailable' in analysis.lower() or 'failed' in analysis.lower():
            action = 'retry'
            priority = 3
        elif 'action' in analysis.lower() or 'should' in analysis.lower():
            action = 'execute'
            priority = 2
        else:
            action = 'observe'
            priority = 1

        with RepositoryAuthority._get_adapter().get_cursor() as cur:
            card_id = IdentityAuthority.generate_id()
            cur.execute("""
                INSERT INTO mission_cards (id, result_id, event_id, action, priority, summary, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, 'queued', NOW())
            """, (card_id, result_id, event_id, action, priority, analysis[:200]))

        return {'card_id': card_id, 'action': action, 'priority': priority}


if __name__ == '__main__':
    worker = PlannerWorker()
    worker.run_forever()
