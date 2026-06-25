# Witness Replay Validation

**Design Date:** 2026-06-24
**Design Type:** Constitutional Enforcement Mechanism
**Scope:** Independent Witness Replay Validation Suite
**Status:** DESIGN ONLY - No implementation
**Authority:** CONSTITUTIONAL_LAW

---

# Executive Summary

This design implements an independent witness replay validation suite that ensures identical witness roots are generated across different environments (Machine A, Machine B, Fresh Install, Fresh Database). This validates the determinism of the witness root architecture.

**Blocking Issue Addressed:** Witness Root Replay Correctness (No Event Order, No Replay State Verification)
**Constitutional Violations Resolved:** WITNESS_LAW.md (witness should verify replay)

---

# Current Vulnerability

## Existing Witness Root Design

**Current witness root design lacks replay validation:**
- No independent replay validation
- No cross-machine verification
- No fresh install verification
- No fresh database verification
- Witness root may not be deterministic across environments

**Vulnerability:**
- Witness root may differ between machines
- Witness root may differ between installs
- Witness root may differ between databases
- No verification of witness root determinism
- Partial violation of WITNESS_LAW.md (witness should verify replay)

---

# Design Objectives

## Primary Objectives

1. **Independent Replay Validation:** Validate witness root across independent environments
2. **Cross-Machine Verification:** Verify identical witness roots on different machines
3. **Fresh Install Verification:** Verify identical witness roots on fresh installs
4. **Fresh Database Verification:** Verify identical witness roots on fresh databases
5. **Determinism Proof:** Prove witness root is deterministic

## Secondary Objectives

1. **Validation Suite:** Implement automated validation suite
2. **Regression Testing:** Run validation suite on changes
3. **CI/CD Integration:** Integrate validation suite into CI/CD

---

# Witness Replay Validation Architecture

## Validation Environments

### Environment 1: Machine A (Production)

```python
def validate_witness_on_machine_a():
    """
    Validate witness root on Machine A (production environment).
    """
    # Load constitutional documents
    documents = load_constitutional_documents()
    
    # Compute witness root
    witness_root = compute_witness_root(documents)
    
    # Store witness root
    store_witness_root('machine_a', witness_root)
    
    return witness_root
```

### Environment 2: Machine B (Staging)

```python
def validate_witness_on_machine_b():
    """
    Validate witness root on Machine B (staging environment).
    """
    # Load constitutional documents
    documents = load_constitutional_documents()
    
    # Compute witness root
    witness_root = compute_witness_root(documents)
    
    # Store witness root
    store_witness_root('machine_b', witness_root)
    
    return witness_root
```

### Environment 3: Fresh Install (Clean System)

```python
def validate_witness_on_fresh_install():
    """
    Validate witness root on fresh install (clean system).
    """
    # Install PING from scratch
    install_ping_fresh()
    
    # Load constitutional documents
    documents = load_constitutional_documents()
    
    # Compute witness root
    witness_root = compute_witness_root(documents)
    
    # Store witness root
    store_witness_root('fresh_install', witness_root)
    
    return witness_root
```

### Environment 4: Fresh Database (Empty Database)

```python
def validate_witness_on_fresh_database():
    """
    Validate witness root on fresh database (empty database).
    """
    # Create fresh database
    create_fresh_database()
    
    # Seed constitutional documents
    seed_constitutional_documents()
    
    # Load constitutional documents
    documents = load_constitutional_documents()
    
    # Compute witness root
    witness_root = compute_witness_root(documents)
    
    # Store witness root
    store_witness_root('fresh_database', witness_root)
    
    return witness_root
```

---

# Deterministic Witness Root Computation

## Canonical Document Loading

```python
def load_constitutional_documents_canonical():
    """
    Load constitutional documents in canonical order.
    
    Constitutional: Document order must be deterministic.
    """
    # Load constitutional hash manifest
    with open('constitutional_hash_manifest.json', 'r') as f:
        manifest = json.load(f)
    
    # Sort documents by document_id (canonical order)
    document_ids = sorted(manifest.keys())
    
    documents = []
    for document_id in document_ids:
        doc_info = manifest[document_id]
        file_path = doc_info['file_path']
        
        # Load document content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        documents.append({
            'document_id': document_id,
            'file_path': file_path,
            'content': content,
            'sha256_hash': doc_info['sha256_hash']
        })
    
    return documents
```

## Deterministic Witness Root Computation

```python
def compute_witness_root_deterministic(documents: List[Dict[str, Any]]) -> str:
    """
    Compute witness root deterministically.
    
    Constitutional: Witness root must be deterministic across environments.
    """
    # Step 1: Compute document hashes (canonical order)
    document_hashes = []
    for doc in sorted(documents, key=lambda x: x['document_id']):
        canonical = json.dumps(doc['content'], sort_keys=True, separators=(',', ':'))
        hash = hashlib.sha256(canonical.encode()).hexdigest()
        document_hashes.append(hash)
    
    # Step 2: Encode dependency graph (canonical JSON)
    dependency_graph = build_dependency_graph_canonical()
    dependency_graph_json = json.dumps(dependency_graph, sort_keys=True, separators=(',', ':'))
    dependency_graph_hash = hashlib.sha256(dependency_graph_json.encode()).hexdigest()
    
    # Step 3: Encode metadata (canonical JSON)
    metadata = {
        'version': '1.0',
        'kernel_documents': len(documents),
        'generated_date': '2026-06-24',
        'authority_class': 'CONSTITUTIONAL_LAW',
        'canonical_order': sorted([doc['document_id'] for doc in documents])
    }
    metadata_json = json.dumps(metadata, sort_keys=True, separators=(',', ':'))
    metadata_hash = hashlib.sha256(metadata_json.encode()).hexdigest()
    
    # Step 4: Construct Merkle tree (deterministic padding)
    merkle_root = build_merkle_tree_deterministic(document_hashes)
    
    # Step 5: Compute witness root (deterministic concatenation)
    witness_root_input = merkle_root + dependency_graph_hash + metadata_hash
    witness_root = hashlib.sha256(witness_root_input.encode()).hexdigest()
    
    return witness_root
```

## Deterministic Merkle Tree Construction

```python
def build_merkle_tree_deterministic(hashes: List[str]) -> str:
    """
    Build Merkle tree deterministically.
    
    Constitutional: Merkle tree must be deterministic across environments.
    """
    # Convert hashes to bytes
    leaf_nodes = [hashlib.sha256(h.encode()).digest() for h in hashes]
    
    # Build Merkle tree with deterministic padding
    while len(leaf_nodes) > 1:
        # If odd number of nodes, duplicate last node (deterministic padding)
        if len(leaf_nodes) % 2 == 1:
            leaf_nodes.append(leaf_nodes[-1])
        
        # Compute next level
        internal_nodes = []
        for i in range(0, len(leaf_nodes), 2):
            combined = leaf_nodes[i] + leaf_nodes[i+1]
            internal_nodes.append(hashlib.sha256(combined).digest())
        
        leaf_nodes = internal_nodes
    
    # Return root as hex string
    return leaf_nodes[0].hex()
```

---

# Cross-Environment Validation

## Validation Suite

```python
def run_witness_validation_suite():
    """
    Run witness validation suite across all environments.
    
    Returns validation results.
    """
    results = {}
    
    # Validate on Machine A
    results['machine_a'] = validate_witness_on_machine_a()
    
    # Validate on Machine B
    results['machine_b'] = validate_witness_on_machine_b()
    
    # Validate on Fresh Install
    results['fresh_install'] = validate_witness_on_fresh_install()
    
    # Validate on Fresh Database
    results['fresh_database'] = validate_witness_on_fresh_database()
    
    # Compare witness roots
    validation_result = compare_witness_roots(results)
    
    return validation_result
```

## Witness Root Comparison

```python
def compare_witness_roots(results: Dict[str, str]) -> Dict[str, Any]:
    """
    Compare witness roots across environments.
    
    Returns validation result.
    """
    witness_roots = list(results.values())
    
    # Check if all witness roots are identical
    all_identical = len(set(witness_roots)) == 1
    
    if all_identical:
        validation_result = {
            'status': 'passed',
            'witness_root': witness_roots[0],
            'environments': list(results.keys()),
            'message': 'All witness roots are identical'
        }
    else:
        validation_result = {
            'status': 'failed',
            'witness_roots': results,
            'environments': list(results.keys()),
            'message': 'Witness roots differ across environments'
        }
    
    # Emit validation event
    emit_event('validation', 'WITNESS_ROOT_VALIDATION', {
        'status': validation_result['status'],
        'witness_roots': results,
        'validated_at': datetime.utcnow().isoformat()
    })
    
    return validation_result
```

---

# Replay State Verification

## Replay State Hash

```python
def compute_replay_state_hash(event_order_index: int) -> str:
    """
    Compute replay state hash at given event order index.
    
    Constitutional: Replay state must be deterministic.
    """
    # Replay events up to event_order_index
    replay_state = replay_events_with_order(0, event_order_index)
    
    # Compute state hash
    canonical = json.dumps(replay_state, sort_keys=True, separators=(',', ':'))
    state_hash = hashlib.sha256(canonical.encode()).hexdigest()
    
    return state_hash
```

## Witness Root with Replay State

```python
def compute_witness_root_with_replay_state(documents: List[Dict[str, Any]], event_order_index: int) -> str:
    """
    Compute witness root including replay state hash.
    
    Constitutional: Witness root must include replay state for correctness proof.
    """
    # Compute document hashes
    document_hashes = [compute_document_hash(doc) for doc in documents]
    
    # Compute dependency graph hash
    dependency_graph_hash = compute_dependency_graph_hash()
    
    # Compute metadata hash
    metadata_hash = compute_metadata_hash(documents)
    
    # Compute replay state hash
    replay_state_hash = compute_replay_state_hash(event_order_index)
    
    # Compute Merkle root
    merkle_root = build_merkle_tree_deterministic(document_hashes)
    
    # Compute witness root with replay state
    witness_root_input = merkle_root + dependency_graph_hash + metadata_hash + replay_state_hash
    witness_root = hashlib.sha256(witness_root_input.encode()).hexdigest()
    
    return witness_root
```

---

# Validation Suite Implementation

## Automated Validation Script

```python
#!/usr/bin/env python3
"""
Witness Replay Validation Suite

Validates that witness roots are identical across:
- Machine A (production)
- Machine B (staging)
- Fresh Install (clean system)
- Fresh Database (empty database)
"""

import sys
import json
from datetime import datetime

def main():
    """Run witness validation suite."""
    print("Starting Witness Replay Validation Suite")
    print("=" * 60)
    
    # Run validation suite
    results = run_witness_validation_suite()
    
    # Print results
    print(f"Validation Status: {results['status']}")
    print(f"Environments: {results['environments']}")
    
    if results['status'] == 'passed':
        print(f"Witness Root: {results['witness_root']}")
        print("✓ All witness roots are identical")
        sys.exit(0)
    else:
        print("✗ Witness roots differ across environments")
        print("Witness Roots:")
        for env, root in results['witness_roots'].items():
            print(f"  {env}: {root}")
        sys.exit(1)

if __name__ == '__main__':
    main()
```

---

# CI/CD Integration

## GitHub Actions Workflow

```yaml
name: Witness Replay Validation

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  validate-witness:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [machine-a, machine-b, fresh-install, fresh-database]
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
    
    - name: Run witness validation
      run: |
        python witness_validation_suite.py --environment ${{ matrix.environment }}
    
    - name: Compare witness roots
      run: |
        python compare_witness_roots.py
```

---

# Security Event Emission

## WITNESS_ROOT_MISMATCH Event

```json
{
  "stream": "security",
  "event_type": "WITNESS_ROOT_MISMATCH",
  "payload": {
    "witness_roots": {
      "machine_a": "abc123...",
      "machine_b": "def456...",
      "fresh_install": "ghi789...",
      "fresh_database": "jkl012..."
    },
    "detected_at": "2026-06-24T00:00:00Z",
    "blocked": true
  }
}
```

---

# Implementation Requirements

## Required Changes

1. **Implement load_constitutional_documents_canonical()** function
2. **Implement compute_witness_root_deterministic()** function
3. **Implement build_merkle_tree_deterministic()** function
4. **Implement validate_witness_on_machine_a()** function
5. **Implement validate_witness_on_machine_b()** function
6. **Implement validate_witness_on_fresh_install()** function
7. **Implement validate_witness_on_fresh_database()** function
8. **Implement run_witness_validation_suite()** function
9. **Implement compare_witness_roots()** function
10. **Implement compute_replay_state_hash()** function
11. **Implement compute_witness_root_with_replay_state()** function
12. **Implement automated validation script**
13. **Integrate validation suite into CI/CD**
14. **Emit security events** for witness root mismatches

## Optional Changes

1. **Implement validation dashboard** for monitoring
2. **Implement validation notification system** for failures
3. **Implement validation history tracking** for audit

---

# Testing Strategy

## Unit Tests

1. **load_constitutional_documents_canonical() Test:** Test canonical document loading
2. **compute_witness_root_deterministic() Test:** Test deterministic witness root computation
3. **build_merkle_tree_deterministic() Test:** Test deterministic Merkle tree construction
4. **compare_witness_roots() Test:** Test witness root comparison

## Integration Tests

1. **Cross-Machine Validation Test:** Test validation across machines
2. **Fresh Install Validation Test:** Test validation on fresh install
3. **Fresh Database Validation Test:** Test validation on fresh database

## Regression Tests

1. **Determinism Test:** Verify witness root is deterministic
2. **Replay State Test:** Verify replay state hash is included
3. **CI/CD Test:** Verify CI/CD integration works

---

# Compliance Matrix

| Requirement | Current State | Target State | Implementation |
|-------------|---------------|--------------|----------------|
| Independent replay validation | No validation | Validation required | run_witness_validation_suite() |
| Cross-machine verification | No verification | Verification required | validate_witness_on_machine_a/b() |
| Fresh install verification | No verification | Verification required | validate_witness_on_fresh_install() |
| Fresh database verification | No verification | Verification required | validate_witness_on_fresh_database() |
| Determinism proof | No proof | Proof required | compute_witness_root_deterministic() |
| Replay state verification | No replay state | Replay state required | compute_witness_root_with_replay_state() |
| CI/CD integration | No integration | Integration required | GitHub Actions workflow |
| Security events | No security events | Security events emitted | Emit WITNESS_ROOT_MISMATCH |

---

# Migration Path

## Phase 1: Deterministic Computation

1. Implement load_constitutional_documents_canonical()
2. Implement compute_witness_root_deterministic()
3. Implement build_merkle_tree_deterministic()
4. Deploy to staging
5. Test deterministic computation

## Phase 2: Cross-Environment Validation

1. Implement validate_witness_on_machine_a()
2. Implement validate_witness_on_machine_b()
3. Implement validate_witness_on_fresh_install()
4. Implement validate_witness_on_fresh_database()
5. Deploy to staging
6. Test cross-environment validation

## Phase 3: Validation Suite

1. Implement run_witness_validation_suite()
2. Implement compare_witness_roots()
3. Implement automated validation script
4. Deploy to staging
5. Test validation suite

## Phase 4: Replay State Verification

1. Implement compute_replay_state_hash()
2. Implement compute_witness_root_with_replay_state()
3. Update witness root computation to include replay state
4. Deploy to staging
5. Test replay state verification

## Phase 5: CI/CD Integration

1. Implement GitHub Actions workflow
2. Integrate validation suite into CI/CD
3. Deploy to production
4. Test CI/CD integration

## Phase 6: Security Events

1. Implement security event emission
2. Update validation to emit security events
3. Deploy to staging
4. Test security event emission

## Phase 7: Production Deployment

1. Deploy deterministic computation to production
2. Deploy cross-environment validation to production
3. Deploy validation suite to production
4. Deploy replay state verification to production
5. Deploy CI/CD integration to production
6. Monitor validation results
7. Monitor security events

---

**Design Status:** COMPLETE
**Next Phase:** ADDITIONAL 1 - Hash Sovereignty Guard
