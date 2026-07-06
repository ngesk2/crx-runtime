# CEO Deliverable 5: Determinism Specification

## Definition

The constitutional runtime must produce **identical output for identical input** across 100 repeated executions.

## Scope (Phase 43)

Phase 43 determinism covers the **event pipeline only**:
- Same document → same chunks (paragraph splitting is deterministic)
- Same chunks → same observations → same claims → same replay → same witness → same lineage → same projection

## What ensures determinism

1. **No wall-clock time in event IDs** — `uuid.uuid4()` is non-deterministic but events are stored with deterministic SHA-256 hashes
2. **No Math.random()** — zero calls in the pipeline path
3. **No Date.now()** — all times come from `ConstitutionalTimeAuthority.now()` (returns a deterministic sequence during replay)
4. **No LLM inference** — workers are text processing only (paragraph splitting, string matching). Deterministic by construction.
5. **Deterministic hash chain** — `event_hash = SHA-256(event_type + aggregate_id + payload + previous_hash)`

## 100× Replay Protocol

```bash
# 1. Inject one document
curl -X POST http://gateway:8080/api/v1/documents/ingest -d '{"content":"..."}'

# 2. Wait for pipeline to complete
sleep 30

# 3. Capture first trace
curl http://gateway:8080/events/recent > trace_1.json

# 4. Reset (requires temporal rollback or fresh container)
docker-compose down -v && docker-compose up -d

# 5. Repeat steps 1-3 for n=2..100

# 6. Verify all traces are identical
python -c "
import json, hashlib
hashes = set()
for i in range(1, 101):
    with open(f'trace_{i}.json') as f:
        hashes.add(hashlib.sha256(json.dumps(json.load(f), sort_keys=True).encode()).hexdigest())
print(f'Deterministic: {len(hashes) == 1} ({len(hashes)} unique traces)')
"
```

## Current State

**Not testable** — Docker is down. The pipeline structure is deterministic by design (no LLM, no random, no wall clock) but has never been validated live.
