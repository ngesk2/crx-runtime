from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.mission_graph import build_mission_graph


def build_diff(changed_files: List[str], root: Path | None = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    mission_graph = build_mission_graph(root=root)
    impact: List[str] = []
    if any("replay" in item.lower() for item in changed_files):
        impact.append("ReplayAuthority")
    if any("embedding" in item.lower() for item in changed_files):
        impact.append("EmbeddingAuthority")
    if any("projection" in item.lower() for item in changed_files):
        impact.append("ProjectionAuthority")
    return {
        "ok": True,
        "files_changed": changed_files,
        "authorities_changed": impact,
        "mission_impact": [mission["name"] for mission in mission_graph["missions"] if mission["authorities"][0] in impact],
        "proof": "semantic-diff-generated",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Constitutional semantic diff")
    parser.add_argument("files", nargs="+", help="Changed files")
    args = parser.parse_args()
    print(json.dumps(build_diff(args.files), indent=2))
