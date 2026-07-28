# Runtime Submodule Investigation Report

**Date:** June 27, 2026
**Issue:** Constitutional kernel (545 TypeScript files) is in a Git submodule, not tracked in main repository

---

## Findings

### Runtime Directory Exists

**Location:** `C:\Users\nolan\PING\runtime`
**Total TypeScript Files:** 548
**Kernel TypeScript Files:** 545

### Runtime Subdirectories

```
runtime/
├── adapters/
├── canonical/
├── capability/
├── cognitive/
├── constitutional/
├── data/
├── execution/
├── ingestion/
├── kernel/           ← 545 TypeScript files
│   ├── capabilities/
│   ├── commit-service/
│   ├── events/
│   ├── execution/
│   ├── governance/
│   ├── identity/
│   ├── knowledge/
│   ├── leases/
│   ├── mission/
│   ├── projection/
│   ├── providers/
│   ├── replay/
│   ├── repository/
│   ├── scheduler/
│   ├── state/
│   ├── witness/
│   └── workers/
├── mission/
├── projection_worker/
├── providers/
├── replay/
├── retrieval/
├── router/
├── security/
├── tools/
├── version/
├── witness/
└── workers/
```

### Git Submodule Status

**Git Status:** `runtime` is a Git submodule
**.gitmodules File:** Missing or corrupted
**Error:** `fatal: unable to read config file '.gitmodules': No such file or directory`
**Error:** `fatal: no submodule mapping found in .gitmodules for path 'knowledge'`

### Impact

**Critical Issues:**
1. Constitutional kernel (545 files) is not tracked in main repository
2. Submodule configuration is broken (.gitmodules missing)
3. CI cannot validate the runtime
4. Contributors cannot build the system
5. OSS integration work cannot target the real kernel
6. Repository is effectively missing its core product

**Audit Impact:**
- Pre-Audit Readiness Report was incomplete (only audited 31 files, not 548)
- Architectural reviews are incomplete
- Constitutional IP assessment is incomplete

---

## Root Cause Analysis

### Broken Submodule Configuration

The `runtime` directory is a Git submodule, but the `.gitmodules` file is missing or corrupted. This means:
- Git knows `runtime` is a submodule (from git status)
- Git cannot read the submodule configuration (no .gitmodules file)
- Submodule may not be properly initialized or updated

### Possible Causes

1. **.gitmodules file deleted** - Configuration file was accidentally removed
2. **Submodule not initialized** - Submodule was added but never initialized
3. **Repository corruption** - Git metadata corrupted
4. **Manual directory copy** - Runtime directory was copied manually instead of as submodule

---

## Recommended Actions

### Priority 0 — Fix Submodule Configuration

**Option A: Restore .gitmodules**
1. Check if .gitmodules exists in git history: `git log --all --full-history -- .gitmodules`
2. Restore .gitmodules from history if available
3. Initialize submodules: `git submodule update --init --recursive`

**Option B: Remove Submodule and Merge**
1. Remove submodule reference: `git rm --cached runtime`
2. Delete .git/modules/runtime if it exists
3. Add runtime directory as regular files: `git add runtime`
4. Commit: `git commit -m "Merge runtime kernel into main repository"`

**Option C: Reinitialize Submodule**
1. Remove runtime directory: `rm -rf runtime`
2. Add submodule properly: `git submodule add <repository-url> runtime`
3. Initialize: `git submodule update --init --recursive`

### Priority 1 — Audit Runtime Kernel

Once runtime is accessible:
1. Audit runtime/kernel/ (545 TypeScript files)
2. Identify constitutional IP vs commodity infrastructure
3. Map runtime kernel to Phase S.15 architecture
4. Update Pre-Audit Readiness Report

### Priority 2 — Establish Constitutional Boundary

Reorganize into explicit layers:
```
runtime/
    kernel/            ← constitutional IP (545 files)
    adapters/          ← Tree-sitter, Joern, LSP, etc.
    overlays/
    evidence/
    replay/
    proof/
    governance/

platform/
    parsing/
    graph/
    scheduling/
    storage/

integrations/
    joern/
    codeql/
    ray/
    temporal/
    vscode/
```

---

## Immediate Next Steps

1. **Investigate .gitmodules history**
   ```bash
   git log --all --full-history -- .gitmodules
   ```

2. **Check if .git/modules/runtime exists**
   ```bash
   ls -la .git/modules/runtime
   ```

3. **Determine best recovery option** (A, B, or C above)

4. **Execute recovery**

5. **Re-run Pre-Audit Readiness Protocol** with full 548 files

---

## Confidence

**Overall Confidence:** 95%
- **Runtime directory exists:** 100% confidence
- **545 TypeScript files in kernel:** 100% confidence
- **Submodule configuration broken:** 100% confidence
- **Root cause analysis:** 80% confidence (need .gitmodules history)
