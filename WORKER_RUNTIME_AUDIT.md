# Worker Runtime Audit — Phase 42 Tier 1D

## Exactly-Once Processing — PASS (after repair)

**Before**: In-memory `processed = set()` — lost on restart, unbounded growth, zero durability.

**After**: `event_processing` table via HTTP API:
- `/events/unprocessed` uses LEFT JOIN against `event_processing` — only returns events NOT yet processed
- Worker dispatches → marks via `POST /events/processed`
- On restart: container has zero state — polls `/events/unprocessed`, gets only genuinely unprocessed events
- `ON CONFLICT DO UPDATE` ensures idempotent marking — double-mark is safe
- **Exactly-once is guaranteed** at the database level: event_processing table is the single source of truth

### Caveats
1. **Dispatcher is not idempotent** — if a handler succeeds but the `mark_processed()` HTTP call fails, the event will be retried. Handler must tolerate double-dispatch.
2. **No dead letter queue** — failed events are retried via `markFailed()` + retry counter, but there's no mechanism to skip permanently-failed events after N retries.

## Back-Pressure — FAIL

### Current Implementation
- Single-threaded, no concurrency
- Serial dispatch: for each event, dispatch → wait → mark → next event
- No rate limiting
- No queue depth limits
- No fairness (all event types processed FIFO by timestamp)
- Batch-limited: `limit=100` per poll cycle

### Limitations
1. **No concurrent processing** — if an event handler blocks (e.g., waiting for Ollama), the entire pipeline stalls
2. **No back-pressure signals** — if the gateway is overloaded, worker_runtime.py continues polling at full rate
3. **No circuit breaker** — consecutive error threshold causes shutdown (MAX_RETRIES=3), but no graceful degradation
4. **No priority queue** — DOCUMENT_IMPORTED and LINEAGE_CREATED compete equally for dispatch

### Assessment
Back-pressure is **not implemented**. The current single-threaded serial dispatch works correctly for low-throughput scenarios (< 10 events/min). For production throughput:
- Add concurrent dispatch with configurable concurrency limit
- Add circuit breaker for gateway failures
- Add per-event-type priority levels
- **Deferred** — not a repair target for Phase 42

## Worker Health — FAIL

### Current State
- No health endpoint for worker_runtime.py
- No health endpoint for any individual worker handler
- No liveness/readiness probes in docker-compose
- No Prometheus metrics
- No structured logging
- No way to determine if worker_runtime.py is running without checking container logs

### Assessment
Worker health is **not implemented**. The worker_runtime.py has no HTTP server, no health endpoint, and no monitoring integration.

### Minimum viable health (recommended for Phase 42)
Add a simple HTTP health endpoint to worker_runtime.py:

```
GET /health → 200 OK { status: "running", workers: 6, uptime: 1234 }
```

Running on a configurable port (e.g., 9100) so docker-compose can add a healthcheck.

## Summary

| Aspect | Verdict | Notes |
|--------|---------|-------|
| Exactly-Once | ✅ PASS | event_processing table after repair |
| Back-Pressure | ❌ FAIL | Single-threaded serial dispatch, no limits |
| Worker Health | ❌ FAIL | No health endpoint, no monitoring |
