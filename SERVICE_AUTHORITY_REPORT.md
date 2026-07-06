# SERVICE AUTHORITY REPORT

## Scope
This report identifies the service-level authority boundaries that can be supported by observable evidence.

## Observed service authority mapping
| Service | Observed role | Evidence | Authority status |
|---|---|---|---|
| Postgres | Persistence and state storage | [docker_postgres_logs.txt](docker_postgres_logs.txt), [compose.yaml](compose.yaml) | OBSERVED |
| Qdrant | Projection and vector storage | [docker_qdrant_logs.txt](docker_qdrant_logs.txt), [compose.yaml](compose.yaml) | OBSERVED |
| Mission Control | Orchestration/control plane | [compose.yaml](compose.yaml), [docker_mission_control_state.json](docker_mission_control_state.json) | OBSERVED |
| Gateway | Ingress and routing | [compose.yaml](compose.yaml) | CONFIGURED / UNVERIFIED |
| Temporal | Workflow execution | [compose.brain.yaml](compose.brain.yaml) | CONFIGURED / UNVERIFIED |
| Worker Runtime | Event execution substrate | No runtime artifact proved this role | UNVERIFIED |
| Capability Runtime | Capability dispatch | No runtime artifact proved this role | UNVERIFIED |

## Authority boundary conclusion
The runtime clearly contains persistence and projection services. The remaining authority layers (gateway routing, capabilities, workers, Temporal execution) are configured or implied by the repository, but not proven as active runtime authorities.
