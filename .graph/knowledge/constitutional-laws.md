---
title: Constitutional Laws
type: law
updated: 2026-07-29
tags: [constitutional, invariant, law, governance]
links:
  - INDEX.md
  - ../research/05-business-operating-systems.md
  - ../research/11-organizational-intelligence.md
  - ../../constitution/
---

# Constitutional Laws

## Law 1: Capability before Implementation

**Source:** PING ConnectorRegistry + CapabilityRegistry architecture, research area 9
**Status:** Implemented in PING architecture, unfilled in practice

A connector is defined by its capabilities — not by its API.
Every connector registers in PING's Capability Registry.
The capability — not the code — is the primitive.

**Invariant:** No connector code executes without a registered capability.
**Violation:** 5 connectors exist (Google, GitHub, PostHog, Email, SMS), 0 have live credentials. CapabilityRegistry has 31 generated capabilities but 0 are populated with operational metadata.

**Evidence:** `gateway/connector_registry.js` — `registerConnector()` method takes `provider`, `capabilities[]`, `actions[]`. Capabilities are indexed by `byCapability.get(capability)`. The architecture is correct; the data is empty.

---

## Law 2: Missions Model Organizational Work, Not Agent Tasks

**Source:** Research areas 2, 5, 7, 11
**Status:** Structurally correct in PING, unfilled with business content

PING missions map to how real organizations assign, track, and review work. A mission is defined by:
- Owner (not executor) — who is accountable
- Capability required (not worker ID) — what is needed
- Lifecycle states — where it is in the execution cycle
- Evidence of completion — what proves it's done

**Invariant:** Every mission must have an owner, a capability requirement, and an evidence criterion.
**Violation:** PING's MissionRuntime has lifecycle states (created→assigned→running→completed→failed→archived) and capability-based dispatch via Scheduler. But zero missions carry business content — all are system/orchestration missions. Orca's autonomous loop runs missions, but they're architectural audit missions, not business operations.

**Evidence:** `ping-runtime/orchestration/mission_runtime.js` — created/assigned/running/completed/failed/archived lifecycle. `orchestration/execution/scheduler.js` — SHA-256 deterministic worker selection by capability. No business mission templates exist.

---

## Law 3: Every Action Has an Idempotency Key

**Source:** Research areas 1, 8, 9
**Status:** Missing entirely in PING

Every external action must carry an idempotency key derived from the event that triggered it. Same event → same key → same action skipped.

**Invariant:** No external side effect executes without an idempotency key.
**Violation:** PING has no idempotency key infrastructure. WorkerRuntime dispatches events to workers, workers can execute the same event multiple times on retry. Mission scheduler can re-dispatch missions on restart. No dead letter queue exists.

**Evidence:** `ping-runtime/workers/worker_runtime.js` — `dispatch()` has no idempotency check. `orchestration/execution/event_queue.js` — events have event_id (SHA-256 hash) but no dedup enforcement for handler execution. No DLQ.

---

## Law 4: Decisions Are Pure Computation

**Source:** Research areas 2, 7
**Status:** Implemented correctly in PING (ConsensusEngine)

Decision-making is separated from side effects. A decision engine evaluates input, produces a decision object, and returns it. The caller owns all side effects (event emission, state transition, action execution).

**Invariant:** Decision engines must not emit events, modify state, or execute actions.
**Compliant:** ConsensusEngine (Phase 39 refactoring) is the cleanest audit outcome — 6P/2W/0F. All event emissions moved to Engine._resolveMission(). Decision objects contain all evidence, but the engine itself is pure computation.

**Evidence:** `orchestration/execution/consensus_engine.js` — `evaluate()` returns a Decision object with findings, confidence, agreementLevel, accepted. Zero event emissions. Zero state mutations.

---

## Law 5: Knowledge Is Derived, Not Stored

**Source:** Research areas 3, 4, 8, 10
**Status:** Architecturally correct, structurally empty

Knowledge is derived from events through a deterministic pipeline. Facts are not stored directly — they are computed from evidence chains. The pipeline is: Event → Observation → Claim → Classification → Recommendation → Projection.

**Invariant:** All knowledge must be traceable to its source event through the derivation chain.
**Compliant in architecture:** PING's event pipeline (ObservationWorker → ClaimWorker → Classification → Recommendation → Projection) maps to this spectrum. KnowledgeGraph stores nodes + edges in Postgres.
**Violation in practice:** No workers are deployed. No knowledge is derived from events. The pipeline is structurally complete in code but 100% dormant.

**Evidence:** `gateway/event_read_authority.js` — reads from `repository_events`. `ping-runtime/knowledge/knowledge_graph.js` — nodes + edges model. Workers/repository_client.py — HTTP event emission. WorkerRuntime — dispatch-only mode, _poll() explicitly disabled.

---

## Law 6: Entity Lifecycle Is Explicit

**Source:** Research areas 5, 11, 12
**Status:** Not implemented in PING

Every business entity has a defined lifecycle with states, valid transitions, events, and missions. The lifecycle is the constitution of the entity — it defines what can happen, in what order, and who can do it.

**Invariant:** Every entity must have a state transition matrix before its events can be processed.
**Violation:** PING has CustomerAuthority, ProjectAuthority, ReviewAuthority with CRUD operations — but no lifecycle model. States are implicit in database columns, not explicit in the entity definition. The 23 registered business event types have no state transition validation.

**Evidence:** `gateway/authorities/customer_authority.js` — implements CRUD. `gateway/authorities/project_authority.js` — implements CRUD. No lifecycle definition exists anywhere in the codebase except design docs.

---

## Law Enforcement

| Law | Enforcement Mechanism | Status |
|-----|----------------------|--------|
| 1 | CapabilityRegistry.validateCapability() | Exists, empty |
| 2 | MissionRuntime lifecycle validation | Exists, unused |
| 3 | No enforcement mechanism exists | Missing |
| 4 | ConsensusEngine pure computation proof | Clean audit |
| 5 | KnowledgeGraph derivation chain tracking | Exists, empty |
| 6 | No entity lifecycle validator exists | Missing |
