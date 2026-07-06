# REPLAY RUNTIME REPORT

## Scope
This report evaluates replay only from observable runtime evidence.

## Observable evidence
- PostgreSQL logs show persistence activity and schema initialization in [docker_postgres_logs.txt](docker_postgres_logs.txt).
- Qdrant logs show projection activity in [docker_qdrant_logs.txt](docker_qdrant_logs.txt).
- No replay-store, replay-invocation, witness-regeneration, or lineage-regeneration runtime artifact was observed.

## Replay checks
| Check | Status | Evidence |
|---|---|---|
| Replay store | UNVERIFIED | No replay-store runtime artifact or database table was observed. |
| Replay invocation | UNVERIFIED | No replay execution log or API invocation was observed. |
| Deterministic hashes | UNVERIFIED | No replay hash output or verification log was observed. |
| Witness regeneration | UNVERIFIED | No witness regeneration runtime artifact was observed. |
| Lineage regeneration | UNVERIFIED | No lineage regeneration runtime artifact was observed. |

## Conclusion
Replay is not proven operationally from the available evidence. Its status is UNVERIFIED.
