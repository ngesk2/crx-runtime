from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.mission_graph import build_mission_graph


def build_plan(request: str, root: Optional[Path] = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    text = request.lower()
    if "replay" in text:
        mission_name = "VerifyReplay"
    elif "embedding" in text:
        mission_name = "VerifyEmbedding"
    elif "projection" in text:
        mission_name = "VerifyProjection"
    else:
        mission_name = "VerifyReplay"

    mission_graph = build_mission_graph(root=root)
    mission = next((item for item in mission_graph["missions"] if item["name"] == mission_name), None)
    if mission is None:
        return {"ok": False, "error": "mission_not_found"}

    dag: List[Dict[str, Any]] = [
        {"kind": "Mission", "name": mission_name},
        {"kind": "Intent", "name": mission["intent"]},
        {"kind": "Authority", "name": mission["authorities"][0]},
        {"kind": "Capability", "name": mission["capabilities"][0]},
        {"kind": "Authority", "name": "ExecutionAuthority"},
        {"kind": "Authority", "name": "RepositoryAuthority"},
        {"kind": "Authority", "name": "ProjectionAuthority"},
        {"kind": "Evidence", "name": mission["evidence"][0]},
        {"kind": "Proof", "name": mission["proofs"][0]},
    ]
    execution_graph = {
        "mission": mission_name,
        "tasks": [
            {"id": "plan", "kind": "planner", "depends_on": []},
            {"id": "lease", "kind": "resource", "depends_on": ["plan"]},
            {"id": "worktree", "kind": "worktree", "depends_on": ["lease"]},
            {"id": "execute", "kind": "execution", "depends_on": ["worktree"]},
            {"id": "replay", "kind": "replay", "depends_on": ["execute"]},
            {"id": "witness", "kind": "witness", "depends_on": ["replay"]},
            {"id": "review", "kind": "review", "depends_on": ["witness"]},
        ],
    }
    return {"ok": True, "mission": mission_name, "dag": dag, "execution_graph": execution_graph}


if __name__ == "__main__":
    import sys

    request = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Verify repository replay determinism."
    print(json.dumps(build_plan(request), indent=2))
