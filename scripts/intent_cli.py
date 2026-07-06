from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.intent_graph_builder import generate_indexes, query_graph


def main() -> None:
    parser = argparse.ArgumentParser(description="Constitutional repository navigation")
    parser.add_argument("command", choices=["generate", "show"], help="Operation to run")
    parser.add_argument("--type", dest="node_type", default="authority")
    parser.add_argument("--name", dest="name", default="ReplayAuthority")
    args = parser.parse_args()

    if args.command == "generate":
        result = generate_indexes(output_root=ROOT)
        print(json.dumps(result["summary"], indent=2))
        return

    graph = generate_indexes(output_root=ROOT)["graph"]
    node = query_graph(graph, args.node_type, args.name)
    if node is None:
        print(json.dumps({"ok": False, "error": "node_not_found"}, indent=2))
    else:
        print(json.dumps(node, indent=2))


if __name__ == "__main__":
    main()
