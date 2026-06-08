# Duplicate Systems Report

## Exact Duplicates

**NONE FOUND**

No exact duplicate files found in CRX runtime.

---

## Conceptual Duplicates

**DUPLICATE 1: Hashing Implementations**

**SYSTEM A:** identity_engine.ts
- SHA-256 hashing
- Canonicalization before hashing
- JSON serialization
- Hex output

**SYSTEM B:** canonical_fingerprint_service.js (JS.txt)
- SHA-256 hashing
- Canonicalization before hashing
- JSON serialization
- Hex output
- Domain separation
- Hash verification
- Algorithm specification

**OVERLAP:** 80% (both perform SHA-256 hashing with canonicalization)

**DIFFERENCES:**
- System B has domain separation (CRITICAL for replay)
- System B has hash verification (CRITICAL for integrity)
- System B has algorithm specification (CRITICAL for replay)
- System A is TypeScript (better)
- System A uses Node.js crypto API (better)

**RECOMMENDATION:** MERGE - extend identity_engine.ts with System B capabilities

**SEVERITY:** HIGH

---

**DUPLICATE 2: Canonicalization Implementations**

**SYSTEM A:** canonical_engine.ts
- Recursive object key sorting
- Array canonicalization
- Null/undefined handling
- Basic type preservation

**SYSTEM B:** canonical_fingerprint_service.js (JS.txt)
- Recursive object key sorting
- Array canonicalization
- Null/undefined handling
- Domain separation
- Error handling
- Options validation

**OVERLAP:** 70% (both perform recursive canonicalization)

**DIFFERENCES:**
- System B has domain separation (CRITICAL for replay)
- System B has error handling (CRITICAL for safety)
- System B has options validation (CRITICAL for safety)
- System A is TypeScript (better)
- System A is simpler (better)

**RECOMMENDATION:** MERGE - extend canonical_engine.ts with System B capabilities

**SEVERITY:** HIGH

---

**DUPLICATE 3: DAG Validation Implementations**

**SYSTEM A:** dag_validator.ts
- Direct self-loop detection
- Duplicate parent detection
- Basic validation

**SYSTEM B:** formal_invariant_graph_verifier.js (JS.txt)
- Full cycle detection (DFS-based)
- Required edge verification
- Forbidden edge detection
- Node presence verification
- Domain transition enforcement
- Graph fingerprinting

**OVERLAP:** 30% (both perform validation, but System B is much more comprehensive)

**DIFFERENCES:**
- System B has indirect cycle detection (CRITICAL for lineage)
- System B has graph fingerprinting (CRITICAL for replay)
- System B has required edge verification (CRITICAL for constitutional compliance)
- System B has forbidden edge detection (CRITICAL for constitutional compliance)
- System A is TypeScript (better)
- System A is simpler for basic use cases (better)

**RECOMMENDATION:** MERGE - extend dag_validator.ts with System B capabilities

**SEVERITY:** CRITICAL

---

## Overlapping Validators

**OVERLAP 1: Event Validation**

**SYSTEM A:** None (CRX has no event validation)

**SYSTEM B:** audit-event.schema.json (legacy schema)
- Event envelope structure
- Actor validation
- Artifact validation
- Lineage validation
- Policy version validation

**OVERLAP:** 0% (CRX has no event validation)

**RECOMMENDATION:** EXTRACT - create event_validator.ts from System B

**SEVERITY:** CRITICAL

---

**OVERLAP 2: Lineage Validation**

**SYSTEM A:** dag_validator.ts
- Direct self-loop detection
- Duplicate parent detection

**SYSTEM B:** formal_invariant_graph_verifier.js (JS.txt)
- Full cycle detection
- Required edge verification
- Forbidden edge detection
- Graph fingerprinting

**OVERLAP:** 30% (both perform validation, but System B is more comprehensive)

**RECOMMENDATION:** MERGE - extend dag_validator.ts with System B capabilities

**SEVERITY:** CRITICAL

---

## Overlapping Replay Logic

**OVERLAP 1: Replay System**

**SYSTEM A:** None (CRX has no replay system)

**SYSTEM B:** deterministic_replay_harness.js (JS.txt)
- Deterministic event ordering
- Event fingerprint verification
- State reconstruction
- Transcript generation
- Replay fingerprinting
- Replay verification

**OVERLAP:** 0% (CRX has no replay system)

**RECOMMENDATION:** EXTRACT - create replay_engine.ts from System B

**SEVERITY:** CRITICAL

---

## Overlapping Hashing

**OVERLAP 1: Hashing Implementation**

**SYSTEM A:** identity_engine.ts
- SHA-256 hashing
- Canonicalization before hashing

**SYSTEM B:** canonical_fingerprint_service.js (JS.txt)
- SHA-256 hashing
- Canonicalization before hashing
- Domain separation
- Hash verification
- Algorithm specification

**OVERLAP:** 80% (both perform SHA-256 hashing with canonicalization)

**RECOMMENDATION:** MERGE - extend identity_engine.ts with System B capabilities

**SEVERITY:** HIGH

---

## Overlapping Lineage Logic

**OVERLAP 1: Lineage Validation**

**SYSTEM A:** dag_validator.ts
- Direct self-loop detection
- Duplicate parent detection

**SYSTEM B:** formal_invariant_graph_verifier.js (JS.txt)
- Full cycle detection
- Required edge verification
- Forbidden edge detection
- Graph fingerprinting

**OVERLAP:** 30% (both perform validation, but System B is more comprehensive)

**RECOMMENDATION:** MERGE - extend dag_validator.ts with System B capabilities

**SEVERITY:** CRITICAL

---

## Summary

**EXACT DUPLICATES:** 0

**CONCEPTUAL DUPLICATES:** 3
- Hashing implementations (identity_engine.ts vs canonical_fingerprint_service.js)
- Canonicalization implementations (canonical_engine.ts vs canonical_fingerprint_service.js)
- DAG validation implementations (dag_validator.ts vs formal_invariant_graph_verifier.js)

**OVERLAPPING VALIDATORS:** 2
- Event validation (CRX has none, legacy has schema)
- Lineage validation (dag_validator.ts vs formal_invariant_graph_verifier.js)

**OVERLAPPING REPLAY LOGIC:** 1
- Replay system (CRX has none, legacy has deterministic_replay_harness.js)

**OVERLAPPING HASHING:** 1
- Hashing implementation (identity_engine.ts vs canonical_fingerprint_service.js)

**OVERLAPPING LINEAGE LOGIC:** 1
- Lineage validation (dag_validator.ts vs formal_invariant_graph_verifier.js)

**TOTAL OVERLAPS:** 8

**CRITICAL SEVERITY:** 4
- DAG validation implementations
- Event validation
- Replay system
- Lineage validation

**HIGH SEVERITY:** 2
- Hashing implementations
- Canonicalization implementations

**MEDIUM SEVERITY:** 2
- Overlapping hashing
- Overlapping lineage logic

---

## Recommendations

**IMMEDIATE ACTION (CRITICAL):**
1. Extend dag_validator.ts with formal_invariant_graph_verifier.js capabilities
2. Create event_validator.ts from audit-event.schema.json
3. Create replay_engine.ts from deterministic_replay_harness.js

**SOON ACTION (HIGH):**
4. Extend identity_engine.ts with canonical_fingerprint_service.js capabilities
5. Extend canonical_engine.ts with canonical_fingerprint_service.js capabilities

**LATER ACTION (MEDIUM):**
6. Consolidate overlapping hashing implementations
7. Consolidate overlapping lineage logic implementations
