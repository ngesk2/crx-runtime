# Replay Authority Map

**Status**: COMPLETE (2026-08-21)
**Scope**: Every replay implementation in the repository — JS, Python, TS kernel
**Purpose**: Single source of truth for replay authority decisions

---

## Summary

| # | Implementation | Location | Status | Verdict |
|---|---------------|----------|--------|---------|
| 1 | JS ReplayWorker | `ping-runtime/workers/canonical_workers.js:220-248` | **LIVE (STUB)** | Always returns `verified: true`. No actual verification. |
| 2 | Python `workers/replay_worker.py` | `workers/replay_worker.py` | **DORMANT (STUB)** | Returns `replay_success: True, verification_status: 'pending'` unconditionally. |
| 3 | Python root `replay_worker.py` | `replay_worker.py` (repo root) | **DEAD** | Zero imports. Real SHA-256 fingerprint + sequence check. Not wired. |
| 4 | TS kernel replay engine | `gateway/replay/kernel/` (15 files) | **TEST-ONLY** | Full DeterministicReplayEngine with Merkle witnesses. Zero production imports. |

**Critical finding**: NO implementation performs actual event replay. The live chain's ReplayWorker is a pass-through stub.

---

## 1. JS ReplayWorker (LIVE STUB)

**File**: `ping-runtime/workers/canonical_workers.js:220-248`
**Chain position**: Stage 6 of 8 (observation → claim → classification → recommendation → projection → **REPLAY** → witness → lineage)
**Trigger**: `PROJECTION_CREATED` events
**Output**: `REPLAY_COMPLETED` events

### What it does
```javascript
// canonical_workers.js:226-247
async handle(event) {
  const replay = {
    documentId,
    eventType: event.event_type,
    timestamp: constitutionalTimeAuthority.nowAsISOString(),
    verified: true,  // ← ALWAYS TRUE, NO VERIFICATION PERFORMED
  };
  await this._emit('REPLAY_COMPLETED', { documentId, replay, upstreamEventId }, { causation_id });
  return { status: 'ok', replay };
}
```

### What it does NOT do
- Does NOT read any prior events from the chain
- Does NOT re-execute the event through a deterministic pipeline
- Does NOT verify event ordering, data integrity, or state transitions
- Does NOT produce Merkle witnesses or hash chains
- Does NOT detect replay anomalies

### Trace compatibility
- ✅ Preserves `correlation_id` via BaseWorker._emit
- ✅ Preserves `namespace` via BaseWorker._emit
- ✅ Records `confidence_source: inherited` (via BaseWorker._emit)
- ✅ Sets `causation_id: event.event_id` explicitly
- ❌ Does NOT propagate `trace_id`, `span_id`, `parent_span_id` (these do not exist)

### Authority status
**LIVE but WRONG** — the chain fires through it successfully, but the "verification" is meaningless. Every REPLAY_COMPLETED carries `replay.verified: true` regardless of what happened upstream.

---

## 2. Python `workers/replay_worker.py` (DORMANT STUB)

**File**: `workers/replay_worker.py`
**Entry points**: `kernel/event_dispatcher.py:76`, `kernel/stage0_event_handler.py:194`
**Trigger**: `CLAIM_GENERATED` events (different trigger than JS ReplayWorker)
**Output**: HTTP POST to gateway `/events` with `REPLAY_EXECUTED` event type

### What it does
```python
# workers/replay_worker.py:59-76
def handle_claim_generated(payload):
    event_data = {
        "event_type": "REPLAY_EXECUTED",
        "aggregate_id": f"replay_{aggregate_id}",
        "payload": json.dumps({
            "claim_id": claim_id,
            "replay_success": True,       # ← ALWAYS TRUE
            "verification_status": "pending",  # ← PENDING
            "replay_timestamp": None,     # ← NONE
        }),
        ...
    }
    return {"status": "ok", "event_id": event_id}
```

### What it does NOT do
- Does NOT actually replay any events
- Does NOT verify claim integrity
- Returns `verification_status: "pending"` permanently
- Uses HTTP POST to `localhost:3000/api/events` (the gateway path — now converged to UnifiedEventRuntime)

### Liveness
The kernel event_dispatcher.py imports this handler, but:
- The kernel event dispatcher is NOT invoked by the PING JS pipeline
- `constitutional_runtime.py` (the only caller of event_dispatcher) is NOT on the production path
- `stage0_event_handler.py` is also dormant (no production caller)

### Authority status
**DORMANT** — exists only as a Python-era stub. Not on any production path.

---

## 3. Python Root `replay_worker.py` (DEAD)

**File**: `replay_worker.py` (repo root, NOT `workers/replay_worker.py`)
**Entry points**: `constitutional_runtime.py:17` imports `handle_event`
**Trigger**: Events with fingerprint (from events table query)
**Output**: Direct psycopg2 INSERT to events table

### What it does
```python
# replay_worker.py:31-37
SHA256
├── update(data)  # deterministic hash of event data
└── hexdigest()   # fingerprint

# replay_worker.py:69-77
Expected sequence (HARDCODED):
  DOCUMENT_IMPORTED → OBSERVATION_PROCESSED → CLAIM_GENERATED → ...
```

### What it does NOT do
- Hardcoded expected sequence — does not generalize
- Query from events table without filtering — processes ALL events, not just projections
- No correlation_id or trace propagation

### Liveness
- `constitutional_runtime.py` is NOT on the PING production path
- Zero production imports
- Competing runtime (BrainOS era)

### Authority status
**DEAD** — zero imports, competing runtime.

---

## 4. TS Kernel Replay Engine (TEST-ONLY)

**File**: `gateway/replay/kernel/` (15 compiled JS files from TS source)
**Entry points**:
- `gateway/kernel_replay_execution_provider.js` — JIT replay (imports only on explicit replay request)
- `test_kernel_replay.js` — test suite (23+ tests including 6 negative)

### What it does
Complete DeterministicReplayEngine with:
- **State machine**: `initialized → replaying → completed | failed`
- **Merkle witnesses**: SHA-256 hash chain of replay events
- **Deterministic failure**: `failureTimestamp: 0` (not `Date.now()`)
- **Deterministic replay_id**: SHA-256 fingerprint, not `evt-*` prefix
- **Deep freeze**: `Object.freeze()` on replay transcript and result (TS source)
- **maxEvents fix**: Correctly accesses `replayConfig.maxEvents ?? 1000`

### What it does NOT do
- No production caller invokes it (zero callers outside test files and dormant `constitutional_runtime.js`)
- In-memory only — does not persist replay results to Postgres
- Does not link replay results back to the event chain

### Determinism
Full determinism in TS source (canonical JSON + SHA-256 + Object.freeze). Compiled JS has the implementation but is never called.

### Authority status
**TEST-ONLY** — the most complete implementation, but completely unwired from production.

---

## Cross-cutting Findings

### 1. No implementation performs actual replay
All four implementations either:
- Always return `verified: true` (JS ReplayWorker, Python workers/replay_worker.py)
- Are never invoked (Python root replay_worker.py, TS kernel)

### 2. The chain fires through ReplayWorker but it's hollow
The 8-worker chain runs: observation → claim → classification → recommendation → projection → **replay** → witness → lineage. The replay step at stage 6 emits REPLAY_COMPLETED with `verified: true` unconditionally. Downstream workers (witness, lineage) treat this as a real verification result.

### 3. Three different trigger events
| Implementation | Trigger | Why different |
|---------------|---------|---------------|
| JS ReplayWorker | `PROJECTION_CREATED` | Fires after projection, verifies the projection |
| Python workers/replay_worker.py | `CLAIM_GENERATED` | Fires after claim, verifies the claim |
| TS kernel replay engine | Explicit `replay()` call | JIT, on-demand |

### 4. Identity semantics diverge
| Implementation | replay_id format | Deterministic? |
|---------------|-----------------|----------------|
| JS ReplayWorker | None (no replay_id) | N/A |
| Python workers/replay_worker.py | None (no replay_id) | N/A |
| Python root replay_worker.py | SHA-256 fingerprint | Yes |
| TS kernel replay engine | SHA-256 fingerprint (not `evt-*`) | Yes |

### 5. Trace propagation status
| Field | JS ReplayWorker | Python workers/ | Python root | TS kernel |
|-------|----------------|----------------|-------------|-----------|
| event_id | ✅ via BaseWorker | ❌ | ❌ | ❌ |
| correlation_id | ✅ via BaseWorker | ❌ | ❌ | ❌ |
| causation_id | ✅ explicit | ❌ | ❌ | ❌ |
| namespace | ✅ via BaseWorker | ❌ | ❌ | ❌ |
| confidence | ✅ via BaseWorker | ❌ | ❌ | ❌ |

---

## Recommended Authority

**No implementation is ready to be the single replay authority.**

The TS kernel replay engine (`gateway/replay/kernel/`) has the most complete implementation (Merkle witnesses, deterministic failure, state machine), but is completely unwired.

The JS ReplayWorker is live but is a stub — it needs real replay logic.

### Path to replay authority
1. **Decide replay semantics**: What does "replay" mean in PING? Options:
   - (a) Re-execute the event chain deterministically and compare state
   - (b) Verify event ordering and data integrity
   - (c) Produce a verifiable transcript (Merkle witness) of the chain
   - (d) All of the above
2. **Choose implementation substrate**: TS kernel (complete but unwired) vs JS (live but stub) vs Python (dead)
3. **Wire chosen implementation** into the ReplayWorker's handle() method
4. **Test determinism**: Run the chain twice with identical events, verify identical replay results
5. **Propagate trace fields**: Ensure replay results carry correlation_id, namespace, etc.

### Currently: Replay is a no-op
The chain fires through it. The downstream workers accept the result. But no verification occurs. This is the highest-priority gap in the trace propagation chain.
