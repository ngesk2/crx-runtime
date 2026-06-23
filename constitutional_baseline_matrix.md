# CONSTITUTIONAL BASELINE MATRIX

**Date:** 2026-06-22  
**Phase:** SWEEP27 Phase 2 - Constitutional Baseline Audit  
**Purpose:** Audit constitutional core components for baseline readiness  
**Branch:** audit-hardening

---

## AUDIT SCOPE

**Components Audited:**
- runtime/replay
- runtime/kernel/commit-service
- vault
- mcp
- brainos/orchestration/src/mission_control
- brainos/orchestration/src/projection_worker

---

## AUDIT RESULTS

### runtime/replay
**Git Status:** ✅ CLEAN  
**Modified:** 0 files  
**Untracked:** 0 files  
**Deleted:** 0 files  
**Referenced:** Core replay engine

**Classification:** ✅ SAFE

**Rationale:**
- No uncommitted changes
- No untracked files
- Core constitutional replay engine stable
- All ADRs and audits present
- Test corpus intact

**Files:** 47 files (TypeScript + Markdown + JSON)

---

### runtime/kernel/commit-service
**Git Status:** ✅ CLEAN  
**Modified:** 0 files  
**Untracked:** 0 files  
**Deleted:** 0 files  
**Referenced:** Commit service

**Classification:** ✅ SAFE

**Rationale:**
- No uncommitted changes
- No untracked files
- Node_modules excluded from backup (standard practice)
- Source code intact

**Files:** 4 files (src/, package.json, tsconfig.json, package-lock.json)

---

### vault
**Git Status:** ⚠️ UNTRACKED  
**Modified:** 0 files  
**Untracked:** 18 files (entire vault/)  
**Deleted:** 0 files  
**Referenced:** Constitutional authority source

**Classification:** ⚠️ REVIEW

**Rationale:**
- Entire vault directory is untracked
- Contains 16 authority documents
- Contains 3 manifest files (VAULT_INDEX.md, AUTHORITY_MAP.md, HASH_MANIFEST.json)
- Must be added to git before baseline
- Critical for constitutional authority

**Action Required:** `git add vault/`

**Files:** 18 files (Markdown + JSON)

---

### mcp
**Git Status:** ⚠️ UNTRACKED  
**Modified:** 0 files  
**Untracked:** 1 file (mcp/ping_mcp_server.py)  
**Deleted:** 0 files  
**Referenced:** MCP tool access layer

**Classification:** ⚠️ REVIEW

**Rationale:**
- New MCP server not tracked
- Thin proxy to Mission Control
- Critical for Open WebUI integration
- Should be added to git before baseline

**Action Required:** `git add mcp/`

**Files:** 1 file (Python)

---

### brainos/orchestration/src/mission_control
**Git Status:** ⚠️ UNTRACKED  
**Modified:** 0 files  
**Untracked:** 2 files (app.py, constitutional_integration.py)  
**Deleted:** 0 files  
**Referenced:** Mission Control API

**Classification:** ⚠️ REVIEW

**Rationale:**
- Mission Control source not tracked
- Contains constitutional search endpoints
- Contains backup endpoints
- Critical for authority chain
- Should be added to git before baseline

**Action Required:** `git add brainos/orchestration/src/mission_control/`

**Files:** 2 files (Python)

---

### brainos/orchestration/src/projection_worker
**Git Status:** ⚠️ UNTRACKED  
**Modified:** 0 files  
**Untracked:** 1 file (projection_worker.py)  
**Deleted:** 0 files  
**Referenced:** Qdrant projection worker

**Classification:** ⚠️ REVIEW

**Rationale:**
- Projection worker not tracked
- Projects vault to Qdrant
- Critical for memory chain
- Should be added to git before baseline

**Action Required:** `git add brainos/orchestration/src/projection_worker/`

**Files:** 1 file (Python)

---

### brainos/orchestration/config
**Git Status:** ⚠️ UNTRACKED  
**Modified:** 0 files  
**Untracked:** 7 files (model_capabilities.json, environments/)  
**Deleted:** 0 files  
**Referenced:** Configuration

**Classification:** ⚠️ REVIEW

**Rationale:**
- Configuration not tracked
- Contains model capability registry
- Contains environment files
- Should be added to git before baseline
- Credentials/secrets should be excluded

**Action Required:** `git add brainos/orchestration/config/` (exclude secrets)

**Files:** 7 files (JSON + Environment files)

---

## CLASSIFICATION SUMMARY

| Component | Status | Classification | Action Required |
|-----------|--------|----------------|-----------------|
| runtime/replay | Clean | ✅ SAFE | None |
| runtime/kernel/commit-service | Clean | ✅ SAFE | None |
| vault | Untracked | ⚠️ REVIEW | git add vault/ |
| mcp | Untracked | ⚠️ REVIEW | git add mcp/ |
| mission_control | Untracked | ⚠️ REVIEW | git add brainos/orchestration/src/mission_control/ |
| projection_worker | Untracked | ⚠️ REVIEW | git add brainos/orchestration/src/projection_worker/ |
| config | Untracked | ⚠️ REVIEW | git add brainos/orchestration/config/ |

**Total:** 2 SAFE, 5 REVIEW, 0 BLOCKING

---

## BLOCKING ISSUES

**None identified**

All untracked components are REVIEW, not BLOCKING. They can be added to git before baseline commit.

---

## RECOMMENDED ACTIONS

### Before Baseline Commit
1. `git add vault/` (18 files)
2. `git add mcp/` (1 file)
3. `git add brainos/orchestration/src/mission_control/` (2 files)
4. `git add brainos/orchestration/src/projection_worker/` (1 file)
5. `git add brainos/orchestration/config/` (7 files, exclude secrets)
6. Review staged files
7. Commit with message: "SWEEP27: Add constitutional core components to baseline"

### Exclude from Git
- brainos/orchestration/config/environments/credentials/secrets/
- brainos/orchestration/config/environments/.env.local
- runtime/kernel/commit-service/node_modules/

---

## CONCLUSION

**Baseline Readiness:** ⚠️ REVIEW REQUIRED

**Summary:** 2 components SAFE (runtime/replay, commit-service). 5 components REVIEW (untracked but ready to add). 0 BLOCKING issues. All untracked components should be added to git before baseline commit.

**Next Phase:** SWEEP27 Phase 3 - Audit Entropy Isolation
