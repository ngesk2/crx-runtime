# Git Authority Audit

**Date:** 2026-06-23
**Repository:** crx-runtime (PING)
**Remote:** https://github.com/ngesk2/crx-runtime.git
**Branch (current):** audit-hardening

---

## 1. Repository Identity

| Property | Value |
|---|---|
| Remote URL | https://github.com/ngesk2/crx-runtime.git |
| Default branch (local config) | master |
| Default branch (remote) | main |
| Local branches | audit-hardening, authority-forensics, constitutional-recovery, main |
| Remote branches | origin/main, origin/audit-hardening |
| Initial commit | 0fbd2b2 |
| Total commits in history | 6 |
| Submodules | knowledge (modified), runtime (modified) |

## 2. Commit History (most recent)

```
ee06790 SecretAdapter migration progress - migrated critical runtime files
01903b9 Constitutional Security + Memory Completion Audit
1a7a30e Constitutional Security Hardening: RBAC, JWT, Ed25519 Signatures...
dd57cec kernel: Phase 1 - Add PostgreSQL ledger, persistence layers...
adcb062 kernel: initial commit-service with canonical hashing and DAG...
0fbd2b2 Initial commit
```

## 3. Signing & Identity

| Property | Status |
|---|---|
| GPG signing configured | NO |
| Signed commits | NONE |
| Commit author verified | NO |
| User email | nolan@crx-runtime.dev |
| User name | nolan |

## 4. Branch Protection (remote — GitHub)

| Protection | Status |
|---|---|
| main branch exists on remote | YES (b833d91) |
| Force push protection | UNKNOWN (GitHub-side check requires GH CLI) |
| PR review required | UNKNOWN |
| Signed commits required | UNKNOWN |
| History rewrite disabled | UNKNOWN |
| Linear history required | UNKNOWN |

## 5. Hooks (local)

All hooks are `.sample` files — none active:
- pre-commit.sample
- commit-msg.sample
- pre-push.sample
- pre-receive.sample
- update.sample
- (9 others, all .sample)

## 6. Risks

- **No GPG signing** — commits cannot be cryptographically verified
- **No active hooks** — no automated policy enforcement
- **Submodules dirty** — `knowledge` and `runtime` have uncommitted changes
- **token.json tracked** — `token.json` is not in .gitignore, exposing Drive API credentials
- **No staging protection** — direct pushes to main not blocked locally
- **Branch name drift** — local init.defaultbranch=master but remote default is main
