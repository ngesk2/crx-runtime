# Mission Control Constitutional Capabilities

**Audit Date:** 2026-06-24
**Audit Type:** PHASE E.7A - Investigation 3
**Objective:** Audit Mission Control constitutional retrieval endpoints

---

# Executive Summary

Mission Control provides comprehensive constitutional retrieval capabilities through Qdrant with projection integrity verification, lineage resolution, and authority verification.

**Key Endpoints:**
- `/constitutional/query` - Query constitutional memory with full constitutional semantics
- `/constitutional/ingest` - Ingest constitutional documents
- `/constitutional/retrieve` - Retrieve constitutional context
- `/constitutional/documents` - Get all constitutional documents

---

# Endpoint Analysis

## /constitutional/query

**Purpose:** Query constitutional memory with lineage resolution and authority verification

**Constitutional Law:** TRUTH ≠ EMBEDDINGS
- Query is embedded
- Qdrant search retrieves projections
- Lineage resolution traces back to truth sources
- Authority verification ensures constitutional compliance

**Input Parameters:**
- `query: str` - Query text
- `top_k: int = 5` - Number of results

**Response Includes:**
- `answer: str` - Generated answer
- `citations: List[Dict]` - Source citations
- `authority_chain: List[Dict]` - Authority chain of sources
- `lineage: List[Dict]` - Lineage information

**Capabilities Provided:**

### Citations
```python
citation = {
    "source": payload.get("source", ""),
    "document_path": payload.get("document_path", ""),
    "vault_hash": payload.get("vault_hash", ""),
    "authority_level": payload.get("authority_level", "")
}
```
**Status:** ✅ PROVIDED

### Authority Metadata
```python
snippet = {
    "content": payload.get("content", ""),
    "score": result.score,
    "source": payload.get("source", ""),
    "authority_level": payload.get("authority_level", ""),
    "document_path": payload.get("document_path", ""),
    "projection_verified": projection_verified,
    "verification_reason": verification_reason
}
```
**Status:** ✅ PROVIDED

### Authority Class
```python
"authority_level": payload.get("authority_level", "")
```
**Status:** ✅ PROVIDED

### Authority Chain
```python
if payload.get("authority_level") == "constitutional":
    authority_chain.append({
        "document": payload.get("document_path", ""),
        "authority_level": "constitutional",
        # ... additional fields
    })
```
**Status:** ✅ PROVIDED

### Lineage Information
```python
lineage = []  # Built from search results
```
**Status:** ⚠️ PARTIAL - Basic lineage from Qdrant payload, not full PostgreSQL lineage

### Verification Status
```python
projection_verified, verification_reason = projection_integrity.verify_projection(
    projection_metadata,
    event_data,
    embedding
)
```
**Status:** ✅ PROVIDED - Full projection integrity verification

### Witness Information
```python
"witness_roots": []  # Not currently provided in /constitutional/query
```
**Status:** ❌ NOT PROVIDED

### Contradiction Information
```python
# Not currently provided in /constitutional/query
```
**Status:** ❌ NOT PROVIDED

---

## /constitutional/ingest

**Purpose:** Ingest constitutional documents into Qdrant

**Capabilities:**
- Document ingestion
- Embedding generation
- Qdrant upsert
- Projection metadata generation

**Status:** ✅ FUNCTIONAL

---

## /constitutional/retrieve

**Purpose:** Retrieve constitutional context for a question

**Capabilities:**
- Context retrieval
- Constitutional filtering
- Authority-aware retrieval

**Status:** ✅ FUNCTIONAL

---

## /constitutional/documents

**Purpose:** Get all constitutional documents

**Capabilities:**
- Document enumeration
- Full document retrieval

**Status:** ✅ FUNCTIONAL

---

# Projection Integrity Verification

Mission Control implements comprehensive projection integrity verification:

**Verification Checks:**
1. **Artifact Hash Verification** - payload_hash == sha256
2. **Event Hash Verification** - Event hash consistency
3. **Lineage Integrity** - Lineage depth > 0
4. **Witness Presence** - Witness count > 0
5. **Projection Validity** - Status == 'projected'

**Verification Metadata Required:**
- source_event_id
- canonical_hash
- embedding_hash
- projection_signature
- generated_by_worker
- generated_at

**Constitutional Enforcement:**
- Unverified projections are skipped
- Verification reason is logged
- Only verified projections are returned

**Status:** ✅ FULLY IMPLEMENTED

---

# Authority Resolution

**Authority Level Classification:**
- constitutional
- canonical_spec
- creator_research
- imported_document
- repository_documentation
- script
- summary
- ai_generated_analysis
- temporary_observation

**Authority Chain Building:**
- Built from Qdrant search results
- Sorted by authority level
- Includes verification status

**Status:** ✅ PROVIDED

---

# Lineage Resolution

**Current Implementation:**
- Basic lineage from Qdrant payload
- Source event tracking
- Document path tracking

**Missing Capabilities:**
- Full PostgreSQL lineage tracing
- Ancestor/descendant relationships
- Witness root identification
- Lineage depth calculation

**Status:** ⚠️ PARTIAL - Qdrant only, not PostgreSQL lineage

---

# Comparison with Search Worker Tools

## authority_search.py vs /constitutional/query

| Capability | authority_search.py | /constitutional/query |
|-----------|-------------------|----------------------|
| Authority class resolution | ✅ Declared hierarchy | ✅ Authority level field |
| Mechanical verification | ✅ 5-check verification | ✅ Projection integrity |
| Supersession handling | ✅ Supersession chain | ❌ Not provided |
| Lineage depth | ✅ PostgreSQL lineage | ⚠️ Qdrant payload only |
| Witness count | ✅ PostgreSQL witness | ❌ Not provided |
| Data source | PostgreSQL authority tables | Qdrant vector embeddings |

**Critical Difference:** Different data sources with different schemas.

---

## lineage_search.py vs /constitutional/query

| Capability | lineage_search.py | /constitutional/query |
|-----------|------------------|----------------------|
| Artifact metadata | ✅ PostgreSQL artifact_registry | ⚠️ Qdrant payload |
| Event tracing | ✅ PostgreSQL events | ⚠️ Qdrant source_event_id |
| Projection tracking | ✅ PostgreSQL projections | ✅ Projection integrity |
| Authority relationships | ✅ PostgreSQL authority_lineage | ⚠️ Qdrant authority_level |
| Witness roots | ✅ PostgreSQL witness | ❌ Not provided |

**Critical Difference:** PostgreSQL provides full lineage, Qdrant provides basic lineage.

---

## graph_expand.py vs /constitutional/query

| Capability | graph_expand.py | /constitutional/query |
|-----------|---------------|----------------------|
| Graph nodes | ✅ PostgreSQL object_relationships | ❌ Not provided |
| Graph edges | ✅ PostgreSQL relationships | ❌ Not provided |
| BFS expansion | ✅ Depth-based expansion | ❌ Not provided |
| Authority lineage edges | ✅ PostgreSQL authority_lineage | ⚠️ Qdrant authority_level |

**Critical Difference:** graph_expand provides graph structure, /constitutional/query does not.

---

# Missing Capabilities Summary

**Completely Missing:**
1. Witness information
2. Contradiction information
3. Supersession handling
4. Graph expansion (nodes/edges)
5. Full PostgreSQL lineage tracing

**Partially Provided:**
1. Lineage information (Qdrant payload only, not PostgreSQL)
2. Authority chain (basic from Qdrant, not full PostgreSQL authority_lineage)

**Fully Provided:**
1. Citations
2. Authority metadata
3. Authority class
4. Verification status
5. Projection integrity verification

---

# Rewire Feasibility Assessment

**If Search Worker were rewired to use /constitutional/query:**

**Lost Functionality:**
1. PostgreSQL authority table access (authority_objects, authority_lineage, authority_supersession)
2. Full PostgreSQL lineage tracing
3. Witness root identification
4. Graph expansion capabilities
5. Supersession chain handling
6. Authority class hierarchy resolution (declared vs scored)

**Gained Functionality:**
1. Vector similarity search
2. Projection integrity verification
3. Qdrant-based retrieval
4. Centralized constitutional enforcement

**Critical Gap:** Search Worker requires PostgreSQL authority tables for mechanical authority resolution. /constitutional/query uses Qdrant vector embeddings. These are fundamentally different data sources.

---

# Conclusion

Mission Control provides strong constitutional retrieval capabilities for Qdrant-based vector search with projection integrity verification. However, it does NOT provide the PostgreSQL authority table capabilities that Search Worker currently uses.

**Recommendation:** Complete Investigation 4 (Semantic Preservation) to determine if the lost functionality is critical or if alternative approaches exist.

---

**Investigation Status:** COMPLETED
