# Sprint 03 — Constitutional Repository Consolidation

**Date:** 2026-06-25
**Sprint:** Constitutional Repository Consolidation
**Status:** MILESTONE 1 IN PROGRESS

---

## Executive Summary

**Objective:** Produce a single constitutional trunk that contains authoritative runtime, governance assets, and complete supersession/lineage record.

**Overall Assessment:** ARCHITECTURE NOT BROKEN, FRAGMENTED

---

## Constitutional Blockers (Must Fix)

### 1. runtime/ Outside Git
- **Status:** CRITICAL
- **Evidence:** `git status` shows `runtime (new commits, modified content, untracked content)`
- **Impact:** Constitutional runtime changes are not version-controlled
- **Fix Required:** Commit runtime/ to Git

### 2. No Authoritative Replay Engine in Version Control
- **Status:** CRITICAL
- **Evidence:** Replay engine scattered across main (TypeScript) and audit-hardening (Python)
- **Impact:** No single source of truth for replay engine
- **Fix Required:** Consolidate replay engine into constitutional trunk

### 3. No Declared Branch Authority
- **Status:** CRITICAL
- **Evidence:** Both main and audit-hardening have divergent commits
- **Impact:** Unclear which branch is constitutional authority
- **Fix Required:** Declare audit-hardening as candidate authority, freeze main

### 4. No Constitutional CI on Active Branch
- **Status:** CRITICAL
- **Evidence:** No CI configuration for audit-hardening
- **Impact:** No automated constitutional validation
- **Fix Required:** Add constitutional CI to audit-hardening

---

## Recovery Work (Important, Not Blocking)

### 1. Replay Certification Tests
- **Location:** tests/certification/ (main)
- **Status:** EXISTS
- **Action:** Migrate to constitutional trunk

### 2. Replay Corpus
- **Location:** tests/corpus/ (main)
- **Status:** EXISTS
- **Action:** Migrate to constitutional trunk

### 3. Dependency Guard
- **Location:** tools/dependency-guard/ (main)
- **Status:** EXISTS
- **Action:** Migrate to constitutional trunk

### 4. Historical Constitutional Documents
- **Location:** reports/ (main)
- **Status:** EXISTS
- **Action:** Migrate to constitutional trunk

### 5. CI Replay-Integrity Workflow
- **Location:** Unknown
- **Status:** EXISTS
- **Action:** Migrate to constitutional trunk

---

## Historical Archaeology (Mostly Finished)

### 1. Duplicate Workers
- **Location:** workers/ (audit-hardening)
- **Status:** IDENTIFIED
- **Action:** Become lineage

### 2. Abandoned TypeScript Kernel
- **Location:** kernel/ (main)
- **Status:** IDENTIFIED
- **Action:** Become lineage

### 3. Old Dockerfiles
- **Location:** Various
- **Status:** IDENTIFIED
- **Action:** Become lineage

### 4. AI Stack Experiments
- **Location:** Various
- **Status:** IDENTIFIED
- **Action:** Become lineage

### 5. constitutional-recovery Branch
- **Location:** Git branch
- **Status:** IDENTIFIED
- **Action:** Become lineage

### 6. authority-forensics Branch
- **Location:** Git branch
- **Status:** IDENTIFIED
- **Action:** Become lineage

---

## Branch Comparison

### main
- **Commits ahead of audit-hardening:** 7
- **Unique Assets:**
  - kernel/ (TypeScript commit service)
  - tests/certification/ (replay certification tests)
  - tests/corpus/ (replay corpus)
  - tools/dependency-guard/ (dependency validation)
  - reports/ (historical constitutional documents)
  - runtime/ (submodule)
  - knowledge/ (submodule)
  - vos/ (submodule)

### audit-hardening
- **Commits ahead of main:** 25
- **Unique Assets:**
  - workers/ (Python workers)
  - runtime/ (untracked constitutional runtime)
  - vault/ (Vault configuration and audits)
  - presentping/ (presentation engine)
  - docs/ (forensic reports)
  - AGENTS.md
  - knowledge (submodule)
  - runtime (submodule)

---

## Milestone 1: Git Freeze

### Step 1: Declare audit-hardening as Candidate Authority
- **Status:** PENDING
- **Action:** Create CONSTITUTIONAL_AUTHORITY.md declaring audit-hardening as candidate authority

### Step 2: Freeze main
- **Status:** PENDING
- **Action:** Create main-freeze branch, push to origin

### Step 3: Inventory Unique Assets
- **Status:** IN PROGRESS
- **Action:** Document unique assets in main and audit-hardening

---

## Milestone 2: Constitutional Synthesis

### Assets to Move to New Trunk
1. **Replay Engine** (from main)
2. **SecretAdapter** (from audit-hardening)
3. **runtime/** (from audit-hardening untracked)
4. **certification** (from main)
5. **replay-integrity CI** (from main)

### Assets to Preserve as Lineage
1. **kernel/** (TypeScript commit service)
2. **reports/** (historical documents)
3. **presentping/** (presentation engine)
4. **constitutional-recovery branch**
5. **authority-forensics branch**

---

## Milestone 3: Governance

### Step 1: Git Becomes Constitutional Authority
- **Status:** PENDING
- **Action:** Configure Git as source of truth for constitutional runtime

### Step 2: Runtime Frozen
- **Status:** PENDING
- **Action:** Commit runtime/ to Git, freeze changes

### Step 3: Every Change Goes Through Git
- **Status:** PENDING
- **Action:** Enforce Git workflow for all changes

---

## Milestone 4: Scale

### Future Capabilities
1. MCP orchestration
2. Specialist agents
3. Autonomous capability branches
4. Constitutional merge validation

---

## Architecture Assessment

### Not Broken
- Replay engine exists
- Constitutional laws exist
- Workers exist
- Mission Control exists
- Qdrant exists
- PostgreSQL exists
- Google Drive exists
- CI replay validation exists
- Certification suite exists

### Fragmented
- Assets scattered across main, audit-hardening, untracked runtime/
- No single source of truth
- No declared branch authority
- No constitutional CI on active branch

---

## Conclusion

**Root Cause:** Governance problem, not engineering failure

**Recommendation:** Proceed with Constitutional Repository Consolidation (Sprint 03)

**Next Action:** Complete Milestone 1 - Git Freeze

---

**Report Generated:** 2026-06-25
**Sprint:** Constitutional Repository Consolidation
**Status:** MILESTONE 1 IN PROGRESS
