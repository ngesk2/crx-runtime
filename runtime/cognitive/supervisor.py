"""
Supervisor Runtime — Rule 3

Model: qwen2.5-coder:14b
Responsibilities:
- Plan reasoning (decompose question into steps)
- Route tools (dispatch structured tasks to workers)
- Synthesize evidence from all worker responses
- Produce final answer with authority chain

Constitutional constraints:
- NEVER performs retrieval
- NEVER queries vector search
- ONLY reasons, plans, routes, and synthesizes
"""
import json
import sys
import os
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

from .models import (
    ContextPack, WorkerTask, WorkerResponse, WorkerRole,
    ReasoningPlan, TaskStatus, AuthorityResolution,
    AuthorityResolutionFailure, ContextPackViolation
)
from .worker_protocol import WorkerProtocol
from .context_pack import ContextPackBuilder
from .context_pack_cache import ContextPackCache
from .projection_sovereignty import ProjectionSovereignty
from .search_worker import SearchWorker
from .contradiction_worker import ContradictionWorker
from .architecture_worker import ArchitectureWorker
from .memory_worker import MemoryWorker


SUPERVISOR_MODEL = "qwen2.5-coder:14b"


class Supervisor:
    """
    AI Supervisor Runtime — Constitutional reasoning planner and synthesizer.
    Plans reasoning, routes to workers, synthesizes evidence, produces final answer.
    NEVER performs retrieval — only reasons.
    """

    def __init__(self):
        self.protocol = WorkerProtocol()
        self.pack_builder = ContextPackBuilder()
        self.cache = ContextPackCache()
        self.search_worker = SearchWorker()
        self.contradiction_worker = ContradictionWorker()
        self.architecture_worker = ArchitectureWorker()
        self.memory_worker = MemoryWorker()

    def plan(self, question: str) -> ReasoningPlan:
        plan_id = str(uuid.uuid4())[:8]
        steps = [
            {"step": 1, "worker": "search_worker", "action": "authority_search", "description": "Resolve authority for the question"},
            {"step": 2, "worker": "search_worker", "action": "lineage_search", "description": "Find lineage of highest authority"},
            {"step": 3, "worker": "search_worker", "action": "graph_expand", "description": "Expand knowledge graph from lineage"},
            {"step": 4, "worker": "contradiction_worker", "action": "contradiction_search", "description": "Detect conflicting evidence"},
            {"step": 5, "worker": "architecture_worker", "action": "repository_query", "description": "Query repository symbols and relationships"},
            {"step": 6, "worker": "memory_worker", "action": "context_pack_builder", "description": "Assemble Context Pack from all findings"},
            {"step": 7, "worker": "supervisor", "action": "synthesize", "description": "Synthesize final answer from Context Pack"}
        ]
        assignments = [
            WorkerTask(
                task_id=f"{plan_id}-s1",
                worker=WorkerRole.SEARCH.value,
                objective=question,
                constraints={"include_authority": True, "include_lineage": True, "include_graph": True}
            ),
            WorkerTask(
                task_id=f"{plan_id}-s4",
                worker=WorkerRole.CONTRADICTION.value,
                objective=question,
                constraints={"depth": "full"}
            ),
            WorkerTask(
                task_id=f"{plan_id}-s5",
                worker=WorkerRole.ARCHITECTURE.value,
                objective=question,
                constraints={"include_symbols": True, "include_relationships": True}
            )
        ]
        return ReasoningPlan(
            plan_id=plan_id,
            question=question,
            steps=steps,
            worker_assignments=assignments,
            status=TaskStatus.PENDING
        )

    def execute_plan(self, plan: ReasoningPlan) -> ContextPack:
        plan.status = TaskStatus.IN_PROGRESS
        all_findings_by_type = {}
        worker_responses = []

        for assignment in plan.worker_assignments:
            if assignment.worker == WorkerRole.SEARCH.value:
                response = self.search_worker.execute(assignment)
            elif assignment.worker == WorkerRole.CONTRADICTION.value:
                response = self.contradiction_worker.execute(assignment)
            elif assignment.worker == WorkerRole.ARCHITECTURE.value:
                response = self.architecture_worker.execute(assignment)
            else:
                response = WorkerResponse(
                    task_id=assignment.task_id,
                    worker=assignment.worker,
                    findings=[],
                    confidence=0.0,
                    error=f"unknown worker: {assignment.worker}"
                )
            worker_responses.append(response)

        for resp in worker_responses:
            if resp.worker == WorkerRole.SEARCH.value:
                all_findings_by_type['authority'] = [f for f in resp.findings if 'authority' in f.get('tool', '') or 'authority_search' in json.dumps(f)]
                all_findings_by_type['lineage'] = [f for f in resp.findings if 'lineage' in f.get('tool', '') or 'lineage_search' in json.dumps(f)]
                all_findings_by_type['graph'] = [f for f in resp.findings if 'graph' in f.get('tool', '') or 'graph_expand' in json.dumps(f)]
            elif resp.worker == WorkerRole.CONTRADICTION.value:
                all_findings_by_type['contradiction'] = resp.findings
            elif resp.worker == WorkerRole.ARCHITECTURE.value:
                all_findings_by_type['repository'] = resp.findings

        memory_task = WorkerTask(
            task_id=f"{plan.plan_id}-memory",
            worker=WorkerRole.MEMORY.value,
            objective=plan.question,
            context={"findings_by_type": all_findings_by_type}
        )
        memory_response = self.memory_worker.execute(memory_task)
        worker_responses.append(memory_response)

        context_pack = None
        for f in memory_response.findings:
            if isinstance(f, dict) and 'context_pack' in f:
                cp_data = f['context_pack']
                context_pack = ContextPack(**{
                    k: v for k, v in cp_data.items()
                    if k in ContextPack.__dataclass_fields__
                })
                ar_data = cp_data.get('authority_resolution')
                if ar_data:
                    context_pack.authority_resolution = AuthorityResolution(**ar_data)
                break

        if context_pack is None:
            raise ContextPackViolation(["memory worker returned no context pack"])

        self.pack_builder.validate_or_raise(context_pack)
        self._enforce_authority(context_pack)

        context_pack.confidence = round(
            sum(r.confidence for r in worker_responses) / max(len(worker_responses), 1), 4
        )

        self.cache.set(context_pack)

        plan.status = TaskStatus.COMPLETED
        return context_pack

    def _enforce_authority(self, pack: ContextPack):
        if not pack.highest_authority and not pack.authority_chain:
            raise AuthorityResolutionFailure(
                question=pack.question,
                reason="No governing authority found. Authority resolution is mandatory before synthesis."
            )
        highest = pack.highest_authority or {}
        is_fallback = highest.get('_source') == 'qdrant_fallback' or any(
            a.get('_source') == 'qdrant_fallback' for a in (pack.authority_chain or [])
        )
        if is_fallback:
            return
        ar = pack.authority_resolution
        if ar and ar.verification.get('overall') is False:
            raise AuthorityResolutionFailure(
                question=pack.question,
                reason=f"Authority found but verification failed: {ar.verification}"
            )

    def _enforce_context_pack(self, pack: ContextPack):
        violations = self.pack_builder.validate(pack, enforce=False)
        if violations:
            raise ContextPackViolation(violations)

    def synthesize_answer(self, plan: ReasoningPlan, pack: ContextPack) -> Dict[str, Any]:
        self._enforce_authority(pack)
        self._enforce_context_pack(pack)
        answer = {
            "answer": None,
            "context_pack": pack.to_dict(),
            "authority_resolution": pack.authority_resolution.to_dict() if pack.authority_resolution else None,
            "confidence": pack.confidence,
            "plan": plan.to_dict()
        }
        synthesis_input = {
            "role": "system",
            "content": (
                "You are a constitutional reasoning supervisor. "
                "You NEVER perform retrieval. You ONLY synthesize from provided evidence. "
                "Produce a final answer based on the Context Pack. "
                "Include the authority chain and verification status in your answer."
            )
        }
        context_str = json.dumps(pack.to_dict(), indent=2, default=str)
        user_input = {
            "role": "user",
            "content": f"Question: {plan.question}\n\nContext Pack:\n{context_str}\n\nProduce a synthethic answer based solely on the evidence above. Include the authority chain."
        }
        try:
            sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
            from adapters.inference_adapter import get_inference_adapter
            adapter = get_inference_adapter()
            response = adapter.chat(
                messages=[synthesis_input, user_input],
                options={"model": SUPERVISOR_MODEL, "temperature": 0.2}
            )
            if response:
                answer["answer"] = response.get('message', {}).get('content', '')
        except Exception:
            answer["answer"] = "Supervisor synthesis unavailable — Context Pack returned directly."
        return answer

    def reason(self, question: str) -> Dict[str, Any]:
        cached = self.cache.get(question)
        if cached:
            self._enforce_authority(cached)
            self._enforce_context_pack(cached)
            return {
                "answer": None,
                "context_pack": cached.to_dict(),
                "authority_resolution": cached.authority_resolution.to_dict() if cached.authority_resolution else None,
                "confidence": cached.confidence,
                "plan": None,
                "cached": True
            }
        plan = self.plan(question)
        pack = self.execute_plan(plan)
        return self.synthesize_answer(plan, pack)

    def run_standalone(self):
        try:
            inp = json.load(sys.stdin)
        except Exception:
            print(json.dumps({"error": "invalid input"}))
            sys.exit(1)
        question = inp.get('question') or inp.get('query', '')
        if not question:
            print(json.dumps({"error": "missing question"}))
            sys.exit(1)
        result = self.reason(question)
        print(json.dumps(result, indent=2, default=str))


if __name__ == '__main__':
    Supervisor().run_standalone()
