from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.knowledge_event_bus import emit_knowledge_event
from scripts.constitutional_operating_mode import execute_mission
from scripts.intent_graph_builder import generate_indexes
from scripts.workspace_builder import prepare_workspace
from scripts.mission_scoring import rank_missions, update_mission_profile
from scripts.worktree_executor import prepare_worktree
from scripts.reflection_engine import reflect_on_mission
from scripts.skill_registry import register_skill
from scripts.policy_proposals import propose_policy
from scripts.organizational_metrics import record_metric_event, compute_organizational_metrics
from scripts.roi_engine import compute_roi
from scripts.knowledge_confidence import decay_knowledge_object, score_knowledge_object
from scripts.pattern_miner import mine_patterns


class ConstitutionalLearningLoop:
    """Persistent learning loop: observe, remember, reason, propose, verify."""

    def __init__(self, root: Optional[Path] = None):
        self.root = Path(root or ROOT)
        self.knowledge_root = self.root / "knowledge"
        self.queue_path = self.knowledge_root / "missions" / "self-improvement-queue.json"

    def _load_queue(self) -> List[Dict[str, Any]]:
        if self.queue_path.exists():
            return json.loads(self.queue_path.read_text(encoding="utf-8"))
        return []

    def _write_queue(self, items: List[Dict[str, Any]]) -> None:
        self.queue_path.parent.mkdir(parents=True, exist_ok=True)
        self.queue_path.write_text(json.dumps(items, indent=2), encoding="utf-8")

    def build_queue(self) -> List[Dict[str, Any]]:
        base_queue = [
            {"id": "mission-duplicate-adapters", "title": "MissionRepair duplicate adapters", "risk": "low"},
            {"id": "mission-provider-config", "title": "MissionConsolidate provider config", "risk": "low"},
            {"id": "mission-authority-bypass", "title": "MissionRemove authority bypass", "risk": "medium"},
            {"id": "mission-missing-tests", "title": "MissionGenerate missing tests", "risk": "low"},
            {"id": "mission-refresh-embeddings", "title": "MissionRefresh embeddings", "risk": "low"},
            {"id": "mission-update-intent-graph", "title": "MissionUpdate intent graph", "risk": "low"},
        ]
        self._write_queue(base_queue)
        emit_knowledge_event(
            "MISSION_CREATED",
            mission="constitutional-learning-loop",
            authority="ConfigurationAuthority",
            provider="local-runtime",
            capability="self-improvement-queue",
            evidence={"queue_items": len(base_queue)},
            proof={"proof_type": "mission-queue", "queue_path": str(self.queue_path)},
            workflow="learning-loop",
        )
        return base_queue

    def run_learning_cycle(self) -> Dict[str, Any]:
        queue = self._load_queue() or self.build_queue()
        mission_result = execute_mission("VerifyReplay")
        indexes = generate_indexes(self.root)
        workspace = prepare_workspace("VerifyReplay", root=self.root)
        ranked_missions = rank_missions([
            {"id": "mission-duplicate-adapters", "impact": 2, "risk": 1, "authority_touched": 1, "replay_safety": 2, "tech_debt": 2, "frequency": 2, "previous_failures": 0},
            {"id": "mission-provider-config", "impact": 3, "risk": 2, "authority_touched": 2, "replay_safety": 3, "tech_debt": 3, "frequency": 3, "previous_failures": 1},
            {"id": "mission-authority-bypass", "impact": 4, "risk": 2, "authority_touched": 4, "replay_safety": 4, "tech_debt": 2, "frequency": 2, "previous_failures": 1},
        ])
        worktree = prepare_worktree("VerifyReplay", root=self.root)
        reflection = reflect_on_mission("VerifyReplay", mission_result, root=self.root)
        profile = update_mission_profile("VerifyReplay", {"ok": mission_result.get("ok"), "score": 25}, root=self.root)
        skill = register_skill("VerifyReplay", mission_result, root=self.root)
        proposal = propose_policy({"mission": "VerifyReplay", "recommendations": ["reuse semantic index", "reduce authority traversal depth"]}, root=self.root)
        metric_event = record_metric_event("ReplayAuthority", {"failure_rate": 0.02, "repair_time_min": 8, "trend": "improving"}, root=self.root)
        organizational_metrics = compute_organizational_metrics(root=self.root)
        roi = compute_roi({"engineering_value": 100, "engineering_cost": 20})
        decayed_knowledge = decay_knowledge_object({"confidence": 0.95, "recency": 5, "verification_count": 2, "contradictions": 0}, root=self.root)
        knowledge_score = score_knowledge_object(decayed_knowledge)
        patterns = mine_patterns([{"type": "Reflection", "mission": "VerifyReplay"}, {"type": "Reflection", "mission": "VerifyReplay"}, {"type": "Skill", "mission": "VerifyProjection"}])
        emit_knowledge_event(
            "REPLAY_COMPLETED",
            mission="constitutional-learning-loop",
            authority="ConfigurationAuthority",
            provider="local-runtime",
            capability="experience-memory",
            evidence={"queue_items": len(queue), "mission_ok": mission_result.get("ok"), "workspace_prepared": workspace.get("ok"), "ranked_missions": [item["id"] for item in ranked_missions], "reflection": reflection["reflection"]["mission"], "roi": roi},
            proof={"proof_type": "learning-cycle", "summary": indexes.get("summary", {}), "workspace_path": workspace.get("workspace", {}).get("path"), "worktree_path": worktree.get("worktree", {}).get("path"), "reflection_path": reflection.get("path"), "metrics_path": metric_event.get("path")},
            workflow="learning-loop",
        )
        return {"ok": True, "queue": queue, "mission": mission_result, "indexes": indexes.get("summary", {}), "workspace": workspace, "ranked_missions": ranked_missions, "worktree": worktree, "reflection": reflection, "profile": profile, "skill": skill, "proposal": proposal, "organizational_metrics": organizational_metrics, "roi": roi, "knowledge_confidence": decayed_knowledge, "knowledge_score": knowledge_score, "patterns": patterns}


if __name__ == "__main__":
    import json
    print(json.dumps(ConstitutionalLearningLoop().run_learning_cycle(), indent=2))
