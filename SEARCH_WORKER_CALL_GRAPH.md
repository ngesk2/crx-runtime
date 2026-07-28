# Search Worker Call Graph

**Audit Date:** 2026-06-24
**Audit Type:** PHASE E.7A - Investigation 1
**Component:** search_worker.py

---

# Executive Summary

Search Worker is a constitutional evidence finder that uses a three-stage pipeline:
1. authority_search - Find highest authority by declared class
2. lineage_search - Trace lineage for highest authority artifact
3. graph_expand - Expand graph relationships

**Critical Finding:** Search Worker does NOT use Qdrant. All retrieval is from PostgreSQL authority tables.

---

# Call Graph

```
User Query
    ↓
Reasoning Gateway
    ↓
Supervisor
    ↓
Search Worker (search_worker.py)
    ↓
WorkerProtocol.call_tool('authority_search')
    ↓
authority_search.py
    ↓
PostgreSQL (authority_objects, authority_lineage, authority_supersession)
    ↓
[artifact_id extracted]
    ↓
WorkerProtocol.call_tool('lineage_search')
    ↓
lineage_search.py
    ↓
PostgreSQL (artifact_registry, events, authority_lineage)
    ↓
WorkerProtocol.call_tool('graph_expand')
    ↓
graph_expand.py
    ↓
PostgreSQL (object_relationships, authority_lineage)
    ↓
Findings returned to Supervisor
```

---

# Entry Points

**Primary Entry Point:**
- `SearchWorker.execute(task: WorkerTask)` - Called by Supervisor

**Standalone Entry Point:**
- `SearchWorker.run_standalone()` - JSON input via stdin

---

# Internal Dependencies

**search_worker.py Dependencies:**
- `worker_protocol.py` - WorkerProtocol for tool execution
- `models.py` - WorkerTask, WorkerResponse, WorkerRole

**Tool Dependencies:**
- `authority_search.py` - Authority resolution
- `lineage_search.py` - Lineage tracing
- `graph_expand.py` - Graph expansion

---

# Tool Usage

**authority_search:**
- Input: `{'query': query}`
- Output: Highest authority, authority chain, supersession chain, verification
- Database: PostgreSQL (authority_objects, authority_lineage, authority_supersession)
- Fallback: Local JSON files (runtime/data/authority_objects.json, authority_supersession.json)

**lineage_search:**
- Input: `{'artifact_id': artifact_id}`
- Output: Artifact, events, projections, authorities, witness_roots
- Database: PostgreSQL (artifact_registry, events, projections, authority_lineage)
- Fallback: Local JSON files (runtime/data/*.json)

**graph_expand:**
- Input: `{'node': artifact_id, 'depth': 2}`
- Output: Nodes, edges
- Database: PostgreSQL (object_relationships, authority_lineage)
- Fallback: Local JSON files (runtime/data/object_relationships.json, authority_lineage.json)

---

# Retrieval Sequence

1. **Authority Search**
   - Query → PostgreSQL authority_objects
   - Resolve by declared authority class (CONSTITUTIONAL_LAW > CANONICAL_SPEC > ...)
   - Apply mechanical verification (hash, lineage, witness, projection)
   - Return highest authority artifact_id

2. **Lineage Search**
   - artifact_id → PostgreSQL artifact_registry, events, authority_lineage
   - Retrieve artifact metadata, related events, projections, lineage relationships
   - Return lineage context

3. **Graph Expansion**
   - artifact_id → PostgreSQL object_relationships, authority_lineage
   - BFS expansion up to specified depth
   - Return graph nodes and edges

---

# Authority Sequence

**Authority Resolution:**
- Declared authority class hierarchy (not scored)
- Mechanical verification (all checks must pass)
- Supersession handling (superseded artifacts excluded)

**Verification Checks:**
- artifact_hash_verified
- event_hash_verified
- lineage_intact
- witness_present
- projection_valid

---

# Data Sources

**Primary: PostgreSQL Tables**
- authority_objects
- authority_lineage
- authority_supersession
- artifact_registry
- events
- projections
- object_relationships

**Fallback: Local JSON Files**
- runtime/data/authority_objects.json
- runtime/data/authority_supersession.json
- runtime/data/artifact_registry.json
- runtime/data/events.json
- runtime/data/projections.json
- runtime/data/authority_lineage.json
- runtime/data/object_relationships.json

---

# Critical Finding

**Search Worker does NOT use Qdrant.**

All retrieval is from PostgreSQL authority infrastructure. Qdrant is not involved in the search worker pipeline.

---

# Implications for Rewire

If search_worker were rewired through Mission Control constitutional endpoints:

**Current Flow:**
```
search_worker → PostgreSQL authority tables
```

**Proposed Flow:**
```
search_worker → Mission Control → Qdrant
```

**Gap Analysis:**
- Mission Control /constitutional/query endpoint uses Qdrant
- Search worker currently uses PostgreSQL authority tables
- These are different data sources with different schemas
- Rewiring would require data migration or dual-source strategy

---

# Sovereignty Analysis

**Current Architecture:**
- Search Worker: DERIVATION (observes authority tables)
- PostgreSQL: OPERATIONS (stores authority metadata)
- Authority tables: DERIVATION (derived from constitutional truth)

**Proposed Architecture:**
- Search Worker: DERIVATION (observes Mission Control)
- Mission Control: STRUCTURAL GUARD (enforces constitutional retrieval)
- Qdrant: DERIVATION (stores vector projections)

**Sovereignty Impact:**
- No sovereignty change (both are derivation operations)
- Mission Control becomes structural guard for retrieval
- Authority tables may become obsolete if fully migrated to Qdrant

---

# Confidence Assessment

| Finding | Confidence |
|---------|------------|
| Search Worker uses PostgreSQL authority tables | 99% |
| Search Worker does NOT use Qdrant | 99% |
- Authority resolution is mechanical (declared class hierarchy) | 95% |
| Verification is deterministic (all checks must pass) | 95% |
| Supersession handling is functional | 90% |

---

**Investigation Status:** COMPLETED
