# CEO Deliverable 6: Retrieval Verification Specification

## Goal

Every document stored in Postgres must be retrievable from Qdrant with identical content.  
Every Qdrant point must trace back to a verified Postgres event.

## Consistency Check

```sql
-- Postgres side: count events that should have projections
SELECT COUNT(*) FROM events WHERE event_type IN ('PROJECTION_CREATED', 'DOCUMENT_IMPORTED');
```

```bash
# Qdrant side: count points
curl http://qdrant:6333/collections/constitutional_documents/points/count
```

**Assertion**: `events.count(PROJECTION_CREATED) <= qdrant.count_points`

## Per-Point Verification

Every Qdrant point must carry:

| Field | Source | Verification |
|-------|--------|-------------|
| `event_id` | Postgres event_id | Query Postgres by event_id |
| `payload_hash` | SHA-256 of canonical event payload | Recompute and compare |
| `authority` | Event authority field | Must be from RepositoryAuthority |
| `_verified` | Boolean | Must be True after verification |
| `timestamp` | Event timestamp | Must match Postgres |

## Verification Query

```python
def verify_projection(event_id):
    pg_event = query_postgres(f"SELECT * FROM events WHERE event_id = '{event_id}'")
    qdrant_point = query_qdrant(f"points/{event_id}")
    
    assert pg_event.event_id == qdrant_point.event_id
    assert sha256(canonical(pg_event.event_data)) == qdrant_point.payload_hash
    assert qdrant_point._verified == True
```

## Current State

**Not testable** — Docker is down. Qdrant has 5 points in `constitutional_documents` (from PipelineOrchestrator). The projection worker (`projection_worker.py`) is registered for `LINEAGE_CREATED` but stores only a projection record, not a Qdrant point. The actual Qdrant projection would be done by `qdrant_projection_worker.py` (dormant, 542 lines in `runtime/kernel/workers/`).

**Known gap**: `qdrant_projection_worker.py` is not wired into the pipeline. The current `projection_worker.py` stores metadata only — no Qdrant upsert.
