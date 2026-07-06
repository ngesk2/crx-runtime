from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def reflect_on_mission(mission_name: str, mission_result: Dict[str, Any], root: Optional[Path] = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    reflection = {
        "type": "Reflection",
        "mission": mission_name,
        "result": mission_result.get("ok", False),
        "confidence": 0.82,
        "mistakes": [
            "planner created redundant workspace",
            "replay graph larger than necessary",
        ],
        "improvements": [
            "reuse existing semantic index",
            "reduce authority traversal depth",
        ],
        "future_policy": [
            "prefer ProjectionAuthority before repository scan",
        ],
        "timestamp": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
    }
    reflections_root = root / "knowledge" / "reflections"
    reflections_root.mkdir(parents=True, exist_ok=True)
    reflection_path = reflections_root / f"{mission_name}.json"
    reflection_path.write_text(json.dumps(reflection, indent=2), encoding="utf-8")
    return {"ok": True, "reflection": reflection, "path": str(reflection_path)}
