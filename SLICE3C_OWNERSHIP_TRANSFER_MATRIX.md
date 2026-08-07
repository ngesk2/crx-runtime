# SLICE 3C — Ownership Transfer Matrix

**Status**: DOCUMENT ONLY — planning artifact. No deletion, no replay/witness/lineage activation.
**Basis**: `SLICE3_CONVERGENCE_AUDIT.md` (E1–E15) + first-hand file inventory (2026-08-06).
**Governing rules**: Behavior Preservation Gate (never delete before a wired-and-tested replacement),
"every production path has exactly one owner", Convergence Ledger records every transfer with verification status.

---

## 1. Frozen Layer 1 Constitutional Owners

These are immutable. Every shadow stack below must transfer ownership TO one of these — never create a new owner.

| Concern | Constitutional Owner | Canonical home |
|---|---|---|
| Identity | existing | identity authority |
| Namespace | `CanonicalizationService` | `ping-runtime/canonicalization/canonicalization_service.js` (`resolveNamespace` :57-63, `NAMESPACE_RE` :30) |
| Canonical Object | `canonical_object.js` | `gateway/canonical_object.js` (`createCanonicalObject`, `verifyCanonicalObject`) |
| Verification | `verifyCanonicalObject()` | `gateway/canonical_object.js` |
| Evidence | `EvidenceAuthority` | `ping-runtime/evidence/evidence_authority.js` |
| Promotion | `KnowledgePromoter` | `ping-runtime/knowledge/knowledge_promoter.js` |
| Search | `HybridSearch` | `ping-runtime/search/hybrid_search.js` |
| Runtime emission | `UnifiedEventRuntime` | `ping-runtime/events/unified_event_runtime.js` (namespace resolved once at emit, validated by `EventGovernance`) |

---

## 2. Transfer Matrix

Columns: **Shadow stack** · **Current owner(s)** · **Constitutional owner (target)** · **Migration prerequisite** · **Deletion gate**

| # | Shadow stack | Current owner(s) | Constitutional owner | Migration prerequisite | Deletion gate |
|---|---|---|---|---|---|
| 3C-1 | **Gateway replay cluster** (~35 `replay_*.js` in `gateway/` + `runtime/replay_decision_authority.js` + `replay_worker.js` + `replay_scheduler.js` + `replay_plan_authority.js` + `replay_validator_authority.js` + `replay_certificate_authority.js` + `replay_determinism_authority.js` + `replay_recorder_authority.js` + `replay_authority.js` + `replay_runtime.js` + `replay_transcript*.js` + `replay_verifier.js`) | Multiple unwired impls; 1 LIVE file only (`runtime/replay_decision_authority.js`, 23 lines) | NONE frozen — replay activation DEFERRED | Decision-graph approval for replay activation; single ReplayAuthority selected (converge gateway cluster OR import compiled engine from `main` branch); `REPLAY_VERIFY` emitter wired into `EVENT_MISSION_MAP` | Replacement wired + exercised (100× replay determinism proof) + routing matrix updated + CRC increased + Convergence Ledger entry |
| 3C-2 | **Gateway witness cluster** (`witness_authority.js`, `witness_chain.js`, `witness_generator.js`, `witness_recorder.js`, `witness_registry.js`, `witness_relationship_prover.js`, `pipeline_witness.js`, `generator_witness.js`, `inference_witness.js`, `performance_baseline_witness.js`, `opentelemetry_witness_instrumentation.js`, `compiler_lineage_witness.js`) | Multiple unwired impls | NONE frozen — witness activation DEFERRED; `verifyCanonicalObject()` + `EvidenceAuthority` are the live verification path today | Witness activation decision; single WitnessAuthority; witness chain over canonical object hashes | Replacement wired + witness validated + routing matrix + CRC + Convergence Ledger |
| 3C-3 | **Gateway lineage cluster** (`lineage_authority.js`, `compiler_lineage_authority.js`, `compiler_lineage_witness.js`, `LineageWorker`) | Multiple unwired impls | NONE frozen — lineage activation DEFERRED; live lineage today = spine `metadata.causation_id`/`correlation_id` | Lineage activation decision; lineage via knowledge_graph edges + spine metadata (no new authority) | Replacement wired + exercised + routing matrix + CRC + Convergence Ledger |
| 3C-4 | **Kernel TS authorities** (`runtime/kernel/authorities/{replay_identity, witness, lineage}_authority.js`, `runtime/kernel/execution/replay_decision_authority.js`, `runtime/kernel/execution/*`) | PATCH_008 gateway shims (6 files, delegate to kernel) + kernel itself (kernel NOT running) | `UnifiedEventRuntime` + JS `WorkerRuntime` + `EvidenceAuthority`/`HybridSearch` | Remove PATCH_008 shims after confirming zero production `require()`; kernel stays dormant/archived | Zero production imports proven (rg clean) + golden tests + Convergence Ledger |
| 3C-5 | **Event persistence duplicates** (4 impls): `UnifiedEventRuntime` vs `event_repository.js` / `event_read_authority` duplicate pair / `repository_events` + `canonical_events` tables | Multiple tables + read/write paths | `UnifiedEventRuntime` (spine, single persistence) | `event_bridge.js` (already live, poll→re-emit) proves 100% parity between legacy tables and spine; converge all reads to spine | Bridge parity proven under golden tests + routing matrix + CRC |
| 3C-6 | **Parallel event bus** (NATS / ExecutionRuntime kernel pipeline) | `orchestration`/`gateway` kernel path (hollow: reducer/projection registries EMPTY) | `UnifiedEventRuntime` | None — bus already converged; NATS/kernel path has zero production traffic | Confirm zero production refs + archive + Convergence Ledger |
| 3C-7 | **Capability registry duplicate** (`gateway` legacy registry) | `ping-runtime/connectors/capability_registry.js` (WINNER, live via `/connectors`) | ping-runtime CapabilityRegistry + `gateway/generated/capability_registry.json` | PATCH-01 (already declared winner); remove legacy registry after verifying `/connectors` parity | Single registry + routes verified + Convergence Ledger |
| 3C-8 | **Authority registries** (3 impls) | gateway authority_registry + others | one consolidated registry | PATCH convergence (declared winner) | Single registry + CRC |
| 3C-9 | **IntelligenceWorker duplicate path** (dual classification/recommendation fan-out vs canonical chain) | `IntelligenceWorker` (`ping-runtime/workers/intelligence_worker.js`) — namespace drop FIXED in 3A-3 | single classification/recommendation producer (decision-graph item) | Decision-graph approval: single worker-identity decider, one priority scale, confidence on spine | Fan-out merged + provenance single-sourced + golden tests |
| 3C-10 | **Dual projection owner** | `EmbeddingService.subscribe()` AND `ProjectionWorker` both write Qdrant | single projection owner | Idempotency-by-`event_id` proof (already true — `ON CONFLICT DO NOTHING`); accept dual owner for now | Single owner after idempotency + parity proof |

---

## 3. Universal Deletion Gate (applies to every row)

Deletion is the LAST step, never the first. No row above may be deleted until ALL of:

1. **Replacement wired** — constitutional owner is on the production execution path (routing matrix shows it).
2. **Golden tests pass** — semantic equivalence proven against a frozen golden corpus; behavior preservation demonstrated.
3. **Routing matrix updated** — old path → new path documented per `gateway/AGENTS.md` migration safety rules.
4. **CRC increased or held at 100%** — the transfer never reduces constitutional coverage.
5. **Convergence Ledger entry** — every duplicate removal recorded with verification status.
6. **User direction** — deletion is never executed autonomously; it is gated on explicit direction.

---

## 4. Current State (what this matrix does NOT authorize)

- 3C-1/2/3 (replay/witness/lineage): **NOT activated**. Registered workers (`replay`, `witness`, `lineage`) stay registered-but-never-executed. Nothing emits `REPLAY_VERIFY`; no replay endpoints exist. Activation is a decision-graph item, out of 3A scope.
- 3C-4: kernel TS authorities stay dormant. PATCH_008 shims remain (they are harmless while the kernel is not on the production path).
- 3C-9/10: known duplications, ACCEPTED for now (documented, tracked, no silent divergence). Resolution requires the decision-graph fixes (deferred).

## 5. Ownership Transfers COMPLETED in Slice 3A (recorded for the Convergence Ledger)

| Concern | Before | After |
|---|---|---|
| Namespace defaulting | 6 sites (`unified_event_runtime.js`, `canonical_workers.js:36`, `event_to_mission_bridge.js:109`, `mission_scheduler.js:187`, `gateway_runtime.js:576`, `intelligence_worker.js` drop) | 1 site — `unified_event_runtime.js:103` (spine default) |
| Namespace validation | none at the spine; `EventGovernance` never saw the canonical namespace | `UnifiedEventRuntime.emit` → `EventGovernance.validateEvent` (`INVALID_NAMESPACE` for non-`core::`/`tenant::`) |
| Governance error surfacing | `emit()` read `governance.error` (always undefined — `_reject` returns `errors[]`) | `emit()` surfaces `governance.errors[0]` + `code` |
| IntelligenceWorker namespace | dropped at `intelligence_worker.js:20` (biggest business-event consumer) | preserved verbatim (mirrors `canonical_workers.js` BaseWorker) |

Verification: `gateway/test_slice3a_convergence.js` 8/8 PASS (S3A-1 spine→governance, S3A-2 no duplicate defaulting, S3A-3 IntelligenceWorker fix).
Full regression green — only pre-existing Wave3B p7 failures (stale hardcoded rule-count 195 vs 231) remain.
