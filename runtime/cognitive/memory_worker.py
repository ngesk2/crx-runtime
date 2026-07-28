"""
Memory Worker — Rule 4

Model: qwen2.5-coder:7b
Tools: context_pack_builder
Responsibilities: Assemble context packs

Constitutional constraints:
- Receives findings from all workers
- Assembles them into a validated Context Pack
- Never performs retrieval or reasoning itself
"""
import json
import sys
from typing import Dict, Any, List, Optional
from datetime import datetime

from .context_pack import ContextPackBuilder
from .worker_protocol import WorkerProtocol
from .models import WorkerTask, WorkerResponse, WorkerRole, ContextPack


WORKER_MODEL = "qwen2.5-coder:7b"


class MemoryWorker:
    """
    Memory Worker — Assembles validated Context Packs from worker findings.
    Uses ContextPackBuilder to construct and validate.
    """

    def __init__(self):
        self.builder = ContextPackBuilder()

    def execute(self, task: WorkerTask) -> WorkerResponse:
        context = task.context or {}
        question = task.objective
        findings_by_type = context.get('findings_by_type', {})

        authority_findings = findings_by_type.get('authority', [])
        lineage_findings = findings_by_type.get('lineage', [])
        graph_findings = findings_by_type.get('graph', [])
        contradiction_findings = findings_by_type.get('contradiction', [])
        repository_findings = findings_by_type.get('repository', [])

        pack = self.builder.build_from_findings(
            question=question,
            authority_findings=authority_findings,
            lineage_findings=lineage_findings,
            graph_findings=graph_findings,
            contradiction_findings=contradiction_findings,
            repository_findings=repository_findings
        )
        violations = self.builder.validate(pack)

        return WorkerResponse(
            task_id=task.task_id,
            worker=WorkerRole.MEMORY.value,
            findings=[{'context_pack': pack.to_dict(), 'validation_violations': violations}],
            confidence=pack.confidence,
            metadata={
                'validation_violations': violations,
                'has_authority': bool(pack.highest_authority),
                'evidence_count': len(pack.supporting_documents),
                'has_contradictions': len(pack.contradictions) > 0
            }
        )

    def run_standalone(self):
        try:
            task_data = json.load(sys.stdin)
        except Exception:
            print(json.dumps({"error": "invalid input"}))
            sys.exit(1)
        task = WorkerTask(
            task_id=task_data.get('task_id', 'standalone'),
            worker=WorkerRole.MEMORY.value,
            objective=task_data.get('objective', task_data.get('question', '')),
            constraints=task_data.get('constraints', {}),
            context=task_data.get('context', {})
        )
        response = self.execute(task)
        print(json.dumps(response.to_dict(), indent=2))


if __name__ == '__main__':
    MemoryWorker().run_standalone()
