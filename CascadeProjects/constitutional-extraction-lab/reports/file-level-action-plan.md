# File-Level Action Plan

## CRX Runtime Files

**server.ts**
- **ACTION:** KEEP
- **REASON:** Bootstrap entrypoint, required for runtime
- **MODIFY:** Move to runtime/orchestration/, decouple from Express using adapter pattern
- **RISK:** MEDIUM

**commit_controller.ts**
- **ACTION:** KEEP
- **REASON:** HTTP controller for artifact commits, required for runtime
- **MODIFY:** Extract pure functions to kernel/, keep orchestration in runtime/
- **RISK:** MEDIUM

**audit_controller.ts**
- **ACTION:** KEEP
- **REASON:** HTTP controller for artifact queries, required for runtime
- **MODIFY:** Extract pure functions to kernel/, keep orchestration in runtime/
- **RISK:** MEDIUM

**canonical_engine.ts**
- **ACTION:** KEEP
- **REASON:** Foundational kernel seed, pure function
- **MODIFY:** Extend with domain separation from canonical_fingerprint_service.js
- **RISK:** LOW

**identity_engine.ts**
- **ACTION:** KEEP
- **REASON:** Foundational kernel seed, pure function
- **MODIFY:** Extend with domain separation from canonical_fingerprint_service.js
- **RISK:** LOW

**dag_validator.ts**
- **ACTION:** KEEP
- **REASON:** Foundational kernel seed, pure function
- **MODIFY:** Extend with full cycle detection from formal_invariant_graph_verifier.js
- **RISK:** MEDIUM

**artifact_store.ts**
- **ACTION:** KEEP
- **REASON:** Persistence adapter for artifacts
- **MODIFY:** Move to adapters/persistence/, implement persistence_adapter interface
- **RISK:** MEDIUM

**lineage_store.ts**
- **ACTION:** KEEP
- **REASON:** Persistence adapter for lineage
- **MODIFY:** Move to adapters/persistence/, implement persistence_adapter interface
- **RISK:** MEDIUM

**event_log.ts**
- **ACTION:** KEEP
- **REASON:** Persistence adapter for events
- **MODIFY:** Move to adapters/persistence/, implement persistence_adapter interface, add event envelope support
- **RISK:** HIGH

**db.ts**
- **ACTION:** KEEP
- **REASON:** PostgreSQL pool singleton
- **MODIFY:** Move to adapters/persistence/postgres_adapter.ts, implement persistence_adapter interface
- **RISK:** MEDIUM

**logger.ts**
- **ACTION:** KEEP
- **REASON:** Logging utility
- **MODIFY:** Move to adapters/observability/, implement observability_adapter interface
- **RISK:** LOW

**ledger_schema.sql**
- **ACTION:** KEEP
- **REASON:** Database schema
- **MODIFY:** Add event envelope column, add transcript column, add state column
- **RISK:** HIGH

---

## Legacy Files (JS.txt)

**formal_invariant_graph_verifier.js**
- **ACTION:** EXTRACT
- **REASON:** Full DAG verification system, extends dag_validator.ts
- **TARGET:** kernel/lineage/formal_invariant_graph_verifier.ts
- **RISK:** LOW

**canonical_fingerprint_service.js**
- **ACTION:** EXTRACT
- **REASON:** Domain separation, fingerprint verification, extends canonical_engine.ts and identity_engine.ts
- **TARGET:** kernel/canonical/canonical_engine.ts (extend), kernel/identity/identity_engine.ts (extend)
- **RISK:** LOW

**deterministic_replay_harness.js**
- **ACTION:** EXTRACT
- **REASON:** Entire replay system, critical for constitutional compliance
- **TARGET:** kernel/replay/replay_engine.ts
- **RISK:** HIGH

**execution_integrity_auditor.js**
- **ACTION:** EXTRACT
- **REASON:** Execution integrity auditing, critical for replay verification
- **TARGET:** kernel/witness/execution_auditor.ts
- **RISK:** MEDIUM

**structural_graph_builder.js**
- **ACTION:** EXTRACT
- **REASON:** Structural graph building, critical for lineage analysis
- **TARGET:** kernel/lineage/graph_builder.ts
- **RISK:** MEDIUM

**authority_boundary_prover.js**
- **ACTION:** EXTRACT
- **REASON:** Authority boundary proving, critical for constitutional compliance
- **TARGET:** kernel/authority/authority_prover.ts
- **RISK:** LOW

**snapshot_lineage_integrity_guard.js**
- **ACTION:** EXTRACT
- **REASON:** Snapshot lineage integrity guarding, critical for replay verification
- **TARGET:** kernel/witness/snapshot_guard.ts
- **RISK:** MEDIUM

**structural_identity_stability_test_suite.js**
- **ACTION:** EXTRACT
- **REASON:** Structural identity stability testing, critical for replay stability
- **TARGET:** kernel/tests/stability_test.ts
- **RISK:** LOW

**Merkle anchor files**
- **ACTION:** QUARANTINE
- **REASON:** Not applicable to CRX runtime (educational-specific)
- **TARGET:** temporary/quarantine/merkle_anchor/
- **RISK:** NONE

**Plugin system files**
- **ACTION:** QUARANTINE
- **REASON:** Not applicable to CRX runtime (no plugin system)
- **TARGET:** temporary/quarantine/plugin_system/
- **RISK:** NONE

**Adversarial testing files**
- **ACTION:** QUARANTINE
- **REASON:** Not immediately applicable (security testing)
- **TARGET:** temporary/quarantine/adversarial/
- **RISK:** NONE

---

## Legacy Schema Files

**audit-event.schema.json**
- **ACTION:** EXTRACT
- **REASON:** Event envelope structure, critical for replay
- **TARGET:** kernel/event/event_schema.ts
- **RISK:** LOW

**claim.schema.json**
- **ACTION:** QUARANTINE
- **REASON:** Not immediately applicable (UCIA-specific)
- **TARGET:** temporary/quarantine/ucia_schemas/
- **RISK:** NONE

**decision.schema.json**
- **ACTION:** QUARANTINE
- **REASON:** Not immediately applicable (UCIA-specific)
- **TARGET:** temporary/quarantine/ucia_schemas/
- **RISK:** NONE

---

## Legacy Architecture Files (MCP0.txt)

**MCP0.txt**
- **ACTION:** KEEP
- **REASON:** Architectural reference for future expansion
- **MODIFY:** None (reference only)
- **RISK:** NONE

---

## Infrastructure Files

**agents/docker-compose.yml**
- **ACTION:** DELETE
- **REASON:** Broken, references missing directories
- **TARGET:** None
- **RISK:** NONE

**agents/requirements.txt**
- **ACTION:** KEEP
- **REASON:** Python dependencies for agents
- **MODIFY:** None
- **RISK:** NONE

**agents/crx_workspace_indexer.py**
- **ACTION:** KEEP
- **REASON:** Workspace indexing utility
- **MODIFY:** None
- **RISK:** NONE

---

## New Files to Create

**kernel/canonical/canonical_engine.ts** (extend existing)
- Extend with domain separation
- Add error handling
- Add fingerprint verification
- Add schema versioning

**kernel/identity/identity_engine.ts** (extend existing)
- Extend with domain separation
- Add fingerprint verification
- Add algorithm specification
- Add hash verification

**kernel/lineage/dag_validator.ts** (extend existing)
- Extend with full cycle detection
- Add required edge verification
- Add forbidden edge detection
- Add graph fingerprinting
- Add domain transition enforcement

**kernel/lineage/graph_builder.ts** (new)
- Extract from structural_graph_builder.js
- Implement structural graph building
- Implement graph traversal
- Implement ancestry validation

**kernel/replay/replay_engine.ts** (new)
- Extract from deterministic_replay_harness.js
- Implement deterministic event ordering
- Implement event fingerprint verification
- Implement state reconstruction
- Implement transcript generation
- Implement replay fingerprinting
- Implement replay verification

**kernel/replay/state_rebuilder.ts** (new)
- Create from replay system
- Implement state reconstruction from events
- Implement state verification

**kernel/replay/transcript_generator.ts** (new)
- Create from replay system
- Implement transcript generation
- Implement transcript verification

**kernel/witness/execution_auditor.ts** (new)
- Extract from execution_integrity_auditor.js
- Implement execution integrity auditing
- Implement divergence detection
- Implement integrity verification

**kernel/witness/snapshot_guard.ts** (new)
- Extract from snapshot_lineage_integrity_guard.js
- Implement snapshot lineage integrity guarding
- Implement snapshot verification
- Implement lineage integrity checks

**kernel/constitution/formal_invariant_graph_verifier.ts** (new)
- Extract from formal_invariant_graph_verifier.js
- Implement invariant graph verification
- Implement required edge verification
- Implement forbidden edge detection
- Implement cycle detection
- Implement graph fingerprinting

**kernel/event/event_schema.ts** (new)
- Extract from audit-event.schema.json
- Define event envelope interfaces
- Define actor interfaces
- Define lineage interfaces
- Define policy version interfaces

**kernel/event/event_validator.ts** (new)
- Create from event_schema.ts
- Implement event envelope validation
- Implement event fingerprint verification
- Implement event schema validation

**kernel/authority/authority_prover.ts** (new)
- Extract from authority_boundary_prover.js
- Implement authority boundary proving
- Implement authority verification
- Implement boundary enforcement

**kernel/tests/stability_test.ts** (new)
- Extract from structural_identity_stability_test_suite.js
- Implement structural identity stability testing
- Implement stability verification
- Implement stability checks

**adapters/persistence/persistence_adapter.ts** (new)
- Create persistence adapter interface
- Define persistence operations
- Define storage verification operations

**adapters/persistence/postgres_adapter.ts** (new)
- Implement persistence adapter interface for PostgreSQL
- Move db.ts logic here
- Implement storage verification

**adapters/transport/transport_adapter.ts** (new)
- Create transport adapter interface
- Define transport operations

**adapters/transport/http_adapter.ts** (new)
- Implement transport adapter interface for HTTP
- Move Express logic here

**adapters/observability/observability_adapter.ts** (new)
- Create observability adapter interface
- Define observability operations

**adapters/observability/pino_adapter.ts** (new)
- Implement observability adapter interface for Pino
- Move logger.ts logic here

**infra/docker-compose.yml** (new)
- Create canonical Docker Compose file
- Define PostgreSQL service
- Define commit-service service
- Define environment configuration

**infra/.env.example** (new)
- Create canonical environment configuration
- Document all environment variables
- Add environment variable validation

**infra/README.md** (new)
- Create infrastructure documentation
- Document deployment process
- Document environment setup

---

## Action Summary

**KEEP:** 14 files
- server.ts, commit_controller.ts, audit_controller.ts, canonical_engine.ts, identity_engine.ts, dag_validator.ts, artifact_store.ts, lineage_store.ts, event_log.ts, db.ts, logger.ts, ledger_schema.sql, agents/requirements.txt, agents/crx_workspace_indexer.py, MCP0.txt

**DELETE:** 1 file
- agents/docker-compose.yml

**EXTRACT:** 8 files
- formal_invariant_graph_verifier.js, canonical_fingerprint_service.js, deterministic_replay_harness.js, execution_integrity_auditor.js, structural_graph_builder.js, authority_boundary_prover.js, snapshot_lineage_integrity_guard.js, structural_identity_stability_test_suite.js, audit-event.schema.json

**QUARANTINE:** 3 file groups
- Merkle anchor files, Plugin system files, Adversarial testing files, UCIA schemas

**MODIFY:** 11 files
- server.ts, commit_controller.ts, audit_controller.ts, canonical_engine.ts, identity_engine.ts, dag_validator.ts, artifact_store.ts, lineage_store.ts, event_log.ts, db.ts, logger.ts, ledger_schema.sql

**CREATE:** 18 files
- kernel/canonical/canonical_engine.ts (extend), kernel/identity/identity_engine.ts (extend), kernel/lineage/dag_validator.ts (extend), kernel/lineage/graph_builder.ts, kernel/replay/replay_engine.ts, kernel/replay/state_rebuilder.ts, kernel/replay/transcript_generator.ts, kernel/witness/execution_auditor.ts, kernel/witness/snapshot_guard.ts, kernel/constitution/formal_invariant_graph_verifier.ts, kernel/event/event_schema.ts, kernel/event/event_validator.ts, kernel/authority/authority_prover.ts, kernel/tests/stability_test.ts, adapters/persistence/persistence_adapter.ts, adapters/persistence/postgres_adapter.ts, adapters/transport/transport_adapter.ts, adapters/transport/http_adapter.ts, adapters/observability/observability_adapter.ts, adapters/observability/pino_adapter.ts, infra/docker-compose.yml, infra/.env.example, infra/README.md

---

## Migration Order

**PHASE 1: Extend Foundational Kernel Seeds**
1. Extend canonical_engine.ts with domain separation
2. Extend identity_engine.ts with domain separation
3. Extend dag_validator.ts with full cycle detection

**PHASE 2: Create New Kernel Authorities**
4. Create event_schema.ts from audit-event.schema.json
5. Create event_validator.ts from event_schema.ts
6. Create replay_engine.ts from deterministic_replay_harness.js
7. Create state_rebuilder.ts from replay system
8. Create transcript_generator.ts from replay system

**PHASE 3: Create Witness Authorities**
9. Create execution_auditor.ts from execution_integrity_auditor.js
10. Create snapshot_guard.ts from snapshot_lineage_integrity_guard.ts

**PHASE 4: Create Lineage Authorities**
11. Create graph_builder.ts from structural_graph_builder.js
12. Create formal_invariant_graph_verifier.ts from formal_invariant_graph_verifier.js

**PHASE 5: Create Authority Authorities**
13. Create authority_prover.ts from authority_boundary_prover.js

**PHASE 6: Create Test Authorities**
14. Create stability_test.ts from structural_identity_stability_test_suite.js

**PHASE 7: Create Adapter Layer**
15. Create persistence_adapter.ts interface
16. Create postgres_adapter.ts implementation
17. Create transport_adapter.ts interface
18. Create http_adapter.ts implementation
19. Create observability_adapter.ts interface
20. Create pino_adapter.ts implementation

**PHASE 8: Restructure Runtime**
21. Move server.ts to runtime/orchestration/
22. Move commit_controller.ts to runtime/execution/
23. Move audit_controller.ts to runtime/execution/
24. Move artifact_store.ts to adapters/persistence/
25. Move lineage_store.ts to adapters/persistence/
26. Move event_log.ts to adapters/persistence/
27. Move db.ts to adapters/persistence/postgres_adapter.ts
28. Move logger.ts to adapters/observability/pino_adapter.ts

**PHASE 9: Update Database Schema**
29. Update ledger_schema.sql with event envelope column
30. Update ledger_schema.sql with transcript column
31. Update ledger_schema.sql with state column

**PHASE 10: Create Canonical Infrastructure**
32. Create infra/docker-compose.yml
33. Create infra/.env.example
34. Create infra/README.md

**PHASE 11: Clean Up**
35. Delete agents/docker-compose.yml
36. Quarantine Merkle anchor files
37. Quarantine Plugin system files
38. Quarantine Adversarial testing files
39. Quarantine UCIA schemas

**PHASE 12: Update Documentation**
40. Update all imports
41. Update package.json scripts
42. Update README.md
43. Update documentation

---

## Risk Assessment

**LOW RISK:** 15 actions
- Extend canonical_engine.ts, Extend identity_engine.ts, Extract formal_invariant_graph_verifier.js, Extract canonical_fingerprint_service.js, Extract authority_boundary_prover.js, Extract structural_identity_stability_test_suite.js, Extract audit-event.schema.json, Create event_schema.ts, Create authority_prover.ts, Create stability_test.ts, Create persistence_adapter.ts, Create transport_adapter.ts, Create observability_adapter.ts, Move logger.ts, Delete agents/docker-compose.yml, Quarantine files

**MEDIUM RISK:** 18 actions
- Extend dag_validator.ts, Create event_validator.ts, Create replay_engine.ts, Create state_rebuilder.ts, Create transcript_generator.ts, Create execution_auditor.ts, Create snapshot_guard.ts, Create graph_builder.ts, Create formal_invariant_graph_verifier.ts, Create postgres_adapter.ts, Create http_adapter.ts, Create pino_adapter.ts, Move server.ts, Move commit_controller.ts, Move audit_controller.ts, Move artifact_store.ts, Move lineage_store.ts, Move event_log.ts

**HIGH RISK:** 6 actions
- Move db.ts, Move logger.ts, Update ledger_schema.sql, Create infra/docker-compose.yml, Create infra/.env.example, Create infra/README.md

**TOTAL ACTIONS:** 39

**LOW RISK:** 15/39 (38%)
**MEDIUM RISK:** 18/39 (46%)
**HIGH RISK:** 6/39 (16%)
