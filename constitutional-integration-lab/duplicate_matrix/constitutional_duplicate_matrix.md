# Constitutional Duplicate Matrix

**Generated:** 2026-06-06
**Primary Authority:** AGENT.md
**Lab Workspace:** `C:\Users\nolan\constitutional-integration-lab\`
**CRX Status:** READ-ONLY (untouched)

---

## Competing Event Schemas

| CANONICAL_AUTHORITY | DUPLICATE_AUTHORITY | STRONGER_IMPLEMENTATION | REUSE_TARGET | MERGE_TARGET | QUARANTINE_TARGET | RISK |
|---------------------|---------------------|------------------------|-------------|-------------|------------------|------|
| audit-event.schema.json (vos/cos/schema/) | claim.schema.json (knowledge/authoritative/) | audit-event.schema.json (more complete event structure) | audit-event.schema.json | claim.schema.json | claim.schema.json (UCIA-specific) | LOW |
| audit-event.schema.json (vos/cos/schema/) | decision.schema.json (knowledge/authoritative/) | audit-event.schema.json (more complete event structure) | audit-event.schema.json | decision.schema.json | decision.schema.json (UCIA-specific) | LOW |
| audit-event.schema.json (vos/cos/schema/) | argument-graph.schema.json (vos/cos/schema/) | audit-event.schema.json (more complete event structure) | audit-event.schema.json | argument-graph.schema.json | argument-graph.schema.json (domain-specific) | LOW |

**EVIDENCE:**
- audit-event.schema.json: Has id, timestamp, actor, action, artifactType, artifactId, lineage, policyVersion
- claim.schema.json: Has claim_id, proposer, scope, assertion, evidence_refs, requested_authority, risk_level, status
- decision.schema.json: Has decision_id, review_authority, claim_id, outcome, justification, accepted_claims, rejected_claims
- argument-graph.schema.json: Has nodes, edges, metadata

**CONFLICT:** None - different event domains (audit vs UCIA vs argument)

---

## Competing Replay Semantics

| CANONICAL_AUTHORITY | DUPLICATE_AUTHORITY | STRONGER_IMPLEMENTATION | REUSE_TARGET | MERGE_TARGET | QUARANTINE_TARGET | RISK |
|---------------------|---------------------|------------------------|-------------|-------------|------------------|------|
| deterministic_replay_harness.js (JS.txt) | None (CRX has no replay) | deterministic_replay_harness.js (only implementation) | deterministic_replay_harness.js | None | None | HIGH |

**EVIDENCE:**
- deterministic_replay_harness.js: Has full replay system with deterministic ordering, fingerprint verification, state reconstruction, transcript generation
- CRX runtime: Has no replay capability

**CONFLICT:** None - CRX has no replay system

---

## Competing Fingerprint Systems

| CANONICAL_AUTHORITY | DUPLICATE_AUTHORITY | STRONGER_IMPLEMENTATION | REUSE_TARGET | MERGE_TARGET | QUARANTINE_TARGET | RISK |
|---------------------|---------------------|------------------------|-------------|-------------|------------------|------|
| canonical_fingerprint_service.js (JS.txt) | identity_engine.ts (CRX) | canonical_fingerprint_service.js (has domain separation, verification) | canonical_fingerprint_service.js | identity_engine.ts | None | HIGH |
| canonical_fingerprint_service.js (JS.txt) | canonical_engine.ts (CRX) | canonical_fingerprint_service.js (has domain separation, error handling) | canonical_fingerprint_service.js | canonical_engine.ts | None | HIGH |

**EVIDENCE:**
- canonical_fingerprint_service.js: Has domain separation, hash verification, algorithm specification, schema version, error handling, circular reference detection
- identity_engine.ts: Has SHA-256 hashing, canonicalization, JSON serialization, hex output (no domain separation, no verification)
- canonical_engine.ts: Has recursive key sorting, array canonicalization (no domain separation, no error handling)

**CONFLICT:** CRITICAL - CRX implementations lack domain separation and verification

---

## Competing Validators

| CANONICAL_AUTHORITY | DUPLICATE_AUTHORITY | STRONGER_IMPLEMENTATION | REUSE_TARGET | MERGE_TARGET | QUARANTINE_TARGET | RISK |
|---------------------|---------------------|------------------------|-------------|-------------|------------------|------|
| formal_invariant_graph_verifier.js (JS.txt) | dag_validator.ts (CRX) | formal_invariant_graph_verifier.js (has full cycle detection, graph fingerprinting) | formal_invariant_graph_verifier.js | dag_validator.ts | None | CRITICAL |
| execution_integrity_auditor.js (JS.txt) | None (CRX has no execution integrity auditor) | execution_integrity_auditor.js (only implementation) | execution_integrity_auditor.js | None | None | HIGH |
| plugin_contract_validator.js (JS.txt) | None (CRX has no plugin system) | plugin_contract_validator.js (plugin-specific) | plugin_contract_validator.js | None | plugin_contract_validator.js (plugin-specific) | LOW |
| merkle_anchor_chain_validator.js (JS.txt) | None (CRX has no merkle anchor system) | merkle_anchor_chain_validator.js (merkle-specific) | merkle_anchor_chain_validator.js | None | merkle_anchor_chain_validator.js (merkle-specific) | LOW |

**EVIDENCE:**
- formal_invariant_graph_verifier.js: Has full cycle detection (DFS-based), required edge verification, forbidden edge detection, graph fingerprinting
- dag_validator.ts: Has direct self-loop detection, duplicate parent detection (no indirect cycle detection, no graph fingerprinting)
- execution_integrity_auditor.js: Has snapshot verification, scheduler binding validation, execution ID recomputation, artifact fingerprint verification
- CRX runtime: Has no execution integrity auditor

**CONFLICT:** CRITICAL - dag_validator.ts lacks full cycle detection and graph fingerprinting

---

## Competing Lineage Models

| CANONICAL_AUTHORITY | DUPLICATE_AUTHORITY | STRONGER_IMPLEMENTATION | REUSE_TARGET | MERGE_TARGET | QUARANTINE_TARGET | RISK |
|---------------------|---------------------|------------------------|-------------|-------------|------------------|------|
| structural_graph_builder.js (JS.txt) | None (CRX has no structural graph builder) | structural_graph_builder.js (only implementation) | structural_graph_builder.js | None | None | MEDIUM |
| formal_invariant_graph_verifier.js (JS.txt) | dag_validator.ts (CRX) | formal_invariant_graph_verifier.js (has full lineage validation) | formal_invariant_graph_verifier.js | dag_validator.ts | None | CRITICAL |
| snapshot_lineage_integrity_guard.js (JS.txt) | None (CRX has no snapshot lineage guard) | snapshot_lineage_integrity_guard.js (only implementation) | snapshot_lineage_integrity_guard.js | None | None | MEDIUM |

**EVIDENCE:**
- structural_graph_builder.js: Has deterministic node generation, domain-separated node identity, span validation, acyclic structure enforcement
- formal_invariant_graph_verifier.js: Has full cycle detection, required edge verification, forbidden edge detection, graph fingerprinting
- dag_validator.ts: Has direct self-loop detection, duplicate parent detection (no indirect cycle detection, no graph fingerprinting)
- CRX runtime: Has no structural graph builder, no snapshot lineage guard

**CONFLICT:** CRITICAL - dag_validator.ts lacks full lineage validation

---

## Competing Persistence Contracts

| CANONICAL_AUTHORITY | DUPLICATE_AUTHORITY | STRONGER_IMPLEMENTATION | REUSE_TARGET | MERGE_TARGET | QUARANTINE_TARGET | RISK |
|---------------------|---------------------|------------------------|-------------|-------------|------------------|------|
| artifact_store.ts (CRX) | None (JS.txt has no persistence) | artifact_store.ts (only implementation) | artifact_store.ts | None | None | LOW |
| lineage_store.ts (CRX) | None (JS.txt has no persistence) | lineage_store.ts (only implementation) | lineage_store.ts | None | None | LOW |
| ledger_schema.sql (CRX) | None (JS.txt has no persistence) | ledger_schema.sql (only implementation) | ledger_schema.sql | None | None | LOW |

**EVIDENCE:**
- artifact_store.ts: Has artifact persistence with PostgreSQL
- lineage_store.ts: Has lineage persistence with PostgreSQL
- ledger_schema.sql: Has database schema for artifacts, lineage_edges, execution_events
- JS.txt: Has no persistence modules (all modules are pure functions)

**CONFLICT:** None - JS.txt has no persistence modules

---

## Competing Audit Systems

| CANONICAL_AUTHORITY | DUPLICATE_AUTHORITY | STRONGER_IMPLEMENTATION | REUSE_TARGET | MERGE_TARGET | QUARANTINE_TARGET | RISK |
|---------------------|---------------------|------------------------|-------------|-------------|------------------|------|
| execution_integrity_auditor.js (JS.txt) | None (CRX has no audit system) | execution_integrity_auditor.js (only implementation) | execution_integrity_auditor.js | None | None | HIGH |
| determinism_stress_harness.js (JS.txt) | None (CRX has no determinism testing) | determinism_stress_harness.js (only implementation) | determinism_stress_harness.js | None | determinism_stress_harness.js (testing-specific) | MEDIUM |
| structural_identity_stability_test_suite.js (JS.txt) | None (CRX has no stability testing) | structural_identity_stability_test_suite.js (only implementation) | structural_identity_stability_test_suite.js | None | structural_identity_stability_test_suite.js (testing-specific) | MEDIUM |

**EVIDENCE:**
- execution_integrity_auditor.js: Has snapshot verification, scheduler binding validation, execution ID recomputation, artifact fingerprint verification, drift classification
- determinism_stress_harness.js: Has determinism stress testing
- structural_identity_stability_test_suite.js: Has structural identity stability testing
- CRX runtime: Has no audit system, no determinism testing, no stability testing

**CONFLICT:** None - CRX has no audit system

---

## Summary

**TOTAL COMPETING AUTHORITIES:** 15

**BY CATEGORY:**
- Competing event schemas: 3 (audit-event vs claim vs decision vs argument-graph)
- Competing replay semantics: 1 (deterministic_replay_harness.js vs none)
- Competing fingerprint systems: 2 (canonical_fingerprint_service.js vs identity_engine.ts vs canonical_engine.ts)
- Competing validators: 4 (formal_invariant_graph_verifier.js vs dag_validator.ts, execution_integrity_auditor.js vs none, plugin_contract_validator.js vs none, merkle_anchor_chain_validator.js vs none)
- Competing lineage models: 3 (structural_graph_builder.js vs none, formal_invariant_graph_verifier.js vs dag_validator.ts, snapshot_lineage_integrity_guard.js vs none)
- Competing persistence contracts: 3 (artifact_store.ts vs none, lineage_store.ts vs none, ledger_schema.sql vs none)
- Competing audit systems: 3 (execution_integrity_auditor.js vs none, determinism_stress_harness.js vs none, structural_identity_stability_test_suite.js vs none)

**BY SEVERITY:**
- CRITICAL: 2 (fingerprint systems, validators)
- HIGH: 2 (replay semantics, audit systems)
- MEDIUM: 4 (lineage models, determinism testing, stability testing)
- LOW: 7 (event schemas, persistence contracts, plugin-specific validators, merkle-specific validators)

**BY REUSE_TARGET:**
- Reuse from JS.txt: 8 (canonical_fingerprint_service.js, formal_invariant_graph_verifier.js, execution_integrity_auditor.js, structural_graph_builder.js, snapshot_lineage_integrity_guard.js, determinism_stress_harness.js, structural_identity_stability_test_suite.js)
- Reuse from CRX: 3 (artifact_store.ts, lineage_store.ts, ledger_schema.sql)
- Merge into CRX: 2 (identity_engine.ts, dag_validator.ts)
- Quarantine: 6 (claim.schema.json, decision.schema.json, argument-graph.schema.json, plugin_contract_validator.js, merkle_anchor_chain_validator.js, determinism_stress_harness.js, structural_identity_stability_test_suite.js)

**BY RISK:**
- HIGH RISK: 2 (fingerprint systems, validators)
- MEDIUM RISK: 4 (lineage models, determinism testing, stability testing)
- LOW RISK: 9 (event schemas, persistence contracts, plugin-specific validators, merkle-specific validators)
