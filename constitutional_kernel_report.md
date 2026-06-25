# Constitutional Kernel Report

**Report Date:** 2026-06-24
**Report Type:** Constitutional Kernel Identification
**Scope:** PING Repository Constitutional Foundation
**Status:** AUDIT ONLY - No runtime changes

---

# Executive Summary

This report identifies the minimal constitutional kernel required for PING constitutional stability. The kernel consists of foundational documents that define truth, authority, governance, mutation, replay, identity, time, and state transitions.

**Total Constitutional Documents Audited:** 25
**Required Kernel Documents:** 10
**Optional Constitutional Documents:** 15
**Non-Constitutional Documents:** Excluded from kernel

---

# REQUIRED_KERNEL

## Definition

The constitutional kernel is the minimal set of documents from which all other constitutional authority can be reconstructed. These documents are foundational and cannot be derived from other constitutional sources.

## Kernel Documents

### 1. TRUTH_LAW.md

**Path:** `constitution/TRUTH_LAW.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FROZEN
**Root Law:** This document is root constitutional law

**Foundational Reason:**
- Defines truth as immutable verified event
- Root constitutional law from which all other truth definitions derive
- Cannot be reconstructed without this definition
- All other laws depend on truth definition

**Dependencies:** None (root law)

**Dependents:** All constitutional laws

---

### 2. EVENT_LAW.md

**Path:** `constitution/EVENT_LAW.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FROZEN
**Root Law:** TRUTH_LAW.md

**Foundational Reason:**
- Defines event ontology, classification, and replay semantics
- Events are the sole primitive from which constitutional truth is constructed
- Cannot be reconstructed without event classification
- Replay law depends on event classification

**Dependencies:** TRUTH_LAW.md

**Dependents:** REPLAY_LAW.md, WITNESS_LAW.md, STATE_TRANSITION_LAW.md

---

### 3. IDENTITY_LAW.md

**Path:** `vault/constitutional/immutable/IDENTITY_LAW.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FROZEN
**Root Law:** TRUTH_LAW.md, REPLAY_LAW.md

**Foundational Reason:**
- Defines constitutional identity determinism
- Identity is required for replay determinism
- Cannot be reconstructed without identity definition
- All other laws depend on identity for artifact reference

**Dependencies:** TRUTH_LAW.md, REPLAY_LAW.md

**Dependents:** WITNESS_LAW.md, MUTATION_LAW.md

---

### 4. MUTATION_LAW.md

**Path:** `constitution/mutation_law.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FROZEN
**Root Law:** TRUTH_LAW.md, STATE_TRANSITION_LAW.md

**Foundational Reason:**
- Defines mutation authorization and legality
- Prevents unauthorized state changes
- Cannot be reconstructed without mutation rules
- All state changes depend on mutation law

**Dependencies:** TRUTH_LAW.md, STATE_TRANSITION_LAW.md

**Dependents:** AGENT_CONSTITUTION.md

---

### 5. TIME_LAW.md

**Path:** `constitution/TIME_LAW.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FROZEN
**Root Law:** TRUTH_LAW.md, EVENT_LAW.md, REPLAY_LAW.md

**Foundational Reason:**
- Defines constitutional time as event order
- Prevents replay divergence from time sources
- Cannot be reconstructed without time definition
- Replay depends on constitutional time

**Dependencies:** TRUTH_LAW.md, EVENT_LAW.md, REPLAY_LAW.md

**Dependents:** REPLAY_LAW.md

---

### 6. STATE_TRANSITION_LAW.md

**Path:** `constitution/STATE_TRANSITION_LAW.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FROZEN
**Root Law:** TRUTH_LAW.md, EVENT_LAW.md

**Foundational Reason:**
- Defines allowed state transitions
- Prevents event ordering drift
- Cannot be reconstructed without state machine definition
- All state changes depend on transition rules

**Dependencies:** TRUTH_LAW.md, EVENT_LAW.md

**Dependents:** MUTATION_LAW.md

---

### 7. REPLAY_LAW.md

**Path:** `vault/constitutional/immutable/REPLAY_LAW.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FROZEN
**Root Law:** TRUTH_LAW.md

**Foundational Reason:**
- Defines replay determinism
- State reconstruction depends on replay rules
- Cannot be reconstructed without replay definition
- All derived truth depends on replay

**Dependencies:** TRUTH_LAW.md

**Dependents:** IDENTITY_LAW.md, TIME_LAW.md, WITNESS_LAW.md

---

### 8. WITNESS_LAW.md

**Path:** `vault/constitutional/immutable/WITNESS_LAW.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FROZEN
**Root Law:** TRUTH_LAW.md

**Foundational Reason:**
- Defines witness generation and verification
- Constitutional verification depends on witness
- Cannot be reconstructed without witness definition
- All verification depends on witness

**Dependencies:** TRUTH_LAW.md, EVENT_LAW.md, IDENTITY_LAW.md, REPLAY_LAW.md

**Dependents:** CONSTITUTIONAL_SNAPSHOT_SPEC.md

---

### 9. AUTHORITY_TAXONOMY_SPEC.md

**Path:** `AUTHORITY_TAXONOMY_SPEC.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** CONSTITUTIONAL FREEZE
**Root Law:** TRUTH_LAW.md

**Foundational Reason:**
- Defines constitutional authority taxonomy
- Authority classification is permanent constitutional substrate
- Cannot be reconstructed without authority definition
- All authority depends on taxonomy

**Dependencies:** TRUTH_LAW.md

**Dependents:** AGENT_CONSTITUTION.md, GOVERNANCE.md

---

### 10. vault/constitutional/immutable/CONSTITUTION.md

**Path:** `vault/constitutional/immutable/CONSTITUTION.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FOUNDATIONAL
**Root Law:** This document is foundational constitutional architecture

**Foundational Reason:**
- Defines immutable architectural principles
- Constitutional architecture foundation
- Cannot be reconstructed without architecture definition
- All other laws depend on architecture

**Dependencies:** None (foundational)

**Dependents:** All constitutional laws

---

# OPTIONAL_CONSTITUTIONAL_DOCS

## Definition

Constitutional documents that are not foundational but provide important constitutional guidance. These can be reconstructed from the kernel but are preserved for clarity and governance.

## Optional Documents

### 1. GOVERNANCE.md

**Path:** `constitution/GOVERNANCE.md`
**Authority Class:** GOVERNANCE_AUTHORITY
**Status:** ACTIVE
**Reconstructible From:** AUTHORITY_TAXONOMY_SPEC.md, TRUTH_LAW.md

**Reason for Optional:**
- Governance principles can be derived from authority taxonomy
- Not required for kernel reconstruction
- Provides important governance guidance

---

### 2. AGENT_CONSTITUTION.md

**Path:** `AGENT_CONSTITUTION.md`
**Authority Class:** AGENT_CONSTITUTION
**Status:** ACTIVE
**Reconstructible From:** MUTATION_LAW.md, AUTHORITY_TAXONOMY_SPEC.md, GOVERNANCE.md

**Reason for Optional:**
- Agent obligations derived from constitutional law
- Subordinate to constitutional law
- Not required for kernel reconstruction

---

### 3. layering_law.md

**Path:** `constitution/layering_law.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FROZEN
**Reconstructible From:** vault/constitutional/immutable/CONSTITUTION.md

**Reason for Optional:**
- Layer boundaries defined in foundational constitution
- Can be derived from architecture
- Not required for kernel reconstruction

---

### 4. retrieval_law.md

**Path:** `constitution/retrieval_law.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FROZEN
**Reconstructible From:** TRUTH_LAW.md, IDENTITY_LAW.md

**Reason for Optional:**
- Retrieval semantics derived from truth and identity
- Can be derived from kernel
- Not required for kernel reconstruction

---

### 5. source_of_truth_law.md

**Path:** `constitution/source_of_truth_law.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FROZEN
**Reconstructible From:** TRUTH_LAW.md

**Reason for Optional:**
- Truth domain ownership derived from truth definition
- Superseded by TRUTH_LAW.md
- Not required for kernel reconstruction

---

### 6. invariant_law.md

**Path:** `constitution/invariant_law.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FROZEN
**Reconstructible From:** All kernel laws

**Reason for Optional:**
- Invariants derived from kernel laws
- Can be reconstructed from kernel
- Not required for kernel reconstruction

---

### 7. constitution/replay_law.md

**Path:** `constitution/replay_law.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FROZEN
**Reconstructible From:** vault/constitutional/immutable/REPLAY_LAW.md

**Reason for Optional:**
- Duplicate of vault/constitutional/immutable/REPLAY_LAW.md
- Not required for kernel reconstruction

---

### 8. constitution/witness_law.md

**Path:** `constitution/witness_law.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** FROZEN
**Reconstructible From:** vault/constitutional/immutable/WITNESS_LAW.md

**Reason for Optional:**
- Duplicate of vault/constitutional/immutable/WITNESS_LAW.md
- Not required for kernel reconstruction

---

### 9. vault/laws/IDENTITY_LAW.md

**Path:** `vault/laws/IDENTITY_LAW.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** ACTIVE (Phase 1)
**Reconstructible From:** vault/constitutional/immutable/IDENTITY_LAW.md

**Reason for Optional:**
- Duplicate of vault/constitutional/immutable/IDENTITY_LAW.md
- Not required for kernel reconstruction

---

### 10. vault/laws/REPLAY_LAW.md

**Path:** `vault/laws/REPLAY_LAW.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** ACTIVE (Phase 1)
**Reconstructible From:** vault/constitutional/immutable/REPLAY_LAW.md

**Reason for Optional:**
- Duplicate of vault/constitutional/immutable/REPLAY_LAW.md
- Not required for kernel reconstruction

---

### 11. vault/laws/WITNESS_LAW.md

**Path:** `vault/laws/WITNESS_LAW.md`
**Authority Class:** CONSTITUTIONAL_LAW
**Status:** ACTIVE (Phase 1)
**Reconstructible From:** vault/constitutional/immutable/WITNESS_LAW.md

**Reason for Optional:**
- Duplicate of vault/constitutional/immutable/WITNESS_LAW.md
- Not required for kernel reconstruction

---

### 12-15. Additional Constitutional Documents

**Paths:** Various constitutional documents in docs/constitutional/, knowledge/authoritative/, brainos/ paths

**Reason for Optional:**
- Documentation and knowledge artifacts
- Not foundational constitutional law
- Can be reconstructed from kernel

---

# NON_CONSTITUTIONAL_DOCS

## Definition

Documents that are not constitutional law. These include specifications, documentation, knowledge artifacts, and system-specific documents.

## Non-Constitutional Categories

### 1. Specifications (SPEC files)

**Examples:**
- CONSTITUTION_COMPILER_SPEC.md
- AUTHORITY_GRAPH_VALIDATOR_SPEC.md
- CONSTITUTIONAL_SNAPSHOT_SPEC.md
- VERIFICATION_WORKER_SPEC.md
- COMPILER_VERIFICATION_SPEC.md

**Reason:** Specifications are implementation guidance, not constitutional law

---

### 2. BrainOS Protocol/Architecture Laws

**Examples:**
- brainos/orchestration/docs/protocol/*_LAW.md
- brainos/orchestration/docs/architecture/*_LAW.md

**Reason:** These are for BrainOS system, not PING constitutional foundation

---

### 3. Documentation and Knowledge

**Examples:**
- docs/constitutional/*.md
- knowledge/authoritative/*.md
- knowledge/derived/*.md

**Reason:** Documentation and knowledge artifacts, not constitutional law

---

# KERNEL DEPENDENCY GRAPH

```
vault/constitutional/immutable/CONSTITUTION.md (foundational)
    ↓
TRUTH_LAW.md (root law)
    ↓
    ├── EVENT_LAW.md
    │   ├── REPLAY_LAW.md
    │   ├── STATE_TRANSITION_LAW.md
    │   └── TIME_LAW.md
    ├── IDENTITY_LAW.md
    │   └── WITNESS_LAW.md
    ├── AUTHORITY_TAXONOMY_SPEC.md
    │   └── GOVERNANCE.md
    └── MUTATION_LAW.md
        └── AGENT_CONSTITUTION.md
```

---

# KERNEL VALIDATION

## Validation Criteria

A document is in the kernel if:

1. **Foundational:** Cannot be reconstructed from other constitutional sources
2. **Required:** Other constitutional documents depend on it
3. **Irreducible:** Cannot be derived from other kernel documents
4. **Authoritative:** Defines constitutional primitives or axioms

## Kernel Validation Results

All 10 kernel documents satisfy all validation criteria.

---

# RECOMMENDATIONS

## Immediate Actions

1. **Freeze Kernel:** All 10 kernel documents should be frozen with hash sovereignty
2. **Hash Sovereignty:** Compute SHA256 for all kernel documents
3. **Freeze Registry:** Register all kernel documents in constitutional freeze registry
4. **Witness Root:** Generate witness root from kernel documents

## Future Actions

1. **Consolidate Duplicates:** Remove duplicate constitutional documents (vault/laws/, constitution/replay_law.md, etc.)
2. **Archive Optional:** Move optional constitutional documents to archive
3. **Document Non-Constitutional:** Clearly mark non-constitutional documents as such

---

**Report Generated:** 2026-06-24
**Report Status:** AUDIT COMPLETE
**Next Phase:** Phase 3 — Authority Dependency Mapping
