# GIT LFS PREPARATION REPORT 2026-09-16

**STATUS:** PREPARED — HISTORY REWRITE NOT EXECUTED
**DATE:** 2026-09-16
**PHASE:** LFS PREPARATION (no rewrite executed)

---

## REPOSITORY STATE

**LOCAL BRANCH:** constitutional-convergence-v2
**LOCAL HEAD:** 5d7d55c4b9a5b4babd5b7c59d630b432a8aee087
**CONVERGENCE BASE:** d0ad44e2818949b6207e567b120fdc41317d132e
**REPOSITORY TOP:** /home/nolan/ping
**REMOTE:** https://github.com/ngesk2/crx-runtime.git
**REMOTE BRANCH:** constitutional-convergence-v2 (stale, at d0ad44e28)
**COMMITS AHEAD:** 13

---

## LFS STATUS

**INSTALLED:** YES (manual installation)
**VERSION:** git-lfs/3.4.0 (GitHub; linux amd64; go 1.20.6; git d06d6e9e)
**LOCATION:** ~/bin/git-lfs
**CONFIGURED:** YES (filter.lfs.* filters set)
**INITIALIZED:** YES (git lfs install executed)
**.gitattributes:** ABSENT (no tracking rules yet)

**Git Config LFS Settings:**
- filter.lfs.clean=git-lfs clean -- %f
- filter.lfs.smudge=git-lfs smudge -- %f
- filter.lfs.process=git-lfs filter-process
- filter.lfs.required=true
- lfs.repositoryformatversion=0

---

## OVERSIZED OBJECT

**BLOB SHA:** 2e34996ebc6e948e839f0f15109cba99bfecbfc5
**PATH:** CascadeProjects/infra/ui-next/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node
**SIZE:** 135,864,320 bytes (129.57 MB)
**FILE TYPE:** Next.js Windows x64 MSVC binary (.node file)

**REACHABILITY:**
- Present in multiple commits (over 50 occurrences found in history)
- Located in CascadeProjects/infra/ui-next/ path (Windows-side artifact)
- NOT present in current HEAD (constitutional-convergence-v2)
- NOT present in current main branch (main)

**ADDITIONAL OVERSIZED OBJECTS:**
- None found > 100 MB
- This is the only offending object causing GitHub rejection

---

## MIGRATION SCOPE

**AFFECTED PATHS:**
- CascadeProjects/infra/ui-next/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node

**AFFECTED COMMITS:**
- Over 50 commits contain this blob in their history
- The blob was added before commit aaec592bd (freeze constitutional replay kernel)
- The blob was removed in commit 207915f02 (untrack generated artifacts)
- The blob is no longer present in main or constitutional-convergence-v2 branches

**AFFECTED BRANCHES:**
- main (history contains the blob, but current HEAD does not)
- backup/night-shift-2026-09-15
- night-shift-2026-09-15
- night-shift-2026-09-15-marketing
- night-shift-2026-09-15-orchestration

**AFFECTED TAGS:**
- None identified

**CONVERGENCE BRANCH STATUS:**
- constitutional-convergence-v2 does NOT contain the blob in current HEAD
- constitutional-convergence-v2 is based on d0ad44e28 (after blob removal)
- However, git push still fails because the blob is reachable in the repository's object database

---

## CURRENT STATE

**HISTORICAL OVERSIZED BLOB:** REMAINS IN REACHABLE GIT HISTORY
**LFS CONFIGURATION:** INSTALLED AND CONFIGURED
**LFS TRACKING:** NOT YET CONFIGURED (no .gitattributes rules)
**HISTORY REWRITE:** REQUIRED

---

## RECOVERY ARTIFACTS

**CONVERGENCE BUNDLE:**
- **PATH:** /tmp/constitutional-convergence-v2.bundle
- **SIZE:** 99 MB
- **SHA-256:** 1b7af53ad2c8ed412e4026be71a42d9f2a25e23de06de0c4fd1066fc46ff744d
- **STATUS:** Preserved and verified

**FORENSICS BUNDLE:**
- **PATH:** /tmp/git-forensics-2026-09-16-final.bundle
- **SIZE:** 99 MB
- **SHA-256:** 47e2cd4f630b312820d26b47c37e836558e97ef54d86a8fb2a2bee3087504a0b
- **STATUS:** Preserved and verified

---

## REQUIRED OPERATION

**Git LFS configuration alone will NOT unblock publication.**

The 129.57 MB blob (2e34996ebc6e948e839f0f15109cba99bfecbfc5) remains reachable in the repository's Git object database. GitHub's pre-receive hook rejects any push that contains or references oversized objects, even if those objects are not present in the branch being pushed.

**Historical migration/rewrite is required** because:
1. The blob exists in the repository's object database
2. The blob is reachable from multiple branches (main, night-shift-* branches)
3. GitHub enforces the 100 MB limit on all reachable objects
4. git lfs track alone only affects NEW files, not existing history

**The only supported way to resolve this:**
- Remove the historical blob from Git history using git lfs migrate import or equivalent
- This is a history rewrite operation (changes commit SHAs)
- Requires force-push to remote

---

## PROPOSED MIGRATION SCOPE

**LFS TRACKING RULE:**
- Narrow scope: *.node files in node_modules directories
- Pattern: node_modules/**/*.node

**AFFECTED REFS:**
- main
- backup/night-shift-2026-09-15
- night-shift-2026-09-15
- night-shift-2026-09-15-marketing
- night-shift-2026-09-15-orchestration
- constitutional-convergence-v2 (if rewrite includes convergence commits)

**REWRITE IMPACT:**
- All commits containing the blob will have new SHAs
- Branch tips will move to new rewritten commits
- Force-push required for all affected branches
- Convergence commits (5e8c94525..5d7d55c4b) will be rewritten

---

## STOP POINT

**PREPARED — HISTORY REWRITE NOT EXECUTED**

**CONDITIONS NOT YET SATISFIED:**
1. ✅ Verified recovery bundles (constitutional-convergence-v2.bundle, git-forensics-2026-09-16-final.bundle)
2. ✅ Exact affected-ref inventory (main, night-shift-* branches)
3. ✅ Exact blob inventory (2e34996ebc6e948e839f0f15109cba99bfecbfc5, 129.57 MB)
4. ⏳ Reproducible migration procedure (not yet executed)
5. ⏳ Post-rewrite verification plan (not yet defined)
6. ⏳ Explicit force-push authorization (not yet granted)

**NEXT STEPS (REQUIRE EXPLICIT AUTHORIZATION):**
1. Add LFS tracking rule for node_modules/**/*.node
2. Execute git lfs migrate import --include=
