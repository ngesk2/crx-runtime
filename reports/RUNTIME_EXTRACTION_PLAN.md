# RUNTIME_EXTRACTION_PLAN

**Extraction Date:** 2026-06-07  
**Protocol:** CRX-REPOSITORY-CONSOLIDATION-V2  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** Runtime code exists in runtime/ directory (17 files in runtime/kernel/commit-service/src/).

**FACT:** Agent runtime scripts exist in agents/ directory (3 files).

**FACT:** No other runtime code exists outside runtime/ directory.

**INFERENCE:** Runtime extraction is minimal (only agent runtime scripts need to be reorganized).

**RECOMMENDATION:** Reorganize agent runtime scripts within agents/ directory.

---

## Current Runtime Location

### runtime/ Directory

**Location:** `C:\Users\nolan\CRX\runtime\`

**Status:** CORRECT

**Contents:**
- runtime/README.md
- runtime/kernel/commit-service/package.json
- runtime/kernel/commit-service/package-lock.json
- runtime/kernel/commit-service/tsconfig.json
- runtime/kernel/commit-service/src/api/audit_controller.ts
- runtime/kernel/commit-service/src/api/commit_controller.ts
- runtime/kernel/commit-service/src/engines/canonical_engine.ts
- runtime/kernel/commit-service/src/engines/identity_engine.ts
- runtime/kernel/commit-service/src/events/event_log.ts
- runtime/kernel/commit-service/src/persistence/artifact_store.ts
- runtime/kernel/commit-service/src/persistence/db.ts
- runtime/kernel/commit-service/src/persistence/ledger_schema.sql
- runtime/kernel/commit-service/src/persistence/lineage_store.ts
- runtime/kernel/commit-service/src/server.ts
- runtime/kernel/commit-service/src/utils/logger.ts
- runtime/kernel/commit-service/src/validation/dag_validator.ts
- runtime/kernel/commit-service/node_modules/* (1000+ files)

**Total:** 17 source files + node_modules

**Classification:** RUNTIME

**Authority Level:** MEDIUM

**Migration Required:** NO (already in correct location)

---

## Runtime Code Outside runtime/

### agents/ Directory

**Location:** `C:\Users\nolan\CRX\agents\`

**Status:** REORGANIZATION REQUIRED

**Runtime Scripts:**
- agents/crx_workspace_indexer.ps1 (PowerShell workspace indexer)
- agents/crx_workspace_indexer.py (Python workspace indexer)
- agents/implement_authority_reduction.ps1 (PowerShell authority reduction script)

**Total:** 3 files

**Classification:** RUNTIME (agent runtime scripts)

**Authority Level:** LOW

**Migration Required:** YES (reorganize within agents/ directory)

---

## Extraction Plan

### Step 1: Reorganize Agent Runtime Scripts

**Current Location:** `agents/`

**Target Location:** `agents/runtime/`

**Files to Move:**
- agents/crx_workspace_indexer.ps1 → agents/runtime/crx_workspace_indexer.ps1
- agents/crx_workspace_indexer.py → agents/runtime/crx_workspace_indexer.py
- agents/implement_authority_reduction.ps1 → agents/runtime/implement_authority_reduction.ps1

**Migration Commands:**
- `mkdir -p C:\Users\nolan\CRX\agents\runtime`
- `mv C:\Users\nolan\CRX\agents\crx_workspace_indexer.ps1 C:\Users\nolan\CRX\agents\runtime\crx_workspace_indexer.ps1`
- `mv C:\Users\nolan\CRX\agents\crx_workspace_indexer.py C:\Users\nolan\CRX\agents\runtime\crx_workspace_indexer.py`
- `mv C:\Users\nolan\CRX\agents\implement_authority_reduction.ps1 C:\Users\nolan\CRX\agents\runtime\implement_authority_reduction.ps1`

**Classification:** REORGANIZATION

**Files Moved:** 3

**Risk:** LOW

---

### Step 2: Verify Runtime Directory Structure

**Verification Command:** `ls -la C:\Users\nolan\CRX\runtime\kernel\commit-service\src\`

**Expected Result:** 11 TypeScript files in correct structure

**Classification:** VERIFICATION

---

### Step 3: Verify Agent Runtime Directory Structure

**Verification Command:** `ls -la C:\Users\nolan\CRX\agents\runtime\`

**Expected Result:** 3 runtime scripts in correct location

**Classification:** VERIFICATION

---

## Runtime Code Inventory

### runtime/kernel/commit-service/src/

**Files:**
- api/audit_controller.ts
- api/commit_controller.ts
- engines/canonical_engine.ts
- engines/identity_engine.ts
- events/event_log.ts
- persistence/artifact_store.ts
- persistence/db.ts
- persistence/ledger_schema.sql
- persistence/lineage_store.ts
- server.ts
- utils/logger.ts
- validation/dag_validator.ts

**Total:** 11 files

**Classification:** RUNTIME

**Status:** CORRECT LOCATION

---

### agents/runtime/

**Files:**
- crx_workspace_indexer.ps1
- crx_workspace_indexer.py
- implement_authority_reduction.ps1

**Total:** 3 files

**Classification:** RUNTIME (agent runtime scripts)

**Status:** REORGANIZATION REQUIRED

---

## Extraction Summary

**Total Runtime Files Outside runtime/:** 3 files

**Total Runtime Files in runtime/:** 17 files

**Total Runtime Files to Move:** 3 files

**Total Runtime Files to Keep:** 17 files

**Migration Time Estimate:** 2 minutes

**Risk Level:** LOW

**Blocking Issues:** None

---

## Final Classification

**FACT:** 3 runtime scripts exist outside runtime/ (in agents/)

**FACT:** 17 runtime files exist in runtime/ (kernel/commit-service/src/)

**FACT:** No other runtime code exists outside runtime/

**FACT:** Runtime extraction is minimal (only reorganization within agents/)

**INFERENCE:** Runtime extraction is straightforward with no blocking issues

**RECOMMENDATION:** Execute agent runtime script reorganization
