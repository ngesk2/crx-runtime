# CEO Deliverable 4: Pipeline Trace Specification

## 8-Event Chain

When Docker is running and the pipeline is activated, injecting one document should produce this trace:

| Step | Event Type | Producer | Consumer | Side Effect |
|------|-----------|----------|----------|-------------|
| 1 | `DOCUMENT_IMPORTED` | gateway POST | observation_worker | events table insert |
| 2 | `OBSERVATION_CREATED` | observation_worker | claim_worker | events table insert |
| 3 | `CLAIM_GENERATED` | claim_worker | replay_worker | events table insert |
| 4 | `REPLAY_EXECUTED` | replay_worker | witness_worker | events table insert |
| 5 | `WITNESS_CREATED` | witness_worker | lineage_worker | events table insert |
| 6 | `LINEAGE_CREATED` | lineage_worker | projection_worker | events table insert |
| 7 | `PROJECTION_CREATED` | projection_worker | — | events table insert |

## Verification

```bash
# After injecting a document:
curl http://gateway:8080/events/stats
# Expected: +7 events (1 DOCUMENT_IMPORTED + 6 worker outputs)
```

## Failure Modes

| Failure | Symptom | Root Cause |
|---------|---------|------------|
| Chain stops at step 1 | Only DOCUMENT_IMPORTED found | CHECK constraint blocks worker event types (Blocker A) |
| Chain stops at step 1 | DOCUMENT_IMPORTED not in events table | Wrong `_persistEvent` columns (Blocker C, already fixed) |
| Worker never polls | GET /events/unprocessed returns 404 | Route not registered in gateway (Tier 1 fix applied) |
| Worker event emission fails | POST /events returns 500 | Gateway not reachable or schema issue |
