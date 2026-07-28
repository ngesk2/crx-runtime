# Corrected Authority Reclassification — Revised

## Phase 0: Commit Tracing

### Repository State
| Dimension | Value |
|---|---|
| **HEAD commit** | `071782e` — "Constitutional security hardening - 3/4 priorities complete" |
| **HEAD date** | 2026-06-24 10:45:51 -0600 |
| **Submodule `runtime/` pin** | `2709b18` — "Constitutional remediation: Resolve OPEN-001, OPEN-002, OPEN-003" |
| **Working tree changes** | 25+ modified files, 70+ untracked files |

### Image State
| Dimension | Value |
|---|---|
| **Image** | `compose-mission-control:latest` (`e6bc39e48058`) |
| **Built** | 2026-06-25 03:51:20 UTC |
| **Git commit label** | **NONE** — image has no build-time commit metadata |
| **Build context** | `../../../../../` (repo root) |
| **Dockerfile at build time** | **UNCOMMITTED VERSION** — `Dockerfile.mission-control` had 4 additional COPY commands not in HEAD |

### Running Container
| Dimension | Value |
|---|---|
| **Image** | `compose-mission-control` |
| **Bind mounts** | Only `/app/vault` ← `vault/` — NO mounts override `/app/runtime/` or `/app/src/` |
| **Filesystem** = Image filesystem (no volume overrides on runtime paths) |

### Critical Divergence: HEAD commit vs Running Container

The HEAD commit's `Dockerfile.mission-control` does NOT include:
```
COPY runtime/security ./runtime/security      ← added as uncommitted change
COPY runtime/cognitive ./runtime/cognitive    ← added as uncommitted change
COPY runtime/tools ./runtime/tools            ← added as uncommitted change
COPY runtime/data ./runtime/data              ← added as uncommitted change
```

The HEAD commit's `app.py` does NOT include:
- `/reasoning/query` endpoint (ReasoningGateway integration)
- `/reasoning/health` endpoint
- `/reasoning/cache/stats` endpoint
- `/reasoning/cache/invalidate` endpoint
- Postgres verification in `/constitution/search`
- Postgres verification in `/constitution/doc/{doc_id}`
- `ReasoningRequest` / `ReasoningResponse` models
- `import hashlib`, `import uuid`

The HEAD commit's `constitutional_retrieval.py` does NOT:
- Import `psycopg2`
- Write to Postgres (`INSERT INTO events`)
- Compute `event_id` via uuid5
- Set `event_id`, `payload_hash` in Qdrant payload

**Conclusion**: The running container's capabilities exceed what `HEAD` would produce. If someone builds from `071782e`, they get a container WITHOUT the reasoning pipeline and WITHOUT Postgres event recording.

---

## Phase 0b: Submodule Awareness

`runtime/` is a git submodule pinned to `2709b18`. The Dockerfile uses `COPY runtime/...` which copies from the submodule's pinned commit, not from the main repo's view of `runtime/`.

The submodule `2709b18` contains the files that were COPIED into the image:
- `runtime/constitutional/` — COPIED (in HEAD Dockerfile)
- `runtime/adapters/` — COPIED (in HEAD Dockerfile)
- `runtime/security/` — NOT COPIED by HEAD Dockerfile (added as uncommitted change)
- `runtime/cognitive/` — NOT COPIED by HEAD Dockerfile (added as uncommitted change)
- `runtime/tools/` — NOT COPIED by HEAD Dockerfile (added as uncommitted change)
- `runtime/data/` — NOT COPIED by HEAD Dockerfile (added as uncommitted change)
- `runtime/replay/` — NOT COPIED by any version of the Dockerfile (never added)
- `runtime/workers/` — NOT COPIED by any version of the Dockerfile (never added)

---

## Phase 7 (Revised): Proper Classification by Component

### Classification Categories

| Category | Definition |
|---|---|
| **IN-REPO** | Source code exists in repository (includes submodules) |
| **IN-IMAGE** | File exists in at least one Docker image layer |
| **IN-CONTAINER** | File exists on running container's filesystem (image + mounts) |
| **EXECUTABLE** | Required runtime (interpreter, VM, loader) exists in the deployment environment |
| **EXECUTED** | Process has been observed running the file |
| **AUTHORITATIVE** | Produces observable runtime effects (DB writes, API responses, Qdrant writes) |
| **UNDEPLOYED** | IN-REPO but NOT IN-IMAGE (deliberately or accidentally omitted from build) |
| **INERT** | IN-CONTAINER but NOT EXECUTED and NOT EXECUTABLE |
| **DORMANT** | IN-CONTAINER, EXECUTABLE, but NOT EXECUTED (could be started) |
| **DEAD** | EXECUTION IMPOSSIBILITY PROVEN — no runtime exists in deployment environment |

---

### Component: `runtime/replay/*.ts` (27 TypeScript files)

| Test | Result | Evidence |
|---|---|---|
| IN-REPO? | **YES** — `runtime/` is submodule pinned to `2709b18`; files verified at `/repo/ping/runtime/replay/` in brain-repo-runtime | `ls -la /repo/ping/runtime/replay/` shows 27 files |
| IN-IMAGE? | **NO** — `COPY runtime/replay` never appears in any version of Dockerfile.mission-control | `docker history compose-mission-control --no-trunc` shows only 6 COPY commands, none for `replay` |
| IN-CONTAINER? | **NO** — `/app/runtime/replay/` does not exist in ping-mission-control | `ls: cannot access '/app/runtime/replay/': No such file or directory` |
| EXECUTABLE? | **NO** — No Node.js runtime in any container on `brain_internal` network | `which node` returns empty in ping-mission-control, brain-repo-runtime, brain-openwebui |
| EXECUTED? | **N/A** — not executable | — |
| AUTHORITATIVE? | **NO** | — |

**FINAL CLASSIFICATION: UNDEPLOYED + NOT EXECUTABLE** — The files exist in the repository but were never included in the Docker image. Even if they were included, no Node.js runtime exists in the deployment environment to execute them. They are **neither deployed nor deployable** in the current environment architecture without adding Node.js to the container.

---

### Component: `workers/*.py` (7 Python worker files: summary, claim, candidate_claim, embedding, entity, classifier, memory_ingestion)

| Test | Result | Evidence |
|---|---|---|
| IN-REPO? | **YES** — at `workers/*.py` | `git status` shows modified `workers/claim_worker.py`, `workers/classifier_worker.py`, `workers/embedding_worker.py`, `workers/entity_worker.py`, `workers/summary_worker.py` |
| IN-IMAGE? | **NO** — Dockerfile copies `COPY brainos/orchestration/src ./src` (not the root `workers/`) and `COPY runtime/...` (not `workers/`) | Dockerfile inspection |
| IN-CONTAINER? | **NO** — `/app/workers/` does not exist | `ls: cannot access '/app/workers/': No such file or directory` |
| EXECUTABLE? | **YES** — Python 3.11 is available | — |
| EXECUTED? | **NO** | — |
| AUTHORITATIVE? | **NO** | — |

**FINAL CLASSIFICATION: UNDEPLOYED** — The files exist in the repository but are not included in the Docker image. However, they ARE executable (Python exists). They could be deployed by adding them to the Dockerfile or a volume mount.

---

### Component: `projection_worker.py` variants

**Sub-variant A: `src/projection_worker.py` (standalone)**

| Test | Result | Evidence |
|---|---|---|
| IN-REPO? | YES — at `brainos/orchestration/src/projection_worker.py` | |
| IN-IMAGE? | **YES** — `COPY brainos/orchestration/src ./src` includes it | `find /app -name 'projection_worker.py'` returns it |
| IN-CONTAINER? | **YES** | exists at `/app/src/projection_worker.py` |
| EXECUTABLE? | **YES** — Python 3.11 available | |
| EXECUTED? | **NO** — uses `if __name__ == "__main__"`, never imported | Not imported by app.py, not in TOOL_MAP, no process runs it |
| AUTHORITATIVE? | **NO** — Qdrant `constitutional_memory` has 0 points | Collection verified via REST API |

**Sub-variant B: `src/projection_worker/projection_worker.py` (package form)**

| Test | Result | Evidence |
|---|---|---|
| IN-CONTAINER? | **YES** | exists at `/app/src/projection_worker/projection_worker.py` |
| EXECUTED? | **NO** | same as above |

**Sub-variant C: `simple_projection_worker.py`, `qdrant_projection_worker.py`, `constitutional_projection_worker.py`**

| Test | Result | Evidence |
|---|---|---|
| IN-REPO? | `simple_projection_worker.py` exists as untracked file at repo root; `qdrant_projection_worker.py` at `brainos/orchestration/src/`; `constitutional_projection_worker.py` at `runtime/constitutional/` | |
| IN-IMAGE? | **NO** — none of these exist in container | `find /app -name '*simple*' -o -name '*qdrant_projection*' -o -name '*constitutional_projection*'` returns empty |

**FINAL CLASSIFICATION (A + B): DORMANT** — Deployed in the container, executable (Python 3.11 available), but no process starts them. No cron, no supervisor, no sidecar, no service definition.

**FINAL CLASSIFICATION (C): UNDEPLOYED** — In repository but not in the image.

---

### Component: `runtime/tools/*.py` (6 tool scripts)

| Test | Result | Evidence |
|---|---|---|
| IN-IMAGE? | **YES** — but only because of uncommitted Dockerfile change | HEAD Dockerfile does NOT include `COPY runtime/tools` |
| IN-CONTAINER? | **YES** | Verified in container |
| EXECUTED? | **YES** — via `subprocess.run([sys.executable, path])` from WorkerProtocol | `/proc/1/fd` shows pipes (subprocess IPC), `TOOL_MAP` routes them, `search_worker.py` calls them |
| AUTHORITATIVE? | **PARTIAL** — `authority_search.py` and `lineage_search.py` return real data; `graph_expand.py` silently returns empty (column mismatch); others return data | Verified by previous session testing |

**FINAL CLASSIFICATION: AUTHORITATIVE** — But CRITICAL NOTE: this depends on the uncommitted Dockerfile change. HEAD commit would NOT deploy these tools.

---

### Component: `runtime/cognitive/*.py` (Supervisor, ReasoningGateway, SearchWorker, etc.)

| Test | Result | Evidence |
|---|---|---|
| IN-IMAGE? | **YES** — but only because of uncommitted Dockerfile change | HEAD Dockerfile does NOT include `COPY runtime/cognitive` |
| IN-CONTAINER? | **YES** | Verified in container |
| IMPORTED? | **YES** — all have `__pycache__` compiled bytecode | `find /app -name '*.pyc'` confirmed |
| EXECUTED? | **YES** — ReasoningGateway → Supervisor → SearchWorker/ContradictionWorker/ArchitectureWorker/MemoryWorker | Entrypoint chain: app.py → reasoning_query → ReasoningGateway → Supervisor |
| AUTHORITATIVE? | **YES** — Context Packs are built, answers synthesized | Verified by previous session testing (non-empty Context Packs) |

**FINAL CLASSIFICATION: AUTHORITATIVE** — But CRITICAL NOTE: this depends on the uncommitted Dockerfile change. HEAD commit would NOT deploy the cognitive runtime.

---

### Component: `src/constitutional/event_emitter.py:101` (uuid4 generator)

| Test | Result | Evidence |
|---|---|---|
| IN-IMAGE? | **YES** — `COPY brainos/orchestration/src ./src` includes it | |
| IN-CONTAINER? | **YES** | |
| EXECUTED? | **YES** — called by `constitutional_retrieval.py:ingest_document()` | Verified in previous session — Postgres events have uuid4 event_ids |
| AUTHORITATIVE? | **YES** — overwrites the caller's deterministic uuid5 | `event_emitter.py:101`: `event_id = uuid.uuid4()` |

**FINAL CLASSIFICATION: AUTHORITATIVE** — The active identity generator.

---

### Component: `runtime/adapters/*.ts` (3 TypeScript files)

| Test | Result | Evidence |
|---|---|---|
| IN-IMAGE? | **YES** — `COPY runtime/adapters ./runtime/adapters` is in HEAD Dockerfile | |
| IN-CONTAINER? | **YES** | `find /app -name '*.ts'` returns them |
| EXECUTABLE? | **NO** — No Node.js in container | `which node` returns empty |
| EXECUTED? | **NO** | |
| AUTHORITATIVE? | **NO** | |

**FINAL CLASSIFICATION: INERT** — The files are deployed in the container but cannot execute. No Node.js runtime exists in the deployment environment.

---

## Summary: The Four Key Errors in Previous Classification

### Error 1: Collapsed "not deployed" into "dead"

`runtime/replay/*.ts` was classified DEAD. The correct classification is **UNDEPLOYED + NOT EXECUTABLE**. Two separate claims:
- **UNDEPLOYED**: Files exist in repo but were never copied into any Docker image version. The Dockerfile never had `COPY runtime/replay`.
- **NOT EXECUTABLE**: Even if deployed, no Node.js runtime exists in the deployment environment (no container on the `brain_internal` network has Node.js).

These are related but separate facts. The "DEAD" label conceals the actionable information: the files could be deployed by copying them, but they still wouldn't execute without adding Node.js to the container.

### Error 2: Ignored uncommitted changes

The HEAD commit Dockerfile produces a fundamentally different container from the running one:
- HEAD Dockerfile: 6 COPY commands (base image + `src`, `runtime/constitutional`, `runtime/adapters`)
- Running Dockerfile: 10 COPY commands (above + `runtime/security`, `runtime/cognitive`, `runtime/tools`, `runtime/data`)

The HEAD commit's `app.py` lacks the entire reasoning pipeline (600+ lines of code including `/reasoning/query`, `/constitution/search` verification, etc.).

The HEAD commit's `constitutional_retrieval.py` does NOT write to Postgres — no `psycopg2` import, no `INSERT INTO events`, no `event_id` computation.

### Error 3: Ignored submodule pinning

`runtime/` is a git submodule at `2709b18`. The Dockerfile's `COPY runtime/...` copies from the pinned submodule commit, not from the main repo's working tree. Any evaluation of what the Dockerfile copies must reference the submodule's pinned commit, not the working tree.

### Error 4: Mislabeled "DEAD" for `projection_worker.py`

The two `projection_worker.py` files ARE in the container. They're Python scripts. Python IS available. They're just not being started. This is **DORMANT**, not dead. A dormant system can be activated without code changes (just a process start).

---

## Corrected Classification Table

| Component | IN-REPO | IN-IMAGE | IN-CONTAINER | EXECUTABLE | EXECUTED | AUTHORITATIVE | **FINAL** |
|---|---|---|---|---|---|---|---|
| runtime/replay/*.ts | YES | NO | NO | NO | N/A | NO | **UNDEPLOYED + NOT EXECUTABLE** |
| workers/*.py (7 files) | YES | NO | NO | YES | NO | NO | **UNDEPLOYED** |
| simple_projection_worker.py | YES | NO | NO | YES | NO | NO | **UNDEPLOYED** |
| qdrant_projection_worker.py | YES | NO | NO | YES | NO | NO | **UNDEPLOYED** |
| constitutional_projection_worker.py | YES | NO | NO | YES | NO | NO | **UNDEPLOYED** |
| src/projection_worker.py (×2) | YES | YES | YES | YES | NO | NO | **DORMANT** |
| runtime/adapters/*.ts (3 files) | YES | YES | YES | NO | NO | NO | **INERT** |
| runtime/tools/*.py (6 files) | YES | YES* | YES | YES | YES | YES | **AUTHORITATIVE*** |
| runtime/cognitive/*.py (8 files) | YES | YES* | YES | YES | YES | YES | **AUTHORITATIVE*** |
| runtime/security/*.py (4 files) | YES | YES* | YES | YES | PARTIAL | PARTIAL | **AUTHORITATIVE*** |
| src/constitutional/event_emitter.py | YES | YES | YES | YES | YES | YES | **AUTHORITATIVE** |
| src/constitutional_retrieval.py | YES | YES | YES | YES | YES | YES | **AUTHORITATIVE** |

*\* = Depends on uncommitted Dockerfile changes. HEAD build would NOT deploy these.*

---

## Actionable Next Steps (per classification)

| Classification | Meaning | Action Required |
|---|---|---|
| **UNDEPLOYED** | Exists in repo, not in image | Add to Dockerfile or mount as volume |
| **UNDEPLOYED + NOT EXECUTABLE** | Exists in repo, not in image, no runtime | Add to Dockerfile AND add Node.js runtime |
| **DORMANT** | In container, executable, not running | Start via cron, supervisor, or docker-compose service |
| **INERT** | In container, not executable | Remove from Dockerfile OR add runtime |
| **AUTHORITATIVE** | Executed, produces effects | Monitor and maintain |
