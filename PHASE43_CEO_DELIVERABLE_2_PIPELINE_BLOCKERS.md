# CEO Deliverable 2: Pipeline Blocker Assessment

## 3 Critical PostgreSQL Blockers

### Blocker A: CHECK constraint blocks all worker event types

`events` table has `CONSTRAINT valid_event_type CHECK (event_type IN (28 types...))` — but worker event types (`OBSERVATION_CREATED`, `CLAIM_GENERATED`, `REPLAY_EXECUTED`, `WITNESS_CREATED`, `LINEAGE_CREATED`, `PROJECTION_CREATED`) are NOT in the list.

**Effect**: Every worker INSERT is silently rejected (ON CONFLICT DO NOTHING means zero errors logged). The pipeline produces events but they vanish.

**Fix**: `database/fix_pipeline_blockers.sql` — extends the CHECK constraint with the 6 missing types.

### Blocker B: `aggregate_id UUID NOT NULL` rejects string IDs

Workers emit `aggregate_id = 'doc_0'`, `'claim_9'`, etc. (strings). The column is `UUID NOT NULL`.

**Effect**: Every worker INSERT fails type validation. Combined with Blocker A, INSERTs fail for two independent reasons.

**Fix**: `database/fix_pipeline_blockers.sql` — `ALTER TABLE events ALTER COLUMN aggregate_id TYPE VARCHAR(255)`.

### Blocker C: `_persistEvent()` column mismatch (ALREADY FIXED in Phase 41)

`event_write_authority.js` used old columns `(payload, correlation_id, created_at)` instead of CQRS `(event_data)`. Fixed in Phase 41 to use CQRS schema.

## Schema Fix Script

`database/fix_pipeline_blockers.sql` — apply when Postgres is accessible:

```sql
ALTER TABLE events ALTER COLUMN aggregate_id TYPE VARCHAR(255);
ALTER TABLE events DROP CONSTRAINT valid_event_type;
ALTER TABLE events ADD CONSTRAINT valid_event_type CHECK (event_type IN (/* 34 types */));
CREATE TABLE IF NOT EXISTS event_processing (...);
```

## Impact

After this script, worker events will persist for the first time in repository history. The 6-worker pipeline (which has been structurally complete since Phase 41) will produce traceable events.
