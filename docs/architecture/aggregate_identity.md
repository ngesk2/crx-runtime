# Aggregate Identity

## Constitutional Definition

**aggregate_id** is the canonical constitutional identity for all entities in the runtime.

## Identity Hierarchy

```
aggregate_id (UUID)  ← Canonical Constitutional Identity
    ↓
document_id (string) ← Human Metadata Only
    ↓
source (string)      ← Human Metadata Only
```

## Immutable Rules

### Rule 1: aggregate_id is UUID Only
- Type: PostgreSQL UUID column
- Format: RFC 4122 UUID
- Purpose: Canonical event sourcing identity
- Usage: All event lineage, replay, witness, and projection operations

### Rule 2: document_id is Metadata Only
- Type: String (human-readable)
- Format: Any human identifier (doc_0, invoice_2026_001, etc.)
- Purpose: Human-facing reference
- Usage: Display, search, user interface
- **NOT** used for: Constitutional operations, replay, witness generation

### Rule 3: All Workers Use aggregate_id
- Observation Worker: `create_observations(event_id, aggregate_id, ...)`
- Claim Worker: `handle_observation_created(aggregate_id, ...)`
- Replay Worker: `execute_replay(aggregate_id)`
- Witness Worker: `generate_witness_root(aggregate_id, ...)`
- Lineage Worker: `build_lineage_chain(aggregate_id)`
- Projection Worker: `store_projection(aggregate_id, ...)`

### Rule 4: Event Queries Use aggregate_id
```sql
-- CORRECT
SELECT * FROM events WHERE aggregate_id = '550e8400-e29b-41d4-a716-446655440000';

-- INCORRECT
SELECT * FROM events WHERE event_data->>'document_id' = 'doc_0';
```

### Rule 5: document_id Remains in event_data
```json
{
  "aggregate_id": "550e8400-e29b-41d4-a716-446655440000",
  "aggregate_type": "DOCUMENT",
  "event_data": {
    "document_id": "doc_0",
    "title": "Sample Document",
    "source": "pdf"
  }
}
```

## Why This Matters

### Constitutional Integrity
- Replay chains are unified by aggregate_id
- Witness roots are deterministic based on aggregate_id
- Lineage tracking is consistent across all stages
- No identity fragmentation

### Event Sourcing Correctness
- All events for an entity share the same aggregate_id
- Event replay is guaranteed to reconstruct the same entity
- No ambiguity in event lineage
- Deterministic state reconstruction

### Future Contributor Protection
- This document freezes the aggregate identity pattern
- Future contributors MUST NOT reverse this decision
- Any attempt to use document_id for constitutional operations is a violation
- This is a non-negotiable architectural invariant

## Violation Examples

### ❌ INCORRECT: Using document_id for Replay
```python
def execute_replay(document_id: str):  # WRONG
    cursor.execute("SELECT * FROM events WHERE event_data->>'document_id' = %s", (document_id,))
```

### ✅ CORRECT: Using aggregate_id for Replay
```python
def execute_replay(aggregate_id: str):  # CORRECT
    cursor.execute("SELECT * FROM events WHERE aggregate_id = %s", (aggregate_id,))
```

### ❌ INCORRECT: Storing document_id in UUID Column
```sql
INSERT INTO projections (source_aggregate_id) VALUES ('doc_0');  -- WRONG
```

### ✅ CORRECT: Storing aggregate_id in UUID Column
```sql
INSERT INTO projections (source_aggregate_id) VALUES ('550e8400-e29b-41d4-a716-446655440000');  -- CORRECT
```

## Migration Path

For existing data with non-UUID document_ids:

1. Generate new UUID aggregate_ids for each document
2. Update all events to use the new aggregate_id
3. Keep document_id in event_data for human reference
4. Update all foreign key references to use aggregate_id

## Constitutional Test

**Test:** Delete all projections, replay events → identical witness root

**Pass Condition:** Only possible if aggregate_id is the canonical identity.

**Fail Condition:** If document_id is used for constitutional operations, replay will fragment.

## Status

**FROZEN** - This pattern is constitutional and cannot be changed without breaking replay determinism.

**Date:** 2026-06-25
**Version:** 1.0
