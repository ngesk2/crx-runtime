# Repository Risk Report

**Date:** 2026-06-23
**Scope:** crx-runtime (PING) — full repository + Drive mirror + git posture

---

## Risk Summary

| Risk Area | Severity | Status | Mitigation |
|---|---|---|---|
| No Drive ↔ Git mirror | **CRITICAL** | Drive authenticated, 0 files mirrored | Implement sync worker |
| OAuth token in git tracking | **HIGH** | token.json NOT in .gitignore | Add to .gitignore immediately |
| No GPG commit signing | **HIGH** | All 6 commits unsigned | Configure GPG key |
| Submodule drift | **MEDIUM** | knowledge/, runtime/ modified | Clean and commit submodules |
| No branch protection (local) | **MEDIUM** | No hooks, no pre-commit checks | Install pre-commit, enforce policies |
| No automated backup | **MEDIUM** | No Drive pull → local sync | Add cron/systemd timer |
| No restore drill completed | **LOW** | Snapshot verification passed | Maintain quarterly restore tests |
| Worker credentials exposed | **MEDIUM** | QDRANT_API_KEY in docker env vars | Use Docker secrets or Vault agent |
| No secret rotation | **MEDIUM** | OAuth refresh token never rotated | Implement token rotation policy |
| Git history unprotected | **MEDIUM** | No force-push prevention | Enable GitHub branch protection |

## Detailed Findings

### CRITICAL: Drive Mirror Gap
- Google Drive OAuth is fully functional (read scope, refresh token, API verified)
- 39 files exist in Drive (16 presentations, 8 docs, 5 Google Docs, 9 images, 1 binary)
- **Zero** of these 39 files exist in a local `DriveMirror/` directory
- Repository has vault/ with 19 local files but they are NOT Drive-synced
- **Impact**: If Drive is lost, 39 files are unrecoverable from Git

### HIGH: Credential Exposure
- `token.json` lives in project root, not in `.gitignore`
- Contains a long-lived refresh token (604,799 second expiry)
- QDRANT_API_KEY is hardcoded in docker environment variables
- **Impact**: Anyone with repo access can extract Drive API credentials

### MEDIUM: Architectural Drift
- `init.defaultbranch=master` conflicts with remote default `main`
- Submodules are dirty (uncommitted changes in `knowledge/` and `runtime/`)
- Inconsistent naming: constants files under `presentping/config/` vs `presentping/engine/`
- **Impact**: Fresh clone produces different state than current working tree

## Risk Scores

| Category | Score (1-10) |
|---|---|
| Data Loss Risk | 7 |
| Security Risk | 6 |
| Operational Risk | 5 |
| Governance Risk | 8 |
| Recovery Risk | 3 |

**Overall Risk Rating:** MODERATE (5.8/10)
