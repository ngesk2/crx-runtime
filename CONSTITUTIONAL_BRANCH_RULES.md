# Constitutional Branch Rules

**Date:** 2026-06-25
**Branch:** constitutional-trunk
**Status:** ENFORCED

---

## Branch Protection Rules

### 1. No Direct Commits
- **Rule:** No direct commits to constitutional-trunk
- **Enforcement:** Branch protection required
- **Exception:** None
- **Implementation:** GitHub branch protection settings

### 2. Pull Request Required
- **Rule:** All changes must go through pull request
- **Enforcement:** Branch protection required
- **Minimum Reviewers:** 1
- **Implementation:** GitHub branch protection settings

### 3. Replay Verification Required
- **Rule:** All PRs must pass replay verification
- **Enforcement:** CI workflow
- **Test Suite:** tests/certification/
- **Implementation:** .github/workflows/replay-integrity.yml

### 4. Certification Suite Required
- **Rule:** All PRs must pass certification suite
- **Enforcement:** CI workflow
- **Test Suite:** tests/certification/
- **Implementation:** .github/workflows/replay-integrity.yml

### 5. Witness Verification Required
- **Rule:** All PRs must pass witness verification
- **Enforcement:** CI workflow
- **Test Suite:** tests/certification/
- **Implementation:** .github/workflows/replay-integrity.yml

### 6. Dependency Lock Validation Required
- **Rule:** All PRs must pass dependency lock validation
- **Enforcement:** CI workflow
- **Tool:** tools/dependency-guard/
- **Implementation:** .github/workflows/replay-integrity.yml

---

## Required Workflows

### 1. Replay Integrity Workflow
- **Location:** .github/workflows/replay-integrity.yml
- **Triggers:** Pull request to constitutional-trunk
- **Steps:**
  - Replay verification
  - Certification suite
  - Witness verification
  - Dependency lock validation

### 2. Constitutional Self-Check
- **Location:** runtime/replay/constitutional_self_check.ts
- **Triggers:** Pre-commit hook
- **Steps:**
  - Constitutional law verification
  - Authority binding verification
  - Witness authority verification

---

## Forbidden Actions

### Absolutely Forbidden
- No direct commits to constitutional-trunk
- No bypassing CI workflows
- No modifying replay engine without certification
- No modifying SecretAdapter without certification
- No modifying constitutional laws without certification
- No modifying runtime/ without certification
- No merging without all checks passing

### Forbidden Until Governance Established
- Neo4j integration
- MCP orchestration
- Specialist agents
- Devin integration
- Tool routers
- Supervisor frameworks
- New worker systems
- Ollama integrations
- Yahoo ingestion redesign
- Mission Control redesign

---

## Branch Authority

### Constitutional Trunk
- **Name:** constitutional-trunk
- **Status:** CONSTITUTIONAL AUTHORITY
- **Protection:** Maximum
- **Required Approvals:** 1
- **Required Checks:** All

### Historical Branches
- **main:** FROZEN (main-freeze)
- **audit-hardening:** CANDIDATE AUTHORITY (pre-trunk)
- **constitutional-recovery:** HISTORICAL
- **authority-forensics:** HISTORICAL

---

## Merge Requirements

### To Merge Into constitutional-trunk
1. Pull request from feature branch
2. All CI checks must pass
3. At least 1 approval required
4. No merge conflicts
5. Replay verification passed
6. Certification suite passed
7. Witness verification passed
8. Dependency lock validation passed

### Feature Branch Naming
- **Pattern:** feature/constitutional-*
- **Examples:** feature/constitutional-replay-fix, feature/constitutional-witness-enhancement
- **Enforcement:** Branch protection rules

---

## Runtime Freeze

### Runtime Directory
- **Location:** runtime/
- **Status:** CONSTITUTIONAL AUTHORITY
- **Protection:** Maximum
- **Modification:** Requires PR + certification

### Replay Engine
- **Location:** runtime/replay/
- **Status:** CONSTITUTIONAL AUTHORITY
- **Protection:** Maximum
- **Modification:** Requires PR + certification

### SecretAdapter
- **Location:** runtime/constitutional/secret_adapter.py
- **Status:** CONSTITUTIONAL AUTHORITY
- **Protection:** Maximum
- **Modification:** Requires PR + certification

---

## Governance Enforcement

### Git as Constitutional Authority
- **Status:** ENFORCED
- **Implementation:** Branch protection rules
- **Verification:** CI workflows

### Runtime Frozen in Git
- **Status:** ENFORCED
- **Implementation:** Branch protection rules
- **Verification:** CI workflows

### Every Change Goes Through Git
- **Status:** ENFORCED
- **Implementation:** Branch protection rules
- **Verification:** CI workflows

---

## Violation Consequences

### Branch Rule Violation
- **Action:** Revert commit
- **Notification:** Security team
- **Investigation:** Required

### Constitutional Law Violation
- **Action:** Revert commit
- **Notification:** Security team
- **Investigation:** Required
- **Remediation:** Required

### Replay Integrity Violation
- **Action:** Revert commit
- **Notification:** Security team
- **Investigation:** Required
- **Remediation:** Required

---

## Sign-Off

**Created By:** Cascade AI Agent
**Date:** 2026-06-25
**Sprint:** Sprint 03 — Constitutional Repository Consolidation
**Milestone:** 2 - Constitutional Synthesis

---

**Status:** ENFORCED
