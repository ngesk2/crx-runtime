"""
Architecture Worker — Rule 4

Model: qwen2.5-coder:7b  (specified 8b not available — using 7b)
Tools: repository_symbols, repository_relationships
Responsibilities: Codebase reasoning

Constitutional constraints:
- Never queries vector search
- Uses repository as first-class memory (Rule 9)
- Returns structured symbol/relationship findings
"""
import json
import sys
from typing import Dict, Any, List, Optional
from datetime import datetime

from .worker_protocol import WorkerProtocol
from .models import WorkerTask, WorkerResponse, WorkerRole


WORKER_MODEL = "qwen2.5-coder:7b"


class ArchitectureWorker:
    """
    Architecture Worker — Codebase reasoning via repository cognition.
    Uses repository_symbols and repository_relationships tools.
    """

    def __init__(self):
        self.protocol = WorkerProtocol()

    def execute(self, task: WorkerTask) -> WorkerResponse:
        findings = []
        confidence = 0.0
        symbol = task.objective.split()[0] if task.objective else ""
        context = task.context or {}

        symbols_result = self.protocol.call_tool('repository_symbols', {'symbol': symbol}, timeout=30)
        symbols_findings = self.protocol.format_task_output('repository_symbols', symbols_result)
        findings.extend(symbols_findings)
        if symbols_result and 'error' not in symbols_result:
            confidence += 0.4

        relationships_result = self.protocol.call_tool('repository_relationships', {'symbol': symbol}, timeout=30)
        rel_findings = self.protocol.format_task_output('repository_relationships', relationships_result)
        findings.extend(rel_findings)
        if relationships_result and 'error' not in relationships_result:
            confidence += 0.4

        return WorkerResponse(
            task_id=task.task_id,
            worker=WorkerRole.ARCHITECTURE.value,
            findings=findings,
            confidence=round(min(confidence + 0.1, 1.0), 4)
        )

    def run_standalone(self):
        try:
            task_data = json.load(sys.stdin)
        except Exception:
            print(json.dumps({"error": "invalid input"}))
            sys.exit(1)
        task = WorkerTask(
            task_id=task_data.get('task_id', 'standalone'),
            worker=WorkerRole.ARCHITECTURE.value,
            objective=task_data.get('objective', task_data.get('query', '')),
            constraints=task_data.get('constraints', {}),
            context=task_data.get('context', {})
        )
        response = self.execute(task)
        print(json.dumps(response.to_dict(), indent=2))


if __name__ == '__main__':
    ArchitectureWorker().run_standalone()
