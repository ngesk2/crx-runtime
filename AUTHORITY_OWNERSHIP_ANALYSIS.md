# Authority Ownership Model Analysis

**Audit Date:** 2026-06-24
**Audit Type:** PHASE E.7A - Investigation 5
**Objective:** Evaluate which layer should own authority resolution

---

# Executive Summary

**Current Architecture:** Search Worker owns authority resolution through PostgreSQL authority tables.

**Recommended Architecture:** Search Worker should continue owning authority resolution. Mission Control should own Qdrant vector retrieval. These are complementary, not competing, responsibilities.

**Reasoning:** Authority resolution requires PostgreSQL authority tables for constitutional guarantees (declared class hierarchy, supersession, witness verification). Mission Control does not provide these capabilities.

---

# Authority Resolution Requirements

## Constitutional Requirements

**Authority Resolution Must:**
1. Resolve by declared authority class hierarchy (not scored)
2. Handle supersession chains
3. Perform mechanical verification (5-check)
4. Trace full PostgreSQL lineage
5. Identify witness roots
6. Provide cryptographic integrity guarantees

**Authority Resolution Must NOT:**
1. Use vector similarity scoring for authority
2. Return superseded authorities
3. Skip mechanical verification
4. Omit witness information
5. Violate constitutional guarantees

---

# Option Analysis

## Option A: Search Worker Owns Authority Resolution

**Current Implementation:**
- authority_search.py - PostgreSQL authority tables
- lineage_search.py - PostgreSQL lineage tables
- graph_expand.py - PostgreSQL relationship tables
- Declared authority class hierarchy
- Mechanical verification (5-check)
- Supersession handling
- Witness verification

**Constitutional Integrity:** ✅ EXCELLENT
- All constitutional requirements met
- Mechanical authority resolution
- Full PostgreSQL lineage
- Witness verification

**Replay Safety:** ✅ EXCELLENT
- PostgreSQL is source of truth
- Authority tables are derived from events
- Replayable from event store

**Freeze Compatibility:** ✅ EXCELLENT
- Authority tables can be frozen
- Lineage can be frozen
- Witness can be frozen

**Auditability:** ✅ EXCELLENT
- Clear authority chain
- Supersession tracking
- Verification status

**Maintainability:** ✅ GOOD
- Clear separation of concerns
- Tools are focused
- PostgreSQL schema is stable

**Long-Term Viability:** ✅ EXCELLENT
- PostgreSQL is mature technology
- Authority tables are constitutional
- No migration risk

**Complexity:** LOW
- Direct PostgreSQL access
- No additional layers
- Clear data flow

---

## Option B: Mission Control Owns Authority Resolution

**Proposed Implementation:**
- Mission Control adds PostgreSQL authority endpoints
- Search Worker calls Mission Control for authority resolution
- Mission Control enforces constitutional constraints

**Constitutional Integrity:** ✅ EXCELLENT (if implemented correctly)
- Can preserve all constitutional requirements
- Centralized enforcement
- Consistent application

**Replay Safety:** ✅ EXCELLENT
- PostgreSQL remains source of truth
- Mission Control is a proxy
- Replayable from event store

**Freeze Compatibility:** ✅ EXCELLENT
- Mission Control can be frozen
- Authority tables can be frozen
- Versioned endpoints

**Auditability:** ✅ EXCELLENT
- Centralized logging
- Consistent audit trail
- Request/response tracking

**Maintainability:** ⚠️ MEDIUM
- Increased Mission Control complexity
- Additional endpoint maintenance
- Dependency on Mission Control

**Long-Term Viability:** ✅ GOOD
- Centralized authority resolution
- Consistent enforcement
- Potential for future enhancements

**Complexity:** MEDIUM
- Additional proxy layer
- Network dependency
- Increased latency

**Implementation Risk:** MEDIUM
- Requires Mission Control development
- Requires PostgreSQL access in Mission Control
- Requires endpoint design

---

## Option C: Reasoning Gateway Owns Authority Resolution

**Proposed Implementation:**
- Reasoning Gateway adds authority resolution
- Search Worker calls Reasoning Gateway
- Reasoning Gateway enforces constitutional constraints

**Constitutional Integrity:** ⚠️ RISK
- Reasoning Gateway is orchestration layer
- Adding authority resolution violates separation of concerns
- Risk of mixing orchestration with retrieval

**Replay Safety:** ⚠️ RISK
- Reasoning Gateway is not source of truth
- Additional abstraction layer
- Replay complexity increases

**Freeze Compatibility:** ⚠️ RISK
- Reasoning Gateway state is complex
- Freeze would include orchestration state
- Increased freeze scope

**Auditability:** ⚠️ MEDIUM
- Mixed responsibilities in audit logs
- Harder to isolate authority resolution
- Increased log complexity

**Maintainability:** ❌ POOR
- Violates separation of concerns
- Reasoning Gateway becomes bloated
- Harder to debug

**Long-Term Viability:** ❌ POOR
- Architectural debt
- Harder to evolve
- Increased coupling

**Complexity:** HIGH
- Reasoning Gateway complexity increases
- Mixed responsibilities
- Harder to understand

**Implementation Risk:** HIGH
- Architectural violation
- Significant refactoring
- High risk of bugs

---

## Option D: Dedicated Constitutional Retrieval Service

**Proposed Implementation:**
- New service: ConstitutionalRetrieval
- Owns authority resolution, lineage, graph expansion
- Search Worker calls ConstitutionalRetrieval
- Mission Control calls ConstitutionalRetrieval

**Constitutional Integrity:** ✅ EXCELLENT
- Focused on constitutional retrieval
- Can implement all requirements
- Clear constitutional scope

**Replay Safety:** ✅ EXCELLENT
- PostgreSQL remains source of truth
- Service is stateless
- Replayable from event store

**Freeze Compatibility:** ✅ EXCELLENT
- Service can be frozen
- Clear service boundary
- Versioned API

**Auditability:** ✅ EXCELLENT
- Focused audit logs
- Clear service boundaries
- Request/response tracking

**Maintainability:** ✅ EXCELLENT
- Clear separation of concerns
- Focused service
- Easy to evolve

**Long-Term Viability:** ✅ EXCELLENT
- Microservice architecture
- Independent scaling
- Clear ownership

**Complexity:** MEDIUM
- New service to deploy
- Additional infrastructure
- Service discovery

**Implementation Risk:** MEDIUM
- New service development
- Infrastructure setup
- Deployment complexity

---

# Sovereignty Analysis

## Current Architecture (Option A)

**Search Worker:**
- Sovereignty: DERIVATION (observes PostgreSQL authority)
- Authority: NO (does not create truth)
- Constitutional Awareness: HIGH

**PostgreSQL Authority Tables:**
- Sovereignty: DERIVATION (derived from constitutional truth)
- Authority: NO (metadata storage)
- Constitutional Awareness: HIGH

**Mission Control:**
- Sovereignty: STRUCTURAL GUARD (Qdrant retrieval)
- Authority: NO (does not create truth)
- Constitutional Awareness: HIGH

**Sovereignty Count:** 0 sovereign components (all derivation/structural guard)

---

## Option B (Mission Control)

**Mission Control:**
- Sovereignty: STRUCTURAL GUARD (Qdrant retrieval + PostgreSQL authority proxy)
- Authority: NO (does not create truth)
- Constitutional Awareness: HIGH

**Search Worker:**
- Sovereignty: DERIVATION (observes Mission Control)
- Authority: NO (does not create truth)
- Constitutional Awareness: HIGH

**PostgreSQL Authority Tables:**
- Sovereignty: DERIVATION (derived from constitutional truth)
- Authority: NO (metadata storage)
- Constitutional Awareness: HIGH

**Sovereignty Count:** 0 sovereign components (all derivation/structural guard)

---

## Option C (Reasoning Gateway)

**Reasoning Gateway:**
- Sovereignty: DERIVATION (orchestration + authority proxy)
- Authority: NO (does not create truth)
- Constitutional Awareness: HIGH

**Search Worker:**
- Sovereignty: DERIVATION (observes Reasoning Gateway)
- Authority: NO (does not create truth)
- Constitutional Awareness: HIGH

**PostgreSQL Authority Tables:**
- Sovereignty: DERIVATION (derived from constitutional truth)
- Authority: NO (metadata storage)
- Constitutional Awareness: HIGH

**Sovereignty Count:** 0 sovereign components (all derivation/structural guard)

**Architectural Violation:** Reasoning Gateway mixing orchestration with retrieval

---

## Option D (Dedicated Service)

**ConstitutionalRetrieval:**
- Sovereignty: DERIVATION (observes PostgreSQL authority)
- Authority: NO (does not create truth)
- Constitutional Awareness: HIGH

**Search Worker:**
- Sovereignty: DERIVATION (observes ConstitutionalRetrieval)
- Authority: NO (does not create truth)
- Constitutional Awareness: HIGH

**Mission Control:**
- Sovereignty: DERIVATION (observes ConstitutionalRetrieval)
- Authority: NO (does not create truth)
- Constitutional Awareness: HIGH

**PostgreSQL Authority Tables:**
- Sovereignty: DERIVATION (derived from constitutional truth)
- Authority: NO (metadata storage)
- Constitutional Awareness: HIGH

**Sovereignty Count:** 0 sovereign components (all derivation/structural guard)

---

# Decision Matrix

| Option | Constitutional Integrity | Replay Safety | Freeze Compatibility | Auditability | Maintainability | Long-Term Viability | Complexity | Total Score |
|--------|------------------------|---------------|---------------------|--------------|-----------------|---------------------|------------|-------------|
| A: Search Worker | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 34 |
| B: Mission Control | 5 | 5 | 5 | 5 | 3 | 4 | 3 | 30 |
| C: Reasoning Gateway | 2 | 2 | 2 | 3 | 1 | 1 | 1 | 12 |
| D: Dedicated Service | 5 | 5 | 5 | 5 | 5 | 5 | 3 | 33 |

**Scoring:** 5 = Excellent, 4 = Good, 3 = Medium, 2 = Risk, 1 = Poor, Complexity: 5 = Low, 1 = High

---

# Recommendation

**Primary Recommendation: Option A (Search Worker Owns Authority Resolution)**

**Reasoning:**
1. Highest total score (34)
2. Lowest complexity
3. No implementation risk
4. Clear separation of concerns
5. Excellent constitutional integrity
6. Excellent long-term viability

**Secondary Recommendation: Option D (Dedicated Constitutional Retrieval Service)**

**Reasoning:**
1. Second highest total score (33)
2. Excellent constitutional integrity
3. Excellent maintainability
4. Clear service boundaries
5. Future-proof for microservice architecture

**When to Consider Option D:**
- If multiple components need authority resolution
- If centralized constitutional retrieval is desired
- If microservice architecture is preferred
- If independent scaling is required

**When to Consider Option B:**
- If Mission Control already has PostgreSQL access
- If centralization through Mission Control is desired
- If additional Mission Control endpoints are acceptable

**Never Consider Option C:**
- Architectural violation
- Poor separation of concerns
- High implementation risk
- Poor long-term viability

---

# Final Recommendation

**KEEP CURRENT ARCHITECTURE (Option A)**

Search Worker should continue owning authority resolution through PostgreSQL authority tables. Mission Control should continue owning Qdrant vector retrieval. These are complementary responsibilities serving different data sources with different constitutional requirements.

**Rationale:**
1. Authority resolution requires PostgreSQL authority tables for constitutional guarantees
2. Mission Control does not provide required constitutional semantics
3. Current architecture has excellent constitutional integrity
4. Current architecture has lowest complexity
5. No implementation risk
6. Clear separation of concerns

---

**Investigation Status:** COMPLETED
