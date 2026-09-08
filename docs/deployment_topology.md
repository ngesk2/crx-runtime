# Deployment Topology

Date: 2026-08-06
Status: PLANNING (READ-ONLY)
Purpose: Document the current deployment topology of the PING constitutional runtime: the canonical Docker Compose stack, network layout, ports, environment inventory, the standalone Ollama reality, and the known gaps (including three missing Dockerfiles). Grounds `docs/hermes_operating_protocol.md`. No code changes.

## 1. Canonical Stack — Root `compose.yaml` (14 services, 386 lines)

Single project network: **`ping_internal`** (bridge, `internal: false` — services reachable by service-name DNS). Volumes: `ping_postgres`, `ping_qdrant`, `ping_ollama`, `ping_vault`.

### Infrastructure layer (no `profiles:` — always started)

| Service | Container | Image | Ports | Volumes / mount | Healthcheck |
|---|---|---|---|---|---|
| postgres | `ping-postgres` | postgres:15-alpine | 5432 | `ping_postgres`; **initdb** `./brainos/orchestration/constitutional/canonical_state/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql` | `pg_isready` |
| qdrant | `ping-qdrant` | qdrant/qdrant:latest | 6333 | `ping_qdrant` | curl /health |
| vault | `ping-vault` | hashicorp/vault:latest | 8200 | `VAULT_DEV_ROOT_TOKEN_ID`; `cap_add IPC_LOCK`; `ping_vault` | `vault status` |
| ollama | `ping-ollama` | ollama/ollama:latest | 11434 | `ping_ollama`; **GPU reservation baked in** (nvidia, count 1) | /api/tags |

### Platform layer (profiles `dev`+`prod`)

| Service | Container | Build | Ports | Key env / mounts | depends_on |
|---|---|---|---|---|---|
| mission-control | — | `Dockerfile.mission-control` | 8000 | `POSTGRES_HOST=postgres`, `QDRANT_URL=http://qdrant:6333`, `OLLAMA_BASE_URL`+`INFERENCE_BASE_URL=http://ollama:11434`; volume `./vault:/app/vault:ro` | postgres, qdrant, ollama (healthy) |
| repo-runtime | — | alpine `sleep infinity` | — | read_only: true; 6 mounts (ping/content/drive/artifacts/graphs/indexes) | — |
| gateway | — | `gateway/Dockerfile` | 8080 | **hardcoded** `POSTGRES_DB=ping_runtime`, `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`; `EMBEDDING_MODEL=nomic-embed-text`, `CHAT_MODEL=qwen2.5-coder:14b` | — |

### Worker layer

| Service | Container | Build | Profiles | Key env |
|---|---|---|---|---|
| digestion-worker | — | brainos/rss build | dev | — |
| newsletter-worker | — | brainos/newsletter build | dev | — |
| projection-worker | — | `Dockerfile.projection` | dev | **FILE MISSING** |
| witness-worker | — | `Dockerfile.witness` | dev | **FILE MISSING** |
| replay-worker | — | `Dockerfile.replay` | dev | **FILE MISSING** |
| worker-runtime | — | `Dockerfile.worker-runtime` | dev+prod | `GATEWAY_URL=http://gateway:8080`, `POLL_INTERVAL=5.0` |

### UI layer

| Service | Container | Build | Ports | Key env |
|---|---|---|---|---|
| ui | — | ui-next build | 3000 | `NEXT_PUBLIC_GATEWAY_URL=http://gateway:8080` |

## 2. Network Diagram (text)

```
                       ┌────────────────────────── ping_internal (bridge) ──────────────────────────┐
  browser ──► :3000     ui            ──NEXT_PUBLIC_GATEWAY_URL──►  gateway :8080                     │
  browser ──► :8000     mission-control  ──POSTGRES_HOST/QDRANT_URL/INFERENCE_BASE_URL──► infra       │
  browser ──► :8080     gateway          ──pool.query()──►  postgres :5432                            │
  browser ──► :6333     qdrant           (direct admin, not production path)                          │
  browser ──► :8200     vault            (dev root token)                                             │
  browser ──► :11434    ollama           (GPU)                                                        │
                          gateway        ──http://qdrant:6333──►  qdrant                              │
                          gateway        ──http://ollama:11434──► ollama  (INFERENCE_BASE_URL)        │
                          worker-runtime ──GATEWAY_URL=http://gateway:8080──► gateway (poll loop)     │
                          repo-runtime   ──6 read-only mounts, no network consumers                   │
```

## 3. Port Map

| Port | Service | Notes |
|---|---|---|
| 5432 | postgres | postgres:15-alpine |
| 6333 | qdrant | REST |
| 8200 | vault | dev mode |
| 11434 | ollama | also published by standalone `ollama` container (see §6) |
| 8000 | mission-control | FastAPI observability |
| 8080 | gateway | single production entrypoint |
| 3000 | ui | Next.js |
| 3030 | (planned) Screenpipe REST | not deployed |
| 11999 | autocomplete-service | 127.0.0.1 loopback only (PowerToys surface) |

## 4. Environment Inventory (grouped)

| Group | Vars |
|---|---|
| Postgres | `POSTGRES_HOST/DATABASE/SCHEMA/PASSWORD/READONLY_DATABASE/READONLY_SCHEMA/READONLY_PASSWORD` (compose); gateway hardcodes `POSTGRES_DB=ping_runtime/USER=postgres/PASSWORD=postgres`; gateway code default `localhost/5432/crx/crx/crx` (overridden in container) |
| Qdrant | `QDRANT_URL` (adapter default `localhost:6333`); gateway `QDRANT_URL=http://qdrant:6333` |
| Ollama | `OLLAMA_BASE_URL`, `INFERENCE_BASE_URL=http://ollama:11434` (compose); OllamaProvider default `http://localhost:11434` (live) |
| Embedding | `EMBEDDING_MODEL=nomic-embed-text`, `CHAT_MODEL=qwen2.5-coder:14b` |
| Worker | `GATEWAY_URL=http://gateway:8080`, `POLL_INTERVAL=5.0` |
| Vault | `VAULT_DEV_ROOT_TOKEN_ID` (dev only) |
| Mission control | `POSTGRES_HOST`, `QDRANT_URL`, `OLLAMA_BASE_URL`, `INFERENCE_BASE_URL` |
| UI | `NEXT_PUBLIC_GATEWAY_URL` |

Known env inconsistency: `.env.base` sets `POSTGRES_DB=crx_runtime`; compose overrides to `ping_runtime` for the gateway. `.env.base` values are legacy and ignored by the canonical stack.

## 5. Profile Overrides

| File | Content |
|---|---|
| `compose.dev.yaml` | all workers + UI hot-reload |
| `compose.prod.yaml` | digestion+newsletter only (projection/witness/replay **disabled**); resource limits (postgres/qdrant 2c-2G, ollama 4c-8G) |
| `compose.minimal.yaml` | infra only |
| `compose.brain.yaml` | neo4j/temporal/kafka/zookeeper/duckdb/opensearch/tika (profile `brain`); **declares `ping_internal` external:true — latent inconsistency vs root compose** |
| `compose.gpu.yaml` / `compose.cpu.yaml` | ollama GPU toggles |
| `compose.debug.yaml` | debug ports 5678/9229/5433/6334 |

## 6. The Standalone Ollama Reality

There is a **live standalone `ollama` container** (name `ollama`, volume `compose_ollama_data`, port 11434, `--restart unless-stopped`) — distinct from both `ping-ollama` (root compose) and `brain-ollama` (legacy brain compose). It was created for the PowerToys autocomplete work and reuses the existing qwen2.5-coder:14b data (zero downloads). **Gateway/Open WebUI reach it via `localhost:11434` / `host.docker.internal:11434`, not the compose `ping-ollama` DNS** (which only exists inside the compose network). `ollama_provider.js` default `http://localhost:11434` is correct for a host-published Ollama; inside a compose network `INFERENCE_BASE_URL=http://ollama:11434` is the intended override.

## 7. Dockerfiles on Disk

| File | Builds | Notes |
|---|---|---|
| `gateway/Dockerfile` | gateway (:8080) | entrypoint must be `gateway_runtime.js`, NOT `server.js`/`bootstrap/main.js` (historical `process.exit(1)` trap) |
| `Dockerfile.mission-control` | mission-control (:8000) | |
| `Dockerfile.worker-runtime` | worker-runtime | all 6 workers in one container, stdlib only |
| ui-next Dockerfile | ui (:3000) | node:24-alpine, HEALTHCHECK /api/health |

**MISSING (compose references, files absent):** `Dockerfile.projection`, `Dockerfile.witness`, `Dockerfile.replay`. These three services fail `docker compose build`. In `compose.prod.yaml` they are already disabled — the failure is confined to `compose.dev.yaml`.

## 8. Legacy Brain Stack (alternative, older, not canonical)

`brainos/orchestration/infrastructure/docker/compose/docker-compose.yml` — brain-* containers (postgres 18-alpine, qdrant, neo4j, temporal, kafka, zookeeper, duckdb, opensearch, tika, ollama, openwebui, vault), network `brain_internal` (**internal:true**). `docker-compose-mission-control.yml` variant declares `brain_internal` internal:false. The `compose_brain_internal` network naming from Sessions 8–12 originated here. This stack is legacy; the root `compose.yaml` is canonical.

## 9. Gateway Runtime Facts

- PG pool defaults `localhost/5432/crx/crx/crx` — overridden by compose env in container.
- Route mounts (25 groups): `/events`, `/repository`, `/context`, `/health`, `/system`, `/api/v1/ollama`, `/canonical-events`, `/tenants`, `/deployments`, `/runtime`, `/constitution`, `/fingerprint`, `/ops`, `/governance`, `/ai-workspace`, `/reviews`, `/customers`, `/projects`, `/orchestration`, `/knowledge`, `/missions`, `/ai`, `/connectors`, `/mc`, `/ingest`.
- `start()` → `app.listen(port, '0.0.0.0')`; seeds 18 deterministic business events if `ping_events` empty.
- Health checks registered for: integrations, event_governance, event_runtime, canonicalization, qdrant, embedding.
- Live Qdrant path: `ping-runtime/search/qdrant_adapter.js` (`QDRANT_URL` env || `localhost:6333`, 768-d Cosine, 5s timeout); embedding via `ping-runtime/embeddings/embedding_service.js` (collection `knowledge`, `nomic-embed-text`, 20 INDEXABLE_TYPES, deterministic SHA-256 fallback).

## 10. Known Gaps (must be resolved before Hermes/oracle deployment)

1. **3 missing worker Dockerfiles** (`projection`/`witness`/`replay`) break `compose.dev.yaml` build. Options: delete the service stanzas (worker-runtime covers these workers) or add the files.
2. **Env inconsistency** — `.env.base` `POSTGRES_DB=crx_runtime` vs compose `ping_runtime`; `.env.base` is legacy/ignored.
3. **`compose.brain.yaml` external:true on `ping_internal`** contradicts root compose definition.
4. **No CI/CD** — no GitHub Actions, no build pipeline in the repo (see hermes operating protocol).
5. **Docker daemon currently down** (npipe) — nothing live-probed; all topology above is static evidence.

## 11. Constraints

- Root `compose.yaml` is the canonical deployment source. Legacy brain stack and `.env.base` are historical.
- Worker execution is consolidated in `worker-runtime`; per-worker Dockerfiles are legacy redundancy.
- No deployment change in these specs — this document records reality and gaps for the hermes operating protocol.
