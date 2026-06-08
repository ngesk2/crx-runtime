# PHASE B — EVENT AUTHORITY CONSOLIDATION
## Event Authority Consolidation Report

**Audit Date:** 2025-01-08
**Target:** Event schemas and event authority
**Repository:** CRX Constitutional Specification Repository

---

## EXECUTIVE SUMMARY

**FINDING: MULTIPLE COMPETING EVENT SCHEMAS EXIST**

Multiple event schemas exist across different domains with no single canonical event authority. Event definitions are scattered across:
- CRX runtime: `event_log.ts` (minimal event logging)
- JS.txt archive: No explicit event schema modules
- External schemas: `audit-event.schema.json`, `claim.schema.json`, `decision.schema.json`, `argument-graph.schema.json`
- CascadeProjects: `canonical-event-envelope.json` (proposed)

**RECOMMENDATION:** Establish ONE canonical event authority by consolidating into `canonical-event-envelope.json` from CascadeProjects.

---

## AUDIT SCOPE

### Target Event Components
- Event schemas
- Event types
- Event envelopes
- Event validation
- Event serialization
- Event ordering
- Event fingerprinting

### Search Locations
- CRX runtime: `event_log.ts`
- JS.txt archive: 59 modules (searched for event-related modules)
- External schemas: CRX knowledge/vos, Codex archives, CascadeProjects

---

## AUDIT FINDINGS

### Event Authorities Found

| Authority | Location | Primary Authority | Replay Sensitivity | Status |
|-----------|----------|-------------------|-------------------|--------|
| `event_log.ts` | CRX runtime | event | CRITICAL | MINIMAL |
| `audit-event.schema.json` | CRX knowledge/vos | event | MEDIUM | COMPLETE |
| `claim.schema.json` | CRX knowledge | event | MEDIUM | DOMAIN-SPECIFIC |
| `decision.schema.json` | CRX knowledge | event | MEDIUM | DOMAIN-SPECIFIC |
| `argument-graph.schema.json` | CRX knowledge/vos | event | MEDIUM | DOMAIN-SPECIFIC |
| `canonical-event-envelope.json` | CascadeProjects | event | HIGH | PROPOSED |

### CRX Runtime Event Authority: `event_log.ts`

**MODULE:** `runtime/kernel/commit-service/src/events/event_log.ts`

**PRIMARY_AUTHORITY:** event

**SECONDARY_AUTHORITIES:** persistence

**RESPONSIBILITY:** Append execution event row to PostgreSQL

**INPUTS:** `type: string`, `payload: any`

**OUTPUTS:** DB insert (void)

**DEPENDENCIES:** `../persistence/db` (pg Pool)

**SIDE_EFFECTS:** PostgreSQL write

**REPLAY_SENSITIVITY:** CRITICAL — event log is replay substrate

**DETERMINISM_SENSITIVITY:** MEDIUM — no event_id, no ordering key, no fingerprint

**CAPABILITIES:**
- Minimal event logging to PostgreSQL
- Type and payload fields only
- No event envelope structure
- No event validation
- No event fingerprinting
- No event ordering guarantees
- No event schema enforcement

**GAPS:**
- No event envelope structure
- No event_id field for ordering
- No timestamp field for replay ordering
- No fingerprint field for replay verification
- No domain separation for event types
- No event validation
- No event serialization guarantees

### External Event Schemas

#### `audit-event.schema.json` (CRX knowledge/vos)

**LOCATION:** `CRX/knowledge/vos/cos/schema/audit-event.schema.json`

**PRIMARY_AUTHORITY:** event

**REPLAY_SENSITIVITY:** MEDIUM

**FIELDS:**
- `id`: Event identifier
- `timestamp`: Event timestamp
- `actor`: Event actor
- `action`: Event action
- `artifactType`: Artifact type
- `artifactId`: Artifact identifier
- `lineage`: Lineage information
- `policyVersion`: Policy version

**STATUS:** COMPLETE event structure

**DOMAIN:** Audit events

#### `claim.schema.json` (CRX knowledge)

**LOCATION:** `CRX/knowledge/authoritative/claim.schema.json`

**PRIMARY_AUTHORITY:** event

**REPLAY_SENSITIVITY:** MEDIUM

**FIELDS:**
- `claim_id`: Claim identifier
- `proposer`: Claim proposer
- `scope`: Claim scope
- `assertion`: Claim assertion
- `evidence_refs`: Evidence references
- `requested_authority`: Requested authority
- `risk_level`: Risk level
- `status`: Claim status

**STATUS:** DOMAIN-SPECIFIC (UCIA)

**DOMAIN:** UCIA claims

#### `decision.schema.json` (CRX knowledge)

**LOCATION:** `CRX/knowledge/authoritative/decision.schema.json`

**PRIMARY_AUTHORITY:** event

**REPLAY_SENSITIVITY:** MEDIUM

**FIELDS:**
- `decision_id`: Decision identifier
- `review_authority`: Review authority
- `claim_id`: Associated claim
- `outcome`: Decision outcome
- `justification`: Decision justification
- `accepted_claims`: Accepted claims
- `rejected_claims`: Rejected claims

**STATUS:** DOMAIN-SPECIFIC (UCIA)

**DOMAIN:** UCIA decisions

#### `argument-graph.schema.json` (CRX knowledge/vos)

**LOCATION:** `CRX/knowledge/vos/cos/schema/argument-graph.schema.json`

**PRIMARY_AUTHORITY:** event

**REPLAY_SENSITIVITY:** MEDIUM

**FIELDS:**
- `nodes`: Graph nodes
- `edges`: Graph edges
- `metadata`: Graph metadata

**STATUS:** DOMAIN-SPECIFIC

**DOMAIN:** Argument graphs

#### `canonical-event-envelope.json` (CascadeProjects)

**LOCATION:** `CascadeProjects/events/canonical-event-envelope.json`

**PRIMARY_AUTHORITY:** event

**REPLAY_SENSITIVITY:** HIGH

**STATUS:** PROPOSED (not implemented)

**NOTE:** This is the proposed canonical event envelope from CascadeProjects but is not currently implemented in the CRX runtime.

### JS.txt Archive Event Modules

**FINDING:** NO EXPLICIT EVENT SCHEMA MODULES**

The JS.txt archive contains 59 modules, but none are explicitly event schema modules. The archive focuses on:
- Replay: `deterministic_replay_harness.js`
- Fingerprinting: `canonical_fingerprint_service.js`
- Lineage: `formal_invariant_graph_verifier.js`, `structural_graph_builder.js`
- Verification: `execution_integrity_auditor.js`
- Merkle anchor chains (12 modules)
- Cross anchor drift (5 modules)
- Plugin system (8 modules)
- Structural and projection (8 modules)
- Runtime and execution (7 modules)
- Validation and verification (6 modules)

**CONCLUSION:** The JS.txt archive does NOT contain event schema modules. It assumes event envelopes are provided externally.

---

## EVENT AUTHORITY CONSOLIDATION ANALYSIS

### Competing Event Schemas

| CANONICAL_AUTHORITY | DUPLICATE_AUTHORITY | STRONGER_IMPLEMENTATION | REUSE_TARGET | MERGE_TARGET | QUARANTINE_TARGET | RISK |
|---------------------|---------------------|------------------------|-------------|-------------|------------------|------|
| audit-event.schema.json | claim.schema.json | audit-event.schema.json (more complete event structure) | audit-event.schema.json | claim.schema.json | claim.schema.json (UCIA-specific) | LOW |
| audit-event.schema.json | decision.schema.json | audit-event.schema.json (more complete event structure) | audit-event.schema.json | decision.schema.json | decision.schema.json (UCIA-specific) | LOW |
| audit-event.schema.json | argument-graph.schema.json | audit-event.schema.json (more complete event structure) | audit-event.schema.json | argument-graph.schema.json | argument-graph.schema.json (domain-specific) | LOW |

**CONFLICT:** None - different event domains (audit vs UCIA vs argument)

### Event Envelope Requirements (from PHASE B specification)

**REQUIRED EVENT ENVELOPE STRUCTURE:**
```
{
  event_id: string (deterministic, replay-safe)
  timestamp: number (replay ordering)
  event_type: string (domain-separated)
  domain: string (domain separation)
  payload: any (event-specific data)
  fingerprint: string (replay verification)
  lineage: {
    parent_event_id: string | null
    artifact_id: string | null
    execution_id: string | null
  }
  metadata: {
    source: string
    actor: string
    policy_version: string
  }
}
```

**REQUIRED VALIDATION:**
- Event_id uniqueness
- Timestamp ordering
- Domain separation
- Fingerprint verification
- Lineage validation
- Schema validation per event_type

### Gap Analysis

| Requirement | CRX event_log.ts | audit-event.schema.json | canonical-event-envelope.json |
|-------------|------------------|------------------------|-------------------------------|
| Event envelope structure | ❌ NO | ✅ YES | ✅ YES |
| Event_id field | ❌ NO | ✅ YES | ✅ YES |
| Timestamp field | ❌ NO | ✅ YES | ✅ YES |
| Domain separation | ❌ NO | ❌ NO | ✅ YES |
| Fingerprint field | ❌ NO | ❌ NO | ✅ YES |
| Lineage field | ❌ NO | ✅ YES | ✅ YES |
| Event validation | ❌ NO | ❌ NO | ✅ YES |
| Replay ordering | ❌ NO | ✅ YES | ✅ YES |
| Replay verification | ❌ NO | ❌ NO | ✅ YES |

---

## CONSOLIDATION PLAN

### STEP 1: Establish Canonical Event Authority

**CANONICAL AUTHORITY:** `canonical-event-envelope.json` (CascadeProjects)

**RATIONALE:**
- Most complete event envelope structure
- Includes all required fields (event_id, timestamp, domain, fingerprint, lineage)
- Designed for replay-safe event model
- Domain-separated event types
- Replay ordering guarantees
- Replay verification capabilities

### STEP 2: Consolidate Event Schemas

**ACTION:**
1. Adopt `canonical-event-envelope.json` as the ONE canonical event schema
2. Extend `canonical-event-envelope.json` to include UCIA-specific fields (claim_id, decision_id, etc.)
3. Migrate `event_log.ts` to use canonical event envelope
4. Deprecate domain-specific schemas (claim.schema.json, decision.schema.json, argument-graph.schema.json)
5. Quarantine UCIA-specific schemas for domain-specific use only

### STEP 3: Implement Event Validation

**ACTION:**
1. Create event validation module based on `canonical-event-envelope.json`
2. Implement event_id generation (deterministic, replay-safe)
3. Implement timestamp validation (monotonic ordering)
4. Implement domain separation validation
5. Implement fingerprint verification
6. Implement lineage validation

### STEP 4: Update Event Logging

**ACTION:**
1. Refactor `event_log.ts` to use canonical event envelope
2. Add event_id field to database schema
3. Add fingerprint field to database schema
4. Add domain field to database schema
5. Add lineage field to database schema
6. Implement event ordering by timestamp
7. Implement replay verification by fingerprint

---

## REQUIRED EVENT ENVELOPE SPECIFICATION

Based on PHASE B specification and consolidation analysis:

```json
{
  "event_id": "string (deterministic, replay-safe)",
  "timestamp": "number (replay ordering)",
  "event_type": "string (domain-separated)",
  "domain": "string (domain separation)",
  "payload": "any (event-specific data)",
  "fingerprint": "string (replay verification)",
  "lineage": {
    "parent_event_id": "string | null",
    "artifact_id": "string | null",
    "execution_id": "string | null"
  },
  "metadata": {
    "source": "string",
    "actor": "string",
    "policy_version": "string"
  }
}
```

**DOMAIN SEPARATION:**
- `audit`: Audit events
- `ucia`: UCIA events (claims, decisions)
- `argument`: Argument graph events
- `replay`: Replay events
- `verification`: Verification events

**EVENT TYPES PER DOMAIN:**
- `audit`: `artifact_created`, `artifact_modified`, `lineage_updated`, `policy_violation`
- `ucia`: `claim_submitted`, `claim_reviewed`, `decision_made`
- `argument`: `node_added`, `edge_added`, `graph_updated`
- `replay`: `replay_started`, `replay_completed`, `replay_failed`
- `verification`: `verification_started`, `verification_completed`, `verification_failed`

---

## CONCLUSION

### EVENT AUTHORITY CONSOLIDATION STATUS: **REQUIRED**

**Rationale:**
- Multiple competing event schemas exist across different domains
- No single canonical event authority
- CRX runtime event_log.ts is minimal and lacks replay-safe features
- External schemas are domain-specific and not unified
- No event envelope structure with replay guarantees
- No event validation or fingerprinting
- No event ordering guarantees

### IMPLICATIONS

1. **ONE event schema required** — canonical-event-envelope.json
2. **ONE event envelope required** — with replay-safe fields
3. **ONE validation path required** — event validation module
4. **NO duplicate event definitions** — consolidate all schemas
5. **NO competing event models** — unify all event types
6. **NO hidden event mutations** — enforce immutability

### RECOMMENDATION

**PROCEED WITH EVENT AUTHORITY CONSOLIDATION:**
1. Adopt `canonical-event-envelope.json` as canonical event authority
2. Extend envelope to include UCIA-specific fields
3. Refactor `event_log.ts` to use canonical envelope
4. Create event validation module
5. Deprecate domain-specific schemas
6. Quarantine UCIA-specific schemas for domain-specific use

---

## NEXT STEPS

Proceed to **PHASE C: Fingerprint Authority Extraction**
- Convert identity hashing into domain-separated fingerprint authority
- Consolidate `canonical_fingerprint_service.js` (JS.txt) with `identity_engine.ts` (CRX)
- Establish ONE canonical fingerprint authority
- Eliminate duplicate fingerprint systems

---

**Report Generated:** 2025-01-08
**Status:** EVENT AUTHORITY CONSOLIDATION COMPLETE — CONSOLIDATION REQUIRED
