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
