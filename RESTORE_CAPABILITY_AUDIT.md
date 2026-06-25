# G.7 Restore Capability Audit

**Date:** 2026-06-25  
**Method:** Component-by-component recovery assessment from current state

---

## Recovery Classification Matrix

| Component | Data Type | Restore Viable? | Recovery Method | Time Estimate | Notes |
|---|---|---|---|---|---|
| **Postgres** | 47 MB structured | **NO** | None | N/A | No backup = non-recoverable. Must be rebuilt from external sources. |
| **Qdrant** | 1.2 MB vectors | **YES** | Re-embed from Postgres events | ~2 minutes | 5 embeddings → constitutional_documents. 0 → constitutional_memory. |
| **Ollama (brain)** | 8.25 GB image + models | **YES** | `docker compose up -d ollama` + pull models | ~15-30 min | Image cached. Models re-pulled from Ollama registry. |
| **Ollama (crx)** | 8.25 GB image + 13.7 GB models | **YES** | Docker run + pull models | ~30-60 min | Two models (7B, 14B) must be re-pulled from registry. |
| **Open WebUI** | 6.73 GB image | **YES** | Docker compose up / docker run | ~5 min | Stateless configuration, no persisted chat history. |
| **Gateway** | 208 MB image | **YES** | Docker run | ~2 min | Stateless — built from source, no persistent state. |
| **UI Next** | 666 MB image | **YES** | Docker run | ~2 min | Non-functional anyway. |
| **Mission Control** | 908 MB image | **YES** | Docker compose up | ~5 min | Stopped but image exists. |
| **Vault** | 739 MB image | **NO** | None | N/A | Never initialized. 34 files (609 KB) of config on host filesystem. No secrets ever stored. |
| **Host Filesystem** | ~286 GB | **YES** | None needed | N/A | Hardware RAID if applicable. Data redundancy at OS level. |
| **Constitutional Docs** | 5 artifacts | **YES** | Re-ingest from filesystem | ~5 min | Files exist on host at `constitution/` — re-ingest via API. |

---

## Recovery Priority Order (If Total Loss)

1. **Host OS + Docker** — reinstall Windows/Docker Desktop, restore from OS backup
2. **Git clone** — `git clone https://github.com/...` — restores all source code (30s)
3. **Postgres** — Cannot restore. Fatal gap.
4. **Qdrant** — Run projection worker against fresh Postgres
5. **Ollama** — Docker run + `ollama pull qwen2.5-coder:7b` + `ollama pull qwen2.5-coder:14b`
6. **Constitutional docs** — Re-ingest from `constitution/*.md`
7. **Gateway** — Docker run (image exists in local registry)
8. **Open WebUI** — Docker run with host port 3001
9. **Vault** — Not needed (never used)

---

## Time to Full Recovery (Worst Case)

| Scenario | Without Postgres Backup | With Postgres Backup |
|---|---|---|
| Container explosion | ~60 min (re-derive events) | ~10 min (pg_restore) |
| Full machine loss | ~120 min (re-install + re-derive) | ~30 min (Docker + pg_restore + re-embed) |
| Partial data corruption | ~60 min (re-derive events) | ~10 min (point-in-time recovery) |

---

## Key Finding

**Postgres is the only non-recoverable component.** Everything else is rebuildable from source code, Docker registry, or the host filesystem. Without a Postgres backup strategy, a volume corruption event would destroy all event history, authority lineage, and 15 ingested constitutional documents.

The dataset is small enough (15 events) that manual re-ingestion is feasible, but the architecture provides zero automated recoverability.
