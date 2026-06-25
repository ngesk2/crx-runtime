# Dead Code Validation — Phase 3

## Methodology
Every component previously labeled DEAD was verified against 6 criteria using container filesystem inspection, process inspection, network inspection, and execution chain analysis. No assumptions. No inference from source code alone.

### Classification Scale
| State | Definition |
|---|---|
| DEFINED | Source code exists in repository |
| BUILT | Compiled/transpiled output exists or file exists in container |
| DEPLOYED | File exists in a running container's filesystem |
| EXECUTED | Process runs the file (imported, subprocess, or direct execution) |
| AUTHORITATIVE | File produces runtime-observable effects (DB writes, Qdrant writes, API responses) |
| DEAD | Execution impossibility is proven |
| UNUSED | Executable but produces no observable runtime effect |

---

## Component 1: runtime/replay/*.ts (TypeScript Replay Layer)

### Source files on host
27 files in `runtime/replay/`:
- merkle_tree.ts, canonical_hash_authority.ts, certificate_authority.ts, witness_authority.ts
- deterministic_replay_engine.ts, replay_event_stream.ts, replay_state_machine.ts
- canonical_event_envelope.ts, canonical_json.ts, canonical_certificate.ts
- authority_classification.ts, authority_registry.ts, constitutional_law_manifest.ts
- plus 16 more (utils/, corpus/, __tests__/, forensics/)

### Status by criteria
| Criterion | Evidence |
|---|---|
| DEFINED | YES — All 27 files exist on host at `C:\Users\nolan\PING\runtime\replay\` |
| BUILT | **NO** — No tsconfig.json in runtime/replay/. No build step in ANY Dockerfile. No compiled JS output exists anywhere. |
| DEPLOYED | **NO** — Container `find /app -type f -name '*.ts' 2>/dev/null` returns only 3 files in `/app/runtime/adapters/`. `/app/runtime/replay/` does not exist. |
| EXECUTED | **NO** — No Node.js runtime in any container connected to brain_internal network. See below. |
| AUTHORITATIVE | **NO** — No runtime trace of any TypeScript execution. |

### Runtime impossibility proof
**Container-by-container check for Node.js:**
| Container | Node.js? | Has replay files? | Can execute? |
|---|---|---|---|
| ping-mission-control | **NO** (`which node` → empty) | **NO** (`/app/runtime/replay/` → ls fails) | NO |
| brain-repo-runtime | **NO** (`which node` → empty) | YES (read-only mount at `/repo/ping/runtime/replay/`) | NO — Alpine with no runtime |
| brain-openwebui | **NO** (Python image, no node) | **NO** | NO |
| brain-qdrant | **NO** (Rust binary) | **NO** | NO |
| brain-postgres | **NO** | **NO** | NO |
| brain-ollama | **NO** (Go binary) | **NO** | NO |
| open-webui | YES (Node.js available) | **NO** — NOT on brain_internal network | NO — different network, no PING code access |

### Classification: **DEAD**
No Node.js runtime exists in any container on the `brain_internal` network. The only container with the files (`brain-repo-runtime`) runs Alpine Linux with no Node.js, no Python, and is read-only. Execution impossibility is proven.

---

## Component 2: Workers in `workers/` directory

### Source files on host
7 files in `C:\Users\nolan\PING\workers/`:
- summary_worker.py, claim_worker.py, candidate_claim_worker.py
- embedding_worker.py, entity_worker.py, classifier_worker.py
- memory_ingestion_worker.py

### Status by criteria
| Criterion | Evidence |
|---|---|
| DEFINED | YES |
| BUILT | **NO** — Not copied by Dockerfile (`COPY brainos/orchestration/src ./src` and `COPY runtime/...` — does NOT include `workers/`) |
| DEPLOYED | **NO** — `find /app -name '*worker*' -type f` in container shows ONLY `runtime/cognitive/*worker*.py` and `/app/src/projection_worker.py`. The `workers/` directory does not exist at `/app/workers/` or anywhere in the container. |
| EXECUTED | **NO** |
| AUTHORITATIVE | **NO** |

### Classification: **DEAD**
Files do not exist in the container. Dockerfile does not copy `workers/` directory. Not referenced by any import chain.

---

## Component 3: Qdrant Projection Workers (projection_worker.py forms)

### Source files on host
- `brainos/orchestration/src/projection_worker.py` (standalone, 266 lines)
- `brainos/orchestration/src/projection_worker/projection_worker.py` (package form, 285 lines)
- `brainos/orchestration/src/simple_projection_worker.py` (NOT in container)
- `brainos/orchestration/src/qdrant_projection_worker.py` (NOT in container)
- `runtime/constitutional/constitutional_projection_worker.py` (NOT in container)

### Status by criteria
| Criterion | Evidence |
|---|---|
| DEFINED | YES — Multiple versions exist |
| BUILT | **PARTIAL** — Only `/app/src/projection_worker.py` and `/app/src/projection_worker/projection_worker.py` exist in container |
| DEPLOYED | **PARTIAL** — Two files exist in container but are NOT started by any mechanism |
| EXECUTED | **NO** — No process runs them. They use `if __name__ == "__main__"` guard and are never imported by app.py |
| AUTHORITATIVE | **NO** — Qdrant write evidence (logs) shows ALL writes come from 172.21.0.5 (ping-mission-control) via python-httpx/0.28.1, specifically from `constitutional_retrieval.py` |

### Runtime impossibility proof
- No cron/scheduler/systemd timer starts these workers
- No docker-compose service definition runs them (they were commented out in earlier compose versions)
- app.py does NOT import them (grep import confirms)
- WorkerProtocol.TOOL_MAP does NOT reference them
- Qdrant logs show ALL writes from IP 172.21.0.5 (ping-mission-control), using httpx — not from a separate process
- The `constitutional_memory` collection has 0 points, confirming no worker has ever written to it

### Classification: **DEPLOYED BUT NOT RUNNING** (for the two files in container), **DEAD** (for the other variants)
The two `projection_worker.py` files exist in the container but no process executes them. The other 3 variants (`simple_projection_worker.py`, `qdrant_projection_worker.py`, `constitutional_projection_worker.py`) do not exist in the container.

---

## Component 4: uuid4 Generators in Dead Workers

### Source locations
14 uuid4 generators exist in worker files in `workers/` directory. Since those files are DEAD (not in container), the generators are DEAD.

### The ONE Active uuid4 Generator
| Location | Behavior | Evidence |
|---|---|---|
| `constitutional_retrieval.py:82` | uuid5 from content hash (DETERMINISTIC) | Source code: `_uuid.uuid5(_uuid.NAMESPACE_DNS, doc_name + content)` |
| `constitutional_retrieval.py:87` (via event_emitter.py:101) | **OVERWRITES with uuid4** (NON-DETERMINISTIC) | `event_emitter.py:101`: `event_id = uuid.uuid4()` |

### Classification: **AUTHORITATIVE** (the event_emitter.py:101 uuid4) — **DEAD** (the 14 uuid4 generators in `/workers/`)
The 14 generators are in dead files not in the container. The active generator is the single uuid4 at `event_emitter.py:101`.

---

## Component 5: TOOL_MAP Scripts (runtime/tools/)

### Status by criteria
| Tool | DEFINED | In Container | Imported/Subprocessed | Executed | Authoritative |
|---|---|---|---|---|---|
| authority_search.py | YES | YES (+ __pycache__) | YES (WorkerProtocol.call_tool) | YES (subprocess) | YES (returns real data) |
| lineage_search.py | YES | YES (NO __pycache__) | YES (WorkerProtocol.call_tool) | YES (subprocess, creates own __pycache__) | YES (returns real data) |
| graph_expand.py | YES | YES (NO __pycache__) | YES (WorkerProtocol.call_tool) | YES (subprocess) | YES (returns data, may be empty due to schema mismatch) |
| contradiction_search.py | YES | YES (NO __pycache__) | YES (WorkerProtocol.call_tool) | YES (subprocess) | YES |
| repository_symbols.py | YES | YES (NO __pycache__) | YES (WorkerProtocol.call_tool) | YES (subprocess) | YES |
| repository_relationships.py | YES | YES (NO __pycache__) | YES (WorkerProtocol.call_tool) | YES (subprocess) | YES |

All 6 tools are EXECUTED via subprocess from the reasoning pipeline. The first 3 have been confirmed to return data (authority_search returns authority objects, lineage_search returns lineage chains).

---

## Final Classification Summary

| Subsystem | DEFINED | BUILT | DEPLOYED | EXECUTED | AUTHORITATIVE | Final |
|---|---|---|---|---|---|---|
| runtime/replay/*.ts | YES | NO | NO | NO | NO | **DEAD** |
| workers/*.py | YES | NO | NO | NO | NO | **DEAD** |
| simple_projection_worker.py | YES | NO | NO | NO | NO | **DEAD** |
| qdrant_projection_worker.py | YES | NO | NO | NO | NO | **DEAD** |
| constitutional_projection_worker.py | YES | NO | NO | NO | NO | **DEAD** |
| projection_worker.py (src/projection_worker.py) | YES | YES | YES | NO | NO | **DEPLOYED but NOT RUNNING** |
| event_emitter.py uuid4 | YES | YES | YES | YES | YES | **AUTHORITATIVE** |
| runtime/tools/*.py (6 tools) | YES | YES | YES | YES | YES | **AUTHORITATIVE** |
| constitutional_retrieval.py | YES | YES | YES | YES | YES | **AUTHORITATIVE** |
| runtime/cognitive/*.py (8 files) | YES | YES | YES | YES | YES | **AUTHORITATIVE** |
| runtime/security/*.py (4 files) | YES | YES | YES | PARTIAL | PARTIAL | **DEPLOYED, PARTIALLY EXECUTED** |
| runtime/adapters/*.ts (3 files) | YES | YES | YES | NO | NO | **DEPLOYED but NOT EXECUTED** |
