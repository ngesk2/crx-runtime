# Execution Proof Matrix — Phase Ω

For each entry point, trace the execution path through every authority encountered. Status: **Static proof** (Docker not running — no runtime traces available).

## Gateway Entry Points (26 HTTP routes in `gateway/app.ts`)

| Route | Authority Chain | Bypasses | Status |
|---|---|---|---|
| `POST /api/v1/events` | → repository_store.js → crypto.createHash → PostgreSQL | crypto.createHash bypasses CanonicalHashAuthority | **Partial** — gateways cannot import Python authorities |
| `POST /api/v1/repository/objects` | → repository_store.js → crypto.createHash → PostgreSQL | Same bypass | **Partial** |
| `GET /api/v1/repository/objects/:id` | → PostgreSQL direct query | No authority consulted | **Bypass** — should route through RepositoryAuthority |
| `GET /api/v1/search` | → QdrantClient → Qdrant | No ProjectionAuthority | **Bypass** — direct Qdrant access |
| `GET /api/v1/health` | → no authorities | N/A | N/A |
| Remaining 21 routes | → Express middleware → various handlers | Mixed — some route through authorities, some don't | **Varies** |

## Root Worker Entry Points (15 Python files, `C:\Users\nolan\PING\*.py`)

| Worker | Authority Chain | Bypasses | Status |
|---|---|---|---|
| `claim_worker.py` | → psycopg2.connect + hashlib.sha256 + uuid.uuid4 | **ALL** — Repository, Hash, Identity | **Full bypass** — no authority routing |
| `lineage_worker.py` | → psycopg2.connect + uuid.uuid4 | **ALL** — Repository, Identity | **Full bypass** |
| `observation_worker.py` | → psycopg2.connect + uuid.uuid4 | **ALL** — Repository, Identity | **Full bypass** |
| `replay_worker.py` | → psycopg2.connect + uuid.uuid4 + hashlib.sha256 | **ALL** — Repository, Identity, Hash | **Full bypass** |
| `witness_worker.py` | → psycopg2.connect + uuid.uuid4 | **ALL** — Repository, Identity | **Full bypass** |
| `repository_event_layer.py` | → psycopg2.connect + hashlib.sha256 + uuid.uuid4 | **ALL** — Repository, Hash, Identity | **Full bypass** |
| `repository_scanner.py` | → psycopg2.connect + uuid.uuid4 | **ALL** — Repository, Identity | **Full bypass** |
| `constitutional_projection_worker.py` | → psycopg2.connect + QdrantClient + uuid.uuid4 | **ALL** — Repository, Projection, Identity | **Full bypass** |
| `filesystem_worker.py` | → uuid.uuid4 | Identity | **Partial bypass** |
| `constitutional_runtime.py` | → psycopg2.connect | Repository | **Partial bypass** |
| `app_container.py` | → psycopg2.connect + QdrantClient + os.getenv | **ALL** — Repository, Projection, Configuration | **Full bypass** |
| `mission_control_authority_endpoint.py` | → psycopg2.connect | Repository | **Partial bypass** |
| `mission_control_knowledge_apis.py` | → psycopg2.connect + QdrantClient + uuid.uuid4 + os.getenv | **ALL** — Repository, Projection, Identity, Configuration | **Full bypass** |
| `simple_projection_worker.py` | → QdrantClient + hashlib.sha256 | Projection, Hash | **Partial bypass** |
| `destructive_recovery_certification.py` | → psycopg2.connect + QdrantClient + hashlib.sha256 + uuid.uuid4 | **ALL** | **Full bypass** |

## `runtime/` Worker Entry Points (authority-routed)

| Worker | Authority Chain | Bypasses | Status |
|---|---|---|---|
| `runtime/kernel/workers/qdrant_projection_worker.py` | → AuthorityRouter → ProjectionAuthority → Qdrant | hashlib.sha256 (5 occurrences) | **Partial — hash bypasses within runtime/** |
| `runtime/projection_worker/constitutional_projection_worker.py` | → AuthorityRouter → ProjectionAuthority | hashlib.sha256 (2) | **Partial — hash bypasses** |
| `runtime/cognitive/supervisor.py` | → AuthorityRouter | uuid.uuid4 (1) | **Partial — identity bypass** |
| `runtime/tools/authority_search.py` | → AuthorityRouter → RepositoryAuthority + ProjectionAuthority | 0 | **Clean** — routes through authorities |
| `runtime/tools/contradiction_search.py` | → AuthorityRouter → RepositoryAuthority | 0 | **Clean** |
| `runtime/tools/graph_expand.py` | → AuthorityRouter → RepositoryAuthority | 0 | **Clean** |
| `runtime/tools/lineage_search.py` | → AuthorityRouter → RepositoryAuthority | 0 | **Clean** |

## `workers/` Entry Points (refactored, authority-routed)

| Worker | Authority Chain | Bypasses | Status |
|---|---|---|---|
| `workers/lineage_worker.py` | → repository_client.py → gateway HTTP | uuid.uuid4 (1) | **Partial — identity bypass** |
| `workers/witness_worker.py` | → repository_client.py → gateway HTTP | uuid.uuid4 (1) | **Partial — identity bypass** |
| `workers/projection_worker.py` | → repository_client.py → gateway HTTP | uuid.uuid4 (1) | **Partial — identity bypass** |
| `workers/repository_client.py` | → gateway HTTP → crypto.createHash → PostgreSQL | uuid.uuid4 (1) | **Documented exception** (stdlib-only constraint) |

## `brainos/` Entry Points (unrouted)

| Worker | Authority Chain | Bypasses | Status |
|---|---|---|---|
| `brainos/orchestration/src/mission_control/app.py` | → psycopg2.connect + QdrantClient + os.getenv (17) | **ALL** | **Full bypass** |
| `brainos/orchestration/src/constitutional_retrieval.py` | → psycopg2.connect + QdrantClient + os.getenv + hashlib.sha256 | **ALL** | **Full bypass** |
| `brainos/orchestration/src/constitutional_search.py` | → psycopg2.connect + QdrantClient + os.getenv + hashlib.sha256 | **ALL** | **Full bypass** |
| `brainos/orchestration/src/projection_worker.py` | → psycopg2.connect + QdrantClient + os.getenv | **ALL** | **Full bypass** |
| `brainos/orchestration/src/web_retrieval.py` | → psycopg2.connect + os.getenv + uuid.uuid4 | **ALL** | **Full bypass** |
| `brainos/orchestration/src/google_drive_ingestion.py` | → psycopg2.connect + os.getenv + uuid.uuid4 | **ALL** | **Full bypass** |
| `brainos/orchestration/src/constitutional/event_emitter.py` | → psycopg2.connect (2) + os.getenv + uuid.uuid4 | **ALL** | **Full bypass** |

## Kernel TypeScript Entry Points

| Module | Authority Chain | Status |
|---|---|---|
| `runtime/kernel/replay/deterministic_replay_engine.ts` | → WitnessAuthority → CertificateAuthority.sha256 → MerkleTree | **Proven** |
| `runtime/kernel/replay/replay_verification.ts` | → DeterministicReplayEngine → StateSerializer → CanonicalJson | **Proven** |
| `runtime/kernel/capabilities/capability-authority.ts` | → Self-contained (3rd competing impl) | **Unproven** |
| `runtime/kernel/governance/governance-authority.ts` | → Self-contained (2nd competing impl) | **Unproven** |

## Summary

| Path | Authority-Routed? | Migration Priority |
|---|---|---|
| Gateway HTTP routes | Partial (crypto.createHash bypass) | Medium |
| 15 root workers (`C:\Users\nolan\PING\*.py`) | **No — full bypass** | **Critical** — 29 files |
| 4 `workers/` refactored workers | Yes (uuid.uuid4 doc exception) | Low |
| 7 `runtime/` tools + workers | Yes (minor hashlib/uuid bypasses) | Low |
| 7 `brainos/` entry points | **No — full bypass** | **High** — 7 files + 3 mission control variants |
| Kernel TS | Yes (single implementations) | Low |
| Compiler TS | Yes (single implementations) | Low |

**Total bypass files outside runtime/: 29 root workers + 7 brainos + 3 mission control = 39 critical migration targets.**
