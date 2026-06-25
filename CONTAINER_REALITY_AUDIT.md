# G.1 Container Reality Audit

**Method:** `docker ps -a`, `docker stats`, `docker inspect`, `docker exec`, health checks  
**Date:** 2026-06-25  

---

## Running Containers

### brain-postgres
| Field | Value |
|---|---|
| Image | `postgres:15-alpine` (417 MB) |
| Status | Up ~2 hours |
| Health | **unhealthy** (healthcheck failing) |
| CPU | 0.00% |
| Memory | 22.66 MB / 31.19 GB (0.07%) |
| Restart | `unless-stopped` |
| Ports | 5432/tcp (not exposed to host) |
| Networks | `compose_brain_internal` (172.21.0.2) |
| Depends-on | None |
| Compose project | `compose` (`docker-compose.yml`) |
| **Business capability** | Constitutional event store, authority objects, lineage tracking |
| **If this disappears** | All event history, authority lineage, artifact registry lost. Qdrant still serves vectors until they need rebuilding. |

### brain-qdrant
| Field | Value |
|---|---|
| Image | `qdrant/qdrant:latest` (270 MB, v1.18.2) |
| Status | Up ~2 hours |
| Health | **unhealthy** (curl not in PATH for healthcheck) |
| CPU | 0.34% |
| Memory | 112.4 MB / 31.19 GB (0.35%) |
| Restart | `unless-stopped` |
| Ports | 6333/tcp (not exposed to host) |
| Networks | `compose_brain_internal` (172.21.0.3) |
| Depends-on | None |
| Compose project | `compose` (`docker-compose.yml`) |
| Storage | 1.2 MB (constitutional_documents has 5 points, constitutional_memory has 0) |
| **Business capability** | Vector search for constitutional documents |
| **If this disappears** | Search/constitution endpoints fail. Vectors rebuildable from Postgres events. |

### crx-gateway
| Field | Value |
|---|---|
| Image | `crx-gateway:1.0.0` (208 MB) |
| Status | Up 31 minutes |
| Health | No healthcheck configured |
| CPU | 0.00% |
| Memory | 25.8 MB / 31.19 GB (0.08%) |
| Restart | `no` |
| Ports | `0.0.0.0:8080->8080/tcp` |
| Networks | `crx_crx-network` (172.19.0.2) |
| Depends-on | None (no compose project) |
| **Business capability** | HTTP API gateway for UI |
| **If this disappears** | UI cannot reach backend services. Direct backend access still works. |

### open-webui (crx-digestion-worker)
| Field | Value |
|---|---|
| Image | `ghcr.io/open-webui/open-webui:main` (6.73 GB) |
| Status | Up 2 hours |
| Health | **healthy** |
| CPU | 0.16% |
| Memory | 693.9 MB / 31.19 GB (2.17%) |
| Restart | `unless-stopped` |
| Ports | `0.0.0.0:3001->8080/tcp` |
| Networks | `crx-digestion-worker_default` (172.20.0.2) |
| Depends-on | None (no compose project) |
| **Business capability** | AI chat interface for users |
| **If this disappears** | Users lose chat UI. Ollama is still accessible via API. |

### crx-ollama-worker
| Field | Value |
|---|---|
| Image | `ollama/ollama:latest` (8.25 GB) |
| Status | Up 31 minutes |
| Health | No healthcheck configured |
| CPU | 0.22% |
| Memory | 31.48 MB / 31.19 GB (0.10%) |
| Restart | `no` |
| Ports | 11434/tcp (not exposed to host) |
| Networks | None (isolated) |
| Depends-on | None |
| Loaded models | `qwen2.5-coder:7b` (4.7 GB), `qwen2.5-coder:14b` (9.0 GB) |
| **Business capability** | AI model inference |
| **If this disappears** | All AI features (summarization, analysis, chat) stop working. Models must be re-pulled (13.7 GB). |

### crx-ui-next
| Field | Value |
|---|---|
| Image | `crx-ui-next:1.0.0` (666 MB) |
| Status | Up 31 minutes |
| Health | **unhealthy** (port 3000 not responding) |
| CPU | 0.00% |
| Memory | 40.12 MB / 31.19 GB (0.13%) |
| Restart | `no` |
| Ports | 3000/tcp (not exposed to host) |
| Networks | None (isolated) |
| Depends-on | None |
| **Business capability** | Next.js UI (unknown — not responding to health checks) |
| **If this disappears** | Unknown. Port 3000 not responding. Appears non-functional. |

---

## Stopped Containers

### ping-mission-control
| Field | Value |
|---|---|
| Image | `compose-mission-control` (908 MB) |
| Status | **Exited (128)** 12 hours ago |
| Restart | `unless-stopped` |
| Ports | 8000/tcp |
| Networks | (none currently) |
| **Business capability** | Constitutional API (ingest, search, retrieve, reasoning) |
| **If this disappears** | **POTENTIAL DEAD INFRASTRUCTURE** — was the constitutional API server. Currently stopped with no active replacement. |

### brain-ollama
| Field | Value |
|---|---|
| Image | `ollama/ollama:latest` (8.25 GB) |
| Status | **Exited (128)** 12 hours ago |
| Restart | `unless-stopped` |
| Networks | (was on `compose_brain_internal`) |
| **Business capability** | AI inference (duplicate of crx-ollama-worker) |
| **If this disappears** | **POTENTIAL DEAD INFRASTRUCTURE** — replaced by crx-ollama-worker |

### brain-openwebui
| Field | Value |
|---|---|
| Image | `ghcr.io/open-webui/open-webui:latest` (6.73 GB) |
| Status | **Exited (137)** 12 hours ago |
| Restart | `unless-stopped` |
| **Business capability** | AI chat interface (duplicate of running open-webui) |
| **If this disappears** | **POTENTIAL DEAD INFRASTRUCTURE** — replaced by running open-webui instance |

### brain-repo-runtime
| Field | Value |
|---|---|
| Image | `alpine:latest` (13 MB) |
| Status | **Exited (137)** 12 hours ago |
| **Business capability** | Read-only repo access container |
| **If this disappears** | **POTENTIAL DEAD INFRASTRUCTURE** — no service depended on it |

### vault (brain-vault)
| Field | Value |
|---|---|
| Image | `hashicorp/vault:latest` (739 MB) |
| Status | **Exited (255)** 23 hours ago |
| Started | 2026-06-23 (dev mode, root token: `root`) |
| **Business capability** | Secret storage |
| **If this disappears** | **POTENTIAL DEAD INFRASTRUCTURE** — no service ever connected to it |

---

## Summary

| Status | Count | Containers |
|---|---|---|
| **Running** | 6 | brain-postgres, brain-qdrant, crx-gateway, open-webui, crx-ollama-worker, crx-ui-next |
| **Stopped** | 5 | ping-mission-control, brain-ollama, brain-openwebui, brain-repo-runtime, vault |
| **Total** | 11 | |

### Health Assessment
- **healthy**: open-webui (crx)
- **unhealthy** (incorrect healthcheck): brain-postgres, brain-qdrant, crx-ui-next
- **no healthcheck**: crx-gateway, crx-ollama-worker

### Infrastructure Utilization
Of 15 defined services across both compose files (postgres, qdrant, neo4j, temporal, kafka, zookeeper, duckdb, opensearch, tika, ollama, openwebui, mission-control, repo-runtime, vault + crx services), **only 6 are running**. 9 designed services never start or have exited.

### Potential Dead Infrastructure
- ping-mission-control — was the API server, now stopped
- brain-ollama — replaced by crx-ollama-worker
- brain-openwebui — replaced by running open-webui
- brain-repo-runtime — no depended services
- vault — never used by any service
- Neo4j, Temporal, Kafka, Zookeeper, DuckDB, OpenSearch, Tika — defined in compose but never started
