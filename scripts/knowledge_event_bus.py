from __future__ import annotations

import hashlib
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from runtime.config.configuration_authority import ConfigurationAuthority


class KnowledgeEventBus:
    """Emit replayable knowledge events for infrastructure and workflow activity."""

    def __init__(self, root: Optional[Path] = None):
        self.root = Path(root or ROOT)
        self.knowledge_root = self.root / "knowledge"
        self.events_dir = self.knowledge_root / "events"
        self.evidence_dir = self.knowledge_root / "evidence"
        self.proofs_dir = self.knowledge_root / "proofs"
        self.objects_dir = self.knowledge_root / "objects"
        self.config = ConfigurationAuthority.current()

    def emit(self, event_type: str, mission: str, authority: str, provider: str, capability: str,
             evidence: Optional[Dict[str, Any]] = None, proof: Optional[Dict[str, Any]] = None,
             workflow: Optional[str] = None, commit: Optional[str] = None, duration_ms: Optional[int] = None) -> Dict[str, Any]:
        timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        object_id = str(uuid.uuid4())
        payload = {
            "id": object_id,
            "type": "event",
            "mission_id": mission,
            "replay_id": f"replay:{mission}",
            "authority": authority,
            "capability": capability,
            "provider": provider,
            "event_type": event_type,
            "timestamp": timestamp,
            "payload": {
                "evidence": evidence or {},
                "proof": proof or {},
                "workflow": workflow or os.getenv("GITHUB_WORKFLOW", "local"),
                "commit": commit or os.getenv("GITHUB_SHA") or "local",
                "runner": os.getenv("RUNNER_NAME") or os.getenv("HOSTNAME") or "local",
                "duration_ms": duration_ms,
                "source": "constitutional-runtime",
            },
            "lineage": [],
            "hash": None,
            "created_at": timestamp,
        }
        payload_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()
        payload["hash"] = payload_hash
        payload["lineage"] = [payload_hash]

        self.objects_dir.mkdir(parents=True, exist_ok=True)
        object_path = self.objects_dir / f"{object_id}.json"
        object_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

        event_path = self.events_dir / f"{payload_hash}.json"
        self.events_dir.mkdir(parents=True, exist_ok=True)
        event_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

        if evidence:
            evidence_path = self.evidence_dir / f"{payload_hash}.json"
            evidence_path.write_text(json.dumps({"payload_hash": payload_hash, **evidence}, indent=2), encoding="utf-8")
        if proof:
            proof_path = self.proofs_dir / f"{payload_hash}.json"
            proof_path.write_text(json.dumps({"payload_hash": payload_hash, **proof}, indent=2), encoding="utf-8")

        return payload


def emit_knowledge_event(event_type: str, mission: str, authority: str, provider: str, capability: str,
                         evidence: Optional[Dict[str, Any]] = None, proof: Optional[Dict[str, Any]] = None,
                         workflow: Optional[str] = None, commit: Optional[str] = None, duration_ms: Optional[int] = None) -> Dict[str, Any]:
    return KnowledgeEventBus().emit(event_type, mission, authority, provider, capability, evidence=evidence, proof=proof, workflow=workflow, commit=commit, duration_ms=duration_ms)
