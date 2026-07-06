from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def propose_policy(proposal: Dict[str, Any], root: Optional[Path] = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    policy_proposal = {
        "mission": proposal.get("mission", "unknown"),
        "recommendations": proposal.get("recommendations", []),
        "mutates_policy": False,
        "status": "proposed",
    }
    proposals_root = root / "knowledge" / "policy_proposals"
    proposals_root.mkdir(parents=True, exist_ok=True)
    proposal_path = proposals_root / f"{proposal.get('mission', 'unknown')}.json"
    proposal_path.write_text(json.dumps(policy_proposal, indent=2), encoding="utf-8")
    return {"ok": True, "proposal": policy_proposal, "path": str(proposal_path)}
