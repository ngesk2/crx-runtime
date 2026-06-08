# Reuse Before Create Report

**Generated:** 2026-06-06
**Primary Authority:** AGENT.md
**Lab Workspace:** `C:\Users\nolan\constitutional-integration-lab\`
**CRX Status:** READ-ONLY (untouched)

---

## Proposed Future Authorities

### ReplayEngine

| Field | Value |
|-------|-------|
| **EXISTS** | YES |
| **SOURCE_FILE** | extracted/js_txt/deterministic_replay_harness.js |
| **CONFIDENCE** | HIGH |
| **ACTION** | REUSE |
| **RATIONALE** | deterministic_replay_harness.js contains full replay system with deterministic event ordering, event fingerprint verification, state reconstruction, transcript generation, replay fingerprinting, replay verification, drift detection, strict mode validation, snapshot fingerprint verification, registry fingerprint verification, and invariant graph verification. This is the exact functionality needed for ReplayEngine. |

---

### ReplayVerifier

| Field | Value |
|-------|-------|
| **EXISTS** | YES |
| **SOURCE_FILE** | extracted/js_txt/execution_integrity_auditor.js |
| **CONFIDENCE** | HIGH |
| **ACTION** | REUSE |
| **RATIONALE** | execution_integrity_auditor.js contains pure replay verification with snapshot verification, scheduler binding validation, execution ID recomputation, artifact fingerprint verification, failure artifact validation, summary artifact validation, and drift classification. This is the exact functionality needed for ReplayVerifier. |

---

### ReplayWitness

| Field | Value |
|-------|-------|
| **EXISTS** | YES |
| **SOURCE_FILE** | extracted/js_txt/merkle_anchor_replay_verifier.js |
| **CONFIDENCE** | MEDIUM |
| **ACTION** | ADAPT |
| **RATIONALE** | merkle_anchor_replay_verifier.js contains merkle anchor chain replay verification, but it's specific to merkle anchors. The general replay witness pattern exists but needs to be adapted for general use. The witness pattern from this module can be reused for ReplayWitness. |

---

### LineageGraph

| Field | Value |
|-------|-------|
| **EXISTS** | YES |
| **SOURCE_FILE** | extracted/js_txt/structural_graph_builder.js |
| **CONFIDENCE** | HIGH |
| **ACTION** | REUSE |
| **RATIONALE** | structural_graph_builder.js contains deterministic structural identity compilation with deterministic node generation, domain-separated node identity, span validation, non-overlapping siblings, acyclic structure enforcement, and deep immutability. This is the exact functionality needed for LineageGraph. |

---

### GraphFingerprint

| Field | Value |
|-------|-------|
| **EXISTS** | YES |
| **SOURCE_FILE** | extracted/js_txt/formal_invariant_graph_verifier.js |
| **CONFIDENCE** | HIGH |
| **ACTION** | REUSE |
| **RATIONALE** | formal_invariant_graph_verifier.js contains deterministic graph fingerprinting with domain-separated fingerprinting, sorted nodes, sorted edges, and deterministic graph representation. This is the exact functionality needed for GraphFingerprint. |

---

### InvariantRunner

| Field | Value |
|-------|-------|
| **EXISTS** | YES |
| **SOURCE_FILE** | extracted/js_txt/formal_invariant_graph_verifier.js |
| **CONFIDENCE** | HIGH |
| **ACTION** | REUSE |
| **RATIONALE** | formal_invariant_graph_verifier.js contains invariant graph verification with node presence check, required edge check, forbidden edge check, cycle detection, domain transition enforcement, and graph fingerprinting. This is the exact functionality needed for InvariantRunner. |

---

### ArtifactFingerprint

| Field | Value |
|-------|-------|
| **EXISTS** | YES |
| **SOURCE_FILE** | extracted/js_txt/canonical_fingerprint_service.js |
| **CONFIDENCE** | HIGH |
| **ACTION** | REUSE |
| **RATIONALE** | canonical_fingerprint_service.js contains domain-separated SHA-256 fingerprinting with strict canonicalization, domain registry, algorithm specification, and hash verification. The fingerprintWithDomain function with FINGERPRINT_DOMAINS.ARTIFACT provides the exact functionality needed for ArtifactFingerprint. |

---

### StateFingerprint

| Field | Value |
|-------|-------|
| **EXISTS** | YES |
| **SOURCE_FILE** | extracted/js_txt/canonical_fingerprint_service.js |
| **CONFIDENCE** | HIGH |
| **ACTION** | REUSE |
| **RATIONALE** | canonical_fingerprint_service.js contains domain-separated SHA-256 fingerprinting with strict canonicalization, domain registry, algorithm specification, and hash verification. The fingerprintWithDomain function with FINGERPRINT_DOMAINS.SNAPSHOT provides the exact functionality needed for StateFingerprint. |

---

### TranscriptFingerprint

| Field | Value |
|-------|-------|
| **EXISTS** | YES |
| **SOURCE_FILE** | extracted/js_txt/deterministic_replay_harness.js |
| **CONFIDENCE** | HIGH |
| **ACTION** | REUSE |
| **RATIONALE** | deterministic_replay_harness.js contains replay fingerprinting with domain-separated fingerprinting of replay results. The replay fingerprinting logic provides the exact functionality needed for TranscriptFingerprint. |

---

### WitnessProof

| Field | Value |
|-------|-------|
| **EXISTS** | YES |
| **SOURCE_FILE** | extracted/js_txt/authority_boundary_prover.js |
| **CONFIDENCE** | HIGH |
| **ACTION** | REUSE |
| **RATIONALE** | authority_boundary_prover.js contains formal constitutional authority boundary proving with snapshot isolation, projection containment, artifact neutrality, structural identity stability, scheduler determinism, replay equivalence, registry sovereignty, domain separation, and entropy containment. This is the exact functionality needed for WitnessProof. |

---

## Summary

**TOTAL PROPOSED AUTHORITIES:** 10

**BY EXISTS:**
- YES: 10 (all proposed authorities already exist in JS.txt archive)
- NO: 0

**BY SOURCE_FILE:**
- canonical_fingerprint_service.js: 3 (ArtifactFingerprint, StateFingerprint, WitnessProof)
- deterministic_replay_harness.js: 2 (ReplayEngine, TranscriptFingerprint)
- execution_integrity_auditor.js: 1 (ReplayVerifier)
- merkle_anchor_replay_verifier.js: 1 (ReplayWitness)
- structural_graph_builder.js: 1 (LineageGraph)
- formal_invariant_graph_verifier.js: 2 (GraphFingerprint, InvariantRunner)
- authority_boundary_prover.js: 1 (WitnessProof)

**BY CONFIDENCE:**
- HIGH: 9 (ReplayEngine, ReplayVerifier, LineageGraph, GraphFingerprint, InvariantRunner, ArtifactFingerprint, StateFingerprint, TranscriptFingerprint, WitnessProof)
- MEDIUM: 1 (ReplayWitness - needs adaptation from merkle-specific to general)

**BY ACTION:**
- REUSE: 9 (ReplayEngine, ReplayVerifier, LineageGraph, GraphFingerprint, InvariantRunner, ArtifactFingerprint, StateFingerprint, TranscriptFingerprint, WitnessProof)
- ADAPT: 1 (ReplayWitness)
- EXTRACT: 0
- CREATE_NEW: 0

**REUSE BEFORE CREATE COMPLIANCE:**
- 100% compliance - all proposed authorities already exist in JS.txt archive
- No new authorities need to be created
- All authorities can be reused from existing modules
- Primary Law (REUSE BEFORE CREATE) is fully satisfied

**EXTRACTION REQUIREMENTS:**
- Extract canonical_fingerprint_service.js for ArtifactFingerprint, StateFingerprint
- Extract deterministic_replay_harness.js for ReplayEngine, TranscriptFingerprint
- Extract execution_integrity_auditor.js for ReplayVerifier
- Extract merkle_anchor_replay_verifier.js for ReplayWitness (adapt from merkle-specific to general)
- Extract structural_graph_builder.js for LineageGraph
- Extract formal_invariant_graph_verifier.js for GraphFingerprint, InvariantRunner
- Extract authority_boundary_prover.js for WitnessProof

**ADAPTATION REQUIREMENTS:**
- ReplayWitness: Adapt merkle_anchor_replay_verifier.js from merkle-specific to general replay witness

**NO CREATE REQUIRED:**
- All proposed authorities already exist
- No new authorities need to be created
- Primary Law (REUSE BEFORE CREATE) is fully satisfied
