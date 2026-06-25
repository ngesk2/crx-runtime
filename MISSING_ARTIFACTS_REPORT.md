# Missing Artifacts Report

**Audit Date:** 2026-06-25
**Audit Type:** PHASE F.1 — Artifact Gap Analysis
**Objective:** Identify every artifact defined in constitutional law but missing in implementation.

---

# Critical Severity

Constitution depends on artifact but artifact does not exist in any form.

## 1. policy_decision

| Aspect | Detail |
|--------|--------|
| **Constitutional Definition** | Root fact in layer0_kernel.md: "Recorded authorization or denial of mutation." Required by REPLAY_LAW.md minimum replay set. |
| **Current State** | Does not exist in any form — no table, no model, no worker, no endpoint. |
| **Constitutional Impact** | ❌ Cannot enforce minimum replay set. ❌ Cannot trace mutation authorization. ❌ Cannot replay policy era. |
| **Why Critical** | REPLAY_LAW.md explicitly requires policy decisions for deterministic replay. Without them, replay cannot determine which policies were in effect at each point in constitutional time. |

## 2. witness

| Aspect | Detail |
|--------|--------|
| **Constitutional Definition** | Full law document (WITNESS_LAW.md). DETERMINISTIC_EVIDENCE_ARTIFACT. Referenced in REPLAY_LAW.md, TRUTH_LAW.md, and EVENT_LAW.md. |
| **Current State** | `authority_witness` table defined in SQL but never created. No producer. No consumer. No data. |
| **Constitutional Impact** | ❌ Cannot perform witness verification (always returns False). ❌ Cannot create witness roots. ❌ Cannot detect witness divergence. ❌ WITNESS_LAW is unimplementable. |
| **Why Critical** | WITNESS_LAW is a standalone constitutional law. Its primary artifact does not exist. This is a constitutional violation. |

## 3. supersession

| Aspect | Detail |
|--------|--------|
| **Constitutional Definition** | Referenced in EVENT_LAW.md and authority_search.py. `authority_supersession` table defined. |
| **Current State** | `authority_supersession` table defined in SQL but never created. No producer. No consumer. $auth_code = query fails. |
| **Constitutional Impact** | ❌ Cannot track which artifacts supersede others. ❌ Cannot exclude superseded artifacts from authority resolution. ❌ authority_search.py supersession filtering is dead code. |
| **Why Critical** | Without supersession, superseded authorities are treated as current. This violates AUTHORITY_LAW — the system cannot distinguish active from obsolete authority. |

## 4. evidence

| Aspect | Detail |
|--------|--------|
| **Constitutional Definition** | KNOWLEDGE.md: "Artifacts supporting or refuting claims. Evidence must maintain lineage." |
| **Current State** | Does not exist in any form — no table, no model, no persistence. Contradiction worker computes evidence stance in-memory per query and discards results. |
| **Constitutional Impact** | ❌ Cannot maintain evidence lineage (required by constitution). ❌ Evidence is ephemeral — lost after each reasoning cycle. ❌ Cannot audit which evidence supported which claim. |
| **Why Critical** | Constitution requires evidence to maintain lineage. Current implementation violates this — evidence is computed fresh each query with no persistence or traceability. |

---

# High Severity

Artifact exists partially but breaks replay, retrieval, lineage, witness, or authority.

## 5. observation

| Aspect | Detail |
|--------|--------|
| **Constitutional Definition** | Observation Event class (EVENT_LAW.md). TEMPORARY_OBSERVATION authority. Non-truth (TRUTH_LAW.md). |
| **Current State** | No `observations` table. Observations stored as events only (OBSERVATION_CREATED). Producer workers use old schema (may silently fail). No observation-specific consumer. |
| **Constitutional Impact** | ❌ Observation events exist in events table but may fail on insert. ❌ No observation-specific retrieval. ❌ Cannot distinguish observations from other event types without filtering. |
| **Why High** | Observations are a core event class. They exist as events but are not independently retrievable, queryable, or replayable as observations. |

## 6. claim

| Aspect | Detail |
|--------|--------|
| **Constitutional Definition** | terminology.md: "propositional assertion." CLAIM_CREATED event. CANDIDATE_CLAIM_CREATED distinction. |
| **Current State** | `claims` table exists but is empty. Claim workers use old schema (inserts silently fail). No claim consumer. Claim verification gate exists in code but pipeline is dead. |
| **Constitutional Impact** | ❌ Claims table is dead storage. ❌ Claim verification gate is unreachable code. ❌ No system reads or acts on claims. |
| **Why High** | Claims table exists but the pipeline feeding it is broken. The constitutional claim lifecycle (candidate → verified → recorded) is dead code. |

## 7. authority_object

| Aspect | Detail |
|--------|--------|
| **Constitutional Definition** | terminology.md: "Durable constitutional content." Authority class hierarchy (10 classes). |
| **Current State** | `objects` table exists but lacks authority_class field. `authority_objects` table never created. Python enum exists (AuthorityClass) but no persistence. |
| **Constitutional Impact** | ❌ Authority resolution is in-memory only. ❌ authority_class is not persisted on any object. ❌ Every authority query must recompute declarations. |
| **Why High** | Authority is the foundation of constitutional reasoning. It exists as code enum but not as persisted data — authority declarations are lost on restart. |

## 8. capability

| Aspect | Detail |
|--------|--------|
| **Constitutional Definition** | GOVERNANCE.md, KNOWLEDGE.md. Capability enum in security/capabilities.py. |
| **Current State** | Capability enum exists (11 values). No persistence. No dynamic creation. Minimal enforcement (Drive adapter only). |
| **Constitutional Impact** | ❌ Capabilities cannot be granted or revoked dynamically. ❌ Most API endpoints do not enforce capabilities. ❌ No capability audit trail. |
| **Why High** | Capability enforcement exists at the code level but is not constitutional — cannot be replayed, audited, or changed without code deployment. |

---

# Medium Severity

Artifact exists but is not integrated.

## 9. projection

| Aspect | Detail |
|--------|--------|
| **Constitutional Definition** | Layer 4 (disposable). PROJECTION_CREATED event. Qdrant projection cache. |
| **Current State** | Projection pipeline works (5 documents projected to Qdrant). `projections` table exists but may not track all Qdrant projections. `projection_status` table tracks Qdrant state separately. |
| **Constitutional Impact** | ⚠️ Projections table and projection_status table are not synced. ⚠️ 1,039 unprojected events. |
| **Why Medium** | Projection pipeline exists and works but only covers 5/1,044 events. The `projections` table and `projection_status` table track different things — potential for divergence. |

## 10. constitutional_event

| Aspect | Detail |
|--------|--------|
| **Constitutional Definition** | EVENT_LAW.md. 6 classes, 22 types. |
| **Current State** | Events table exists (1,044 rows). CQRS schema is correct. Two incompatible schemas (CQRS vs old) create producer split — 7 producers use correct CQRS, 6+ use old schema. |
| **Constitutional Impact** | ⚠️ Schema divergence means some event producers silently fail. ⚠️ Cannot trust that all event types are actually recorded. |
| **Why Medium** | Events are the most mature artifact (70% completeness). The schema divergence issue is serious but confined to a specific set of legacy workers. |

## 11. lineage

| Aspect | Detail |
|--------|--------|
| **Constitutional Definition** | REPLAY_LAW.md, IDENTITY_LAW.md. Lineage edge is root fact. |
| **Current State** | `lineage` table exists (object version tracking). `authority_lineage` table never created. Two lineage concepts (object version vs authority ancestry) are conflated. |
| **Constitutional Impact** | ⚠️ Object version lineage works. ⚠️ Authority lineage does not exist. ⚠️ lineage_search.py queries authority_lineage (missing) and silently degrades. |
| **Why Medium** | Object lineage exists. Authority lineage is the gap — required for constitutional authority resolution but never implemented. |

## 12. document

| Aspect | Detail |
|--------|--------|
| **Constitutional Definition** | DOCUMENT_IMPORTED event. IDENTITY_LAW.md document identity. |
| **Current State** | Document ingestion works (5 documents). `objects` table stores metadata. `documents` table never created. File system is primary document store. |
| **Constitutional Impact** | ⚠️ Documents stored on filesystem outside constitutional storage. ⚠️ No document-specific database table. ⚠️ Document identity (UUID) exists but file_path is also used. |
| **Why Medium** | Document pipeline works end-to-end (filesystem → event → Qdrant → retrieval). The missing `documents` table means no constitutional document registry — documents are only addressable via events or filesystem path. |

## 13. attestation

| Aspect | Detail |
|--------|--------|
| **Constitutional Definition** | Referenced in WITNESS_LAW.md but not established as standalone artifact. |
| **Current State** | Does not exist in any form. No constitutional requirement to exist independently (attestation is a witness subtype, not a separate artifact). |
| **Constitutional Impact** | ⚠️ Attestation is not a constitutionally required artifact — it is a concept within witness. LOW severity ensures. |
| **Why Medium** | Attestation is not fully defined as a constitutional artifact. It may not need independent existence. Labeled MEDIUM because the term appears in WITNESS_LAW.md without clear implementation path. |

---

# Gap Summary by Severity

| Severity | Count | Artifacts |
|----------|-------|-----------|
| CRITICAL | 4 | policy_decision, witness, supersession, evidence |
| HIGH | 4 | observation, claim, authority_object, capability |
| MEDIUM | 5 | projection, constitutional_event, lineage, document, attestation |
| **Total** | **13** | |

---

**Report Status:** COMPLETED
