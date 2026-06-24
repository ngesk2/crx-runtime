# Git Hardening Report

**Date:** 2026-06-23
**Scope:** crx-runtime repository

---

## Current Hardening Status

| Hardening Measure | Status | Priority |
|---|---|---|
| GPG commit signing | NOT CONFIGURED | HIGH |
| main branch protection | UNKNOWN (GitHub-side) | HIGH |
| Force push prevention | NOT CONFIGURED locally | HIGH |
| Signed commits required | NOT CONFIGURED | HIGH |
| PR review required | NOT CONFIGURED locally | HIGH |
| History rewrite disabled | NOT CONFIGURED | MEDIUM |
| Active pre-commit hooks | NONE | MEDIUM |
| .gitignore for secrets | PARTIAL (token.json NOT ignored) | HIGH |
| Submodule integrity | DIRTY (2 submodules modified) | MEDIUM |
| Branch naming convention | NOT ENFORCED | LOW |

## Findings

### 1. Credential Exposure
`token.json` contains a live Google Drive API refresh token and is NOT in `.gitignore`. This file is currently showing as modified/untracked but is at risk of being committed.

### 2. No Cryptographic Commit Verification
No GPG key is configured for this repository. All 6 commits in history are unsigned. Commits cannot be verified as originating from a trusted identity.

### 3. Submodule Drift
Two submodules (`knowledge`, `runtime`) have modified content. This means a fresh clone would not reproduce the current working tree state.

### 4. No Pre-Commit Enforcement
All 14 hook files are `.sample` templates — none are active. No linting, secret scanning, or policy checks run before commits.

## Recommended Actions

1. **Add token.json to .gitignore** immediately
2. **Configure GPG signing** — `git config --global commit.gpgsign true`
3. **Enable branch protection** on GitHub: Settings → Branches → main → Require PR review, Require signed commits, Require up-to-date
4. **Install and configure pre-commit hooks** (e.g., detect-secrets, trailing-whitespace)
5. **Clean submodules** — commit or stash changes in knowledge/ and runtime/
6. **Set init.defaultbranch=main** to match remote
