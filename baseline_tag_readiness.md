# BASELINE TAG READINESS

**Date:** 2026-06-22  
**Phase:** SWEEP27 Phase 6 - Constitutional Tag Readiness  
**Purpose:** Determine v0.1-constitutional-baseline readiness  
**Candidate Tag:** v0.1-constitutional-baseline

---

## TAG READINESS STATUS

**Decision:** ⚠️ CONDITIONAL YES

**Condition:** Untracked components must be added to git before tag creation

---

## BLOCKERS

### Critical Blockers
**None identified**

### Pre-Commit Requirements
1. vault/ must be added to git (18 files)
2. mcp/ must be added to git (1 file)
3. brainos/orchestration/src/mission_control/ must be added to git (2 files)
4. brainos/orchestration/src/projection_worker/ must be added to git (1 file)
5. brainos/orchestration/config/ must be added to git (7 files, exclude secrets)

**Status:** ⚠️ PENDING USER ACTION

---

## ALLOWED COMMIT SCOPE

### In-Scope Components
✅ runtime/replay/ (47 files)  
✅ runtime/kernel/commit-service/ (4 files, exclude node_modules)  
✅ vault/ (18 files)  
✅ mcp/ (1 file)

### Out-of-Scope Components
❌ brainos/orchestration/src/mission_control/ (2 files) - Not in allowed scope  
❌ brainos/orchestration/src/projection_worker/ (1 file) - Not in allowed scope  
❌ brainos/orchestration/config/ (7 files) - Not in allowed scope

---

## EXACT COMMIT SCOPE

### Required Files to Stage
```bash
git add runtime/replay/
git add runtime/kernel/commit-service/src/
git add runtime/kernel/commit-service/package.json
git add runtime/kernel/commit-service/tsconfig.json
git add vault/
git add mcp/
```

### Files to Exclude
```bash
# Exclude node_modules
git rm -r --cached runtime/kernel/commit-service/node_modules/
echo "node_modules/" >> .gitignore
```

### Out-of-Scope Files (Do NOT include in baseline tag)
- brainos/orchestration/src/mission_control/
- brainos/orchestration/src/projection_worker/
- brainos/orchestration/config/

**Note:** These components should be added in a separate commit after baseline tag.

---

## PRE-TAG COMMIT CHECKLIST

### Git Status Verification
```bash
git status
# Expected: All in-scope files staged
# Expected: No untracked in-scope files
```

### Branch Verification
```bash
git branch
# Expected: audit-hardening
```

### Clean Working Tree
```bash
git diff
# Expected: No unstaged changes
```

---

## TAG CREATION COMMANDS

### Step 1: Commit In-Scope Components
```bash
git add runtime/replay/
git add runtime/kernel/commit-service/src/
git add runtime/kernel/commit-service/package.json
git add runtime/kernel/commit-service/tsconfig.json
git add vault/
git add mcp/
git commit -m "SWEEP27: Add constitutional core components to baseline v0.1"
```

### Step 2: Create Tag
```bash
git tag -a v0.1-constitutional-baseline -m "Constitutional baseline - runtime/replay, commit-service, vault, mcp"
```

### Step 3: Push Tag
```bash
git push origin audit-hardening
git push origin v0.1-constitutional-baseline
```

---

## POST-TAG COMMIT (Separate)

### Add Out-of-Scope Components
```bash
git add brainos/orchestration/src/mission_control/
git add brainos/orchestration/src/projection_worker/
git add brainos/orchestration/config/
git commit -m "SWEEP27: Add Mission Control, projection worker, and config"
```

---

## TAG VERIFICATION

### Verify Tag Created
```bash
git tag -l v0.1-constitutional-baseline
```

### Verify Tag Contents
```bash
git show v0.1-constitutional-baseline
```

### Verify Tag SHA
```bash
git rev-parse v0.1-constitutional-baseline
```

---

## TAG READINESS SUMMARY

| Criteria | Status | Evidence |
|-----------|--------|----------|
| runtime/replay clean | ✅ YES | Git status clean |
| commit-service clean | ✅ YES | Git status clean |
| vault untracked | ⚠️ BLOCKER | Must add to git |
| mcp untracked | ⚠️ BLOCKER | Must add to git |
| mission_control untracked | ⚠️ OUT OF SCOPE | Separate commit |
| projection_worker untracked | ⚠️ OUT OF SCOPE | Separate commit |
| config untracked | ⚠️ OUT OF SCOPE | Separate commit |
| Backup verified | ✅ YES | PING_backup_20260622.zip created |

---

## FINAL DETERMINATION

**Tag Readiness:** ⚠️ CONDITIONAL YES

**Condition:** Add vault/ and mcp/ to git before creating tag

**Out-of-Scope Handling:** Mission Control, projection worker, and config should be added in separate commit after baseline tag

**Next Action Required:** User to execute pre-tag commit commands

**Next Phase:** SWEEP27 Phase 7 - Ollama Preparation
