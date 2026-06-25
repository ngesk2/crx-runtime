# Retrieval Ownership Report

**Audit Date:** 2026-06-24
**Audit Type:** PHASE E.7A - Investigation 2
**Objective:** Identify every component capable of searching Qdrant

---

# Executive Summary

**Critical Finding:** Search Worker does NOT use Qdrant. All Qdrant access is centralized in Mission Control and Qdrant Projection Worker.

**Architecture:**
- Mission Control: Qdrant retrieval authority
- Qdrant Projection Worker: Qdrant write authority (projections)
- Search Worker: PostgreSQL authority tables (NOT Qdrant)

---

# Component Classification

| Component | Direct Qdrant | Indirect Qdrant | Authority Aware | Constitutional Aware |
| --------- | ------------- | --------------- | --------------- | -------------------- |
| Mission Control (app.py) | YES | NO | YES | YES |
| Qdrant Projection Worker | YES | NO | YES | YES |
| Search Worker | NO | NO | YES | YES |
| authority_search.py | NO | NO | YES | YES |
| lineage_search.py | NO | NO | YES | YES |
| graph_expand.py | NO | NO | YES | YES |
| Context Pack Builder | NO | NO | YES | YES |

---

# Detailed Component Analysis

## Mission Control (app.py)

**Direct Qdrant Access:** YES

**Qdrant Operations:**
- `/memory/search` - Search memory collection
- `/constitutional/query` - Query constitutional documents
- `/qdrant/health` - Qdrant health check
- `/constitutional/ingest` - Ingest constitutional documents
- `/constitutional/retrieve` - Retrieve constitutional context

**Qdrant Collections:**
- `constitutional_memory` - Constitutional documents
- `memory` - Document memory
- `constitutional_documents` - Additional constitutional storage

**Authority Awareness:** YES
- Implements projection integrity verification
- Enforces constitutional filtering
- Verifies projection signatures
- Authority level classification

**Constitutional Awareness:** YES
- Constitutional Law: TRUTH ≠ EMBEDDINGS
- Lineage resolution
- Authority verification
- Projection integrity checks

---

## Qdrant Projection Worker (qdrant_projection_worker.py)

**Direct Qdrant Access:** YES

**Qdrant Operations:**
- Upsert points to `constitutional_memory` collection
- Upsert points to `memory` collection
- Create collections if not exist

**Authority Awareness:** YES
- Constitutional role: MEMORY_PROJECTION
- Does NOT create constitutional truth
- Stores truth: YES (Memory Projection)
- Authority: POSTGRES (source of truth)

**Constitutional Awareness:** YES
- Blocks unverified event types from projection
- Only marks events as projected AFTER Qdrant ACK
- Traceability preservation
- Constitutional filtering

**Write-Only:** This component only WRITES to Qdrant, does not READ/SEARCH

---

## Search Worker (search_worker.py)

**Direct Qdrant Access:** NO

**Data Source:** PostgreSQL authority tables
- authority_objects
- authority_lineage
- authority_supersession
- artifact_registry
- events
- projections
- object_relationships

**Tools Used:**
- authority_search.py - PostgreSQL authority resolution
- lineage_search.py - PostgreSQL lineage tracing
- graph_expand.py - PostgreSQL graph expansion

**Authority Awareness:** YES
- Declared authority class hierarchy
- Mechanical verification
- Supersession handling

**Constitutional Awareness:** YES
- Never answers directly from vector search
- Always resolves authority before searching lineage
- Always expands graph after finding lineage

**Critical:** Search Worker does NOT use Qdrant at all.

---

## authority_search.py

**Direct Qdrant Access:** NO

**Data Source:** PostgreSQL authority tables
- authority_objects
- authority_lineage
- authority_supersession

**Fallback:** Local JSON files
- runtime/data/authority_objects.json
- runtime/data/authority_supersession.json

**Authority Awareness:** YES
- Declared authority class hierarchy
- Mechanical verification
- Supersession handling

**Constitutional Awareness:** YES
- Authority is DECLARED by class, not scored
- Constitutional principle: Authority class hierarchy

---

## lineage_search.py

**Direct Qdrant Access:** NO

**Data Source:** PostgreSQL tables
- artifact_registry
- events
- projections
- authority_lineage

**Fallback:** Local JSON files
- runtime/data/artifact_registry.json
- runtime/data/events.json
- runtime/data/projections.json
- runtime/data/authority_lineage.json

**Authority Awareness:** YES
- Lineage tracing
- Witness root identification

**Constitutional Awareness:** YES
- Lineage integrity
- Event traceability

---

## graph_expand.py

**Direct Qdrant Access:** NO

**Data Source:** PostgreSQL tables
- object_relationships
- authority_lineage

**Fallback:** Local JSON files
- runtime/data/object_relationships.json
- runtime/data/authority_lineage.json

**Authority Awareness:** YES
- Graph relationship expansion
- Authority lineage edges

**Constitutional Awareness:** YES
- Graph integrity
- Relationship traceability

---

# Retrieval Ownership Summary

**Qdrant Search/Query Authority:**
- **Mission Control** - Sole authority for Qdrant retrieval
- **No other components** directly search Qdrant

**Qdrant Write Authority:**
- **Qdrant Projection Worker** - Sole authority for Qdrant writes
- **Mission Control** - Can ingest constitutional documents

**PostgreSQL Authority Retrieval:**
- **Search Worker** - Authority resolution from PostgreSQL
- **authority_search.py** - PostgreSQL authority tables
- **lineage_search.py** - PostgreSQL lineage tables
- **graph_expand.py** - PostgreSQL relationship tables

---

# Architectural Implications

**Current Architecture:**
```
Mission Control → Qdrant (search/query)
Qdrant Projection Worker → Qdrant (write)
Search Worker → PostgreSQL (authority tables)
```

**Key Finding:** Search Worker and Mission Control use DIFFERENT data sources:
- Search Worker: PostgreSQL authority infrastructure
- Mission Control: Qdrant vector projections

**Data Source Divergence:**
- PostgreSQL authority tables: Structured authority metadata
- Qdrant: Vector embeddings of constitutional documents
- These are NOT the same data
- Rewiring search_worker to Mission Control would require data migration

---

# Sovereignty Analysis

**Mission Control:**
- Sovereignty: STRUCTURAL GUARD (Qdrant retrieval)
- Authority: Enforces constitutional constraints on retrieval
- Constitutional Awareness: HIGH

**Qdrant Projection Worker:**
- Sovereignty: DERIVATION (projections from Postgres)
- Authority: NO (does not create truth)
- Constitutional Awareness: HIGH

**Search Worker:**
- Sovereignty: DERIVATION (observes PostgreSQL authority)
- Authority: NO (does not create truth)
- Constitutional Awareness: HIGH

**PostgreSQL Authority Tables:**
- Sovereignty: DERIVATION (derived from constitutional truth)
- Authority: NO (metadata storage)
- Constitutional Awareness: HIGH

---

# Authority Ownership Conclusion

**Qdrant Retrieval Authority:** Mission Control (100% ownership)
**Qdrant Write Authority:** Qdrant Projection Worker (100% ownership)
**PostgreSQL Authority Retrieval:** Search Worker (100% ownership)

**No Authority Leakage:** Each component has clear, bounded authority.

---

# Rewire Feasibility Assessment

**Challenge:** Search Worker uses PostgreSQL authority tables, not Qdrant.

**Rewire Options:**
1. **Migrate authority data to Qdrant** - High complexity, data migration required
2. **Dual-source strategy** - Search worker queries both PostgreSQL and Mission Control
3. **Mission Control as proxy** - Mission Control adds PostgreSQL authority endpoints
4. **Keep current architecture** - Search Worker continues using PostgreSQL

**Recommendation:** Complete Investigation 3 (Mission Control Constitutional Capabilities) before deciding.

---

**Investigation Status:** COMPLETED
