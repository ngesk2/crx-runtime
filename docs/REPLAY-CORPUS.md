# REPLAY CORPUS

**Corpus Date:** 2026-06-07  
**Protocol:** CRX-CONSTITUTIONAL-EXECUTION-READINESS-AUDIT  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** Replay corpus structure is proposed for tests/replay/corpus/.

**FACT:** Replay corpus defines measurable replay determinism.

**FACT:** Replay corpus specification includes INPUT_STREAM, EXPECTED_CANONICAL_BYTES, EXPECTED_HASH, EXPECTED_LINEAGE, EXPECTED_STATE, EXPECTED_WITNESS_ROOT.

**INFERENCE:** Replay corpus enables deterministic replay verification.

**RECOMMENDATION:** Implement replay corpus structure before infrastructure expansion.

---

## Replay Corpus Structure

### Directory Structure

```
tests/replay/corpus/
├── simple_artifact_commit/
│   ├── INPUT_STREAM.json
│   ├── EXPECTED_CANONICAL_BYTES.json
│   ├── EXPECTED_HASH.json
│   ├── EXPECTED_LINEAGE.json
│   ├── EXPECTED_STATE.json
│   └── EXPECTED_WITNESS_ROOT.json
├── multi_artifact_commit/
│   ├── INPUT_STREAM.json
│   ├── EXPECTED_CANONICAL_BYTES.json
│   ├── EXPECTED_HASH.json
│   ├── EXPECTED_LINEAGE.json
│   ├── EXPECTED_STATE.json
│   └── EXPECTED_WITNESS_ROOT.json
└── complex_lineage/
    ├── INPUT_STREAM.json
    ├── EXPECTED_CANONICAL_BYTES.json
    ├── EXPECTED_HASH.json
    ├── EXPECTED_LINEAGE.json
    ├── EXPECTED_STATE.json
    └── EXPECTED_WITNESS_ROOT.json
```

**Classification:** CORPUS_STRUCTURE

---

## Corpus Specification

### INPUT_STREAM

**Purpose:** Define input event stream for replay

**Format:** JSON array of events

**Example:**
```json
[
  {
    "event_id": "evt-001",
    "event_type": "artifact_commit",
    "event_version": "1.0",
    "actor_id": "actor-001",
    "timestamp": "2026-06-07T00:00:00Z",
    "payload": {
      "artifact_id": "artifact-001",
      "artifact_content": "base64_encoded_content"
    },
    "lineage": {
      "parent_ids": []
    },
    "schema_hash": "sha256:abc123",
    "replay_version": "1.0",
    "policy_version": "1.0"
  }
]
```

**Classification:** INPUT_SPECIFICATION

---

### EXPECTED_CANONICAL_BYTES

**Purpose:** Define expected canonical bytes after canonicalization

**Format:** JSON object with canonical bytes

**Example:**
```json
{
  "canonical_bytes": "base64_encoded_canonical_bytes",
  "canonicalization_version": "1.0"
}
```

**Classification:** CANONICAL_SPECIFICATION

---

### EXPECTED_HASH

**Purpose:** Define expected hash after canonicalization

**Format:** JSON object with hash

**Example:**
```json
{
  "hash": "sha256:def456",
  "hash_algorithm": "sha256",
  "hash_version": "1.0"
}
```

**Classification:** HASH_SPECIFICATION

---

### EXPECTED_LINEAGE

**Purpose:** Define expected lineage after replay

**Format:** JSON object with lineage edges

**Example:**
```json
{
  "lineage_edges": [
    {
      "parent_id": "artifact-001",
      "child_id": "artifact-002",
      "edge_type": "derivation"
    }
  ],
  "lineage_version": "1.0"
}
```

**Classification:** LINEAGE_SPECIFICATION

---

### EXPECTED_STATE

**Purpose:** Define expected state after replay

**Format:** JSON object with state

**Example:**
```json
{
  "state": {
    "artifacts": [
      {
        "artifact_id": "artifact-001",
        "artifact_hash": "sha256:def456",
        "artifact_lineage": []
      }
    ],
    "state_version": "1.0"
  }
}
```

**Classification:** STATE_SPECIFICATION

---

### EXPECTED_WITNESS_ROOT

**Purpose:** Define expected witness root after replay

**Format:** JSON object with witness root

**Example:**
```json
{
  "witness_root": "sha256:ghi789",
  "witness_algorithm": "merkle",
  "witness_version": "1.0"
}
```

**Classification:** WITNESS_SPECIFICATION

---

## Replay Determinism Measurement

### Measurement Method 1: Canonical Bytes Comparison

**Method:** Compare actual canonical bytes with expected canonical bytes

**Success Criteria:** Actual canonical bytes == Expected canonical bytes

**Classification:** CANONICAL_DETERMINISM_MEASUREMENT

---

### Measurement Method 2: Hash Comparison

**Method:** Compare actual hash with expected hash

**Success Criteria:** Actual hash == Expected hash

**Classification:** HASH_DETERMINISM_MEASUREMENT

---

### Measurement Method 3: Lineage Comparison

**Method:** Compare actual lineage with expected lineage

**Success Criteria:** Actual lineage == Expected lineage

**Classification:** LINEAGE_DETERMINISM_MEASUREMENT

---

### Measurement Method 4: State Comparison

**Method:** Compare actual state with expected state

**Success Criteria:** Actual state == Expected state

**Classification:** STATE_DETERMINISM_MEASUREMENT

---

### Measurement Method 5: Witness Root Comparison

**Method:** Compare actual witness root with expected witness root

**Success Criteria:** Actual witness root == Expected witness root

**Classification:** WITNESS_DETERMINISM_MEASUREMENT

---

## Replay Determinism Verification

### Verification Process

**Step 1:** Load INPUT_STREAM

**Step 2:** Replay events through canonicalization

**Step 3:** Compare actual canonical bytes with EXPECTED_CANONICAL_BYTES

**Step 4:** Compare actual hash with EXPECTED_HASH

**Step 5:** Compare actual lineage with EXPECTED_LINEAGE

**Step 6:** Compare actual state with EXPECTED_STATE

**Step 7:** Compare actual witness root with EXPECTED_WITNESS_ROOT

**Step 8:** If all comparisons pass, replay determinism is verified

**Classification:** VERIFICATION_PROCESS

---

## Final Classification

**FACT:** Replay corpus structure is proposed for tests/replay/corpus/

**FACT:** Replay corpus defines measurable replay determinism

**FACT:** Replay corpus specification includes 6 components

**FACT:** 5 measurement methods are defined

**FACT:** Verification process is defined

**INFERENCE:** Replay corpus enables deterministic replay verification

**RECOMMENDATION:** Implement replay corpus structure before infrastructure expansion
