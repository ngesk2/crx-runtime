# G.2 Redundancy Audit

**Date:** 2026-06-25  
**Method:** Container inventory, image inspection, compose file analysis

---

## 1. Duplicate Ollama Instances

| Instance | Status | Image | Size | Networks |
|---|---|---|---|---|
| brain-ollama | **Exited (128)** | ollama/ollama:latest | 8.25 GB | compose_brain_internal (172.21.0.x) |
| crx-ollama-worker | **Running** | ollama/ollama:latest | 8.25 GB | None (isolated) |

- Both share the same image (8.25 GB on disk once due to Docker layer sharing).
- brain-ollama was the older instance serving Mission Control; crx-ollama-worker serves Gateway/UI.
- **Verdict:** REDUNDANT. brain-ollama is dead infrastructure. The 8.25 GB on disk is shared.

## 2. Duplicate Open WebUI Instances

| Instance | Status | Image | Size | Port |
|---|---|---|---|---|
| brain-openwebui | **Exited (137)** | ghcr.io/open-webui/open-webui:latest | 6.73 GB | 3000 (compose_brain_internal) |
| open-webui | **Running** | ghcr.io/open-webui/open-webui:main | 6.73 GB | 0.0.0.0:3001 |

- Different tags (`:latest` vs `:main`) — both are ~6.73 GB. Docker does NOT share layers across tags.
- **Verdict:** WASTED DISK. brain-openwebui is dead infrastructure. 6.73 GB consumed for nothing.

## 3. Duplicate Gateways

| Instance | Status | Image | Port |
|---|---|---|---|
| crx-gateway | **Running** | crx-gateway:1.0.0 (208 MB) | 0.0.0.0:8080 |
| (no other gateway) | — | — | — |

- No duplicate gateway found. Single running gateway is the only API entry point.

## 4. Duplicate Postgres / Qdrant

- Only one Postgres instance exists.
- Only one Qdrant instance exists.
- **Verdict:** SINGLE POINT OF FAILURE (not redundant). No replica, no failover.

## 5. Duplicate Network Infrastructure

- `compose_brain_internal`: brain-postgres, brain-qdrant (and stopped brain-ollama, brain-openwebui)
- `crx_crx-network`: crx-gateway (and stopped crx-ai-worker, crx-email-worker)
- `crx-digestion-worker_default`: open-webui (running)
- **Verdict:** THREE ISOLATED NETWORKS. No cross-network communication possible.

## 6. Stopped / Never-Started Services

Defined in `docker-compose.yml` but never started:

| Service | Image | Purpose |
|---|---|---|
| neo4j | stock | Graph database - 0 events |
| temporal | stock | Workflow engine - 0 events |
| kafka | stock | Message queue - 0 events |
| zookeeper | stock | Kafka dependency - 0 events |
| duckdb | stock | Analytical database - 0 events |
| opensearch | stock | Full-text search - 0 events |
| tika | stock | Document parsing - 0 events |

**Verdict:** FULLY REDUNDANT (no deployment, no code dependency).

## Summary

| Area | Redundancy Rating | Notes |
|---|---|---|
| Ollama (inference) | ✅ Redundant | Two instances, one dead |
| WebUI | ✅ Redundant | Two instances, one dead |
| Gateway | ❌ No redundancy | Single instance |
| Postgres | ❌ No redundancy | No replica, no backup |
| Qdrant | ❌ No redundancy | Single instance |
| Networks | ⚠️ Partitioned | Three isolated networks |
| Neo4j/Kafka/etc. | ❌ Not deployed | Defined but never started |
