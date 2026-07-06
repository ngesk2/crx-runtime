from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def score_missions(missions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    scored = []
    for mission in missions:
        impact = mission.get("impact", 0)
        risk = mission.get("risk", 0)
        authority_touched = mission.get("authority_touched", 0)
        replay_safety = mission.get("replay_safety", 0)
        tech_debt = mission.get("tech_debt", 0)
        frequency = mission.get("frequency", 0)
        previous_failures = mission.get("previous_failures", 0)
        score = (
            impact * 3
            + replay_safety * 2
            + tech_debt * 2
            + authority_touched * 2
            + frequency
            - risk
            - previous_failures
        )
        scored.append({**mission, "score": score})
    return scored


def rank_missions(missions: List[Dict[str, Any]], limit: int = 3) -> List[Dict[str, Any]]:
    scored = sorted(score_missions(missions), key=lambda item: item["score"], reverse=True)
    return scored[:limit]


def update_mission_profile(mission_name: str, outcome: Dict[str, Any], root: Optional[Path] = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    profile_path = root / "knowledge" / "profiles" / "missions.json"
    profile_path.parent.mkdir(parents=True, exist_ok=True)
    profile = {"missions": {}}
    if profile_path.exists():
        profile = json.loads(profile_path.read_text(encoding="utf-8"))
    mission_profile = profile.setdefault("missions", {}).get(mission_name, {"total_score": 0, "history": []})
    delta = outcome.get("score", 0)
    mission_profile["total_score"] = mission_profile.get("total_score", 0) + delta
    mission_profile["history"].append({"score": delta, "ok": outcome.get("ok", False)})
    profile["missions"][mission_name] = mission_profile
    profile_path.write_text(json.dumps(profile, indent=2), encoding="utf-8")
    return {"ok": True, "profile": mission_profile, "path": str(profile_path)}


def load_mission_profile(root: Optional[Path] = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    profile_path = root / "knowledge" / "profiles" / "missions.json"
    if not profile_path.exists():
        return {"missions": {}}
    return json.loads(profile_path.read_text(encoding="utf-8"))
