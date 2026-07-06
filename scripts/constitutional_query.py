from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.mission_graph import build_mission_graph, query_mission_graph


def main() -> None:
    parser = argparse.ArgumentParser(description="Constitutional repository query engine")
    parser.add_argument("command", choices=["show", "why"], help="Query type")
    parser.add_argument("target", help="Mission or authority name")
    args = parser.parse_args()

    graph = build_mission_graph(root=ROOT)
    if args.command == "show":
        mission = query_mission_graph(graph, args.target)
        if mission is None:
            print(json.dumps({"ok": False, "error": "mission_not_found"}, indent=2))
        else:
            print(json.dumps(mission, indent=2))
    else:
        print(json.dumps({"ok": True, "target": args.target, "graph": graph["graph"]["nodes"][:3]}, indent=2))


if __name__ == "__main__":
    main()
