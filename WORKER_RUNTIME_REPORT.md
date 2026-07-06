# Worker Runtime Report — Phase 42 Tier 1C

## Worker Classification

| Worker | Handler | Emits | Runtime | Reachable | Status |
|--------|---------|-------|---------|-----------|--------|
| observation_worker | DOCUMENT_IMPORTED → OBSERVATION_CREATED | post_event | Python | ❌ | No docker-compose service / no auto-launch |
| candidate_claim_worker | OBSERVATION_CREATED → CANDIDATE_CLAIM_CREATED | post_event | Python | ❌ | Same |
| claim_worker | CANDIDATE_CLAIM_CREATED → CLAIM_CREATED | post_event | Python | ❌ | Same |
| replay_execution_worker | CLAIM_CREATED → REPLAY_EXECUTED | post_event | Python | ❌ | Same |
| witness_worker | REPLAY_EXECUTED → WITNESS_CREATED | post_event | Python | ❌ | Same |
| lineage_worker | WITNESS_CREATED → LINEAGE_CREATED | post_event | Python | ❌ | Same |

## Details

### observation_worker (workers/observation_worker.py)
- Handler: `handle_document_imported`
- Registers for: `DOCUMENT_IMPORTED`
- Emits: `OBSERVATION_CREATED` via `post_event()`
- post_event() calls `repository_client.emit_event()` → HTTP POST to gateway /events

### candidate_claim_worker (workers/candidate_claim_worker.py)
- Handler: `handle_observation_created`
- Registers for: `OBSERVATION_CREATED`
- Emits: `CANDIDATE_CLAIM_CREATED` via `post_event()`

### claim_worker (workers/claim_worker.py)
- Handler: `handle_candidate_claim_created`
- Registers for: `CANDIDATE_CLAIM_CREATED`
- Emits: `CLAIM_CREATED` via `post_event()`

### replay_execution_worker (workers/replay_execution_worker.py)
- Handler: `handle_claim_created`
- Registers for: `CLAIM_CREATED`
- Emits: `REPLAY_EXECUTED` via `post_event()`

### witness_worker (workers/witness_worker.py)
- Handler: `handle_replay_executed`
- Registers for: `REPLAY_EXECUTED`
- Emits: `WITNESS_CREATED` via `post_event()`

### lineage_worker (workers/lineage_worker.py)
- Handler: `handle_witness_created`
- Registers for: `WITNESS_CREATED`
- Emits: `LINEAGE_CREATED` via `post_event()`

## Reachability

All 6 workers are **UNREACHABLE** without:
1. A docker-compose service definition for each worker, OR
2. Manual `python3 workers/worker_runtime.py` launch, OR
3. An orchestrator (Temporal, systemd, supervisor)

None of these exist. Worker chain cannot execute in production without operator intervention.

## Worker Registration

All 6 handlers are registered by `register_event_handlers()` (imported from `kernel/event_dispatcher.py`). The dispatcher constructor maps `self.handlers: dict[str, list[callable]]`. Registration happens at import time via `@dispatcher.register('EVENT_TYPE')` decorators.

The worker_runtime.py calls `register_event_handlers()` once at startup, then dispatches in the polling loop.

## Recommendation
- Workers do NOT need individual services. One `worker_runtime.py` process handles all 6.
- Add a `worker` service to docker-compose.yml: `python3 workers/worker_runtime.py`
- Workers poll `/events/unprocessed` → dispatch → mark processed via HTTP
