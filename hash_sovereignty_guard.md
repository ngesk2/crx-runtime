# Hash Sovereignty Guard

**Design Date:** 2026-06-24
**Design Type:** Constitutional Enforcement Mechanism
**Scope:** Every Constitutional Document Load
**Status:** DESIGN ONLY - No implementation
**Authority:** CONSTITUTIONAL_LAW

---

# Executive Summary

This design implements a hash sovereignty guard that verifies SHA256 hashes against the constitutional hash manifest on every constitutional document load. The guard rejects mismatches and emits security events.

**Additional Hardening:** Hash Sovereignty Guard
**Constitutional Violations Resolved:** TRUTH_LAW.md (truth corruption), IDENTITY_LAW.md (identity spoofing)

---

# Current Vulnerability

## Existing Document Loading

**Current document loading has no hash verification:**
```python
# Current code loads documents without hash verification
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
```

**Vulnerability:**
- No hash verification on document load
- Tampered documents can be loaded
- No detection of document corruption
- No security event emission on hash mismatch
- Violates TRUTH_LAW.md (truth corruption)
- Violates IDENTITY_LAW.md (identity spoofing)

---

# Design Objectives

## Primary Objectives

1. **Hash Verification:** Verify SHA256 hash on every constitutional document load
2. **Manifest Comparison:** Compare computed hash against constitutional hash manifest
3. **Mismatch Rejection:** Reject documents with hash mismatches
4. **Security Events:** Emit security events on hash mismatches

## Secondary Objectives

1. **Automatic Enforcement:** Enforce hash verification automatically
2. **Runtime Integration:** Integrate with all document loading paths
3. **Audit Trail:** Log all hash verification attempts

---

# Hash Sovereignty Guard Architecture

## Hash Verification Function

```python
def verify_document_hash_sovereignty(file_path: str, document_id: str) -> bool:
    """
    Verify document hash against constitutional hash manifest.
    
    Constitutional: Every constitutional document load must verify hash.
    
    Returns True if hash matches, False otherwise.
    """
    try:
        # Load constitutional hash manifest
        with open('constitutional_hash_manifest.json', 'r') as f:
            manifest = json.load(f)
        
        # Compute document hash
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        canonical = json.dumps(content, sort_keys=True, separators=(',', ':'))
        computed_hash = hashlib.sha256(canonical.encode()).hexdigest()
        
        # Get expected hash from manifest
        expected_hash = None
        for doc_id, doc_info in manifest.items():
            if doc_id == document_id:
                expected_hash = doc_info.get('sha256_hash')
                break
        
        if not expected_hash:
            logger.warning(f"Document {document_id} not found in hash manifest")
            emit_event('security', 'HASH_MANIFEST_MISSING', {
                'document_id': document_id,
                'file_path': file_path,
                'detected_at': datetime.utcnow().isoformat()
            })
            return False
        
        # Compare hashes
        if computed_hash != expected_hash:
            logger.error(f"Hash mismatch for document {document_id}")
            emit_event('security', 'HASH_MISMATCH_DETECTED', {
                'document_id': document_id,
                'file_path': file_path,
                'expected_hash': expected_hash,
                'computed_hash': computed_hash,
                'detected_at': datetime.utcnow().isoformat()
            })
            return False
        
        logger.info(f"Hash verified for document {document_id}")
        return True
        
    except Exception as e:
        logger.error(f"Hash verification error for document {document_id}: {e}")
        emit_event('security', 'HASH_VERIFICATION_ERROR', {
            'document_id': document_id,
            'file_path': file_path,
            'error': str(e),
            'detected_at': datetime.utcnow().isoformat()
        })
        return False
```

## Document Load Wrapper

```python
def load_constitutional_document_with_guard(document_id: str) -> Dict[str, Any]:
    """
    Load constitutional document with hash sovereignty guard.
    
    Constitutional: Every constitutional document load must verify hash.
    
    Raises HashSovereigntyViolationException if hash verification fails.
    """
    # Load constitutional hash manifest
    with open('constitutional_hash_manifest.json', 'r') as f:
        manifest = json.load(f)
    
    # Get document info from manifest
    doc_info = manifest.get(document_id)
    if not doc_info:
        raise HashSovereigntyViolationException(
            f"Document {document_id} not found in hash manifest"
        )
    
    file_path = doc_info['file_path']
    expected_hash = doc_info['sha256_hash']
    
    # Verify hash
    if not verify_document_hash_sovereignty(file_path, document_id):
        raise HashSovereigntyViolationException(
            f"Hash verification failed for document {document_id}"
        )
    
    # Load document content
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    return {
        'document_id': document_id,
        'file_path': file_path,
        'content': content,
        'sha256_hash': expected_hash,
        'verified': True
    }
```

## HashSovereigntyViolationException

```python
class HashSovereigntyViolationException(Exception):
    """
    Raised when hash sovereignty verification fails.
    
    Constitutional: Hash verification is mandatory for constitutional documents.
    """
    def __init__(self, message: str, document_id: str = None, file_path: str = None):
        self.message = message
        self.document_id = document_id
        self.file_path = file_path
        super().__init__(message)
```

---

# Runtime Integration

## Integration with Document Loading

### Example 1: Constitutional Projection Worker

```python
# Before (no hash verification)
def index_vault_document(self, file_path: str):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # ... process document

# After (with hash verification)
def index_vault_document(self, file_path: str):
    # Extract document_id from file_path
    document_id = extract_document_id_from_path(file_path)
    
    # Load with hash guard
    try:
        document = load_constitutional_document_with_guard(document_id)
        content = document['content']
    except HashSovereigntyViolationException as e:
        logger.error(f"Failed to load document: {e}")
        return
    
    # ... process document
```

### Example 2: Memory Ingestion Worker

```python
# Before (no hash verification)
def discover_vault_documents(vault_path: str):
    for file_path in vault_dir.rglob('*.md'):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # ... process document

# After (with hash verification)
def discover_vault_documents(vault_path: str):
    for file_path in vault_dir.rglob('*.md'):
        # Extract document_id from file_path
        document_id = extract_document_id_from_path(file_path)
        
        # Check if document is constitutional
        if is_constitutional_document(document_id):
            # Load with hash guard
            try:
                document = load_constitutional_document_with_guard(document_id)
                content = document['content']
            except HashSovereigntyViolationException as e:
                logger.error(f"Failed to load constitutional document: {e}")
                continue
        else:
            # Load non-constitutional document normally
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        
        # ... process document
```

### Example 3: Search APIs

```python
# Before (no hash verification)
@app.route('/knowledge/documents')
def get_document(document_id: str):
    file_path = get_file_path(document_id)
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return jsonify({'content': content})

# After (with hash verification)
@app.route('/knowledge/documents')
def get_document(document_id: str):
    # Check if document is constitutional
    if is_constitutional_document(document_id):
        # Load with hash guard
        try:
            document = load_constitutional_document_with_guard(document_id)
            content = document['content']
        except HashSovereigntyViolationException as e:
            return jsonify({'error': str(e)}), 403
    else:
        # Load non-constitutional document normally
        file_path = get_file_path(document_id)
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    
    return jsonify({'content': content})
```

---

# Security Event Emission

## HASH_MISMATCH_DETECTED Event

```json
{
  "stream": "security",
  "event_type": "HASH_MISMATCH_DETECTED",
  "payload": {
    "document_id": "TRUTH_LAW",
    "file_path": "vault/constitutional/immutable/TRUTH_LAW.md",
    "expected_hash": "6e3ee57f...",
    "computed_hash": "abc123...",
    "detected_at": "2026-06-24T00:00:00Z"
  }
}
```

## HASH_MANIFEST_MISSING Event

```json
{
  "stream": "security",
  "event_type": "HASH_MANIFEST_MISSING",
  "payload": {
    "document_id": "UNKNOWN_DOCUMENT",
    "file_path": "vault/constitutional/immutable/UNKNOWN_DOCUMENT.md",
    "detected_at": "2026-06-24T00:00:00Z"
  }
}
```

## HASH_VERIFICATION_ERROR Event

```json
{
  "stream": "security",
  "event_type": "HASH_VERIFICATION_ERROR",
  "payload": {
    "document_id": "TRUTH_LAW",
    "file_path": "vault/constitutional/immutable/TRUTH_LAW.md",
    "error": "File not found",
    "detected_at": "2026-06-24T00:00:00Z"
  }
}
```

---

# Implementation Requirements

## Required Changes

1. **Implement verify_document_hash_sovereignty()** function
2. **Implement load_constitutional_document_with_guard()** function
3. **Implement HashSovereigntyViolationException** class
4. **Update constitutional projection worker** to use hash guard
5. **Update memory ingestion worker** to use hash guard
6. **Update search APIs** to use hash guard
7. **Update all document loading paths** to use hash guard
8. **Emit security events** for hash mismatches

## Optional Changes

1. **Implement hash verification cache** for performance
2. **Implement hash verification dashboard** for monitoring
3. **Implement hash verification notification system** for alerts

---

# Testing Strategy

## Unit Tests

1. **verify_document_hash_sovereignty() Test:** Test hash verification succeeds
2. **verify_document_hash_sovereignty() Test:** Test hash verification fails on mismatch
3. **load_constitutional_document_with_guard() Test:** Test document load succeeds
4. **load_constitutional_document_with_guard() Test:** Test document load fails on mismatch
5. **HashSovereigntyViolationException Test:** Test exception is raised

## Integration Tests

1. **End-to-End Hash Verification Test:** Test full hash verification flow
2. **Constitutional Projection Worker Test:** Test projection worker uses hash guard
3. **Memory Ingestion Worker Test:** Test ingestion worker uses hash guard

## Regression Tests

1. **Hash Verification Required Test:** Verify hash verification is required
2. **Mismatch Rejection Test:** Verify mismatches are rejected
3. **Security Event Test:** Verify security events are emitted

---

# Compliance Matrix

| Requirement | Current State | Target State | Implementation |
|-------------|---------------|--------------|----------------|
| Hash verification on load | No verification | Verification required | verify_document_hash_sovereignty() |
| Manifest comparison | No comparison | Comparison required | load_constitutional_document_with_guard() |
| Mismatch rejection | No rejection | Rejection required | HashSovereigntyViolationException |
| Security events | No security events | Security events emitted | Emit HASH_MISMATCH_DETECTED |
| Runtime integration | No integration | Integration required | Update all document loading paths |

---

# Migration Path

## Phase 1: Hash Verification Functions

1. Implement verify_document_hash_sovereignty()
2. Implement load_constitutional_document_with_guard()
3. Implement HashSovereigntyViolationException
4. Deploy to staging
5. Test functions

## Phase 2: Runtime Integration

1. Update constitutional projection worker
2. Update memory ingestion worker
3. Update search APIs
4. Update all document loading paths
5. Deploy to staging
6. Test integration

## Phase 3: Security Events

1. Implement security event emission
2. Update verification to emit security events
3. Deploy to staging
4. Test security event emission

## Phase 4: Production Deployment

1. Deploy hash verification functions to production
2. Deploy runtime integration to production
3. Deploy security events to production
4. Monitor hash verification attempts
5. Monitor security events

---

**Design Status:** COMPLETE
**Next Phase:** ADDITIONAL 2 - Constitutional Runtime Firewall
