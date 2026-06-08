# Extraction Map

## Legacy File → Future Kernel Authority

### CRITICAL EXTRACTIONS (extract immediately)

**formal_invariant_graph_verifier.js → kernel/lineage/dag_validator.ts**
- Extend existing dag_validator.ts with full cycle detection
- Add required edge verification
- Add forbidden edge detection
- Add graph fingerprinting
- Add domain transition enforcement
- **RISK:** LOW - pure function, no side effects
- **PRIORITY:** CRITICAL

**canonical_fingerprint_service.js → kernel/canonical/canonical_engine.ts**
- Extend existing canonical_engine.ts with domain separation
- Add error handling (CanonicalizationError)
- Add fingerprint verification
- Add schema versioning
- **RISK:** LOW - pure function, no side effects
- **PRIORITY:** CRITICAL

**canonical_fingerprint_service.js → kernel/identity/identity_engine.ts**
- Extend existing identity_engine.ts with domain separation
- Add fingerprint verification
- Add algorithm specification
- Add hash verification
- **RISK:** LOW - pure function, no side effects
- **PRIORITY:** CRITICAL

**deterministic_replay_harness.js → kernel/replay/replay_engine.ts**
- Create new replay_engine.ts
- Implement deterministic event ordering
- Implement event fingerprint verification
- Implement state reconstruction
- Implement transcript generation
- Implement replay fingerprinting
- **RISK:** HIGH - requires architectural change
- **PRIORITY:** CRITICAL

---

### HIGH EXTRACTIONS (extract soon)

**execution_integrity_auditor.js → kernel/witness/execution_auditor.ts**
- Create new execution_auditor.ts
- Implement execution integrity auditing
- Implement divergence detection
- Implement integrity verification
- **RISK:** MEDIUM - requires integration with commit flow
- **PRIORITY:** HIGH

**structural_graph_builder.js → kernel/lineage/graph_builder.ts**
- Create new graph_builder.ts
- Implement structural graph building
- Implement graph traversal
- Implement ancestry validation
- **RISK:** MEDIUM - requires integration with lineage system
- **PRIORITY:** HIGH

**snapshot_lineage_integrity_guard.js → kernel/witness/snapshot_guard.ts**
- Create new snapshot_guard.ts
- Implement snapshot lineage integrity guarding
- Implement snapshot verification
- Implement lineage integrity checks
- **RISK:** MEDIUM - requires integration with persistence
- **PRIORITY:** HIGH

---

### MEDIUM EXTRACTIONS (extract later)

**authority_boundary_prover.js → kernel/authority/authority_prover.ts**
- Create new authority_prover.ts
- Implement authority boundary proving
- Implement authority verification
- Implement boundary enforcement
- **RISK:** LOW - pure function, no side effects
- **PRIORITY:** MEDIUM

**structural_identity_stability_test_suite.js → kernel/tests/stability_test.ts**
- Create new stability_test.ts
- Implement structural identity stability testing
- Implement stability verification
- Implement stability checks
- **RISK:** LOW - test suite, no runtime impact
- **PRIORITY:** MEDIUM

---

## Schema Extractions

**audit-event.schema.json → kernel/event/event_schema.ts**
- Extract event envelope structure
- Extract actor structure
- Extract lineage structure
- Extract policy version structure
- Create TypeScript interfaces
- **RISK:** LOW - schema extraction
- **PRIORITY:** CRITICAL

**claim.schema.json → kernel/event/claim_schema.ts**
- Extract claim event structure
- Create TypeScript interfaces
- **RISK:** LOW - schema extraction
- **PRIORITY:** MEDIUM

**decision.schema.json → kernel/event/decision_schema.ts**
- Extract decision event structure
- Create TypeScript interfaces
- **RISK:** LOW - schema extraction
- **PRIORITY:** MEDIUM

---

## MCP0.txt Architecture Extractions

**MCP0.txt directory structure → kernel/ directory structure**
- Use as reference for future kernel expansion
- Align with AGENT.md constitutional requirements
- **RISK:** NONE - reference only
- **PRIORITY:** REFERENCE

**MCP0.txt constitutional test hierarchy → tests/constitutional/ directory structure**
- Use as reference for constitutional test structure
- Align with AGENT.md constitutional requirements
- **RISK:** NONE - reference only
- **PRIORITY:** REFERENCE

---

## Extraction Priority Summary

**CRITICAL (extract immediately):**
1. formal_invariant_graph_verifier.js → extend dag_validator.ts
2. canonical_fingerprint_service.js → extend canonical_engine.ts
3. canonical_fingerprint_service.js → extend identity_engine.ts
4. deterministic_replay_harness.js → create replay_engine.ts
5. audit-event.schema.json → create event_schema.ts

**HIGH (extract soon):**
6. execution_integrity_auditor.js → create execution_auditor.ts
7. structural_graph_builder.js → create graph_builder.ts
8. snapshot_lineage_integrity_guard.js → create snapshot_guard.ts

**MEDIUM (extract later):**
9. authority_boundary_prover.js → create authority_prover.ts
10. structural_identity_stability_test_suite.js → create stability_test.ts
11. claim.schema.json → create claim_schema.ts
12. decision.schema.json → create decision_schema.ts

**REFERENCE (use as guidance):**
13. MCP0.txt directory structure → kernel/ directory structure
14. MCP0.txt constitutional test hierarchy → tests/constitutional/ directory structure

---

## Extraction Order

**PHASE 1: Extend Existing Kernel Seeds**
1. Extend canonical_engine.ts with domain separation
2. Extend identity_engine.ts with domain separation
3. Extend dag_validator.ts with full cycle detection

**PHASE 2: Create New Kernel Authorities**
4. Create event_schema.ts from audit-event.schema.json
5. Create replay_engine.ts from deterministic_replay_harness.js
6. Create event_validator.ts from event_schema.ts

**PHASE 3: Create Witness Authorities**
7. Create execution_auditor.ts from execution_integrity_auditor.js
8. Create snapshot_guard.ts from snapshot_lineage_integrity_guard.js

**PHASE 4: Create Lineage Authorities**
9. Create graph_builder.ts from structural_graph_builder.js

**PHASE 5: Create Test Authorities**
10. Create stability_test.ts from structural_identity_stability_test_suite.ts

**PHASE 6: Create Authority Authorities**
11. Create authority_prover.ts from authority_boundary_prover.js

---

## Risk Assessment

**LOW RISK:**
- canonical_engine.ts extension (pure function)
- identity_engine.ts extension (pure function)
- schema extractions (no runtime impact)
- stability_test.ts (test suite)
- authority_prover.ts (pure function)

**MEDIUM RISK:**
- dag_validator.ts extension (requires integration with lineage system)
- execution_auditor.ts (requires integration with commit flow)
- graph_builder.ts (requires integration with lineage system)
- snapshot_guard.ts (requires integration with persistence)

**HIGH RISK:**
- replay_engine.ts (requires architectural change)
- event_validator.ts (requires breaking change to event schema)

---

## Migration Strategy

**INCREMENTAL MIGRATION:**
1. Start with low-risk extensions (canonical_engine.ts, identity_engine.ts)
2. Move to medium-risk extensions (dag_validator.ts)
3. Create new authorities in isolation (replay_engine.ts)
4. Integrate new authorities with existing runtime
5. Test constitutional compliance
6. Document migration process

**ROLLBACK PLAN:**
1. Keep original files until migration is complete
2. Create feature branches for each extraction
3. Test each extraction independently
4. Verify backward compatibility
5. Provide rollback mechanism for each extraction
