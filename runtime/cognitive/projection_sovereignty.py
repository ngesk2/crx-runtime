"""
Projection Sovereignty — Rule 7

Before using any projection, verify that the projection's payload_hash
matches the event's payload_hash. If mismatch, the projection is ignored.

Constitutional principle: Projections are subordinate to events.
Only verified projections may be used as evidence.
"""
import hashlib
import json
from typing import Dict, Any, Optional, Tuple


class ProjectionSovereignty:
    """
    Verifies that projected data matches source events.
    A projection is only sovereign if its hash chain is intact.
    """

    @staticmethod
    def verify_projection(
        projection_payload_hash: Optional[str],
        event_payload_hash: Optional[str],
        projection_data: Optional[Dict[str, Any]] = None,
        event_data: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        result = {
            "verified": False,
            "projection_hash": projection_payload_hash,
            "event_hash": event_payload_hash,
            "hashes_match": False,
            "content_match": False,
            "error": None
        }
        if projection_payload_hash and event_payload_hash:
            result["hashes_match"] = (projection_payload_hash == event_payload_hash)
        elif projection_payload_hash or event_payload_hash:
            result["hashes_match"] = False
        else:
            result["hashes_match"] = False
            result["error"] = "no hashes available for comparison"
            return False, result

        if projection_data and event_data:
            proj_str = json.dumps(projection_data, sort_keys=True)
            event_str = json.dumps(event_data, sort_keys=True)
            result["content_match"] = (proj_str == event_str)
        else:
            result["content_match"] = result["hashes_match"]

        result["verified"] = result["hashes_match"] and result["content_match"]
        return result["verified"], result

    @staticmethod
    def compute_payload_hash(payload: Dict[str, Any]) -> str:
        return hashlib.sha256(
            json.dumps(payload, sort_keys=True).encode('utf-8')
        ).hexdigest()

    @staticmethod
    def filter_unverified_projections(
        projections: list,
        event_lookup: Dict[str, Dict[str, Any]]
    ) -> Tuple[list, list]:
        verified = []
        ignored = []
        for proj in projections:
            event_id = proj.get('event_id') or proj.get('id')
            proj_hash = proj.get('payload_hash') or proj.get('projection_hash')
            event = event_lookup.get(str(event_id))
            if event:
                event_hash = event.get('payload_hash') or ProjectionSovereignty.compute_payload_hash(event.get('payload', {}))
                ok, _ = ProjectionSovereignty.verify_projection(proj_hash, event_hash)
                if ok:
                    verified.append(proj)
                else:
                    ignored.append(proj)
            else:
                ignored.append(proj)
        return verified, ignored
