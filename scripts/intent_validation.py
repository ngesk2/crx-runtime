from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from scripts.intent_graph_builder import generate_indexes

ROOT = Path(__file__).resolve().parents[1]


def validate_repository() -> Dict[str, Any]:
    result = generate_indexes(output_root=ROOT)
    graph = result["graph"]
    errors: List[str] = []

    for node in graph["nodes"]:
        if node["type"] == "Intent":
            if not node["label"]:
                errors.append("intent missing label")

    for edge in graph["edges"]:
        if edge["type"] == "governed_by":
            if not edge["target"].startswith("authority:"):
                errors.append(f"invalid authority binding: {edge}")

    return {
        "ok": not errors,
        "errors": errors,
        "summary": result["summary"],
    }


if __name__ == "__main__":
    print(json.dumps(validate_repository(), indent=2))
