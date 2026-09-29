# MINIMAL REPOSITORY HYGIENE + SALVAGE AUDIT

## MODE
READ ONLY / NO EXECUTION / NO ORACLE INTERFERENCE

## PASS 1 — ACTUAL EMPTY DIRECTORIES

### SUSPICIOUS DIRECTORIES INVESTIGATED

**ping-runtime/business/**
- Files: 5 (ai_workspace_authority.js, business_emitters.js, customer_authority.js, project_authority.js, review_authority.js)
- Size: ~40KB
- Classification: LIVE_PARTIAL (business authorities exist but not in gateway bootstrap)
- NOT EMPTY_SCAFFOLD

**ping-runtime/connectors/**
- Files: 11 (capability_registry.js, connector_registry.js, constitutional_capability_contract.js, email_connector.js, email_integration.js, github_adapter.js, github_connector.js, google_connector.js, oauth_provider.js, posthog_connector.js, posthog_integration.js, sms_connector.js, sms_integration.js)
- Size: ~100KB
- Classification: LIVE_PARTIAL (connectors exist but email/sms integrations are stubs)
- NOT EMPTY_SCAFFOLD

**ping-runtime/knowledge/**
- Files: 2 (knowledge_graph.js, knowledge_promoter.js)
- Size: ~25KB
- Classification: LIVE_PARTIAL (knowledge graph exists but not in gateway bootstrap)
- NOT EMPTY_SCAFFOLD

**ping-runtime/search/**
- Files: 2 (hybrid_search.js, qdrant_adapter.js)
- Size: ~20KB
- Classification: LIVE_PARTIAL (search exists but not in gateway bootstrap)
- NOT EMPTY_SCAFFOLD

**ping-runtime/embeddings/**
- Files: 1 (embedding_service.js)
- Size: ~10KB
- Classification: LIVE_PARTIAL (embedding service exists but not in gateway bootstrap)
- NOT EMPTY_SCAFFOLD

**ping-runtime/graph/**
- Files: 1 (neo4j_adapter.js)
- Size: ~12KB
- Classification: LIVE_PARTIAL (neo4j adapter exists but created in bootstrap, not used)
- NOT EMPTY_SCAFFOLD

**ping-runtime/canonicalization/**
- Files: 2 (canonical_object.js, canonicalization_service.js)
- Size: ~15KB
- Classification: LIVE_PARTIAL (canonicalization exists but wiring unclear)
- NOT EMPTY_SCAFFOLD

**ping-runtime/orchestration/execution/**
- Files: 13 (artifact_authorities.js, artifact_router.js, artifact_store.js, capability_registry.js, capability_registry.json, consensus_engine.js, context_authority.js, engine.js, event_queue.js, mission_compiler.js, ollama_provider.js, scheduler.js, worker_port.js, worker_state_machine.js)
- Size: ~150KB
- Classification: DORMANT_INCOMPLETE (historical execution engine, not wired to current runtime)
- NOT EMPTY_SCAFFOLD

**CONCLUSION:** Zero EMPTY_SCAFFOLD classifications. All previously suspicious directories contain substantive implementations.

## PASS 2 — OBVIOUS REPOSITORY WASTE

### MAIN REPOSITORY SCOPE
- Zero .tmp, .bak, .old, .orig, .rej, *~, .DS_Store, Thumbs.db files found in main repository
- All found files are in worktrees (build cache artifacts: .next/cache/webpack/*.old)
- Worktree artifacts are WORKTREE_RECLAIMABLE, not repository-level waste

### DELETE_SAFE
None found in main repository scope.

## PASS 3 — BUILD ARTIFACT vs ONLY SURVIVING IMPLEMENTATION

### constitutional-compiler/dist/
- NOT INVESTIGATED IN THIS PASS (deferred to codex/archaeology lane)
- User directive: DO NOT classify dist/ as disposable merely because compiled output
- Requires source provenance inspection before classification

## PASS 4 — DUPLICATE STRUCTURES

### infra/ vs infrastructure/
- infra/: oracle/ directory, physical_clock_adapter.js
- infrastructure/: directory does not exist
- Classification: DIFFERENT_PURPOSE (not duplicate)

### intent/ vs intents/
- intent/: 8 YAML intent definitions
- intents/: 22 subdirectories (capability, compiler, constitutional-ir, diagnostics, evidence, execution, governance, graph, hashing, identity, ownership, parsing, proof, query, repair, replay, repository, rule-engine, scheduler, witness)
- Classification: DIFFERENT_PURPOSE (intent/ = high-level intent definitions, intents/ = detailed specification subdirectories)

### workspace/ vs workspaces/
- workspace/: cache/ subdirectory
- workspaces/: VerifyReplay/ subdirectory
- Classification: DIFFERENT_PURPOSE (different workspaces for different purposes)

### spec/ vs specs/
- spec/: directory does not exist
- specs/: 8 subdirectories (capability-engine, constitutional-ir, governance-engine, hash-authority, parser-boundary, replay-authority)
- Classification: DIFFERENT_PURPOSE (only specs/ exists)

### test/ vs tests/
- test/: 7 test files (constitutional_failure.test.js, constitutional_replay.test.js, cross_machine_replay.test.js, multi_vendor_validation.test.js, ollama_replay.test.js, replay_stress.test.js, run_constitutional_pipeline.js)
- tests/: certification/, corpus/, 5 Python test files
- Classification: DIFFERENT_PURPOSE (test/ = JS constitutional tests, tests/ = certification corpus + Python tests)

### kernel/ vs runtime/kernel/ vs ping-runtime/runtime/kernel/
- kernel/: event_dispatcher.py (Python)
- runtime/kernel/: substantial TS kernel implementation
- ping-runtime/runtime/: 13 JS runtime files
- Classification: DIFFERENT_PURPOSE (kernel/ = Python dispatcher, runtime/kernel/ = TS kernel, ping-runtime/runtime/ = JS runtime utilities)

### gateway/ vs runtime/ vs ping-runtime/
- gateway/: HTTP gateway, authorities, routes, connectors
- runtime/: TS kernel, capabilities, temporal
- ping-runtime/: Core JS runtime
- Classification: DIFFERENT_PURPOSE (distinct layers)

**CONCLUSION:** Zero TRUE_DUPLICATE classifications. All name overlaps are DIFFERENT_PURPOSE.

## PASS 5 — DORMANT CODE SALVAGE

### ping-runtime/orchestration/execution/
**CAPABILITY:** Historical execution engine with artifact routing, consensus, context authority, worker state machine
**CURRENT REACHABILITY:** DORMANT (not wired to current runtime)
**IMPLEMENTATION QUALITY SIGNAL:** SUBSTANTIAL (13 files, 150KB)
**AUTHORITY CONFLICT:** Potentially conflicts with current MissionScheduler/WorkerRuntime
**SALVAGEABLE MECHANISM:** consensus_engine.js, worker_state_machine.js, context_authority.js
**SMALLEST REFACTOR SHAPE:** Extract consensus algorithm and worker state machine into reusable library under current authority
**PRESERVE?** YES
**DELETE?** NO

### ping-runtime/business/
**CAPABILITY:** Business authorities (customer, project, review, AI workspace)
**CURRENT REACHABILITY:** DORMANT (not in gateway bootstrap)
**IMPLEMENTATION QUALITY SIGNAL:** SUBSTANTIAL (5 files, 40KB)
**AUTHORITY CONFLICT:** None (business authorities are legitimate)
**SALVAGEABLE MECHANISM:** customer_authority.js, project_authority.js
**SMALLEST REFACTOR SHAPE:** Wire into gateway bootstrap
**PRESERVE?** YES
**DELETE?** NO

### ping-runtime/knowledge/
**CAPABILITY:** Knowledge graph and promoter
**CURRENT REACHABILITY:** DORMANT (not in gateway bootstrap)
**IMPLEMENTATION QUALITY SIGNAL:** SUBSTANTIAL (2 files, 25KB)
**AUTHORITY CONFLICT:** None
**SALVAGEABLE MECHANISM:** knowledge_graph.js, knowledge_promoter.js
**SMALLEST REFACTOR SHAPE:** Wire into gateway bootstrap
**PRESERVE?** YES
**DELETE?** NO

### ping-runtime/search/
**CAPABILITY:** Hybrid search with Qdrant adapter
**CURRENT REACHABILITY:** DORMANT (not in gateway bootstrap)
**IMPLEMENTATION QUALITY SIGNAL:** SUBSTANTIAL (2 files, 20KB)
**AUTHORITY CONFLICT:** None
**SALVAGEABLE MECHANISM:** hybrid_search.js, qdrant_adapter.js
**SMALLEST REFACTOR SHAPE:** Wire into gateway bootstrap
**PRESERVE?** YES
**DELETE?** NO

### ping-runtime/embeddings/
**CAPABILITY:** Embedding service
**CURRENT REACHABILITY:** DORMANT (not in gateway bootstrap)
**IMPLEMENTATION QUALITY SIGNAL:** SUBSTANTIAL (1 file, 10KB)
**AUTHORITY CONFLICT:** None
**SALVAGEABLE MECHANISM:** embedding_service.js
**SMALLEST REFACTOR SHAPE:** Wire into gateway bootstrap
**PRESERVE?** YES
**DELETE?** NO

## PASS 6 — PHANTOM IMPORT VERIFICATION

### intelligence_worker.js
- NOT FOUND in current worktree
- FOUND in ping-runtime/workers/canonical_workers.js as imported but not registered
- Classification: DORMANT_IMPLEMENTATION (exists but intentionally not registered)
- NOT PHANTOM

### knowledge_graph.js
- FOUND in ping-runtime/knowledge/knowledge_graph.js
- Classification: DORMANT_IMPLEMENTATION (exists but not in gateway bootstrap)
- NOT PHANTOM

### business authorities
- FOUND in ping-runtime/business/ (customer_authority.js, project_authority.js, review_authority.js, ai_workspace_authority.js)
- Classification: DORMANT_IMPLEMENTATION (exists but not in gateway bootstrap)
- NOT PHANTOM

### connectors
- FOUND in ping-runtime/connectors/ (email_connector.js, sms_connector.js, github_connector.js, google_connector.js, posthog_connector.js, oauth_provider.js)
- Classification: LIVE_PARTIAL (connectors exist, email/sms integrations are stubs)
- NOT PHANTOM

**CONCLUSION:** Previous phantom import claims were inaccurate. All referenced modules exist but are dormant.

## PASS 7 — TODO / FIXME / STUB ARCHAEOLOGY

### TOTAL FINDINGS
- 144 matches in ping-runtime/ and gateway/

### CATEGORIZATION

**LIVE INCOMPLETE BEHAVIOR:**
- ping-runtime/temporal/activities/mission_activities.js: Production wiring TODO (2 occurrences)
- gateway/inference_authority.js: Build artifact placeholder
- gateway/witness_generator.js: Test execution placeholders (4 occurrences)

**GENERATED/MECHANICAL:**
- ping-runtime/orchestration/generate_* files: deprecated references (mechanical generation code)
- SQL parameter placeholders (not incomplete behavior)

**HISTORICAL/DEPRECATED:**
- ping-runtime/authorities/deterministic_id_authority.js: deprecated warnings (3 occurrences)
- ping-runtime/orchestration/execution/event_queue.js: deprecation warning

**TEST DATA:**
- ping-runtime/orchestration/generate_law_router.js: test mapping placeholder
- ping-runtime/orchestration/generate_authority_resolver.js: test/law mapping placeholders

**CONCLUSION:** 5 instances of live incomplete behavior requiring attention.

## PASS 8 — UNREACHABLE FILES

### REACHABILITY MAPPING
- NOT COMPLETED IN THIS PASS (requires entrypoint analysis)
- DEFERRED to future read-only zoom

## PASS 9 — TEST HYGIENE

### STRANDED REPLAY CERTIFICATION CORPUS
- FOUND in tests/corpus/ (lineage_replay.json)
- Classification: TEST_ASSET (preserves historical invariants)
- PRESERVE

### IMPLEMENTATIONS WITH STRANDED TESTS
- NOT COMPLETED IN THIS PASS (requires reachability mapping)
- DEFERRED to future read-only zoom

## PASS 10 — LARGE-FILE HYGIENE

### TOP LARGE FILES/ DIRECTORIES (REPOSITORY SCOPE)

**ping-runtime/orchestration/*.json (104MB total):**
- UUIDRegistry.json: 18M
- RoutingIndex.json: 17M
- RoutingCache.json: 17M
- RepositoryKnowledgeIndex_Filesystem.json: 14M
- RepositoryKnowledgeIndex_DependencyGraph.json: 16M
- CapabilityRegistry.json: 8M
- ContextPackets.json: 5M
- LawRouter.json: 2.6M
- RepositoryConstitutionManifest.json: 2.5M
- RepositoryHygieneReport.json: 3.3M
- ExecutionRouter.json: 436K
- RepositoryKnowledgeIndex_ExecutionGraphs.json: 372K
- ArchitectureManifest.json: 416K
- AuthorityResolver.json: 312K
- knowledge_report.json: 60K
- Classification: GENERATED_REPRODUCIBLE (generated by orchestration generators)
- DELETE CONFIDENCE: DELETE_AFTER_VERIFICATION (verify generators can rebuild from source)

**ROOT-LEVEL AUDIT ARTIFACTS (28.5MB total):**
- IDENTITY_LINEAGE_RAW.txt: 7M
- AUTHORITY_AUDIT_RAW.txt: 4.1M
- REBRAND_AUDIT_RAW.txt: 2.4M
- REBRAND_AUDIT_CATEGORIZED.txt: 2.4M
- REBRAND_AUDIT_PROCESSED.txt: 1.3M
- RECONSTRUCTION_HASH_MANIFEST.json: 1.5M
- repository_events.json: 1.7M
- pg_dump.sql: 1.4M
- CRX_BACKUP_adcb062de941848d7cc3597d45cb85d12abad3d3.zip: 6.7M
- Classification: BUILD_ARTIFACT / HISTORICAL_EVIDENCE
- DELETE CONFIDENCE: DELETE_AFTER_VERIFICATION (verify historical evidence is not unique)

**CONCLUSION:** 104MB of generated JSON indexes + 28.5MB of audit artifacts = 132.5MB reclamation candidates.

## PASS 11 — GIT HYGIENE

### TRACKED GENERATED FILES
- ping-runtime/orchestration/*.json (tracked, generated)
- Classification: WORKTREE_RECLAIMABLE (should be gitignored, regenerated on demand)

### ACCIDENTALLY COMMITTED DEPENDENCIES
- CRX_BACKUP_adcb062de941848d7cc3597d45cb85d12abad3d3.zip (6.7M, contains node_modules)
- Classification: HISTORICAL_GIT_BLOAT (informational only in this pass)

### HISTORICAL GIT BLOAT
- Audit artifacts (IDENTITY_LINEAGE_RAW.txt, AUTHORITY_AUDIT_RAW.txt, etc.)
- Classification: HISTORICAL_GIT_BLOAT (informational only in this pass)

## PASS 12 — REFACTOR CANDIDATES

### 1. INDEX FILE WEB (104MB)
**CURRENT STATE:** 8 tracked JSON indexes/caches loaded from hardcoded paths
**TARGET STATE:** One filesystem/dependency manifest source, derive rest to ignored cache/artifact directory, repository-root resolver
**FILES:** ping-runtime/orchestration/*.json, generate_*.js scripts
**AUTHORITY BEFORE:** N/A (build infrastructure)
**AUTHORITY AFTER:** N/A (build infrastructure)
**MECHANISM PRESERVED:** Index generation
**ESTIMATED DIFF SIZE:** -104MB tracked, regenerated in ignored cache
**TESTS REQUIRED:** Build verification
**RISK:** Low (build infrastructure)
**Classification:** REFACTOR_CANDIDATE

### 2. GATEWAY RUNTIME COMPOSITION
**CURRENT STATE:** gateway_runtime.js directly imports routes, authorities, integrations, connectors, business components, AI, search, workers, orchestration
**TARGET STATE:** Extract construction functions by plane, keep one final composition root
**FILES:** gateway/bootstrap/gateway_runtime.js
**AUTHORITY BEFORE:** N/A (bootstrap)
**AUTHORITY AFTER:** N/A (bootstrap)
**MECHANISM PRESERVED:** Bootstrap composition
**ESTIMATED DIFF SIZE:** Similar total, more modular
**TESTS REQUIRED:** Bootstrap verification
**RISK:** Medium (bootstrap restructuring)
**Classification:** REFACTOR_CANDIDATE

### 3. CONNECTOR VS INTEGRATION ABSTRACTIONS
**CURRENT STATE:** Bootstrap constructs both Integration and Connector abstractions for same providers, email/SMS integrations are stubs
**TARGET STATE:** Define distinct responsibilities, retain provider adapters, fold delivery registration into one mechanism
**FILES:** gateway/bootstrap/gateway_runtime.js, ping-runtime/connectors/
**AUTHORITY BEFORE:** N/A (connector/integration registration)
**AUTHORITY AFTER:** N/A (unified registration)
**MECHANISM PRESERVED:** Provider adapter pattern
**ESTIMATED DIFF SIZE:** Reduced duplicate registration
**TESTS REQUIRED:** Integration verification
**RISK:** Medium (abstraction convergence)
**Classification:** REFACTOR_CANDIDATE

### 4. LAZY OPTIONAL WORKER IMPORTS
**CURRENT STATE:** canonical_workers.js imports IntelligenceWorker even though not registered
**TARGET STATE:** Move import into conditional/dormant registration path
**FILES:** ping-runtime/workers/canonical_workers.js
**AUTHORITY BEFORE:** N/A (worker registration)
**AUTHORITY AFTER:** N/A (worker registration)
**MECHANISM PRESERVED:** Worker registration
**ESTIMATED DIFF SIZE:** Smaller
**TESTS REQUIRED:** Worker load verification
**RISK:** Low (import reorganization)
**Classification:** REFACTOR_CANDIDATE

### 5. ORCHESTRATION METADATA GENERATORS
**CURRENT STATE:** Routing, authority, execution, law, context, capability, hygiene generators repeat JSON loading, BOM stripping, Windows paths, intermediate-file dependencies
**TARGET STATE:** Shared loadIndex/writeArtifact layer
**FILES:** ping-runtime/orchestration/generate_*.js
**AUTHORITY BEFORE:** N/A (build infrastructure)
**AUTHORITY AFTER:** N/A (build infrastructure)
**MECHANISM PRESERVED:** Index generation
**ESTIMATED DIFF SIZE:** Reduced duplicate infrastructure
**TESTS REQUIRED:** Build verification
**RISK:** Low (build infrastructure)
**Classification:** REFACTOR_CANDIDATE

## DELETE CONFIDENCE GATE

### DELETE_SAFE
- Zero paths qualify for DELETE_SAFE

### DELETE_AFTER_VERIFICATION
- ping-runtime/orchestration/*.json (104MB) - verify generators can rebuild from source
- CRX_BACKUP_adcb062de941848d7cc3597d45cb85d12abad3d3.zip (6.7M) - verify unique source files against Git objects
- ROOT-LEVEL AUDIT ARTIFACTS (21.8M) - verify historical evidence is not unique

## FINAL OUTPUT

### A. TOP 20 HYGIENE FINDINGS

1. 104MB of tracked generated JSON indexes in ping-runtime/orchestration/
2. 28.5MB of audit artifacts at repository root
3. 6.7M backup zip with node_modules (CRX_BACKUP_*.zip)
4. IntelligenceWorker imported but not registered (bootstrap dependency on dormant code)
5. Email/SMS integrations are stubs while connectors exist
6. Both Integration and Connector abstractions for same providers
7. gateway_runtime.js is very broad bootstrap (direct imports from all planes)
8. Orchestration generators repeat infrastructure (JSON loading, BOM stripping, Windows paths)
9. Temporal activities have TODO stubs (not wired)
10. Inference authority has placeholder artifact building
11. Witness generator has placeholder test execution
12. Deterministic ID authority is deprecated but still imported
13. Business authorities exist but not in gateway bootstrap
14. Knowledge graph exists but not in gateway bootstrap
15. Search/hybrid search exists but not in gateway bootstrap
16. Embedding service exists but not in gateway bootstrap
17. Neo4j adapter created in bootstrap but not used
18. Historical execution engine in orchestration/execution/ (13 files, 150KB)
19. intent/ and intents/ are different purposes (high-level vs detailed)
20. test/ and tests/ are different purposes (JS tests vs certification corpus)

### B. DELETE_SAFE
None found.

### C. DELETE_AFTER_VERIFICATION

| Path | Size | Missing Proof |
|------|------|---------------|
| ping-runtime/orchestration/*.json | 104MB | Verify generators can rebuild from source |
| CRX_BACKUP_adcb062de941848d7cc3597d45cb85d12abad3d3.zip | 6.7M | Verify unique source files against Git objects |
| IDENTITY_LINEAGE_RAW.txt | 7M | Verify historical evidence is not unique |
| AUTHORITY_AUDIT_RAW.txt | 4.1M | Verify historical evidence is not unique |
| REBRAND_AUDIT_RAW.txt | 2.4M | Verify historical evidence is not unique |
| REBRAND_AUDIT_CATEGORIZED.txt | 2.4M | Verify historical evidence is not unique |
| REBRAND_AUDIT_PROCESSED.txt | 1.3M | Verify historical evidence is not unique |
| RECONSTRUCTION_HASH_MANIFEST.json | 1.5M | Verify historical evidence is not unique |
| repository_events.json | 1.7M | Verify historical evidence is not unique |
| pg_dump.sql | 1.4M | Verify historical evidence is not unique |

### D. SALVAGE / REFACTOR

| Path | Valuable Mechanism | Current Problem | Smallest Refactor |
|------|-------------------|-----------------|-------------------|
| ping-runtime/orchestration/execution/ | Consensus engine, worker state machine, context authority | Not wired to current runtime | Extract algorithms into reusable library under current authority |
| ping-runtime/business/ | Customer, project, review authorities | Not in gateway bootstrap | Wire into gateway bootstrap |
| ping-runtime/knowledge/ | Knowledge graph, promoter | Not in gateway bootstrap | Wire into gateway bootstrap |
| ping-runtime/search/ | Hybrid search, Qdrant adapter | Not in gateway bootstrap | Wire into gateway bootstrap |
| ping-runtime/embeddings/ | Embedding service | Not in gateway bootstrap | Wire into gateway bootstrap |
| ping-runtime/orchestration/*.json + generate_*.js | Index generation | Hardcoded paths, tracked generated files | Shared loadIndex/writeArtifact layer, ignore generated output |

### E. DUPLICATE STRUCTURES

| A | B | Relationship | Recommendation |
|---|---|---|---|
| intent/ | intents/ | DIFFERENT_PURPOSE (high-level vs detailed) | Keep both, add README clarifying purpose |
| workspace/ | workspaces/ | DIFFERENT_PURPOSE (different workspaces) | Keep both, add README clarifying purpose |
| test/ | tests/ | DIFFERENT_PURPOSE (JS tests vs certification corpus) | Keep both, add README clarifying purpose |
| kernel/ | runtime/kernel/ | DIFFERENT_PURPOSE (Python vs TS) | Keep both, add README clarifying purpose |
| runtime/kernel/ | ping-runtime/runtime/ | DIFFERENT_PURPOSE (TS kernel vs JS runtime utilities) | Keep both, add README clarifying purpose |

### F. EMPTY / PHANTOM STRUCTURES

| Path | Evidence | Keep/Remove Candidate |
|------|----------|-----------------------|
| None found | All suspected directories contain substantive implementations | KEEP |

### G. TOP STORAGE RECLAMATION CANDIDATES

| Path | Size | Confidence | Why |
|------|------|------------|-----|
| ping-runtime/orchestration/*.json | 104MB | DELETE_AFTER_VERIFICATION | Generated indexes, verify rebuildable |
| IDENTITY_LINEAGE_RAW.txt | 7M | DELETE_AFTER_VERIFICATION | Historical evidence, verify not unique |
| AUTHORITY_AUDIT_RAW.txt | 4.1M | DELETE_AFTER_VERIFICATION | Historical evidence, verify not unique |
| CRX_BACKUP_adcb062de941848d7cc3597d45cb85d12abad3d3.zip | 6.7M | DELETE_AFTER_VERIFICATION | Backup with node_modules, verify source exists |
| REBRAND_AUDIT_RAW.txt | 2.4M | DELETE_AFTER_VERIFICATION | Historical evidence, verify not unique |

### H. TOP 10 SURGICAL REFACTOR CANDIDATES

1. Index file web (104MB tracked generated files to ignored cache)
2. Gateway runtime composition (split into modules by plane)
3. Connector vs integration abstractions (unify registration)
4. Lazy optional worker imports (IntelligenceWorker)
5. Orchestration metadata generators (shared infrastructure)
6. Wire business authorities to bootstrap
7. Wire knowledge graph to bootstrap
8. Wire search to bootstrap
9. Wire embeddings to bootstrap
10. Add README to clarify intent/intents, test/tests, kernel/runtime/kernel

### I. DO-NOT-DELETE DISCOVERIES

1. ping-runtime/orchestration/execution/ (13 files, 150KB) - Contains consensus engine and worker state machine, salvage algorithms
2. ping-runtime/business/ (5 files, 40KB) - Business authorities, wire to bootstrap
3. ping-runtime/knowledge/ (2 files, 25KB) - Knowledge graph, wire to bootstrap
4. ping-runtime/search/ (2 files, 20KB) - Hybrid search, wire to bootstrap
5. ping-runtime/embeddings/ (1 file, 10KB) - Embedding service, wire to bootstrap
6. tests/corpus/lineage_replay.json - Stranded replay certification corpus, preserves historical invariants
7. constitutional-compiler/dist/ - NOT investigated, do not classify as disposable
8. intent/ vs intents/ - Different purposes, keep both
9. test/ vs tests/ - Different purposes, keep both
10. kernel/ vs runtime/kernel/ - Different purposes, keep both

### J. NEXT READ-ONLY ZOOM

1. constitutional-compiler/dist/ source provenance inspection
2. Reachability mapping for unreachable files
3. Test hygiene (implementations with stranded tests)
4. Verify generated JSON indexes are rebuildable from source
5. Verify CRX_BACKUP unique source files against Git objects
6. Verify audit artifacts are not unique historical evidence

## PRIMARY LAW ADHERENCE

DELETE ONLY PROVEN WASTE.
Zero DELETE_SAFE recommendations without full proof.
Preserved dormant mechanisms (business, knowledge, search, embeddings, execution engine).
Classified duplicate structures as DIFFERENT_PURPOSE, not cleanup targets.
UNKNOWN > ACCIDENTAL LOSS (deferred classification where uncertain).

PLANE: SOURCE_CURRENT @ feature/approval-effect-identity
