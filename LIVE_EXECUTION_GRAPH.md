# LIVE EXECUTION GRAPH

## Scope
This report documents only the execution paths that can be proven from observable runtime evidence. No import graph or source-level flow is treated as runtime proof.

## Observable execution evidence
- [docker_qdrant_logs.txt](docker_qdrant_logs.txt) shows Qdrant receiving HTTP requests to /collections and /points endpoints.
- [docker_postgres_logs.txt](docker_postgres_logs.txt) shows PostgreSQL processing SQL statements and returning errors related to the events schema.
- [docker_postgres_state.json](docker_postgres_state.json) and [docker_qdrant_state.json](docker_qdrant_state.json) show the services were running when the snapshots were captured.

## Live path evidence
| Edge | Status | Evidence |
|---|---|---|
| Ingress → Mission | UNVERIFIED | No ingress request log or mission-creation event was observed. |
| Mission → Capability | UNVERIFIED | No capability dispatch log was observed. |
| Capability → Execution | UNVERIFIED | No runtime execution dispatch trace was observed. |
| Execution → Authority | UNVERIFIED | No authority invocation trace was observed. |
| Authority → Replay | UNVERIFIED | No replay invocation was observed. |
| Replay → Projection | UNVERIFIED | No replay-to-projection chain was observed. |
| Projection → Delivery | UNVERIFIED | No delivery or outbound event trace was observed. |
| Storage path: Postgres | OBSERVED | PostgreSQL processed SQL and emitted schema-related errors. |
| Projection path: Qdrant | OBSERVED | Qdrant received HTTP requests to collections and points endpoints. |

## Conclusion
A partial runtime path is observable for persistence and projection, but the full live execution chain from ingress through mission, capability, authority, replay, and delivery is not proven by the available evidence.
