# REPLAY_LAYER_EXTRACTION_PLAN

**Extraction Date:** 2026-06-07  
**Protocol:** CRX-REPOSITORY-CONSOLIDATION-V3  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** Replay authority is embedded in runtime/kernel/commit-service/.

**FACT:** 4 replay-related files exist in commit-service.

**FACT:** 7 replay components are missing.

**FACT:** Dedicated runtime/replay/ layer does not exist.

**INFERENCE:** Replay layer extraction is required for constitutional compliance.

**RECOMMENDATION:** Extract replay authority into dedicated runtime/replay/ layer.

---

## Extraction Plan

### Step 1: Create runtime/replay/ Directory

**Command:** `mkdir -p C:\Users\nolan\CRX\runtime\replay`

**Classification:** PREPARATION

---

### Step 2: Extract Event Logging

**Current Location:** runtime/kernel/commit-service/src/events/event_log.ts

**Target Location:** runtime/replay/event_log.ts

**Migration Command:** `mv C:\Users\nolan\CRX\runtime\kernel\commit-service\src\events\event_log.ts C:\Users\nolan\CRX\runtime\replay\event_log.ts`

**Classification:** EXTRACTION

**Files Extracted:** 1

**Risk:** LOW

---

### Step 3: Extract Artifact Storage

**Current Location:** runtime/kernel/commit-service/src/persistence/artifact_store.ts

**Target Location:** runtime/replay/artifact_store.ts

**Migration Command:** `mv C:\Users\nolan\CRX\runtime\kernel\commit-service\src\persistence\artifact_store.ts C:\Users\nolan\CRX\runtime\replay\artifact_store.ts`

**Classification:** EXTRACTION

**Files Extracted:** 1

**Risk:** LOW

---

### Step 4: Extract Lineage Tracking

**Current Location:** runtime/kernel/commit-service/src/persistence/lineage_store.ts

**Target Location:** runtime/replay/lineage_store.ts

**Migration Command:** `mv C:\Users\nolan\CRX\runtime\kernel\commit-service\src\persistence\lineage_store.ts C:\Users\nolan\CRX\runtime\replay\lineage_store.ts`

**Classification:** EXTRACTION

**Files Extracted:** 1

**Risk:** LOW

---

### Step 5: Extract Event Storage Schema

**Current Location:** runtime/kernel/commit-service/src/persistence/ledger_schema.sql

**Target Location:** runtime/replay/ledger_schema.sql

**Migration Command:** `mv C:\Users\nolan\CRX\runtime\kernel\commit-service\src\persistence\ledger_schema.sql C:\Users\nolan\CRX\runtime\replay\ledger_schema.sql`

**Classification:** EXTRACTION

**Files Extracted:** 1

**Risk:** LOW

---

### Step 6: Create Deterministic Replay Engine

**Target Location:** runtime/replay/deterministic_replay_engine.ts

**Function:** Replay events deterministically

**Classification:** CREATION

**Files Created:** 1

**Risk:** MEDIUM (requires implementation)

---

### Step 7: Create Replay Verification

**Target Location:** runtime/replay/replay_verification.ts

**Function:** Verify replay determinism

**Classification:** CREATION

**Files Created:** 1

**Risk:** MEDIUM (requires implementation)

---

### Step 8: Create Replay Invariants

**Target Location:** runtime/replay/replay_invariants.ts

**Function:** Enforce replay invariants

**Classification:** CREATION

**Files Created:** 1

**Risk:** MEDIUM (requires implementation)

---

### Step 9: Create Canonical Hash Authority

**Target Location:** runtime/replay/canonical_hash_authority.ts

**Function:** Compute canonical hashes for replay

**Classification:** CREATION

**Files Created:** 1

**Risk:** MEDIUM (requires implementation)

---

### Step 10: Create Witness Authority

**Target Location:** runtime/replay/witness_authority.ts

**Function:** Witness replay events

**Classification:** CREATION

**Files Created:** 1

**Risk:** MEDIUM (requires implementation)

---

### Step 11: Create Replay State Machine

**Target Location:** runtime/replay/replay_state_machine.ts

**Function:** Manage replay state

**Classification:** CREATION

**Files Created:** 1

**Risk:** MEDIUM (requires implementation)

---

### Step 12: Create Replay Event Stream

**Target Location:** runtime/replay/replay_event_stream.ts

**Function:** Stream replay events

**Classification:** CREATION

**Files Created:** 1

**Risk:** MEDIUM (requires implementation)

---

### Step 13: Update commit-service Imports

**Current Imports:** commit-service imports from src/events/, src/persistence/

**Target Imports:** commit-service imports from runtime/replay/

**Classification:** IMPORT_UPDATE

**Files Updated:** Multiple

**Risk:** MEDIUM (requires import path updates)

---

### Step 14: Update Database Schema

**Current Schema:** ledger_schema.sql in commit-service

**Target Schema:** ledger_schema.sql in runtime/replay/

**Classification:** SCHEMA_UPDATE

**Files Updated:** 1

**Risk:** LOW

---

### Step 15: Verify Replay Layer Structure

**Verification Command:** `ls -la C:\Users\nolan\CRX\runtime\replay\`

**Expected Result:** 11 files (4 extracted, 7 new)

**Classification:** VERIFICATION

---

## Proposed Replay Layer Structure

### runtime/replay/

```
runtime/replay/
├── event_log.ts (extracted from commit-service)
├── artifact_store.ts (extracted from commit-service)
├── lineage_store.ts (extracted from commit-service)
├── ledger_schema.sql (extracted from commit-service)
├── deterministic_replay_engine.ts (new)
├── replay_verification.ts (new)
├── replay_invariants.ts (new)
├── canonical_hash_authority.ts (new)
├── witness_authority.ts (new)
├── replay_state_machine.ts (new)
└── replay_event_stream.ts (new)
```

**Total:** 11 files

**Classification:** FIRST_CLASS_REPLAY_LAYER

**Authority Level:** MEDIUM (dedicated layer)

---

## Extraction Summary

**Total Files to Extract:** 4 files

**Total Files to Create:** 7 files

**Total Files to Update:** Multiple (import paths)

**Total Migration Time Estimate:** 30 minutes

**Risk Level:** MEDIUM

**Blocking Issues:** None

---

## Final Classification

**FACT:** 4 replay-related files exist in commit-service

**FACT:** 7 replay components are missing

**FACT:** Dedicated runtime/replay/ layer does not exist

**FACT:** Replay layer extraction requires 4 extractions, 7 creations, and import updates

**INFERENCE:** Replay layer extraction is required for constitutional compliance

**RECOMMENDATION:** Execute replay layer extraction plan
