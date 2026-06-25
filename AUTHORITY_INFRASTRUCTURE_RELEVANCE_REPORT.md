# Authority Infrastructure Relevance Report

**Audit Date:** 2026-06-24
**Audit Type:** PHASE E.7A - Investigation 7
**Objective:** Determine whether authority infrastructure tables remain architecturally required

---

# Executive Summary

**Critical Finding:** All PostgreSQL authority infrastructure tables are REQUIRED for constitutional guarantees. None are obsolete or superseded by Qdrant.

**Classification:**
- authority_objects: REQUIRED
- authority_lineage: REQUIRED
- authority_witness: REQUIRED
- authority_supersession: REQUIRED

**Reasoning:** These tables provide constitutional semantics (declared authority class hierarchy, mechanical verification, witness verification, supersession handling) that are NOT available in Qdrant or Mission Control endpoints.

---

# Table-by-Table Analysis

## authority_objects

**Purpose:** Store authority metadata with declared authority class hierarchy

**Current Usage:**
- authority_search.py - Primary data source
- Context Pack Builder - Authority resolution
- Search Worker - Authority chain building

**Required Fields:**
- artifact_id
- title
- description
- category (mapped to authority_class)
- authority_level
- payload_hash
- sha256
- status

**Constitutional Function:**
- Declared authority class hierarchy (CONSTITUTIONAL_LAW > CANONICAL_SPEC > ...)
- Mechanical verification (artifact_hash, event_hash, lineage, witness, projection)
- Authority chain building
- Supersession exclusion

**Qdrant Equivalent:**
- Qdrant stores vector embeddings with basic authority_level field
- Qdrant does NOT provide declared authority class hierarchy
- Qdrant does NOT provide mechanical verification
- Qdrant does NOT provide supersession handling

**Mission Control Equivalent:**
- /constitutional/query provides basic authority_level
- Mission Control does NOT provide declared authority class hierarchy
- Mission Control does NOT provide mechanical verification (5-check)
- Mission Control does NOT provide supersession handling

**Classification:** REQUIRED

**Evidence:**
1. authority_search.py requires authority_objects for mechanical authority resolution
2. Declared authority class hierarchy is a constitutional guarantee
3. Mechanical verification (5-check) is a constitutional requirement
4. Supersession handling is a constitutional requirement
5. Qdrant and Mission Control do not provide equivalent functionality

**Risk if Removed:** CONSTITUTIONAL VIOLATION - Authority resolution would become vector similarity scoring instead of declared class hierarchy

---

## authority_lineage

**Purpose:** Store ancestor/descendant relationships for lineage tracing

**Current Usage:**
- lineage_search.py - Primary data source
- graph_expand.py - Authority lineage edges
- Context Pack Builder - Lineage information

**Required Fields:**
- ancestor
- descendant
- relation
- metadata

**Constitutional Function:**
- Full PostgreSQL lineage tracing
- Ancestor/descendant relationship tracking
- Relationship type classification
- Lineage depth calculation
- Witness root identification

**Qdrant Equivalent:**
- Qdrant stores basic source_event_id
- Qdrant does NOT provide ancestor/descendant relationships
- Qdrant does NOT provide relationship types
- Qdrant does NOT provide lineage depth

**Mission Control Equivalent:**
- /constitutional/query provides basic source_event_id
- Mission Control does NOT provide ancestor/descendant relationships
- Mission Control does NOT provide relationship types
- Mission Control does NOT provide lineage depth

**Classification:** REQUIRED

**Evidence:**
1. lineage_search.py requires authority_lineage for full lineage tracing
2. Ancestor/descendant relationships are constitutional requirements
3. Lineage depth is required for verification
4. Qdrant and Mission Control do not provide equivalent functionality

**Risk if Removed:** CONSTITUTIONAL VIOLATION - Loss of full lineage tracing and verification

---

## authority_witness

**Purpose:** Store witness roots for cryptographic proof of authority existence

**Current Usage:**
- authority_search.py - Witness verification
- lineage_search.py - Witness root identification
- Context Pack Builder - Witness information

**Required Fields:**
- artifact_id
- witness_root
- witness_signature
- witness_timestamp

**Constitutional Function:**
- Witness count verification
- Cryptographic proof of authority existence
- Integrity verification
- Constitutional compliance

**Qdrant Equivalent:**
- Qdrant does NOT store witness information
- Qdrant does NOT provide witness verification

**Mission Control Equivalent:**
- Mission Control does NOT provide witness information
- Mission Control does NOT provide witness verification

**Classification:** REQUIRED

**Evidence:**
1. authority_search.py requires authority_witness for mechanical verification
2. Witness verification is a constitutional requirement (one of 5 checks)
3. Cryptographic proof is required for constitutional compliance
4. Qdrant and Mission Control do not provide equivalent functionality

**Risk if Removed:** CONSTITUTIONAL VIOLATION - Loss of witness verification and cryptographic proof

---

## authority_supersession

**Purpose:** Store supersession relationships to exclude obsolete authorities

**Current Usage:**
- authority_search.py - Supersession chain handling
- Context Pack Builder - Supersession information

**Required Fields:**
- superseded
- superseded_by
- supersession_timestamp
- supersession_reason

**Constitutional Function:**
- Supersession chain identification
- Obsolete authority exclusion
- Authority currency verification
- Constitutional compliance

**Qdrant Equivalent:**
- Qdrant does NOT store supersession information
- Qdrant does NOT provide supersession handling

**Mission Control Equivalent:**
- Mission Control does NOT provide supersession handling
- Mission Control does NOT exclude superseded authorities

**Classification:** REQUIRED

**Evidence:**
1. authority_search.py requires authority_supersession for supersession handling
2. Supersession exclusion is a constitutional requirement
3. Authority currency verification is required
4. Qdrant and Mission Control do not provide equivalent functionality

**Risk if Removed:** CONSTITUTIONAL VIOLATION - Risk of returning superseded/obsolete authorities

---

# Usage Analysis

## Tool Usage

| Tool | authority_objects | authority_lineage | authority_witness | authority_supersession |
|------|------------------|-------------------|------------------|----------------------|
| authority_search.py | ✅ REQUIRED | ✅ REQUIRED | ✅ REQUIRED | ✅ REQUIRED |
| lineage_search.py | ❌ NOT USED | ✅ REQUIRED | ✅ REQUIRED | ❌ NOT USED |
| graph_expand.py | ❌ NOT USED | ✅ REQUIRED | ❌ NOT USED | ❌ NOT USED |
| Context Pack Builder | ✅ REQUIRED | ✅ REQUIRED | ✅ REQUIRED | ✅ REQUIRED |

**Conclusion:** All tables are actively used by multiple tools

---

## Component Usage

| Component | authority_objects | authority_lineage | authority_witness | authority_supersession |
|-----------|------------------|-------------------|------------------|----------------------|
| Search Worker | ✅ REQUIRED | ✅ REQUIRED | ✅ REQUIRED | ✅ REQUIRED |
| Context Pack Builder | ✅ REQUIRED | ✅ REQUIRED | ✅ REQUIRED | ✅ REQUIRED |
| Mission Control | ❌ NOT USED | ❌ NOT USED | ❌ NOT USED | ❌ NOT USED |

**Conclusion:** Search Worker and Context Pack Builder require all tables. Mission Control does not use them.

---

# Qdrant vs PostgreSQL Authority Infrastructure

## Data Model Comparison

**PostgreSQL Authority Objects:**
- Structured authority metadata
- Declared authority class hierarchy
- Mechanical verification fields
- Supersession relationships
- Witness information

**Qdrant Vector Embeddings:**
- Vector embeddings of document content
- Basic authority_level field
- Source event tracking
- Projection metadata

**Key Difference:** PostgreSQL provides structured authority metadata with constitutional guarantees. Qdrant provides vector similarity search with basic authority classification.

## Functional Overlap

| Functionality | PostgreSQL | Qdrant | Mission Control |
|--------------|-----------|--------|----------------|
| Authority class hierarchy | ✅ Declared | ❌ Not provided | ⚠️ Basic level only |
| Mechanical verification | ✅ 5-check | ❌ Not provided | ⚠️ Projection integrity only |
| Supersession handling | ✅ Full chain | ❌ Not provided | ❌ Not provided |
| Lineage tracing | ✅ Full PostgreSQL | ⚠️ Basic event_id | ⚠️ Basic event_id |
| Witness verification | ✅ Full | ❌ Not provided | ❌ Not provided |
| Vector similarity | ❌ Not provided | ✅ Full | ✅ Full |
| Projection integrity | ⚠️ Basic | ✅ Full | ✅ Full |

**Conclusion:** PostgreSQL and Qdrant provide complementary functionality, not overlapping functionality.

---

# Constitutional Impact Assessment

## If authority_objects Removed

**Lost Functionality:**
1. Declared authority class hierarchy
2. Mechanical verification (5-check)
3. Authority chain building
4. Supersession handling

**Constitutional Impact:** ❌ CONSTITUTIONAL VIOLATION
- Authority resolution would become vector similarity scoring
- Mechanical verification would be lost
- Superseded authorities would not be excluded

**Recovery:** NOT POSSIBLE - Qdrant and Mission Control do not provide equivalent functionality

---

## If authority_lineage Removed

**Lost Functionality:**
1. Full PostgreSQL lineage tracing
2. Ancestor/descendant relationships
3. Relationship type classification
4. Lineage depth calculation

**Constitutional Impact:** ❌ CONSTITUTIONAL VIOLATION
- Lineage integrity would be lost
- Verification would be incomplete
- Constitutional compliance would be violated

**Recovery:** NOT POSSIBLE - Qdrant and Mission Control do not provide equivalent functionality

---

## If authority_witness Removed

**Lost Functionality:**
1. Witness count verification
2. Cryptographic proof
3. Integrity verification

**Constitutional Impact:** ❌ CONSTITUTIONAL VIOLATION
- Witness verification would be lost
- Cryptographic proof would be lost
- Mechanical verification would be incomplete

**Recovery:** NOT POSSIBLE - Qdrant and Mission Control do not provide equivalent functionality

---

## If authority_supersession Removed

**Lost Functionality:**
1. Supersession chain identification
2. Obsolete authority exclusion
3. Authority currency verification

**Constitutional Impact:** ❌ CONSTITUTIONAL VIOLATION
- Superseded authorities would not be excluded
- Authority currency would be unknown
- Constitutional compliance would be violated

**Recovery:** NOT POSSIBLE - Qdrant and Mission Control do not provide equivalent functionality

---

# Architectural Direction

## Current Architecture

```
PostgreSQL Authority Infrastructure
├── authority_objects (REQUIRED)
├── authority_lineage (REQUIRED)
├── authority_witness (REQUIRED)
└── authority_supersession (REQUIRED)

Tools Using PostgreSQL:
├── authority_search.py
├── lineage_search.py
├── graph_expand.py
└── Context Pack Builder

Components Using PostgreSQL:
├── Search Worker
└── Context Pack Builder

Qdrant Vector Infrastructure
├── constitutional_memory collection
└── memory collection

Components Using Qdrant:
├── Mission Control
└── Qdrant Projection Worker
```

**Architecture Type:** COMPLEMENTARY - PostgreSQL and Qdrant serve different purposes

---

## Proposed Architecture (If Rewired)

```
Mission Control as Sole Retrieval Authority
├── Qdrant vector search
└── PostgreSQL authority endpoints (would need to be added)

PostgreSQL Authority Infrastructure
├── authority_objects (REQUIRED - accessed via Mission Control)
├── authority_lineage (REQUIRED - accessed via Mission Control)
├── authority_witness (REQUIRED - accessed via Mission Control)
└── authority_supersession (REQUIRED - accessed via Mission Control)

Tools Using Mission Control:
├── Search Worker (would need to be rewired)
└── Context Pack Builder (would need to be rewired)
```

**Architecture Type:** CENTRALIZED - Mission Control as proxy

**Implementation Required:**
1. Mission Control adds PostgreSQL authority endpoints
2. Search Worker rewired to use Mission Control
3. Context Pack Builder rewired to use Mission Control
4. All PostgreSQL functionality preserved in Mission Control

**Complexity:** HIGH - Significant development required

**Benefit:** Centralized retrieval through Mission Control

**Risk:** High implementation risk, potential for bugs, increased latency

---

# Recommendation

**KEEP CURRENT ARCHITECTURE**

**Reasoning:**
1. All PostgreSQL authority tables are REQUIRED for constitutional guarantees
2. None are obsolete or superseded by Qdrant
3. PostgreSQL and Qdrant provide complementary functionality
4. Rewiring would require significant Mission Control development
5. Current architecture has clear separation of concerns
6. Current architecture has excellent constitutional integrity
7. Current architecture has no issues

**Alternative:** If centralization is desired, Mission Control can add PostgreSQL authority endpoints as a proxy, but this adds complexity without constitutional benefit.

---

# Final Classification

| Table | Classification | Reason |
|------|---------------|--------|
| authority_objects | REQUIRED | Declared authority class hierarchy, mechanical verification, supersession handling |
| authority_lineage | REQUIRED | Full PostgreSQL lineage tracing, ancestor/descendant relationships |
| authority_witness | REQUIRED | Witness verification, cryptographic proof, integrity verification |
| authority_supersession | REQUIRED | Supersession chain handling, obsolete authority exclusion |

**Overall Classification:** ALL REQUIRED

---

**Investigation Status:** COMPLETED
