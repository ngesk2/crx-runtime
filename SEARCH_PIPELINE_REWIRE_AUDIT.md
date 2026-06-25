# Search Pipeline Rewire Audit

**Audit Date:** 2026-06-24
**Audit Type:** PHASE E.7A - Final Deliverable
**Audit Scope:** Search pipeline rewire feasibility through Mission Control constitutional endpoints

---

# Executive Summary

**FINAL RECOMMENDATION: KEEP CURRENT ARCHITECTURE**

**Critical Finding:** Search Worker uses PostgreSQL authority tables for constitutional guarantees (declared authority class hierarchy, mechanical verification, supersession handling, witness verification). Mission Control endpoints use Qdrant vector embeddings and do NOT provide equivalent constitutional semantics.

**Rewire Impact:** Rewiring Search Worker through Mission Control would violate constitutional guarantees and lose critical functionality:
- Declared authority class hierarchy (mechanical, not scored)
- Supersession chain handling
- Full PostgreSQL lineage tracing
- Witness root identification
- Graph relationship expansion
- Mechanical verification (5-check)

**Architecture Assessment:** Current architecture is constitutionally sound with clear separation of concerns. PostgreSQL and Qdrant serve complementary purposes, not competing purposes.

---

# Current Architecture

## Data Flow

```
User Query
    ↓
Reasoning Gateway
    ↓
Supervisor
    ↓
Search Worker
    ↓
authority_search.py → PostgreSQL authority_objects
    ↓
lineage_search.py → PostgreSQL authority_lineage, events, projections
    ↓
graph_expand.py → PostgreSQL object_relationships, authority_lineage
    ↓
Findings returned to Supervisor
```

## Data Sources

**PostgreSQL Authority Infrastructure:**
- authority_objects - Authority metadata with declared class hierarchy
- authority_lineage - Ancestor/descendant relationships
- authority_witness - Witness roots for cryptographic proof
- authority_supersession - Supersession relationships

**Qdrant Vector Infrastructure:**
- constitutional_memory - Vector embeddings of constitutional documents
- memory - Vector embeddings of document memory

**Component Responsibilities:**
- Search Worker - PostgreSQL authority retrieval (NOT Qdrant)
- Mission Control - Qdrant vector retrieval (NOT PostgreSQL authority)
- Qdrant Projection Worker - PostgreSQL → Qdrant projections

---

# Proposed Architecture (Rewire)

## Hypothesized Data Flow

```
User Query
    ↓
Reasoning Gateway
    ↓
Supervisor
    ↓
Search Worker
    ↓
Mission Control /constitutional/query
    ↓
Qdrant
    ↓
Findings returned to Supervisor
```

## Critical Gap

**Search Worker requires PostgreSQL authority tables for constitutional guarantees.**
**Mission Control provides Qdrant vector embeddings without equivalent constitutional semantics.**

These are fundamentally different data sources with different schemas and different constitutional capabilities.

---

# Investigation Findings Summary

## Investigation 1: Search Worker Call Graph

**Finding:** Search Worker does NOT use Qdrant. All retrieval is from PostgreSQL authority tables.

**Tools Used:**
- authority_search.py - PostgreSQL authority_objects
- lineage_search.py - PostgreSQL authority_lineage, events, projections
- graph_expand.py - PostgreSQL object_relationships, authority_lineage

**Implication:** Rewiring would require changing data source from PostgreSQL to Qdrant.

---

## Investigation 2: Retrieval Ownership

**Finding:** Qdrant retrieval is centralized in Mission Control. PostgreSQL authority retrieval is centralized in Search Worker tools.

**Qdrant Access:**
- Mission Control - Sole authority for Qdrant retrieval
- Qdrant Projection Worker - Sole authority for Qdrant writes

**PostgreSQL Authority Access:**
- Search Worker - Authority resolution from PostgreSQL
- authority_search.py - PostgreSQL authority tables
- lineage_search.py - PostgreSQL lineage tables
- graph_expand.py - PostgreSQL relationship tables

**Implication:** Clear separation of concerns. No authority leakage.

---

## Investigation 3: Mission Control Constitutional Capabilities

**Finding:** Mission Control provides strong Qdrant-based retrieval but lacks PostgreSQL authority table capabilities.

**Mission Control Provides:**
- Citations ✅
- Authority metadata ✅
- Authority class (basic) ✅
- Authority chain (basic) ✅
- Verification status (projection integrity) ✅

**Mission Control Missing:**
- Witness information ❌
- Contradiction information ❌
- Supersession handling ❌
- Graph expansion ❌
- Full PostgreSQL lineage ❌

**Implication:** Mission Control cannot replace PostgreSQL authority tools.

---

## Investigation 4: Semantic Preservation

**Finding:** Search Worker tools provide PostgreSQL-based constitutional semantics that are NOT available in Mission Control.

**Lost Constitutional Semantics:**
1. Declared authority class hierarchy (CONSTITUTIONAL_LAW > CANONICAL_SPEC > ...)
2. Supersession chain handling
3. Mechanical verification (5-check: artifact_hash, event_hash, lineage, witness, projection)
4. Full PostgreSQL lineage tracing
5. Witness root identification
6. Graph relationship expansion

**Constitutional Impact:** Rewiring would violate constitutional guarantees.

---

## Investigation 5: Authority Ownership Model

**Finding:** Search Worker should continue owning authority resolution.

**Decision Matrix Scores:**
- Option A (Search Worker): 34/35 - HIGHEST
- Option B (Mission Control): 30/35
- Option C (Reasoning Gateway): 12/35 - ARCHITECTURAL VIOLATION
- Option D (Dedicated Service): 33/35

**Recommendation:** Option A (Search Worker) - Lowest complexity, highest constitutional integrity, no implementation risk.

---

## Investigation 6: Context Pack Compatibility

**Finding:** Context Pack Builder requires PostgreSQL capabilities that Mission Control does not provide.

**Required Fields:** 10
**Mission Control Provides:** 1 (citations)
**Mission Control Partially Provides:** 6 (reduced functionality)
**Mission Control Missing:** 3 (lineage, witness, contradictions)

**Critical Gaps:**
- Lineage information (complete loss)
- Witness information (complete loss)
- Contradiction information (complete loss)

**Implication:** Context Pack Builder cannot be rewired through Mission Control.

---

## Investigation 7: Authority Infrastructure Relevance

**Finding:** All PostgreSQL authority tables are REQUIRED for constitutional guarantees.

**Table Classification:**
- authority_objects: REQUIRED
- authority_lineage: REQUIRED
- authority_witness: REQUIRED
- authority_supersession: REQUIRED

**Reasoning:** These tables provide constitutional semantics that are NOT available in Qdrant or Mission Control.

**Risk if Removed:** CONSTITUTIONAL VIOLATION - Authority resolution would become vector similarity scoring instead of declared class hierarchy.

---

# Decision Framework

## Option 1: Keep Current Architecture

**Description:** Search Worker continues using PostgreSQL authority tables. Mission Control continues using Qdrant for vector retrieval.

**Scores:**
- Constitutional Integrity: 5/5
- Replay Safety: 5/5
- Freeze Compatibility: 5/5
- Auditability: 5/5
- Maintainability: 4/5
- Long-Term Viability: 5/5
- Complexity: 5/5 (LOW)

**Total Score:** 34/35

**Pros:**
- Excellent constitutional integrity
- Lowest complexity
- No implementation risk
- Clear separation of concerns
- No migration required

**Cons:**
- Two retrieval paths
- No centralization

---

## Option 2: Rewire Through Mission Control

**Description:** Search Worker uses Mission Control constitutional endpoints only.

**Scores:**
- Constitutional Integrity: 1/5 (VIOLATION)
- Replay Safety: 3/5
- Freeze Compatibility: 3/5
- Auditability: 3/5
- Maintainability: 2/5
- Long-Term Viability: 2/5
- Complexity: 2/5 (HIGH)

**Total Score:** 16/35

**Pros:**
- Centralized retrieval
- Single data source

**Cons:**
- ❌ CONSTITUTIONAL VIOLATION - Lost authority class hierarchy
- ❌ CONSTITUTIONAL VIOLATION - Lost supersession handling
- ❌ CONSTITUTIONAL VIOLATION - Lost witness verification
- High implementation complexity
- Data migration required
- High risk of bugs

---

## Option 3: Build Retrieval Abstraction Layer

**Description:** Workers call abstraction layer. Abstraction layer owns Mission Control integration.

**Scores:**
- Constitutional Integrity: 3/5 (RISK)
- Replay Safety: 4/5
- Freeze Compatibility: 4/5
- Auditability: 4/5
- Maintainability: 3/5
- Long-Term Viability: 3/5
- Complexity: 3/5 (MEDIUM)

**Total Score:** 24/35

**Pros:**
- Abstraction layer can preserve PostgreSQL capabilities
- Centralized retrieval logic
- Future flexibility

**Cons:**
- Additional abstraction layer
- Increased complexity
- Implementation risk
- Still requires PostgreSQL access

---

## Option 4: Hybrid Approach

**Description:** Mission Control owns retrieval. Workers retain lineage expansion.

**Scores:**
- Constitutional Integrity: 2/5 (HIGH RISK)
- Replay Safety: 3/5
- Freeze Compatibility: 3/5
- Auditability: 3/5
- Maintainability: 2/5
- Long-Term Viability: 2/5
- Complexity: 2/5 (HIGH)

**Total Score:** 17/35

**Pros:**
- Partial centralization
- Some PostgreSQL capabilities retained

**Cons:**
- ❌ CONSTITUTIONAL VIOLATION - Lost authority class hierarchy
- ❌ CONSTITUTIONAL VIOLATION - Lost witness verification
- High complexity
- Mixed responsibilities

---

# Risks

## Rewire Risks

**Constitutional Violations:**
1. Authority resolution would become vector similarity scoring instead of declared class hierarchy
2. Superseded authorities would not be excluded
3. Witness verification would be lost
4. Cryptographic proof would be lost

**Functional Losses:**
1. Full PostgreSQL lineage tracing
2. Graph relationship expansion
3. Contradiction detection
4. Context pack completeness

**Implementation Risks:**
1. Data migration complexity
2. Schema transformation
3. Potential data loss
4. High bug risk
5. Increased latency

---

# Lost Functionality

## If Rewired Through Mission Control

**Completely Lost:**
1. Declared authority class hierarchy (CONSTITUTIONAL_LAW > CANONICAL_SPEC > ...)
2. Supersession chain handling
3. Full PostgreSQL lineage tracing
4. Witness root identification
5. Graph relationship expansion
6. Mechanical verification (5-check)
7. Contradiction detection

**Partially Lost:**
1. Lineage information (reduced to basic source_event_id)
2. Authority chain (reduced to basic authority_level)
3. Verification status (reduced to projection integrity only)
4. Evidence (reduced event/projection history)
5. Provenance (reduced event/projection/lineage provenance)

**Preserved:**
1. Vector similarity search
2. Projection integrity verification
3. Basic citation information

---

# Preserved Functionality

## If Current Architecture Kept

**All Current Functionality Preserved:**
1. Declared authority class hierarchy
2. Supersession chain handling
3. Mechanical verification (5-check)
4. Full PostgreSQL lineage tracing
5. Witness root identification
6. Graph relationship expansion
7. Contradiction detection
8. Complete context packs

**No Functional Losses**

---

# Required Changes

## For Rewire Through Mission Control

**Mission Control Development:**
1. Add PostgreSQL authority endpoints (replicate authority_search, lineage_search, graph_expand)
2. Add witness verification endpoints
3. Add supersession handling endpoints
4. Add contradiction detection endpoints
5. Add graph expansion endpoints

**Search Worker Changes:**
1. Rewire to use Mission Control endpoints
2. Remove direct PostgreSQL tool calls
3. Update error handling
4. Update confidence calculation

**Context Pack Builder Changes:**
1. Rewire to use Mission Control endpoints
2. Remove direct PostgreSQL tool calls
3. Handle missing fields
4. Update context pack schema

**Data Migration:**
1. Migrate authority_objects to Qdrant (if desired)
2. Migrate authority_lineage to Qdrant (if desired)
3. Migrate authority_witness to Qdrant (if desired)
4. Migrate authority_supersession to Qdrant (if desired)

**Testing:**
1. Constitutional compliance testing
2. Authority resolution testing
3. Lineage tracing testing
4. Witness verification testing
5. Context pack completeness testing

**Estimated Effort:** 4-6 weeks of development

**Risk Level:** HIGH

---

## For Current Architecture

**Required Changes:** NONE

**Effort:** 0 weeks

**Risk Level:** NONE

---

# Recommended Direction

**KEEP CURRENT ARCHITECTURE**

**Reasoning:**

1. **Constitutional Integrity:** Current architecture has excellent constitutional integrity. Rewiring would violate constitutional guarantees.

2. **Functional Completeness:** Current architecture provides all required constitutional semantics. Rewiring would lose critical functionality.

3. **Complexity:** Current architecture has lowest complexity. Rewiring would significantly increase complexity.

4. **Risk:** Current architecture has no risk. Rewiring has high implementation risk and constitutional violation risk.

5. **Separation of Concerns:** Current architecture has clear separation of concerns. PostgreSQL and Qdrant serve complementary purposes.

6. **Data Source Appropriateness:** PostgreSQL is appropriate for structured authority metadata. Qdrant is appropriate for vector similarity search. These are complementary, not competing.

7. **No Issues:** Current architecture has no issues. There is no problem to solve.

---

# Alternative Recommendations

## If Centralization is Required

**Option: Mission Control Adds PostgreSQL Authority Endpoints**

**Approach:** Mission Control adds endpoints that replicate authority_search, lineage_search, and graph_expand functionality using PostgreSQL.

**Pros:**
- Preserves all current functionality
- Centralizes retrieval through Mission Control
- Maintains constitutional guarantees

**Cons:**
- Requires Mission Control development
- Duplicates existing tool functionality
- Increases Mission Control complexity

**Feasibility:** HIGH

**Recommendation:** Only pursue if centralization is a hard requirement. Otherwise, keep current architecture.

---

## If Microservice Architecture is Preferred

**Option: Dedicated Constitutional Retrieval Service**

**Approach:** New service (ConstitutionalRetrieval) owns authority resolution, lineage, graph expansion. Search Worker and Mission Control call ConstitutionalRetrieval.

**Pros:**
- Focused service
- Clear service boundaries
- Independent scaling
- Future-proof

**Cons:**
- New service to deploy
- Additional infrastructure
- Service discovery

**Feasibility:** MEDIUM

**Recommendation:** Only pursue if microservice architecture is a hard requirement. Otherwise, keep current architecture.

---

# Conclusion

**The search pipeline should NOT be rewired through Mission Control constitutional endpoints.**

**Current architecture is constitutionally sound, functionally complete, and architecturally appropriate.** PostgreSQL and Qdrant serve complementary purposes with clear separation of concerns.

**Rewiring would:**
- Violate constitutional guarantees
- Lose critical functionality
- Increase complexity
- Introduce high implementation risk
- Require significant development effort

**There is no problem to solve.** The current architecture works well and should be maintained.

---

# Final Recommendation

**KEEP CURRENT ARCHITECTURE**

**Confidence:** 95%

**Rationale:**
- Excellent constitutional integrity (5/5)
- Lowest complexity (5/5)
- No implementation risk (5/5)
- Clear separation of concerns
- Complementary data sources
- No functional losses
- No issues to solve

---

**Audit Status:** COMPLETED
**Total Investigations:** 7
**Total Deliverables:** 8
**Recommendation:** KEEP CURRENT ARCHITECTURE
