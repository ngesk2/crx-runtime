# EVENT HASH LEDGER 2026-09-16

**STATUS:** CLASSIFIED
**DATE:** 2026-09-16
**PHASE:** F - EVENT HASH

---

## EVIDENCE

### Event Hash Candidates

#### 1. Event Identity Hash (SHA-256)
- **File:** /home/nolan/ping/ping-runtime/events/unified_event_runtime.js
- **Status:** EVENT IDENTITY MECHANISM
- **Evidence:**
  - [STAT] UnifiedEventRuntime.emit() computes event_id as SHA-256(identity)
  - [STAT] Identity = { eventType, source, namespace, logical_id/payload }
  - [STAT] This is CONTENT-DERIVED identity, not separate integrity hash
  - [EMPR] Active for all event emissions
  - [INFR] This is event identity, not event content integrity

#### 2. CanonicalHashAuthority (Python)
- **File:** /home/nolan/runtime/authorities/canonical_hash_authority.py
- **Status:** PYTHON HASH AUTHORITY
- **Evidence:**
  - [STAT] Implements SHA-256 hashing for Python runtime
  - [STAT] Provides hash_json() for canonical JSON representation
  - [INFR] Not used by event system
  - [INFR] Not integrated with UnifiedEventRuntime

#### 3. EvidenceAuthority hash verification
- **File:** /home/nolan/ping/ping-runtime/evidence/evidence_authority.js
- **Status:** EVIDENCE VERIFICATION
- **Evidence:**
  - [STAT] Verifies canonical_hash in evidence objects
  - [STAT] Reads canonical_hash from event metadata
  - [INFR] This is evidence verification, not event hash

---

## CLASSIFICATION

**DECISION:** What is the event hash decision?

**ANSWER:** Need to distinguish:
- **EVENT IDENTITY HASH:** Used to generate event_id (content-derived)
- **EVENT CONTENT/INTEGRITY HASH:** Used to verify event content integrity

**CURRENT STATE:**
- **Event identity hash:** EXISTS (SHA-256 in UnifiedEventRuntime)
- **Event integrity hash:** MISSING (no separate canonical hash stored)
- **Python hash authority:** EXISTS but not integrated
- **Evidence verification:** EXISTS but requires hash to be stored

**FINDING:** Event identity exists but event integrity hash is missing

**CONCLUSION:** DEFER DECISION - require runtime evidence before implementing

---

## ANALYSIS

**Do we need a separate event integrity hash?**

**Arguments FOR:**
- [INFR] Event identity could theoretically collide if SHA-256 has collision (extremely unlikely)
- [INFR] Separate integrity hash allows verification even if identity mechanism changes
- [INFR] EvidenceAuthority can verify hash for tamper detection

**Arguments AGAINST:**
- [STAT] SHA-256 collision probability is negligible
- [STAT] Event identity is already content-derived (changing content changes ID)
- [STAT] Adding separate hash adds storage complexity
- [STAT] Would require schema migration (82+ existing events)
- [STAT] No current tamper detection requirement

**REQUIREMENT CLARIFICATION:**
Before implementing, need to determine:
- Is tamper detection constitutionally required?
- Is the collision risk real or theoretical?
- Are there external systems that require separate integrity hash?
- Does EvidenceAuthority actually need this in production?

---

## CONVERGENCE DECISION

**STATUS:** DEFERRED - EVIDENCE REQUIRED

**RATIONALE:**
1. Event identity hash already exists (SHA-256 content-derived)
2. Adding separate integrity hash requires strong justification
3. Schema migration required for 82+ existing events
4. No clear constitutional requirement for separate integrity hash
5. Need runtime evidence (tamper detection requirement) before proceeding

**IF REQUIRED (FUTURE PATH):**
- Use existing CanonicalHashAuthority (Python) or implement JS equivalent
- Store canonical_hash in event metadata
- Backward-compatible schema migration
- Verify hash in EvidenceAuthority
- Use deterministic canonical serialization

---

## FINAL STATUS

**EVENT_HASH = DEFERRED**

**EVIDENCE:**
- [STAT] Event identity hash exists (SHA-256 in UnifiedEventRuntime)
- [INFR] Event integrity hash is missing
- [INFR] Python CanonicalHashAuthority exists but not integrated
- [INFR] No clear constitutional requirement for separate integrity hash

**NO CODE CHANGE REQUIRED**

**DEFERRED REASON:**
- Need evidence that separate integrity hash is constitutionally required
- SHA-256 collision probability is negligible
- Schema migration complexity for 82+ existing events
- No current tamper detection requirement

**DEFINITIONS:**
- **Event identity hash:** EXISTS (SHA-256 of {eventType, source, namespace, logical_id/payload})
- **Event integrity hash:** MISSING (separate content verification hash)
