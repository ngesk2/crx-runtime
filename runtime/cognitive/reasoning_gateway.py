"""
Reasoning Gateway — Rule 10

Mission Control becomes a Constitutional Reasoning Gateway.

Pipeline:
User Query → Authority Search → Lineage Search → Graph Expansion
→ Contradiction Search → Context Pack Builder → Supervisor → Answer

Constitutional constraints:
- Mission Control is no longer an API layer
- Mission Control is now a Constitutional Reasoning Gateway
- Every request MUST pass through the full reasoning pipeline
"""
import json
import os
import sys
from typing import Dict, Any, Optional, List
from datetime import datetime

from .supervisor import Supervisor
from .context_pack_cache import ContextPackCache
from .models import ContextPack, AuthorityResolution, ConstitutionalViolation


class ReasoningGateway:
    """
    Constitutional Reasoning Gateway.
    Wraps the full reasoning pipeline for Mission Control integration.
    """

    def __init__(self):
        self.supervisor = Supervisor()
        self.cache = ContextPackCache()

    def reason(self, question: str, skip_cache: bool = False) -> Dict[str, Any]:
        try:
            if not skip_cache:
                cached = self.cache.get(question)
                if cached:
                    return {
                        "success": True,
                        "answer": self._format_answer_from_pack(cached, question),
                        "context_pack": cached.to_dict(),
                        "authority_resolution": cached.authority_resolution.to_dict() if cached.authority_resolution else None,
                        "confidence": cached.confidence,
                        "cached": True,
                        "pipeline": "cached",
                        "timestamp": datetime.utcnow().isoformat()
                    }
            result = self.supervisor.reason(question)
            return {
                "success": True,
                "answer": result.get("answer"),
                "context_pack": result.get("context_pack"),
                "authority_resolution": result.get("authority_resolution"),
                "confidence": result.get("confidence", 0.0),
                "plan": result.get("plan"),
                "cached": False,
                "pipeline": "authority_search → lineage_search → graph_expand → contradiction_search → context_pack → supervisor",
                "timestamp": datetime.utcnow().isoformat()
            }
        except ConstitutionalViolation as e:
            return {
                "success": False,
                "answer": None,
                "context_pack": None,
                "authority_resolution": None,
                "confidence": 0.0,
                "plan": None,
                "cached": False,
                "pipeline": "blocked",
                "error": str(e),
                "constitutional_violation": True,
                "timestamp": datetime.utcnow().isoformat()
            }

    def _format_answer_from_pack(self, pack: ContextPack, question: str) -> str:
        lines = [f"Question: {question}"]
        if pack.highest_authority:
            lines.append(f"\nHighest Authority: {pack.highest_authority.get('title', 'unknown')} ({pack.highest_authority.get('authority_class', 'unknown')})")
        if pack.authority_chain:
            chain = " → ".join([a.get('title', str(a.get('authority_class', '?'))) for a in pack.authority_chain[:5]])
            lines.append(f"Authority Chain: {chain}")
        if pack.supporting_documents:
            lines.append(f"\nSupporting Documents: {len(pack.supporting_documents)}")
        if pack.contradictions:
            lines.append(f"Contradictions Found: {len(pack.contradictions)}")
        lines.append(f"\nConfidence: {pack.confidence}")
        return "\n".join(lines)

    def health(self) -> Dict[str, Any]:
        cache_stats = self.cache.stats()
        return {
            "status": "operational",
            "pipeline": "constitutional_reasoning",
            "supervisor_model": "qwen2.5-coder:14b",
            "worker_model": "qwen2.5-coder:7b",
            "cache": cache_stats,
            "rules_enforced": [
                "Rule 1: No direct vector search answers",
                "Rule 2: Context Pack mandatory",
                "Rule 3: Supervisor never retrieves",
                "Rule 5: Structured worker communication",
                "Rule 6: Authority resolution mandatory",
                "Rule 7: Projection sovereignty enforced",
                "Rule 8: Context Pack cache (24h TTL)",
                "Rule 9: Repository cognition first-class memory",
                "Rule 10: Mission Control as Reasoning Gateway"
            ]
        }
