from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.constitutional_planner import build_plan
from scripts.workspace_builder import build_workspace
from scripts.constitutional_diff import build_diff
from scripts.knowledge_event_bus import emit_knowledge_event


def _mission_dir(root: Path, mission_name: str) -> Path:
    return root / "missions" / mission_name


def _write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def execute_mission(mission_name: str, root: Optional[Path] = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    plan = build_plan("Verify repository replay determinism.", root=root)
    workspace = build_workspace(mission_name, root=root)
    diff = build_diff(["runtime/replay/", "replay_worker.py"], root=root)

    mission_root = _mission_dir(root, mission_name)
    mission_root.mkdir(parents=True, exist_ok=True)

    mission_state = {
        "mission": mission_name,
        "intent": workspace.get("workspace", {}).get("intent"),
        "authorities": workspace.get("workspace", {}).get("authorities", []),
        "specifications": workspace.get("workspace", {}).get("specifications", []),
        "implementations": workspace.get("workspace", {}).get("implementations", []),
        "evidence": workspace.get("workspace", {}).get("evidence", []),
        "proofs": workspace.get("workspace", {}).get("proofs", []),
        "plan": plan,
        "diff": diff,
        "status": "completed",
    }

    _write_json(mission_root / "mission.yaml", {"name": mission_name, "status": "completed"})
    _write_json(mission_root / "workspace.json", workspace)
    _write_json(mission_root / "results.json", mission_state)
    _write_json(mission_root / "proofs" / "execution.json", {"mission": mission_name, "status": "completed"})

    emit_knowledge_event(
        "MISSION_COMPLETED",
        mission=mission_name,
        authority="ConfigurationAuthority",
        provider="constitutional-runtime",
        capability="mission-execution",
        evidence={"mission": mission_name, "status": "completed", "plan_items": len(plan.get("steps", []))},
        proof={"proof_type": "mission-execution", "mission_root": str(mission_root)},
        workflow="constitutional-operating-mode",
    )

    return {"ok": True, "mission": mission_name, "workspace": workspace, "plan": plan, "diff": diff}


def load_mission_state(mission_name: str, root: Optional[Path] = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    results_path = _mission_dir(root, mission_name) / "results.json"
    if not results_path.exists():
        return {"ok": False, "error": "mission_not_found"}
    return json.loads(results_path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    import sys

    mission_name = sys.argv[1] if len(sys.argv) > 1 else "VerifyReplay"
    print(json.dumps(execute_mission(mission_name), indent=2))
