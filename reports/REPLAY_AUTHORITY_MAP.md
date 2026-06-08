# REPLAY_AUTHORITY_MAP

**Map Date:** 2026-06-07  
**Protocol:** CRX-REPOSITORY-CONSOLIDATION-V3  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** Replay authority is embedded inside runtime/kernel/commit-service/.

**FACT:** No dedicated runtime/replay/ layer exists.

**FACT:** Replay authority is fragmented across multiple modules.

**FACT:** Replay authority is not isolated as a first-class architectural layer.

**INFERENCE:** Replay authority extraction is required for constitutional compliance.

**RECOMMENDATION:** Extract replay authority into dedicated runtime/replay/ layer.

---

## Current Replay Authority Location

### runtime/kernel/commit-service/

**Location:** `C:\Users\nolan\CRX\runtime\kernel\commit-service\`

**Status:** EMBEDDED

**Replay Components:**
- runtime/kernel/commit-service/src/events/event_log.ts (event logging)
- runtime/kernel/commit-service/src/persistence/ledger_schema.sql (event storage schema)
- runtime/kernel/commit-service/src/persistence/artifact_store.ts (artifact storage)
- runtime/kernel/commit-service/src/persistence/lineage_store.ts (lineage tracking)

**Total:** 4 replay-related files

**Classification:** EMBEDDED_REPLAY_AUTHORITY

**Authority Level:** MEDIUM (embedded in runtime/)

---

## Replay Authority Fragmentation

### Fragment 1: Event Logging

**Location:** runtime/kernel/commit-service/src/events/event_log.ts

**Function:** logEvent() - inserts event data into execution_events table

**Classification:** EVENT_LOGGING

**Fragmentation:** EMBEDDED_IN_COMMIT_SERVICE

---

### Fragment 2: Event Storage Schema

**Location:** runtime/kernel/commit-service/src/persistence/ledger_schema.sql

**Function:** Defines execution_events table

**Classification:** EVENT_STORAGE_SCHEMA

**Fragmentation:** EMBEDDED_IN_COMMIT_SERVICE

---

### Fragment 3: Artifact Storage

**Location:** runtime/kernel/commit-service/src/persistence/artifact_store.ts

**Function:** Artifact storage and retrieval

**Classification:** ARTIFACT_STORAGE

**Fragmentation:** EMBEDDED_IN_COMMIT_SERVICE

---

### Fragment 4: Lineage Tracking

**Location:** runtime/kernel/commit-service/src/persistence/lineage_store.ts

**Function:** Lineage edge tracking

**Classification:** LINEAGE_TRACKING

**Fragmentation:** EMBEDDED_IN_COMMIT_SERVICE

---

## Missing Replay Components

### Missing Component 1: Deterministic Replay Engine

**Status:** MISSING

**Function:** Replay events deterministically

**Classification:** DETERMINISTIC_REPLAY_ENGINE

**Required Location:** runtime/replay/deterministic_replay_engine.ts

---

### Missing Component 2: Replay Verification

**Status:** MISSING

**Function:** Verify replay determinism

**Classification:** REPLAY_VERIFICATION

**Required Location:** runtime/replay/replay_verification.ts

---

### Missing Component 3: Replay Invariants

**Status:** MISSING

**Function:** Enforce replay invariants

**Classification:** REPLAY_INVARIANTS

**Required Location:** runtime/replay/replay_invariants.ts

---

### Missing Component 4: Canonical Hash Authority

**Status:** MISSING

**Function:** Compute canonical hashes for replay

**Classification:** CANONICAL_HASH_AUTHORITY

**Required Location:** runtime/replay/canonical_hash_authority.ts

---

### Missing Component 5: Witness Authority

**Status:** MISSING

**Function:** Witness replay events

**Classification:** WITNESS_AUTHORITY

**Required Location:** runtime/replay/witness_authority.ts

---

### Missing Component 6: Replay State Machine

**Status:** MISSING

**Function:** Manage replay state

**Classification:** REPLAY_STATE_MACHINE

**Required Location:** runtime/replay/replay_state_machine.ts

---

### Missing Component 7: Replay Event Stream

**Status:** MISSING

**Function:** Stream replay events

**Classification:** REPLAY_EVENT_STREAM

**Required Location:** runtime/replay/replay_event_stream.ts

---

## Proposed Replay Layer Structure

### runtime/replay/

**Location:** `C:\Users\nolan\CRX\runtime\replay\`

**Status:** PROPOSED

**Structure:**
```
runtime/replay/
├── deterministic_replay_engine.ts
├── replay_verification.ts
├── replay_invariants.ts
├── canonical_hash_authority.ts
├── witness_authority.ts
├── replay_state_machine.ts
├── replay_event_stream.ts
├── event_log.ts (extracted from commit-service)
├── artifact_store.ts (extracted from commit-service)
├── lineage_store.ts (extracted from commit-service)
└── ledger_schema.sql (extracted from commit-service)
```

**Total:** 11 files (4 extracted, 7 new)

**Classification:** FIRST_CLASS_REPLAY_LAYER

**Authority Level:** MEDIUM (dedicated layer)

---

## Replay Authority Isolation

### Current Isolation Status

**Isolation Level:** NONE

**Reason:** Replay authority is embedded in commit-service

**Classification:** NOT_ISOLATED

---

### Proposed Isolation Status

**Isolation Level:** HIGH

**Reason:** Replay authority is isolated in dedicated runtime/replay/ layer

**Classification:** ISOLATED

---

## Replay Authority Dependencies

### Current Dependencies

**Dependency 1:** commit-service (replay embedded)

**Classification:** EMBEDDED_DEPENDENCY

---

### Proposed Dependencies

**Dependency 1:** constitutional/ (replay derives authority from constitutional)

**Dependency 2:** knowledge/authoritative/ (replay derives specifications from knowledge)

**Classification:** CONSTITUTIONAL_DEPENDENCY

---

## Final Classification

**FACT:** Replay authority is embedded inside runtime/kernel/commit-service/

**FACT:** No dedicated runtime/replay/ layer exists

**FACT:** Replay authority is fragmented across 4 modules

**FACT:** 7 replay components are missing

**FACT:** Replay authority is not isolated as a first-class architectural layer

**INFERENCE:** Replay authority extraction is required for constitutional compliance

**RECOMMENDATION:** Extract replay authority into dedicated runtime/replay/ layer
