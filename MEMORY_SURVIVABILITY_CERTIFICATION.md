# MEMORY SURVIVABILITY CERTIFICATION

**Date:** 2026-06-22  
**Purpose:** Test create/project/destroy/rebuild/verify cycle  
**Status:** ⚠️ CERTIFICATION TEST REQUIRED

---

## CERTIFICATION OBJECTIVE

Prove that memory survives component death.

**Test Cycle:**
1. Create test document
2. Project to Qdrant
3. Verify search returns document
4. Destroy Qdrant collection
5. Rebuild using projection worker
6. Verify search returns document
7. Certify: Memory survives death

---

## TEST PROCEDURE

### Step 1: Create Test Document
**Action:** Create test document in vault

```bash
# Create test document
cat > C:\Users\nolan\PING\vault\constitution\TEST_SURVIVABILITY.md << 'EOF'
# TEST SURVIVABILITY DOCUMENT

**Purpose:** Memory survivability certification test  
**Created:** 2026-06-22  
**Test:** Verify memory survives Qdrant destruction and rebuild

This document is used to certify that PING memory can survive component failure.
If this document is retrieved after Qdrant destruction and rebuild, memory survivability is certified.
EOF
```

**Expected Result:** File created successfully

---

### Step 2: Project to Qdrant
**Action:** Run projection worker to index new document

```bash
cd C:\Users\nolan\PING\brainos\orchestration\src\projection_worker
python projection_worker.py
```

**Expected Output:**
```
Ensuring memory tiers...
Created collection: constitutional_documents
Indexing vault documents...
Indexed: TEST_SURVIVABILITY.md
Total indexed: 17 documents
```

**Expected Result:** Document projected to Qdrant

---

### Step 3: Verify Search Returns Document
**Action:** Search for test document

```bash
curl "http://localhost:8000/constitution/search?query=TEST_SURVIVABILITY&limit=3"
```

**Expected Result:**
```json
{
  "query": "TEST_SURVIVABILITY",
  "num_results": 1,
  "results": [
    {
      "id": "...",
      "score": > 0.8,
      "payload": {
        "title": "TEST_SURVIVABILITY_DOCUMENT",
        "document_type": "constitution",
        "vault_path": "/app/vault/constitution/TEST_SURVIVABILITY.md"
      }
    }
  ]
}
```

**Verification Criteria:**
- ✅ TEST_SURVIVABILITY_DOCUMENT retrieved
- ✅ Score > 0.8
- ✅ Document type: constitution
- ✅ Vault path matches

---

### Step 4: Destroy Qdrant Collection
**Action:** Delete Qdrant constitutional_documents collection

```bash
curl -X DELETE http://localhost:6333/collections/constitutional_documents
```

**Expected Result:**
```json
{
  "status": "ok",
  "time": 0.123
}
```

**Verification:**
```bash
curl http://localhost:6333/collections/constitutional_documents
# Expected: 404 Not Found
```

**Expected Result:** Collection destroyed

---

### Step 5: Rebuild Using Projection Worker
**Action:** Re-run projection worker to rebuild collection

```bash
cd C:\Users\nolan\PING\brainos\orchestration\src\projection_worker
python projection_worker.py
```

**Expected Output:**
```
Ensuring memory tiers...
Created collection: constitutional_documents
Indexing vault documents...
Indexed: CONSTITUTION.md
Indexed: IDENTITY_LAW.md
Indexed: REPLAY_LAW.md
Indexed: WITNESS_LAW.md
Indexed: TEST_SURVIVABILITY.md
...
Total indexed: 17 documents
```

**Expected Result:** Collection rebuilt with all documents

---

### Step 6: Verify Search Returns Document
**Action:** Search for test document again

```bash
curl "http://localhost:8000/constitution/search?query=TEST_SURVIVABILITY&limit=3"
```

**Expected Result:**
```json
{
  "query": "TEST_SURVIVABILITY",
  "num_results": 1,
  "results": [
    {
      "id": "...",
      "score": > 0.8,
      "payload": {
        "title": "TEST_SURVIVABILITY_DOCUMENT",
        "document_type": "constitution",
        "vault_path": "/app/vault/constitution/TEST_SURVIVABILITY.md"
      }
    }
  ]
}
```

**Verification Criteria:**
- ✅ TEST_SURVIVABILITY_DOCUMENT retrieved
- ✅ Score > 0.8
- ✅ Document type: constitution
- ✅ Vault path matches
- ✅ Score matches pre-destruction score (within tolerance)

---

### Step 7: Compare Projection Hashes
**Action:** Compare vault_hash and qdrant_hash

```bash
# Get vault hash
python C:\Users\nolan\PING\generate_projection_manifest.py

# Compare with projection_manifest.json
cat C:\Users\nolan\PING\vault\projection_manifest.json
```

**Expected Result:**
```json
{
  "vault_hash": "44c1f27303e5199738c872eb5e225ee8e9b2af13ce522eeaf07726e8474049bc",
  "qdrant_hash": "MATCHING_HASH",
  "certification": "PROJECTION_CERTIFIED"
}
```

**Verification Criteria:**
- ✅ Vault hash unchanged
- ✅ Qdrant hash matches (or within tolerance)
- ✅ Certification status: PROJECTION_CERTIFIED

---

## CERTIFICATION CRITERIA

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Test document created | ⏳ PENDING | User to execute |
| Document projected to Qdrant | ⏳ PENDING | User to execute |
| Search returns document (pre-destroy) | ⏳ PENDING | User to execute |
| Qdrant collection destroyed | ⏳ PENDING | User to execute |
| Collection rebuilt | ⏳ PENDING | User to execute |
| Search returns document (post-rebuild) | ⏳ PENDING | User to execute |
| Projection hashes match | ⏳ PENDING | User to execute |

---

## CERTIFICATION STATUS

**Current Status:** ⚠️ CERTIFICATION TEST REQUIRED

**Summary:** Test procedure documented. User to execute destructive test to certify memory survivability.

**Constitutional Principle:** Truth ≠ Embedding  
**Architecture:** Vault (truth) → Projection Worker → Ollama → Qdrant (projection)  
**Survivability:** If Qdrant dies, memory can be rebuilt from vault

---

## POST-CERTIFICATION CLEANUP

**After Certification:**
```bash
# Remove test document
rm C:\Users\nolan\PING\vault\constitution\TEST_SURVIVABILITY.md

# Re-run projection worker to remove from Qdrant
cd C:\Users\nolan\PING\brainos\orchestration\src\projection_worker
python projection_worker.py
```

---

## CONCLUSION

**Certification Status:** ⚠️ PENDING USER EXECUTION

**Summary:** Memory survivability certification test documented. Test requires destructive Qdrant collection deletion. User to execute test and verify results.

**Next Phase:** Update SWEEP27_FINAL_DECISION.md with corrections and identity thesis
