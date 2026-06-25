# Source Type Sovereignty Design

**Design Date:** 2026-06-24
**Design Type:** Constitutional Enforcement Mechanism
**Scope:** memory_ingestion_worker.py Source Type Verification
**Status:** DESIGN ONLY - No implementation
**Authority:** CONSTITUTIONAL_LAW

---

# Executive Summary

This design prevents source_type spoofing in memory_ingestion_worker.py by enforcing that only registry-approved constitutional documents may enter constitutional authority classes. All other documents are classified as IMPORTED_DOCUMENT until governance approval.

**Blocking Issue Addressed:** memory_ingestion_worker.py Source Type Spoofing
**Constitutional Violations Resolved:** TRUTH_LAW.md, IDENTITY_LAW.md, AUTHORITY_TAXONOMY_SPEC.md

---

# Current Vulnerability

## Existing Implementation (memory_ingestion_worker.py)

```python
def discover_vault_documents(vault_path: str) -> List[Dict[str, Any]]:
    """Discover documents from vault directory."""
    documents = []
    vault_dir = Path(vault_path)
    
    if not vault_dir.exists():
        logger.warning(f"Vault directory not found: {vault_path}")
        return documents
    
    for file_path in vault_dir.rglob('*.md'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            content_hash = calculate_content_hash(content)
            document_hash = calculate_document_hash('vault', str(file_path), content_hash)
            
            documents.append({
                'document_hash': document_hash,
                'source_type': 'vault',  # NO VERIFICATION
                'source_path': str(file_path),
                'title': file_path.stem,
                'content': content,
                'content_hash': content_hash,
                'content_length': len(content),
                'word_count': len(content.split()),
                'language': 'en',
                'metadata': {
                    'file_extension': file_path.suffix,
                    'file_size': file_path.stat().st_size
                }
            })
        except Exception as e:
            logger.error(f"Error reading vault file {file_path}: {e}")
```

**Vulnerability:**
- source_type is hardcoded as 'vault' without verification
- No verification against constitutional freeze registry
- Non-constitutional documents can be ingested with constitutional source_type
- Violates TRUTH_LAW.md (non-constitutional content treated as truth)
- Violates IDENTITY_LAW.md (identity spoofing)
- Violates AUTHORITY_TAXONOMY_SPEC.md (governance bypass)

---

# Design Objectives

## Primary Objectives

1. **Source Type Verification:** Verify source_type against constitutional freeze registry
2. **Registry Enforcement:** Only registry-approved constitutional documents may enter constitutional authority classes
3. **Default Classification:** All other documents classified as IMPORTED_DOCUMENT
4. **Governance Approval:** Constitutional document ingestion requires governance approval

## Secondary Objectives

1. **Hash Sovereignty:** Verify document hash against constitutional hash manifest
2. **Audit Trail:** All source_type verification attempts must be logged
3. **Security Events:** Source_type spoofing attempts must emit security events

---

# Source Type Sovereignty Architecture

## Constitutional Freeze Registry Query

```python
def get_constitutional_document(document_hash: str) -> Optional[dict]:
    """
    Query constitutional freeze registry for document.
    
    Returns document info if found in registry, None otherwise.
    """
    try:
        conn = get_postgres_connection()
        if not conn:
            return None
        
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT document_id, file_path, authority_class, status, sha256_hash
            FROM constitutional_freeze_registry
            WHERE sha256_hash = %s AND status = 'FROZEN'
            """,
            (document_hash,)
        )
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if row:
            return {
                'document_id': row[0],
                'file_path': row[1],
                'authority_class': row[2],
                'status': row[3],
                'sha256_hash': row[4]
            }
        else:
            return None
            
    except Exception as e:
        logger.error(f"Error querying constitutional freeze registry: {e}")
        return None
```

## Source Type Verification

```python
def verify_source_type(document: Dict[str, Any]) -> Dict[str, Any]:
    """
    Verify source_type against constitutional freeze registry.
    
    Returns verified document with correct source_type.
    
    Constitutional: Only registry-approved constitutional documents may enter
    constitutional authority classes. Everything else becomes IMPORTED_DOCUMENT.
    """
    document_hash = document.get('document_hash')
    source_path = document.get('source_path')
    
    # Query constitutional freeze registry
    constitutional_doc = get_constitutional_document(document_hash)
    
    if constitutional_doc:
        # Document is in constitutional freeze registry
        # Verify file path matches
        if constitutional_doc['file_path'] != source_path:
            logger.warning(f"File path mismatch for constitutional document {document_hash}")
            emit_event('security', 'SOURCE_TYPE_SPOOFING_ATTEMPT', {
                'document_hash': document_hash,
                'expected_path': constitutional_doc['file_path'],
                'actual_path': source_path,
                'detected_at': datetime.utcnow().isoformat()
            })
        
        # Use registry authority class
        document['source_type'] = constitutional_doc['authority_class']
        document['constitutional'] = True
        document['registry_verified'] = True
        document['document_id'] = constitutional_doc['document_id']
        
        logger.info(f"Constitutional document verified: {document_hash} ({constitutional_doc['authority_class']})")
        
    else:
        # Document is not in constitutional freeze registry
        # Default to IMPORTED_DOCUMENT
        document['source_type'] = 'IMPORTED_DOCUMENT'
        document['constitutional'] = False
        document['registry_verified'] = False
        
        logger.info(f"Non-constitutional document: {document_hash} (IMPORTED_DOCUMENT)")
    
    return document
```

## Hash Sovereignty Verification

```python
def verify_hash_sovereignty(document: Dict[str, Any]) -> bool:
    """
    Verify document hash against constitutional hash manifest.
    
    Returns True if hash matches manifest, False otherwise.
    """
    try:
        document_hash = document.get('document_hash')
        content_hash = document.get('content_hash')
        
        # Load constitutional hash manifest
        with open('constitutional_hash_manifest.json', 'r') as f:
            manifest = json.load(f)
        
        # Verify hash in manifest
        for doc_id, doc_info in manifest.items():
            if doc_info.get('sha256_hash') == document_hash:
                # Verify content hash matches
                if doc_info.get('content_hash') == content_hash:
                    return True
                else:
                    logger.warning(f"Content hash mismatch for constitutional document {document_hash}")
                    return False
        
        # Hash not in manifest (non-constitutional document)
        return True
        
    except Exception as e:
        logger.error(f"Error verifying hash sovereignty: {e}")
        return False
```

---

# Modified memory_ingestion_worker.py

## Modified discover_vault_documents()

```python
def discover_vault_documents(vault_path: str) -> List[Dict[str, Any]]:
    """Discover documents from vault directory."""
    documents = []
    vault_dir = Path(vault_path)
    
    if not vault_dir.exists():
        logger.warning(f"Vault directory not found: {vault_path}")
        return documents
    
    for file_path in vault_dir.rglob('*.md'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            content_hash = calculate_content_hash(content)
            document_hash = calculate_document_hash('vault', str(file_path), content_hash)
            
            document = {
                'document_hash': document_hash,
                'source_type': 'vault',  # Placeholder, will be verified
                'source_path': str(file_path),
                'title': file_path.stem,
                'content': content,
                'content_hash': content_hash,
                'content_length': len(content),
                'word_count': len(content.split()),
                'language': 'en',
                'metadata': {
                    'file_extension': file_path.suffix,
                    'file_size': file_path.stat().st_size
                }
            }
            
            # Verify source_type against constitutional freeze registry
            document = verify_source_type(document)
            
            # Verify hash sovereignty
            if not verify_hash_sovereignty(document):
                logger.warning(f"Hash sovereignty verification failed for {document_hash}")
                emit_event('security', 'HASH_SOVEREIGNTY_VIOLATION', {
                    'document_hash': document_hash,
                    'source_path': str(file_path),
                    'detected_at': datetime.utcnow().isoformat()
                })
            
            documents.append(document)
            
        except Exception as e:
            logger.error(f"Error reading vault file {file_path}: {e}")
    
    logger.info(f"Discovered {len(documents)} documents from vault")
    return documents
```

## Modified discover_research_documents()

```python
def discover_research_documents(research_path: str) -> List[Dict[str, Any]]:
    """Discover documents from research directory."""
    documents = []
    research_dir = Path(research_path)
    
    if not research_dir.exists():
        logger.warning(f"Research directory not found: {research_path}")
        return documents
    
    for file_path in research_dir.rglob('*.md'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            content_hash = calculate_content_hash(content)
            document_hash = calculate_document_hash('research', str(file_path), content_hash)
            
            document = {
                'document_hash': document_hash,
                'source_type': 'research',  # Placeholder, will be verified
                'source_path': str(file_path),
                'title': file_path.stem,
                'content': content,
                'content_hash': content_hash,
                'content_length': len(content),
                'word_count': len(content.split()),
                'language': 'en',
                'metadata': {
                    'file_extension': file_path.suffix,
                    'file_size': file_path.stat().st_size
                }
            }
            
            # Verify source_type against constitutional freeze registry
            document = verify_source_type(document)
            
            # Verify hash sovereignty
            if not verify_hash_sovereignty(document):
                logger.warning(f"Hash sovereignty verification failed for {document_hash}")
                emit_event('security', 'HASH_SOVEREIGNTY_VIOLATION', {
                    'document_hash': document_hash,
                    'source_path': str(file_path),
                    'detected_at': datetime.utcnow().isoformat()
                })
            
            documents.append(document)
            
        except Exception as e:
            logger.error(f"Error reading research file {file_path}: {e}")
    
    logger.info(f"Discovered {len(documents)} documents from research")
    return documents
```

---

# Governance Approval for Constitutional Document Ingestion

## Constitutional Document Ingestion Workflow

### Step 1: Detect Constitutional Document

```python
def is_constitutional_document(document: Dict[str, Any]) -> bool:
    """
    Check if document is constitutional (in freeze registry).
    """
    return document.get('constitutional', False)
```

### Step 2: Request Governance Approval

```python
def request_constitutional_ingestion_approval(document: Dict[str, Any], requester: str) -> str:
    """
    Request governance approval for constitutional document ingestion.
    
    Returns approval request ID.
    """
    approval_request_id = str(uuid.uuid4())
    
    emit_event('governance', 'CONSTITUTIONAL_INGESTION_REQUESTED', {
        'approval_request_id': approval_request_id,
        'document_hash': document.get('document_hash'),
        'document_id': document.get('document_id'),
        'source_path': document.get('source_path'),
        'authority_class': document.get('source_type'),
        'requester': requester,
        'requested_at': datetime.utcnow().isoformat(),
        'status': 'pending_approval'
    })
    
    return approval_request_id
```

### Step 3: Check Governance Approval

```python
def check_constitutional_ingestion_approval(approval_request_id: str) -> bool:
    """
    Check if constitutional document ingestion has been approved.
    
    Returns True if approved, False otherwise.
    """
    try:
        conn = get_postgres_connection()
        if not conn:
            return False
        
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT status FROM governance_approvals
            WHERE approval_request_id = %s AND approval_type = 'constitutional_ingestion'
            """,
            (approval_request_id,)
        )
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if row and row[0] == 'approved':
            return True
        else:
            return False
            
    except Exception as e:
        logger.error(f"Error checking governance approval: {e}")
        return False
```

### Step 4: Ingest Constitutional Document

```python
def ingest_constitutional_document(document: Dict[str, Any], approval_request_id: str) -> Optional[int]:
    """
    Ingest constitutional document with governance approval.
    """
    # Verify governance approval
    if not check_constitutional_ingestion_approval(approval_request_id):
        raise Exception("Governance approval required for constitutional document ingestion")
    
    # Ingest document
    document_id = ingest_document(document)
    
    if document_id:
        # Emit constitutional ingestion event
        emit_event('constitutional', 'CONSTITUTIONAL_DOCUMENT_INGESTED', {
            'document_id': document_id,
            'document_hash': document.get('document_hash'),
            'document_id_constitutional': document.get('document_id'),
            'authority_class': document.get('source_type'),
            'approval_request_id': approval_request_id,
            'ingested_at': datetime.utcnow().isoformat()
        })
    
    return document_id
```

---

# Security Event Emission

## SOURCE_TYPE_SPOOFING_ATTEMPT Event

```json
{
  "stream": "security",
  "event_type": "SOURCE_TYPE_SPOOFING_ATTEMPT",
  "payload": {
    "document_hash": "abc123...",
    "expected_path": "vault/constitutional/immutable/TRUTH_LAW.md",
    "actual_path": "vault/research/some_document.md",
    "detected_at": "2026-06-24T00:00:00Z"
  }
}
```

## HASH_SOVEREIGNTY_VIOLATION Event

```json
{
  "stream": "security",
  "event_type": "HASH_SOVEREIGNTY_VIOLATION",
  "payload": {
    "document_hash": "abc123...",
    "source_path": "vault/research/some_document.md",
    "detected_at": "2026-06-24T00:00:00Z"
  }
}
```

## CONSTITUTIONAL_INGESTION_REQUESTED Event

```json
{
  "stream": "governance",
  "event_type": "CONSTITUTIONAL_INGESTION_REQUESTED",
  "payload": {
    "approval_request_id": "uuid",
    "document_hash": "abc123...",
    "document_id": "TRUTH_LAW",
    "source_path": "vault/constitutional/immutable/TRUTH_LAW.md",
    "authority_class": "CONSTITUTIONAL_LAW",
    "requester": "memory_ingestion_worker",
    "requested_at": "2026-06-24T00:00:00Z",
    "status": "pending_approval"
  }
}
```

---

# Implementation Requirements

## Required Changes

1. **Implement get_constitutional_document()** to query constitutional freeze registry
2. **Implement verify_source_type()** to verify source_type against registry
3. **Implement verify_hash_sovereignty()** to verify hash against manifest
4. **Update discover_vault_documents()** to use source_type verification
5. **Update discover_research_documents()** to use source_type verification
6. **Emit security events** for source_type spoofing attempts
7. **Implement governance approval workflow** for constitutional document ingestion

## Optional Changes

1. **Implement governance approval tracking** in PostgreSQL
2. **Implement constitutional ingestion approval UI** for governance agents
3. **Implement automatic approval** for frozen constitutional documents

---

# Testing Strategy

## Unit Tests

1. **get_constitutional_document() Test:** Test query returns document if in registry
2. **get_constitutional_document() Test:** Test query returns None if not in registry
3. **verify_source_type() Test:** Test verification for constitutional document
4. **verify_source_type() Test:** Test verification for non-constitutional document
5. **verify_hash_sovereignty() Test:** Test hash verification against manifest

## Integration Tests

1. **End-to-End Source Type Verification Test:** Test full source_type verification flow
2. **Source Type Spoofing Detection Test:** Test spoofing attempt detection
3. **Governance Approval Test:** Test governance approval workflow

## Regression Tests

1. **No Spoofing Test:** Verify source_type cannot be spoofed
2. **Default Classification Test:** Verify non-constitutional documents classified as IMPORTED_DOCUMENT
3. **Registry Enforcement Test:** Verify only registry-approved documents enter constitutional classes

---

# Compliance Matrix

| Requirement | Current State | Target State | Implementation |
|-------------|---------------|--------------|----------------|
| Source type verification | No verification | Verify against registry | verify_source_type() |
| Registry enforcement | No enforcement | Only registry-approved | get_constitutional_document() |
| Default classification | Hardcoded source_type | IMPORTED_DOCUMENT default | verify_source_type() |
| Hash sovereignty | No verification | Verify against manifest | verify_hash_sovereignty() |
| Governance approval | No approval | Approval required | Governance approval workflow |
| Security events | No security events | Security events emitted | Emit SOURCE_TYPE_SPOOFING_ATTEMPT |

---

# Migration Path

## Phase 1: Source Type Verification

1. Implement get_constitutional_document()
2. Implement verify_source_type()
3. Update discover_vault_documents() to use verification
4. Update discover_research_documents() to use verification
5. Deploy to staging

## Phase 2: Hash Sovereignty Verification

1. Implement verify_hash_sovereignty()
2. Update discovery functions to use hash verification
3. Deploy to staging
4. Test hash verification

## Phase 3: Security Events

1. Implement security event emission
2. Update discovery functions to emit security events
3. Deploy to staging
4. Test security event emission

## Phase 4: Governance Approval

1. Implement governance approval workflow
2. Implement governance approval tracking
3. Update ingestion to require approval for constitutional documents
4. Deploy to staging
5. Test governance approval

## Phase 5: Production Deployment

1. Deploy to production
2. Monitor source_type verification
3. Monitor security events
4. Monitor governance approval requests

---

**Design Status:** COMPLETE
**Next Phase:** BLOCKER 3 - Direct State Mutation
