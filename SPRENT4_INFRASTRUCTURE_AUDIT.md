# READ ONLY — SPRINT4 INFRASTRUCTURE AUDIT

## Objective

Ignore implementation duplication.
Ignore language differences.
Ignore repository structure.

Determine the constitutional ownership boundary between:

- **Happy Place Platform** (Compiler + Runtime generation)
- **PING** (Operational Automation)

Everything is evaluated with one invariant:

> **Who is the canonical owner of this information?**
> Not: who stores it · who executes it · who references it.
> Only: **who owns its meaning.**

---

# Constitutional Ownership Boundary

## 1. Ownership Matrix

For every major subsystem — Canonical Owner · Consumes · Produces · Never Owns.

| Subsystem | Canonical Owner | Consumes | Produces | Never Owns |
|---|---|---|---|---|
| Business Objects (Project, Customer, Estimate, Media, Review, Pricing, Crew, Vendor) | **HPP** (Tenant OS = system of record) [E:website/src/config/*.json, src/constitution/objects/] | PING (references by id) | domain events | external provider copies (Google/Stripe) |
| Events (domain: EstimateSent, ProjectBooked, ProjectStarted, CrewAssigned, MaterialsRequired, ProjectCompleted, WarrantyCreated, InspectionScheduled) | **HPP** (defines + emits via generated runtime) [E:src/generated/repositories/] | PING (event bus) | event stream | — |
| Event Definitions | **HPP** (Constitutional IR / generated) [E:src/constitution/ir/types.ts] | PING (executes) | runtime events | PING must not define business events |
| EventEnvelope Schema | **PING** (constitutional runtime — canonical hashing) [E:storage/postgres/models.py] | HPP (emits into it) | envelope | HPP must not redefine envelope |
| Event Implementations | **PING** (runtime) [E:runtime/execution/] | HPP (consumes) | executed events | HPP must not implement |
| Replay | **PING** [E:kernel/replay, runtime/event_sourcing/] | HPP (replays via PING) | replayed state | HPP must not reimplement |
| Witness | **PING** [E:kernel/build_witness.py] | HPP | witness | HPP must not |
| Evidence | **HPP** (EvidenceAuthority owns; Tenant OS) [E:src/constitution/ir/types.ts Authorities] | PING (consumes) | evidence stream | PING references only (Reference, never copies bytes) |
| Projections | **HPP** (defines registration in IR) | PING (executes) | projected views | — |
| Provider Adapters | **PING** (owns adapter runtime) [E:notification/provider_*.py] | HPP (never names a provider) | adapter | HPP must not own adapters |
| Workflow Definitions (*.workflow.yaml) | **HPP** (defines) | PING (executes) | workflow runs | PING must not define business workflows |
| Workflow Execution | **PING** | HPP (triggers via event) | execution state | HPP must not execute |
| OAuth | **PING** (runtime + tokens) [E:notification/, runtime/security/] | HPP (receives minimal task data) | token | HPP must not own OAuth/credentials |
| Scheduling | **PING** (planner decides) | HPP (requests NeedAppointment) | schedule | HPP must not schedule |
| Automation | **PING** | HPP (emits events) | automation runs | HPP must not automate |
| Planning (intent) | **HPP** (defines Intent/Goal/Constraints) | PING (executes decision) | intent | — |
| Planning (execution) | **PING** (planner) | HPP | decision | HPP must not plan |
| Capability Registry (contracts, ABI IDs) | **HPP** (defines calendar.v1, payments.v2) [E:GENERATION_MANIFEST.yaml] | PING (implements adapters) | registry | PING must not define contracts |
| Capability Runtime (Broker) | **PING** [E:runtime/security/capability_broker.py] | HPP | brokered capability | HPP must not run broker |
| Authority Registry (definitions) | **HPP** (IdentityAuthority, MissionAuthority, EvidenceAuthority) [E:ir/types.ts] | PING (enforces) | enforcement spec | PING must not define authorities |
| Authority Enforcement | **PING** (runtime) | HPP | enforcement result | HPP must not enforce |
| Compiler IR (Canonical IR) | **HPP** [E:src/constitution/ir/] | PING (consumes) | IR | PING must not modify |
| Generated Runtime (repositories/events/state-machines/projections/types) | **HPP** (generates) [E:src/generated/repositories/] | PING (consumes) | runtime | PING must not generate |
| Operational State (PostgreSQL tables: projects, tasks, sync_state, provider_mapping, workflow_execution, automation_runs, oauth_tokens) | **PING** (owns operational rows) [E:storage/postgres/models.py, docker/postgres] | HPP (triggers) | operational state | HPP must not own operational state |
| Provider State (Google Tasks, Calendar, Stripe, Drive) | **External provider** (Google/Stripe own) | PING (adapters sync) | provider sync | HPP/PING must not own provider data |
| Google Tasks | **Google** | PING (TaskProvider) | task node | HPP/PING must not own |
| Google Calendar | **Google** | PING | calendar event | — |
| Stripe | **Stripe** | PING | invoice/payment | — |
| Drive | **Google** | HPP (Mirror ref) | file ref | HPP references only |
| Neo4j (graph) | **PING** (projects tasks→nodes) [E:docker/qdrant+neo4j services] | HPP | graph nodes | HPP must not own graph |
| Qdrant (semantic memory) | **PING** (authors operational memory) [E:docker/qdrant] | HPP | vectors | HPP must not own |
| Ollama (AI) | **PING** (uses for AI automation) [E:docker/ollama] | HPP | AI output | HPP must not own |

---

## 2. Information Classification

Every major object classified as exactly one of: **Owned · Referenced · Observed · Derived · Claimed · Projected.**

- **Project** — Owned (HPP, system of record)
- **Customer** — Owned (HPP)
- **Estimate** — Owned (HPP)
- **Task** — Owned (Google); Referenced (PING by task id)
- **Calendar Event** — Owned (Google); Referenced (PING/HPP by id)
- **Photo** — Owned (HPP references Drive bytes); Referenced (Drive url/id)
- **Invoice** — Owned (HPP as record); Referenced (Stripe payment)
- **Crew / Vendor** — Owned (HPP)
- **Warranty / Inspection** — Owned (HPP)
- **Drive File** — Owned (Google Drive); Referenced (HPP via url/id)
- **Embedding** — Derived (from Photo via Vision)
- **Knowledge Claim** — Claimed (from Evidence/Observation via ObservationAuthority)
- **Replay Event** — Derived (event stream via PING replay)
- **Provider Token** — Referenced (PING holds; Google owns credential)
- **Workflow State** — Derived (from PING execution)
- **Planning Context** — Referenced (PING holds); Owned-intent (HPP)
- **Knowledge Fact** — Derived (replay-computed from Claims/Evidence)

---

## 3. HPP Responsibilities

Definitive list of everything HPP constitutionally **owns**. Ownership, not implementation.

- **Constitution** (frozen) — owns because it is the source of truth for business meaning. [E:src/constitution/]
- **Canonical IR** (ir/types.ts, snapshot-v1.json) — owns because the compiler consumes it. [E:src/constitution/ir/]
- **Compiler** (parser, AST, validator, normalizer, inspector) — owns because it produces runtime from IR. [E:src/compiler/]
- **Manifest** (GENERATION_MANIFEST.yaml) — owns because it is the source specification. [E:website/src/config/…/GENERATION_MANIFEST.yaml]
- **Business Objects** (Brand, Service, Project, Media, Story, Review, Pricing, Customer, Crew, Vendor, Estimate, Job) — owns because Tenant OS is the system of record. [E:src/constitution/objects/, website/src/config/*.json]
- **Capability Definitions** (contracts, ABI IDs: calendar.v1, payments.v2, messaging.v1) — owns because Tenant OS defines what capabilities *mean*. [E:GENERATION_MANIFEST.yaml]
- **Authority Definitions** (IdentityAuthority, MissionAuthority, EvidenceAuthority, ObservationAuthority) — owns because Tenant OS defines ownership. [E:ir/types.ts]
- **Workflow Definitions** (*.workflow.yaml: painting, flooring, repairs, kitchens, bathrooms, restoration, decks, fencing) — owns because Tenant OS defines business process. [E:directive Sprint-1 structure]
- **Event Definitions** (domain events) — owns because Tenant OS defines business events. [E:ir/types.ts Symbols]
- **Replay Certification spec** — owns because it is a constitutional policy. [E:compiler/__tests__/]
- **Generated Runtime** (repositories, events, state machines, projections, types) — owns because it *generates* them from IR. [E:src/generated/repositories/]
- **Knowledge type definitions** (Claim/Fact types) — owns because Tenant OS defines what a claim/fact *is*. [E:ir/types.ts]

---

## 4. PING Responsibilities

Definitive list of what PING constitutionally **owns**. Not what it currently implements; what it *should* own.

- **OAuth** (runtime + tokens) — owns because it brokers external auth. [E:notification/, runtime/security/]
- **Provider Adapters / runtime** (Google Tasks, Calendar, Stripe, Drive, Twilio, Kit) — owns because it integrates external systems. [E:notification/provider_*.py]
- **Automation Engine** — owns because it orchestrates task execution. [E:directive Sprint-1]
- **Workflow Execution** — owns because it runs workflows. [E:runtime/execution/]
- **Scheduling** — owns because the planner decides scheduling. [E:planning/]
- **Operational State** (PostgreSQL operational tables) — owns because it holds runtime state. [E:storage/postgres/, docker/postgres]
- **Event Store / Replay / Witness / Hashing** — owns because constitutional runtime. [E:storage/postgres/event_store, kernel/replay, kernel/build_witness.py]
- **Capability Broker / Runtime** — owns because it brokers capabilities. [E:runtime/security/capability_broker.py]
- **Authority Enforcement** — owns because it enforces at runtime. [E:runtime/security/]
- **Observability** — owns because it emits telemetry. [E:directive Sprint-1]
- **AI Automation** (Ollama, agents) — owns because it computes intelligence. [E:hermes/, docker/ollama]
- **Sync Engines** (PostgreSQL↔Google, etc.) — owns because it syncs. [E:directive Sprint-1]
- **Semantic Memory authorship** (Qdrant writes) — owns because it authors operational learnings. [E:docker/qdrant]
- **Projection into Neo4j** — owns because it projects tasks→graph. [E:docker/neo4j]

---

## 5. Shared Boundary

Everything intentionally **shared** (referenced/consumed, never co-owned):

- **Constitution** — HPP owns; PING consumes read-only. Shared so PING reasons over meaning without owning it.
- **Manifest** — HPP owns; PING references capability names. Shared so PING never redefines capabilities.
- **Capability Definitions** — HPP defines; PING implements adapters. Shared so PING doesn't redefine contracts.
- **EventEnvelope Schema** — PING owns envelope; HPP emits into it. Shared so both agree on event shape.
- **Authority Schema** — HPP defines; PING enforces. Shared so enforcement tracks definition.
- **Intent Definitions** — HPP defines intent; PING executes. Shared so execution tracks business intent.

**Why shared ownership does not violate constitutional ownership:** sharing is *reference/consume*, never *co-ownership*. The canonical owner of the meaning remains singular; every other party only references it. Two parties never own the same meaning.

---

## 6. Forbidden Ownership

**HPP must NEVER own:**
- Google Tasks · Calendar Events · Stripe Customers · Provider Tokens · OAuth Credentials · Notification Delivery state · Scheduling runtime · Operational Queues · External system data. [E:directive Sprint-1 Security Boundary]
- (HPP owns the *request* "NeedAppointment"; PING owns the *schedule*.)

**PING must NEVER own:**
- Business Objects · Compiler IR · Canonical Event Definitions · Generated Runtime · Replay Certification · Authority Definitions · Workflow Definitions · Business meaning. [E:directive Sprint-1 Out-of-Scope]
- (PING owns the *execution* of workflow; HPP owns the *definition*.)

---

## 7. Projection Boundary

Per external provider — Canonical Owner of Data · Projection Direction · Mutation Direction · Can Provider Become System of Record?

| Provider | Canonical Owner | Projection | Mutation | Canonical? |
|---|---|---|---|---|
| Google Tasks | **Google** | ProjectBooked → PING → Google Task | PING creates task | **NO** |
| Google Calendar | **Google** | PING → Calendar Event | PING schedules | **NO** |
| Stripe | **Stripe** | HPP Invoice ← Stripe | Stripe charges | **NO** |
| Drive | **Google** | HPP Media ← Drive file ref | Drive stores bytes | **NO** (HPP references only) |
| Twilio | **Twilio** | PING → Twilio message | Twilio sends | **NO** |
| Kit | **Kit** | PING → Kit | Kit delivers | **NO** |

External providers are never the system of record for HPP business meaning. HPP/Tenant OS remains canonical; providers are mirrors.

---

## 8. Compiler Boundary

**Compiler owns exactly:**
- Schemas (IR) [E:src/constitution/ir/types.ts]
- Canonical IR (snapshot-v1.json) [E:src/constitution/ir/snapshot-v1.json]
- Generators (repository, event, projection, replay, authority) [E:src/generators/]
- Canonical Definitions (types)
- Type Generation [E:src/generators/types.ts]
- Replay Maps
- State Machines
- Capability IDs · Authority IDs · Event Definitions (as generated types)

**Compiler MUST NEVER own:**
- Workflow execution · Scheduling · OAuth · Automation · Provider state · Operational queues. [E:directive Sprint-1 Out-of-Scope]
- (HPP "Runtime generation" = *generates* artifacts; PING *owns* the runtime that executes them — that is a runtime-boundary concern, not compiler.)

---

## 9. Runtime Boundary

**Runtime (PING constitutional) owns exactly:**
- Replay [E:kernel/replay]
- Witness [E:kernel/build_witness.py]
- Determinism (hashing, canonical ordering) [E:storage/postgres/models.py]
- Authority Enforcement [E:runtime/security/]
- Capability Broker [E:runtime/security/capability_broker.py]
- Event Store [E:storage/postgres/event_store]
- Outbox / Inbox [E:storage/postgres/models.py]

Note: HPP "Runtime generation" means HPP *generates* the runtime artifacts; **PING owns** the runtime that executes them.

---

## 10. Final Constitutional Split

The definitive architectural contract. For any object, a new engineer answers "Who owns this piece of information?" without reading code.

| Information | Canonical Owner | Representation | Consumers |
|---|---|---|---|
| Business Object (Project/Customer/Estimate/…) | HPP (Tenant OS) | JSON config + generated repository | PING (by id) |
| Manifest | HPP | YAML | Compiler, PING (capability names) |
| Canonical IR | HPP | TypeScript types + snapshot | Compiler, PING (consume) |
| Compiler | HPP | TS modules | — |
| Generated Runtime | HPP | TS artifacts | PING (execute) |
| EventEnvelope Schema | PING | Python model | HPP (emit), PING (store) |
| Event Definitions (domain) | HPP | IR Symbols | PING (execute) |
| Authority Definitions | HPP | IR Symbols | PING (enforce) |
| Authority Enforcement | PING | Runtime | HPP (receives result) |
| Capability Definitions | HPP | Manifest ABI IDs | PING (implement) |
| Capability Runtime | PING | Broker | HPP (request) |
| Workflow Definitions | HPP | YAML | PING (execute) |
| Workflow Execution | PING | Runtime state | HPP (triggers) |
| OAuth / Tokens | PING | Runtime | HPP (receives minimal task data) |
| Operational State | PING | PostgreSQL | HPP (triggers) |
| Google Tasks / Calendar / Stripe / Drive | External Provider | Provider API | PING (sync), HPP (reference) |
| Neo4j Graph | PING (projects tasks→nodes) | Graph DB | HPP (reference) |
| Qdrant Memory | PING (authors) | Vector DB | HPP (reference) |
| Ollama AI Output | PING | Model runtime | HPP (reference) |

---

# Final Question — Constitutional Ambiguities

Objects whose ownership **cannot currently be determined from the repositories**. These are the only remaining architectural questions before implementation.

1. **Knowledge — Claim vs Fact ownership split.**
   - Claim *types* are defined in HPP IR (ObservationAuthority emits Claims). [E:ir/types.ts Symbols]
   - Fact *computation* is PING (replay-computed from Claims/Evidence). [E:freeze "Knowledge is computed, not stored"]
   - Fact *content* is derived (no owner, computed from Evidence).
   - **Ambiguous:** is there a single canonical owner of "Knowledge" as a domain, or is it split (HPP=type/claim, PING=computation, none=content)? The freeze folded "Knowledge Constitution" into replay-computed Facts, but the compiler directive lists "Knowledge generation" under HPP. **UNRESOLVED.**

2. **Ollama / AI-generated output ownership.**
   - PING uses Ollama (deployment service) for AI automation. [E:docker/ollama]
   - PING *authors* semantic memory into Qdrant.
   - **Ambiguous:** is AI output "owned" by PING (as authored memory) or "derived" (ephemeral, non-canonical)? The boundary between PING-authored operational memory (owned) and transient AI output (derived) is not encoded in the repos. **UNRESOLVED.**

3. **Planning Context canonical owner.**
   - HPP defines *intent* (NeedAppointment). [E:GENERATION_MANIFEST.yaml]
   - PING holds *execution context* (planner state). [E:planning/]
   - **Ambiguous:** is "Planning Context" owned by HPP (intent meaning) or PING (execution context), or is the context itself a derived/referenced artifact with no canonical owner? Not determinable from current repos. **UNRESOLVED.**

All other objects in the platform resolve to a single canonical owner per the Final Constitutional Split table. Only the three above remain genuinely ambiguous and require a definitional decision before implementation.
