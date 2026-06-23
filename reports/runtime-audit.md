# Runtime Audit Report

**Date:** 2026-06-08  
**Purpose:** Determine where the constitutional replay kernel actually lives and prove it

## Phase A — Runtime Reality Check

### Repository Topology

**Main Repository:** `C:\Users\nolan\CRX`
- Remote: `https://github.com/ngesk2/crx-runtime.git`
- Branches: main, constitutional-recovery
- Remote branches: origin/main, origin/audit-hardening

**Runtime Repository:** `C:\Users\nolan\CRX\runtime`
- Remote: `https://github.com/ngesk2/crx-runtime.git`
- Branches: audit-hardening, main
- Remote branches: origin/audit-hardening, origin/main

### Critical Finding

**runtime is a SEPARATE GIT REPOSITORY, not a submodule.**

Evidence:
```
git -C runtime status
On branch audit-hardening
Your branch is ahead of 'origin/audit-hardening' by 1 commit
```

```
git -C runtime remote -v
origin	https://github.com/ngesk2/crx-runtime.git (fetch)
origin	https://github.com/ngesk2/crx-runtime.git (push)
```

## Phase B — Find the Kernel

### Constitutional Replay File Ownership

| File | Path | Repository | Branch | Latest Commit |
|------|------|-----------|--------|---------------|
| witness_authority.ts | C:\Users\nolan\CRX\runtime\replay\witness_authority.ts | runtime | audit-hardening | c5524d0 |
| canonical_json.ts | C:\Users\nolan\CRX\runtime\replay\canonical_json.ts | runtime | audit-hardening | c5524d0 |
| replay_verification.ts | C:\Users\nolan\CRX\runtime\replay\replay_verification.ts | runtime | audit-hardening | c5524d0 |
| deterministic_replay_engine.ts | C:\Users\nolan\CRX\runtime\replay\deterministic_replay_engine.ts | runtime | audit-hardening | c5524d0 |
| invariant_runner.ts | C:\Users\nolan\CRX\runtime\replay\invariant_runner.ts | runtime | audit-hardening | c5524d0 |

**Conclusion:** All constitutional replay kernel files live in the runtime repository.

## Phase C — Prove the Newest Branch

### Branch Topology

**Main Repository (CRX):**
```
* 6c4b531 (HEAD -> main) Freeze constitutional object model with 7 definitions
* b833d91 (origin/main) Complete Phase 14: JS/TS Constitutional Boundary Sweep - 4 audit reports
* 47642f9 Add deployment readiness decision - Phase 13 complete
* 63a0784 (tag: constitutional-freeze-v1) Complete constitutional replay kernel hardening: Phase 1-12 certification freeze
|   9bd2cb3 Merge branch 'constitutional-recovery'
|\
| * b4c5d6e (constitutional-recovery) Constitutional replay kernel hardening: FCA-10.5, FCA-11, FCA-12 certification complete
| * 42ce1e1 Constitutional replay kernel recovery snapshot
| * dd57cec (origin/audit-hardening) kernel: Phase 1 - Add PostgreSQL ledger, persistence layers, event logging, and audit endpoints
|/
* adcb062 kernel: initial commit-service with canonical hashing and DAG validation
* 0fbd2b2 Initial commit
```

**Runtime Repository (runtime):**
```
* c5524d0 (HEAD -> audit-hardening) Add constitutional replay kernel to runtime submodule
* defdede (origin/audit-hardening) Add constitutional self-check system
* 10353c8 chore: add .gitignore
* 5e6c82e chore: fix canonicalization and import path
* f4f9e96 chore: remove dead freeze-audit files
* dd57cec kernel: Phase 1 - Add PostgreSQL ledger, persistence layers, event logging, and audit endpoints
* adcb062 (origin/main, origin/HEAD, main) kernel: initial commit-service with canonical hashing and DAG validation
* 0fbd2b2 Initial commit
```

### Constitutional Replay Work Comparison

| Branch | Repository | Latest Commit | Constitutional Replay Work |
|--------|-----------|---------------|---------------------------|
| main | CRX | 6c4b531 | Constitutional object model (Layer 1) |
| constitutional-recovery | CRX | b4c5d6e | FCA-10.5, FCA-11, FCA-12 certification complete |
| origin/audit-hardening | CRX | dd57cec | PostgreSQL ledger, persistence layers |
| audit-hardening | runtime | c5524d0 | Add constitutional replay kernel to runtime submodule |

### Constitutional Replay Kernel Presence

**Files Present in runtime/audit-hardening (c5524d0):**
- witness_authority.ts ✓
- canonical_json.ts ✓
- replay_verification.ts ✓
- deterministic_replay_engine.ts ✓
- invariant_runner.ts ✓
- canonical_hash_authority.ts ✓
- merkle_tree.ts ✓
- replay_event_stream.ts ✓
- replay_invariants.ts ✓
- replay_state_machine.ts ✓
- replay_types.ts ✓
- state_serializer.ts ✓
- canonical_event_envelope.ts ✓
- deterministic_failure.ts ✓
- index.ts ✓
- constitutional_self_check.ts ✓

**Files Present in CRX/constitutional-recovery (b4c5d6e):**
- Certification reports only (no kernel files)

**Files Present in CRX/main (6c4b531):**
- Constitutional object model only (no kernel files)

## Phase D — Report Only

### Repository Topology Summary

1. **Main Repository (CRX):** Contains certification reports, constitutional object model, and deployment artifacts
2. **Runtime Repository (runtime):** Contains the actual constitutional replay kernel implementation

### Branch Topology Summary

1. **CRX/main:** Constitutional object model (Layer 1)
2. **CRX/constitutional-recovery:** Certification reports (FCA-10.5, FCA-11, FCA-12)
3. **CRX/origin/audit-hardening:** PostgreSQL ledger, persistence layers
4. **runtime/audit-hardening:** Constitutional replay kernel implementation
5. **runtime/origin/audit-hardening:** Constitutional self-check system

### Commit Topology Summary

The constitutional replay kernel was added to the runtime repository in commit c5524d0 on the audit-hardening branch. This is the newest constitutional replay work.

### Constitutional Replay File Ownership

All constitutional replay kernel files live in:
- Repository: runtime
- Branch: audit-hardening
- Latest commit: c5524d0

### Newest Branch Determination

The runtime/audit-hardening branch contains the newest constitutional replay kernel implementation (c5524d0). This branch is ahead of origin/audit-hardening by 1 commit.

### Exact Merge Recommendation

**Recommended Action:**

1. Push runtime/audit-hardening to origin:
   ```bash
   cd runtime
   git push origin audit-hardening
   ```

2. Merge runtime/audit-hardening into runtime/main:
   ```bash
   cd runtime
   git checkout main
   git merge audit-hardening
   git push origin main
   ```

3. Update CRX main repository to reference the correct runtime submodule commit:
   ```bash
   cd CRX
   git add runtime
   git commit -m "Update runtime submodule to latest audit-hardening"
   git push origin main
   ```

**Rationale:** The constitutional replay kernel lives in the runtime repository on the audit-hardening branch. This is the authoritative source for all constitutional replay implementation.
