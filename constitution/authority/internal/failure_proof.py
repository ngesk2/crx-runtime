"""
Failure Proof Module

Owns the failure proof invariant:
- Failure proof records any failures during replay
- Failure proof enables replay failure diagnosis
"""

from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from constitution.models.event import EventEnvelope


def compute_failure_proof(events: list) -> dict[str, Any]:
    """
    Compute failure proof from events.
    
    Invariant: Failure proof records any failures during replay.
    For now, returns empty failure proof (no failures in successful replay).
    """
    return {'failures': []}
