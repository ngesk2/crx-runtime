# Constitutional Proof — Phase Ω

**Execution-phase evidence only.** No architectural intent. Proof = demonstrable execution path from entry point to returned result.

## Assessment Method

Previous proofs measured only `runtime/` against mechanical gates. Phase Ω measures the **full codebase** and asks: does every runtime execution path dispatch through the declared authority?

| Scope | Files | Result |
|---|---|---|
| `runtime/` (constitutional runtime) | ~250 files | **23/29 authorities proven** (Nov 2025 audit) |
| Full codebase (runtime/ + brainos/ + root workers/ + gateway/) | ~500+ executable files | **5/29 authorities have full-codebase coverage** |

## Full-Codebase Bypass Count

| Gate | Pattern | Files outside runtime/ | Root workers bypassing | Status |
|---|---|---|---|---|
| P1: Configuration | `os.getenv` | 32 files | Many | **FAIL** — only runtime/ gated |
| P2: Repository | `psycopg2.connect` | 25 files | 13 root workers | **FAIL** — root workers use direct SQL |
| P3: Projection | `QdrantClient` | 15 files | 6 root workers | **FAIL** — root workers use direct Qdrant |
| P4: Identity | `uuid.uuid4` | 15 files | 11 root workers | **FAIL** — root workers generate IDs directly |
| P5: Hash | `hashlib.sha256` | 21 files | 12 root workers | **FAIL** — root workers hash directly |
| P5: Hash (TS) | `crypto.createHash` | 2 files (forensics, node_self_check) | N/A | Pass (documented exceptions) |
| P9: Subprocess | `subprocess.run` | 15 files (5 in runtime/, 10 elsewhere) | Various | **FAIL** — 15 occurrences across codebase |

**29 root-level worker files** (`C:\Users\nolan\PING\*.py`) use `psycopg2.connect`, `QdrantClient`, `hashlib.sha256`, or `uuid.uuid4` directly — completely bypassing all 7 Python constitutional authorities.

## Entry Points

Phase 1 agent identified 277 potential entry points. These decompose into:

| Category | Count | Examples |
|---|---|---|
| Gateway HTTP routes | 26 | `/api/v1/events`, `/repository/objects`, `/context` |
| Python workers (root) | 15 | `claim_worker.py`, `lineage_worker.py`, `observation_worker.py` |
| Python workers (runtime/) | 8 | `qdrant_projection_worker.py`, `replay_worker.py` |
| Python workers (workers/) | 5 | `repository_client.py`, `lineage_worker.py` (refactored) |
| Python workers (brainos/) | 12 | `projection_worker.py`, `constitutional_retrieval.py`, `web_retrieval.py` |
| Mission control | 3 | `app.py` (brainos/), `app_container.py` (root), `knowledge_apis.py` (root) |
| Kernel TS modules | 62 | `replay-engine`, `witness-authority`, `certificate-authority` |
| Docker containers | 6 running / 5 stopped | brain-postgres, brain-qdrant, crx-* containers |
| CLI scripts | ~40 | `generate_*.py`, `check_*.py`, `vault_*.py` |
| Test files | ~30 | `test_*.py`, `_test_*.py` |

## Authority Execution Proofs

### Proven (5/29 — full-codebase coverage)

#### 1. ConfigurationAuthority
| Field | Value |
|---|---|
| Owner | `runtime/config/configuration_authority.py` :: `ConfigurationAuthority` |
| Full-codebase bypasses | 32 files use `os.getenv` outside runtime/ |
| Mechanical gate scope | Only checks `runtime/` |
| Runtime evidence | ConfigurationAuthority.current() used by all runtime authorities and tools |
| **Status** | **Proven within runtime/. Bypassed by 32 files outside.** |

#### 2. Replay Transcript
| Field | Value |
|---|---|
| Owner | `runtime/kernel/replay/replay-transcript.ts` :: `ReplayTranscriptBuilder` |
| Full-codebase bypasses | None — single implementation |
| Entry points | `replay-engine`, `compiler/pipeline/executor.ts` |
| **Status** | **Proven** |
| Proof | Deterministic event builder. Used by replay-hook + compiler executor. No duplicates. |

#### 3. Replay Witness
| Field | Value |
|---|---|
| Owner | `runtime/kernel/replay/witness_authority.ts` :: `WitnessAuthority` |
| Duplicates | None |
| Entry points | `DeterministicReplayEngine`, `ReplayVerification`, `ConstitutionalSelfCheckCore` |
| **Status** | **Proven** |
| Proof | MerkleTree consumed solely by WitnessAuthority. No other implementation exists. |

#### 4. Replay Engine
| Field | Value |
|---|---|
| Owner | `runtime/kernel/replay/deterministic_replay_engine.ts` :: `DeterministicReplayEngine` |
| Duplicates | None (Python `replay_worker.py` is a stub) |
| Entry points | `constitutional_self_check_core.ts`, all 5 certification tests |
| **Status** | **Proven** |
| Proof | Single orchestration engine consuming all replay sub-components. Python stub has no engine logic. |

#### 5. Authority Router (Python)
| Field | Value |
|---|---|
| Owner | `runtime/authorities/authority_router.py` :: `AuthorityRouter` |
| Duplicates | None |
| Full-codebase bypasses | 29 root workers bypass all authorities entirely |
| **Status** | **Proven within runtime/. 29 root workers ignore it.** |
| Proof | All 4 tools (`authority_search.py`, `contradiction_search.py`, `graph_expand.py`, `lineage_search.py`) import only AuthorityRouter. Zero imports of raw adapters. |

### Partially Proven (4/29 — runtime/ only, bypassed outside)

#### 6. RepositoryAuthority
| Field | Value |
|---|---|
| Owner | `runtime/authorities/repository_authority.py` :: `RepositoryAuthority` |
| Full-codebase bypasses | 25 files use `psycopg2.connect` outside runtime/ |
| Root bypass count | 13 root workers (`claim_worker.py`, `lineage_worker.py`, `observation_worker.py`, `replay_worker.py`, `witness_worker.py`, `repository_event_layer.py`, `repository_scanner.py`, `constitutional_projection_worker.py`, `constitutional_runtime.py`, `filesystem_worker.py`, `app_container.py`, `mission_control_authority_endpoint.py`, `mission_control_knowledge_apis.py`) |
| **Status** | **Runtime proven. 25 files bypass.** |

#### 7. ProjectionAuthority
| Field | Value |
|---|---|
| Owner | `runtime/authorities/projection_authority.py` :: `ProjectionAuthority` |
| Full-codebase bypasses | 15 files use `QdrantClient` outside runtime/ |
| **Status** | **Runtime proven. 15 files bypass.** |

#### 8. IdentityAuthority
| Field | Value |
|---|---|
| Owner | `runtime/authorities/identity_authority.py` :: `IdentityAuthority` |
| Full-codebase bypasses | 15 files use `uuid.uuid4` outside runtime/ (including `workers/repository_client.py`) |
| **Status** | **Runtime proven. 15 files bypass.** |

#### 9. CanonicalHashAuthority
| Field | Value |
|---|---|
| Owner | `runtime/authorities/canonical_hash_authority.py` :: `CanonicalHashAuthority` |
| Full-codebase bypasses | 21 files use `hashlib.sha256` outside runtime/ |
| **Status** | **Runtime proven. 21 files bypass.** |

### Unproven — Fragmented (4/29)

#### 10. Capability Authority
| Field | Value |
|---|---|
| Implementations | **THREE**: (1) `runtime/kernel/capabilities/` TS kernel, (2) `constitutional-compiler/engines/capability-engine.ts`, (3) `runtime/security/capabilities.py` |
| Duplicates | 3 — critical |
| **Status** | **Unproven** — no canonical owner |

#### 11. Governance Authority
| Field | Value |
|---|---|
| Implementations | **TWO**: (1) `runtime/kernel/governance/governance-authority.ts`, (2) `runtime/security/policy_engine.py` |
| Duplicates | 2 |
| **Status** | **Unproven** — no canonical owner |

#### 12. Scheduler Authority
| Field | Value |
|---|---|
| Implementations | **TWO**: (1) `runtime/kernel/scheduler/` TS kernel, (2) `constitutional-compiler/execution/distributed-graph-scheduler.ts` |
| Duplicates | 2 |
| **Status** | **Unproven** — no declared supersession |

#### 13. Compiler Pipeline
| Field | Value |
|---|---|
| Implementations | **TWO**: (1) `compiler/pipeline/` v1 (CanonicalObject), (2) `constitutional-compiler/pipeline/` v2 (SemanticIR) |
| Duplicates | 2 |
| **Status** | **Unverifiable** — competing type systems |

### Infrastructure-Gated (1/29)

#### 14. ExecutionAuthority
| Field | Value |
|---|---|
| Owner | `runtime/authorities/execution_authority.py` :: `ExecutionAuthority` |
| Full-codebase | 15 files use `subprocess.run` — 5 in runtime/ (the 5 known P9 violations), 10 outside |
| **Status** | **Wraps subprocess pattern. All 15 call sites bypass it.** |

## Competing Implementations (Not Authority Violations)

| Component | Implementations | Notes |
|---|---|---|
| Mission Control | **3**: brainos/app.py, root/app_container.py, root/knowledge_apis.py | Different routes, different patterns |
| Gateway | **2**: gateway/app.ts (TypeScript, Express), gateway/repository_store.js (standalone) | Different purposes |
| Qdrant setup | **2**: runtime/ and brainos/ | Different connection patterns |
| Python runtime env | **3**: .venv, brainos/venv, Docker | Different packages, different Python versions |

## Summary

| Category | Count | Details |
|---|---|---|
| Fully proven (full codebase) | 5 | Replay Transcript, Witness, Engine, Authority Router (TS), Configuration (runtime) |
| Runtime-only proven | 4 | Repository, Projection, Identity, Hash — all bypassed by 15-32 files each |
| Fragmented/unproven | 4 | Capability (3x), Governance (2x), Scheduler (2x), Compiler Pipeline (2x) |
| Infrastructure-gated | 1 | ExecutionAuthority — Temporal needed |
| **Total** | **14 (down from 29)** | **Old count 23/29 was measurement error — only measured runtime/** |

**The mechanical gates must be extended to the full codebase, not just runtime/.** The 29 root worker files are the critical migration target: if those are refactored to route through AuthorityRouter, the full-codebase bypass count drops to near zero.

## Docker Requirement

Docker is not running. All proofs above are static (import chain analysis, symbol tracing, grep-based verification). The following proofs require runtime traces:

1. Gateway HTTP routes actually reaching RepositoryAuthority
2. Worker event loop dispatching through authorities
3. Qdrant projection writing through ProjectionAuthority
4. Postgres writes routing through RepositoryAuthority
5. Subprocess spawning through ExecutionAuthority
