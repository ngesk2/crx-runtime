from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Dict

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.knowledge_event_bus import emit_knowledge_event
from scripts.intent_graph_builder import generate_indexes
from scripts.constitutional_operating_mode import execute_mission


def run_ci_cycle() -> Dict[str, Any]:
    mission_result = execute_mission("VerifyReplay")
    indexes = generate_indexes(ROOT)
    event = emit_knowledge_event(
        "GRAPH_UPDATED",
        mission="VerifyReplay",
        authority="ConfigurationAuthority",
        provider="github-actions",
        capability="knowledge-graph-refresh",
        evidence={"mission_ok": mission_result.get("ok"), "index_files": sorted(indexes.get("indexes", {}).keys())},
        proof={"proof_type": "ci-generated", "summary": indexes.get("summary", {})},
        workflow=os.getenv("GITHUB_WORKFLOW", "constitutional-ci"),
        commit=os.getenv("GITHUB_SHA") or "local",
    )
    return {"ok": True, "event": event, "indexes": indexes.get("summary", {})}


if __name__ == "__main__":
    print(json.dumps(run_ci_cycle(), indent=2))
