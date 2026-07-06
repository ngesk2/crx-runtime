from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.mission_graph import build_mission_graph


def build_workspace(mission_name: str, root: Path | None = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    graph = build_mission_graph(root=root)
    mission = next((item for item in graph["missions"] if item["name"] == mission_name), None)
    if mission is None:
        return {"ok": False, "error": "mission_not_found"}
    return {
        "ok": True,
        "mission": mission_name,
        "workspace": {
            "intent": mission["intent"],
            "authorities": mission["authorities"],
            "specifications": ["specs/replay-authority"],
            "implementations": mission["implementations"],
            "evidence": mission["evidence"],
            "tests": ["tests/test_mission_graph.py"],
            "proofs": mission["proofs"],
        },
    }


def prepare_workspace(mission_name: str, root: Path | None = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    workspace = build_workspace(mission_name, root=root)
    if not workspace.get("ok"):
        return workspace

    workspace_root = root / "workspaces" / mission_name
    workspace_root.mkdir(parents=True, exist_ok=True)
    manifest = {
        "mission": mission_name,
        "path": str(workspace_root),
        "mode": "isolated-worktree",
        "status": "prepared",
        "workspace": workspace["workspace"],
    }
    manifest_path = workspace_root / "workspace.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return {"ok": True, "mission": mission_name, "workspace": manifest}


if __name__ == "__main__":
    import sys

    mission = sys.argv[1] if len(sys.argv) > 1 else "VerifyReplay"
    print(json.dumps(build_workspace(mission), indent=2))
