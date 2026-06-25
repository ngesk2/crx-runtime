# Semantic Preservation Analysis

**Audit Date:** 2026-06-24
**Audit Type:** PHASE E.7A - Investigation 4
**Objective:** Determine constitutional semantics supplied by current retrieval and what would be lost with Mission Control routing

---

# Executive Summary

**Critical Finding:** Search Worker tools provide PostgreSQL-based constitutional semantics that are NOT available in Mission Control's Qdrant-based endpoints. Rewiring would lose critical constitutional guarantees.

**Lost Semantics:**
1. Declared authority class hierarchy (mechanical, not scored)
2. Supersession chain handling
3. Full PostgreSQL lineage tracing
4. Witness root identification
5. Graph relationship expansion
6. Mechanical verification (5-check deterministic)

---

# Current Constitutional Semantics

## authority_search.py Semantics

### Authority Ranking (Declared Class Hierarchy)

**Constitutional Principle:** Authority is DECLARED by class, not scored.

**Authority Class Hierarchy:**
```
CONSTITUTIONAL_LAW
  ↓
CANONICAL_SPEC
  ↓
CREATOR_RESEARCH
  ↓
CREATOR_NOTES
  ↓
IMPORTED_DOCUMENT
  ↓
REPOSITORY_DOCUMENTATION
  ↓
SCRIPT
  ↓
SUMMARY
  ↓
AI_GENERATED_ANALYSIS
  ↓
TEMPORARY_OBSERVATION
```

**Implementation:**
```python
AUTHORITY_CLASSES = [
    "CONSTITUTIONAL_LAW",
    "CANONICAL_SPEC",
    "CREATOR_RESEARCH",
    "CREATOR_NOTES",
    "IMPORTED_DOCUMENT",
    "REPOSITORY_DOCUMENTATION",
    "SCRIPT",
    "SUMMARY",
    "AI_GENERATED_ANALYSIS",
    "TEMPORARY_OBSERVATION"
]

AUTHORITY_CLASS_ORDER = {cls: idx for idx, cls in enumerate(AUTHORITY_CLASSES)}
```

**Sorting:**
```python
resolved.sort(key=lambda x: (x.get('class_rank', 999), 
                            0 if x.get('verification', {}).get('overall') else 1))
```

**Semantic Meaning:** Authority is determined by declared class, not by similarity score. This is a constitutional guarantee.

**Mission Control Equivalent:** ❌ NOT PROVIDED - Mission Control uses vector similarity scores, not declared class hierarchy.

---

### Supersession Handling

**Supersession Chain:**
```python
supersession_chain = []
for c in authority_chain:
    aid = c.get('artifact_id') or c.get('id')
    if aid and aid in superseded:
        supersession_chain.append(aid)
```

**Supersession Query:**
```python
cur.execute("SELECT superseded, superseded_by FROM authority_supersession")
```

**Semantic Meaning:** Superseded authorities are identified and excluded from the authority chain. This ensures that only current, non-superseded authorities are considered.

**Mission Control Equivalent:** ❌ NOT PROVIDED - No supersession handling in /constitutional/query.

---

### Mechanical Verification

**Verification Checks (All Must Pass):**
```python
verification = {
    "artifact_hash_verified": False,  # payload_hash == sha256
    "event_hash_verified": False,     # Event hash consistency
    "lineage_intact": False,          # lineage_depth > 0
    "witness_present": False,         # witness_count > 0
    "projection_valid": False,        # status == 'projected'
    "overall": False                  # ALL checks must pass
}
```

**Overall Verification:**
```python
verification["overall"] = all([
    verification["artifact_hash_verified"],
    verification["event_hash_verified"],
    verification["lineage_intact"],
    verification["witness_present"],
    verification["projection_valid"]
])
```

**Semantic Meaning:** Verification is mechanical and deterministic. All checks must pass for an authority to be considered valid. This is a constitutional guarantee of integrity.

**Mission Control Equivalent:** ⚠️ PARTIAL - Mission Control provides projection integrity verification but not the full 5-check mechanical verification.

---

## lineage_search.py Semantics

### Lineage Tracing

**Lineage Query:**
```python
cur.execute("SELECT * FROM authority_lineage WHERE ancestor=%s OR descendant=%s", 
            (artifact_id, artifact_id))
```

**Lineage Fields:**
- ancestor
- descendant
- relation
- metadata

**Semantic Meaning:** Full PostgreSQL lineage tracing including ancestor/descendant relationships and relationship types.

**Mission Control Equivalent:** ❌ NOT PROVIDED - Mission Control provides basic source_event_id but not full PostgreSQL lineage.

---

### Witness Root Identification

**Witness Query:**
```python
(SELECT COUNT(*) FROM authority_witness aw WHERE aw.artifact_id = ao.artifact_id) as witness_count
```

**Semantic Meaning:** Witness roots are identified to provide cryptographic proof of authority existence and integrity.

**Mission Control Equivalent:** ❌ NOT PROVIDED - No witness information in /constitutional/query.

---

### Event Tracing

**Event Query:**
```python
cur.execute("SELECT id, stream, event_type, payload, created_at FROM events 
            WHERE payload::text ILIKE %s ORDER BY created_at", (f'%{artifact_id}%',))
```

**Semantic Meaning:** All events related to an artifact are traced to provide complete event history.

**Mission Control Equivalent:** ⚠️ PARTIAL - Mission Control provides source_event_id but not full event tracing.

---

### Projection Tracking

**Projection Query:**
```python
cur.execute("SELECT id, payload, payload_hash, projection_hash, created_at FROM projections 
            WHERE payload::text ILIKE %s ORDER BY created_at", (f'%{artifact_id}%',))
```

**Semantic Meaning:** All projections of an artifact are tracked to provide projection history and integrity verification.

**Mission Control Equivalent:** ⚠️ PARTIAL - Mission Control provides projection integrity verification but not full projection history.

---

## graph_expand.py Semantics

### Graph Relationship Expansion

**Relationship Query:**
```python
q = "SELECT source, target, relation_type, metadata FROM object_relationships 
     WHERE source=%s OR target=%s"
```

**Relationship Types:**
- source
- target
- relation_type
- metadata

**Semantic Meaning:** Graph relationships are expanded to provide context beyond direct lineage. This includes non-authority relationships (e.g., dependencies, references, associations).

**Mission Control Equivalent:** ❌ NOT PROVIDED - No graph expansion in /constitutional/query.

---

### Authority Lineage Edges

**Authority Lineage Query:**
```python
q2 = "SELECT ancestor, descendant, relation, metadata FROM authority_lineage 
      WHERE ancestor=%s OR descendant=%s"
```

**Semantic Meaning:** Authority lineage edges are included in graph expansion to provide authority context within the broader graph.

**Mission Control Equivalent:** ⚠️ PARTIAL - Mission Control provides basic authority_level but not full authority lineage edges.

---

### BFS Expansion

**BFS Algorithm:**
```python
def expand(node, depth, seed_edges):
    nodes = set()
    edges_out = []
    adj = {}
    for e in seed_edges:
        s = e.get('source')
        t = e.get('target')
        adj.setdefault(s, []).append(e)
        adj.setdefault(t, []).append(e)
    q = deque()
    q.append((node, 0))
    nodes.add(node)
    visited = set([node])
    while q:
        cur_node, d = q.popleft()
        if d >= depth:
            continue
        for e in adj.get(cur_node, []):
            s = e.get('source')
            t = e.get('target')
            edges_out.append(e)
            for n in (s, t):
                if n not in visited:
                    visited.add(n)
                    nodes.add(n)
                    q.append((n, d + 1))
    return list(nodes), edges_out
```

**Semantic Meaning:** Breadth-first expansion up to specified depth provides comprehensive graph context while controlling computational complexity.

**Mission Control Equivalent:** ❌ NOT PROVIDED - No graph expansion capability.

---

# Lost Functionality Summary

## If Search Worker Used Mission Control Endpoints Only

### Completely Lost:

1. **Declared Authority Class Hierarchy**
   - Current: Mechanical resolution by declared class (CONSTITUTIONAL_LAW > CANONICAL_SPEC > ...)
   - Mission Control: Vector similarity scoring
   - Impact: Loss of constitutional authority guarantees

2. **Supersession Chain Handling**
   - Current: Superseded authorities identified and excluded
   - Mission Control: No supersession handling
   - Impact: Risk of returning superseded/obsolete authorities

3. **Full PostgreSQL Lineage Tracing**
   - Current: Complete ancestor/descendant relationships
   - Mission Control: Basic source_event_id only
   - Impact: Loss of complete lineage context

4. **Witness Root Identification**
   - Current: Witness count and cryptographic proof
   - Mission Control: No witness information
   - Impact: Loss of cryptographic integrity guarantees

5. **Graph Relationship Expansion**
   - Current: BFS expansion of object relationships
   - Mission Control: No graph expansion
   - Impact: Loss of broader graph context

6. **Mechanical Verification (5-Check)**
   - Current: All 5 checks must pass (artifact_hash, event_hash, lineage, witness, projection)
   - Mission Control: Projection integrity only
   - Impact: Loss of comprehensive integrity verification

### Partially Lost:

1. **Lineage Information**
   - Current: Full PostgreSQL lineage
   - Mission Control: Basic Qdrant payload lineage
   - Impact: Reduced lineage depth and accuracy

2. **Authority Chain**
   - Current: Full PostgreSQL authority_lineage
   - Mission Control: Basic authority_level from Qdrant
   - Impact: Reduced authority context

---

# Constitutional Impact Assessment

## Authority Resolution

**Current:** Mechanical resolution by declared class hierarchy
**Proposed:** Vector similarity scoring
**Impact:** ❌ CONSTITUTIONAL VIOLATION - Authority must be declared, not scored

## Supersession Handling

**Current:** Superseded authorities excluded
**Proposed:** No supersession handling
**Impact:** ❌ CONSTITUTIONAL VIOLATION - Superseded authorities must be excluded

## Lineage Integrity

**Current:** Full PostgreSQL lineage tracing
**Proposed:** Basic Qdrant payload lineage
**Impact:** ⚠️ CONSTITUTIONAL RISK - Reduced lineage integrity

## Witness Verification

**Current:** Witness count and cryptographic proof
**Proposed:** No witness information
**Impact:** ❌ CONSTITUTIONAL VIOLATION - Witness verification required for constitutional compliance

## Graph Context

**Current:** BFS expansion of graph relationships
**Proposed:** No graph expansion
**Impact:** ⚠️ CONSTITUTIONAL RISK - Loss of broader graph context

## Verification Integrity

**Current:** 5-check mechanical verification
**Proposed:** Projection integrity only
**Impact:** ⚠️ CONSTITUTIONAL RISK - Reduced verification coverage

---

# Alternative Approaches

## Option 1: Mission Control Adds PostgreSQL Authority Endpoints

**Approach:** Mission Control adds endpoints that replicate authority_search, lineage_search, and graph_expand functionality using PostgreSQL.

**Pros:**
- Preserves all current semantics
- Centralizes retrieval through Mission Control
- Maintains constitutional guarantees

**Cons:**
- Requires Mission Control to access PostgreSQL authority tables
- Duplicates existing tool functionality
- Increases Mission Control complexity

**Feasibility:** HIGH

---

## Option 2: Dual-Source Strategy

**Approach:** Search Worker uses both PostgreSQL authority tables (for authority resolution) and Mission Control (for vector similarity).

**Pros:**
- Preserves all current semantics
- Adds vector similarity capability
- Maintains constitutional guarantees

**Cons:**
- Increased complexity
- Two data sources to manage
- Potential inconsistency between sources

**Feasibility:** MEDIUM

---

## Option 3: Data Migration to Qdrant

**Approach:** Migrate PostgreSQL authority tables to Qdrant with full metadata preservation.

**Pros:**
- Single data source
- Centralized through Mission Control
- Vector similarity + authority metadata

**Cons:**
- Complex data migration
- Schema transformation required
- Risk of data loss during migration
- Loss of PostgreSQL query capabilities

**Feasibility:** LOW

---

## Option 4: Keep Current Architecture

**Approach:** Search Worker continues using PostgreSQL authority tables. Mission Control continues using Qdrant for vector similarity.

**Pros:**
- Preserves all current semantics
- No migration required
- Constitutional guarantees maintained
- Clear separation of concerns

**Cons:**
- Two retrieval paths
- No centralization
- Potential architectural complexity

**Feasibility:** HIGH

---

# Recommendation

**Do NOT rewire Search Worker through Mission Control constitutional endpoints.**

**Reasoning:**
1. Mission Control endpoints do NOT provide required constitutional semantics
2. Rewiring would violate constitutional guarantees (authority resolution, supersession, witness verification)
3. Data sources are fundamentally different (PostgreSQL vs Qdrant)
4. Lost functionality cannot be easily replaced

**Alternative:** Consider Option 1 (Mission Control adds PostgreSQL authority endpoints) if centralization is required.

---

**Investigation Status:** COMPLETED
