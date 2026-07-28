"""
Search Worker — Rule 4

Model: qwen2.5-coder:7b
Tools: authority_search, lineage_search, graph_expand
Responsibilities: Find evidence

Constitutional constraints:
- Never answers directly from vector search
- Always resolves authority before searching lineage
- Always expands graph after finding lineage
"""
import json
import sys
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

from .worker_protocol import WorkerProtocol
from .models import WorkerTask, WorkerResponse, WorkerRole


WORKER_MODEL = "qwen2.5-coder:7b"


class SearchWorker:
    """
    Search Worker — Constitutional evidence finder.
    Uses authority_search → lineage_search → graph_expand pipeline.
    """

    def __init__(self):
        self.protocol = WorkerProtocol()
        self.results_cache = {}

    def execute(self, task: WorkerTask) -> WorkerResponse:
        findings = []
        confidence = 0.0
        query = task.objective
        context = task.context or {}

        authority_result = self.protocol.call_tool('authority_search', {'query': query}, timeout=30)
        authority_findings = self.protocol.format_task_output('authority_search', authority_result)
        findings.extend(authority_findings)
        artifact_id = None
        if authority_result and 'error' not in authority_result:
            data = authority_result.get('data') if 'data' in authority_result else authority_result
            if isinstance(data, dict):
                highest = data.get('highest_authority', {})
                artifact_id = highest.get('artifact_id') or highest.get('id')
                confidence += 0.3

        if artifact_id:
            lineage_result = self.protocol.call_tool('lineage_search', {'artifact_id': artifact_id}, timeout=30)
            lineage_findings = self.protocol.format_task_output('lineage_search', lineage_result)
            findings.extend(lineage_findings)
            if lineage_result and 'error' not in lineage_result:
                confidence += 0.3

            graph_result = self.protocol.call_tool('graph_expand', {'node': artifact_id, 'depth': 2}, timeout=30)
            graph_findings = self.protocol.format_task_output('graph_expand', graph_result)
            findings.extend(graph_findings)
            if graph_result and 'error' not in graph_result:
                confidence += 0.2

        return WorkerResponse(
            task_id=task.task_id,
            worker=WorkerRole.SEARCH.value,
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
            worker=WorkerRole.SEARCH.value,
            objective=task_data.get('objective', task_data.get('query', '')),
            constraints=task_data.get('constraints', {}),
            context=task_data.get('context', {})
        )
        response = self.execute(task)
        print(json.dumps(response.to_dict(), indent=2))


if __name__ == '__main__':
    SearchWorker().run_standalone()
