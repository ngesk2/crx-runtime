# Artifact Inventory

**Audit Date:** 2026-06-24
**Audit Type:** PHASE E.7B - Investigation 1
**Objective:** Enumerate every object currently existing in the runtime

---

# Executive Summary

Current runtime contains 4 major object categories:
1. **Documents** - 16 vault documents (constitution, laws, audits, capabilities, runbooks)
2. **Events** - PostgreSQL event store (EVENT_CREATED, CLAIM_CREATED, OBSERVATION_CREATED, PROJECTION_CREATED, etc.)
3. **Runtime Objects** - Claims, observations, projections, repositories, code symbols
4. **Knowledge Objects** - PostgreSQL authority infrastructure (authority_objects, authority_lineage, authority_witness, authority_supersession)

---

# Documents

## Constitutional Documents

**Location:** vault/constitution/

| Document | Size | Purpose | Current Artifact Type |
|----------|------|---------|----------------------|
| CONSTITUTION.md | 9,279 bytes | Foundational constitutional document | CONSTITUTIONAL_DOCUMENT |

**Total:** 1 document

---

## Law Documents

**Location:** vault/laws/

| Document | Size | Purpose | Current Artifact Type |
|----------|------|---------|----------------------|
| IDENTITY_LAW.md | 8,231 bytes | Identity and identity law | CONSTITUTIONAL_LAW |
| REPLAY_LAW.md | 7,696 bytes | Replay determinism law | CONSTITUTIONAL_LAW |
| WITNESS_LAW.md | 6,694 bytes | Witness law | CONSTITUTIONAL_LAW |

**Total:** 3 documents

---

## Audit Documents

**Location:** vault/audits/

| Document | Size | Purpose | Current Artifact Type |
|----------|------|---------|----------------------|
| CONTINUITY_DESTRUCTION_AUDIT.md | 12,148 bytes | Continuity destruction audit | AUDIT_REPORT |
| CREDENTIAL_AUTHORITY_CENSUS.md | 12,877 bytes | Credential authority census | AUDIT_REPORT |
| EXECUTION_SUMMARY.md | 11,366 bytes | Execution summary | AUDIT_REPORT |
| HUMAN_OBSERVABILITY_CERTIFICATION.md | 12,621 bytes | Human observability certification | CERTIFICATION |
| POSTGRES_SURVIVABILITY_REPORT.md | 8,337 bytes | PostgreSQL survivability report | AUDIT_REPORT |
| QDRANT_OPERATIONAL_PROOF.md | 6,026 bytes | Qdrant operational proof | AUDIT_REPORT |
| REALITY_CHECK.md | 12,387 bytes | Reality check audit | AUDIT_REPORT |

**Total:** 7 documents

---

## Capability Documents

**Location:** vault/capabilities/

| Document | Size | Purpose | Current Artifact Type |
|----------|------|---------|----------------------|
| CREDENTIAL_SURVIVABILITY_MATRIX.md | 8,900 bytes | Credential survivability matrix | CAPABILITY_SPEC |
| MISSION_CONTROL_CAPABILITY_MATRIX.md | 5,120 bytes | Mission Control capability matrix | CAPABILITY_SPEC |
| OBSERVABILITY_MATRIX.md | 5,859 bytes | Observability matrix | CAPABILITY_SPEC |
| OPENWEBUI_MISSION_CONTROL_INTEGRATION.md | 10,314 bytes | Open WebUI integration | INTEGRATION_SPEC |

**Total:** 4 documents

---

## Runbook Documents

**Location:** vault/runbooks/

| Document | Size | Purpose | Current Artifact Type |
|----------|------|---------|----------------------|
| OPERATOR_RUNBOOKS.md | 11,839 bytes | Operator runbooks | RUNBOOK |

**Total:** 1 document

---

## Document Summary

**Total Documents:** 16
- Constitutional Documents: 1
- Law Documents: 3
- Audit Documents: 7
- Capability Documents: 4
- Runbook Documents: 1

---

# Events

## PostgreSQL Event Store

**Location:** PostgreSQL events table

| Event Type | Purpose | Current Artifact Type |
|------------|---------|----------------------|
| EVENT_CREATED | Event creation | EVENT |
| CLAIM_CREATED | Claim creation | CLAIM |
| OBSERVATION_CREATED | Observation creation | OBSERVATION |
| CONTENT_SUMMARIZED | Content summarization | DERIVATION |
| SUMMARY_CREATED | Summary creation | DERIVATION |
| ANALYSIS_CREATED | Analysis creation | DERIVATION |
| DOCUMENT_IMPORTED | Document import | DOCUMENT |
| DOCUMENT_UPDATED | Document update | DOCUMENT |
| PROJECTION_CREATED | Projection creation | PROJECTION |
| WITNESS_CREATED | Witness creation | WITNESS |

**Total:** 10+ event types

---

# Runtime Objects

## Claims

**Location:** PostgreSQL claims table (if exists) or derived from events

| Object Type | Purpose | Current Artifact Type |
|------------|---------|----------------------|
| Claim | Constitutional claim | CLAIM |
| Verified Claim | Verified constitutional claim | VERIFIED_CLAIM |
| Superseded Claim | Superseded claim | SUPERSEDED_CLAIM |

**Total:** 3 claim types

---

## Observations

**Location:** PostgreSQL observations table (if exists) or derived from events

| Object Type | Purpose | Current Artifact Type |
|------------|---------|----------------------|
| Observation | System observation | OBSERVATION |
| Verified Observation | Verified observation | VERIFIED_OBSERVATION |
| Temporary Observation | Temporary observation | TEMPORARY_OBSERVATION |

**Total:** 3 observation types

---

## Projections

**Location:** PostgreSQL projections table

| Object Type | Purpose | Current Artifact Type |
|------------|---------|----------------------|
| Projection | Event projection to Qdrant | PROJECTION |
| Verified Projection | Verified projection | VERIFIED_PROJECTION |
| Constitutional Projection | Constitutional document projection | CONSTITUTIONAL_PROJECTION |

**Total:** 3 projection types

---

## Repositories

**Location:** File system + PostgreSQL repository metadata

| Object Type | Purpose | Current Artifact Type |
|------------|---------|----------------------|
| Repository | Code repository | REPOSITORY |
| Repository File | Source code file | REPOSITORY_FILE |
| Repository Symbol | Code symbol/function | CODE_SYMBOL |
| Repository Relationship | Import/call/write relationship | REPOSITORY_RELATIONSHIP |

**Total:** 4 repository types

---

## Runtime Object Summary

**Total Runtime Objects:** 13
- Claims: 3
- Observations: 3
- Projections: 3
- Repositories: 4

---

# Knowledge Objects

## PostgreSQL Authority Infrastructure

**Location:** PostgreSQL authority tables

### authority_objects

| Field | Purpose | Constitutional Significance |
|-------|---------|---------------------------|
| artifact_id | Unique artifact identifier | IDENTITY_LAW |
| title | Artifact title | Metadata |
| description | Artifact description | Metadata |
| category | Authority category | AUTHORITY_CLASS |
| authority_level | Authority level | AUTHORITY_CLASS |
| payload_hash | Payload hash | VERIFICATION |
| sha256 | SHA256 hash | VERIFICATION |
| status | Artifact status | VERIFICATION |

**Current Artifact Type:** AUTHORITY_OBJECT

---

### authority_lineage

| Field | Purpose | Constitutional Significance |
|-------|---------|---------------------------|
| ancestor | Ancestor artifact_id | LINEAGE |
| descendant | Descendant artifact_id | LINEAGE |
| relation | Relationship type | LINEAGE |
| metadata | Lineage metadata | LINEAGE |

**Current Artifact Type:** LINEAGE_OBJECT

---

### authority_witness

| Field | Purpose | Constitutional Significance |
|-------|---------|---------------------------|
| artifact_id | Artifact identifier | WITNESS_LAW |
| witness_root | Witness root | WITNESS_LAW |
| witness_signature | Cryptographic signature | VERIFICATION |
| witness_timestamp | Witness timestamp | VERIFICATION |

**Current Artifact Type:** WITNESS_OBJECT

---

### authority_supersession

| Field | Purpose | Constitutional Significance |
|-------|---------|---------------------------|
| superseded | Superseded artifact_id | AUTHORITY_LAW |
| superseded_by | Superseding artifact_id | AUTHORITY_LAW |
| supersession_timestamp | Supersession timestamp | AUTHORITY_LAW |
| supersession_reason | Supersession reason | AUTHORITY_LAW |

**Current Artifact Type:** SUPERSESSION_OBJECT

---

## Knowledge Object Summary

**Total Knowledge Objects:** 4
- authority_objects: 1
- authority_lineage: 1
- authority_witness: 1
- authority_supersession: 1

---

# Qdrant Objects

## Qdrant Collections

**Location:** Qdrant vector database

| Collection | Purpose | Current Artifact Type |
|------------|---------|----------------------|
| constitutional_memory | Constitutional document embeddings | CONSTITUTIONAL_PROJECTION |
| constitutional_documents | Additional constitutional storage | CONSTITUTIONAL_PROJECTION |
| memory | Document memory embeddings | DOCUMENT_PROJECTION |

**Total:** 3 collections

---

## Qdrant Points

**Location:** Qdrant collections

| Object Type | Purpose | Current Artifact Type |
|------------|---------|----------------------|
| Qdrant Point | Vector embedding with payload | VECTOR_PROJECTION |
| Constitutional Point | Constitutional document embedding | CONSTITUTIONAL_PROJECTION |
| Document Point | Document embedding | DOCUMENT_PROJECTION |

**Total:** 3 point types

---

# Summary

## Total Object Count

| Category | Count |
|----------|-------|
| Documents | 16 |
| Events | 10+ |
| Runtime Objects | 13 |
| Knowledge Objects | 4 |
| Qdrant Objects | 6 |
| **Total** | **49+** |

---

## Current Artifact Types

| Artifact Type | Count | Source |
|--------------|-------|--------|
| CONSTITUTIONAL_DOCUMENT | 1 | Vault |
| CONSTITUTIONAL_LAW | 3 | Vault |
| AUDIT_REPORT | 6 | Vault |
| CERTIFICATION | 1 | Vault |
| CAPABILITY_SPEC | 4 | Vault |
| INTEGRATION_SPEC | 1 | Vault |
| RUNBOOK | 1 | Vault |
| EVENT | 10+ | PostgreSQL |
| CLAIM | 3 | PostgreSQL |
| OBSERVATION | 3 | PostgreSQL |
| PROJECTION | 3 | PostgreSQL |
| REPOSITORY | 4 | File system |
| AUTHORITY_OBJECT | 1 | PostgreSQL |
| LINEAGE_OBJECT | 1 | PostgreSQL |
| WITNESS_OBJECT | 1 | PostgreSQL |
| SUPERSESSION_OBJECT | 1 | PostgreSQL |
| VECTOR_PROJECTION | 3 | Qdrant |

**Total Artifact Types:** 18

---

# Key Finding

**Current State:** Fragmented object model with 18 different artifact types across 5 different storage systems (Vault, PostgreSQL events, PostgreSQL authority, File system, Qdrant).

**Target State:** Unified canonical artifact schema with single artifact type across all storage systems.

---

**Investigation Status:** COMPLETED
