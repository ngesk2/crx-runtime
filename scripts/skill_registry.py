from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def register_skill(mission_name: str, mission_result: Dict[str, Any], root: Optional[Path] = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    skill = {
        "name": "Replay Verification",
        "requires": ["ReplayAuthority", "WitnessAuthority"],
        "steps": [
            "Build semantic graph",
            "Verify ordering",
            "Replay",
            "Compare witness",
        ],
        "confidence": 0.96,
        "uses": 184,
        "mission": mission_name,
    }
    skills_root = root / "knowledge" / "skills"
    skills_root.mkdir(parents=True, exist_ok=True)
    skill_path = skills_root / f"{mission_name}.json"
    skill_path.write_text(json.dumps(skill, indent=2), encoding="utf-8")
    return {"ok": True, "skill": skill, "path": str(skill_path)}
