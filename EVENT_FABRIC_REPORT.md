# EVENT FABRIC REPORT

## Scope
This report documents the event fabric only where runtime evidence is directly observable.

## Observable evidence
- PostgreSQL logs show SQL execution and schema initialization in [docker_postgres_logs.txt](docker_postgres_logs.txt).
- Qdrant logs show HTTP requests to collection and point endpoints in [docker_qdrant_logs.txt](docker_qdrant_logs.txt).
- Runtime state artifacts show Postgres, Qdrant, and Mission Control were running at the time of capture: [docker_postgres_state.json](docker_postgres_state.json), [docker_qdrant_state.json](docker_qdrant_state.json), and [docker_mission_control_state.json](docker_mission_control_state.json).

## Event chain proof
| Stage | Status | Evidence |
|---|---|---|
| Producer | UNVERIFIED | No producer identity was observed in logs or runtime state. |
| Transport | OBSERVED | SQL traffic to PostgreSQL and HTTP traffic to Qdrant were observed. |
| Queue | UNVERIFIED | No queue runtime artifact was observed. |
| Dispatcher | UNVERIFIED | No dispatcher runtime artifact was observed. |
| Worker | UNVERIFIED | No worker execution log was observed. |
| Reducer | UNVERIFIED | No reducer execution log was observed. |
| Authority | UNVERIFIED | No authority invocation trace was observed. |
| Persistence | OBSERVED | PostgreSQL executed SQL and emitted schema errors. |
| Projection | OBSERVED | Qdrant processed collection and point requests. |
| Subscriber | UNVERIFIED | No live subscriber or consumer registration was observed. |

## Event-fabric conclusion
The event fabric is only partially observable at the persistence and projection edges. The middle of the chain—producer, queue, dispatcher, worker, reducer, authority, and subscriber—cannot be proven from the available runtime evidence and is therefore marked UNVERIFIED.
