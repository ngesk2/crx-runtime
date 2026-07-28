# Constitutional Snapshot Specification

**Document Type:** Architecture Specification
**Status:** DRAFT (not yet implemented)
**Date:** 2026-06-24
**Runtime:** brain-constitution-runner (snapshot submodule)

---

## 1. Purpose

Every constitutional state must be reproducible. Signed snapshots provide deterministic, verifiable checkpoints of the entire constitutional framework. Git commits become constitutional witnesses.

---

## 2. Snapshot Schema

```yaml
constitutional_snapshot:
  version: 1
  
  constitution_version: string          # Semver of constitutional framework
  timestamp: timestamptz                # When snapshot was created
  
  law_hashes:                           # SHA-256 per constitutional document
    - document_id: string
      path: string
      sha256: string
  
  dependency_graph_hash: string         # SHA-256 of dependency_graph.json
  authority_graph_hash: string          # SHA-256 of authority_graph.json
  primitive_registry_hash: string       # SHA-256 of primitive_registry.json
  truth_registry_hash: string           # SHA-256 of truth_registry.json
  
  witness_hash: string                  # Root hash of snapshot Merkle tree
  signer: string                        # Who signed (governance agent / CI)
  snapshot_signature: string            # Signature over witness_hash
  
  provenance:
    compiler_version: string            # Which brain-constitution-runner version
    compiler_input_hash: string         # SHA-256 of all input documents
    commit_hash: string                 # Git commit associated with snapshot
    branch: string                      # Git branch
```

---

## 3. Snapshot Construction

### 3.1 Hash Computation

```yaml
construction:
  step_1_collect_law_hashes:
    input: all constitutional markdown files
    output: law_hashes[]  # SHA-256 per file, sorted by document_id
    algorithm: |
      for each file in constitution/**/*.md:
        content = read_file(file)
        sha256 = SHA256(content)
        law_hashes.append({document_id, path, sha256})
      sort(law_hashes, by document_id)
    
  step_2_build_registries:
    input: law_hashes + constitutional compiler (CONSTITUTION_COMPILER_SPEC.md)
    output: dependency_graph.json, authority_graph.json, primitive_registry.json, truth_registry.json
    algorithm: |
      Run constitutional compiler pipeline
      Hash each output artifact with SHA-256
    
  step_3_compute_witness:
    input: law_hashes[] + all registry hashes
    output: witness_hash (Merkle root)
    algorithm: |
      leaves = []
      for each hash in [law_hashes_hash, dependency_graph_hash, 
                        authority_graph_hash, primitive_registry_hash,
                        truth_registry_hash]:
        leaves.append(hash)
      
      # Merkle tree construction
      while len(leaves) > 1:
        if len(leaves) % 2 == 1:
          leaves.append(leaves[-1])  # Duplicate odd node
        new_level = []
        for i in range(0, len(leaves), 2):
          combined = leaves[i] + leaves[i+1]
          new_level.append(SHA256(combined))
        leaves = new_level
      
      witness_hash = leaves[0]  # Merkle root
    
  step_4_sign:
    input: witness_hash
    output: snapshot_signature
    algorithm: |
      signature = SIGN(witness_hash, governance_private_key)
      # Signature scheme: Ed25519 (recommended)
      # Key management: Vault PKI (runtime/security)
```

### 3.2 Snapshot Witness Structure

The snapshot witness is a Merkle tree:

```
                    ┌─────────────────────────────────────┐
                    │         witness_hash                │
                    │    (SHA-256 of level 1)             │
                    └────────────────┬────────────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
            ▼                        ▼                        ▼
    ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
    │  law_hashes  │        │ registry     │        │   padding    │
    │  hash        │        │ hashes       │        │   (if odd)   │
    │              │        │ (concatenated)│       │              │
    └──────────────┘        └──────────────┘        └──────────────┘
            │                        │
    ┌───────┼───────┐        ┌───────┼───────┐
    │       │       │        │       │       │
    ▼       ▼       ▼        ▼       ▼       ▼
  law1    law2    ...     dep     auth    prim   truth
 hash    hash           graph   graph   registry registry
                        hash    hash    hash    hash
```

---

## 4. Snapshot Storage

```yaml
storage:
  format: JSON (canonical, RFC 8785)
  filename: constitutional_snapshot_<timestamp>.json
  location: vault/constitutional/snapshots/
  
  git_integration:
    commit_message: |
      constitutional snapshot v{version}
      witness: {witness_hash}
      signature: {truncated_signature}
    staging: vault/constitutional/snapshots/latest.json (symlink)

  history:
    retention: all (append-only, never delete)
    rotation: timestamped per snapshot
```

---

## 5. Snapshot Verification

```yaml
verification:
  recompute:
    - Re-read all constitutional documents
    - Re-run constitutional compiler
    - Re-compute witness hash
    - Compare with stored witness_hash
  
  signature_check:
    - Verify snapshot_signature against signer's public key
    - Confirm signer is authorized governance agent
  
  divergence_detection:
    if recomputed_witness != stored_witness:
      constitutional_incident: true
      incident_type: CONSTITUTIONAL_STATE_DIVERGENCE
      action: Investigate which documents changed without governance approval
```

---

## 6. Git Integration

```yaml
git_workflow:
  pre_commit:
    - Run constitutional compiler
    - Generate snapshot
    - Verify snapshot witness matches expected state
    - If witness changed without governance approval: BLOCK COMMIT
  
  post_commit:
    - Store snapshot in vault/constitutional/snapshots/
    - Update latest.json symlink
    - Record commit_hash in snapshot provenance
  
  CI:
    - On every push: verify snapshot integrity
    - On every PR: verify witness matches PR changes
    - On merge: re-sign snapshot with governance key
```

### 6.1 Commit as Witness

Every git commit that changes constitutional state becomes a constitutional witness:

```yaml
commit_witness:
  commit_hash:           # Git commit SHA
  snapshot_witness:      # constitutional witness_hash
  relation:              
    commit_hash is a constitutional witness for snapshot_witness
    snapshot_witness is a constitutional witness for all documents
```

---

## 7. Versioning

```yaml
versioning:
  constitution_version:
    format: MAJOR.MINOR.PATCH
    major: breaking constitutional change (new root law)
    minor: amendment or new law
    patch: clarification or fix
  
  compiler_version:
    format: MAJOR.MINOR.PATCH
    major: breaking output format change
    minor: new feature or validator
    patch: bug fix

  snapshot_schema_version:
    current: 1
    upgrade: constitutional amendment required
```

---

## 8. Error Handling

| Error | Severity | Action |
|-------|----------|--------|
| Witness mismatch | CRITICAL | Constitutional incident, block all operations |
| Signature invalid | CRITICAL | Constitutional incident, revoke signer key |
| Snapshot file corrupt | HIGH | Re-compute from source documents |
| Missing snapshot | MEDIUM | Generate new snapshot, log warning |
| Non-canonical JSON | MEDIUM | Re-serialize, log warning |

---

## 9. Relationship to Other Documents

- **CONSTITUTION_COMPILER_SPEC.md** — Snapshot consumes compiler output
- **AUTHORITY_GRAPH_VALIDATOR_SPEC.md** — Snapshot includes validation report hash
- **REPLAY_LAW.md** — Snapshot determinism must match replay determinism
- **TRUTH_LAW.md** — Snapshot is derived truth (deterministic projection)

---

**Document ID:** CONSTITUTIONAL-SNAPSHOT-SPEC-1.0
**Status:** DRAFT
**Next Step:** Implement snapshot builder in brain-constitution-runner
