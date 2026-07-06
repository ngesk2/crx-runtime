# ENVIRONMENT TOPOLOGY

## Scope
This report is limited to observable evidence from the repository, compose definitions, environment files, and saved runtime-state artifacts. No assumptions are made about services that were not directly observed.

## Observable evidence
- Compose definitions were read from [compose.yaml](compose.yaml) and [compose.brain.yaml](compose.brain.yaml).
- Runtime configuration was read from [.env.base](.env.base).
- Saved runtime-state artifacts were read from [docker_postgres_state.json](docker_postgres_state.json), [docker_mission_control_state.json](docker_mission_control_state.json), and [docker_qdrant_state.json](docker_qdrant_state.json).
- Startup logs were read from [docker_postgres_logs.txt](docker_postgres_logs.txt) and [docker_qdrant_logs.txt](docker_qdrant_logs.txt).

## Compose-defined services observed
### Core services
- Postgres
- Qdrant
- Vault
- Ollama
- Mission Control
- Repo Runtime
- Gateway
- Digestion Worker
- Newsletter Worker
- Projection Worker

### Optional/brain profile services observed
- Neo4j
- Temporal
- Kafka
- Zookeeper
- DuckDB
- OpenSearch
- Tika

## Network topology observed
- The compose files define a shared internal network named ping_internal.
- The compose definitions use service DNS names such as postgres and qdrant for internal resolution.

## Health and ordering evidence observed
- Postgres has a healthcheck in [compose.yaml](compose.yaml).
- Qdrant has a healthcheck in [compose.yaml](compose.yaml).
- Ollama has a healthcheck in [compose.yaml](compose.yaml).
- Mission Control depends on Postgres, Qdrant, and Ollama in [compose.yaml](compose.yaml).

## Runtime-state evidence observed
- [docker_postgres_state.json](docker_postgres_state.json) indicates Postgres was running, but its health was unhealthy because the healthcheck command failed with an argument error.
- [docker_mission_control_state.json](docker_mission_control_state.json) indicates Mission Control was running.
- [docker_qdrant_state.json](docker_qdrant_state.json) indicates Qdrant was running, but its health was unhealthy because curl was not present in the container image.

## Unverified items
- Which compose file set was actually launched at runtime
- Which profiles were active when the runtime artifacts were captured
- Container IPs and network aliases
- Runtime volumes, bind mounts, and restart policies beyond what is declared in compose
- Live service registration inside each container
