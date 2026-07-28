# Authority Registry — Phase Ω

One row per authority. Columns: name, owner file, owner symbol, runtime consumers, mechanical verification, duplicates, OSS delegation.

## Python Authorities (runtime/)

| Authority | Owner File | Owner Symbol | Runtime Consumers | Mechanical Gate | Duplicates | OSS Layer | Status |
|---|---|---|---|---|---|---|---|
| Configuration | `runtime/config/configuration_authority.py` | `ConfigurationAuthority` | All runtime authorities + tools | P1: os.getenv (runtime/ only) | 0 | — | **Proven (runtime/) — 32 bypasses outside** |
| Repository | `runtime/authorities/repository_authority.py` | `RepositoryAuthority` | AuthorityRouter → tools | P2: psycopg2.connect | `runtime/kernel/repository/repository-authority.ts` (TS) | PostgreSQL | **Proven (runtime/) — 25 bypasses outside** |
| Projection | `runtime/authorities/projection_authority.py` | `ProjectionAuthority` | AuthorityRouter → search tools | P3: QdrantClient | 0 | Qdrant | **Proven (runtime/) — 15 bypasses outside** |
| Identity | `runtime/authorities/identity_authority.py` | `IdentityAuthority` | AuthorityRouter → workers via router | P4: uuid.uuid4 | `runtime/kernel/identity/identity-authority.ts` (TS interface) | — | **Proven (runtime/) — 15 bypasses outside** |
| Canonical Hash | `runtime/authorities/canonical_hash_authority.py` | `CanonicalHashAuthority` | AuthorityRouter → verification tools | P5: hashlib.sha256 | 2 TS implementations (certificate_authority.ts, canonical_hash_authority.ts) | — | **Proven (runtime/) — 21 bypasses outside** |
| Execution | `runtime/authorities/execution_authority.py` | `ExecutionAuthority` | N/A — wraps pattern only | P9: subprocess (5 runtime/ violations) | 0 | Temporal (planned) | **Pattern only — 15 bypasses** |
| Authority Router | `runtime/authorities/authority_router.py` | `AuthorityRouter` | All 4 tools in runtime/tools/ | Custom: tools import check | 0 | — | **Proven (runtime/)** |
| Embedding | `runtime/authorities/embedding_authority.py` | `EmbeddingAuthority` | N/A — created, no consumers yet | None | 0 | HuggingFace + sentence-transformers | **Created, no execution proof** |

## Kernel TypeScript Authorities (runtime/kernel/)

| Authority | Owner File | Owner Symbol | Consumers | Mechanical Gate | Duplicates | OSS Layer | Status |
|---|---|---|---|---|---|---|---|
| Replay Transcript | `runtime/kernel/replay/replay-transcript.ts` | `ReplayTranscriptBuilder` | replay-hook, compiler executor | None (single implementation) | 0 | — | **Proven** |
| Replay Witness | `runtime/kernel/replay/witness_authority.ts` | `WitnessAuthority` | DeterministicReplayEngine, ReplayVerification | None | 0 | — | **Proven** |
| Replay Engine | `runtime/kernel/replay/deterministic_replay_engine.ts` | `DeterministicReplayEngine` | ConstitationalSelfCheck, tests | None | 0 | — | **Proven** |
| Witness Certificate | `runtime/kernel/replay/certificate_authority.ts` | `CertificateAuthority` | WitnessAuthority, ReplayEngine | P5: crypto.createHash | `canonical_hash_authority.ts` (delegation service) | — | **Proven** |
| Canonical Hash (TS) | `runtime/kernel/replay/canonical_hash_authority.ts` | `CanonicalHashAuthority` | ReplayEngine, Registry | P5 | `certificate_authority.ts` (implementation) | — | **Proven** |
| Execution Context | `runtime/kernel/execution/execution-context.ts` | `ExecutionContextBuilder+Manager` | Kernel entry points | None | 0 | — | **Proven** |
| Authority Registry | `runtime/kernel/replay/authority_classification.ts` | `AuthorityRegistry` | Self-check, verification | None | `constitution/registry.yaml` (declarative) | — | **Proven** |
| Replay Equivalence | `runtime/kernel/replay/replay_verification.ts` | `ReplayVerification` | Self-check | None | 0 | — | **Proven** |

## Compiler TypeScript Authorities (constitutional-compiler/)

| Authority | Owner File | Owner Symbol | Consumers | Gate | Duplicates | Status |
|---|---|---|---|---|---|---|
| Compiler IR | `constitutional-compiler/ir/node-types.ts` | `IRNode`, `IRDocument` | All compiler subsystems | None | 0 | **Proven** |
| Evidence Store | `constitutional-compiler/evidence/evidence-store.ts` | `EvidenceStore` | rule-executor, proof-engine | None | 0 | **Proven** |
| Semantic Lowerer | `constitutional-compiler/lowering/semantic-lowerer.ts` | `SemanticLowerer` | graph-engine, constraint-solver, CQL | None | `symbol-canonicalizer.ts` (overlap) | **Proven** |
| Registry Loader | `constitutional-compiler/registry/constitutional-registry-loader.ts` | `ConstitutionalRegistryLoader` | rule-executor | None | 0 | **Proven** (2/5 stubs) |
| Rule Executor | `constitutional-compiler/rules/rule-executor.ts` | `ConstitutionalRuleExecutor` | build-proof-pipeline | None | 0 | **Proven** (4/12 stubs) |
| Counter-Evidence | `constitutional-compiler/engines/counter-evidence-engine.ts` | `CounterEvidenceEngine` | rule-executor | None | 0 | **Proven** (3/4 stubs) |
| Rule Provenance | `constitutional-compiler/engines/rule-provenance-engine.ts` | `RuleProvenanceEngine` | rule-executor | None | 0 | **Proven** |
| Proof Engine | `constitutional-compiler/proof/constitutional-proof-objects.ts` | `ConstitutionalProofEngine` | build-proof-pipeline | None | 0 | **Proven** |
| CQL | `constitutional-compiler/query/constitutional-query-language.ts` | `CQLParser+Executor` | CQL engine | None | 0 | **Proven** |
| Semantic Optimizer | `constitutional-compiler/optimizer/semantic-optimizer.ts` | `SemanticOptimizer` | build-proof-pipeline | None | 0 | **Proven** |
| Auto Repair | `constitutional-compiler/repair/automatic-repair-engine.ts` | `AutomaticRepairEngine` | build-proof-pipeline | None | 0 | **Proven** |
| TS Frontend | `constitutional-compiler/frontends/typescript/ts-frontend.ts` | `TypeScriptFrontend` | compiler pipeline | None | 0 | **Proven** |

## Fragmented Authorities (Unproven)

| Authority | Implementations | Count | Issue |
|---|---|---|---|
| Capability | `runtime/kernel/capabilities/capability-authority.ts` (kernel TS), `constitutional-compiler/engines/capability-engine.ts` (compiler TS), `runtime/security/capabilities.py` (Python) | 3 | No canonical owner; 3 different models (kCAP, cCAP, pCAP) |
| Governance | `runtime/kernel/governance/governance-authority.ts` (TS rule-based), `runtime/security/policy_engine.py` (Python identity-capability-based) | 2 | Different architectures, no declared supersession |
| Scheduler | `runtime/kernel/scheduler/scheduler-authority.ts` (runtime TS), `constitutional-compiler/execution/distributed-graph-scheduler.ts` (compiler TS) | 2 | Different purposes, same label |
| Compiler Pipeline | `compiler/pipeline/` v1 (CanonicalObject envelopes), `constitutional-compiler/pipeline/build-proof-pipeline.ts` v2 (SemanticIR typed) | 2 | Different type systems, no supersession |

## Competitors (Not Authority Violations — consolidation needed)

| Component | Implementations | Suggested Action |
|---|---|---|
| Mission Control | `brainos/orchestration/src/mission_control/app.py`, `app_container.py` (root), `mission_control_knowledge_apis.py` (root) | Consolidate to one; declare canonical |
| Gateway HTTP | `gateway/app.ts` (Express, 26 routes), `gateway/repository_store.js` (standalone, 5 routes) | Keep app.ts as primary; document repository_store.js as add-on |
| Python runtime setup | `.venv/`, `brainos/venv/`, Docker containers | Standardize on one Python env |

## Bypass Summary

Every Python authority in `runtime/` has 15-32 bypasses in the rest of the codebase. The 29 root-level worker files that use `psycopg2.connect` + `QdrantClient` + `hashlib.sha256` + `uuid.uuid4` directly are the primary migration target.
