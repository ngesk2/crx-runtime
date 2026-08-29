# Execution/Evidence Ledger — Live Spine Validation

**Status:** CANONICAL HANDOFF SOURCE
**Branch:** `constitutional-convergence-v2` @ `828520ea` (no commits made during this window)
**Date of evidence window:** 2026-08-27 (UTC timestamps in events)
**Scope:** Real-runtime validation of the PING production live spine. Empirical evidence only.

---

## 0. Canonical Truth Index

Future agents SHOULD read this ledger as the single source for what is real on the live
production path. Do not scatter competing explanations across AGENTS.md, ad-hoc notes, or
reports. The following are true as of this window:

| Concern | Canonical truth | Source |
|---------|----------------|--------|
| Durable event history | `ping_events` table (Postgres) | live queries |
| Current-process replay metrics | `KernelReplayExecutionProvider.getStats()` (in-memory) | live `/mc/replay/stats` |
| Historical replay/witness metrics | event-derived projections over `ping_events` | live `/mc/replay/stats`, `/mc/witness/stats` |
| Witness authority itself | pure `createWitness` hashing function, NO counters | source + live |
| Live event persistence winner | `unified_event_runtime` + bridge path | live + source |
| `event_outbox` | **P0-2 recommendation B — DEPRECATE** | corroborated by real traffic (0 rows) |
| Production event entry point | `POST /ingest` → CanonicalizationService → UnifiedEventRuntime | live |
| Production bootstrap | `node gateway/server.js` → `GatewayRuntime` → `gateway_runtime.js` (single process) | live |

**Three evidence classes used throughout:**
- **[EMPR]** = Empirically proven live behavior (observed HTTP/DB/log output during the window)
- **[STAT]** = Static/source-proven architecture (code + import graph, documented line refs)
- **[INFE]** = Inference or remaining unverified behavior (clearly labeled, not claimed as fact)

---

## 1. Evidence Window & Environment

- **Window:** 2026-08-27, events with timestamps ~21:50–22:01 UTC.
- **Docker availability:** **Docker daemon WAS available during the actual execution window**
  and all live evidence below was captured before it failed. The daemon went down **after** the
  evidence window (npipe `dockerDesktopLinuxEngine` unavailable); this does NOT invalidate the
  captured evidence. **[EMPR]**
- **Containers:** `ping-gateway` (single node process, `node gateway/server.js`, port 8080),
  `ping-postgres` (Postgres, `ping_runtime` DB). `ping-qdrant` was `Created`/never-running
  (external-dependency limitation). **[EMPR]**
- **Gateway state during window:** non-degraded; PG connected; 8 canonical workers registered;
  MissionScheduler poll 5s maxConcurrent=3; EventToMissionBridge listening; EventBridge poll clean.

## 2. Real Production Event Entry Point

Boundary proven: `POST /ingest` → `gateway/routes/ingest.js` → `canonicalization_service.js`
→ `unified_event_runtime.js`. Three REAL events driven through it (NOT mocks, NOT direct DB
inserts — each produced a 201 from the HTTP boundary). **[EMPR]**

| # | eventId | objectId | canonicalHash | HTTP |
|---|---------|----------|---------------|------|
| 1 | `acf63665c277e08da86fdbab19cbc2ca57d93fcd590f08464ac7c9350393b54c` | `REVIEW_RECEIVED_823adad25af9aa17` | `823adad25af9aa17612340c0aebb48cb27fa464c011633d1cfb403c4d87e2c4a` | 201 |
| 2 | `2da5e50cc7b04ae53cf4409d99bdbbde22f244feabbfbbaa0a6280569381009b` | `REVIEW_RECEIVED_ae76f6dab917f157` | `ae76f6dab917f157b47b34706aae13e61eb730ea87b9a20a30bb163307d8bfa3` | 201 |
| 3 | `39fe52fa1abc1cab7aac2afd23bb0088b98e7d0c5eb332097a4e663519dfdc64` | `REVIEW_RECEIVED_58968fe65fdb2463` | `58968fe65fdb2463aabaccaa7edbbfded2104fe8d9cbce87c18d1c7d5e3b8fcd` | 201 |

All: `source=customer`, `eventType=REVIEW_RECEIVED`, `namespace=tenant::hpp`, `confidence=0.5`.

## 3. Full Live Causal Chain (event 3, current process)

9 events, correct causal tree — each downstream `causation_id` = previous event's `event_id`;
single root `correlation_id = 39fe52fa1abc…`; `namespace=tenant::hpp` preserved at every hop.
**[EMPR]** (verified via direct Postgres query by correlation_id)

```
REVIEW_RECEIVED → OBSERVATION_CREATED → CLAIM_CREATED → CLASSIFICATION_CREATED
→ RECOMMENDATION_CREATED → PROJECTION_CREATED → REPLAY_COMPLETED
→ WITNESS_CREATED → LINEAGE_CREATED
```

| hop | event_type | event_id (8) | causation_id (8) | correlation_id (8) | namespace |
|-----|-----------|--------------|------------------|--------------------|-----------|
| 0 | REVIEW_RECEIVED | 39fe52fa | (root) | 39fe52fa | tenant::hpp |
| 1 | OBSERVATION_CREATED | f16402c0 | 39fe52fa | 39fe52fa | tenant::hpp |
| 2 | CLAIM_CREATED | 37a8fd25 | f16402c0 | 39fe52fa | tenant::hpp |
| 3 | CLASSIFICATION_CREATED | df3e0dab | 37a8fd25 | 39fe52fa | tenant::hpp |
| 4 | RECOMMENDATION_CREATED | cb424e03 | df3e0dab | 39fe52fa | tenant::hpp |
| 5 | PROJECTION_CREATED | ad1b2574 | cb424e03 | 39fe52fa | tenant::hpp |
| 6 | REPLAY_COMPLETED | e0f88db9 | ad1b2574 | 39fe52fa | tenant::hpp |
| 7 | WITNESS_CREATED | f4da9034 | e0f88db9 | 39fe52fa | tenant::hpp |
| 8 | LINEAGE_CREATED | f87c7d0a | f4da9034 | 39fe52fa | tenant::hpp |

## 4. Durable ping_events Growth

`ping_events` grew monotonically across the live events: **1050 → 1091 (+41) → 1132 (+41)
→ 1173 (+41)**. Each `REVIEW_RECEIVED` event produced 1 ingest event + ~32 MISSION_* lifecycle
events + 8 worker-chain output events. **[EMPR]**

## 5. Replay Provider: Current-Process Counters vs Durable Historical Projections

This was the key investigation. Resolution — **[EMPR] + [STAT]**:

**The provider counter logic is CORRECT and the observability IS live.** The earlier
"provider counter 0 despite kernel_verified" was the **historical-versus-current-process**
semantics, confirmed:

- `KernelReplayExecutionProvider` is a single in-memory instance shared by the ReplayWorker
  and `services.replayProvider` (constructed once at `gateway_runtime.js:502`, passed to
  `registerCanonicalWorkers` :509 → ReplayWorker `options.replayProvider`, AND to `services`
  :655 read by `/mc/replay/stats`). `canonical_workers.js` does **not** construct its own
  provider (no require of the provider module — only comment/string references). **[STAT]**
- A container diagnostic log proved the shared object executed: `[REPLAY-DIAG] executeReplay
  CALLED replays=1 caller=at ReplayWorker.handle (canonical_workers.js:287)`. (Diagnostic
  removed after evidence; original provider restored.) **[EMPR]**
- After a gateway restart (counter reset to 0), driving a fresh event produced
  `replays_processed: 0 → 1`, `events_replayed: 0 → 1`, and the DB chronologically reflects
  the fresh `kernel_verified`. The pre-restart `kernel_verified` events are durable historical
  recordings NOT attributed to the current process's in-memory counter. **[EMPR]**

**Field semantics (canonical):**
- `total_replays` / `verified` / `unverified` / `by_reason` = event-derived from `ping_events`
  (durable, historical). **[EMPR]**
- `provider.{replays_processed, events_replayed, failures}` = `KernelReplayExecutionProvider
  .getStats()` (in-memory, current process only). **[EMPR]**

## 6. Real Witness (event-derived, separate object)

Witness authority is a pure `createWitness` hashing function with NO runtime counters; the
honest status surface is the emitted attestation stream. **[STAT]** Live:
`/mc/witness/stats` attestations **31→32→33→34**, refusals **0**, total following the live chain.
Trace for event 3 returned a real attestation `witness-e0f88db9…`. **[EMPR]**

## 7. Real Trace / Kernel Verification Evidence

`/mc/replay/trace/39fe52fa…` returned `groupSize: 9` with:
`reason: kernel_verified`, `verified: true`, `violations: []`,
`fingerprint: sha256:a753084a79d0…`, `witness_root: da24c4a6c6a4…`,
`canonical_input_hash: replay-37abde1f6ce5`,
`deterministic_execution_identity: sha256:a753084a…`,
provider `KernelReplayExecutionProvider`. These fields only originate from the deterministic
kernel engine inside `executeReplay`. **[EMPR]**

## 8. P0-2 Corroboration by Real Traffic (B — DEPRECATE)

Throughout the live window, `event_outbox` = **0 rows** and `mission_events` = **0 rows**, while
the live winner (ping_events + EventToMissionBridge/EventBridge) handled all traffic. Real
traffic **strengthens** the frozen P0-2 decision B (DEPRECATE). **[EMPR]**

## 9. /health Degradation Classification

`/health` returned **503** with `status: unhealthy`, degraded **only** on:
- `qdrant: {status: "error", error: "fetch failed"}` — `ping-qdrant` container never running. **[EMPR]**
- `embedding: {status: "not_initialized"}` — dependent on Qdrant path. **[EMPR]**

All other components healthy: gateway, generated_artifacts (5), integrations (3 healthy),
event_governance (33 passed/0 rejected), event_runtime (33 emitted/33 persisted/0 dedup/12
dispatched/0 failed), canonicalization. This is the **known external-dependency limitation,
NOT a live-spine failure**. No code was changed merely to force health green. `[EMPR] + [STAT]`

## 10. ping_bridge_cursors Observation (stated narrowly)

`ping_bridge_cursors` = **0 rows** throughout the window while the EventToMissionBridge clearly
covered delivery (the 9-event chain executed with no cursor rows). **[EMPR]**

Why is stated narrowly: cursor rows are only written on the bridge's own poll→re-delivery path.
That the EventToMissionBridge covered delivery without writing cursors is consistent with the
dedup/`ON CONFLICT` ingestion path, but the exact mechanism is **[INFE]** unless source/runtime
evidence proves otherwise. Do not overclaim why cursor rows stay 0.

## 11. Failure Classification (single known discrepancy, resolved)

| Item | Class | Verdict |
|------|-------|---------|
| Provider counter 0 vs durable kernel_verified | [EMPR]+[STAT] | RESOLVED — historical vs current-process semantics (see §5) |
| `/health` 503 | [EMPR] | EXTERNAL DEPENDENCY (Qdrant/embedding), not live-spine |
| `ping-qdrant` never running | [EMPR] | EXTERNAL DEPENDENCY limitation |
| Event outbox / mission_events empty | [EMPR] | BY DESIGN — P0-2 B, validated by real traffic |

## 12. Handoff Directives

1. Future live-spine testing uses `POST /ingest` (real HTTP) → real PG → real worker →
   real mission-control endpoint → causal/semantic verification. No mock substitution.
2. When the daemon returns AFTER this window, the in-memory provider counter resets; DO NOT
   treat a 0 as a defect — re-drive a fresh event and verify it increments.
3. Do not reopen P0-1 (complete/frozen).
4. Do not implement P3 during the audit pass; produce the contradiction/convergence ledger first.

## 13. S4 Atomic-Claim Race Proof + Full initialize() Live E2E (2026-08-28)

**Objective:** close the last TIER-3 gap in `LIVE_ARROW_AUDIT.md` (S4 = atomic-claim
race) against **real Postgres**, and re-prove the full `initialize()` path + singleton
identity on the live spine after the S4 proof.

### 13.1 S4 Atomic-Claim Race Proof [EMPR]

- **Method:** the ACTUAL production `MissionRuntime` class
  (`ping-runtime/orchestration/mission_runtime.js`) against real live
  ping-postgres (host `127.0.0.1:5433`, `postgres/postgres`, `ping_runtime`).
  20 concurrent setters per round, each with an **independent `pg` Pool + its own
  `MissionRuntime` instance** (independent connections → genuine row-lock
  contention), all racing `getPending()`→`assign()` on the SAME `created` mission.
  10 rounds. Script: `C:\Users\nolan\AppData\Local\Temp\opencode\s4_race_proof.js`.
- **Result:** **exactly 1 winner every round (10/10 PASS), 0 double-claims, 0
  unexpected rowCounts.** Final state always `assigned/<single racer>`.
- **Why atomic:** `MissionRuntime.assign()` (mission_runtime.js:106-121) is a single
  conditional `UPDATE ... WHERE mission_id=$2 AND status='created'`. Postgres takes a
  row lock on the target row; a concurrent second UPDATE blocks until the first
  commits, then re-evaluates `WHERE` → status is now `'assigned'` → matches 0 rows →
  `rowCount 0` → claim rejected. `getPending()` (no SKIP LOCKED) may return the same
  mission to multiple claimers, but the conditional UPDATE makes the claim itself
  mutually exclusive.
- **Verdict:** S4 atomic-claim race **PROVEN**. S4 upgraded TIER-3 → TIER-2
  LIVE-WIRED. No TIER-3 arrows remain in `LIVE_ARROW_AUDIT.md`.

### 13.2 Full initialize() / Live Spine E2E Re-validation (event 4b) [EMPR]

- **Baseline** before ingest: `ping_events` = **1214**; replay provider
  `replays_processed:1, events_replayed:1, failures:0`; durable `total_replays:35`,
  `kernel_verified:4`.
- **Live POST /ingest** `REVIEW_RECEIVED` (source `s4-live-e2e`, namespace
  `tenant::hpp`): HTTP 200, `eventId 1b33ccc77be5…`, canonicalized.
- **After (35s, scheduler poll):** `ping_events` = **1255 (+41)** — exact ledger
  `+41/event` figure. Durable `total_replays:36`, `kernel_verified:5` (one new).
  Provider counters `replays_processed:2, events_replayed:2, failures:0` — the
  single live `/ingest` incremented the **singleton** provider exactly once
  (problems-proof of singleton identity, no second replay).
- **Scheduler:** dispatched 8→16, completed 8→16, failed 0; `skipped:31` (history +
  S4_RACE missions with no matching worker — tracked, never phantom-completed).
- **Full 9-event causal chain** (same correlation_id `1b33ccc77be5…`, namespace
  `tenant::hpp` at every hop, each causation_id = prev event_id):
  REVIEW_RECEIVED→OBSERVATION_CREATED→CLAIM_CREATED→CLASSIFICATION_CREATED→
  RECOMMENDATION_CREATED→PROJECTION_CREATED→REPLAY_COMPLETED→WITNESS_CREATED→
  LINEAGE_CREATED.
- **Dedup integrity:** exactly **1 of each** of the 9 event types in the chain — zero
  duplicate events.
- **Replay authority evidence block complete:** provider
  `KernelReplayExecutionProvider`, authority `ReplayWorker`, `verified:true`,
  `reason:kernel_verified`, `violations:[]`, `violation_count:0`, real `fingerprint
  sha256:3c5cce50…`, `witness_root 73a74073…`, `artifact_count:1`,
  `canonical_input_hash replay-77c1a1e7…`, `deterministic_execution_identity`.
- **Witness attestation** `WITNESS_CREATED` linked (witness event `0bc6e555…`); refusals 0.
- Trace `/mc/replay/trace/<corr>`: `groupSize:9`, full replay block + witness array.
- **Duplication-of-initialization:** gateway boot is single-initialize by design;
  the +41/+1-provider-increment evidence confirms no duplicate mission/worker/provider
  initialization for one canonical event.

**Verdict:** Step 2 of the convergence program **COMPLETE and PASSED**. Both S4
(atomic-claim race) and the full `initialize()` live E2E are empirically proven
against the real runtime. [EMPR] throughout.

## 14. Step 4 — IntelligenceWorker Audit (2026-08-28) [STAT/INFE]

**Objective:** audit the long-flagged IntelligenceWorker "duplicate path + namespace
drop" against the current committed state (post Slice 3A-3 + P3 settled semantics).

### Verdict: NOT an active problem in current state. Comment-only doc-contract applied.

1. **Structurally dormant (no dual fan-out possible)** [STAT]: `registerCanonicalWorkers`
   registers intelligence with `eventTypes: []` (canonical_workers.js:721). The
   registration loop (`:724-738`) skips any worker with empty `eventTypes` (`:727`) and
   never registers it into WorkerRuntime. WorkerRuntime.dispatch requires
   `eventTypes.length > 0 && includes(eventType)` (worker_runtime.js:78), so
   intelligence processes ZERO live events. The historical "25 vs 14 recommendation
   dispatch" dual fan-out concern is NO LONGER REACHABLE — it was predicated on a broad
   eventTypes wiring that was never re-enabled.
2. **Namespace drop already fixed** [STAT]: the inline `BaseWorker._emit`
   (intelligence_worker.js:25-59) preserves `this._event?.namespace` (:30),
   correlation_id (:34-37), and confidence-per-P3 (:39-52). This is the Slice 3A-3
   fix landed in a prior committed session. Re-enablement would not leak the privacy
   boundary.
3. **Disposition documented** [INFE]: appended `[DOC-CONTRACT / KEEP-DORMANT]`
   annotation to the registration comment (canonical_workers.js:716-724) stating the
   exact re-enable conditions (Ollama wired AND explicit duplication ruling).

### No code change was warranted (senior-dev, smallest justified change).
- `node --check` clean on canonical_workers.js; commissioning 14 scenarios / 0 failed.
- do NOT wire IntelligenceWorker as-is; it intentionally shadows the canonical pair.

## 15. Step 5 — Orca Model Discovery Proof + KEEP-DISABLED Decision (2026-08-28) [EMPR]

**Objective:** prove Orca's model discovery works against the real ollama container
(discoverOllama=false was the noted reason /orchestration sees zero business traffic),
then decide whether to enable.

### Empirical proof (standalone script, %TEMP%, zero repo changes) [EMPR]
- Instantiated the ACTUAL production `ping-runtime/orchestration/execution/ollama_provider.js`
  `OllamaProvider` and called `discoverWorkers()` against live Ollama (localhost:11434).
- **Result: PASS — 4 workers discovered + registered:**
  - `ollama:qwen2.5-coder:14b` — code_audit, ctx 32768, replay:true, maxLoad 4
  - `ollama:qwen2.5-coder:7b`  — code_audit, ctx 32768, replay:true, maxLoad 4
  - `ollama:llama3:latest`    — general_purpose, ctx 4096, replay:false
  - `ollama:nomic-embed-text:latest` — general_purpose, ctx 4096, replay:false
- Mapping to capabilities/specialization/context/replay via `capability_registry.json`
  model_mappings is fully functional. `discoverOllama:false` is NOT hiding a broken
  implementation — it is an intentional gate and the implementation works end-to-end.

### Decision: KEEP-DISABLED (doc-contract applied, no wiring) [INFE]
- Orca is a PARALLEL execution authority, not the production spine. The live spine's
  single inference owner = AIRuntime + ping-runtime/ai/ollama_provider.js; the single
  worker-identity decider = WorkerRuntime.dispatch (P3 audit A).
- Enabling discoverOllama would register a second, unconsumed Ollama worker pool in the
  Orca fabric — observable but never routed to by production traffic — contradicting the
  settled single-owner convergence reality.
- Added `[DOC-CONTRACT / KEEP-DISABLED]` comment at gateway_runtime.js:325-337 recording
  the proof + rationale + re-enable condition (explicit Orca-vs-live-spine decision).
- `node --check` + boot-load gate PASS (no behavior change).
- Deferred: wiring Orca execution into the production path requires an explicit
  convergence decision; not part of this scoped Step.

## 16. Step 6 — canonical_event_envelope duplicate-path investigation RESOLVED (2026-08-28) [STAT]

**Question (from Mock 3 ledger):** "canonical_event_envelope duplicate at
gateway/replay/canonical_event_envelope.js uninvestigated" — were there conflicting
duplicate envelope implementations needing consolidation?

### First-hand import-graph evidence (require.resolve + full tracked *.js scan) [STAT]
Two files exist, serving DIFFERENT layers (NOT conflicting duplicates):
- **PRIMARY** `gateway/canonical_event_envelope.js` (11,542 bytes) — the LIVE spine event
  ACTHORITY. Imported ONLY by the DI composition surface: `gateway/bootstrap/gateway_runtime.js`
  + `gateway/bootstrap/wiring.js` (both `../canonical_event_envelope`) and by gateway-root
  tests (`test_constitutional_validation`, `test_p001_p005`, `test_canonical_envelope_time_authority`).
  Carries the repoRoot coupling — this was the B4-BLOCKED file, later UNBLOCKED by commit
  `15422985` "fix(runtime): inject repoRoot into CanonicalEventEnvelope to unblock M3 relocation".
- **KERNEL** `gateway/replay/kernel/canonical_event_envelope.js` (2,928 bytes) — compiled
  TypeScript pure validation class (no infra deps), used EXCLUSIVELY on the replay path:
  `gateway/kernel_replay_execution_provider.js` (the LIVE ReplayWorker backend) -> 
  `replay/kernel/replay_event_stream.js` + re-exported by `replay/kernel/index.js`.
  No gateway-root file resolves to it.

### Verdict [INFE]
- Layered separation, not conflicting duplicates. The primary is the spine event authority;
  the kernel one is replay-input envelope validation. No execution path imports both, neither
  is dead or shadowed, and they do not disagree on event schema semantics within the same layer.
- No consolidation warranted: the kernel file is already at its replay-family home
  (`replay/kernel/`), the primary's repoRoot coupling is already resolved (`15422985`).
- M3 B4 BLOCK disposal is complete: the file that was BLOCKED is now movable-or-frozen with
  the repoRoot injection in place; no further action needed for envelope consolidation.

### Side note
- The standalone analysis scripts live in %TEMP% (s6_scan.js / s6_scan2.js), zero repo code
  changes for this step. No commit needed from Step 6 alone (evidence only).

## 17. IntelligenceWorker Final Verdict � Consumer-Side Confirmation (2026-08-28) [STAT]

**Objective:** close the IntelligenceWorker KEEP-DORMANT verdict (section 14) with the
decisive consumer-side evidence: is there any LIVE consumer that needs content-grounded
(AI) classification the deterministic _categorize/_prioritize pair cannot provide?

### Three live consumers of CLASSIFICATION_CREATED / RECOMMENDATION_CREATED [STAT, first-hand]
1. `ping-runtime/orchestration/event_to_mission_bridge.js:61-62` � routes
   CLASSIFICATION_CREATED -> RECOMMENDATION_CREATE mission (priority 2) and
   RECOMMENDATION_CREATED -> PROJECTION_CREATE mission (priority 1).
2. `ping-runtime/embeddings/embedding_service.js:28` � `RECOMMENDATION_CREATED` in
   INDEXABLE_TYPES -> projected to Qdrant knowledge.
3. `gateway/bootstrap/gateway_runtime.js:594` � `RECOMMENDATION_CREATED` in the
   graph-projection indexable set.

### Critical finding: ZERO consumers read classification/recommendation CONTENT [STAT]
- None of the three consumers inspect `payload.category`, `payload.priority`, or
  `payload.aiAnalysis`. All three route/project by **event type only**.
- Repository-wide `rg` for `aiAnalysis|payload.category|\.category` across live
  ping-runtime + gateway returns ONLY unrelated `category` semantics (constitutional
  patterns/discovery, capability_registry, CodeRetrieval, law matrix). No code reads the
  ClassificationWorker/RecommendationWorker `category`/`aiAnalysis` payload fields.
- Conclusion: the deterministic `_categorize` static map (canonical_workers.js:585-597) +
  `_prioritize` fully satisfy every live consumer. The `rating <= 2` content heuristic is
  the only content-dependent signal, and it is sufficient for the structural routing that
  actually occurs.

### Final verdict: KEEP-DORMANT, confirmed [INFE]
- Wiring IntelligenceWorker as-is would emit the SAME CLASSIFICATION_CREATED +
  RECOMMENDATION_CREATED event types as the canonical chain (dual emit, one handler,
  bypassing the claim hop) -> double PROJECTION_CREATE / REPLAY_VERIFY / WITNESS_CREATE /
  LINEAGE_CREATE fan-out -> genuinely COMPETING authority, not mere duplication.
- There is NO live business requirement demanding AI classification: AI inference already
  flows as ENRICHMENT (non-competing) via `aiRuntime` consumed LIVE by EmbeddingService
  (knowledge projection, gateway_runtime.js:495, :516), not as a classification decider.
- Re-enable gate (unchanged, from section 14 + canonical_workers.js:716-724):
  Ollama wired for AI *classification* AND an explicit duplication ruling AND an
  enrichment-type event wiring (consume a DIFFERENT event type or feed INTO the chain,
  never emit the canonical pair's outputs). None currently satisfied.
- No code change warranted. `[DOC-CONTRACT / KEEP-DORMANT]` annotation at
  canonical_workers.js:716-724 already records this contract.

## 18. M3 Google Cluster + googleapis Audit RESOLVED: NO ACTIVE FAILURE, KEEP IN PLACE (2026-08-28) [EMPR/STAT]

**Objective:** audit the 7-file Google cluster + `googleapis` dependency resolution (the
M3 "google cluster deferred" item) � locate files, live-boot reachability, real import
graph, dependency resolution, configured-vs-present, failure class. NO broad dep changes.

### Ground truth: only 5 files actually require('googleapis') [STAT]
- Actual `require('googleapis')` exists ONLY in `gateway/google/{google_auth,
  business_profile, people_adapter, gmail_adapter, calendar_adapter}.js` (5 files).
- `ping-runtime/connectors/{google_connector,oauth_provider}.js` were in the `rg -l
  "googleapis"` list ONLY because they contain `https://www.googleapis.com/...` URL
  strings (OAuth scopes/token/revoke endpoints) � they do NOT import the npm package.
  Zero npm-package dependency in those 2.

### Dependency class: PASS [EMPR]
- `googleapis` declared `gateway/package.json:32` (`^173.0.0`), installed = 173.0.0.
- `require.resolve('googleapis', {paths:[gateway/google]})` -> resolves to
  `gateway/node_modules/googleapis/build/src/index.js`. All 5 gateway/google files resolve.

### Reachability class: LIVE [STAT]
- All 5 REQUIRED at gateway_runtime.js:55-61, constructed UNCONDITIONALLY at :237-249
  (labeled "no PG dependency"), wrapped into `GoogleConnector` (:243), registered in
  ConnectorRegistry (:255-259) with capabilities reviews/contacts/email/calendar/drive.
- Boot-load gate first-hand: `require('./gateway/bootstrap/gateway_runtime.js')` ->
  "GATEWAY RUNTIME LOADS OK".

### Config class: NO boot failure [STAT]
- `google_auth.js:16-19` lazy-reads credentials from `config.* || process.env.*` with a
  safe localhost redirect fallback; NO file/credential access at construction. Absent
  credentials -> adapters construct fine, only fail on actual authenticated calls.

### Architectural class: KEEP in gateway/google/ is CORRECT, not deferred [INFE]
- The B2 abort (documented session) occurred when the 5 files were MOVED to
  `ping-runtime/connectors/google/` -> `googleapis` unresolvable from there (only
  `gateway/node_modules` carries it; root/`ping-runtime` node_modules have no googleapis).
- Since gateway is the ONLY construction/consumption site of these adapters, and moving
  breaks dependency resolution with no functional benefit, keeping them at
  `gateway/google/` is the correct stable location. No move warranted; item resolved.

### Verdict [INFE]
- NO active failure of any class (dependency/reachability/config/architectural). Zero
  code changes, zero broad dependency changes made. M3 "google cluster deferred" CLOSED.

## 19. Canonicalization Families Audit RESOLVED: LAYERED, NOT DUPLICATE (2026-08-28) [STAT]

**Objective:** apply the Phase 6 layered-not-duplicate rule across the event-envelope,
worker-identity, priority, confidence, replay, and correlation families. Consolidate ONLY
if TWO reachable competing authorities exist for the SAME runtime decision. Verdict:
ALL SIX families collapse to a single canonical owner with layered facades / dormant
twins; ZERO live competing authorities warrant consolidation.

### A. Event-envelope family: single live owner + layered facades + dormant hand-builder [STAT]
- SINGLE LIVE OWNER: `ping-runtime/canonicalization/canonical_object.js` (`createCanonicalObject`).
- LAYERED (delegate, NOT duplicate):
  - `gateway/canonical_object_authority.js:26,60` requires+invokes `createCanonicalObject`.
  - `gateway/constitutional_object_factory.js:17,44` requires+invokes `createCanonicalObject`.
- LAYERED KERNEL TWIN (ledger �16): `gateway/replay/kernel/canonical_event_envelope.js` (replay-path validation only).
- LIVE SPINE AUTHORITY (ledger �16): `gateway/canonical_event_envelope.js` (DI: gateway_runtime/wiring).
- DORMANT hand-builder: `gateway/github_constitutional_objects.js` hand-constructs
  `constitutionalObject = {...}` shapes (lines 113/209/298/...), does NOT call
  createCanonicalObject. BUT reachable ONLY via `github_normalizer.js`
  -> `github_constitutional_pipeline.js` -> the 3 dormant harnesses
  (milestone2_verification_harness / multi_repository_harness / repository_reset_harness).
  Zero references from `gateway/bootstrap/` (verified). NOT a production competing owner.

### B. Correlation family: single origin owner + layered preservation + read consumers [STAT]
- ORIGIN OWNER: `unified_event_runtime.js:136` spine sets
  `correlation_id = options.correlation_id || eventId` (rooting event_id becomes the
  causal root).
- PRESERVATION (layered): `BaseWorker._emit` (canonical_workers.js:40-45,75) preserves
  root; `event_to_mission_bridge.js:121-129` threads it; `intelligence_worker.js:31-35`
  mirrors it (dormant worker).
- READ CONSUMERS (never re-invent semantics): `mission_scheduler.js:244,308`,
  `mission_runtime.js:344-390` (getTrace), `knowledge_graph.js:65-96` (stores col),
  `unified_event_runtime.js:322-333` (getCorrelationGroup). `ping-runtime/agents/*`
  use correlation_id as a distinct domain label (memory_id/runtime_id) on dormant emit
  paths � not a competing definition of the spine causal root.

### C. Worker-identity/priority/confidence/replay families (already resolved, re-affirmed) [STAT]
- Worker identity: ONE decider = WorkerRuntime.dispatch (eventTypes match, worker_runtime.js:78).
  MISSION_WORKER_MAP = labeling only. (P3 audit A)
- Priority: ONE scale int 0-3 via canonicalPriority (priority_boundary.js). (P3 audit B)
- Confidence: spine metadata.confidence carried verbatim, human-approval-only recompute. (P3 audit C)
- Replay: ReplayWorker -> KernelReplayExecutionProvider (single live engine); kernel
  twin = layered replay-validation. (ledger �16, replay convergence commit 852fee10)

### Verdict [INFE]
- NO two reachable competing authorities for the same runtime decision in any of the six
  families. All competitors are layered (delegate/twin) or dormant. No consolidation
  warranted. Canonicalization families audit COMPLETE.

## 20. Live E2E Deep-Verification (Docker UP, full initialize() path incl. services.replayProvider) (2026-08-28) [EMPR]

Docker UP: ping-gateway (2h), ollama (2h), ping-postgres healthy, brain-qdrant. Gateway
/health returns 503 (known degraded-async embedding/Qdrant � NOT a product failure).
POST /ingest is the canonical production boundary.

### A. Running container carries P0-1 code (replayProvider reachable in deployment) [EMPR]
- GET /mc/replay/stats BEFORE this E2E:
  `provider:{engine_version:v1, replays_processed:2, events_replayed:2, failures:0}`
  + durable `total_replays:36, verified:36, kernel_verified:5, witness_rejected:0`.
- The provider block presence proves the P0-1 observability + services.replayProvider
  singleton are live in the deployed runtime � full initialize() path incl.
  services.replayProvider is EMPIRICALLY reachable (not just boot-load static).

### B. Fresh live E2E through production boundary [EMPR]
- POST /ingest `REVIEW_RECEIVED` (source `sweep-verify`, namespace `tenant::hpp`) -> HTTP 201.
  eventId `2db71ceec34f...`, objectId `REVIEW_RECEIVED_746dff1b...`,
  canonicalHash `746dff1b...`, namespace `tenant::hpp`.
- GET /mc/replay/trace/2db71cee... -> groupSize 9 (full causal chain:
  REVIEW_RECEIVED->OBSERVATION->CLAIM->CLASSIFICATION->RECOMMENDATION->PROJECTION->
  REPLAY->WITNESS->LINEAGE).
- replays[0] REAL kernel replay (not stub):
  reason kernel_verified, verified:true, fingerprint sha256:dbcf1ab6...,
  witness_root b64da83ed1..., artifact_count:1, state_version:"1.0",
  deterministic_execution_identity = sha256:dbcf1ab6... (== fingerprint).
- authority block complete: authority ReplayWorker, provider
  KernelReplayExecutionProvider, namespace tenant::hpp (preserved), correlation_id
  preserved (2db71cee...), source_event_id 20661f7e..., violation_count 0,
  canonical_input_hash "replay-3dde97b3b0c3" (= deterministic replay-transcript
  identity, matches ledger �17 semantics; not a hash of the triggering event).
- witness[0] = WITNESS_CREATED d9dbe3dd... attestation "witness-e269b7358b685933".

### C. Counter semantics re-proven (process-lifetime vs durable-derived) [EMPR]
- AFTER this E2E: provider replays_processed 2->3, events_replayed 2->3, failures 0.
  Durable total_replays 36->37, kernel_verified 5->6, witness_rejected 0.
- Witness stats: attestations 37, refusals 0 (W7 gate produced zero refusals; all
  replays verified). Singleton provider identity: one ingest -> +1 provider exactly.

### Verdict
- Full initialize() path incl. services.replayProvider + fresh live 9-event chain with
  real kernel replay verification + witness attestation, namespace preserved end-to-end,
  all on real Postgres (durable). No regressions. /mc/scheduler/stats 404 = endpoint
  name mismatch, not product failure. LIVE_ARROW_AUDIT TIER-2 arrows re-confirmed live.

## 21. Repository History Bloat Inventory - PUSH BLOCKER CHARACTERIZATION (2026-08-28) [EMPR]

Deterministic enumeration of the repository's history bloat driving the long-standing
"push blocked by 129MB blob" constraint. Conducted on the MAIN repo object store
(C:\Users\nolan\PING/.git, ~1,814.7 MB total; largest pack pack-f0c58953... = 1,748.6 MB).
Method: `git rev-list --objects --all` + `git cat-file --batch-check` (Python 3.11), i.e.
blob reachability + real object sizes, NOT pack-delta guesses.

### A. Largest blobs reachable from --all (top 10) [EMPR]
```
221,945,344  crx-ui-next.tar
168,239,020  crx-ui-next-extracted/blobs/sha256/6859025b8a8f...
156,809,432  crx-ui-next-extracted/layer3/app/node_modules/@next/swc-linux-x64-musl/...
136,142,477  .tmp.driveupload/387785
135,864,320  CascadeProjects/infra/ui-next/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node
131,406,240  crx-ui-next-extracted/layer3/app/node_modules/@next/swc-linux-x64-gnu/...
103,311,167  .tmp.driveupload/241607
102,879,927  .tmp.driveupload/402423
 78,655,280  .tmp.driveupload/399614
 64,086,941  CascadeProjects/infra/ui-next/.next/cache/webpack/client-production/0.pack
```
Plus 30-35MB files: ping-runtime/orchestration/CrossReferenceMatrix.json (35.9MB),
SymbolRouter.json (32.6MB), more .next/cache/webpack packs, many more .tmp.driveupload.
Total reachable blob bytes: 3,248.2 MB (26,409 reachable blobs); on-disk store smaller
(~1.8GB) due to delta compression + midx dedup.

### B. Dominant bloat classes (all reachable: UI tarballs/extracted layers +
node_modules + .next webpack cache + .tmp.driveupload temp uploads + orchestration JSON) [EMPR]
1. UI build artifacts: crx-ui-next.tar + crx-ui-next-extracted/ + CascadeProjects/infra/ui-next/node_modules/ + .next/cache/webpack/*.  (hundreds of MB)
2. .tmp.driveupload/* temp files (187 blob objects) - committed-then-deleted drift chunks.

### C. What the ACTIVE branch (constitutional-convergence-v2 @ c7c6946c) ACTUALLY reaches [EMPR]
- rev-list --objects branch: CONTAINS next-swc.win32-x64-msvc.node (1) + .tmp.driveupload (187)
  + CrossReferenceMatrix.json (1).
- **CURRENT TIP TREE (/ls-tree -r c7c6946c): .tmp.driveupload = 0, next-swc = 0** (pure
  historical, committed-then-deleted; NOT in the live snapshot). CrossReferenceMatrix.json = 1
  (still tracked in current tree, 35.9MB, but zero live readers - ledger archive candidate).
- The 129MB "next-swc.win32-x64-msvc.node" blob is on the ACTIVE branch's HISTORY (not tip).

### D. Decision-relevant classification [INFE]
- **History bloat (blocks push, needs REWRITE - destructive, direction-gated):**
  .tmp.driveupload/* (187 blobs), next-swc.win32-x64-msvc.node (135.9MB), crx-ui-next.tar +
  extracted layers + .next/cache webpack + CascadeProjects node_modules. Remove via
  git-filter-repo/BFG + force-push. HARD RULE: no force ops / no history rewrite without
  explicit user direction. Also overlaps with the SECURITY_SWEEP history scrub (Qdrant/
  Google/Yahoo secrets in 1a7a30ef, 59795121, 3c4c2dcd, aaec592b, 77d830c9).
- **Live-tree dead weight (normal commit, NON-destructive):** CrossReferenceMatrix.json (35.9MB)
  + SymbolRouter.json (32.6MB) - tracked in current tree, zero live readers (CAPABILITY_LEDGER
  archive candidates). Removable via ordinary commit, no rewrite required.
- Remote tracking is sparse: origin only tracks main (6c4b5317), audit-hardening (defdede6),
  constitutional-trunk (ffc2b4d6). constitutional-convergence-v2 is local-only (never pushed).

### Verdict
- The push blocker is REAL for the active branch (history bloat present on branch-v2 path).
- Highest-confidence NON-destructive action = commit live-tree archive-blob removals
  (CrossReferenceMatrix.json/SymbolRouter.json family) as a normal commit.
- Full unblock requires the history rewrite (destructive) - awaiting explicit user direction.

## 22. Part 1 DONE - Live-Tree Archive-Blob Removal (CrossReferenceMatrix.json + SymbolRouter.json) (2026-08-28) [STAT]

Authorized non-destructive disposition of the two tracked archive-only orchestration JSON
blobs (CAPABILITY_LEDGER archive-candidate class; ledger 21 D section "live-tree dead
weight"). Audit-first verification completed first.

### Zero-reachable-reader audit (falsification-complete) [STAT]
- Filename references repo-wide (*.js/*.ts/*.py/*.md/*.json/etc.) resolve to ONLY:
  (a) the 2 tracked files themselves, (b) the ledger (this doc), (c) two descriptive
  RepositoryKnowledgeIndex/*.json metadata entries + one hermes historical audit note
  (all NON-functional text references).
- The ONLY code readers/writers = 4 DORMANT generation/analysis scripts
  (generate_symbol_router / generate_routing_cache / ConstitutionalQueryAPI /
  generate_cross_reference_matrix), all of which reference a HARDCODED ABSOLUTE PATH to a
  DIFFERENT root-level dir `c:\Users\nolan\PING\orchestration\SymbolRouter.json` (NOT the
  tracked `ping-runtime/orchestration/`). Even running those scripts would not touch the
  tracked files.
- ZERO importers of those 4 scripts repo-wide (ConstitutionalQueryAPI matches only its own
  class def + self-instantiation). The live `ping-runtime/orchestration/` imports from
  gateway_runtime.js (engine / mission_runtime / mission_scheduler / event_to_mission_bridge)
  are .js MODULE imports, never these JSON data blobs.
- No test, Dockerfile, compose, or other build/run file reads either JSON.

### Disposition (non-destructive commit) [STAT]
- Removed both tracked blobs from the live tree:
  - ping-runtime/orchestration/CrossReferenceMatrix.json (36,694,913 bytes = 35.9MB)
  - ping-runtime/orchestration/SymbolRouter.json (32,737,689 bytes = 32.6MB)
- Combined ~68.4MB of live-tree dead weight removed via `git rm` (ordinary commit, NO
  history rewrite). Reduces current-branch tree size + the pushed delta.

### Outcome
- Zero live readers -> zero behavior impact. Only the ledger (this doc) + this commit record
  the removal. History bloat (ledger 21) is NOT touched here - that remains the
  direction-gated destructive rewrite step.

## 23. B7 Agent Moves - Empirical Status Resolution (2026-08-28) [EMPR]

Resolves a stale-status contradiction between prior handoffs (one claimed the 5 B7 agent
moves were "already committed at a9d9aeee"; another claimed "5 staged renames, already
verified on disk, commit when directed"). Empirically inspected, not assumed.

### Empirical evidence [EMPR]
- `git diff --cached` = EMPTY -> zero staged changes. There is NO pending rename allowlist.
- Tracked files under `ping-runtime/agents/` = ALL 5 B7 files present:
  agent_memory_authority.js / base_worker.js / distributed_desktop_agents.js /
  replay_worker.js / worker_port.js.
- OLD paths absent from index (git ls-files --error-unmatch fails) for all 5:
  gateway/{agent_memory_authority,base_worker,distributed_desktop_agents,replay_worker,worker_port}.js
- Last commit touching each new path = `a9d9aeee "refactor(gateway): M3 migration -
  relocate gateway modules to ping-runtime families"` for all 5.
- `git merge-base --is-ancestor a9d9aeee HEAD` -> exit 0 (a9d9aeee IS in HEAD history).
- `git show --name-status a9d9aeee` shows 5 R rename records:
  gateway/agent_memory_authority.js -> ping-runtime/agents/ (R097),
  gateway/base_worker.js -> ping-runtime/agents/ (R100),
  gateway/distributed_desktop_agents.js -> ping-runtime/agents/ (R097),
  gateway/replay_worker.js -> ping-runtime/agents/ (R091),
  gateway/worker_port.js -> ping-runtime/agents/ (R100).

### Verdict
- **B7 is COMMITTED at a9d9aeee** and inherited by the current branch (HEAD). The "5 staged
  renames" claim was STALE. There is NO clean rename allowlist to commit. B7 is CLOSED.
- No commit fabricated for already-landed work. Working tree (incl. P0-1 hoist in
  gateway_runtime.js, docked event_queue DDL files, generated registries) intentionally left
  unstaged and untouched.
- Corrective note for future handoffs: stale summaries are NOT authoritative over fresh
  [EMPR] inspection. Point to THIS section + canonical sources before acting on B7.

## 24. Deep Verification - Single-construction replay provider + live-container parity (2026-08-28) [EMPR]/[STAT]

Live production-composition deep verification of `GatewayRuntime.initialize()` /
`services.replayProvider`: one construction site, one assignment, one observer, running
container carries the working-tree P0-1 code. Falsification-first: every alternative
hypothesis (second construction, replacement assignment, shadow provider, duplicate worker
runtime, divergent route observer) was tested and refuted.

### Static falsification scan [STAT] (whole production tree, excl. node_modules/dormant/archive/workspace)

- **Constructors of `KernelReplayExecutionProvider`** throughout all `*.js`:
  - `gateway/bootstrap/gateway_runtime.js:512` `replayProvider = new KernelReplayExecutionProvider();`
    -> THE single LIVE production construction site (P0-1 hoist).
  - `gateway/constitutional_runtime.js:45` `executionPort: new KernelReplayExecutionProvider()`
    -> SECOND construction, but reachable from EXACTLY ONE importer: `gateway/test_kernel_replay.js:422`
    (a test file). NOT on the live import graph. DORMANT/test-only. Falsified as a live competitor.
  - All other `new KernelReplayExecutionProvider()` sites are in `test_*.js` / `evals/` / the
    provider's own definition file. Zero production-reachable extras.
- `gateway/bootstrap/constitutional_runtime.js` (42-line class) is a DIFFERENT class built on
  `ConstitutionalExecutionPipeline`/`EventRepository`/`Dispatcher`/registries - it constructs NO
  kernel replay provider. Not a competing owner.
- **Assignments to `replayProvider`** in production: exactly ONE (`gateway_runtime.js:512`; declaration
  `let replayProvider = null` at :378, services exposure `replayProvider,` at :519 and :665). NO
  replacement reassignment anywhere in production. Falsified: no shadow provider, no second assignment.
- **Duplicate worker runtime**: `ping-runtime/workers/canonical_workers.js:713` registers exactly ONE
  ReplayWorker and injects `options.replayProvider` (single instance target). No second worker runtime
  constructs or consumes a provider.
- **Divergent route observer**: the only production HTTP reader is
  `gateway/routes/mission_control.js:510` `const provider = replayProvider ? replayProvider.getStats() : null;`
  where `replayProvider` is destructured from `services` (:17) - i.e. the SAME hoisted singleton.
  No other production route references a different provider instance.

### Live-container parity [EMPR]

- `docker inspect ping-gateway`: image `ping-gateway:latest`, created `2026-08-27T21:48:55Z`,
  started `2026-08-28T12:07:36Z` (up 9h at capture), restarts=0. Built from the working tree that
  carries the P0-1 hoist.
- Live probe `GET /mc/replay/stats` returns the `provider` block
  `{engine_version: v1, replays_processed: 3, events_replayed: 3, failures: 0}` - the P0-1
  observability feature. This is unobservable on pre-P0-1 containers, PROVING the running container
  carries the working-tree P0-1 code incl. `services.replayProvider` reachable at the full
  initialize() path (not just boot-load static).

### Restart-vs-durable projection semantics [EMPR]

- Current process: `provider.replays_processed = 3` (process-lifetime kernel-replay executions) vs
  durable event-derived `total_replays = 37`, of which `kernel_verified = 6` / `unknown = 31`,
  `witness_rejected = 0`. The delta (34) is historical replays from PRIOR process lifetimes - visible
  ONLY in the durable ping_events projection, not in the current provider's process-scoped counters.
- This confirms the documented distinction: provider counters are process-lifetime; durable replay
  metrics are event-derived. Both are surfaced together at `/mc/replay/stats` (provider block omitted
  when not injected - never fabricated).

### Boot-load + regression gates

- `require('./bootstrap/gateway_runtime')` -> `gateway_runtime LOADS OK`, `GatewayRuntime` type:
  `function`. P0-1 hoist present and functional.
- test_replay_composition 8/8, test_replay_worker_wiring 17/17, test_witness_negpath 8/8,
  test_replay_observability 8/8 - ALL PASS. Zero regressions.

### Verdict

- **Exactly ONE live replay provider construction, ONE assignment, ONE route observer, ONE worker
  injection target.** The second source-site (`gateway/constitutional_runtime.js:45`) is
  test-reachable-only and not on any live path. No consolidation warranted.
- Running ping-gateway container empirically matches the working-tree P0-1 code (provider block live).
- P0-1 hoist in `gateway/bootstrap/gateway_runtime.js` remains working-tree-only and UNSTAGED per the
  explicit-allowlist rule (not part of this commit).

## 25. Broad Single-Construction Falsification - All 12 Core Live Authorities (2026-08-28) [STAT]

Extends §24's replay-provider falsification to the ENTIRE core live authority set: for every
one of the 12 production authorities that back the canonical spine, there is EXACTLY ONE
construction site in the whole tree, located in `gateway/bootstrap/gateway_runtime.js`. No
reachable competing construction/ownership site exists for any of them.

### Authorities swept [STAT]

`UnifiedEventRuntime, MissionRuntime, MissionScheduler, WorkerRuntime, KnowledgeGraph,
HybridSearch, EvidenceAuthority, EmbeddingService, QdrantAdapter, AIRuntime,
CanonicalizationService, DeadLetterAuthority`.

### Method (falsification-first)

- `rg "new <Class>\("` across the WHOLE tree (excl. node_modules/archive/dormant_classifications/workspace).
- Classify every hit as production vs test/eval.
- Count production construction sites; count construction lines INSIDE `gateway_runtime.js`.

### Result - production construction sites per authority

| Authority | Production sites (non-test) | In gateway_runtime.js |
|-----------|------------------------------|------------------------|
| UnifiedEventRuntime | 1 | 1 |
| MissionRuntime | 1 | 1 |
| MissionScheduler | 1 | 1 |
| WorkerRuntime | 1 | 1 |
| KnowledgeGraph | 1 | 1 |
| HybridSearch | 1 | 1 |
| EvidenceAuthority | 1 | 1 |
| EmbeddingService | 1 | 1 |
| QdrantAdapter | 1 | 1 |
| AIRuntime | 1 | 1 |
| CanonicalizationService | 1 | 1 |
| DeadLetterAuthority | 1 | 1 |

For all 12, the ONE production construction site is `gateway/bootstrap/gateway_runtime.js`, and it is
a single construction line each. `KernelReplayExecutionProvider` (the 13th) is documented separately
in §24 (single live site + one test-only site at constitutional_runtime.js:45).

### Classification of non-production hits (all test/eval)

- `gateway/test_*.js` (unit/integration harnesses) and
  `evals/constitutional-runtime/EVAL-*.js` (eval scenarios: EVAL-001/002/003 UnifiedEventRuntime,
  EVAL-006 MissionRuntime, EVAL-007 WorkerRuntime, EVAL-008 KnowledgeGraph).
- NO build/bootstrap/wiring/server/routes file constructs any of these 12 except gateway_runtime.js.

### Verdict

- **Zero reachable competing construction sites** for all 12 core authorities. Each collapses to
  exactly one canonical owner, one wiring point (`gateway_runtime.js`), injected as a single
  services-object instance. This is the falsification-strong counterpart to §19's
  layered-not-duplicate family audit at the CONSTRUCTION level (not just type-level).
- No consolidation warranted for any of the 12. No shadow authorities, no duplicate worker runtime,
  no parallel service instance anywhere on the live path.

### Gates

- `require('./bootstrap/gateway_runtime')` -> `gateway_runtime LOADS OK`.
- Regression exit-0: pipeline_bridge, slice3a_convergence, phase_d_namespace, phase0_fixes,
  ingest_boundary, knowledge_search, confidence_convergence, trace_propagation, mission_trace,
  dead_letter_wiring (10 suites). Additionally §24's replay/witness suites already green.
- P0-1 hoist (`gateway/bootstrap/gateway_runtime.js`) remains working-tree-only and unstaged; NOT
  part of this commit.

## 26. Boundary/Authority Single-Construction Falsification - multi-site classes all resolve dormant (2026-08-28) [STAT]

Falsification sweep over the authority-bearing boundary classes (those carrying runtime decision
logic) beyond the 12 core authorities of the 25. Several have MULTIPLE `new X()` construction sites
in the tree; each non-`gateway_runtime` site was traced to reachability and ALL resolve to already-
documented dormant/kernel/layered categories. No reachable competing authority exists.

### Multi-site classes and resolution [STAT]

| Class | gateway_runtime (LIVE) | Other construction site(s) | Reachability of other site(s) |
|-------|------------------------|----------------------------|-------------------------------|
| EventGovernance | single | ping-runtime/orchestration/execution/event_queue.js | Orca fabric EventQueue, only imported by tests (`test_wave3b_p7`, `test_p040`) + a comment in event_generator.js:257. DORMANT (fabric 15). Not reachable from server.js. |
| OllamaProvider | single | ping-runtime/orchestration/execution/engine.js | Orca ExecutionEngine fabric, discoverOllama:false -> zero models, KEEP-DISABLED (ledger 15). DORMANT parallel fabric. |
| CanonicalEventEnvelope | single | gateway/bootstrap/wiring.js (non-production DI path per CAPABILITY_LEDGER method), gateway/kernel_replay_execution_provider.js (KERNEL twin envelope for replay validation, ledger 16) | Both DORMANT (non-prod entrypoint; kernel twin). Live spine uses the gateway envelope only. |
| RepositoryStore | single | gateway/authority_registry.js:265 (DEAD file), gateway/github_constitutional_pipeline.js (only imported by 3 dormant harnesses), gateway/replay_runtime.js (only imported by repository_reset_harness.js) | ALL DORMANT. `authority_registry.js` has ZERO importers (distinct from constitutional_bootstrap.js -> constitutional_authority_registry, a different file). |
| EventReadAuthority | single | runtime/kernel/gateway_adapter.js | Kernel twin, intentional (M3 B4 rule: kernel twins authoritative for dormant kernel). DORMANT. |
| KnowledgePromoter | built inside canonical_workers.js (single site) | - | Clean single owner. |
| CanonicalizationService / EventToMissionBridge / EventBridge / KnowledgeGraph | single each | - | Clean single owners. |

### Falsification method

- `rg "new <Class>\("` whole tree; classified production vs test/eval; for every multi-site class,
  traced each non-gateway_runtime site to its file's importers via grep and labeled reachable vs dormant.
- `gateway_runtime.js` construction enumeration (select-output of every `new X(`) confirmed exactly one
  line per service and the full production sync service graph (12 spine + registries + adapters + emitters).

### Verdict

- **No reachable competing construction site** for ANY authority-bearing boundary class. Every second
  construction collapses to: Orca fabric (disconnected, ledger 15), kernel twin (ledger 16),
  non-production DI (wiring.js), or dead/harness-only file (`authority_registry.js`, github pipeline,
  replay_runtime). Consistent with ledger 25 (12 core) and ledger 19 (families layered-not-duplicate).
- `authority_registry.js` is a DEAD file (zero importers) constructing a dormant RepositoryStore;
  `github_constitutional_pipeline.js` + `replay_runtime.js` are harness-only. All are archive-candidates,
  NOT live competitors.
- No consolidation warranted.

### Gates

- `require('./bootstrap/gateway_runtime')` -> `gateway_runtime LOADS OK`.
- Regression exit-0: replay_composition, replay_worker_wiring, replay_observability, pipeline_bridge,
  knowledge_search, ingest_boundary, wave3b_p7_governance (governance exercises EventGovernance). All green.
- P0-1 hoist (`gateway/bootstrap/gateway_runtime.js`) remains working-tree-only and unstaged; NOT part
  of this commit.

## 27. SearchAuthority / Evidence-Verification Authority Falsification - no reachable competing authority (2026-08-28) [STAT]

Falsification of the search / evidence-verification decision domain. Verify no two reachable competing
production authorities govern the same search/evidence decision.

### Candidate authority surfaces [STAT]

| Class | File | Construction site(s) | Live? |
|-------|------|----------------------|-------|
| HybridSearch | ping-runtime/search/hybrid_search.js | gateway_runtime.js:532 (single) | LIVE - sole composition point |
| EvidenceAuthority | ping-runtime/evidence/evidence_authority.js | gateway_runtime.js:527 (single) | LIVE - sole verification point |
| KnowledgeRetrieval | gateway/knowledge_retrieval.js | gateway/bootstrap/wiring.js:111 (only) | DORMANT (non-prod DI) |
| SearchAuthority | (no such class exists) | - | ABSENT |

### Evidence

- **Production entrypoint is `server.js`** [STAT]: package.json `main: server.js`, `scripts.start: node server.js`,
  Dockerfile CMD `["node","gateway/server.js"]`. server.js requires `GatewayRuntime` from
  `./bootstrap/gateway_runtime`. 
- **`bootstrap/index.js` is NOT on the live path** [STAT]: nothing imports `bootstrap/index`; its
  `wireContainer()` (which constructs KnowledgeRetrieval at wiring.js:111) is never invoked in
  production. On the live graph, `wiring.js` is used only for `buildDependencyGraph`/`validateWiring`
  (lifecycle.js:16, routes/constitution.js:20, runtime_hash.js:16) - NOT `wireContainer`. Consistent
  with CAPABILITY_LEDGER method (production = server.js -> gateway_runtime.js; wiring.js/index.js =
  non-production DI path).
- **`knowledge.activity.js` is dormant** [STAT]: reachable only via wiring.js:141 `activitiesPath`
  string + dormant `activities/index.js`; zero production importers.
- **EvidenceAuthority + HybridSearch single construction + single route observer** [STAT]:
  constructed once each (gateway_runtime.js:527, :532); added to services (:664); the ONLY route
  consuming them is `POST /knowledge/search` via `hybridSearch: services.hybridSearch` at
  gateway_runtime.js:797 -> routes/knowledge.js:22 (`options.hybridSearch`). HybridSearch composes
  EvidenceAuthority (verification is a sub-step), not competes with it.
- **Other `/search` surface is a different domain** [STAT]: routes/connectors.js:123 is
  `GET /:name/search` (connector search, not evidence retrieval); routes/customers.js:9 +
  routes/projects.js:8 are comments only. No route bypasses evidence verification on the live path.
- **No `SearchAuthority` class exists anywhere** [STAT] (class grep across all *.js: zero hits).

### Verdict

- **No active contradiction** in the search/evidence-verification decision domain. Exactly ONE live
  authority pair (HybridSearch + EvidenceAuthority), single construction, single route consumer, no
  path bypasses verification. The only second authority (KnowledgeRetrieval via bootstrap/index.js +
  activities) is on the non-production DI path, unreachable from `node server.js`. No consolidation
  warranted.
- Evidence is `[STAT]` (construction + reachability via source/config/entrypoint analysis). NOT promoted
  to `[EMPR]` - no fabricated E2E.

### Gates

- `require('./bootstrap/gateway_runtime')` -> `gateway_runtime LOADS OK`.
- Regression exit-0: knowledge_search (exercises HybridSearch+EvidenceAuthority end-to-end at unit
  level), evidence_authority 12/12, replay_composition, replay_worker_wiring, replay_observability,
  pipeline_bridge, ingest_boundary, wave3b_p7_governance.
- P0-1 hoist (`gateway/bootstrap/gateway_runtime.js`) remains working-tree-only and unstaged; NOT part
  of this commit.


## 28. Scheduler Falsification - no reachable competing production scheduler (2026-08-28) [STAT]

Falsification of the runtime-execution scheduler decision domain. Verify no two reachable competing
production schedulers govern "which scheduler dispatches missions/workers at runtime." Resume point of
the audit-first program (Hermes Desktop PHASE 0-1 completed in parallel).

### Scheduler classes and construction sites [STAT]

| Class | File | Construction site(s) | Live? |
|-------|------|----------------------|-------|
| MissionScheduler | ping-runtime/orchestration/mission_scheduler.js:82 | gateway_runtime.js:552 (single) + :560 start | **LIVE - sole production scheduler** |
| SchedulerPort | gateway/scheduler_port.js:26 | bootstrap/wiring.js:155-157 (inside wireContainer) | DORMANT (non-prod DI) |
| TemporalSchedulerProvider | gateway/temporal_scheduler_provider.js:27 | bootstrap/wiring.js:146-149 (inside wireContainer) | DORMANT (non-prod DI) |
| ReplayScheduler | gateway/replay_scheduler.js:3 | gateway/constitutional_execution_pipeline.js:7 (require) | STRANDED (pipeline unreachable) |
| DependencyScheduler | gateway/dependency_scheduler.js:21 | gateway/execution_planner.js:17 (require) | STRANDED (planner zero importers) |

### Evidence

- **MissionScheduler is the SINGLE live production scheduler** [STAT]: imported at gateway_runtime.js:74
  (require('../../ping-runtime/orchestration/mission_scheduler')); constructed exactly ONCE at :552
  (new MissionScheduler({...})); started :560 (missionScheduler.start()); hoisted to the services object
  at :660. This is the only scheduler in the production bootstrap import graph (node server.js ->
  bootstrap/gateway_runtime.js). Consistent with ledger 25 (MissionScheduler: 1 site / 1 live).
- **SchedulerPort + TemporalSchedulerProvider are non-production DI only** [STAT]: constructed solely
  inside wireContainer() (wiring.js:146-158). wireContainer is exported (wiring.js:256) but its only
  reachability is bootstrap/index.js, which has ZERO production importers (ledger 27). Production use of
  wiring.js is buildDependencyGraph/validateWiring ONLY (routes/constitution.js:20, runtime_hash.js:16) -
  rendering the SchedulerPort/TemporalSchedulerProvider registrations inert.
- **ReplayScheduler is stranded via the dormant kernel pipeline** [STAT]: gateway/replay_scheduler.js is
  required only by gateway/constitutional_execution_pipeline.js:7. That pipeline's only importer is
  gateway/constitutional_runtime.js:3, which is reachable ONLY from test_kernel_replay.js:422 (a test),
  NOT production. No production path constructs ReplayScheduler or invokes the kernel pipeline
  (registries empty - ledger 16/19).
- **DependencyScheduler is fully stranded** [STAT]: gateway/execution_planner.js:17 requires
  dependencyScheduler from dependency_scheduler.js. execution_planner.js has ZERO importers anywhere.
  constitutional_execution_planner (its sibling) is imported only by constitutional_automatic_pipeline.js:19,
  which itself has ZERO importers. No production path, no runtime reachability.
- **No other Scheduler-class constructors exist on the live path** [STAT]: tree-wide class-definition
  sweep (excl. node_modules/dormant_classifications/archive/tests) yields exactly the 5 classes above;
  only MissionScheduler is constructed from gateway_runtime.js.

### Verdict

- **No active contradiction** in the scheduler decision domain. EXACTLY ONE live production scheduler
  (MissionScheduler) - single construction, single start, single dispatch path (WorkerRuntime.dispatch,
  ledger 19/P3A). The four other scheduler classes collapse to either the non-production DI graph
  (SchedulerPort, TemporalSchedulerProvider behind wireContainer), the dormant kernel pipeline
  (ReplayScheduler behind a zero-producer reactor), or a zero-importer stranded planner
  (DependencyScheduler behind execution_planner). No two reachable schedulers compete for the same
  runtime decision. No consolidation warranted.
- Evidence is [STAT] (construction + reachability via source/config/entrypoint analysis). NOT promoted
  to [EMPR] - no fabricated E2E; the live single-scheduler dispatch is already exercised by
  commissioning (14 scenarios, 51 missions, 0 failed) + the 2026-08-21/28 real-runtime E2E traces.

### Gates

- require('./bootstrap/gateway_runtime') -> gateway_runtime LOADS OK (from gateway/ workdir).
- Regression exit-0: commissioning (14 scenarios / 51 missions / 0 failed - exercises MissionScheduler
  end-to-end), pipeline_bridge 10, phase_d_namespace 7, slice3a_convergence 8, knowledge_search 10,
  replay_composition 8, witness_negpath 8. Zero failures.
- P0-1 hoist (gateway/bootstrap/gateway_runtime.js) remains working-tree-only and unstaged; NOT part
  of this commit.

## 29. Event-Write Authority Falsification (no competing live write path)

**Question falsified**: do multiple live event-write authorities contend on the production spine?
Prior capability audit (CAPABILITY_LEDGER) listed EventWriteAuthority / EventRepository /
UnifiedEventRuntime as a "duplicate" family. This unit proves exactly ONE live writer.

**Findings (evidence-first)**:
- LIVE write spine = `UnifiedEventRuntime` (ping-runtime/events/unified_event_runtime.js:21).
  Constructed EXACTLY once at gateway_runtime.js:433; exposed as `services.eventRuntime` :448;
  registered as the write target for POST /events route :681
  `createEventRoutes(services.eventReadAuthority, services.unifiedEventRuntime, services.pool)`.
  POST /events handler (gateway/routes/events.js:71-86) writes via `eventRuntime.emit()`
  (convergence commit 31620edc). [EMPR] - proven by test_events_routes.js (8/8, incl. the
  convergence assertion "POST /events routes through eventRuntime.emit, not kernel pipeline").
- `EventWriteAuthority` (gateway/event_write_authority.js:25) = DEAD. ZERO production importers
  (rg for `require(...event_write_authority)` -> no files). Only code references are comments
  (events.js:5 comment, event_read_authority.js:11 comment). Consistent with
  EVENT_MUTATION_SCHEMA_RECONCILIATION_AUDIT.md:79 which records it dead.
- `EventRepository` (gateway/event_repository.js:15, extends KernelEventRepository) = STRANDED.
  Importers = runtime/kernel/gateway_adapter.js:19 (kernel twin) + gateway/bootstrap/
  constitutional_runtime.js:2 + gateway/constitutional_execution_pipeline.js:2, both proven
  dormant/stranded in section 28 (kernel path reachable only from test_kernel_replay.js). Not
  on the production write path.
- `EventReadAuthority` (ping-runtime/events/event_read_authority.js:20) = LIVE for READS ONLY
  (constructed gateway_runtime.js:382, injected into SystemAuthority + context/system routes).
  It is a read authority, never the writer. Not a competing write path.

**Verdict**: FALSIFIED. Exactly ONE live event-write authority on the production spine
(UnifiedEventRuntime). EventWriteAuthority = dead; EventRepository = stranded; EventReadAuthority
= read-only. No competing live write authority, no consolidation warranted.

**Class**: [STAT] static require/import/reachability + [EMPR] live POST /events convergence test.

**Gates**: gateway_runtime LOADS OK; UnifiedEventRuntime constructed exactly once; rg
EventWriteAuthority importer scan = zero; test_events_routes.js 8/8 PASS. No code change; no
consolidation edit (falsification-complete).

## 30. Dead-Letter / Retry / Worker-Failure Authority Boundary Falsification

**Questions the audit resolves**: (a) is there a SINGLE reachable production dead-letter (DLQ)
authority, or is there a split source of truth between the old gateway/dead_letter_authority.js
and a ping-runtime equivalent? (b) does any retry/worker-failure path fork into a second
reachable authority?

**RECONCILIATION of a documented contradiction**: the 08-08 Track A P0 audit recorded
gateway/dead_letter_authority.js / retry_authority.js / retry_policy.js as "unreachable from the
live import graph". The 08-20 "Mission Recovery + Dead-Letter Observability" session (commit
32c870e4) wired DeadLetterAuthority live. The CAPABILITY_LEDGER (08-27) marked it "LIVE, NOT
stranded as prior audits claimed". RESOLUTION: the 08-08 claim was correct for the tree BEFORE
the 08-20 wiring; after 32c870e4 the DLQ boundary is LIVE on exactly one class, one
construction, one writer, one route surface. No split.

**Single physical class**: gateway/dead_letter_authority.js (416 lines) - constitutional DLQ.
Writes repository_dead_letters; uses RetryPolicy.forJobType for failure classification +
isReplayable, WitnessAuthority for witness, identityAuthority.generateDeadLetterId for
dead-letter identity, constitutionalTimeAuthority.nowAsMillis for timestamps. Methods:
recordDeadLetter / getDeadLetter / getDeadLettersByJobType / getDeadLettersByMission /
replayDeadLetter / getStats / cleanOldDeadLetters.

**SINGLE construction site (production)**: 
ew DeadLetterAuthority(this._pool) at
gateway/bootstrap/gateway_runtime.js:544 (inside the pgAvailable try block; declared null :377,
set null on failure :549). initialize() at :545. The SAME singleton is injected TWO places:
(1) deadLetterAuthority, into 
ew MissionScheduler({...}) (:556) for the retry-exhaustion
DLQ record; (2) deadLetterAuthority, replayProvider, into the services object (:665) for the
mission_control route surface.

**SINGLE production writer to repository_dead_letters**: the ONE live ecordDeadLetter call =
ping-runtime/orchestration/mission_scheduler.js:303 (exhaustion branch:
etries >= this._retryPolicy.max_attempts && this._deadLetterAuthority). Header comment at
:88 documents the same P0-5 contract. Other writers: gateway/dead_letter_authority.js:112 is
the method definition; gateway/test_durable_mission_lifecycle.js is TEST-ONLY (verification:
rg for production require of that test = empty; not in the bootstrap graph).

**Route surface**: /mc/dead-letters, /mc/dead-letters/stats, /mc/dead-letters/:id all read
services.deadLetterAuthority via routes/mission_control.js:607/:628/:639, each returning a
graceful {status:'degraded', message:'DeadLetterAuthority not initialized'} when null.

**Retry-semantics split is NOT a competing authority**: the live retry decision is the SAME
live scheduler (section 28 exclusive decider) reading the SAME ping_missions table:
MissionRuntime.failWithRetry (ping-runtime/orchestration/mission_runtime.js:202, increments
retries, sets retry_pending + retry_at or failed on exhaustion) + MissionScheduler's
	his._retryPolicy = options.retryPolicy || { max_attempts: 3, backoff_delay_ms: 5000 }
(mission_scheduler.js:98). RetryPolicy (gateway/retry_policy.js, pure helper, imported only by
dead_letter_authority.js) and RetryAuthority (gateway/retry_authority.js, independent class)
both exist, but **RetryAuthority has ZERO importers anywhere** (verified: rg require of
retry_authority over gateway/ping-runtime/runtime = no files). RetryAuthority = DORMANT
(never constructed on any path). No second reachable retry authority.

**Verdict**: FALSIFIED. Exactly ONE live DLQ authority (DeadLetterAuthority singleton,
gateway_runtime.js:544) and ONE production writer (mission_scheduler.js:303 via the retry
exhaustion path). RepositoryStore/EventWriteAuthority-style duplicates do not exist here: no
second class, no second construction, no second writer, no second route surface. RetryAuthority
= dormant (zero importers). No consolidation edit warranted.

**Class**: [STAT] static require/construction/writer scan. NOT promoted to [EMPR] - no live
E2E this unit (the durable lifecycle regulator test_durable_mission_lifecycle.js runs 8/8 GREEN
against a mock pool as the discriminator; actual drain-to-dead-letter against real Postgres is
a pre-existing empirical capability, not re-run here).

**Gates**: gateway_runtime LOADS OK; node --check clean on dead_letter_authority.js +
mission_scheduler.js; DeadLetterAuthority constructed exactly once (rg new DeadLetterAuthority =
gateway_runtime.js:544); production recordDeadLetter writer = mission_scheduler.js:303 only;
test_durable_mission_lifecycle.js 8/8 PASS; test_dead_letter_wiring.js present. No code change;
no consolidation edit (falsification-complete).

**Canonical DLQ/retry ruling (inherit - do not reopen)**: canonical DLQ authority =
DeadLetterAuthority (gateway/dead_letter_authority.js), constructed exactly once at
gateway_runtime.js:544, injected into MissionScheduler (:556) + services (:665). Canonical
retry decision = MissionScheduler (single live scheduler, section 28) + MissionRuntime
.failWithRetry (ping_missions retries/retry_at/retry_pending). Any future DLQ/retry change must
go through the EXISTING DeadLetterAuthority singleton + the live MissionScheduler path; never
construct a second DLQ authority, never reintroduce RetryAuthority as a competing decider.

## 31. Knowledge/Graph Write Boundary Falsification

**Questions the audit resolves**: (a) is there a SINGLE reachable live writer to the
knowledge_nodes table, or does the legacy gateway/knowledge_graph.js create a competing
reachable writer? (b) is there a second live KnowledgeGraph class on the production spine?

**Sole live KnowledgeGraph class**: ping-runtime/knowledge/knowledge_graph.js (single
class KnowledgeGraph at :30, module.exports {KnowledgeGraph} :256). Constructed EXACTLY ONCE
at gateway/bootstrap/gateway_runtime.js:472 (
ew KnowledgeGraph({ pool: this._pool })),
initialize() :473, single injection into services :658 -> /knowledge routes :796
(createKnowledgeRoutes(services.knowledgeGraph, ...)) + KnowledgePromoter (:518) + graph-
projection subscriber (:602-603) + EmbeddingService (:535).

**Sole live writer to knowledge_nodes**: repository-wide rg of INSERT INTO knowledge_nodes
(over non-test JS, gateway + ping-runtime + runtime) = ONLY ping-runtime/knowledge/
knowledge_graph.js (addNode :87). The ONLY production caller of addNode =
gateway_runtime.js:602 (the graph-projection subscriber, a subscriber on the same
UnifiedEventRuntime spine). No other production file writes knowledge_nodes.

**Legacy gateway/knowledge_graph.js is a DIFFERENT class family, NOT the KnowledgeGraph
class, and does NOT write knowledge_nodes**: it declares KnowledgeGraphObject (Gate 27) +
KnowledgeGraphRuntime (:183); rg of INSERT INTO|knowledge_nodes inside it = EMPTY. It was it
not constructed by gateway_runtime.js (its only knowledge_graph require is
../../ping-runtime/knowledge/knowledge_graph from :72 - a string-substring match in an
earlier scan, not a real import of the legacy file). Its importers = ollama_runtime.js,
prompt_runtime.js, replay_runtime.js, repository_reset_harness.js + 2 harnesses - NONE in the
live bootstrap (rg of those requires under gateway/bootstrap = empty). STRANDED.

**Verification detail**: the earlier importer scan reported gateway_runtime.js as an importer
of gateway/knowledge_graph.js - FALSE POSITIVE caused by substring matching knowledge_graph
against the require path ../../ping-runtime/knowledge/knowledge_graph. gateway_runtime.js
never requires the legacy gateway/knowledge_graph.js file. Corrected by reading the literal
require line :72.

**Verdict**: FALSIFIED. Exactly ONE reachable live writer to knowledge_nodes
(ping-runtime KnowledgeGraph.addNode via the graph-projection subscriber gateway_runtime.js:602),
one construction of the KnowledgeGraph class (gateway_runtime.js:472). Legacy
gateway/knowledge_graph.js (KnowledgeGraphObject/KnowledgeGraphRuntime) = stranded class
family, different object model, zero live path to knowledge_nodes. No consolidation edit
warranted.

**Class**: [STAT] static require/construction/writer scan. Not promoted to [EMPR] - no live
E2E this unit (knowledge_graph addNode path already exercised by existing green suites:
knowledge_search 10/10, phase_d 7/7, trace_propagation 10/10).

**Gates**: gateway_runtime LOADS OK; node --check clean ping-runtime/knowledge/knowledge_graph.js;
rg INSERT INTO knowledge_nodes = single live file; addNode production caller = gateway_runtime.js:602
only; legacy importers all non-bootstrap (stranded). No code change; no consolidation edit
(falsification-complete).

**Canonical knowledge ruling (inherit - do not reopen)**: canonical knowledge-graph authority =
KnowledgeGraph (ping-runtime/knowledge/knowledge_graph.js), constructed exactly once
gateway_runtime.js:472, single addNode write path via gateway_runtime.js:602, exposed via
/knowledge routes. Legacy gateway/knowledge_graph.js (KnowledgeGraphObject/KnowledgeGraphRuntime)
= stranded and never a writer to knowledge_nodes. Any future knowledge-graph write must go
through the live KnowledgeGraph singleton; never construct a second KnowledgeGraph, never
wire the legacy class family onto the spine.
