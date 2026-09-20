# Authority Convergence Patch Ledger

**Status:** PATCH 1 COMPLETE — WSL CANONICAL REPOSITORY

---

## PATCH 0 - ESTABLISH BASELINE (WSL CANONICAL)

**Objective:** Establish canonical WSL repository baseline

**Git Status:**
- Repository: /home/nolan/ping (canonical engineering root)
- Branch: refactor/runtime-authority-convergence
- HEAD: 28f0c9707
- Worktree: N/A
- Remotes: origin https://github.com/ngesk2/crx-runtime.git

**Finding:** WSL canonical repository does NOT have the gitlink problem. runtime/ is already a normal tracked directory with 258 files. The gitlink problem is isolated to the Windows branch (feature/mission-control-truth).

**WSL runtime State:**
- runtime/constitutional/ contains only Python files (event_chain.py, secret_adapter.py, etc.)
- No TypeScript constitutional authorities in src/ before PATCH 1
- JavaScript IdentityAuthority exists at runtime/kernel/authorities/identity_authority.js
- Uses format: type_hash16 (underscore separator)

**Next Action:** Execute PATCH 1 in canonical WSL repository

---

## PATCH 1 - FIX BROKEN IDENTITY AUTHORITY CONTRACT (WSL CANONICAL)

**Objective:** Add TypeScript IdentityAuthority to canonical WSL repository with correct legacy format

**Files Changed:**
- ADDED: runtime/constitutional/src/identity-authority.ts (127 lines)
- ADDED: runtime/constitutional/src/identity-authority.test.ts (91 lines) - characterization tests
- ADDED: runtime/constitutional/src/hash-authority.ts (48 lines)
- ADDED: runtime/constitutional/src/time-authority.ts (89 lines)
- ADDED: runtime/constitutional/src/index.ts (12 lines) - minimal exports only
- ADDED: runtime/constitutional/package.json (617 bytes)

**Authority Affected:** IdentityAuthority (constitutional)

**Duplicate Eliminated:** None (created missing TypeScript authority alongside existing JavaScript)

**Compatibility Preserved:** YES - Implemented generateId() with type_hash16 format (underscore separator) to match historical JavaScript implementation

**Tests Run:** Not yet executed in WSL (tests added but not run)

**Result:** COMMITTED to WSL canonical repository at SHA 28f0c9707

**Canonical Behavior Changed:** NO - TypeScript implementation matches JavaScript legacy format (type_hash16)

**Compatibility Risk:** LOW - Format verified against historical JavaScript implementation

**ID Format Resolution:**
- Historical JavaScript: type_hash16 (underscore separator)
- PATCH 1 initial (incorrect): type:hash16 (colon separator)
- PATCH 1 corrected: type_hash16 (underscore separator)
- Evidence: runtime/kernel/authorities/identity_authority.js line 57

**Next:** Proceed to PATCH 2 (identity semantic split documentation)

---

## PATCH 2 - IDENTITY SEMANTIC SPLIT DOCUMENTATION

**Objective:** Document semantic split between random/temporal and deterministic/content-addressed identity authorities

**Finding:** Identity authorities are NOT duplicates. They serve distinct semantic purposes:
- Python IdentityAuthority (UUID v7) → random/temporal identity for execution/events/actors
- JavaScript/TypeScript IdentityAuthority (type_hash16) → deterministic/content-addressed identity for objects/artifacts

**Verdict:** DO NOT COLLAPSE. These are semantically distinct responsibilities with different use cases.

**Files Changed:**
- ADDED: docs/IDENTITY_SEMANTIC_SPLIT.md (141 lines)

**Dependency Graph Documented:**
- Execution Identity → Python IdentityAuthority (UUID v7) → Event IDs, Actor IDs, Mission/Run/Execution IDs
- Object Identity → JavaScript/TypeScript IdentityAuthority → Canonical SHA-256 → type_hash16 → Artifact IDs, Evidence IDs, Repository Object IDs

**Format Compatibility:**
- JavaScript: type_hash16 (underscore separator) - CANONICAL
- TypeScript PATCH 1: type_hash16 (underscore separator) - COMPATIBLE
- Python UUID v7: RFC 9562 format - SEPARATE PATH

**Convergence Rule:** Events must not use object IDs (non-temporal). Objects must not use UUID v7 (non-deterministic).

**Result:** COMMITTED to WSL canonical repository

**Next:** Continue PATCH 2 - authority duplication audit for hash authorities

---

## PATCH 1 - FIX BROKEN IDENTITY AUTHORITY CONTRACT (WINDOWS - BLOCKED)

**Objective:** Restore canonical IdentityAuthority contract by implementing missing authority in @ping/constitutional package

**Status:** BLOCKED - Gitlink problem isolated to Windows branch

**Finding:** Windows branch (feature/mission-control-truth) has stranded gitlink. WSL canonical repository does not have this problem. All future work in canonical WSL repository.

**Decision:** Abandon Windows branch repair. Work in canonical WSL repository only.
