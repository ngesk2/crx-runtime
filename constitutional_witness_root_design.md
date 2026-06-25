# Constitutional Witness Root Design

**Design Date:** 2026-06-24
**Design Type:** Witness Root Planning
**Scope:** PING Constitutional Kernel
**Status:** DESIGN ONLY - No implementation
**Authority:** CONSTITUTIONAL_LAW

---

# Executive Summary

This document designs the constitutional witness root for the PING constitutional kernel. The witness root is a cryptographic root of trust that provides deterministic verification of constitutional document integrity, dependency relationships, and amendment history.

**Design Goal:** Create a tamper-evident, deterministic witness root for the 10 kernel constitutional documents.

---

# Design Objectives

## Primary Objectives

1. **Tamper Evidence:** Any modification to kernel documents must be detectable via witness root verification
2. **Determinism:** Witness root must be reproducible from the same document set
3. **Dependency Preservation:** Witness root must encode document dependency relationships
4. **Amendment Tracking:** Witness root must support amendment history without breaking continuity
5. **Infrastructure Independence:** Witness root must not depend on specific infrastructure or platforms

## Secondary Objectives

1. **Efficient Verification:** Witness root verification should be fast and resource-efficient
2. **Clear Semantics:** Witness root structure should be clear and auditable
3. **Extensibility:** Witness root design should support future constitutional documents
4. **Backward Compatibility:** Witness root should support historical constitutional versions

---

# Witness Root Architecture

## High-Level Design

The constitutional witness root is a Merkle tree constructed from:

1. **Document Hashes:** SHA256 hashes of all kernel constitutional documents
2. **Dependency Graph:** Encoded dependency relationships between documents
3. **Metadata:** Constitutional metadata (version, timestamp, authority class)
4. **Amendment Chain:** Historical amendment information

```
Witness Root
├── Document Hashes (Merkle Tree)
│   ├── TRUTH_LAW (6e3ee57f...)
│   ├── EVENT_LAW (4765d8ee...)
│   ├── IDENTITY_LAW (e34fb695...)
│   ├── MUTATION_LAW (173a30dc...)
│   ├── TIME_LAW (a7694158...)
│   ├── STATE_TRANSITION_LAW (29e9ca26...)
│   ├── REPLAY_LAW (48e610b7...)
│   ├── WITNESS_LAW (1693e1a5...)
│   ├── AUTHORITY_TAXONOMY_SPEC (1a787377...)
│   └── CONSTITUTION (f0712cb7...)
├── Dependency Graph (Hash-encoded)
├── Metadata (Hash-encoded)
└── Amendment Chain (Hash-encoded)
```

---

# Witness Root Construction Algorithm

## Step 1: Document Hash Collection

Collect SHA256 hashes of all kernel documents in canonical order:

```
Canonical Order (alphabetical by document_id):
1. AUTHORITY_TAXONOMY_SPEC (1a7873771e11b92187c50db087f5ee89d6e9d38fa6e3e4f4d1de6f363e95603c)
2. CONSTITUTION (f0712cb735c4550b5b93db86629bd11aabd641762a605d75af6dfecf4244dfaa)
3. EVENT_LAW (4765d8ee3c1d0aa8f796e174d3d3ae67210e74684d9d19731bdd76d4f68c306c)
4. IDENTITY_LAW (e34fb6957484efe1ead5db864fbee127c07f408e99a2014b6396b1dd2dfa1577)
5. MUTATION_LAW (173a30dcb2e3a65102b89380b54a6991c9e833e9030dfb4e48e94fb399af88ed)
6. REPLAY_LAW (48e610b710f7a161b118b660264c502f87bf7e1c5f569d012bedf3194c4a960b)
7. STATE_TRANSITION_LAW (29e9ca269221232368ce80aaba0e431d1911713f7b001dcccf678ffd4045d07d)
8. TIME_LAW (a76941589ab23b5fcdc0d68f8aa7860bd9f4748d892d8e659cef3166c3b70d9d)
9. TRUTH_LAW (6e3ee57fd969a50db97a4e408dbd3f97708b32b9c1d48ed626b4a76b5c079a48)
10. WITNESS_LAW (1693e1a559794a69aedb2e574b261b39da6a1f1c440b360c22a91851546bd48f)
```

## Step 2: Dependency Graph Hashing

Encode dependency graph as deterministic hash:

```
Dependency Graph Hash = SHA256(
    canonical_dependency_string
)

canonical_dependency_string = sorted_dependencies_as_json
```

Example dependency encoding:
```json
{
  "AUTHORITY_TAXONOMY_SPEC": ["TRUTH_LAW"],
  "CONSTITUTION": [],
  "EVENT_LAW": ["TRUTH_LAW"],
  "IDENTITY_LAW": ["TRUTH_LAW", "REPLAY_LAW"],
  "MUTATION_LAW": ["TRUTH_LAW", "STATE_TRANSITION_LAW"],
  "REPLAY_LAW": ["TRUTH_LAW"],
  "STATE_TRANSITION_LAW": ["TRUTH_LAW", "EVENT_LAW"],
  "TIME_LAW": ["TRUTH_LAW", "EVENT_LAW", "REPLAY_LAW"],
  "TRUTH_LAW": [],
  "WITNESS_LAW": ["TRUTH_LAW", "EVENT_LAW", "IDENTITY_LAW", "REPLAY_LAW"]
}
```

## Step 3: Metadata Hashing

Encode constitutional metadata as deterministic hash:

```json
{
  "version": "1.0",
  "kernel_documents": 10,
  "generated_date": "2026-06-24",
  "authority_class": "CONSTITUTIONAL_LAW",
  "canonical_order": [
    "AUTHORITY_TAXONOMY_SPEC",
    "CONSTITUTION",
    "EVENT_LAW",
    "IDENTITY_LAW",
    "MUTATION_LAW",
    "REPLAY_LAW",
    "STATE_TRANSITION_LAW",
    "TIME_LAW",
    "TRUTH_LAW",
    "WITNESS_LAW"
  ]
}
```

## Step 4: Merkle Tree Construction

Construct Merkle tree from document hashes:

```
Level 0 (Leaf Nodes):
- H1 = SHA256(AUTHORITY_TAXONOMY_SPEC_hash)
- H2 = SHA256(CONSTITUTION_hash)
- H3 = SHA256(EVENT_LAW_hash)
- H4 = SHA256(IDENTITY_LAW_hash)
- H5 = SHA256(MUTATION_LAW_hash)
- H6 = SHA256(REPLAY_LAW_hash)
- H7 = SHA256(STATE_TRANSITION_LAW_hash)
- H8 = SHA256(TIME_LAW_hash)
- H9 = SHA256(TRUTH_LAW_hash)
- H10 = SHA256(WITNESS_LAW_hash)

Level 1 (Internal Nodes):
- H11 = SHA256(H1 || H2)
- H12 = SHA256(H3 || H4)
- H13 = SHA256(H5 || H6)
- H14 = SHA256(H7 || H8)
- H15 = SHA256(H9 || H10)

Level 2 (Internal Nodes):
- H16 = SHA256(H11 || H12)
- H17 = SHA256(H13 || H14)

Level 3 (Internal Nodes):
- H18 = SHA256(H16 || H17)

Level 4 (Root):
- Witness_Root = SHA256(H18 || Dependency_Graph_Hash || Metadata_Hash)
```

## Step 5: Witness Root Finalization

Final witness root combines Merkle root with dependency and metadata hashes:

```
Witness_Root = SHA256(
    Merkle_Root || 
    Dependency_Graph_Hash || 
    Metadata_Hash
)
```

---

# Witness Root Verification Algorithm

## Verification Steps

1. **Document Hash Verification:** Verify each document's SHA256 hash matches registry
2. **Dependency Graph Verification:** Verify dependency graph hash matches witness root
3. **Metadata Verification:** Verify metadata hash matches witness root
4. **Merkle Path Verification:** Verify Merkle path from each document to witness root
5. **Witness Root Verification:** Verify computed witness root matches stored witness root

## Verification Output

Verification produces:
- **Overall Result:** passed/failed/partial
- **Document-Level Results:** per-document hash verification
- **Dependency Verification:** dependency graph integrity
- **Merkle Path Verification:** Merkle path validity
- **Verification Metadata:** timestamp, verifier, method

---

# Witness Root Storage

## Storage Locations

### Primary Storage
- **PostgreSQL Registry:** `constitutional_freeze_registry` table (add `witness_root_hash` column)
- **JSON Manifest:** `constitutional_hash_manifest.json` (add `witness_root_hash` field)

### Secondary Storage
- **Git Repository:** Witness root stored in git commit message or tag
- **Immutable Storage:** Witness root stored in vault/constitutional/immutable/

## Storage Schema

### PostgreSQL Schema Extension

```sql
ALTER TABLE constitutional_freeze_registry 
ADD COLUMN witness_root_hash CHAR(64);

-- Add index for witness root hash
CREATE INDEX idx_constitutional_freeze_registry_witness_root_hash 
ON constitutional_freeze_registry(witness_root_hash);

-- Add constraint
ALTER TABLE constitutional_freeze_registry 
ADD CONSTRAINT chk_witness_root_hash_length 
CHECK (witness_root_hash IS NULL OR LENGTH(witness_root_hash) = 64);

ALTER TABLE constitutional_freeze_registry 
ADD CONSTRAINT chk_witness_root_hash_hex 
CHECK (witness_root_hash IS NULL OR witness_root_hash ~ '^[a-f0-9]{64}$');
```

### JSON Manifest Extension

```json
{
  "witness_root_hash": "PLACEHOLDER_COMPUTED_HASH",
  "witness_root_algorithm": "SHA256_MERKLE",
  "witness_root_computed_at": "2026-06-24T00:00:00Z",
  "witness_root_metadata": {
    "merkle_tree_depth": 4,
    "leaf_nodes": 10,
    "dependency_graph_included": true,
    "metadata_included": true
  }
}
```

---

# Amendment Handling

## Amendment Witness Root

When a constitutional document is amended:

1. **New Document Hash:** Compute new SHA256 hash for amended document
2. **New Merkle Tree:** Reconstruct Merkle tree with new document hash
3. **New Dependency Graph:** Update dependency graph if dependencies changed
4. **New Metadata:** Update metadata (amendment count, date)
5. **New Witness Root:** Compute new witness root
6. **Amendment Chain:** Link new witness root to previous witness root

```
Amendment Chain:
Witness_Root_v0 (initial)
  ↓
Witness_Root_v1 (after amendment 1)
  ↓
Witness_Root_v2 (after amendment 2)
  ↓
...
```

## Amendment Verification

To verify amended constitution:

1. **Verify Current Witness Root:** Verify current witness root against current documents
2. **Verify Amendment Chain:** Verify each amendment step in chain
3. **Verify Continuity:** Verify constitutional continuity through amendments
4. **Verify Compliance:** Verify amendments comply with constitutional law

---

# Implementation Requirements

## Required Components

1. **Witness Root Calculator:** Python/TypeScript module to compute witness root
2. **Witness Root Verifier:** Python/TypeScript module to verify witness root
3. **Merkle Tree Library:** Library for Merkle tree construction and verification
4. **Dependency Graph Encoder:** Module to encode dependency graph as hash
5. **Metadata Encoder:** Module to encode metadata as hash

## Implementation Priority

1. **High Priority:** Witness root calculator and verifier
2. **Medium Priority:** Merkle tree library integration
3. **Low Priority:** Dependency and metadata encoders (can be simple JSON)

## Implementation Language

- **Primary:** Python (for calculation and verification)
- **Secondary:** TypeScript (for runtime integration)

---

# Security Considerations

## Threat Model

### Threats Addressed

1. **Document Tampering:** Witness root detects any document modification
2. **Dependency Tampering:** Witness root detects dependency graph modification
3. **Metadata Tampering:** Witness root detects metadata modification
4. **Amendment Fraud:** Witness root chain detects fraudulent amendments
5. **Rollback Attacks:** Witness root chain prevents rollback attacks

### Threats Not Addressed

1. **Compromise of Registry:** If registry is compromised, witness root verification fails
2. **Compromise of Vault:** If vault is compromised, witness root verification fails
3. **Compromise of Calculator:** If calculator is compromised, witness root may be incorrect

## Mitigation Strategies

1. **Multiple Storage Locations:** Store witness root in multiple independent locations
2. **Independent Verification:** Verify witness root using independent calculators
3. **Audit Trail:** Maintain audit trail of witness root calculations
4. **Cross-Verification:** Cross-verify witness root against multiple sources

---

# Performance Considerations

## Calculation Performance

- **Document Hashing:** O(n) where n is number of documents
- **Merkle Tree Construction:** O(n) where n is number of documents
- **Dependency Graph Hashing:** O(e) where e is number of dependencies
- **Metadata Hashing:** O(1)
- **Total Calculation:** O(n + e)

For 10 kernel documents with ~20 dependencies:
- Estimated calculation time: < 100ms
- Estimated memory usage: < 10MB

## Verification Performance

- **Document Hash Verification:** O(n)
- **Merkle Path Verification:** O(log n)
- **Dependency Verification:** O(e)
- **Metadata Verification:** O(1)
- **Total Verification:** O(n + e + log n)

For 10 kernel documents:
- Estimated verification time: < 50ms
- Estimated memory usage: < 5MB

---

# Testing Strategy

## Unit Tests

1. **Document Hashing Tests:** Test SHA256 hashing of documents
2. **Merkle Tree Tests:** Test Merkle tree construction and verification
3. **Dependency Hashing Tests:** Test dependency graph encoding
4. **Metadata Hashing Tests:** Test metadata encoding
5. **Witness Root Tests:** Test witness root calculation

## Integration Tests

1. **End-to-End Calculation:** Test full witness root calculation
2. **End-to-End Verification:** Test full witness root verification
3. **Amendment Chain Tests:** Test amendment chain construction
4. **Registry Integration Tests:** Test integration with PostgreSQL registry

## Regression Tests

1. **Known Witness Root Test:** Verify witness root matches known value
2. **Known Amendment Test:** Verify amendment chain matches known history
3. **Cross-Platform Test:** Verify witness root is same across platforms

---

# Open Questions

1. **Witness Root Storage:** Should witness root be stored in git tags or commit messages?
2. **Amendment Granularity:** Should each amendment have its own witness root or batch amendments?
3. **Dependency Graph Versioning:** How to version dependency graph changes?
4. **Metadata Versioning:** How to version metadata changes?
5. **Witness Root Rotation:** When and how to rotate witness root?

---

# Next Steps

1. **Implement Witness Root Calculator:** Create Python module for witness root calculation
2. **Implement Witness Root Verifier:** Create Python module for witness root verification
3. **Integrate with Registry:** Add witness root hash to PostgreSQL registry
4. **Generate Initial Witness Root:** Compute initial witness root for kernel documents
5. **Create Verification Pipeline:** Create automated verification pipeline

---

**Design Status:** COMPLETE
**Next Phase:** Phase 8 - Agent Exposure Audit
