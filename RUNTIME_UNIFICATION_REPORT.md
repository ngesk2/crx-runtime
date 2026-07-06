# Runtime Unification Report — Phase 42 Tier 1B

## Three Non-Interoperating Event Pipeline Systems

### System 1: orchestration/execution/event_queue.js
- **Type**: In-memory + filesystem event store
- **Scope**: Orchestration fabric — mission lifecycle, worker dispatch, consensus
- **Events**: 31 orchestration event types (mission_created, worker_assigned, consensus_reached, etc.)
- **Storage**: In-memory Map + optional NewlineDelimited JSON filesystem persistence
- **Replay**: In-memory only (no durable replay checkpoint)
- **Consumers**: Orchestrator engine, dashboard, audit tools
- **Language**: Node.js
- **Connection to other systems**: None. Orchestration fabric runs independently.

### System 2: gateway Postgres constitutional pipeline
- **Type**: Postgres-backed event store
- **Scope**: Document pipeline — DOCUMENT_IMPORTED → ... → PROJECTION_CREATED
- **Events**: Constitutional event types (repository_events table, 16+ types)
- **Storage**: PostgreSQL `repository_events` table (CQRS schema)
- **Replay**: SQL query by event_id. No snapshot/checkpoint.
- **Consumers**: EventDispatcher (6 registered handlers), ReducerRegistry, verification
- **Language**: Node.js (gateway) + Python (worker_runtime.py dispatches 6 Python handlers)
- **Connection to other systems**: Workers emit back into this system via HTTP POST /events

### System 3: Gateway EventWriteAuthority telemetry
- **Type**: Postgres-backed telemetry store
- **Scope**: Telemetry events emitted by EventWriteAuthority.emit()
- **Events**: Ephemeral authority events
- **Storage**: PostgreSQL `events` table (separate from repository_events)
- **Replay**: query by event_id — but no consumers registered
- **Consumers**: None (silent — event_processing table not even linked)
- **Language**: Node.js
- **Connection to other systems**: Writes to separate `events` table. No cross-table FK. No processing tracking.

### Duplicate Dispatch Systems
1. **orchestration/execution/engine.js** — dispatches missions to workers via event_queue events
2. **gateway/runtime/dispatcher.js** — resolves ReducerRegistry entries for constitutional pipeline
3. **kernel/event_dispatcher.py** — dispatches events to 6 registered Python handler functions (driven by worker_runtime.py)

## Recommendation
- Do NOT unify in Phase 42. Each system serves a different lifecycle (orchestration missions, document pipeline, telemetry).
- Document the boundary:
  - orchestration/event_queue = agent coordination (OpenCode + future Ollama workers)
  - gateway constitutional pipeline = document ingestion + Qdrant projection
  - telemetry events = authority auditing (currently unwired, dormant)
- **Minimum unification**: Ensure all three write to PostgreSQL so they share durability and backup. Already true (all 3 use PG). No further unification required.
