# READ-ONLY PLANNING REVIEW — Next-Phase Compiler-Driven Strategy

**Mode:** Planning only. No implementation. No restructuring of code.
**Basis:** Verified state of `happy-place-platform` (HPP) and `constitutional-runtime` (PING) from this session's audits, the Repository Generator delivery, and `SPRINT4_INFRASTRUCTURE_AUDIT.md`.
**Evidence tags:** [E:file] = verified this session.

---

## 1. Verified Current State (what is actually done)

**Constitutional platform — ~85–90% complete (confirmed):**
- 7 governance specs + generation manifest + convergence synthesis. [E:website/src/constitution/governance/]
- 69 canonical business objects instantiated. [E:website/src/constitution/objects/]
- Canonical IR + compiler front-end: parser → AST → validator → normalizer → inspector; 90/90 tests. [E:website/src/constitution/ir/, website/src/compiler/__tests__/]
- Repository Generator built, runs, emits 10 repositories + 10 tests, 0 tsc errors, 50 jest tests pass. [E:website/src/generated/repositories/]

**Compiler-driven automation pipeline — ~60–70% complete (confirmed):**
- DONE: compiler front-end, Canonical IR, Repository generator (one of the generators).
- NOT DONE: Workflow compiler, Event generation, Capability-registry generation, State-machine generation, Deployment-artifact generation.

The user's 85–90% / 60–70% estimate is **consistent with verified state**.

---

## 2. Point-by-Point Assessment of the Proposed Strategy

### 2.1 Workflow Compiler — CONFIRMED MISSING
Current: `*.workflow.yaml` would be handwritten under `automation/templates/` (PING Sprint 1 structure). [E:directive structure; `automation/` does not exist in PING]
Target: `Constitution → Workflow IR → Generated Workflow Graph → PING executes`.
Aligned with freeze: HPP owns workflow *definitions*; compiler generates; PING only *executes*. **No workflow compiler exists — highest-leverage gap.**

### 2.2 Event Generation — CONFIRMED GAP
Four events (`EstimateSent`, `ProjectBooked`, `WarrantyCreated`, `InspectionScheduled`) are listed as "still handwritten." Verified: the IR snapshot's generated events are mission-scoped (`EstimateCreated/Accepted`, `JobCreated/Assigned/Completed`, `ProjectCreated/Completed`). [E:website/src/constitution/ir/snapshot-v1.json]
The 4 named events are **not present in the generated IR event set** — they live outside the compiler. Target (`Constitution → Generated TS/Python/Replay/Registry`) is correct: pull them into IR as generated types. **Gap confirmed.**

### 2.3 Capability Registry Generation — CONFIRMED GAP
Target: `Capability → Compiler → Registry → PING` (not `Registry.ts` handwritten).
The IR defines capabilities (calendar.v1, payments.v2) but no generated *registry artifact* exists. [E:GENERATION_MANIFEST.yaml capabilities]
**Gap confirmed** — a generator is missing, not a refactor.

### 2.4 Workflow State-Machine Generation — CONFIRMED GAP
Target: compiler generates the state machine; PING only executes transitions.
No state-machine generator exists. [E:website/src/generated/repositories/ has repos but no state machines]
**Gap confirmed.**

### 2.5 Automation Readiness — REFINEMENT (narrows PING ownership)
Proposal: automation is not the blocker; the blocker is automation owning knowledge it shouldn't. PING should own **only**: Execution, Scheduling, Provider State, OAuth, Retries, Queues, Health, Metrics.
This **narrows** the PING ownership in `SPRINT4` (which gave PING: Neo4j projection, Qdrant memory authorship, AI automation). The narrower list is the correct constitutional target. **See §3 correction.**

### 2.6 Oracle as Tenant Platform — NEW TIER (reconcile with SPRINT4)
Proposal introduces a **third constitutional tier** (Oracle = tenant platform/hosting) on top of HPP (compiler/knowledge) and PING (execution).
Oracle owns: Tenant Registry, Provisioning, Identity (IAM/tenant), Secrets Vault, OCI Functions, OCI Events, Object Storage, Notifications, API Gateway, Logging, Monitoring, IAM, Networking, Certs, Backups.
This is compatible with `SPRINT4` **only if** Oracle owns *infrastructure/tenancy*, not *constitutional meaning*. The one overlap to resolve: **"Identity"** — Oracle = IAM/tenant auth infrastructure; HPP = business identity *meaning* (IdentityAuthority owns Customer/Crew/Vendor). Must be split explicitly. **Flagged ambiguous (see §4).**

### 2.7 What Stays Off Oracle — CONFIRMED
Compiler, Replay, Witness, Neo4j graph, Generated runtime remain constitutional (HPP/PING), not hosted on Oracle. Consistent with freeze. **Confirmed.**

### 2.8 Deployment Artifact Generator — CONFIRMED MISSING STAGE
Proposal: beyond TS, generate Terraform / OCI Resource Manager / Docker / Helm / Flyway / Liquibase / Secrets / OCI Functions / API Gateway / IAM / Event Rules.
No such generator exists. [E:website/src/generators/ has only repository.ts; no deployment generator]
**Gap confirmed** — this is the missing pipeline stage.

### 2.9 Next-Sprint Scoring (Tier 1/2/3) — ALIGNED
Tier 1 (workflow compiler, event generation, eliminate drift, e2e replay verification), Tier 2 (capability registry gen, state-machine gen, deployment-artifact gen), Tier 3 (Oracle TenantOS hosting, OCI provisioning, multi-tenant bootstrap, tenant lifecycle). Consistent with a generator-focused finish. **Confirmed.**

### 2.10 Overall Assessment — CONFIRMED
85–90% constitutional, 60–70% compiler automation. Remaining effort = high-leverage *generators* (workflow, event, capability, state-machine, deployment), not broad infra. **Consistent with verified state.**

---

## 3. Corrections to SPRINT4 (required by this proposal)

`SPRINT4_INFRASTRUCTURE_AUDIT.md` must be revised on two points once this strategy is ratified:

1. **Neo4j + Qdrant move from PING → HPP.**
   SPRINT4 assigned PING "projection into Neo4j" and "Qdrant memory authorship." This proposal puts Neo4j + Qdrant under **HPP (Knowledge)**. PING's ownership narrows to the execution-only list (§2.5). SPRINT4's PING row should drop Neo4j/Qdrant/knowledge.
2. **PING ownership narrows.**
   SPRINT4's "PING Responsibilities" included AI Automation (Ollama), Sync, Observability, Neo4j, Qdrant. The refined target removes knowledge/semantic-memory/neo4j from PING. PING = thin execution layer (Execution, Scheduling, Provider State, OAuth, Retries, Queues, Health, Metrics).

These are *planning corrections*, not code changes.

---

## 4. Constitutional Ambiguities Requiring a Decision (NEW, beyond SPRINT4's 3)

1. **Oracle "Identity" split.** Oracle = IAM/tenant auth; HPP = business identity meaning. Must be defined so Oracle's "Identity" does not become canonical owner of Customer/Crew/Vendor (which remain HPP). [E:ir/types.ts IdentityAuthority]
2. **Oracle as meaning-owner vs host.** Oracle must be explicitly a *hosting/tenancy* layer, never a constitutional meaning-owner, to stay compatible with the SPRINT4 single-owner invariant.
3. **Where do OCI Functions / OCI Events live relative to PING Automation?** If Oracle Functions execute automation, does PING "own" them or does Oracle? Needs a boundary (likely: PING defines automation logic; Oracle hosts execution).

The original SPRINT4 3 ambiguities (Knowledge claim/fact, Ollama output, Planning Context) remain open.

---

## 5. Residual Risk (read-only observation)

The 60–70% compiler-automation estimate assumes the **compiler front-end (90/90) is reusable** for the new generators (workflow IR, event gen, capability registry gen, state-machine gen, deployment gen). If any new generator requires a *compiler change* (new IR node kinds, new validator rules), that breaks the freeze and must be flagged per the STOP rule. The workflow IR especially may need new IR primitives (`IRWorkflow`, `IRTransition`) not present in `ir/types.ts` today. [E:website/src/constitution/ir/types.ts — no Workflow/Transition kinds]

---

## 6. Conclusion (planning only)

The proposed strategy is **sound and freeze-compatible**: compiler owns all generation (workflows, events, capabilities, state machines, deployment artifacts); PING becomes a thin execution layer; HPP retains constitution + knowledge (Neo4j/Qdrant); Oracle hosts tenancy/infrastructure without owning meaning.

Remaining work is concentrated in **5 high-leverage generators** (workflow compiler, event generation, capability-registry generation, state-machine generation, deployment-artifact generation) + the Oracle tenancy tier. No new constitutional primitives are required unless the workflow IR needs new node kinds (flagged above).

No implementation performed. This is a planning review only.
