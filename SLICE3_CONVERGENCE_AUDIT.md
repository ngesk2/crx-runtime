# SLICE 3 CONVERGENCE AUDIT

**Date**: 2026-08-06
**Mode**: READ-ONLY. No code changes, no repository modifications, no new files beyond this deliverable.
**Scope**: Slice 3 of `PING_CANONICAL_BOUNDARY_PLAN.md` — Phase G (namespace enforcement, plan:314-315) + Phase H (producers, plan:321).
**Constitutional rule applied**: Reuse > Refactor > Move > Merge > Remove > **Create**. "Create" is only justified after this audit proves the responsibility does not already exist somewhere in the repository.
**Source of truth for plans**: `PING_CANONICAL_BOUNDARY_PLAN.md` §3 Phases, §4.1 no-duplicates (line 382), §4.4 naming-collision rule (line 385).

---

## 1. Executive Verdict

**Namespace enforcement does NOT need a new authority. It already exists — split across three live implementations that must be converged, not duplicated.**

| Slice 3 planned work | Verdict | Reason |
|---|---|---|
| CREATE `ping-runtime/security/namespace_authority.js` (`resolve`/`authorize`/`guard`) | **REUSE + EXTEND, not CREATE** | `CanonicalizationService.resolveNamespace()` (canonicalization_service.js:57-63) already performs resolution + validation (`NAMESPACE_RE`, `core::`/`tenant::`). Extend it with authorization; never build a parallel file. |
| MODIFY `unified_event_runtime.js` namespace validation at emit | **REQUIRED — real gap** | emit() does not pass `namespace` into `EventGovernance.validateEvent` (unified_event_runtime.js:99-109 passes only event_type/source/payload). Governance currently cannot reject a bad namespace at the spine. |
| MODIFY `knowledge_graph.js` namespace filter | **ALREADY DONE (Phase D)** | `namespace` column (:33), queryNodes filter (:156-158), `updateNodeBySourceEvent` namespace guard (:96-98). No work required. |
| MODIFY `qdrant_adapter.js` payload filter | **NO MATCH FOUND** — qdrant_adapter.js has **zero** namespace references | The privacy boundary lives in `hybrid_search.js:57` (drops foreign-namespace hits) — which is the correct enforcement point. Verify before touching adapter. |
| Producers (clipboard/git/log watchers) → `/ingest` | **MISSING — genuinely greenfield** | Zero producers POST to `/ingest`. Exactly one clipboard mechanism exists (powertoys autocomplete learner, local-only). See §6. |

**Biggest finding — two incompatible namespace systems coexist:**

1. **Canonical namespace** (`core::<name>` / `tenant::<id>`): enforced by `CanonicalizationService.resolveNamespace` (canonicalization_service.js:30,57-63), persisted on `ping_events.namespace` (unified_event_runtime.js:50,112), filtered by `knowledge_graph` (Phase D) and `hybrid_search:57`.
2. **Governance namespace** (`NAMESPACE_OWNERS` keyed by event-type prefix → PING/HPP): `event_governance.js:10-62`. This is an owner map derived from event-type prefixes (customer/review/lead → HPP, artifact/claim → PING), **not** the `core::`/`tenant::` namespace column. It validates "who owns event types of this prefix", never the persisted namespace.

These two systems must be **reconciled, not merged blindly** — they answer different questions (ownership vs. tenant isolation). Slice 3's namespace work is about making the spine enforce the canonical namespace; the governance map is a separate concern (already validated at emit via the event-type path).

---

## 2. Evidence Verification (first-hand, this session)

| # | Claim | Evidence | Status |
|---|-------|----------|--------|
| E1 | Namespace resolution exists | `ping-runtime/canonicalization/canonicalization_service.js:57-63` `resolveNamespace()` — explicit > per-source map > `DEFAULT_NAMESPACE='core::owner'` (:29); `NAMESPACE_RE=/^(core\|tenant)::[a-zA-Z0-9_-]+$/` (:30) | VERIFIED |
| E2 | Per-source namespace map wired | `gateway/bootstrap/gateway_runtime.js:433-444` — review/customer/project/email/sms/google/github → `tenant::hpp` | VERIFIED |
| E3 | Boundary used by /ingest | `gateway/routes/ingest.js:45` → `canonicalizationService.canonicalizeAndEmit` | VERIFIED |
| E4 | Spine defaults + stores namespace | `unified_event_runtime.js:112` `namespace = options.namespace || 'core::system'`; INSERT at :133-136 persists namespace | VERIFIED |
| E5 | Governance does NOT see namespace | `unified_event_runtime.js:99-109` — `validateEvent({event_type, source, payload})`; no namespace passed | VERIFIED — real gap |
| E6 | Governance namespace = owner map | `event_governance.js:10-62` `NAMESPACE_OWNERS`; `_extractNamespace` from event_type prefix (:117-129); `validateEvent` checks ownership policy (:131-162), not canonical namespace | VERIFIED — second namespace system |
| E7 | Knowledge graph namespace done | `knowledge_graph.js:33,39,43` (column/index), :156-158 (filter), :96-98 (guard) | VERIFIED — Phase D landed |
| E8 | Hybrid search is the privacy boundary | `hybrid_search.js:57` `if (namespace && payload.namespace !== namespace) continue` | VERIFIED |
| E9 | qdrant_adapter has no namespace | grep `namespace` in `ping-runtime/search/qdrant_adapter.js` → 0 matches | VERIFIED — enforcement is in hybrid_search, not adapter |
| E10 | No NamespaceAuthority/sensor/producer/capture code | repo grep `namespace_authority\|NamespaceAuthority\|sensor_registry\|producer_registry\|capture_gateway\|/capture` → only design docs (plan files, SCREENPIPE_HARVESTING_PLAN.md) reference them | VERIFIED — greenfield |
| E11 | `/ingest` has zero live callers | grep `fetch(.*ingest\|/ingest` across ping-runtime + powertoys → 0 code callers; only `gateway_runtime.js:646` mounts the route | VERIFIED |
| E12 | No clipboard/git/log producer posts to spine | Only `powertoys/autocomplete-service/server.js:241` (PowerShell `Get-Clipboard` poll → local `memory.json`); git emitter = `ConnectorEmitter.githubCommit` (business_emitters.js:80-82, in-process); no log tailer, no file watcher wired, no fs.watch producer | VERIFIED |
| E13 | runtime/security/ is Python capability auth | `runtime/security/`: `capabilities.py`, `policy_engine.py`, `jwt_auth.py`, `projection_integrity.py`, `__init__.py` — no JS namespace authority, no `NamespaceAuthority` name | VERIFIED — §4.4 collision rule satisfied: no name collision in the package |
| E14 | Event registry is generated source of truth | `event_generator.js:61` `_productionEvents()`; `SNIPPET_APPROVED` etc. at :320-323 (Slice 2). No capture event types (no CLIPBOARD/WINDOW/CAPTURE). New capture types MUST be added here, not to JSON | VERIFIED |
| E15 | Slice 2 committed | commit `98dac441` — EvidenceAuthority, HybridSearch, KnowledgePromoter, knowledge_graph.updateNodeBySourceEvent, event registry 227→231 | VERIFIED (AGENTS.md log + tests) |

---

## 3. Per-Feature Repository Ownership

### 3.1 Namespace resolution + validation
| Field | Value |
|---|---|
| CURRENT OWNER | `CanonicalizationService.resolveNamespace()` — `ping-runtime/canonicalization/canonicalization_service.js:57-63` |
| FILE / MODULE | `ping-runtime/canonicalization/canonicalization_service.js` |
| AUTHORITY | CanonicalizationService (thin façade over createCanonicalObject + UnifiedEventRuntime) |
| CONSUMERS | `POST /ingest` (ingest.js:45); in-process business emitters via duck-typed `emit` (canonicalization_service.js:152-164); constructed at gateway_runtime.js:433 |
| DEPENDENCIES | `gateway/canonical_object.js` (createCanonicalObject/verifyCanonicalObject) |
| EVENT TYPES | any registered event (231 in registry) |
| DB TABLES | none (resolution only; persistence via ping_events) |
| HTTP ROUTES | `POST /ingest` |
| RUNTIME PATH | gateway_runtime.js → canonicalizationService → unifiedEventRuntime.emit |
| VERDICT | **USE AS-IS** for resolution. **EXTEND** with producer→namespace authorization (the `authorize`/`guard` the plan wanted) rather than creating NamespaceAuthority. |

### 3.2 Spine namespace enforcement
| Field | Value |
|---|---|
| CURRENT OWNER | `UnifiedEventRuntime.emit` — `ping-runtime/events/unified_event_runtime.js:70-167` |
| CONSUMERS | every emitter (business emitters, /ingest, EventBridge, workers, MissionRuntime) |
| EVENT TYPES | all 231 |
| DB TABLES | `ping_events` (namespace column :50) |
| HTTP ROUTES | none (spine is in-process; surfaced via /events reads) |
| RUNTIME PATH | emit → validate type → governance → persist → handlers → integrations |
| VERDICT | **REFACTOR (Small)** — pass `namespace` into `validateEvent` so the canonical namespace is validated at the spine. Governance may also need a canonical-namespace check (`core::`/`tenant::` regex + producer authorization), OR the check happens in CanonicalizationService and the spine only validates format. Decision in §7. |

### 3.3 Event governance (ownership policy)
| Field | Value |
|---|---|
| CURRENT OWNER | `EventGovernance` — `gateway/runtime/event_governance.js` (213 lines) |
| CONSUMERS | `unifiedEventRuntime.emit` (:99-109); governance routes |
| EVENT TYPES | all registry events, ownership keyed by event-type prefix |
| DB TABLES | none (in-memory policy from event_registry.json) |
| HTTP ROUTES | governance inspection routes (mounted in gateway_runtime) |
| RUNTIME PATH | validateEvent → NAMESPACE_OWNERS map |
| VERDICT | **USE AS-IS**. Owner map is a distinct concept (event-prefix → PING/HPP). Document the divergence from canonical namespace; do not merge the two maps. Optional: add a separate canonical-namespace validation method. |

### 3.4 Knowledge graph namespace filtering
| Field | Value |
|---|---|
| CURRENT OWNER | `KnowledgeGraph` — `ping-runtime/knowledge/knowledge_graph.js` |
| CONSUMERS | routes/knowledge.js, KnowledgePromoter (updateNodeBySourceEvent), graph projection subscriber |
| DB TABLES | `knowledge_nodes` (+`knowledge_edges`) |
| RUNTIME PATH | addNode stores namespace (:71-76); queryNodes filters (:156-158); updateNodeBySourceEvent guards (:96-98) |
| VERDICT | **USE AS-IS — Phase D complete. No Slice 3 work required.** |

### 3.5 Search privacy boundary
| Field | Value |
|---|---|
| CURRENT OWNER | `HybridSearch` — `ping-runtime/search/hybrid_search.js` |
| CONSUMERS | `POST /knowledge/search` (routes/knowledge.js, Slice 2) |
| DB TABLES | knowledge_nodes + ping_events (via EvidenceAuthority) |
| RUNTIME PATH | search → semantic leg (drops foreign-namespace :57) + KG leg |
| VERDICT | **USE AS-IS.** qdrant_adapter.js is NOT the enforcement point (E9). Do not add namespace plumbing to the adapter. |

### 3.6 Producers (clipboard / git / log)
| Field | Value |
|---|---|
| CURRENT OWNER | **NONE** (missing) |
| EXISTING PARTIAL | clipboard: `powertoys/autocomplete-service/server.js:241` (local learner, writes memory.json, **no spine POST**); git: `ConnectorEmitter.githubCommit` (business_emitters.js:80-82 → GITHUB_COMMIT_SYNCED, in-process) |
| DORMANT | `gateway/document_ingestion.js:124` (file watcher), `gateway/file_watcher.js`, `drive_ingestor.py` (Python, dormant) |
| DB TABLES | none for capture |
| HTTP ROUTES | `POST /ingest` available, zero callers |
| VERDICT | **MISSING — genuinely greenfield** for clipboard→spine, log tailing. Git is already half-covered by ConnectorEmitter; a git watcher should emit the same event. Producers must be thin adapters over CanonicalizationService (reuse /ingest contract), never parallel boundaries. |

### 3.7 Producer validation / registry
| Field | Value |
|---|---|
| CURRENT OWNER | **NONE** (no sensor registry, no producer registry, no capture gateway, no /capture route — E10) |
| VERDICT | **MISSING.** But per reuse-first: this is the ONLY justification for new code, and even then it should be a lightweight extension of /ingest (allowlist of known sources) rather than a new Capture Gateway subsystem. Screenpipe/capture plans (`SCREENPIPE_HARVESTING_PLAN.md`) are separate, gated work — not Slice 3. |

---

## 4. Duplicate Detection — Convergence Analysis

Per the plan's mandate (§4.1 no-duplicates), every Slice 3 concern checked against existing implementations:

| Concern | Existing owners found | Likely constitutional owner | Recommended convergence |
|---|---|---|---|
| Namespace resolution | `CanonicalizationService.resolveNamespace` (canonicalization_service.js:57-63) | CanonicalizationService | **EXTEND**, never CREATE NamespaceAuthority |
| Namespace validation format | `NAMESPACE_RE` (canonicalization_service.js:30) | CanonicalizationService | REUSE |
| Namespace authorization (producer→allowed ns) | **NONE** | CanonicalizationService (new method) | CREATE within existing file (new method, no new file) |
| Namespace middleware for routes (`guard(ns)`) | **NONE** | routes/ingest.js (thin) | ADD to ingest.js, not a new authority |
| Spine namespace enforcement | **WEAK** — emit stores but does not validate namespace (:99-109 gap) | UnifiedEventRuntime | REFACTOR (Small) |
| Event-type ownership (PING/HPP) | `EventGovernance.NAMESPACE_OWNERS` (event_governance.js:10-62) | EventGovernance | USE AS-IS (distinct concept) |
| KG namespace filtering | `knowledge_graph.js:156-158` | KnowledgeGraph | USE AS-IS (done) |
| Search namespace isolation | `hybrid_search.js:57` | HybridSearch | USE AS-IS |
| Producer→spine boundary | `POST /ingest` → canonicalizeAndEmit | CanonicalizationService | REUSE (all producers) |
| Clipboard capture → knowledge | `powertoys/autocomplete-service/server.js:241` (local learner) | MISSING (clipboard→spine) | **Only genuine CREATE**: thin clipboard producer adapter over /ingest |
| Git commit → event | `ConnectorEmitter.githubCommit` (business_emitters.js:80-82) | ConnectorEmitter | REUSE; a git watcher emits GITHUB_COMMIT_SYNCED via same emitter |
| File watcher | `document_ingestion.js:124`, `file_watcher.js` (dormant) | file_watcher (revive or reuse) | MOVE (wire existing, don't write new) |
| Log tailing | **NONE** | MISSING | CREATE (small) — only if required; otherwise defer |
| Producer registry | **NONE** | MISSING | CREATE only if producers >2; otherwise hardcoded source allowlist in CanonicalizationService |

**Verdict: of the planned Slice 3 surface, exactly ONE thing is a true greenfield CREATE (clipboard→spine producer). Everything else is REUSE, EXTEND, or already done.**

---

## 5. Slice 3 Impact Report

| # | Planned task (plan §3) | Existing owner (evidence) | Action | LOC estimate |
|---|---|---|---|---|
| G1 | CREATE `namespace_authority.js` (`resolve`) | `CanonicalizationService.resolveNamespace` canonicalization_service.js:57-63 | **REUSE — no new file** | 0 |
| G2 | CREATE `namespace_authority.js` (`authorize`/`guard`) | none | **EXTEND CanonicalizationService** with `authorizeNamespace(producer, ns)` + ingest route guard | Small (~50-80) |
| G3 | MODIFY `unified_event_runtime.js` namespace validation at emit | `emit` unified_event_runtime.js:70-167; gap at :99-109 | **REFACTOR** — pass namespace into governance + format-validate | Small (<50) |
| G4 | MODIFY `knowledge_graph.js` namespace filter mandatory | knowledge_graph.js:156-158 (optional filter) | **NONE — already landed (Phase D)** | 0 |
| G5 | MODIFY `qdrant_adapter.js` payload filter | no namespace in adapter (E9) | **DO NOT TOUCH** — enforcement belongs in hybrid_search:57 | 0 |
| G6 | MODIFY `ingest.js` enforce via NamespaceAuthority | ingest.js:31-72 | **EXTEND** — source allowlist check + guard, still thin adapter | Tiny (<50) |
| H1 | Clipboard producer → /ingest | powertoys/autocomplete-service/server.js:241 (local learner) | **CREATE** thin adapter: Get-Clipboard poll → canonicalizeAndEmit (keep autocomplete service separate) | Medium (~150) |
| H2 | Git producer → /ingest | ConnectorEmitter.githubCommit business_emitters.js:80-82 | **REUSE** — wire watcher to existing emitter, same GITHUB_COMMIT_SYNCED | Small (<100) |
| H3 | Log tailer | none | **DEFER or CREATE** — not required for Slice 3 exit; Screenpipe plan covers capture | Deferred |
| H4 | Capture event types (CLIPBOARD_CAPTURED etc.) | event_generator.js `_productionEvents()` (no capture types, E14) | **REQUIRED** — add types here, regenerate registry; never hand-edit JSON | Tiny (<30) |
| H5 | PT Run bridge plugin | powertoys (Darkdriller LocalLLM plugin, no .NET SDK) | **REUSE/ADAPT** — extend existing service, do not fork C# | Deferred (I) |

**Total new-code estimate: ~250-330 LOC, of which only the clipboard producer (~150) is a true greenfield file. Zero new authority files.**

---

## 6. Producers: Current Reality

### 6.1 What exists
- **Clipboard**: `powertoys/autocomplete-service/server.js:241` — 700 ms PowerShell `Get-Clipboard` poll; only feeds local `memory.json` (paste-gated learning). **Never posts to the spine.** This is a consumer-side learner, not a PING producer.
- **Git**: `ConnectorEmitter.githubCommit()` (business_emitters.js:80-82) emits `GITHUB_COMMIT_SYNCED` **in-process** via canonicalizationService — the only wired git surface. `github_ingestion.js` imports a nonexistent `./event_emitter` (broken, dormant).
- **File**: `gateway/document_ingestion.js:124` + `gateway/file_watcher.js` — dormant; `drive_ingestor.py` — dormant.
- **Log tailing**: none anywhere.
- **/ingest**: mounted (gateway_runtime.js:646) but **zero callers** (E11).

### 6.2 The rule
Every producer is a **thin adapter over CanonicalizationService** (same contract as `/ingest`). Producers carry no business logic, no event schema, no namespace decisions of their own (namespace comes from the source map + explicit override, resolved at the boundary). Capture evidence is observation (confidence <1); only approval promotes (Slice 2 machinery exists: KnowledgePromoter + SNIPPET_APPROVED/REJECTED).

---

## 7. Recommended Convergence Decision (for user approval)

**Namespace (Phase G):**
1. **EXTEND** `CanonicalizationService` with `authorizeNamespace(producer, namespace)` + expose it. Producers' allowed namespaces = the existing per-source map (gateway_runtime.js:435-443) + explicit override. **No new `namespace_authority.js` file.** This satisfies plan §4.1 (extend, never parallel) and §4.4 (no collision in runtime/security/ since that package is Python capability auth, and we're not creating the name anyway).
2. **REFACTOR** `unified_event_runtime.js` emit to pass `namespace` into governance and format-validate `core::`/`tenant::` at the spine (small, low-risk). Optionally add a canonical-namespace validation method to EventGovernance that coexists with NAMESPACE_OWNERS (distinct concepts).
3. Leave `knowledge_graph.js`, `hybrid_search.js`, `qdrant_adapter.js` untouched.
4. Register the capture event types in `event_generator.js` + regenerate.

**Producers (Phase H):**
5. CREATE one thin clipboard producer adapter → `/ingest` (keeps the autocomplete service as-is; this is the only new file justified).
6. REUSE `ConnectorEmitter.githubCommit` for any git watcher (GITHUB_COMMIT_SYNCED).
7. DEFER log tailing + Capture Gateway to Screenpipe work (`SCREENPIPE_HARVESTING_PLAN.md` is separate, gated on Slice 1/2 proofs).

**Exit criteria for Slice 3:** a producer (clipboard) emits a canonicalized, namespace-validated observation that reaches `ping_events` with the correct namespace and is invisible to other-namespace queries — proven by tests, not just wiring.

---

## 8. Evidence Index

| Ref | File:line |
|---|---|
| Resolution | `ping-runtime/canonicalization/canonicalization_service.js:29-30,57-63,89-146,152-164` |
| Source map wiring | `gateway/bootstrap/gateway_runtime.js:433-444` |
| Ingest boundary | `gateway/routes/ingest.js:31-72` |
| Spine emit + gap | `ping-runtime/events/unified_event_runtime.js:70-167` (gap :99-109), namespace persist :112-136 |
| Governance owner map | `gateway/runtime/event_governance.js:10-62,117-129,131-173` |
| KG namespace | `ping-runtime/knowledge/knowledge_graph.js:33,39,43,71-76,96-98,156-158` |
| Search isolation | `ping-runtime/search/hybrid_search.js:57` |
| Promoter | `ping-runtime/knowledge/knowledge_promoter.js` (approve/reject → status/confidence) |
| Registry source of truth | `gateway/generated/event_generator.js:61,203,320-323` |
| Clipboard learner | `powertoys/autocomplete-service/server.js:13,241,304` |
| Git emitter | `ping-runtime/business/business_emitters.js:80-82` |
| runtime/security (Python) | `runtime/security/{capabilities,policy_engine,jwt_auth,projection_integrity}.py` |
| Plan scope | `PING_CANONICAL_BOUNDARY_PLAN.md:314-315 (G), 321 (H), 382 (§4.1), 385 (§4.4)` |

*Audit complete. Zero code changes made. Awaiting direction on §7 before any implementation.*
