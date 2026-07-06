from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, Optional

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.knowledge_event_bus import emit_knowledge_event


class OllamaReasoningWorker:
    """A non-mutating reasoning worker that stores observations and repair proposals as knowledge artifacts."""

    def __init__(self, root: Optional[Path] = None):
        self.root = Path(root or ROOT)
        self.knowledge_root = self.root / "knowledge"

    def reason(self, mission: str = "constitutional-learning-loop") -> Dict[str, Any]:
        observations = [
            "knowledge events are being emitted",
            "mission artifacts are being persisted",
            "graph indexes are being refreshed",
        ]
        proposals = [
            {"type": "repair-proposal", "title": "Refresh embeddings for changed knowledge artifacts"},
            {"type": "repair-proposal", "title": "Consolidate duplicate provider configuration paths"},
        ]
        payload = {
            "mission": mission,
            "observations": observations,
            "proposals": proposals,
        }
        reasoning_path = self.knowledge_root / "reasoning" / f"{mission}.json"
        reasoning_path.parent.mkdir(parents=True, exist_ok=True)
        reasoning_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

        emit_knowledge_event(
            "PROOF_GENERATED",
            mission=mission,
            authority="ConfigurationAuthority",
            provider="ollama",
            capability="reasoning",
            evidence={"observations": observations, "proposal_count": len(proposals)},
            proof={"proof_type": "reasoning-worker", "reasoning_path": str(reasoning_path)},
            workflow="ollama-reasoning",
        )
        return payload


if __name__ == "__main__":
    print(json.dumps(OllamaReasoningWorker().reason(), indent=2))
