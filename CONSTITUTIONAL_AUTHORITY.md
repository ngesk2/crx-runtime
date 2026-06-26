# Constitutional Authority Declaration

**Date:** 2026-06-25
**Status:** CANDIDATE AUTHORITY DECLARED

---

## Declaration

**audit-hardening** is hereby declared as the **CANDIDATE CONSTITUTIONAL AUTHORITY** for the PING repository.

---

## Rationale

### Constitutional Assets in audit-hardening
- **Workers:** Python workers (observation_worker, claim_worker, replay_worker, witness_worker, lineage_worker, projection_worker)
- **Runtime:** Constitutional runtime (constitutional_runtime.py, constitutional_event_loop.py)
- **Configuration:** Canonical .env.base configuration
- **Security:** SecretAdapter implementation
- **Vault:** Vault configuration and audits
- **Forensics:** Comprehensive forensic reports

### Governance Assets in main
- **Replay Engine:** TypeScript replay engine
- **Certification:** Replay certification tests
- **Corpus:** Replay corpus
- **Dependency Guard:** Dependency validation
- **CI:** Replay-integrity workflow

---

## Freeze Status

### main
- **Status:** FROZEN
- **Action:** No new commits to main until constitutional synthesis complete
- **Freeze Branch:** main-freeze (to be created)

### audit-hardening
- **Status:** CANDIDATE AUTHORITY
- **Action:** All constitutional changes must go through audit-hardening
- **Target:** Will become constitutional trunk after Milestone 2

---

## Supersession Plan

### Milestone 2: Constitutional Synthesis
1. Move replay engine from main to audit-hardening
2. Move SecretAdapter from audit-hardening to audit-hardening (already there)
3. Commit runtime/ to audit-hardening
4. Move certification from main to audit-hardening
5. Move replay-integrity CI from main to audit-hardening

### Milestone 3: Governance
1. Git becomes constitutional authority
2. Runtime frozen in Git
3. Every change goes through Git

---

## Lineage Preservation

### Historical Assets (to be preserved as lineage)
- **kernel/** (TypeScript commit service)
- **reports/** (historical constitutional documents)
- **presentping/** (presentation engine)
- **constitutional-recovery branch**
- **authority-forensics branch**

---

## Authority Transition

### Current State
- **Candidate Authority:** audit-hardening
- **Frozen Branch:** main
- **Untracked Runtime:** runtime/

### Target State (after Milestone 2)
- **Constitutional Trunk:** audit-hardening (renamed to main or constitutional)
- **Historical Branches:** main-frozen, constitutional-recovery, authority-forensics
- **Tracked Runtime:** runtime/ committed to constitutional trunk

---

## Validation Criteria

### Milestone 1 Complete When:
- [x] CONSTITUTIONAL_AUTHORITY.md created
- [ ] main-freeze branch created and pushed
- [ ] Unique assets inventory complete

### Milestone 2 Complete When:
- [ ] Replay engine moved to constitutional trunk
- [ ] SecretAdapter in constitutional trunk
- [ ] runtime/ committed to constitutional trunk
- [ ] Certification moved to constitutional trunk
- [ ] Replay-integrity CI moved to constitutional trunk

### Milestone 3 Complete When:
- [ ] Git declared constitutional authority
- [ ] Runtime frozen in Git
- [ ] All changes go through Git

---

## Sign-Off

**Declared By:** Cascade AI Agent
**Date:** 2026-06-25
**Sprint:** Sprint 03 — Constitutional Repository Consolidation
**Milestone:** 1 - Git Freeze

---

**Status:** CANDIDATE AUTHORITY DECLARED
