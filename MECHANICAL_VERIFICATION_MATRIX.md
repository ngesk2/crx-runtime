# Mechanical Verification Matrix — Phase Ω

Full-codebase mechanical checks. Previous gates checked only `runtime/`. These checks cover the entire repository.

## Gated Patterns

### P1: Configuration (`os.getenv`)

| Scope | Result | Count |
|---|---|---|
| `runtime/` only | **Pass** — 0 outside config/forensics | Clean |
| Full codebase (excl .venv) | **FAIL** — 32 files outside runtime/ | 32 files |
| Root workers | **FAIL** — 10 root files | `app_container.py` (12), `destructive_recovery_certification.py` (7), `mission_control_knowledge_apis.py` (9), `mission_control_authority_endpoint.py` (5) |
| `brainos/` | **FAIL** — 12 files | `brainos/mission_control/app.py` (17), `brainos/constitutional_search.py` (9), `brainos/projection_worker.py` (10), `brainos/constitutional_retrieval.py` (7) |

### P2: Repository (`psycopg2.connect`)

| Scope | Result | Count |
|---|---|---|
| `runtime/` only | **Pass** — only adapter/event_store/worker/authority | Clean |
| Full codebase | **FAIL** — 25 files outside runtime/ | 25 files |
| Root workers | **FAIL** — 13 root files | `claim_worker.py`, `lineage_worker.py`, `observation_worker.py`, `replay_worker.py`, `witness_worker.py`, `repository_event_layer.py`, etc. |
| `brainos/` | **FAIL** — 7 files | All 7 brainos workers use direct SQL |

### P3: Projection (`QdrantClient`)

| Scope | Result | Count |
|---|---|---|
| `runtime/` only | **Pass** — only retrieval/adapter/tool/worker/projection | Clean |
| Full codebase | **FAIL** — 15 files outside runtime/ | 15 files |
| Root workers | **FAIL** — 6 root files | `app_container.py`, `check_qdrant.py`, `create_qdrant_collections.py`, `destructive_recovery_certification.py`, `mission_control_knowledge_apis.py`, `simple_projection_worker.py` |
| `brainos/` | **FAIL** — 5 files | `brainos/constitutional_retrieval.py`, `brainos/constitutional_search.py`, `brainos/projection_worker.py`, `brainos/app.py` (9 QdrantClient calls) |

### P4: Identity (`uuid.uuid4`)

| Scope | Result | Count |
|---|---|---|
| `runtime/` only | **Pass** — only identity/canonical/worker/supervisor/cognitive/drive | Clean |
| Full codebase | **FAIL** — 15 files outside runtime/ | 15 files (plus 2 in runtime/ that shouldn't) |
| Root workers | **FAIL** — 11 root files | `claim_worker.py` (4), `lineage_worker.py` (4), `witness_worker.py` (4), `observation_worker.py` (3), `replay_worker.py` (3), `filesystem_worker.py` (3), etc. |
| `workers/` (refactored) | **FAIL** — documented exception | `workers/repository_client.py` uses uuid.uuid4 (stdlib constraint) |

### P5: Hash (`hashlib.sha256` / `crypto.createHash`)

| Scope | Result | Count |
|---|---|---|
| `runtime/` Python | **Pass** — only authority/certificate/adapter/cognitive | Clean |
| `runtime/` TypeScript | **Pass** — only certificate/replay | 2 files (forensics, node_self_check) |
| Full codebase Python | **FAIL** — 21 files outside runtime/ | 21 files |
| Root workers | **FAIL** — 12 root files | `repository_event_layer.py` (5), `destructive_recovery_certification.py` (4), `simple_projection_worker.py` (3), `generate_*.py` (various) |
| `brainos/` | **FAIL** — 4 files | `constitutional_retrieval.py`, `constitutional_search.py`, `projection_worker.py`, `web_retrieval.py` |

### P9: Subprocess (`subprocess.run`)

| Scope | Result | Count |
|---|---|---|
| `runtime/` | **FAIL** — 5 known violations | `constitutional_event_loop.py:61`, `constitutional_runtime.py:41`, `supervisor.py:24`, `tool_router.py:29`, `cognitive/worker_protocol.py:42` |
| Full codebase | **FAIL** — 15 files | 5 in runtime/ + `simple_projection_worker.py` (2), `test_event_ingestion.py` (3), `repository_event_layer.py` (2), `_test_pipeline.py` (2), `tools/projection_sovereignty_audit.py`, `secret_audit.py`, `generate_schema_reality.py`, `context_pack_builder.py`, `constitutional_audit.py` |

## Extended Checks

### P6: Tool Routing

| Check | Mechanism | Result |
|---|---|---|
| Tool imports AuthorityRouter | Grep runtime/tools/*.py for imports | **Pass** — all 4 tools import only AuthorityRouter |
| Tool imports raw DB | Grep for psycopg2.connect in runtime/tools/ | **Pass** — 0 occurrences |
| Tool imports QdrantClient | Grep for QdrantClient in runtime/tools/ | **Pass** — 0 occurrences |
| Tool imports uuid | Grep for uuid in runtime/tools/ | **Pass** — 0 occurrences |
| Tool imports hashlib | Grep for hashlib in runtime/tools/ | **Pass** — 0 occurrences |

### P7: Duplicate Detection

| Check | Mechanism | Result |
|---|---|---|
| Mission control variants | Count implementations | **3 implementations** — `brainos/app.py`, `root/app_container.py`, `root/knowledge_apis.py` |
| Gateway variants | Count implementations | **2 implementations** — `gateway/app.ts` (Express), `gateway/repository_store.js` (standalone) |
| Python runtime environments | Count .venv directories | **2 environments** — `.venv/` (primary), `brainos/venv/` (legacy) |
| Docker configurations | Count Dockerfiles | **8+ Dockerfiles**, 2 compose files, varied network topologies |
| Capability authority | Count implementations | **3 implementations** — kernel TS, compiler TS, Python |

### P8: Secret Management

| Check | Mechanism | Result |
|---|---|---|
| Hardcoded secrets in gateway | Grep for API keys, passwords | **Pass** — all env vars |
| .env files tracked | Check gitignore | **Pass** — .env in gitignore |
| Container secrets | Check Docker env vars | **PASS** — all via POSTGRES_PASSWORD, QDRANT_API_KEY env vars |

## Full-Codebase Summary

| Gate | runtime/ Only | Full Codebase | Delta |
|---|---|---|---|
| P1: os.getenv | Pass | **32 bypass files** | +32 |
| P2: psycopg2.connect | Pass | **25 bypass files** | +25 |
| P3: QdrantClient | Pass | **15 bypass files** | +15 |
| P4: uuid.uuid4 | Pass | **15 bypass files** | +15 |
| P5: hashlib.sha256 | Pass | **21 bypass files** | +21 |
| P5: crypto.createHash | Pass (2 doc exceptions) | Same | 0 |
| P6: Tool routing | Pass | Not applicable | 0 |
| P9: subprocess | Fail (5 violations) | **15 bypass files** | +10 |

**The previous "7/8 pass" measurement was correct for runtime/ only. Full-codebase measurement: 2/8 pass (P6, P8).**

## Next Gate Extension

Extend `scripts/architecture-gates.ps1` to check the full codebase:
- `runtime/` allowlist = current pass criteria
- All other directories = fail if any bypass found
- Root `C:\Users\nolan\PING\*.py` = priority fail

This would make the gate status honest: **2/8 pass** until the 39 critical bypass files are refactored.
