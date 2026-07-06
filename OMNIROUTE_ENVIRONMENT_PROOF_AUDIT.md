# OMNIROUTE ENVIRONMENT PROOF AUDIT

## Scope
This document reconstructs the OmniRoute environment using all observable artifacts available in this workspace: runtime state snapshots, compose definitions, environment files, startup logs, source bootstrap files, and registration-related code. The reconstruction is evidence-based and uses the following confidence model:

- PROVEN — directly observed in runtime artifacts, logs, or live state snapshots
- DERIVED — reconstructed from multiple consistent sources such as compose, bootstrap, DI, manifests, and registration code
- ASSUMED — cannot be derived from the available evidence and requires explicit validation

## 1. Evidence Inventory

### Artifacts available
| Artifact | Type | Timestamp | Source | Confidence |
|---|---|---|---|---|
| [compose.yaml](compose.yaml) | Compose definition | Unavailable in file metadata | Workspace | DERIVED |
| [compose.brain.yaml](compose.brain.yaml) | Compose override/profile definition | Unavailable in file metadata | Workspace | DERIVED |
| [.env.base](.env.base) | Runtime configuration | Unavailable in file metadata | Workspace | DERIVED |
| [docker_postgres_state.json](docker_postgres_state.json) | Runtime state snapshot | 2026-06-24 | Workspace | PROVEN |
| [docker_mission_control_state.json](docker_mission_control_state.json) | Runtime state snapshot | 2026-06-24 | Workspace | PROVEN |
| [docker_qdrant_state.json](docker_qdrant_state.json) | Runtime state snapshot | 2026-06-24 | Workspace | PROVEN |
| [docker_postgres_logs.txt](docker_postgres_logs.txt) | Startup log | 2026-06-24 | Workspace | PROVEN |
| [docker_qdrant_logs.txt](docker_qdrant_logs.txt) | Startup log | 2026-06-24 | Workspace | PROVEN |
| [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) | Bootstrap/runtime wiring | Unavailable in file metadata | Workspace | DERIVED |
| [gateway/routes/events.js](gateway/routes/events.js) | Runtime route | Unavailable in file metadata | Workspace | DERIVED |
| [runtime/execution_runtime.js](runtime/execution_runtime.js) | Execution runtime | Unavailable in file metadata | Workspace | DERIVED |
| [gateway/temporal_runtime.js](gateway/temporal_runtime.js) | Temporal runtime | Unavailable in file metadata | Workspace | DERIVED |

### Evidence trust summary
- Runtime state snapshots and logs provide the strongest direct evidence.
- Compose and configuration files provide strong structural evidence.
- Bootstrap and runtime source files provide wiring evidence that is consistent with the runtime artifacts but not sufficient alone to prove live registration.

## 2. Environment Graph

### Docker and service topology
| Node | Status | Evidence | Confidence |
|---|---|---|---|
| Postgres service | PROVEN running process | [docker_postgres_state.json](docker_postgres_state.json) | PROVEN |
| Qdrant service | PROVEN running process | [docker_qdrant_state.json](docker_qdrant_state.json) | PROVEN |
| Mission Control service | PROVEN running process | [docker_mission_control_state.json](docker_mission_control_state.json) | PROVEN |
| Compose-defined services | DERIVED from compose | [compose.yaml](compose.yaml) and [compose.brain.yaml](compose.brain.yaml) | DERIVED |
| Shared internal network | DERIVED from compose | [compose.yaml](compose.yaml) and [compose.brain.yaml](compose.brain.yaml) | DERIVED |
| Health checks | DERIVED from compose | [compose.yaml](compose.yaml) | DERIVED |
| Dependency ordering | DERIVED from compose | [compose.yaml](compose.yaml) | DERIVED |

### Environment graph summary
- The compose files define an internal network named ping_internal.
- Postgres, Qdrant, and Mission Control are directly evidenced as running processes.
- Service health was not fully successful in the observed snapshots; Postgres and Qdrant were both marked unhealthy by their health checks.

## 3. Boot Graph

### Observable boot chain
| Step | Status | Evidence | Confidence |
|---|---|---|---|
| Docker compose configuration parsed | PROVEN | `docker compose config ...` output | PROVEN |
| Compose services defined | DERIVED | [compose.yaml](compose.yaml) and [compose.brain.yaml](compose.brain.yaml) | DERIVED |
| Environment variables loaded | DERIVED | [.env.base](.env.base) | DERIVED |
| Container startup logs produced | PROVEN | [docker_postgres_logs.txt](docker_postgres_logs.txt) and [docker_qdrant_logs.txt](docker_qdrant_logs.txt) | PROVEN |
| Bootstrap/runtime wiring loaded | DERIVED | [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) and [runtime/execution_runtime.js](runtime/execution_runtime.js) | DERIVED |
| Service registration during startup | ASSUMED | No runtime registry or startup registration log was observed | ASSUMED |

### Boot sequence reconstruction
1. Compose definitions specify services and their dependencies.
2. Environment configuration supplies runtime values.
3. Container startup logs show Postgres and Qdrant initialized successfully.
4. Runtime bootstrap files indicate the runtime is intended to wire gateway, execution, and routing paths.
5. The transition from initial container startup to live registration of authorities, capabilities, workers, and routes remains unproven from the available evidence.

## 4. Registration Graph

### Registration inventory
| Component | Status | Evidence | Confidence |
|---|---|---|---|
| Authorities | ASSUMED | No runtime registry or startup output observed | ASSUMED |
| Capabilities | ASSUMED | No runtime registry observed | ASSUMED |
| Workers | ASSUMED | No worker registration output observed | ASSUMED |
| Reducers | ASSUMED | No reducer registration output observed | ASSUMED |
| Adapters | ASSUMED | No runtime adapter registration output observed | ASSUMED |
| Connectors | ASSUMED | No live connector registration observed | ASSUMED |
| Temporal workers/workflows/activities | ASSUMED | Defined in compose and source but not observed as active runtime registrations | ASSUMED |
| Queues | ASSUMED | No queue runtime state observed | ASSUMED |

## 5. Execution Graph

### Observable execution edges
| Edge | Status | Evidence | Confidence |
|---|---|---|---|
| Postgres persistence path | PROVEN | [docker_postgres_logs.txt](docker_postgres_logs.txt) shows SQL activity and schema initialization | PROVEN |
| Qdrant projection path | PROVEN | [docker_qdrant_logs.txt](docker_qdrant_logs.txt) shows collection and points requests | PROVEN |
| Ingress → mission | ASSUMED | No ingress or mission execution logs observed | ASSUMED |
| Mission → capability | ASSUMED | No capability dispatch evidence observed | ASSUMED |
| Capability → execution | ASSUMED | No execution dispatch evidence observed | ASSUMED |
| Execution → authority | ASSUMED | No authority invocation trace observed | ASSUMED |
| Authority → replay | ASSUMED | No replay runtime evidence observed | ASSUMED |
| Replay → projection | ASSUMED | No replay-to-projection chain observed | ASSUMED |
| Projection → delivery | ASSUMED | No delivery event observed | ASSUMED |

## 6. Dependency Graph

### Observed dependency relationships
| Upstream | Downstream | Status | Evidence |
|---|---|---|---|
| Compose definitions | Service startup order | DERIVED | [compose.yaml](compose.yaml) |
| Environment file | Runtime configuration | DERIVED | [.env.base](.env.base) |
| Mission Control | Postgres/Qdrant/Ollama | DERIVED | [compose.yaml](compose.yaml) |
| Postgres | Schema initialization | PROVEN | [docker_postgres_logs.txt](docker_postgres_logs.txt) |
| Qdrant | Collection and point operations | PROVEN | [docker_qdrant_logs.txt](docker_qdrant_logs.txt) |

### Failure propagation
- Postgres health was unhealthy because the healthcheck command failed with an argument error.
- Qdrant health was unhealthy because curl was not available inside the container image.
- These are container-level health issues, but they do not prove a broader runtime failure chain.

## 7. Reconstruction Graph

### Minimum artifacts required to reconstruct each node
| Node | Minimum artifacts required | Current status |
|---|---|---|
| Postgres runtime instance | State snapshot + logs | Available |
| Qdrant runtime instance | State snapshot + logs | Available |
| Mission Control runtime instance | State snapshot | Available |
| Compose topology | Compose files | Available |
| Runtime registration graph | Runtime registry/logs/diagnostics | Not available |
| Execution graph | Request logs/runtime traces | Not available |
| Replay graph | Replay runtime state/logs | Not available |
| Connector runtime graph | Connector health/auth/subscription logs | Not available |

### Reconstruction order
1. Compose topology
2. Environment configuration
3. Runtime state snapshots
4. Service startup logs
5. Registration logs/diagnostics
6. Execution traces
7. Replay/projection traces

## 8. Proof Matrix

| Node | Status | Evidence | Confidence |
|---|---|---|---|
| Gateway | DERIVED | Compose + bootstrap + runtime wiring | DERIVED |
| Identity authority | ASSUMED | No runtime evidence | ASSUMED |
| Execution runtime | DERIVED | Bootstrap and runtime source | DERIVED |
| Replay runtime | ASSUMED | No runtime evidence | ASSUMED |
| Projection runtime | PROVEN at service level | Qdrant logs and state | PROVEN |
| Persistence layer | PROVEN | Postgres logs and state | PROVEN |
| Container health | PROVEN | State snapshots and logs | PROVEN |
| Service registration | ASSUMED | No live registration output | ASSUMED |

## 9. Closure Analysis

### Fully reconstructable from current evidence
- Compose-defined service topology
- Environment configuration inputs
- That Postgres, Qdrant, and Mission Control were running at the time of snapshot capture
- That Postgres and Qdrant produced observable runtime activity
- That the runtime health checks for Postgres and Qdrant were failing for specific container-level reasons

### Partially reconstructable
- The intended boot and bootstrap wiring of the platform
- The intended dependency relationships among services and runtime components

### Not currently reconstructable
- The actual live registration graph for authorities, capabilities, workers, adapters, connectors, queues, and Temporal workers
- The actual runtime execution chain from ingress through capability, execution, authority, replay, persistence, and projection
- The actual runtime ownership boundaries among services
- The actual live connectivity and routing between components beyond the compose-level topology

### Missing evidence required for each gap
| Gap | Missing evidence |
|---|---|
| Registration graph | Startup logs with registration output, runtime registrations endpoint, diagnostics endpoint |
| Execution graph | Request traces, mission execution logs, route invocation logs, worker/dispatcher logs |
| Replay graph | Replay runtime logs, replay store contents, witness/regeneration traces |
| Connector graph | Connector health checks, auth status, subscription status, event ingestion logs |
| Temporal graph | Temporal namespace status, workflow registration, worker registration, activity registration |
