# Phase G — Operational Reality Summary

**Date:** 2026-06-25  
**Audit Scope:** 12 sub-audits covering all running/stopped infrastructure  
**Rule:** Findings only — no recommendations, no remediation

---

## 1. Top 10 Operational Risks

| # | Risk | Severity | Audit Source |
|---|---|---|---|
| 1 | **No Postgres backup exists** — 47 MB of event data is the sole source of truth. Volume corruption = total data loss. | **CRITICAL** | G.6 Backup, G.7 Restore |
| 2 | **Secrets in plaintext in VCS** — POSTGRES_USER/PASSWORD, QDRANT_API_KEY, YAHOO_EMAIL/APP_PASSWORD all in tracked files. | **CRITICAL** | G.9 Vault, G.10 Comms |
| 3 | **No running service can read the database** — brain-postgres is on an isolated network with 0 running consumers. crx-gateway cannot reach it. | **HIGH** | G.4 Dependencies |
| 4 | **crx-ollama-worker has no network** — inference engine is isolated. Depends on undocumented `host.docker.internal` proxy. | **HIGH** | G.4 Dependencies |
| 5 | **Vault container is dead** — exited with code 255, never initialized, zero secrets stored. All services bypass it. | **MEDIUM** | G.9 Vault |
| 6 | **Four tables referenced in code don't exist** — `authority_witness`, `lineage`, `supersession`, `projection_status` are queried but never created. | **MEDIUM** | G.5 Postgres |
| 7 | **No monitoring or alerting** — there is no way to detect a failure. No metrics, no logs shipping, no healthcheck aggregation. | **HIGH** | G.11 Resources, G.12 Scalability |
| 8 | **Two independent compose domains** — `compose_brain_internal` and `crx_crx-network` have zero cross-network routes. They share nothing. | **MEDIUM** | G.4 Dependencies |
| 9 | **Yahoo newsletter worker is undeployed with broken imports** — coded, never containerized, never run. Credentials exposed for nothing. | **LOW** | G.10 Comms |
| 10 | **Mission Control is stopped** — the constitutional API server is not running. Search/Retrieve/Ingest endpoints are unavailable. | **HIGH** | G.1 Container Reality |

---

## 2. Top 5 Redundancies (Waste)

| # | Redundancy | Waste | Audit Source |
|---|---|---|---|
| 1 | **Two Open WebUI instances** (`:latest` + `:main` tags) | 6.73 GB duplicate image disk | G.2 Redundancy |
| 2 | **Two Ollama instances** (brain-ollama stopped, crx-ollama-worker running) | Image is shared (8.25 GB), but brain-ollama is dead | G.2 Redundancy |
| 3 | **Five orphaned Docker volumes** with 0 B data | Clutter, no actual waste | G.3 Volumes |
| 4 | **Nine defined-but-never-started services** (neo4j, temporal, kafka, zookeeper, duckdb, opensearch, tika, repo-runtime, vault) | Image download wasted if ever started | G.1 Container Reality |
| 5 | **30 GB of 31 GB RAM unused** | Massive over-provisioning for idle workload | G.11 Resources |

---

## 3. Top 5 Single Points of Failure

| # | SPOF | What Breaks | Mitigation Exists? |
|---|---|---|---|
| 1 | **Postgres volume** (`crx_crx-postgres-volume`) | All event history, authority lineage, artifact registry | **NO** — no backup |
| 2 | **Postgres container** (single instance) | All data access | **NO** — no replica |
| 3 | **crx-ollama-worker** (single inference engine) | All AI features (summarization, chat, analysis, projection) | **PARTIAL** — models could be pulled to new instance |
| 4 | **crx-gateway** (single API gateway) | All HTTP API access | **YES** — stateless, restartable from image |
| 5 | **Local machine** (single Windows host) | Everything | **NO** — no off-site failover |

---

## 4. Top 5 Recovery Gaps

| # | Gap | Impact | Required to Fix |
|---|---|---|---|
| 1 | **No pg_dump or WAL archive** | Postgres is NON-RECOVERABLE | pg_dump script + scheduled task + off-site storage |
| 2 | **No Backup folder on Drive** | No off-site destination | Create PING_BACKUPS on Google Drive |
| 3 | **No restore procedure documented** | Recovery is ad-hoc at best | Document restore steps per component |
| 4 | **Vault can't be restored** | Never initialized, no secrets stored, but if it were needed — impossible | Not fixable without Vault initialization |
| 5 | **No point-in-time recovery** | Accidental DELETE = permanent data loss | WAL archiving + PITR configuration |

---

## 5. Infrastructure That Actually Works

Despite all the above, the following is functioning correctly:

| Component | Evidence |
|---|---|
| **Postgres** | Running, accepting connections, 4 populated tables, correct schema |
| **Qdrant** | Running, serving 5 constitutional document vectors, recoverable |
| **Gateway** | Running, returning HTTP 200 on `/health` |
| **Open WebUI** | Running, serving chat UI on port 3001, docker healthcheck passes |
| **Ollama (crx)** | Running, two models loaded (7B + 14B), inference available |
| **Event schema** | Matches expected CQRS schema across all 8 workers (previous audit's "schema mismatch" claim was false) |
| **Event projection** | Successfully projected 5 constitutional docs from Postgres → Qdrant (verified content hash matching) |
| **Constitutional ingestion** | 5 documents ingested, verified, authority-resolved |

---

## 6. Architecture Constants (Facts, Not Opinions)

| Constant | Value | Evidence |
|---|---|---|
| Total running containers | 6 | `docker ps` |
| Total stopped containers | 5 | `docker ps -a` |
| Total authoritative data | 49 rows across 4 Postgres tables | SQL COUNT queries |
| Sovereign data in Qdrant | 0 bytes (fully rebuildable) | Vector = derived from Postgres events |
| Outbound communication paths | 0 | SMTP/webhook/notification audit |
| Secrets in VCS | 4+ | POSTGRES_USER, POSTGRES_PASSWORD, QDRANT_API_KEY, YAHOO_EMAIL, YAHOO_APP_PASSWORD |
| Loaded LLM models | 2 (qwen2.5-coder 7B + 14B) | `ollama list` |
| Total constitutional documents | 5 (ingested) | Qdrant point count, Postgres event count |
| Cross-network routes | 0 | `compose_brain_internal`, `crx_crx-network`, `crx-digestion-worker_default` are isolated |
| Active user count | ~1-2 | Inferred from idle resource usage |

---

## 7. Data Flow Reality (vs. Intended Architecture)

![No diagram — text description below]

### Intended (from architecture docs):
```
User → Gateway → Mission Control → Workers → Postgres
                                     ↓
                                  Qdrant ← Projection Worker
                                     ↓
                                Search API → User
```

### Actual:
```
User → crx-gateway (port 8080) → ??? 
   (no route to Mission Control, no route to Postgres)

User → open-webui (port 3001) → host.docker.internal:11434 → crx-ollama-worker (isolated)

brain-postgres (172.21.0.2) ←→ brain-qdrant (172.21.0.3) ←→ Nothing else running
```

**The intended data flow is broken.** Postgres and Qdrant are in their own network with zero running consumers. Gateway/UI/Ollama form a separate cluster that cannot reach the constitutional event store. Mission Control is stopped.

---

## 8. Operational Classification

| Class | Count | Containers/Services |
|---|---|---|
| **FUNCTIONAL** | 4 | brain-postgres, brain-qdrant, crx-gateway, open-webui |
| **FUNCTIONAL (isolated)** | 1 | crx-ollama-worker |
| **NON-FUNCTIONAL** | 1 | crx-ui-next (port 3000 not responding) |
| **STOPPED (dead)** | 5 | ping-mission-control, brain-ollama, brain-openwebui, brain-repo-runtime, vault |
| **NEVER DEPLOYED** | 7 | neo4j, temporal, kafka, zookeeper, duckdb, opensearch, tika |
| **UNDEPLOYED (coded but not containerized)** | 8 | summary_worker, claim_worker, embedding_worker, candidate_claim_worker, newsletter_worker, web_retrieval, qdrant_projection_worker, constitutional_retrieval |

---

## 9. Disk Budget

| Category | Size | % of 286 GB |
|---|---|---|
| Docker images | ~22 GB | 7.7% |
| Docker volumes (data) | ~48 MB | 0.02% |
| PING source code | ~70 MB | 0.02% |
| Python venv + node_modules | ~136 MB | 0.05% |
| Windows/other | ~264 GB | 92.2% |
| **Dead infrastructure** (stopped containers + dup images) | ~16.6 GB | 5.8% |

---

## 10. Audit Methodology

Each sub-audit used the following methods:

| Method | Used In |
|---|---|
| `docker ps -a` | G.1, G.2 |
| `docker inspect` (full JSON) | G.1, G.2, G.4 |
| `docker stats` (live monitoring) | G.11 |
| `docker volume ls` + `docker system df` | G.3 |
| `docker exec brain-postgres psql -c "..."` | G.5 |
| `docker exec brain-qdrant curl/wget` (via API) | G.8 |
| SQL `COUNT(*)` queries on all known tables | G.5 |
| Select-String (grep) across all Python/JS/YAML | G.9, G.10 |
| `Get-ChildItem -Recurse` directory sizing | G.11 |
| Get-PSDrive | G.11 |
| curl.exe health endpoint checks | G.1, G.4 |

---

*End of Phase G Operational Reality Audit. 12 sub-audits complete.*
