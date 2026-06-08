# REPLAY_CRITICAL_AUTHORITY_REGISTRY

**Registry Date:** 2026-06-07  
**Protocol:** CRX-REPOSITORY-CONSOLIDATION-V3  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** 9 replay-critical authorities are required for constitutional compliance.

**FACT:** 4 replay-critical authorities exist (embedded in commit-service).

**FACT:** 5 replay-critical authorities are missing.

**FACT:** Replay-critical authorities are not isolated as a first-class layer.

**INFERENCE:** Replay-critical authority extraction is required.

**RECOMMENDATION:** Extract replay-critical authorities into runtime/replay/ layer.

---

## Replay-Critical Authority Registry

### Authority 1: Event Authority

**Status:** EXISTS (embedded)

**Current Location:** runtime/kernel/commit-service/src/events/event_log.ts

**Function:** logEvent() - inserts event data into execution_events table

**Classification:** EVENT_AUTHORITY

**Criticality:** HIGH

**Isolation:** NOT_ISOLATED (embedded in commit-service)

**Required Location:** runtime/replay/event_log.ts

---

### Authority 2: Canonicalization Authority

**Status:** EXISTS (embedded)

**Current Location:** runtime/kernel/commit-service/src/engines/canonical_engine.ts

**Function:** Canonical event generation

**Classification:** CANONICALIZATION_AUTHORITY

**Criticality:** HIGH

**Isolation:** NOT_ISOLATED (embedded in commit-service)

**Required Location:** runtime/replay/canonical_engine.ts

---

### Authority 3: Fingerprint Authority

**Status:** EXISTS (embedded)

**Current Location:** runtime/kernel/commit-service/src/engines/identity_engine.ts

**Function:** Identity fingerprinting

**Classification:** FINGERPRINT_AUTHORITY

**Criticality:** HIGH

**Isolation:** NOT_ISOLATED (embedded in commit-service)

**Required Location:** runtime/replay/fingerprint_authority.ts

---

### Authority 4: Identity Authority

**Status:** EXISTS (embedded)

**Current Location:** runtime/kernel/commit-service/src/engines/identity_engine.ts

**Function:** Identity semantics

**Classification:** IDENTITY_AUTHORITY

**Criticality:** HIGH

**Isolation:** NOT_ISOLATED (embedded in commit-service)

**Required Location:** runtime/replay/identity_authority.ts

---

### Authority 5: Lineage Authority

**Status:** EXISTS (embedded)

**Current Location:** runtime/kernel/commit-service/src/persistence/lineage_store.ts

**Function:** Lineage edge tracking

**Classification:** LINEAGE_AUTHORITY

**Criticality:** HIGH

**Isolation:** NOT_ISOLATED (embedded in commit-service)

**Required Location:** runtime/replay/lineage_authority.ts

---

### Authority 6: Replay Authority

**Status:** MISSING

**Current Location:** None

**Function:** Replay events deterministically

**Classification:** REPLAY_AUTHORITY

**Criticality:** HIGH

**Isolation:** NOT_APPLICABLE (does not exist)

**Required Location:** runtime/replay/deterministic_replay_engine.ts

---

### Authority 7: Invariant Authority

**Status:** MISSING

**Current Location:** None

**Function:** Enforce replay invariants

**Classification:** INVARIANT_AUTHORITY

**Criticality:** HIGH

**Isolation:** NOT_APPLICABLE (does not exist)

**Required Location:** runtime/replay/replay_invariants.ts

---

### Authority 8: Witness Authority

**Status:** MISSING

**Current Location:** None

**Function:** Witness replay events

**Classification:** WITNESS_AUTHORITY

**Criticality:** HIGH

**Isolation:** NOT_APPLICABLE (does not exist)

**Required Location:** runtime/replay/witness_authority.ts

---

### Authority 9: Canonical State Authority

**Status:** MISSING

**Current Location:** None

**Function:** Compute canonical state

**Classification:** CANONICAL_STATE_AUTHORITY

**Criticality:** HIGH

**Isolation:** NOT_APPLICABLE (does not exist)

**Required Location:** runtime/replay/canonical_state_authority.ts

---

## Authority Isolation Status

### Isolated Authorities

**Count:** 0

**Reason:** No replay-critical authorities are isolated

**Classification:** NO_ISOLATED_AUTHORITIES

---

### Non-Isolated Authorities

**Count:** 5

**Reason:** 5 replay-critical authorities are embedded in commit-service

**Classification:** NON_ISOLATED_AUTHORITIES

---

### Missing Authorities

**Count:** 4

**Reason:** 4 replay-critical authorities do not exist

**Classification:** MISSING_AUTHORITIES

---

## Authority Criticality Matrix

| Authority | Status | Criticality | Isolation | Required Action |
|-----------|--------|-------------|-----------|-----------------|
| Event Authority | EXISTS (embedded) | HIGH | NOT_ISOLATED | Extract to runtime/replay/ |
| Canonicalization Authority | EXISTS (embedded) | HIGH | NOT_ISOLATED | Extract to runtime/replay/ |
| Fingerprint Authority | EXISTS (embedded) | HIGH | NOT_ISOLATED | Extract to runtime/replay/ |
| Identity Authority | EXISTS (embedded) | HIGH | NOT_ISOLATED | Extract to runtime/replay/ |
| Lineage Authority | EXISTS (embedded) | HIGH | NOT_ISOLATED | Extract to runtime/replay/ |
| Replay Authority | MISSING | HIGH | NOT_APPLICABLE | Create in runtime/replay/ |
| Invariant Authority | MISSING | HIGH | NOT_APPLICABLE | Create in runtime/replay/ |
| Witness Authority | MISSING | HIGH | NOT_APPLICABLE | Create in runtime/replay/ |
| Canonical State Authority | MISSING | HIGH | NOT_APPLICABLE | Create in runtime/replay/ |

---

## Authority Extraction Plan

### Extraction 1: Event Authority

**Current Location:** runtime/kernel/commit-service/src/events/event_log.ts

**Target Location:** runtime/replay/event_authority.ts

**Classification:** EXTRACTION

**Priority:** HIGH

---

### Extraction 2: Canonicalization Authority

**Current Location:** runtime/kernel/commit-service/src/engines/canonical_engine.ts

**Target Location:** runtime/replay/canonicalization_authority.ts

**Classification:** EXTRACTION

**Priority:** HIGH

---

### Extraction 3: Fingerprint Authority

**Current Location:** runtime/kernel/commit-service/src/engines/identity_engine.ts

**Target Location:** runtime/replay/fingerprint_authority.ts

**Classification:** EXTRACTION

**Priority:** HIGH

---

### Extraction 4: Identity Authority

**Current Location:** runtime/kernel/commit-service/src/engines/identity_engine.ts

**Target Location:** runtime/replay/identity_authority.ts

**Classification:** EXTRACTION

**Priority:** HIGH

---

### Extraction 5: Lineage Authority

**Current Location:** runtime/kernel/commit-service/src/persistence/lineage_store.ts

**Target Location:** runtime/replay/lineage_authority.ts

**Classification:** EXTRACTION

**Priority:** HIGH

---

## Authority Creation Plan

### Creation 1: Replay Authority

**Target Location:** runtime/replay/deterministic_replay_engine.ts

**Function:** Replay events deterministically

**Classification:** CREATION

**Priority:** HIGH

---

### Creation 2: Invariant Authority

**Target Location:** runtime/replay/replay_invariants.ts

**Function:** Enforce replay invariants

**Classification:** CREATION

**Priority:** HIGH

---

### Creation 3: Witness Authority

**Target Location:** runtime/replay/witness_authority.ts

**Function:** Witness replay events

**Classification:** CREATION

**Priority:** HIGH

---

### Creation 4: Canonical State Authority

**Target Location:** runtime/replay/canonical_state_authority.ts

**Function:** Compute canonical state

**Classification:** CREATION

**Priority:** HIGH

---

## Final Classification

**FACT:** 9 replay-critical authorities are required for constitutional compliance

**FACT:** 5 replay-critical authorities exist (embedded in commit-service)

**FACT:** 4 replay-critical authorities are missing

**FACT:** Replay-critical authorities are not isolated as a first-class layer

**FACT:** 5 extractions and 4 creations are required

**INFERENCE:** Replay-critical authority extraction is required

**RECOMMENDATION:** Extract replay-critical authorities into runtime/replay/ layer
