# G.5 Postgres Authority Audit

**Date:** 2026-06-25  
**Method:** `docker exec` SQL queries, schema inspection, size measurements

---

## Instance Overview

| Property | Value |
|---|---|
| Container | brain-postgres |
| Image | postgres:15-alpine |
| Data volume | crx_crx-postgres-volume (47 MB on disk) |
| Database | crx_runtime (8,767 KB according to Postgres) |
| max_connections | 100 |
| Current connections | 6 |
| SSL | not configured |
| Healthcheck | **failing** (incorrect healthcheck) |

---

## Database Inventory

### Databases
```
postgres  (default)
crx_runtime  (primary application database)
```

### Tables With Data

| Table | Row Count | Content |
|---|---|---|
| `events` | 15 | Full event-sourcing history (constitutional amendments ingested) |
| `artifact_registry` | 15 | Artifact tracking entries |
| `authority_objects` | 15 | Authority object definitions |
| `authority_lineage` | 4 | Lineage chain relationships |

### Tables That Are Empty (Expected by Event-Sourcing Model)

| Table | Row Count | Expected? | Notes |
|---|---|---|---|
| `entities` | 0 | Yes | No entity creation events emitted yet |
| `relationships` | 0 | Yes | No cross-entity edges defined |
| `claims` | 0 | Yes | Candidate_claim worker hasn't run production |
| `projections` | 0 | Yes | Projection worker hasn't stored projection metadata in Postgres |
| `event_store` | 0 | No | This is an EVENT SOURCE table if CQRS is used — empty suggests events go to `events` table only |
| `model_outputs` | 0 | Yes | No worker output stored back to Postgres |
| `summary_cache` | 0 | Yes | No summaries generated |

### Tables That Don't Exist (Referenced in Code)

| Table Name | Referenced In | Gap |
|---|---|---|
| `authority_witness` | constitutional_retrieval.py | Code queries it for authority resolution — table doesn't exist |
| `lineage` | constitutional_retrieval.py | Code queries it for lineage — table doesn't exist |
| `supersession` | constitutional_retrieval.py | Code checks superseding docs — table doesn't exist |
| `replay_snapshots` | replay scripts | Not created |
| `projection_status` | qdrant_projection_worker.py | Referenced for tracking projected events |
| `events_idempotency` | Various workers | Referenced for deduplication |

---

## Schema Compliance

The `events` table uses the expected event-sourcing schema:
```
event_id (uuid, PK)
event_type (varchar)
timestamp (timestamptz)
aggregate_id (uuid)
aggregate_type (varchar)
event_data (jsonb)
```

This matches what all 8 workers emit. **No schema mismatch.**

## Schema Drift Areas

| Area | Running DB | Expected by Code | Severity |
|---|---|---|---|
| events table | 6 columns | 6 columns | ✅ Match |
| artifact_registry | 5 columns | 5 columns | ✅ Match |
| authority_objects | 5 columns | 5 columns | ✅ Match |
| authority_lineage | 4+ columns | 4+ columns | ✅ Match (approximate) |
| Missing tables | 4 referenced, 0 exist | Existence assumed | ❌ CODE/DB MISMATCH (4 tables referenced, 0 exist) |

## Key Findings

1. **The 6-column events schema is confirmed correct.** The previous audit's claim of "schema mismatch" was based on stale assumptions. Workers DO match the running database.

2. **Four tables referenced in code do not exist:**
   - `authority_witness` — `/constitution/search` endpoint will fail if it reaches that code path
   - `lineage` — same endpoint, same risk
   - `supersession` — authority resolution fails gracefully?
   - `projection_status` — worker references but only creates as fallback

3. **Postgres is the single source of truth** — 15 events, 15 artifacts, 15 authority objects, 4 lineage rows. Total: 49 authoritative rows across 4 tables. Zero backups exist.

4. **No replication, no failover.** Single instance with `max_connections=100`, currently using 6. Adequate for current load but catastrophic if lost.

5. **Connection from outside the container network is impossible.** Port 5432 is not exposed to host. Only containers on `compose_brain_internal` (currently: only brain-qdrant) can connect. The crx services and open-webui have NO database access.
