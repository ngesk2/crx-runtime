# Branch Convergence Report

> **Status:** Documentation corpus integrated, canonical_event_envelope M3 blocker resolved
> **Date:** 2026-08-24
> **Local trunk HEAD:** `15422985` (constitutional-trunk)
> **Origin remote:** `https://github.com/ngesk2/crx-runtime.git`

---

## LIVE POSTGRES GATE: PENDING — INFRASTRUCTURE BLOCKED

**Reason:** Docker daemon npipe unavailable.

**Code status before live verification:**
- 25 suites, 638 assertions, 0 failures
- Priority boundary adapter: verified idempotent, deterministic
- SYSTEM_HEALTH_CHECK route: verified via mock chain
- Orphaned events: verified wired into EVENT_MISSION_MAP

**Required before final promotion:**

| Run | Description | Status |
|-----|-------------|--------|
| A | Explicit-confidence E2E — inject event with confidence, verify every hop preserves it | PENDING_LIVE_E2E |
| B | Omitted-confidence E2E — confidence stays null, no inflation at any hop | PENDING_LIVE_E2E |
| C | SYSTEM_HEALTH_CHECK — real event through live observation→claim→…→projection chain | PENDING_LIVE_E2E |
| D | Degradation — EmbeddingService unavailable → ProjectionWorker status: skipped, no false completed | PENDING_LIVE_E2E |
| E | Mission lifecycle — lease, retry, DLQ, reap, renew against real Postgres | PENDING_LIVE_E2E |
| F | Pipeline blocker SQL — schema migration against clean Postgres | PENDING_LIVE_E2E |

---

## Phase 1B Corrected Graph Truth

> **SUPERSEDES** the three-stream model previously documented. The old model is preserved
> in §Phase 1A Historical Snapshot for forensic reference only.

### Ancestry Containment (proven via `git merge-base --is-ancestor`)

Local `constitutional-trunk` at `d471ec3c` already contains these branches by ancestry:

| Branch | Relationship | Proof |
|--------|-------------|-------|
| `audit-hardening` | IS-ANCESTOR-OF trunk | 26 commits merged into trunk lineage |
| `constitutional-hardening` | IS-ANCESTOR-OF trunk | Merged as `d471ec3c` |
| `main-freeze` | IS-ANCESTOR-OF trunk | In trunk lineage |
| `fix/galaxy-wheel-pan-scroll` | IS-ANCESTOR-OF trunk | In trunk lineage |
| `constitutional-recovery` | IS-ANCESTOR-OF main (2 commits in main's lineage) | Counted once |

**These branches must NOT be counted as remaining divergent streams.**

### Diverged Branches (remaining preservation universe)

| Branch | Unique commits | Merge-base with trunk | Relationship |
|--------|---------------|----------------------|--------------|
| `origin/constitutional-trunk` | **37** | `3c4c2dcd` | Diverged — contains orphaned Python app + unique TS infrastructure |
| `main` | **8** (incl. origin/main's 7) | `adcb062d` | Diverged — contains replay kernel freeze + certification |
| `constitutional-trunk-promotion` | **12** | `6aa40714` | Diverged — parallel rewrite of trunk work + 3 unique cleanup commits + 1 live bug fix |
| `constitutional-boundary-reconstruction` | **2** | `6aa40714` | Diverged — business orchestration TS + drive indexing |
| `origin/audit-hardening` | **4** | `dd57cec7` | Diverged — constitutional self-check + import fixes |
| `authority-forensics` | **1** | `dd57cec7` | Diverged — audit-hardening checkpoint |

### Remote Branch Reality

| Ref | SHA | Notes |
|-----|-----|-------|
| `origin/HEAD` | `6c4b531` | `refs/remotes/origin/main` |
| `origin/main` | `6c4b531` | 5 commits from kernel freeze |
| `origin/constitutional-trunk` | `ffc2b4d6` | Different HEAD than local (diverged) |
| `origin/audit-hardening` | `defdede6` | Different HEAD than local (diverged) |
| **Total origin branches** | **3** | + 1 tag (`constitutional-freeze-v1` @ `63a07847`) |

### Cross-branch Deduplication

- `main`'s 8 commits are NOT in `origin/constitutional-trunk` (verified)
- `origin/constitutional-trunk`'s 37 are NOT in `main` (verified)
- `constitutional-recovery`'s 2 are IN `main` (counted once)
- `origin/main`'s 7 are IN `main` (counted once)
- `boundary-reconstruction` and `authority-forensics` overlap with NEITHER `main` nor `origin/trunk`
- **Deduplicated total: 60 unique commits + 3 significant stashes**

---

## Phase 1A Historical Snapshot (SUPERSEDED)

> This section preserves the original three-stream model for forensic reference.
> It is NO LONGER THE CURRENT ACCOUNTING MODEL.

The original model identified three streams: hardening, main, origin/trunk. The corrected
Phase 1B graph shows that `constitutional-hardening` is already ancestor-contained in `d471ec3c`,
so hardening is NOT a remaining divergent stream. The three remaining streams are:

1. `origin/constitutional-trunk` (37 unique commits — contains orphaned Python app)
2. `main` lineage (8 unique commits — replay kernel freeze/certification)
3. `constitutional-trunk-promotion` (12 unique commits — parallel rewrite + cleanup)
4. `constitutional-boundary-reconstruction` (2 unique commits — business orchestration)
5. `origin/audit-hardening` (4 unique commits — self-check + import fixes)
6. `authority-forensics` (1 unique commit — checkpoint)

---

## Commit-Level Preservation Accounting

### Accounting Summary (post-cleanup, `15422985`)

| Classification | Count | Notes |
|----------------|-------|-------|
| INTEGRATED | **10** | Cherry-picked + cleanup + 22 docs + canonical_event_envelope fix |
| PATCH_EQUIVALENT | **10** | Same semantic effect as trunk, different SHA |
| SUPERSEDED_WITH_PROOF | **4** | Superseded by trunk's own implementation |
| NOT_YET_REPRESENTED | **29** | Unique work not yet on convergence branch |
| MANUAL_RECONCILIATION | **6** | Mixed content requiring manual merge |
| GENERATED_OR_DERIVABLE | **5** | Merge commits, audits, trivial cleanups |
| **TOTAL (all branches)** | **66** | 6 diverged branches + stashes |

### Integrated Commits (on constitutional-trunk)

| # | SHA | Source | Subject |
|---|-----|--------|---------|
| 1 | `c066a948` | trunk | restore lifecycle and confidence semantic invariants |
| 2 | `bc50ca08` | trunk | update mission_id test to match deterministic SHA-256 |
| 3 | `787e0382` | promotion `7a93b80c` | EventBridge cursor advancement fix |
| 4 | `787e0382` | trunk | eliminate confidence fabrication in workers |
| 5 | `acb9cd15` | trunk | enforce canonical priority at mission ingress |
| 6 | `44e98568` | trunk | convergence report update |
| 7 | `166ba314` | trunk | close 7 pre-existing P7/P8 test failures |
| 8 | `5c6c0e0c` | promotion `1e4e3896`+`beb9aff5`+`1a7d7639` | untrack generated artifacts (5,702 files) |
| 9 | `d4c18858` | origin/trunk + main | integrate 22 read-only audit/planning documents |
| 10 | `15422985` | trunk | inject repoRoot into CanonicalEventEnvelope (M3 unblock) |

### Lineage 1: `constitutional-trunk-promotion` (12 commits)

| # | SHA | Subject | Classification | Evidence |
|---|-----|---------|----------------|----------|
| 1 | `0f868def` | PING Core v1 build-out | PATCH_EQUIVALENT | Original `95e2b8c8` IS in trunk |
| 2 | `b9140599` | Phase 0 hardening | PATCH_EQUIVALENT | Original `af6053c8` IS in trunk |
| 3 | `9e7e341f` | Phase D namespace privacy | PATCH_EQUIVALENT | Identical patch-id to trunk's `463623ea` |
| 4 | `ea49122a` | Slice 2 Evidence/Hybrid/Promotion | PATCH_EQUIVALENT | Original `98dac441` IS in trunk |
| 5 | `0ac0f863` | Slice 3A convergence | PATCH_EQUIVALENT | Original `964a3465` IS in trunk |
| 6 | `284134ee` | orchestration → ping-runtime/orchestration | PATCH_EQUIVALENT | Covered by trunk M3 series |
| 7 | `cccd7ded` | M3 gateway relocation | PATCH_EQUIVALENT | Trunk M3 series covers it |
| 8 | `1e4e3896` | remove generated artifacts | **INTEGRATED** `5c6c0e0c` | Trunk still tracks node_modules |
| 9 | `beb9aff5` | remove ui-next/compiler node_modules | **INTEGRATED** `5c6c0e0c` | Not applied in trunk |
| 10 | `1a7d7639` | remove webui.db | **INTEGRATED** `5c6c0e0c` | Trunk still tracks webui.db |
| 11 | `d4463ef5` | prevent phantom mission completion | SUPERSEDED | Trunk implements via P0-2/P0-3 |
| 12 | `7a93b80c` | EventBridge cursor advancement fix | **UNIQUE_WORK** ⚠️ | **LIVE BUG IN TRUNK** — cursor advances unconditionally |

### Lineage 2: `main` (8 commits)

| # | SHA | Subject | Classification | Evidence |
|---|-----|---------|----------------|----------|
| 1 | `42ce1e1c` | replay kernel recovery snapshot (+72k lines) | **UNIQUE_WORK** | certification/, tests/replay/, dist/tests absent from trunk |
| 2 | `b4c5d6e1` | FCA-10.5/11/12 certification | **UNIQUE_WORK** | Depends on absent certification tree |
| 3 | `9bd2cb30` | merge constitutional-recovery | GENERATED_OR_DERIVABLE | Merge commit |
| 4 | `63a07847` | Phase 1-12 kernel freeze | **MANUAL_RECONCILIATION** | Policy conflict: main froze kernel, trunk deleted it |
| 5 | `47642f93` | Phase 13 decision | **UNIQUE_WORK** | `FREEZE_DECISION_PHASE_13.md` absent from trunk |
| 6 | `b833d914` | Phase 14 JS/TS sweep | GENERATED_OR_DERIVABLE | Audit output |
| 7 | `6c4b5317` | freeze 7 definitions | **UNIQUE_WORK** | identity/object/placement/host/owner/revocation/witness definitions absent from trunk |
| 8 | `6e359a26` | archive obsolete engines | SUPERSEDED | Trunk removed same engines via deletion |

### Lineage 3: `constitutional-boundary-reconstruction` (2 commits)

| # | SHA | Subject | Classification | Evidence |
|---|-----|---------|----------------|----------|
| 1 | `a9f9c2c6` | Stage 1 HPP image indexing | **UNIQUE_WORK** | `drive_indexer.py` + `placement_mapper.py` still at root in trunk |
| 2 | `bd83e7ff` | Stage 4 business orchestration | **UNIQUE_WORK** | 5 `business-orchestration/*.ts` (1247 lines) absent from trunk |

### Lineage 4: `origin/audit-hardening` (4 commits)

| # | SHA | Subject | Classification | Evidence |
|---|-----|---------|----------------|----------|
| 1 | `59795121` | audit-hardening checkpoint | **MANUAL_RECONCILIATION** | Mixed: law files identical, server.js superseded, event_emitter.js absent |
| 2 | `defdede6` | constitutional self-check | **UNIQUE_WORK** | `replay/constitutional_self_check.ts` absent from trunk |
| 3 | `5e6c82e7` | canonicalization/import fix | **MANUAL_RECONCILIATION** | Touches kernel/commit-service (deleted in trunk) |
| 4 | `10353c81` | add .gitignore | GENERATED_OR_DERIVABLE | Trunk has own |
| 5 | `f4f9e962` | remove dead freeze-audit files | GENERATED_OR_DERIVABLE | 5-line cleanup |

### Lineage 5: `authority-forensics` (1 commit)

| # | SHA | Subject | Classification | Evidence |
|---|-----|---------|----------------|----------|
| 1 | (at `dd57cec7`) | audit-hardening checkpoint | **MANUAL_RECONCILIATION** | Same as origin/audit-hardening #1 — identical checkpoint |

### Lineage 6: `origin/constitutional-trunk` documentation (20 commits, integrated)

| # | SHA | Subject | Classification |
|---|-----|---------|----------------|
| 1 | `ce29ecaa` | Sprint 1 planning + SPRINT4 audit + next-phase review | **INTEGRATED** |
| 2 | `f0a312b8` | PING as Operational Control Plane audit | **INTEGRATED** |
| 3 | `a62cecdc` | PING v2 Constitutional Operational Plane spec | **INTEGRATED** |
| 4 | `4afdc8a1` | PING becomes TenantOS analysis | **INTEGRATED** |
| 5 | `db9753c7` | Runtime system inventory | **INTEGRATED** |
| 6 | `c9e175a2` | WAVE 3A.5 runtime authority audit | **INTEGRATED** |
| 7 | `1a5f238d` | WAVE 3A.6 business intelligence boundary audit | **INTEGRATED** |
| 8 | `dfb769f0` | WAVE 3B generator gap closure plan | **INTEGRATED** |
| 9 | `b1d79bd6` | Constitutional freeze verification capstone | **INTEGRATED** |
| 10 | `a0efb372` | WAVE 3C constitutional operations dashboard spec | **INTEGRATED** |
| 11 | `6f24cdca` | WAVE 3D growth intelligence spec | **INTEGRATED** |
| 12 | `a7896bb8` | WAVE 3E Oracle hosting architecture audit | **INTEGRATED** |
| 13 | `d060675a` | WAVE 3A.7 dead/duplicate/orphan consolidation | **INTEGRATED** |
| 14 | `cfe9d172` | WAVE 3F operational recovery and replay audit | **INTEGRATED** |
| 15 | `ca658c2a` | WAVE 3G AI operations and diagnostics audit | **INTEGRATED** |
| 16 | `0a28176b` | WAVE 3H notification and observability subsystem audit | **INTEGRATED** |
| 17 | `f5ba38ec` | Constitutional audit index (navigable corpus) | **INTEGRATED** |
| 18 | `d0a52b63` | WAVE 3I compiler/IR audit (HPP meaning-tier) | **INTEGRATED** |
| 19 | `cd933ef1` | WAVE 3J knowledge layer audit | **INTEGRATED** |
| 20 | `9520b338` | WAVE 3K Hermes runtime audit | **INTEGRATED** |

### Lineage 7: `main` documentation (2 commits, integrated)

| # | SHA | Subject | Classification |
|---|-----|---------|----------------|
| 1 | `6c4b5317` | Constitutional object model (7 definitions, 454 lines) | **INTEGRATED** |
| 2 | `47642f93` | Deployment readiness decision (Phase 13, 194 lines) | **INTEGRATED** |

---

## Stash Preservation Forensics

> Full stash analysis: [`docs/STASH-PRESERVATION-001.md`](STASH-PRESERVATION-001.md)

### Summary

| Ref | Classification | Unique Items |
|-----|----------------|--------------|
| `stash@{0}` | MIXED — kernel bugs + noise | canonical_authority.js UTF-8 fix, identity_authority.js collision fix, 6 Python worker remediation versions, constitution law sections |
| `stash@{1}` | EMPTY | None |
| `stash@{2}` | MIXED — ~60% discardable | `ir/node-types.ts` (clean cherry-pick), 23 compiler TS files (blocked on phantom dep), CockpitDashboard expansion, filesystem_worker.py Assets subsystem |
| `stash@{3}` | SUBSET of stash@{2} | None additional |
| `stash@{4}` | GENERATED_OR_DERIVABLE | Superseded compose file |

### Hard Rules

1. **Do NOT `git stash pop`** — stashes are forensic preservation sources
2. **Do NOT `git stash drop`** — evidence must be retained
3. **Kernel bug fixes require golden-hash tests** — never blind-apply
4. **Python worker remediation = harvest patterns** — never blind-apply
5. **Compiler work blocked by phantom dep** = PRESERVED_PENDING_ARCHITECTURAL_UNBLOCK

---

## 29-Domain Semantic Matrix

### Converged and Proven (14 domains)

| Domain | Trunk implementation | Test evidence |
|--------|---------------------|---------------|
| 2. PING Core v1 | unified_event_runtime 326L, knowledge_graph 213L, mission_runtime 375L | All wired, commissioning green |
| 4. POST /events | routes/events.js — converged onto UnifiedEventRuntime | test_events_routes 8/8 |
| 5. EventBridge | event_bridge.js 314L — durable cursors, processed-marking | Live wired |
| 6. Event-to-mission bridge | event_to_mission_bridge.js 128L — EVENT_MISSION_MAP 26 rows | commissioning green |
| 7. Mission lifecycle | mission_runtime.js — 8 states, 9 transitions, SQL WHERE guards | test_durable_lifecycle 8/8 |
| 9. Worker topology | canonical_workers.js 449L — 9 workers, dormant gate | commissioning green |
| 11. Completion/phantom guards | dispatched++ on actual dispatch, P0-3 completion gate | test_durability_invariants 11/11 |
| 13. Causation/correlation | correlation/causation chaining + expression indexes + CTE traversal | test_correlation 13/13, test_causal 9/9 |
| 15. Operator truth | /mc/* routes — event-derived, zero fake/mock | test_mc_bridge 9/9 |
| 16. Counters/observability | scope labels fleet-wide, PATCH-01..05 removed fabricated counters | test_mc 9/9 "no duplicate field names" |
| 18. Canonicalization | canonicalization_service.js 176L + canonical_object.js | test_ingest_boundary 24/24 |
| 21. Slice 2 | EvidenceAuthority, HybridSearch, KnowledgePromoter | test_knowledge_search 10/10 |
| 22. Slice 3A | spine single-default-owner, governance validation | test_slice3a 8/8 |
| 24. Governance | event_governance.js — 232 rules, canonical-namespace validation | test_wave3b_p7 32/32 |

### Converged with Named Residual Gaps (9 domains)

| Domain | Gap | Action |
|--------|-----|--------|
| 3. Event spine | No confidence column on row (lives in metadata JSON) | Optional promoted column |
| 8. Scheduler/routing | getPending() no FOR UPDATE SKIP LOCKED | Add before multi-replica |
| 12. Retry/DLQ | DLQ field-name drift (`original_event` vs `payload`) | Align field names |
| 14. Confidence semantics | T9/T9b FAIL — `confidence_source` never implemented | Implement 3-line field |
| 19. M3 migration | 5 unbatched moves + 1 blocked + google decision | Batch with npm gate |
| 20. Slice 0 | Inherits Domain 14's gap | Close via Domain 14 |
| 23. Knowledge/Qdrant/projection | Dual projection owner (accepted by design) | Consolidate later |
| 26. Documentation | Massive stale-report accretion at root | Move to docs/forensics/ |
| 29. Compiler/tooling | Stash@{3} content unmerged, proof.json zero consumers | Apply stash subset |

### Broken/Red at trunk (action required)

| Issue | Severity | Files | Action |
|-------|----------|-------|--------|
| ~~EventBridge cursor bug~~ | ~~CRITICAL~~ | ~~event_bridge.js~~ | ✅ Cherry-picked in `787e0382` |
| ~~SYSTEM_HEALTH_CHECK broken routing~~ | ~~HIGH~~ | ~~mission_scheduler.js, canonical_workers.js~~ | ✅ Fixed in `acb9cd15` |
| ~~3 orphaned events~~ | ~~MEDIUM~~ | ~~event_to_mission_bridge.js~~ | ✅ Wired in `acb9cd15` |
| compose dev profile | MEDIUM | compose.yaml | Delete 3 stanzas or add Dockerfiles |
| Push blocker (129MB blob) | LOW | git history | Schedule git-filter-repo |
| Security: leaked JWT | **HIGH** | .env.base | Rotate key + strip from repo |
| Security: committed credentials | **HIGH** | credentials/client_secret.json, token.json | Remove + rotate |
| Broken wire | MEDIUM | github_ingestion.js → ./event_emitter | Fix or delete |
| TS kernel policy conflict | MEDIUM | main frozen vs trunk deleted | Explicit decision needed |

### Not-yet-wired domains (6)

| Domain | Status | Convergence action |
|--------|--------|-------------------|
| 10. Lease/recovery | 2 test failures (recovery-contract risk) | Triage BEFORE other work |
| 17. BI/health/signals | Best-known is trunk (wired but thin) | Defer until business consumer |
| 25. Tests/commissioning | 5 red assertions across 3 files | Fix in priority order |
| 27. Boundary reconstruction | Branch has unique TS planning layer | Cherry-pick harvest, never merge |
| 28. Repository cleanup | Missing Dockerfiles, dirty tree | Fix compose stanzas |
| (formerly Domain 1) Runtime ownership | Trunk is canonical | Archive-classify gateway dormant |

---

## git fsck Findings

| Issue | Severity | Path | Classification |
|-------|----------|------|----------------|
| Bad SHA1 file | MEDIUM | `C:/Users/nolan/PING/.git/objects/ff/e9e7ee70b8416ac284ce5c654a4ddb8e6ee489` | **PACK-RECOVERABLE / PHANTOM-LOOSE-PATH** — `git cat-file -t` returns `blob` (object exists in packfile); loose file not readable; non-blocking unless GC runs |
| Bad ref name (trailing garbage) | LOW | `refs/heads/fix/galaxy-wheel-pan-scroll` | Non-blocking — malformed ref name |

**Action**: No cleanup operation yet. Document only.

---

## Worktree Status

| Worktree | Branch | HEAD | Status |
|----------|--------|------|--------|
| PING | constitutional-convergence | `563a4113` | Dirty (44+ orchestration CRLF) |
| PING-promotion | constitutional-trunk-promotion | `7a93b80c` | Unknown (1108 dirty in local trunk) |
| curious-squid | **constitutional-trunk** | `acb9cd15` | Active — routing + priority fixes |
| calm-garden | opencode/calm-garden | `aaec592b` | Stale ancestor |
| eager-moon | opencode/eager-moon | `aaec592b` | Stale ancestor |
| kind-comet | opencode/kind-comet | `aaec592b` | Stale ancestor |

Untracked pre-merge work saved to: `C:\Users\nolan\AppData\Local\Temp\opencode\ping-untracked-premerge\`

---

## Convergence Integration Plan

### CRITICAL: Prerequisites before convergence branch creation

1. ~~**Cherry-pick EventBridge cursor fix** (`7a93b80c`)~~ — ✅ DONE in `787e0382`
2. **Strip leaked JWT** from `.env.base` — rotate key
3. **Remove committed credentials** (`credentials/client_secret.json`, `token.json`)
4. ~~**Fix 5 failing tests**~~ — ✅ DONE (P7 governance + P8 analytics in `166ba314`)

### Phase 6: Create convergence branch

```bash
git switch --detach d471ec3c
git switch -c constitutional-convergence
```

Base contains: all of audit-hardening + constitutional-hardening + fix/galaxy + main-freeze.

### Phase 7: Integrate unique semantic units (dependency order)

**Slice 0 — Critical fixes (before anything else)**
- EventBridge cursor fix from `7a93b80c`
- Secret stripping from stash@{0}/@{2}
- Credentials removal

**Slice 1 — Node_modules + cleanup (from promotion, 3 commits)**
- `1e4e3896` — remove generated artifacts
- `beb9aff5` — remove ui-next/compiler node_modules
- `1a7d7639` — remove webui.db

**Slice 2 — Replay/Kernel from main (requires policy decision)**
- Recovery snapshot, FCA hardening, object model freeze
- BLOCKED: Policy conflict (main froze kernel, trunk deleted it)

**Slice 3 — Business orchestration from boundary-reconstruction (2 commits)**
- Drive indexing, business-orchestration TS planning layer

**Slice 4 — Stash salvageable items**
- `ir/node-types.ts` additions (clean cherry-pick)
- `server.js` retry loop
- `CockpitDashboard.tsx` expansion (needs backend audit)
- Constitution law sections (additive, trivial merge)
- `canonical_authority.js` + `identity_authority.js` bug fixes (behind golden-hash tests)

**Slice 5 — origin/constitutional-trunk Python application**
- Orphaned Python app root commit (268 files)
- Unique TS infrastructure (contracts, providers, event-sourcing)
- Manual reconciliation for 2 mixed commits (unique adds + conflicting deletions)

**Slice 6 — origin/audit-hardening unique items**
- `replay/constitutional_self_check.ts`

### Test Gates (per slice)
1. `git diff --check` — no trailing whitespace/conflict markers
2. `git status --short` — only intended changes
3. `node --check` on all changed JS files
4. Targeted regression: commissioning, ingest_boundary, knowledge_search
5. Full regression on convergence branch HEAD — **25 suites, 638 assertions, 0 failures** (as of `acb9cd15`)

### Exit Criteria
- `git merge-base --is-ancestor <source> constitutional-convergence` for every source head
- ZERO files lost (bytecount comparison)
- `git status --short` clean (except node_modules noise)
- All test gates GREEN
- STILL_UNCLASSIFIED = 0 (ACHIEVED)
- Final report with bytecount table

---

## Routing Convergence (committed `acb9cd15`)

### Changes

| Fix | File | Change | Lines |
|-----|------|--------|-------|
| Priority boundary adapter | `ping-runtime/boundaries/priority_boundary.js` | NEW: `canonicalPriority()` normalizes all 4 scales to canonical int 0-3 | :33-33 |
| Bridge ingress wiring | `ping-runtime/orchestration/event_to_mission_bridge.js` | `canonicalPriority(mapping.priority)` at ingress; +3 orphaned events (EMAIL_SENT, SMS_SENT, GITHUB_COMMIT_SYNCED) → 28 EVENT_MISSION_MAP entries | :130 |
| SYSTEM_HEALTH_CHECK routing | `ping-runtime/orchestration/mission_scheduler.js` | `SYSTEM_AUDIT: 'claim'` → `SYSTEM_AUDIT: 'observation'` | :53 |
| SYSTEM_HEALTH_CHECK event type | `ping-runtime/workers/canonical_workers.js` | Added `'SYSTEM_HEALTH_CHECK'` to BUSINESS_EVENTS (now 22 types) | :479 |

### Routing Matrix (post-fix)

| Category | Count | Status |
|----------|-------|--------|
| LIVE (business → observation → 8-stage chain) | 17 | ✅ |
| LIVE (pipeline stages) | 7 | ✅ |
| ORPHANED | **0** | ✅ (was 3) |
| BROKEN | **0** | ✅ (was 1) |
| DEAD (direct-only, no bridge) | 5 | Documented |
| DORMANT (non-mission) | 2 | Knowledge-promotion live, IntelligenceWorker dormant |

### Priority Boundary (post-fix)

| Scale | Example | Canonical Output |
|-------|---------|-----------------|
| Canonical int 0-3 | `2` | `2` (passthrough) |
| Orca int 4-10 | `7` | `3` (revenue-critical) |
| IntelligenceWorker string | `'high'` | `3` |
| Computed float 0-10 | `9.9` | `3` |
| null/undefined | — | `1` (routine default) |

### Test Evidence

| Suite | Pass | Fail |
|-------|------|------|
| priority_boundary (unit) | 33 | 0 |
| priority_bridge_integration | 49 | 0 |
| All 25 pre-existing suites | 556 | 0 |
| **TOTAL** | **638** | **0** |
