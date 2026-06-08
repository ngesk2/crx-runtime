# PHASE G — DUPLICATE AUTHORITY COLLAPSE
## Duplicate Authority Collapse Report

**Audit Date:** 2025-01-08
**Target:** Duplicate constitutional authorities
**Repository:** CRX Constitutional Specification Repository

---

## EXECUTIVE SUMMARY

**FINDING: MULTIPLE DUPLICATE AUTHORITIES EXIST**

Duplicate constitutional authorities exist across:
1. **Event schemas** — 4 competing schemas (audit-event, claim, decision, argument-graph)
2. **Fingerprint systems** — 2 competing systems (canonical_fingerprint_service.js vs identity_engine.ts + canonical_engine.ts)
3. **Lineage systems** — 2 competing systems (formal_invariant_graph_verifier.js vs dag_validator.ts)
4. **Validators** — 4 competing validators (formal_invariant_graph_verifier.js vs dag_validator.ts, plugin_contract_validator.js, merkle_anchor_chain_validator.js)
5. **Persistence contracts** — 3 competing contracts (artifact_store.ts, lineage_store.ts, ledger_schema.sql)
6. **Audit systems** — 3 competing systems (execution_integrity_auditor.js, determinism_stress_harness.js, structural_identity_stability_test_suite.js)

**RECOMMENDATION:** Collapse all duplicate authorities into single canonical authorities based on the consolidation plans from PHASES B-F.

---

## AUDIT SCOPE

### Target Duplicate Components
- Duplicate event schemas
- Duplicate fingerprint systems
- Duplicate lineage systems
- Duplicate validators
- Duplicate persistence contracts
- Duplicate audit systems

### Search Locations
- CRX runtime: All TypeScript modules
- JS.txt archive: All 59 JavaScript modules
- External schemas: All JSON schemas

---

## AUDIT FINDINGS

### Duplicate Authorities Summary

| Category | Total Authorities | Canonical Authority | Duplicate Authorities | Collapse Required |
|----------|-------------------|---------------------|----------------------|-------------------|
| Event schemas | 4 | canonical-event-envelope.json | audit-event, claim, decision, argument-graph | YES |
| Fingerprint systems | 3 | canonical_fingerprint_service.js | identity_engine.ts, canonical_engine.ts | YES |
| Lineage systems | 2 | formal_invariant_graph_verifier.js | dag_validator.ts | YES |
| Validators | 4 | formal_invariant_graph_verifier.js | dag_validator.ts, plugin_contract_validator.js, merkle_anchor_chain_validator.js | YES |
| Persistence contracts | 3 | artifact_store.ts + lineage_store.ts | ledger_schema.sql | YES |
| Audit systems | 3 | execution_integrity_auditor.js | determinism_stress_harness.js, structural_identity_stability_test_suite.js | YES |

### Duplicate Event Schemas

**CANONICAL AUTHORITY:** `canonical-event-envelope.json` (CascadeProjects)

**DUPLICATE AUTHORITIES:**
- `audit-event.schema.json` (CRX knowledge/vos)
- `claim.schema.json` (CRX knowledge)
- `decision.schema.json` (CRX knowledge)
- `argument-graph.schema.json` (CRX knowledge/vos)

**COLLAPSE PLAN (from PHASE B):**
1. Adopt `canonical-event-envelope.json` as canonical event schema
2. Extend envelope to include UCIA-specific fields
3. Migrate `audit-event.schema.json` into canonical envelope
4. Quarantine `claim.schema.json` for UCIA domain-specific use
5. Quarantine `decision.schema.json` for UCIA domain-specific use
6. Quarantine `argument-graph.schema.json` for argument domain-specific use

### Duplicate Fingerprint Systems

**CANONICAL AUTHORITY:** `canonical_fingerprint_service.js` (JS.txt)

**DUPLICATE AUTHORITIES:**
- `identity_engine.ts` (CRX runtime)
- `canonical_engine.ts` (CRX runtime)

**COLLAPSE PLAN (from PHASE C):**
1. Extract `canonical_fingerprint_service.js` from JS.txt archive
2. Adapt to CRX runtime (TypeScript conversion if needed)
3. Replace `identity_engine.ts` with consolidated fingerprint authority
4. Replace `canonical_engine.ts` with consolidated canonicalization authority
5. Deprecate CRX runtime fingerprint implementations
6. Maintain backward compatibility for existing artifact_id format

### Duplicate Lineage Systems

**CANONICAL AUTHORITY:** `formal_invariant_graph_verifier.js` (JS.txt)

**DUPLICATE AUTHORITIES:**
- `dag_validator.ts` (CRX runtime)

**COLLAPSE PLAN (from PHASE D):**
1. Extract `formal_invariant_graph_verifier.js` from JS.txt archive
2. Adapt to CRX runtime (TypeScript conversion if needed)
3. Replace `dag_validator.ts` with consolidated lineage authority
4. Extract `structural_graph_builder.js` for structural identity
5. Extract `snapshot_lineage_integrity_guard.js` for snapshot lineage
6. Deprecate CRX runtime lineage implementations
7. Maintain backward compatibility for existing lineage validation

### Duplicate Validators

**CANONICAL AUTHORITY:** `formal_invariant_graph_verifier.js` (JS.txt)

**DUPLICATE AUTHORITIES:**
- `dag_validator.ts` (CRX runtime)
- `plugin_contract_validator.js` (JS.txt)
- `merkle_anchor_chain_validator.js` (JS.txt)

**COLLAPSE PLAN (from PHASE D):**
1. Consolidate `dag_validator.ts` into `formal_invariant_graph_verifier.js`
2. Quarantine `plugin_contract_validator.js` for plugin-specific use
3. Quarantine `merkle_anchor_chain_validator.js` for merkle-specific use
4. Maintain domain-specific validators for domain-specific use

### Duplicate Persistence Contracts

**CANONICAL AUTHORITY:** `artifact_store.ts` + `lineage_store.ts` (CRX runtime)

**DUPLICATE AUTHORITIES:**
- `ledger_schema.sql` (CRX runtime)

**COLLAPSE PLAN:**
1. Consolidate `ledger_schema.sql` into TypeScript stores
2. Maintain `artifact_store.ts` as canonical artifact persistence
3. Maintain `lineage_store.ts` as canonical lineage persistence
4. Deprecate `ledger_schema.sql` as separate schema
5. Consolidate schema into TypeScript type definitions

### Duplicate Audit Systems

**CANONICAL AUTHORITY:** `execution_integrity_auditor.js` (JS.txt)

**DUPLICATE AUTHORITIES:**
- `determinism_stress_harness.js` (JS.txt)
- `structural_identity_stability_test_suite.js` (JS.txt)

**COLLAPSE PLAN:**
1. Consolidate `execution_integrity_auditor.js` as canonical audit authority
2. Quarantine `determinism_stress_harness.js` for testing-specific use
3. Quarantine `structural_identity_stability_test_suite.js` for testing-specific use
4. Maintain testing harnesses for testing-specific use

---

## COLLAPSE EXECUTION PLAN

### STEP 1: Collapse Event Schemas

**ACTION:**
1. Adopt `canonical-event-envelope.json` as canonical event schema
2. Extend envelope to include UCIA-specific fields (claim_id, decision_id, etc.)
3. Migrate `audit-event.schema.json` into canonical envelope
4. Quarantine `claim.schema.json` to `/quarantine/ucia/`
5. Quarantine `decision.schema.json` to `/quarantine/ucia/`
6. Quarantine `argument-graph.schema.json` to `/quarantine/argument/`
7. Update all event consumers to use canonical envelope
8. Deprecate domain-specific schemas

**EXPECTED OUTCOME:**
- ONE canonical event schema
- Domain-specific schemas quarantined
- All event consumers use canonical envelope

### STEP 2: Collapse Fingerprint Systems

**ACTION:**
1. Extract `canonical_fingerprint_service.js` from JS.txt archive
2. Convert to TypeScript (if needed)
3. Create `/kernel/fingerprint/canonical_fingerprint_service.ts`
4. Replace `identity_engine.ts` with consolidated fingerprint authority
5. Replace `canonical_engine.ts` with consolidated canonicalization authority
6. Deprecate `identity_engine.ts` to `/quarantine/runtime/`
7. Deprecate `canonical_engine.ts` to `/quarantine/runtime/`
8. Update all fingerprint consumers to use canonical authority
9. Maintain backward compatibility for existing artifact_id format

**EXPECTED OUTCOME:**
- ONE canonical fingerprint authority
- Domain-separated fingerprinting
- Hash verification capability
- All fingerprint consumers use canonical authority

### STEP 3: Collapse Lineage Systems

**ACTION:**
1. Extract `formal_invariant_graph_verifier.js` from JS.txt archive
2. Convert to TypeScript (if needed)
3. Create `/kernel/lineage/formal_invariant_graph_verifier.ts`
4. Extract `structural_graph_builder.js` to `/kernel/lineage/structural_graph_builder.ts`
5. Extract `snapshot_lineage_integrity_guard.js` to `/kernel/lineage/snapshot_lineage_integrity_guard.ts`
6. Replace `dag_validator.ts` with consolidated lineage authority
7. Deprecate `dag_validator.ts` to `/quarantine/runtime/`
8. Update all lineage consumers to use canonical authority
9. Maintain backward compatibility for existing lineage validation

**EXPECTED OUTCOME:**
- ONE canonical lineage authority
- Full cycle detection
- Graph fingerprinting
- Invariant topology binding
- All lineage consumers use canonical authority

### STEP 4: Collapse Validators

**ACTION:**
1. Consolidate `dag_validator.ts` into `formal_invariant_graph_verifier.ts`
2. Quarantine `plugin_contract_validator.js` to `/quarantine/plugin/`
3. Quarantine `merkle_anchor_chain_validator.js` to `/quarantine/merkle/`
4. Maintain domain-specific validators for domain-specific use
5. Update all validator consumers to use canonical authority

**EXPECTED OUTCOME:**
- ONE canonical validator authority
- Domain-specific validators quarantined
- All validator consumers use canonical authority

### STEP 5: Collapse Persistence Contracts

**ACTION:**
1. Consolidate `ledger_schema.sql` into TypeScript stores
2. Maintain `artifact_store.ts` as canonical artifact persistence
3. Maintain `lineage_store.ts` as canonical lineage persistence
4. Deprecate `ledger_schema.sql` to `/quarantine/runtime/`
5. Consolidate schema into TypeScript type definitions
6. Update all persistence consumers to use canonical stores

**EXPECTED OUTCOME:**
- ONE canonical artifact persistence
- ONE canonical lineage persistence
- Schema consolidated into TypeScript
- All persistence consumers use canonical stores

### STEP 6: Collapse Audit Systems

**ACTION:**
1. Consolidate `execution_integrity_auditor.js` as canonical audit authority
2. Convert to TypeScript (if needed)
3. Create `/kernel/audit/execution_integrity_auditor.ts`
4. Quarantine `determinism_stress_harness.js` to `/quarantine/testing/`
5. Quarantine `structural_identity_stability_test_suite.js` to `/quarantine/testing/`
6. Maintain testing harnesses for testing-specific use
7. Update all audit consumers to use canonical authority

**EXPECTED OUTCOME:**
- ONE canonical audit authority
- Testing harnesses quarantined
- All audit consumers use canonical authority

---

## QUARANTINE STRATEGY

### Quarantine Directory Structure

```
/quarantine/
  /runtime/
    identity_engine.ts
    canonical_engine.ts
    dag_validator.ts
    ledger_schema.sql
  /ucia/
    claim.schema.json
    decision.schema.json
  /argument/
    argument-graph.schema.json
  /plugin/
    plugin_contract_validator.js
  /merkle/
    merkle_anchor_chain_validator.js
  /testing/
    determinism_stress_harness.js
    structural_identity_stability_test_suite.js
```

### Quarantine Rules

**QUARANTINE CRITERIA:**
- Domain-specific authorities
- Testing-specific authorities
- Deprecated runtime implementations
- Domain-specific validators
- Legacy schemas

**QUARANTINE ACCESS:**
- Read-only access for reference
- No modifications allowed
- No integration into kernel
- Documentation of quarantine reason
- Documentation of deprecation date

**QUARANTINE RETENTION:**
- Retain for historical reference
- Retain for potential reuse
- Retain for audit trail
- No automatic deletion

---

## COLLAPSE VERIFICATION

### Verification Checklist

**EVENT SCHEMAS:**
- [ ] ONE canonical event schema exists
- [ ] Domain-specific schemas quarantined
- [ ] All event consumers use canonical envelope
- [ ] No duplicate event definitions

**FINGERPRINT SYSTEMS:**
- [ ] ONE canonical fingerprint authority exists
- [ ] Domain-separated fingerprinting implemented
- [ ] Hash verification implemented
- [ ] All fingerprint consumers use canonical authority
- [ ] No duplicate fingerprint systems

**LINEAGE SYSTEMS:**
- [ ] ONE canonical lineage authority exists
- [ ] Full cycle detection implemented
- [ ] Graph fingerprinting implemented
- [ ] Invariant topology binding implemented
- [ ] All lineage consumers use canonical authority
- [ ] No duplicate lineage systems

**VALIDATORS:**
- [ ] ONE canonical validator authority exists
- [ ] Domain-specific validators quarantined
- [ ] All validator consumers use canonical authority
- [ ] No duplicate validators

**PERSISTENCE CONTRACTS:**
- [ ] ONE canonical artifact persistence exists
- [ ] ONE canonical lineage persistence exists
- [ ] Schema consolidated into TypeScript
- [ ] All persistence consumers use canonical stores
- [ ] No duplicate persistence contracts

**AUDIT SYSTEMS:**
- [ ] ONE canonical audit authority exists
- [ ] Testing harnesses quarantined
- [ ] All audit consumers use canonical authority
- [ ] No duplicate audit systems

---

## CONCLUSION

### DUPLICATE AUTHORITY COLLAPSE STATUS: **REQUIRED**

**Rationale:**
- Multiple duplicate authorities exist across all categories
- No single canonical authority for any category
- Domain-specific authorities scattered across codebase
- Testing-specific authorities mixed with production code
- Deprecated runtime implementations still in use
- No quarantine strategy for domain-specific code

### IMPLICATIONS

1. **ONE canonical authority per category required** — collapse all duplicates
2. **QUARANTINE domain-specific authorities** — separate from kernel
3. **QUARANTINE testing-specific authorities** — separate from production
4. **NO duplicate event schemas** — consolidate into canonical envelope
5. **NO duplicate fingerprint systems** — consolidate into canonical authority
6. **NO duplicate lineage systems** — consolidate into canonical authority
7. **NO duplicate validators** — consolidate into canonical authority
8. **NO duplicate persistence contracts** — consolidate into canonical stores
9. **NO duplicate audit systems** — consolidate into canonical authority

### RECOMMENDATION

**PROCEED WITH DUPLICATE AUTHORITY COLLAPSE:**
1. Collapse event schemas into canonical envelope
2. Collapse fingerprint systems into canonical authority
3. Collapse lineage systems into canonical authority
4. Collapse validators into canonical authority
5. Collapse persistence contracts into canonical stores
6. Collapse audit systems into canonical authority
7. Quarantine domain-specific authorities
8. Quarantine testing-specific authorities
9. Quarantine deprecated runtime implementations
10. Verify all collapses completed successfully

---

## NEXT STEPS

Proceed to **PHASE H: Controlled Extraction Execution Plan**
- Produce minimum safe consolidation order
- Prioritize extraction by replay criticality
- Prioritize extraction by determinism sensitivity
- Prioritize extraction by dependency order
- Generate final execution plan

---

**Report Generated:** 2025-01-08
**Status:** DUPLICATE AUTHORITY COLLAPSE COMPLETE — COLLAPSE REQUIRED
