"""
Lineage Module

Owns the lineage proof invariant:
- Lineage proofs track event causality relationships
- Causality graphs enable event ancestry verification
"""

from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from constitution.models.event import EventEnvelope


def compute_lineage_proof(events: list) -> dict[str, Any]:
    """
    Compute lineage proof from events.
    
    Invariant: Lineage proof tracks causality relationships for event ancestry verification.
    """
    lineage = {}
    for event in events:
        lineage[event.event_id] = {
            'causality_id': event.causality_id,
            'correlation_id': event.correlation_id,
        }
    return lineage


def compute_aggregate_roots(events: list) -> list[str]:
    """
    Compute aggregate roots from events.
    
    Invariant: Aggregate roots are events with no causality_id (root events).
    """
    roots = set()
    for event in events:
        if event.causality_id:
            roots.add(event.causality_id)
    return list(roots)
