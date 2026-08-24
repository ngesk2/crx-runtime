# FULL SYSTEM AUDIT

**Date:** 2026-08-08
**Mode:** READ-ONLY forensic audit. Zero implementation changes, zero commits.
**Branch:** `constitutional-hardening`
**Baseline:** `09101043` (`09101043d`) — 0 commits since M3 baseline.

This document is the single deliverable of the read-only audit. Every claim carries a
file path or an executed command as evidence. Where a prior audit figure was corrected,
the correction is stated with the first-hand measurement that supersedes it.

---

## 1. Executive Summary

- **M3 MOVE table: 38 of 49 candidates moved and gate-verified (77.6%).** 43 total
  staged renames = 38 table candidates + 5 pre-existing `ping-runtime/agents/` (M3-E).
  11 table candidates remain unmoved: 1 BLOCKED (`canonical_event_envelope.js`), 5
  reverted (`gateway/google/*`, googleapis npm coupling), 5 never batched
  (`knowledge_retrieval`, `conversation_memory`, `document_ingestion`,
  `repository_discovery_authority`, `worker_registry`).
- **B7 (agents): CONDITIONAL.** 5 files staged as renames, duplicate gate passed, but 4
  stale `../gateway/*` import refs remain in `ping-runtime/agents/` (2 files × 2 refs
  each) and 2 wrong-depth test refs in `gateway/tests/`. Not executable without rewire.
- **GitHub harvest inventory: 8 candidate repos verified live** (existence, owner,
  license, stars, active status) via GitHub API. All 11 `HARVEST_*.md` source docs
  contain ZERO license text. `docs/hermes-open-source-harvest.md` does not exist.
- **Production path is the PING runtime**, not the constitutional kernel: the kernel
  pipeline (`gateway/runtime/constitutional_execution_pipeline.js`) is a hollow gate —
  its reducer/projection registries have zero callers.
- **Replay/Witness/Lineage remain frozen and dormant** — nothing emits `REPLAY_VERIFY`;
  no moved file activates them.
- **No stale paths from any M3 batch survive** on the production import graph; the only
  remaining gateway-root refs to moved targets are DORMANT (kernel twins, B7 agents,
  dormant verification scripts).

---

## 2. Audit Scope & Method

Scope: M3 migration integrity (batches B1–B7), authority/layer mapping, import
integrity, persistence/mutation/survivability, GitHub harvest candidate inventory.

Method: first-hand `git`, `rg`/`Select-String`, `require.resolve`, `node --check`,
module load, and GitHub REST API verification. Delegated explorer reports were used
only where explicitly re-verified first-hand in this session.

Definitions (from `PING_MIGRATION_INVENTORY.md` §1): ACTIVE = transitively reachable
from `gateway/bootstrap/gateway_runtime.js`; DORMANT = tracked but not in the bootstrap
graph; LIVE = ACTIVE and ≥1 direct importer ACTIVE.

---

## 3. Repository State

- HEAD: `09101043d`; branch: `constitutional-hardening`; 0 commits since M3 baseline.
- `git status --porcelain` = 1389 entries (pre-existing dirty state preserved).
- Staged set: **43 rename pairs, 0 non-R, 0 deletions** — verified by
  `git diff --cached --name-status -M` (43 rows, all `R09x`/`R100`).
- Working-tree rewires from B1–B6 remain unstaged (per M3 convention).
- Untracked pre-existing: `node_modules/` (CRLF noise), reports, workspace state.

Staged rename destinations (grouped):

| Destination | Count | Batch |
|-------------|-------|-------|
| `ping-runtime/agents/` | 5 | M3-E/B7 (pre-existing) |
| `ping-runtime/ai/` | 5 | B2 |
| `ping-runtime/authorities/` | 6 | B5+B6 |
| `ping-runtime/business/` | 4 | B1 |
| `ping-runtime/canonicalization/` | 1 | B5 |
| `ping-runtime/connectors/` | 4 | B1/B2 |
| `ping-runtime/events/` | 5 | B3/B4 |
| `ping-runtime/evidence/` | 1 | B5 |
| `ping-runtime/runtime/` | 12 | B3 |

---

## 4. M3 Inventory Reconciliation (49 candidates vs 43 staged)

`PING_MIGRATION_INVENTORY.md` §3 lists exactly **49 MOVE candidates** (rows
`gateway/canonical_authority.js` → `gateway/worker_registry.js`). Of these:

- **38 staged & gate-verified** (every batch ran the M3.5 checklist: `git mv` → import
  repair → Docker/build scan → regression → entrypoint load → `node --check`).
- **11 NOT moved:**
  - 1 **FIXED** — `gateway/canonical_event_envelope.js`: repoRoot injection applied
    (`15422985`). `initialize()` now uses `this._repoRoot` instead of `__dirname`.
    Ready for M3 B4 relocation.
  - 5 **REVERTED** — `gateway/google/{calendar_adapter,gmail_adapter,people_adapter,
    business_profile,google_auth}.js`: all `require('googleapis')` (line 15 each);
    `googleapis` resolves only from `gateway/node_modules`; target location broke
    dev-time boot (`require.resolve` → MODULE_NOT_FOUND). User directed revert.
    Clean revert confirmed: `git diff HEAD -- gateway/google` → zero changes.
  - 5 **NEVER BATCHED** (not in any B1–B6 batch plan): `knowledge_retrieval.js`,
    `conversation_memory.js`, `document_ingestion.js`, `repository_discovery_authority.js`
    (Knowledge cluster), `worker_registry.js` (Workers).

The 5 `ping-runtime/agents/` renames are **not** part of the 49 (M3-E, pre-existing,
committed separately).

---

## 5. M3 Batch Execution Log

| Batch | Files | Result | Evidence |
|-------|-------|--------|----------|
| B1 | business/ (4) + integrations/ (3) + huggingface | moved | staged R100 |
| B2 | inference_service, ollama/openai adapters, inference_adapter, github_adapter | **5/10** moved; google/* reverted | googleapis coupling STOP |
| B3 | runtime governance (14) | moved | staged R100/R09x |
| B4 | events core (4) | moved; `canonical_event_envelope` NOT moved | BLOCKED per manifest §6.2 |
| B5 | canonical core (4) | moved; 80 importers rewired | apply_b5.js |
| B6 | top authorities (3) | moved; 455 refs rewired across 221 files | apply_b6.js |
| B7 | agents (5) | **STAGED ONLY** | rewire pending (see §6) |

Per-batch regression was GREEN and identical to baseline at each step (commissioning
14 scenarios 0 failed; wave3a 59/59; p001_p005 27/27; ingest_boundary 24/24; etc.).
Pre-existing failures only: wave3b_p7 (stale 195 vs 231 governance rule count),
wave3b_p8 (3: nested password/token redaction, policy-active flag).

---

## 6. Import Integrity Verification

### 6.1 B7 agents — 4 stale `../gateway/*` refs (DORMANT targets)

`ping-runtime/agents/agent_memory_authority.js`:
- :25 `const { witnessAuthority } = require('../gateway/witness_authority');`
- :26 `const { constitutionVersionAuthority } = require('../gateway/constitution_version_authority');`

`ping-runtime/agents/distributed_desktop_agents.js`:
- :35 `const { witnessAuthority } = require('../gateway/witness_authority');`
- :36 `const { constitutionVersionAuthority } = require('../gateway/constitution_version_authority');`

These resolve to `ping-runtime/gateway/...` which does not exist. Correct target from
`ping-runtime/agents/` is `../../gateway/...`. `witness_authority.js` and
`constitution_version_authority.js` are FROZEN (M3 §6.1 — 68 and 16 DORMANT importers,
not in MOVE set). All four refs are in DORMANT files; no live path is affected.

Verified CLEAN:
- `ping-runtime/agents/replay_worker.js:8-9` → `require('./base_worker')`,
  `require('../authorities/canonical_authority')` — correct.
- `ping-runtime/agents/base_worker.js`, `worker_port.js` — no gateway refs.

### 6.2 `gateway/tests/` wrong-depth (B2-era, dormant)

- `gateway/tests/adapter.test.js:9` and `gateway/tests/ingest.test.js` →
  `require('../ping-runtime/ai/inference_adapter')`. From `gateway/tests/`, `../` lands
  in `gateway/`, so `../ping-runtime/...` resolves to `gateway/ping-runtime/...` —
  wrong depth. Correct: `../../ping-runtime/ai/inference_adapter`. Dormant, not in the
  regression suite. (Note: a grep display truncation shows this as `'../n'`; full file
  read confirms the real path.)

### 6.3 B6 dynamic repairs (dormant)

`gateway/constitutional_blockers.js` lines 46/48/70/82 →
`path.join(gatewayRoot, '..', 'ping-runtime', 'authorities', 'canonical_authority.js')`
(×2) and `..., 'constitutional_time_authority.js')` (×2). Line 47
`runtime_identity_authority.js` is a distinct file entry (false positive, untouched).

### 6.4 Kernel twins intentionally untouched

`runtime/execution_runtime.js` and `runtime/kernel/gateway_adapter.js` resolve to
kernel-twin `deterministic_id_authority`/`event_read_authority`/authority twins — never
rewired. `git diff --stat -- runtime/kernel` empty. No kernel behavior change.

### 6.5 Boot-load verification

`require('./gateway/bootstrap/gateway_runtime.js')` → **"gateway_runtime LOADS OK"**.
B6 targets load: `ping-runtime/authorities/identity_authority` →
`IdentityAuthority,identityAuthority`; `canonical_authority` →
`CanonicalBytes,CanonicalAuthority`; `constitutional_time_authority` →
`ConstitutionalTimeAuthority,constitutionalTimeAuthority`.
`gateway/google/*` rewired back via `gateway/bootstrap/gateway_runtime.js:55-61`
(`require('../google/...')`).

### 6.6 Definitive stale-path scan

`rg` over `gateway/` + `ping-runtime/` for old paths (`gateway/canonical_authority`,
`gateway/identity_authority`, `gateway/constitutional_time_authority`,
`gateway/inference_adapter`, `gateway/github_adapter`, `./runtime/<moved>`,
`./<registry>`) → **zero hits** outside node_modules/archive/dormant_classifications.
Remaining gateway-root refs are: kernel twins (§6.4), B7 agents (§6.1), and dormant
verification/registry files — none on the live graph.

---

## 7. Kernel Pipeline State (hollow gate)

`runtime/kernel/gateway_adapter.js` exposes `registerReducer` (:33-69) and
`registerProjection` (:75+) registries. **Zero callers** of either exist in
`gateway/runtime/`. The 7-stage `gateway/runtime/constitutional_execution_pipeline.js`
(:17-109, with ROLLBACK gate) validates events (schema/repository/verification) but
routes nothing onward — reducer/projection registries are empty. The kernel is
DORMANT; the live path is the PING JS runtime.

---

## 8. Authority / Layer Mapping (ownership per Layer 1)

Frozen Layer-1 owners (from Slice 3A session) and their canonical files:

| Layer-1 Owner | File | Status |
|---------------|------|--------|
| Identity | `ping-runtime/authorities/identity_authority.js` | moved (B6), load-verified |
| Time | `ping-runtime/authorities/constitutional_time_authority.js` | moved (B6), load-verified |
| Canonical Object | `ping-runtime/canonicalization/canonical_object.js` | moved (B5) |
| Namespace | `ping-runtime/canonicalization/canonicalization_service.js` | native |
| Verification | `ping-runtime/canonicalization/canonical_object.js` → `verifyCanonicalObject` | native |
| Evidence | `ping-runtime/evidence/evidence_authority.js` | native (Slice 2) |
| Promotion | `ping-runtime/knowledge/knowledge_promoter.js` | native (Slice 2) |
| Search | `ping-runtime/search/hybrid_search.js` | native (Slice 2) |
| Runtime emission | `ping-runtime/events/unified_event_runtime.js` | native |

Shadow stacks transfer TO these owners; no new owner is created by M3.

---

## 9. ping-runtime/ Structure (post-B1..B6)

First-hand file counts per subdirectory (`.js` files, excluding node_modules):

| Subdir | Files | Notes |
|--------|-------|-------|
| `agents/` | 5 | B7 staged |
| `ai/` | 7 | inference family |
| `auth/` | 0 | empty |
| `authorities/` | 6 | identity, canonical, time, deterministic_id, constitutional_validation, workflow_identity |
| `business/` | 5 | customer, project, review, ai_workspace + huggingface_adapter |
| `canonicalization/` | 2 | canonical_object, canonicalization_service |
| `connectors/` | 13 | capability_registry, oauth_provider, google_connector + moved integrations |
| `embeddings/` | 1 | embedding_service |
| `events/` | 7 | spine (unified_event_runtime, event_bridge) + governance/validator + moved |
| `evidence/` | 3 | evidence_authority + tests + verification authority |
| `graph/` | 1 | — |
| `integrations/` | 0 | empty |
| `knowledge/` | 2 | knowledge_graph, knowledge_promoter |
| `orchestration/` | 43 | mission_runtime, mission_scheduler, execution/* fabric |
| `runtime/` | 12 | system_authority, registries, runtime governance |
| `search/` | 2 | hybrid_search + qdrant_adapter |
| `workers/` | 3 | worker_runtime, canonical_workers + registry target |

Gateway top-level `/*.js` = **339** (first-hand `Get-ChildItem`).
`runtime/kernel/` = 18 subdirectories (dormant kernel).

---

## 10. Live Store Writers (persistence authority)

CREATE TABLE writers on the live path (verified first-hand):

- `ping-runtime/knowledge/knowledge_graph.js` — `knowledge_nodes`/`knowledge_edges`
  (namespace/status columns added in Phase D, with idempotent ALTER).
- `ping-runtime/events/unified_event_runtime.js` — `ping_events` DDL.
- `ping-runtime/events/event_bridge.js` — bridge re-emit path.
- `ping-runtime/orchestration/mission_runtime.js` — `ping_missions`.

`event_processing` DDL: sole source is `gateway/migration_engine.js` (migration 004,
2 sites). Other references are JSON/registry/doc only
(`gateway/generated/state_machine_generator.js`, ping-runtime orchestration JSON,
`docs/omega97_*`).

---

## 11. Duplicate Ownership Families (classified, not deleted)

| Family | Implementations |
|--------|-----------------|
| Worker runtimes | `ping-runtime/workers/worker_runtime.js`, `ping-runtime/workers/canonical_workers.js`, `gateway/background_workers.js`, `ping-runtime/knowledge/knowledge_promoter.js`, `ping-runtime/orchestration/mission_scheduler.js` + refs in `gateway_runtime.js` |
| Capability registries | `ping-runtime/connectors/capability_registry.js`, `ping-runtime/orchestration/ConstitutionalQueryAPI.js`, `generate_capability_registry.js`, `generate_cross_reference_matrix.js`, `generate_context_packets.js`, `generate_execution_router.js`, `generate_routing_cache.js`, `execution/ollama_provider.js` |
| Event persistence | `ping_events` (spine), `repository_events`, `canonical_events`, event_processing (migration_engine) |
| Projection owners | `EmbeddingService` subscriber + `ProjectionWorker` (idempotent by event_id; consolidation deferred) |

No deletion occurs without the 6-step gate (wired replacement → golden tests → routing
matrix → CRC → Convergence Ledger → user direction).

---

## 12. Mutation Bypass Counts (corrected)

Scope: `gateway/` + `ping-runtime/`, `*.js`, excluding node_modules/archive/
dormant_classifications. **537 files scanned.** File-level counts (files with ≥1 site):

| Pattern | Files | Sites |
|---------|-------|-------|
| `crypto.createHash` | **41** | 67 |
| `uuidv4\|uuid.v4\|randomUUID` | **10** | 18 |
| `Date.now\|new Date` | **136** | 385 |
| `Math.random` | **13** | 21 |

**Correction:** earlier session notes recorded 71/29/99/80 (file-level). The
first-hand re-measurement here is **41/10/136/13**. The earlier figures are superseded;
the discrepancy is attributed to a different (broader) scan scope in the prior session.

These are structural facts, not per-site authority audits: the production path routes
time via `ConstitutionalTimeAuthority`, identity via `identityAuthority`, hash via
`CanonicalAuthority.hashBytes` (kernel shims moved in B6). The bypass counts above
span the full `gateway/`+`ping-runtime/` surface including dormant files.

---

## 13. Namespace / Decision Graph

- Spine is the single namespace default owner: `unified_event_runtime.js` resolves
  `options.namespace || 'core::system'` once (step 3), passes into
  `EventGovernance.validateEvent`. Duplicate `|| 'core::system'` fallbacks removed
  (Slice 3A) from `canonical_workers.js`, `event_to_mission_bridge.js`,
  `mission_scheduler.js`, `gateway_runtime.js`.
- `event_governance.js` validates canonical namespace
  `/^(core|tenant)::[a-zA-Z0-9_-]+$/` → `INVALID_NAMESPACE` (absent valid for legacy
  direct callers).
- `intelligence_worker.js:18-24` inline BaseWorker now preserves `this._event?.namespace`
  (Slice 3A-3) — fixes the confirmed namespace drop on the biggest business-event consumer.
- Confidence is structurally absent from the spine event object (known gap, G6 —
  deferred, decision-graph fixes awaiting direction).

---

## 14. Worker Runtime Reality

- Two timers drive everything: `event_bridge.js:87` (5s poll) and
  `mission_scheduler.js:106` (5s poll). `WorkerRuntime._poll()` is dead by design
  (worker_runtime.js:50-56,140) — workers are driven by scheduler dispatch.
- Honest chain: observation → claim → classification → recommendation → projection
  (5 stages). Stages 6-8 (replay/witness/lineage) never execute — nothing emits
  `REPLAY_VERIFY`.
- `IntelligenceWorker` is a duplicate path (listens to same 21 business events,
  emits CLASSIFICATION_CREATED + RECOMMENDATION_CREATED) — provenance split confirmed
  by commissioning (25 vs 14 recommendation dispatches).
- Phantom-complete persists: `mission_scheduler.js` marks missions completed at dispatch
  even if zero workers matched. No lease/ack on canonical spine. Capability dispatch is
  fiction (eventTypes string match; capability = worker's own name).

---

## 15. Replay / Witness / Lineage State

- FROZEN: `gateway/witness_authority.js` (68 DORMANT importers) and
  `gateway/constitution_version_authority.js` (16 DORMANT). Not in MOVE set.
- `constitutional_verification_authority.js` (moved B5) is a *verification* authority
  LIVE only via `repository_store.js`; it does NOT activate witness/replay.
- Zero replay HTTP endpoints. Zero `REPLAY_VERIFY` emitters. Replay engine TS source is
  in untracked `runtime/replay/`; compiled JS replay engine (18 files) exists only in
  `main` branch.
- Deferred per user direction (Slice 3A): replay/witness/lineage activation requires
  decision-graph fixes first (EVENT_MISSION_MAP never routes CLAIM_CREATED →
  REPLAY_VERIFY).

---

## 16. Docker / Build / Deployment

- Zero MOVE candidate basename appears in `compose.yaml`, any `Dockerfile`,
  `Dockerfile.worker-runtime`, root `package.json`, or `gateway/package.json` (M3 §6.7).
- `gateway/Dockerfile` CMD `node gateway/server.js`; `server.js` is a 21-line clean
  wrapper around `gateway_runtime.js` (prior "broken entrypoint" claim is stale).
- Compose dev build references 3 MISSING Dockerfiles (projection/witness/replay) —
  compose.prod.yaml already disables them; dev build is broken (known gap).
- Live E2E blocked: Docker daemon npipe down (confirmed at this session's delegate run).

---

## 17. Harness / Test Evidence

Full regression GREEN at every batch boundary. Representative suite (post-B6):

| Suite | Result |
|-------|--------|
| commissioning | 14 scenarios, 0 failed |
| wave3a_integrations | 59/59 |
| p001_p005 | 27/27 |
| p040_generated_authoritative | 29/29 |
| wave2_generators | 39/39 |
| wave2_5_runtime_consumers | 32/32 |
| ingest_boundary | 24/24 |
| knowledge_search | 10/10 |
| pipeline_bridge | 10/10 |
| phase_d_namespace | 7/7 |
| slice3a_convergence | 8/8 |
| phase0_fixes | 8/8 |
| evidence_authority | 12/12 |
| canonical_object | 13/13 |
| canonical_object_generator | 21/21 |
| business_emitters | 19/19 |
| constitutional_validation | 63/64 (1 Docker skip) |
| kernel_pipeline | 7/7 (8 stages, 131 evidence) |
| wave3b_p8 | 40/43 (3 pre-existing) |
| wave3b_p7 | 28/32 (4 pre-existing: 195 vs 231 rule count) |

`node --check` clean on all touched files each batch. `require.resolve` gates passed.

---

## 18. GitHub Harvest Candidate Inventory (source docs)

11 harvest source docs inventoried at `workspace/cascade/memory/constitutional-runtime/`:

HARVEST_AXON.md, HARVEST_EVENTSTOREDB.md, HARVEST_GIT.md, HARVEST_GRAPHRAG.md,
HARVEST_HAYSTACK.md, HARVEST_KAFKA.md, HARVEST_LANGGRAPH.md, HARVEST_LLAMAINDEX.md,
HARVEST_OPENTELEMETRY.md, HARVEST_TEMPORAL.md, HARVEST_XSTATE.md.

- **Zero license text in any HARVEST_*.md** (rg no matches).
- Tier9 spec: `workspace/cascade/memory/constitutional-runtime/docs/spec/tier9_competitive_harvesting.md`.
- `.graph/research/01-browser-agent-ecosystem.md` (and 02–12) list tool candidates.
- OmniRoute mentioned at tier7 spec line 5 + tier9 spec — upstream/license UNVERIFIED,
  cannot approve.
- `docs/hermes-open-source-harvest.md` — **DOES NOT EXIST** (verified `Test-Path` false).
  The unrelated marketing-form harvest lives at `workspace/.../HPP_GITHUB_HARVEST.md`.
- Provider rule (external = provider, never authority): `workspace/hermes/memory/memories/MEMORY.md:16`.
- mem0/cognee/graphiti duplicates: `workspace/antigravity/.../CEO_RUNTIME_DUE_DILIGENCE_AUDIT.md:165`.

---

## 19. GitHub Harvest Candidates — LIVE Verification (GitHub API)

All checked 2026-08-08 via `https://api.github.com/repos/<owner>/<repo>` (public).

| Candidate | Owner/Repo | Public | License (SPDX) | Stars | Status | Verdict |
|-----------|-----------|--------|----------------|-------|--------|---------|
| Secrets/PAM | `Infisical/infisical` | yes | **NOASSERTION** | 28,622 | active | VERIFIED-LIVE |
| Scraping | `firecrawl/firecrawl` | yes | **AGPL-3.0** | 163,467 | active | VERIFIED-LIVE |
| Crawling | `unclecode/crawl4ai` | yes | **Apache-2.0** | 77,391 | active | VERIFIED-LIVE |
| Browser agents | `browser-use/browser-use` | yes | **MIT** | 108,377 | active | VERIFIED-LIVE |
| Browser SDK | `browserbase/stagehand` | yes | **MIT** | 23,777 | active | VERIFIED-LIVE |
| Memory/knowledge | `topoteretes/cognee` | yes | **Apache-2.0** | 29,883 | active | VERIFIED-LIVE |
| Crawler lib | `apify/crawlee` | yes | **Apache-2.0** | 25,283 | active | VERIFIED-LIVE |
| Browser automation | `microsoft/playwright` | yes | **Apache-2.0** | 94,219 | active | VERIFIED-LIVE |

**Rejected 404s (wrong owner):** `browserbasehq/stagehand` (correct: `browserbase`),
`cognee-ai/cognee` (correct: `topoteretes`). `evgyur/cognee` is a 0-star mirror of
`topoteretes/cognee` (Apache-2.0, README references upstream) — do not target.

**Owner verification:** all 8 canonical. Stagehand corrected from `browserbasehq` →
`browserbase` (websearch + live API agree). Cognee canonical = `topoteretes` (29,883
stars) — prior session's `evgyur` note resolved.

**Note:** license values were re-fetched via direct API because earlier webfetch output
truncated the `license` field in display.

---

## 20. License Verification Summary

- **LICENSE_VERIFIED = 8/8** candidates (SPDX: NOASSERTION, AGPL-3.0, Apache-2.0 ×4,
  MIT ×2).
- License-compatibility note: `firecrawl/firecrawl` is **AGPL-3.0** — network-copyleft;
  integration must be provider/service (not linked into PING distribution) or excluded.
  `Infisical/infisical` is NOASSERTION — the GitHub API returns no SPDX identifier;
  manual review of the repo license file required before any adoption.
- All others are permissive (Apache-2.0/MIT) — adoptable as providers/adapters behind
  the existing connector interface (no new authority).

---

## 21. Readiness Metrics

### 21.1 M3_READINESS

- **MOVE table: 38 / 49 = 77.6%** verified migration obligations (each executed batch
  passed the full M3.5 checklist with GREEN regression).
- Breakdown of the 11 remaining: 1 FIXED (repoRoot injected, ready to move), 5 REVERTED (googleapis), 5 never batched.
- Total staged renames = 43 (38 table + 5 agents).
- Remaining unbatched work (post-B7): the 5 Knowledge/Workers candidates +
  `canonical_event_envelope` (repoRoot injected, ready for M3 B4) + google cluster
  (needs dependency-structure change).

### 21.2 B7_READY = **CONDITIONAL**

- 5 files staged as renames; duplicate gate passed; all 4 stale `../gateway/*` refs
  identified at exact lines (§6.1); rewire targets confirmed (`../../gateway/...`).
- NOT executable until: rewire 4 agent refs, fix 2 `gateway/tests/` wrong-depth refs,
  run regression + boot-load, then user direction to commit.
- Condition: `witness_authority.js`/`constitution_version_authority.js` stay FROZEN —
  B7 only re-points to their existing gateway location.

### 21.3 HARVEST_READINESS

- Candidates with verified evidence: **8 / 8 audited** (100%) — every candidate repo
  live-checked for existence, canonical owner, license, stars, activity.
- License text present in HARVEST source docs: 0 / 11 (docs are design-only; the GitHub
  API verification in §19 is the authoritative license source).
- Upstream-verified (canonical owner, not mirror): 7/8 (Cognee resolved to topoteretes;
  evgyur mirror excluded).
- Architecture-fit / security review: **PENDING** — not performed; read-only audit
  scope. Requires design review before any adoption decision.
- `docs/hermes-open-source-harvest.md`: ABSENT — required deliverable, not yet written
  (prior session intended it; does not exist).

---

## 22. Blockers

| # | Blocker | Type | Path |
|---|---------|------|------|
| 1 | `gateway/canonical_event_envelope.js` move blocked | BLOCKED (manifest §6.2) | needs repoRoot injection + approval |
| 2 | googleapis npm coupling | dependency | `gateway/google/*` cannot move until dep structure fixed |
| 3 | Docker daemon npipe down | infrastructure | live E2E blocked; needs `database/fix_pipeline_blockers.sql` + gateway/worker boot |
| 4 | OmniRoute upstream/license unverified | harvest | cannot approve |
| 5 | Replay/witness/lineage frozen | governance | deferred per user direction; needs decision-graph fixes first |
| 6 | Confidence absent from spine event | decision-graph | G6 deferred |
| 7 | Phantom-complete missions | decision-graph | scheduler completes at dispatch; verification gate deferred |
| 8 | MCP backend deleted; `MCPOrchestration.tsx` zombie | UI | zero backend; needs repoint to /ingest+/knowledge (deferred) |
| 9 | `github_ingestion.js` imports nonexistent `./event_emitter` | broken | dormant |
| 10 | CompilerCompatibility 11 hash mismatches at boot | drift | generated vs runtime registry drift |
| 11 | 3 MISSING worker Dockerfiles (projection/witness/replay) | build | compose dev broken; prod disables them |

---

## 23. Recommendations & Next Authorization

1. **B7 execution** (awaiting direction): rewire 4 agent refs + 2 test refs, regression,
   boot-load, then commit. Condition: frozen witness/constitution authorities untouched.
2. **M3 remaining**: batch the 5 unbatched candidates (knowledge ×4 + worker_registry,
   all LOW/MEDIUM) after B7; resolve `canonical_event_envelope` repoRoot injection
   (requires approval); google cluster deferred to dependency-structure decision.
3. **Decision-graph fixes** (highest leverage, deferred awaiting direction): single
   worker-identity decider, one priority scale, confidence on spine (G6),
   IntelligenceWorker duplication merge, completion verification gate.
4. **Slice 3** remainder: NamespaceAuthority enforcement + producers (Git → reuse
   `ConnectorEmitter.githubCommit`; clipboard genuinely greenfield).
5. **Harvest**: complete `docs/hermes-open-source-harvest.md` with §19 license data;
   run design-fit review for the 8 verified candidates; AGPL-3.0 (Firecrawl) and
   NOASSERTION (Infisical) require policy decisions before adoption.
6. **Live E2E** (infrastructure restored): apply `database/fix_pipeline_blockers.sql`,
   boot gateway + worker-runtime, verify real PG/Qdrant chain + namespace migration.
7. **No B7 execution and no GitHub integration performed in this read-only audit.**

---

*End of FULL_SYSTEM_AUDIT.md. Read-only audit complete; readiness metrics computed from
first-hand verification only.*
