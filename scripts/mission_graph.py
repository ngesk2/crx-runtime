from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parents[1]


def _load_graph(root: Path) -> Dict[str, Any]:
    graph_path = root / "knowledge" / "knowledge-graph.json"
    if graph_path.exists():
        with graph_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    return {"nodes": [], "edges": []}


def build_mission_graph(root: Optional[Path] = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    graph = _load_graph(root)
    missions: List[Dict[str, Any]] = []

    mission_specs = [
        {
            "name": "VerifyReplay",
            "intent": "Replay Verification",
            "authority": "ReplayAuthority",
            "capabilities": ["ReplayTranscript", "ReplayVerifier", "ReplayWitness"],
            "providers": ["PostgreSQL", "Qdrant"],
            "implementations": ["runtime/kernel/replay"],
            "evidence": ["proofs/replay-proof.json"],
            "proofs": ["proofs/replay-proof.json"],
        },
        {
            "name": "VerifyEmbedding",
            "intent": "Semantic Embedding",
            "authority": "EmbeddingAuthority",
            "capabilities": ["EmbeddingModel"],
            "providers": ["HuggingFaceHub"],
            "implementations": ["runtime/authorities/embedding_authority.py"],
            "evidence": ["proofs/embedding-proof.json"],
            "proofs": ["proofs/embedding-proof.json"],
        },
        {
            "name": "VerifyProjection",
            "intent": "Projection Delivery",
            "authority": "ProjectionAuthority",
            "capabilities": ["ProjectionVector"],
            "providers": ["Qdrant"],
            "implementations": ["runtime/kernel/workers/qdrant_projection_worker.py"],
            "evidence": ["proofs/projection-proof.json"],
            "proofs": ["proofs/projection-proof.json"],
        },
    ]

    for spec in mission_specs:
        missions.append(
            {
                "name": spec["name"],
                "intent": spec["intent"],
                "authorities": [spec["authority"]],
                "capabilities": spec["capabilities"],
                "providers": spec["providers"],
                "implementations": spec["implementations"],
                "evidence": spec["evidence"],
                "proofs": spec["proofs"],
                "graph": graph,
            }
        )

    return {"missions": missions, "graph": graph}


def query_mission_graph(graph: Dict[str, Any], mission_name: str) -> Optional[Dict[str, Any]]:
    for mission in graph.get("missions", []):
        if mission.get("name") == mission_name:
            return mission
    return None


def plan_mission(mission_name: str, root: Optional[Path] = None) -> Dict[str, Any]:
    graph = build_mission_graph(root=root)
    mission = query_mission_graph(graph, mission_name)
    if mission is None:
        return {"ok": False, "error": "mission_not_found"}
    return {"ok": True, "mission": mission}


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        print(json.dumps(plan_mission(sys.argv[1]), indent=2))
    else:
        print(json.dumps(build_mission_graph(), indent=2))
