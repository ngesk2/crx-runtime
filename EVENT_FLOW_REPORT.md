# Event Flow Report — Phase 42 Tier 2D

## Complete DOCUMENT_IMPORTED Consumer Chain

### Edge 1: DOCUMENT_IMPORTED → OBSERVATION_CREATED

| Attribute | Value |
|-----------|-------|
| Producer | `workers/observation_worker.py:70` via `emit_event('OBSERVATION_CREATED')` |
| Consumer handler | `handle_document_imported()` at `workers/observation_worker.py:34` |
| Dispatcher | `kernel/event_dispatcher.py:82` |
| Emit method | `repository_client.emit_event()` → HTTP POST `/events` |
| Storage | `repository_events` (no CHECK constraint) |
| Classification | **BROKEN** — worker_runtime.py not running |
| Alternate path | Root `observation_worker.py` (class) → direct SQL → `events` table → CHECK REJECT |

### Edge 2: OBSERVATION_CREATED → CLAIM_GENERATED

| Attribute | Value |
|-----------|-------|
| Producer | `workers/claim_worker.py:78` via `emit_event('CLAIM_GENERATED')` |
| Consumer handler | `handle_observation_created()` at `workers/claim_worker.py:34` |
| Dispatcher | `kernel/event_dispatcher.py:83` |
| Emit method | `repository_client.emit_event()` → HTTP POST |
| Storage | `repository_events` |
| Classification | **BROKEN** — worker_runtime.py not running |
| Alternate path | Root `claim_worker.py` (class) → direct SQL → CHECK REJECT |

### Edge 3: OBSERVATION_CREATED → CANDIDATE_CLAIM_CREATED (alternative)

| Attribute | Value |
|-----------|-------|
| Worker file | `workers/candidate_claim_worker.py` |
| Classification | **MISSING** — referenced in AGENTS.md V2, file not on disk |

### Edge 4: CLAIM_GENERATED → REPLAY_EXECUTED

| Attribute | Value |
|-----------|-------|
| Producer | `workers/replay_worker.py:72` via `emit_event('REPLAY_EXECUTED')` |
| Consumer handler | `handle_claim_generated()` at `workers/replay_worker.py:34` |
| Dispatcher | `kernel/event_dispatcher.py:84` |
| Emit method | `repository_client.emit_event()` → HTTP POST |
| Storage | `repository_events` |
| Classification | **BROKEN** — worker_runtime.py not running |

### Edge 5: REPLAY_EXECUTED → WITNESS_CREATED

| Attribute | Value |
|-----------|-------|
| Producer | `workers/witness_worker.py:88` via `emit_event('WITNESS_CREATED')` |
| Consumer handler | `handle_replay_executed()` at `workers/witness_worker.py:34` |
| Dispatcher | `kernel/event_dispatcher.py:85` |
| Emit method | `repository_client.emit_event()` + `store_object('witness', ...)` |
| Storage | `repository_events` + `repository_objects` |
| Classification | **BROKEN** — worker_runtime.py not running |

### Edge 6: WITNESS_CREATED → LINEAGE_CREATED

| Attribute | Value |
|-----------|-------|
| Producer | `workers/lineage_worker.py:91` via `emit_event('LINEAGE_CREATED')` |
| Consumer handler | `handle_witness_created()` at `workers/lineage_worker.py:34` |
| Dispatcher | `kernel/event_dispatcher.py:86` |
| Emit method | `repository_client.emit_event()` + `store_object('lineage', ...)` + `store_object('authority_lineage', ...)` |
| Storage | `repository_events` + `repository_objects` |
| Classification | **BROKEN** — worker_runtime.py not running |

### Edge 7: LINEAGE_CREATED → PROJECTION_CREATED

| Attribute | Value |
|-----------|-------|
| Producer | `workers/projection_worker.py:86` via `emit_event('PROJECTION_CREATED')` |
| Consumer handler | `handle_lineage_created()` at `workers/projection_worker.py:34` |
| Dispatcher | `kernel/event_dispatcher.py:87` |
| Emit method | `repository_client.emit_event()` + `store_object('projection', ...)` |
| Storage | `repository_events` + `repository_objects` |
| Classification | **BROKEN** — worker_runtime.py not running; also this is a stub (no Qdrant write) |

## Dispatcher Systems (4 total)

| System | File | Handlers | Status |
|--------|------|----------|--------|
| A. Python kernel dispatcher | `kernel/event_dispatcher.py` | 6 registered (complete chain) | **DORMANT** — no runtime |
| B. Gateway ReducerRegistry | `gateway/runtime/reducer_registry.js` | 0 registered | **ACTIVE BUT EMPTY** |
| C. Gateway ConstitutionalDispatcher | `gateway/constitutional_dispatcher.js` | 7 hardcoded (DOCUMENT_IMPORTED: ['summary', 'lineage']) | **DORMANT** — no callers |
| D. Mission Control app.py | `brainos/.../app.py` | Reads event_type from query | **DORMANT** — container not running |

## Gateway Pipeline Audit (System B)

`ConstitutionalExecutionPipeline.execute()` runs on POST /events:

| Stage | File | What Happens | Classification |
|-------|------|-------------|---------------|
| Schema creation | `standard_event_schema.js:46` | Creates frozen event with hashes | **CONNECTED** |
| Repository persist | `event_repository.js:100` | Writes to `repository_events` | **CONNECTED** |
| Dispatcher.resolve | `runtime/dispatcher.js:7` | Calls `reducerRegistry.getForEvent()` | **RETURNS []** (no handlers) |
| Reducer execution | `runtime/reducer_registry.js:21` | Loops over 0 entries | **DORMANT** |
| Witness verification | Pipeline step | Verifies witness on event | **CONNECTED** |
| Verification | Pipeline step | 5-check verification | **CONNECTED** |
| Projection | `runtime/projection_registry.js:14` | `executeAll()` — 0 projectors | **DORMANT** |
| Replay decision | `runtime/replay_decision_authority.js:7` | Returns decision for event type | **CONNECTED** |

## Storage Paths

| Event Type | Storage 1 | Storage 2 | PG CHECK? |
|-----------|-----------|-----------|-----------|
| DOCUMENT_IMPORTED | `repository_events` | — | ✅ In events table CHECK |
| OBSERVATION_CREATED | `repository_events` | — | ❌ Not in CHECK |
| CLAIM_GENERATED | `repository_events` | — | ❌ Not in CHECK |
| REPLAY_EXECUTED | `repository_events` | — | ❌ Not in CHECK |
| WITNESS_CREATED | `repository_events` | `repository_objects` (witness) | ❌ Not in CHECK |
| LINEAGE_CREATED | `repository_events` | `repository_objects` (lineage, authority_lineage) | ❌ Not in CHECK |
| PROJECTION_CREATED | `repository_events` | `repository_objects` (projection) | ❌ Not in CHECK |

## Classification Summary

| Edge | Status | Root Cause |
|------|--------|-----------|
| DOCUMENT_IMPORTED produced | CONNECTED (via ingestion scripts) | — |
| E1: → OBSERVATION_CREATED | BROKEN | No worker runtime deployed |
| E2: → CLAIM_GENERATED | BROKEN | No worker runtime deployed |
| E3: → CANDIDATE_CLAIM_CREATED | MISSING | File not on disk |
| E4: → REPLAY_EXECUTED | BROKEN | No worker runtime deployed |
| E5: → WITNESS_CREATED | BROKEN | No worker runtime deployed |
| E6: → LINEAGE_CREATED | BROKEN | No worker runtime deployed |
| E7: → PROJECTION_CREATED | BROKEN | No worker runtime deployed + stub worker |
| Gateway persist | CONNECTED | — |
| Gateway dispatch | DORMANT (empty) | 0 ReducerRegistry handlers |
| Gateway projection | DORMANT (empty) | 0 ProjectionRegistry entries |

## Three Root Causes Blocking Every Edge

1. **No worker runtime deployed** — all 7 edges downstream of DOCUMENT_IMPORTED are blocked by the absence of a running `worker_runtime.py`. No docker-compose service exists for any Python worker.

2. **Gateway pipeline is write-only** — `ConstitutionalExecutionPipeline.execute()` persists events and runs verification but has zero registered reducers and zero registered projectors. No downstream processing occurs.

3. **Events table CHECK constraint** — if any worker wrote to the `events` table (rather than `repository_events`), every downstream event type would be silently rejected. The `repository_events` table has no CHECK constraint and accepts all types.
