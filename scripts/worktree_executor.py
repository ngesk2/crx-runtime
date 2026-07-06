from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def prepare_worktree(mission_name: str, root: Optional[Path] = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    worktree_root = root / "worktrees" / mission_name
    worktree_root.mkdir(parents=True, exist_ok=True)
    manifest = {
        "mission": mission_name,
        "path": str(worktree_root),
        "mode": "git-worktree",
        "status": "prepared",
        "notes": ["no-commit", "no-edit-main-tree", "replay-required"],
    }
    manifest_path = worktree_root / "worktree.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return {"ok": True, "mission": mission_name, "worktree": manifest}
