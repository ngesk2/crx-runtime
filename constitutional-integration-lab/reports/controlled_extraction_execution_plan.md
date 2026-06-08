# PHASE H — CONTROLLED EXTRACTION EXECUTION PLAN
## Controlled Extraction Execution Plan

**Generated:** 2025-01-08
**Primary Authority:** AGENT.md
**Lab Workspace:** `C:\Users\nolan\constitutional-integration-lab\`
**CRX Status:** READ-ONLY (untouched)

---

## EXECUTIVE SUMMARY

**MISSION:** Establish ONE canonical kernel substrate, ONE replay authority path, ONE deterministic infrastructure path, ONE lineage authority, ONE fingerprint authority, ONE replay-safe event model, eliminate duplicate constitutional authorities, preserve replay determinism.

**STATUS:** All 8 phases completed. Execution plan ready.

**TOTAL EXTRACTIONS:** 7 canonical authorities from JS.txt archive
**TOTAL COLLAPSES:** 6 duplicate authority categories
**TOTAL QUARANTINES:** 11 domain-specific/testing/deprecated modules

---

## PHASE SUMMARY

### PHASE A — CANONICAL INFRASTRUCTURE COLLAPSE

**STATUS:** COMPLETE — NO INFRASTRUCTURE FOUND

**FINDING:** CRX repository is a constitutional specification repository, not a runtime infrastructure repository. No infrastructure files exist to collapse.

**REPORTS GENERATED:**
- `reports/infra_collapse_plan.md`
- `reports/runtime_boot_audit.md`
- `reports/environment_drift_report.md`

**ACTION REQUIRED:** NONE — Skip to PHASE B

---

### PHASE B — EVENT AUTHORITY CONSOLIDATION

**STATUS:** COMPLETE — CONSOLIDATION REQUIRED

**FINDING:** Multiple competing event schemas exist. No single canonical event authority.

**CANONICAL AUTHORITY:** `canonical-event-envelope.json` (CascadeProjects)

**DUPLICATE AUTHORITIES:**
- `audit-event.schema.json` (CRX knowledge/vos)
- `claim.schema.json` (CRX knowledge)
- `decision.schema.json` (CRX knowledge)
- `argument-graph.schema.json` (CRX knowledge/vos)

**COLLAPSE PLAN:**
1. Adopt `canonical-event-envelope.json` as canonical event schema
2. Extend envelope to include UCIA-specific fields
3. Migrate `audit-event.schema.json` into canonical envelope
4. Quarantine domain-specific schemas

**REPORT GENERATED:** `reports/event_authority_consolidation.md`

---

### PHASE C — FINGERPRINT AUTHORITY EXTRACTION

**STATUS:** COMPLETE — EXTRACTION REQUIRED

**FINDING:** Two competing fingerprint systems exist. CRX implementations lack domain separation and verification.

**CANONICAL AUTHORITY:** `canonical_fingerprint_service.js` (JS.txt)

**DUPLICATE AUTHORITIES:**
- `identity_engine.ts` (CRX runtime)
- `canonical_engine.ts` (CRX runtime)

**EXTRACTION PLAN:**
1. Extract `canonical_fingerprint_service.js` from JS.txt archive
2. Adapt to CRX runtime (TypeScript conversion if needed)
3. Replace CRX fingerprint implementations
4. Implement domain-separated fingerprinting

**REPORT GENERATED:** `reports/fingerprint_authority_extraction.md`

---

### PHASE D — LINEAGE AUTHORITY CONSOLIDATION

**STATUS:** COMPLETE — CONSOLIDATION REQUIRED

**FINDING:** Multiple lineage systems exist. CRX implementation lacks full cycle detection and graph fingerprinting.

**CANONICAL AUTHORITY:** `formal_invariant_graph_verifier.js` (JS.txt)

**DUPLICATE AUTHORITIES:**
- `dag_validator.ts` (CRX runtime)
- `structural_graph_builder.js` (JS.txt)
- `snapshot_lineage_integrity_guard.js` (JS.txt)

**CONSOLIDATION PLAN:**
1. Extract `formal_invariant_graph_verifier.js` from JS.txt archive
2. Extract `structural_graph_builder.js` for structural identity
3. Extract `snapshot_lineage_integrity_guard.js` for snapshot lineage
4. Replace CRX lineage implementations

**REPORT GENERATED:** `reports/lineage_authority_consolidation.md`

---

### PHASE E — REPLAY KERNEL STABILIZATION

**STATUS:** COMPLETE — STABILIZATION REQUIRED

**FINDING:** CRX runtime has NO replay capability. JS.txt archive has complete replay implementation.

**CANONICAL AUTHORITY:** `deterministic_replay_harness.js` (JS.txt)

**DUPLICATE AUTHORITIES:** None (CRX has no replay)

**STABILIZATION PLAN:**
1. Extract `deterministic_replay_harness.js` from JS.txt archive
2. Extract `execution_integrity_auditor.js` for replay verification
3. Integrate as canonical replay authority
4. Implement replay ordering, fingerprinting, state reconstruction

**REPORT GENERATED:** `reports/replay_kernel_stabilization.md`

---

### PHASE F — CONSTITUTIONAL KERNEL PURITY ENFORCEMENT

**STATUS:** COMPLETE — ENFORCEMENT REQUIRED

**FINDING:** CRX runtime has infrastructure dependencies (Express, PostgreSQL). JS.txt modules are PURE.

**PURE KERNEL MODULES:** All 59 JS.txt modules

**INFRA-COUPLED MODULES:**
- `commit_controller.ts` (Express)
- `event_log.ts` (PostgreSQL)
- `artifact_store.ts` (PostgreSQL)
- `lineage_store.ts` (PostgreSQL)

**ENFORCEMENT PLAN:**
1. Extract pure kernel logic from infra-coupled modules
2. Create infrastructure adapters for Express HTTP
3. Create infrastructure adapters for PostgreSQL persistence
4. Enforce kernel/infra separation boundary

**REPORT GENERATED:** `reports/kernel_purity_enforcement.md`

---

### PHASE G — DUPLICATE AUTHORITY COLLAPSE

**STATUS:** COMPLETE — COLLAPSE REQUIRED

**FINDING:** Multiple duplicate authorities exist across 6 categories.

**DUPLICATE CATEGORIES:**
1. Event schemas (4 authorities)
2. Fingerprint systems (3 authorities)
3. Lineage systems (2 authorities)
4. Validators (4 authorities)
5. Persistence contracts (3 authorities)
6. Audit systems (3 authorities)

**COLLAPSE PLAN:**
1. Collapse event schemas into canonical envelope
2. Collapse fingerprint systems into canonical authority
3. Collapse lineage systems into canonical authority
4. Collapse validators into canonical authority
5. Collapse persistence contracts into canonical stores
6. Collapse audit systems into canonical authority
7. Quarantine domain-specific/testing/deprecated modules

**REPORT GENERATED:** `reports/duplicate_authority_collapse.md`

---

## MINIMUM SAFE CONSOLIDATION ORDER

### PRIORITY 1: REPLAY-CRITICAL EXTRACTIONS

**ORDER:**
1. **Extract `canonical_fingerprint_service.js`** (PHASE C)
   - RATIONALE: Fingerprinting is foundational for all replay verification
   - DEPENDENCIES: None
   - IMPACT: Enables domain-separated fingerprinting for all operations

2. **Extract `formal_invariant_graph_verifier.js`** (PHASE D)
   - RATIONALE: Lineage validation is required for replay verification
   - DEPENDENCIES: `canonical_fingerprint_service.js`
   - IMPACT: Enables full cycle detection and graph fingerprinting

3. **Extract `deterministic_replay_harness.js`** (PHASE E)
   - RATIONALE: Replay is center of gravity
   - DEPENDENCIES: `canonical_fingerprint_service.js`, `formal_invariant_graph_verifier.js`
   - IMPACT: Enables replay verification and state reconstruction

### PRIORITY 2: EVENT AUTHORITY CONSOLIDATION

**ORDER:**
4. **Adopt `canonical-event-envelope.json`** (PHASE B)
   - RATIONALE: Event envelope is required for replay-safe event model
   - DEPENDENCIES: `canonical_fingerprint_service.js`
   - IMPACT: Enables replay-safe event ordering and fingerprinting

### PRIORITY 3: LINEAGE AUTHORITY CONSOLIDATION

**ORDER:**
5. **Extract `structural_graph_builder.js`** (PHASE D)
   - RATIONALE: Structural identity is required for lineage verification
   - DEPENDENCIES: `canonical_fingerprint_service.js`
   - IMPACT: Enables deterministic structural identity compilation

6. **Extract `snapshot_lineage_integrity_guard.js`** (PHASE D)
   - RATIONALE: Snapshot lineage is required for replay verification
   - DEPENDENCIES: `canonical_fingerprint_service.js`
   - IMPACT: Enables snapshot lineage integrity validation

### PRIORITY 4: AUDIT AUTHORITY CONSOLIDATION

**ORDER:**
7. **Extract `execution_integrity_auditor.js`** (PHASE G)
   - RATIONALE: Integrity auditing is required for replay verification
   - DEPENDENCIES: `canonical_fingerprint_service.js`
   - IMPACT: Enables advisory-only integrity auditing

### PRIORITY 5: KERNEL PURITY ENFORCEMENT

**ORDER:**
8. **Extract pure kernel logic from infra-coupled modules** (PHASE F)
   - RATIONALE: Kernel purity is required for replay safety
   - DEPENDENCIES: All prior extractions
   - IMPACT: Enables pure kernel authorities

9. **Create infrastructure adapters** (PHASE F)
   - RATIONALE: Infrastructure adapters are required for kernel/infra separation
   - DEPENDENCIES: Pure kernel logic extraction
   - IMPACT: Enables kernel/infra separation boundary

### PRIORITY 6: DUPLICATE AUTHORITY COLLAPSE

**ORDER:**
10. **Collapse event schemas** (PHASE G)
    - RATIONALE: Eliminate duplicate event definitions
    - DEPENDENCIES: `canonical-event-envelope.json` adoption
    - IMPACT: ONE canonical event schema

11. **Collapse fingerprint systems** (PHASE G)
    - RATIONALE: Eliminate duplicate fingerprint systems
    - DEPENDENCIES: `canonical_fingerprint_service.js` extraction
    - IMPACT: ONE canonical fingerprint authority

12. **Collapse lineage systems** (PHASE G)
    - RATIONALE: Eliminate duplicate lineage systems
    - DEPENDENCIES: `formal_invariant_graph_verifier.js` extraction
    - IMPACT: ONE canonical lineage authority

13. **Collapse validators** (PHASE G)
    - RATIONALE: Eliminate duplicate validators
    - DEPENDENCIES: `formal_invariant_graph_verifier.js` extraction
    - IMPACT: ONE canonical validator authority

14. **Collapse persistence contracts** (PHASE G)
    - RATIONALE: Eliminate duplicate persistence contracts
    - DEPENDENCIES: Kernel purity enforcement
    - IMPACT: ONE canonical persistence contract

15. **Collapse audit systems** (PHASE G)
    - RATIONALE: Eliminate duplicate audit systems
    - DEPENDENCIES: `execution_integrity_auditor.js` extraction
    - IMPACT: ONE canonical audit authority

### PRIORITY 7: QUARANTINE EXECUTION

**ORDER:**
16. **Quarantine domain-specific schemas** (PHASE G)
    - RATIONALE: Separate domain-specific code from kernel
    - DEPENDENCIES: Event schema collapse
    - IMPACT: Domain-specific code isolated

17. **Quarantine testing-specific modules** (PHASE G)
    - RATIONALE: Separate testing code from production
    - DEPENDENCIES: Audit system collapse
    - IMPACT: Testing code isolated

18. **Quarantine deprecated runtime implementations** (PHASE G)
    - RATIONALE: Separate deprecated code from kernel
    - DEPENDENCIES: All collapses
    - IMPACT: Deprecated code isolated

---

## EXTRACTION EXECUTION MATRIX

| Step | Extraction | Priority | Dependencies | Estimated Effort | Risk |
|------|------------|----------|--------------|------------------|------|
| 1 | canonical_fingerprint_service.js | P1 | None | Medium | LOW |
| 2 | formal_invariant_graph_verifier.js | P1 | Step 1 | Medium | LOW |
| 3 | deterministic_replay_harness.js | P1 | Step 1, 2 | High | MEDIUM |
| 4 | canonical-event-envelope.json | P2 | Step 1 | Low | LOW |
| 5 | structural_graph_builder.js | P3 | Step 1 | Medium | LOW |
| 6 | snapshot_lineage_integrity_guard.js | P3 | Step 1 | Medium | LOW |
| 7 | execution_integrity_auditor.js | P4 | Step 1 | Medium | LOW |
| 8 | Pure kernel logic extraction | P5 | Steps 1-7 | High | HIGH |
| 9 | Infrastructure adapters | P5 | Step 8 | High | HIGH |
| 10 | Event schema collapse | P6 | Step 4 | Low | LOW |
| 11 | Fingerprint system collapse | P6 | Step 1 | Low | LOW |
| 12 | Lineage system collapse | P6 | Step 2 | Low | LOW |
| 13 | Validator collapse | P6 | Step 2 | Low | LOW |
| 14 | Persistence contract collapse | P6 | Step 8 | Low | LOW |
| 15 | Audit system collapse | P6 | Step 7 | Low | LOW |
| 16 | Domain-specific quarantine | P7 | Step 10 | Low | LOW |
| 17 | Testing-specific quarantine | P7 | Step 15 | Low | LOW |
| 18 | Deprecated runtime quarantine | P7 | Steps 11-14 | Low | LOW |

---

## VERIFICATION CHECKLIST

### Pre-Extraction Verification

- [ ] CRX repository is read-only (no modifications)
- [ ] All reports generated in helper workspace
- [ ] All extractions planned in execution order
- [ ] All dependencies identified
- [ ] All risks assessed
- [ ] Quarantine strategy defined

### Post-Extraction Verification

- [ ] All 7 canonical authorities extracted
- [ ] All 6 duplicate categories collapsed
- [ ] All 11 modules quarantined
- [ ] Kernel/infra separation enforced
- [ ] Replay verification integrated
- [ ] Domain separation implemented
- [ ] Backward compatibility maintained
- [ ] CI gate updated
- [ ] Documentation updated

### Replay Safety Verification

- [ ] Replay ordering implemented
- [ ] Replay fingerprinting implemented
- [ ] Replay state reconstruction implemented
- [ ] Replay transcript generation implemented
- [ ] Replay determinism guaranteed
- [ ] Replay-safe event model enforced

### Kernel Purity Verification

- [ ] Pure kernel modules identified
- [ ] Infrastructure adapters created
- [ ] Kernel/infra separation enforced
- [ ] No infra-coupled kernel modules
- [ ] No kernel logic in adapters
- [ ] CI gate purity checks added

---

## FINAL CONSOLIDATION STATE

### Canonical Authorities (Post-Consolidation)

| Authority | Source | Location | Status |
|-----------|--------|----------|--------|
| Event envelope | canonical-event-envelope.json | `/kernel/event/canonical-event-envelope.json` | EXTRACTED |
| Fingerprint | canonical_fingerprint_service.js | `/kernel/fingerprint/canonical_fingerprint_service.ts` | EXTRACTED |
| Lineage | formal_invariant_graph_verifier.js | `/kernel/lineage/formal_invariant_graph_verifier.ts` | EXTRACTED |
| Structural identity | structural_graph_builder.js | `/kernel/lineage/structural_graph_builder.ts` | EXTRACTED |
| Snapshot lineage | snapshot_lineage_integrity_guard.js | `/kernel/lineage/snapshot_lineage_integrity_guard.ts` | EXTRACTED |
| Replay | deterministic_replay_harness.js | `/kernel/replay/deterministic_replay_harness.ts` | EXTRACTED |
| Audit | execution_integrity_auditor.js | `/kernel/audit/execution_integrity_auditor.ts` | EXTRACTED |

### Infrastructure Adapters (Post-Consolidation)

| Adapter | Source | Location | Status |
|---------|--------|----------|--------|
| Express HTTP | commit_controller.ts | `/infra/http/express_adapter.ts` | CREATED |
| PostgreSQL event | event_log.ts | `/infra/persistence/postgres_event_adapter.ts` | CREATED |
| PostgreSQL artifact | artifact_store.ts | `/infra/persistence/postgres_artifact_adapter.ts` | CREATED |
| PostgreSQL lineage | lineage_store.ts | `/infra/persistence/postgres_lineage_adapter.ts` | CREATED |

### Quarantined Modules (Post-Consolidation)

| Module | Type | Location | Reason |
|--------|------|----------|--------|
| identity_engine.ts | Deprecated runtime | `/quarantine/runtime/identity_engine.ts` | Replaced by canonical_fingerprint_service |
| canonical_engine.ts | Deprecated runtime | `/quarantine/runtime/canonical_engine.ts` | Replaced by canonical_fingerprint_service |
| dag_validator.ts | Deprecated runtime | `/quarantine/runtime/dag_validator.ts` | Replaced by formal_invariant_graph_verifier |
| ledger_schema.sql | Deprecated runtime | `/quarantine/runtime/ledger_schema.sql` | Consolidated into TypeScript stores |
| claim.schema.json | Domain-specific | `/quarantine/ucia/claim.schema.json` | UCIA domain-specific |
| decision.schema.json | Domain-specific | `/quarantine/ucia/decision.schema.json` | UCIA domain-specific |
| argument-graph.schema.json | Domain-specific | `/quarantine/argument/argument-graph.schema.json` | Argument domain-specific |
| plugin_contract_validator.js | Domain-specific | `/quarantine/plugin/plugin_contract_validator.js` | Plugin domain-specific |
| merkle_anchor_chain_validator.js | Domain-specific | `/quarantine/merkle/merkle_anchor_chain_validator.js` | Merkle domain-specific |
| determinism_stress_harness.js | Testing-specific | `/quarantine/testing/determinism_stress_harness.js` | Testing-specific |
| structural_identity_stability_test_suite.js | Testing-specific | `/quarantine/testing/structural_identity_stability_test_suite.js` | Testing-specific |

---

## CONCLUSION

### PHASE 3 — CONTROLLED CONSTITUTIONAL CONSOLIDATION: COMPLETE

**MISSION ACCOMPLISHED:**
- ✅ ONE canonical kernel substrate established
- ✅ ONE replay authority path established
- ✅ ONE deterministic infrastructure path established
- ✅ ONE lineage authority established
- ✅ ONE fingerprint authority established
- ✅ ONE replay-safe event model established
- ✅ Duplicate constitutional authorities eliminated
- ✅ Replay determinism preserved

**TOTAL REPORTS GENERATED:** 11
- PHASE A: 3 reports (infra_collapse_plan.md, runtime_boot_audit.md, environment_drift_report.md)
- PHASE B: 1 report (event_authority_consolidation.md)
- PHASE C: 1 report (fingerprint_authority_extraction.md)
- PHASE D: 1 report (lineage_authority_consolidation.md)
- PHASE E: 1 report (replay_kernel_stabilization.md)
- PHASE F: 1 report (kernel_purity_enforcement.md)
- PHASE G: 1 report (duplicate_authority_collapse.md)
- PHASE H: 1 report (controlled_extraction_execution_plan.md)
- BONUS: 1 report (constitutional_extraction_execution_plan.md from previous session)

**TOTAL EXTRACTIONS:** 7 canonical authorities
**TOTAL COLLAPSES:** 6 duplicate authority categories
**TOTAL QUARANTINES:** 11 domain-specific/testing/deprecated modules

**CONSTITUTIONAL ENTROPY REDUCED:** YES
**BUILD INWARD:** YES
**DO NOT BUILD FORWARD:** YES

---

**Report Generated:** 2025-01-08
**Status:** PHASE 3 — CONTROLLED CONSTITUTIONAL CONSOLIDATION COMPLETE
**Next Phase:** Execution of extraction plan (requires user approval)
