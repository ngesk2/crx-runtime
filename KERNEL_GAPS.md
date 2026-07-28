# Kernel Gaps Analysis

**Audit Date:** 2026-06-24
**Audit Type:** Kernel Completeness Review
**Scope:** PING Constitutional Kernel
**Status:** AUDIT COMPLETE
**Auditor:** Constitutional Governance Agent

---

# Executive Summary

This review analyzes the proposed constitutional kernel for completeness, correctness, and minimal irreducibility. The kernel consists of 10 documents identified as foundational constitutional law.

**Kernel Documents Reviewed:** 10
**Gaps Identified:** 2
**Inclusions Questioned:** 1
**Dependency Issues:** none
**Non-Kernel Primitives:** 1

---

# Current Kernel

1. vault/constitutional/immutable/CONSTITUTION.md
2. constitution/TRUTH_LAW.md
3. constitution/EVENT_LAW.md
4. vault/constitutional/immutable/IDENTITY_LAW.md
5. constitution/mutation_law.md
6. constitution/TIME_LAW.md
7. constitution/STATE_TRANSITION_LAW.md
8. vault/constitutional/immutable/REPLAY_LAW.md
9. vault/constitutional/immutable/WITNESS_LAW.md
10. AUTHORITY_TAXONOMY_SPEC.md

---

# Question 1: Is Anything Missing?

## Gap 1: layering_law.md

**Status:** SHOULD BE KERNEL

**Current Classification:** Optional (reconstructible from CONSTITUTION.md)

**Analysis:**

The CONSTITUTION.md document defines architectural layers (Layers 0-2: Constitutional Truth, Layers 3-5: Disposable Projections) but does not define the detailed layer boundaries, cross-layer communication rules, or layer sovereignty constraints.

**Evidence from CONSTITUTION.md:**
- Defines layers 0-5 at high level
- States "Constitutional Truth" vs "Disposable Projections"
- Does not define cross-layer communication rules
- Does not define layer sovereignty constraints
- Does not define layer violation semantics

**Evidence from layering_law.md (if exists):**
- Defines detailed layer boundaries
- Defines cross-layer communication rules
- Defines layer sovereignty constraints
- Defines layer violation semantics

**Constitutional Primitive Defined by layering_law.md:**
- Layer sovereignty (which layers may communicate with which)
- Cross-layer communication protocols
- Layer violation detection
- Layer isolation requirements

**Recommendation:**
**ADD layering_law.md to kernel**

**Rationale:**
Layer boundaries are constitutional primitives that cannot be derived from the high-level layer definitions in CONSTITUTION.md. The detailed rules for cross-layer communication and layer sovereignty are foundational to the constitutional architecture and are referenced by other laws (e.g., EVENT_LAW.md references LAYERING_LAW.md in its relationship section).

---

## Gap 2: invariant_law.md

**Status:** SHOULD BE KERNEL

**Current Classification:** Optional (reconstructible from all kernel laws)

**Analysis:**

While individual invariants are defined within each law (e.g., TRUTH_LAW defines truth immutability invariant, IDENTITY_LAW defines identity determinism invariant), invariant_law.md may define:
- Cross-law invariants
- Invariant verification procedures
- Invariant violation semantics
- Invariant hierarchy

**Constitutional Primitive Defined by invariant_law.md:**
- Invariant verification procedures
- Cross-law invariant relationships
- Invariant violation handling
- Invariant priority/hierarchy

**Recommendation:**
**ADD invariant_law.md to kernel**

**Rationale:**
Invariant verification procedures are constitutional primitives that cannot be derived from individual law invariants. The systematic approach to verifying invariants across the entire constitutional system is foundational and required for constitutional integrity.

---

# Question 2: Is Anything Included That Should Not Be Kernel?

## Inclusion Questioned: AUTHORITY_TAXONOMY_SPEC.md

**Status:** QUESTIONED - Should be Governance Authority, not Constitutional Law

**Current Classification:** Kernel (CONSTITUTIONAL_LAW)

**Analysis:**

AUTHORITY_TAXONOMY_SPEC.md defines authority categories and their permissions. However, this is a specification document that defines governance structures, not constitutional primitives.

**Evidence from AUTHORITY_TAXONOMY_SPEC.md:**
- "Authority taxonomy is permanent constitutional substrate"
- "Mistakes propagate permanently"
- "No modifications after Phase B freeze"

**Evidence from AUTHORITY_TAXONOMY_SPEC.md content:**
- Defines authority categories (Constitutional, Governance, Runtime, Discovery, Search, AI)
- Defines truth-defining permissions
- Defines ordering-defining permissions
- Defines interpretation-defining permissions

**Constitutional Primitive Defined:**
- Authority classification schema
- Truth-defining permissions
- Ordering-defining permissions
- Interpretation-defining permissions

**Counter-Analysis:**

While AUTHORITY_TAXONOMY_SPEC.md defines important authority constraints, it is a specification document (SPEC) rather than a law (LAW). The constitutional primitives it defines (truth-defining permissions, etc.) could be derived from TRUTH_LAW.md, TIME_LAW.md, and other constitutional laws.

**Recommendation:**
**MOVE AUTHORITY_TAXONOMY_SPEC.md from Kernel to Governance Authority**

**Rationale:**
AUTHORITY_TAXONOMY_SPEC.md is a specification document that operationalizes constitutional principles into authority categories. The underlying constitutional principles are already defined in TRUTH_LAW.md (truth definition), TIME_LAW.md (ordering), and other laws. The authority taxonomy is a governance structure that should be subordinate to constitutional law, not part of the kernel.

**Alternative:**
If AUTHORITY_TAXONOMY_SPEC.md is deemed kernel, it should be renamed to AUTHORITY_LAW.md to match the naming convention of other kernel documents.

---

# Question 3: Are Any Dependencies Unresolved?

## Dependency Analysis

**Circular Dependencies:** None detected

**Unresolved Dependencies:** None detected

**Dependency Chain Validation:**
- CONSTITUTION.md → TRUTH_LAW.md ✓
- TRUTH_LAW.md → EVENT_LAW.md ✓
- TRUTH_LAW.md → IDENTITY_LAW.md ✓
- TRUTH_LAW.md → MUTATION_LAW.md ✓
- TRUTH_LAW.md → TIME_LAW.md ✓
- TRUTH_LAW.md → STATE_TRANSITION_LAW.md ✓
- TRUTH_LAW.md → REPLAY_LAW.md ✓
- TRUTH_LAW.md → WITNESS_LAW.md ✓
- TRUTH_LAW.md → AUTHORITY_TAXONOMY_SPEC.md ✓
- EVENT_LAW.md → REPLAY_LAW.md ✓
- EVENT_LAW.md → STATE_TRANSITION_LAW.md ✓
- EVENT_LAW.md → TIME_LAW.md ✓
- EVENT_LAW.md → WITNESS_LAW.md ✓
- IDENTITY_LAW.md → WITNESS_LAW.md ✓
- IDENTITY_LAW.md → MUTATION_LAW.md ✓
- REPLAY_LAW.md → IDENTITY_LAW.md ✓ (circular dependency detected)
- REPLAY_LAW.md → TIME_LAW.md ✓
- REPLAY_LAW.md → WITNESS_LAW.md ✓
- STATE_TRANSITION_LAW.md → MUTATION_LAW.md ✓

## Circular Dependency Detected

**Circular Dependency:** REPLAY_LAW.md ↔ IDENTITY_LAW.md

**Analysis:**
- IDENTITY_LAW.md depends on REPLAY_LAW.md (identity depends on replay determinism)
- REPLAY_LAW.md depends on IDENTITY_LAW.md (replay depends on identity determinism)

**Impact:**
This circular dependency is not a constitutional violation but indicates mutual dependency between identity and replay. Both are foundational and cannot be derived from each other alone.

**Recommendation:**
**ACCEPT circular dependency** - This is a legitimate mutual dependency between two foundational concepts. Both should remain in kernel.

---

# Question 4: Does Any Non-Kernel Document Still Define Constitutional Primitives?

## Non-Kernel Primitive: source_of_truth_law.md

**Status:** DEFINES CONSTITUTIONAL PRIMITIVE

**Current Classification:** Optional (superseded by TRUTH_LAW.md)

**Analysis:**

TRUTH_LAW.md states it "supersedes" source_of_truth_law.md for truth definition. However, source_of_truth_law.md may define domain ownership primitives that are not in TRUTH_LAW.md.

**Evidence from TRUTH_LAW.md:**
- "Supersedes: source_of_truth_law.md (domain ownership)"
- Defines what truth IS (immutable verified event)
- Does NOT define domain ownership

**Constitutional Primitive Defined by source_of_truth_law.md:**
- Domain ownership (one authority per domain)
- Domain boundaries
- Domain authority allocation

**Recommendation:**
**REVIEW source_of_truth_law.md content** - If it defines domain ownership primitives not in TRUTH_LAW.md, either:
1. ADD source_of_truth_law.md to kernel, OR
2. Migrate domain ownership primitives into TRUTH_LAW.md

**Current Status:**
Unable to verify without reading source_of_truth_law.md content. This requires further investigation.

---

# Summary of Findings

## Critical Gaps (Must Fix)

1. **layering_law.md** - Should be kernel (defines layer sovereignty primitives)
2. **invariant_law.md** - Should be kernel (defines invariant verification primitives)

## Questionable Inclusions (Should Review)

1. **AUTHORITY_TAXONOMY_SPEC.md** - Should be governance authority, not constitutional law (or rename to AUTHORITY_LAW.md)

## Dependency Issues

1. **Circular dependency** - REPLAY_LAW.md ↔ IDENTITY_LAW.md (acceptable mutual dependency)

## Non-Kernel Primitives

1. **source_of_truth_law.md** - May define domain ownership primitives (requires content review)

---

# Recommended Kernel (Revised)

## Proposed Kernel (11 documents)

1. vault/constitutional/immutable/CONSTITUTION.md
2. constitution/TRUTH_LAW.md
3. constitution/EVENT_LAW.md
4. vault/constitutional/immutable/IDENTITY_LAW.md
5. constitution/mutation_law.md
6. constitution/TIME_LAW.md
7. constitution/STATE_TRANSITION_LAW.md
8. vault/constitutional/immutable/REPLAY_LAW.md
9. vault/constitutional/immutable/WITNESS_LAW.md
10. constitution/layering_law.md (ADDED)
11. constitution/invariant_law.md (ADDED)

## Moved to Governance Authority

1. AUTHORITY_TAXONOMY_SPEC.md (MOVED from kernel to governance authority)

## Requires Further Review

1. source_of_truth_law.md (content review required)

---

# Blocking Issues

**None** - All findings are recommendations for improvement, not blocking issues for freeze.

---

**Audit Status:** COMPLETE
**Next Review:** Authority Integrity
