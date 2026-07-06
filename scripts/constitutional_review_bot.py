from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.constitutional_operating_mode import execute_mission


def review_pr(changed_files: List[str], mission_name: str = "VerifyReplay") -> Dict[str, Any]:
    mission_result = execute_mission(mission_name)
    return {
        "ok": True,
        "mission": mission_name,
        "affected_intents": [mission_result["workspace"]["workspace"]["intent"]],
        "affected_authorities": mission_result["workspace"]["workspace"]["authorities"],
        "proof": "review-bot-generated",
        "status": mission_result["diff"]["proof"],
    }


if __name__ == "__main__":
    print(json.dumps(review_pr(sys.argv[1:] or ["runtime/replay/", "replay_worker.py"]), indent=2))
