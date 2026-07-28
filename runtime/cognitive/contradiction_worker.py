"""
Contradiction Worker — Rule 4

Model: qwen2.5-coder:7b
Tools: contradiction_search
Responsibilities: Find conflicting evidence

Constitutional constraints:
- Identifies conflicting claims, evidence, and authorities
- Returns structured contradiction findings
"""
import json
import sys
from typing import Dict, Any, List, Optional
from datetime import datetime

from .worker_protocol import WorkerProtocol
from .models import WorkerTask, WorkerResponse, WorkerRole


WORKER_MODEL = "qwen2.5-coder:7b"


class ContradictionWorker:
    """
    Contradiction Worker — Identifies conflicting evidence across the knowledge graph.
    Uses contradiction_search tool to detect stance conflicts.
    """

    def __init__(self):
        self.protocol = WorkerProtocol()

    def execute(self, task: WorkerTask) -> WorkerResponse:
        findings = []
        confidence = 0.0
        claim = task.objective
        context = task.context or {}

        contradiction_result = self.protocol.call_tool('contradiction_search', {'claim': claim}, timeout=30)
        findings = self.protocol.format_task_output('contradiction_search', contradiction_result)
        if contradiction_result and 'error' not in contradiction_result:
            confidence = 0.7
            if isinstance(contradiction_result, dict):
                conflicts = contradiction_result.get('contradictions', []) or contradiction_result.get('conflicts', [])
                if isinstance(conflicts, list) and len(conflicts) > 0:
                    confidence = 0.9
                elif isinstance(conflicts, dict) and len(conflicts) > 0:
                    confidence = 0.8

        return WorkerResponse(
            task_id=task.task_id,
            worker=WorkerRole.CONTRADICTION.value,
            findings=findings,
            confidence=confidence
        )

    def run_standalone(self):
        try:
            task_data = json.load(sys.stdin)
        except Exception:
            print(json.dumps({"error": "invalid input"}))
            sys.exit(1)
        task = WorkerTask(
            task_id=task_data.get('task_id', 'standalone'),
            worker=WorkerRole.CONTRADICTION.value,
            objective=task_data.get('objective', task_data.get('claim', '')),
            constraints=task_data.get('constraints', {}),
            context=task_data.get('context', {})
        )
        response = self.execute(task)
        print(json.dumps(response.to_dict(), indent=2))


if __name__ == '__main__':
    ContradictionWorker().run_standalone()
