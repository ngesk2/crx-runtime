# DOCKER RUNTIME REPORT

## Scope
This report is based on the observable runtime artifacts currently available in the workspace.

## Recorded container evidence
| Container | Compose origin | Evidence | Status |
|---|---|---|---|
| Postgres | [compose.yaml](compose.yaml) | [docker_postgres_state.json](docker_postgres_state.json), [docker_postgres_logs.txt](docker_postgres_logs.txt) | Running; health unhealthy |
| Mission Control | [compose.yaml](compose.yaml) | [docker_mission_control_state.json](docker_mission_control_state.json) | Running |
| Qdrant | [compose.yaml](compose.yaml) | [docker_qdrant_state.json](docker_qdrant_state.json), [docker_qdrant_logs.txt](docker_qdrant_logs.txt) | Running; health unhealthy |

## Observed container facts
- Postgres was started and initialized schema objects during startup.
- Qdrant was started and served HTTP on port 6333 according to its logs.
- Mission Control was running when the saved state artifact was captured.

## Missing runtime facts
- Container IP addresses
- Container network attachments
- Volume and bind mount mounts from live Docker inspection
- Environment variables as seen inside the containers
- Restart counts beyond what the state files recorded
- Orphaned containers, duplicate services, stale images, or stale networks

## Conclusion
The available runtime artifacts prove that at least three services were up and produced observable activity, but they do not provide a complete Docker topology or a full inventory of runtime resources.
