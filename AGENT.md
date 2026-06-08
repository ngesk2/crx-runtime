<!-- crx-authority: AUTHORITATIVE | layer: agent-constitution | modify: AMEND+APPROVE | consumers: all-agents, runtime, infra -->
<!-- crx-enforcement: modify=Owner | approve=all-stakeholders | record=AMEND-XXX+AUD-XXX | evidence=replay-verification | freeze=no | status=CANONICAL -->
# CRX-RUNTIME CONSTITUTIONAL AGENT DIRECTIVE

**Version:** 0.1  
**Status:** Canonical Root Instruction  
**Authority:** Repository Constitutional Layer — supreme law for all agent execution in this workspace

---

## Authority Hierarchy

When laws conflict, higher rows prevail.

| Priority | Document | Scope |
|----------|----------|-------|
| 1 | **This file (`AGENT.md`)** | Agent execution, infrastructure, consolidation, audit behavior |
| 2 | `knowledge/authoritative/UCIA-CONSTITUTION-v1.0.md` | Kernel primitives, survivability, replay semantics |
| 3 | `vos/cos/CONSTITUTION.md` | Engineering process, WAIT default, 8-stage gate |
| 4 | `agents/agent_permissions.md` | Bounded agent permission matrix |
| 5 | Domain specs under `knowledge/authoritative/` | Specialized constitutional layers |

**Bridge documents (do not duplicate — read and canonicalize):**
- `knowledge/derived/cos-mapping.md` — UCIA ↔ COS unification
- `vos/cos/ARCHITECTURE.md`, `vos/cos/STRUCTURE.md` — COS layout
- `vos/cos/refactoring/repository-cleanup-plan.md` — prior consolidation intent

---

## Mission

Transform this repository toward:

**A replayable constitutional cognition substrate.**

This repository is **NOT**:
- an AI app
- an automation playground
- a multi-agent experiment
- a framework showcase

This repository **IS**:
- constitutional infrastructure
- deterministic runtime substrate
- event lineage system
- replay engine
- policy engine
- audit system
- observability system

All future capabilities derive from this foundation. Education, FERPA, pedagogy, humor transforms, and district ops are **domain layers** — never kernel layers.

---

## Primary Optimization Targets

**Always optimize for:**
- replayability
- auditability
- lineage integrity
- deterministic reconstruction
- policy enforcement
- observability
- infrastructure coherence
- provider portability
- operational simplicity
- long-term maintainability

**Do NOT optimize for:**
- feature count
- abstraction quantity
- framework novelty
- autonomous behavior
- speculative architecture
- microservice proliferation

Before any implementation, ask: does this improve replayability, auditability, lineage, deterministic reconstruction, policy enforcement, observability, or provider portability? If not, **reject it**.

---

## PRIMARY LAW — REUSE BEFORE CREATE

Before creating **ANY** file:

1. Search the entire repository
2. Search schemas (`knowledge/authoritative/*.schema.json`, `vos/cos/schema/`, `vos/viz/schema/`)
3. Search prompts and engines (`vos/cos/engines/`, `vos/cos/templates/`)
4. Search infrastructure (`agents/docker-compose.yml`, future `infra/`)
5. Search orchestration logic (`vos/cos/protocols/`, `vos/cos/governance/`)
6. Search event systems (`runtime/kernel/commit-service/src/events/`, `vos/cos/audit/`)
7. Search replay systems (`knowledge/authoritative/replay-reconstruction.md`, `knowledge/derived/*replay*`)
8. Search policy systems (`agents/agent_permissions.md`, `knowledge/authoritative/mutation-governance-model.md`)
9. Search observability and runtime definitions

**If functionality overlaps → MERGE IT.**  
**If systems duplicate → CANONICALIZE THEM.**  
**If architecture forks → SIMPLIFY IT.**

New files require explicit justification: what was searched, what was found, why extension was insufficient.

**You MUST NOT:**
- create parallel systems or `v2` folders
- fork architecture concepts
- generate speculative abstractions
- introduce framework sprawl
- create duplicate event models, policy engines, or replay logic

---

## Repository Model

**GitHub is the Constitutional Root Filesystem.**

GitHub stores: doctrine, schemas, prompts, policies, invariants, contracts, replay specifications, architectural decisions.

GitHub does **NOT** store: hidden runtime state, mutable truth, private agent memory, unverifiable state transitions.

### Current Workspace Layout

```
CRX/                          ← constitutional workspace root (no root .git yet)
├── AGENT.md                  ← this file (agent execution law)
├── knowledge/                ← UCIA specs, schemas, proofs (git: master)
├── vos/                      ← COS governance + VOS diagrams (git: main)
├── runtime/                  ← kernel commit-service (git: audit-hardening)
├── agents/                   ← agent scaffold + broken compose (no .git)
└── infra/                    ← TARGET: canonical infrastructure (not yet created)
```

Commits = immutable cognition checkpoints. PRs = constitutional proposals. CI = constitutional verification.

---

## Foundational Primitives

Everything derives from these five primitives:

| Primitive | Question |
|-----------|----------|
| **Provenance** | What happened? |
| **Claim** | What is asserted? |
| **Decision** | What was accepted? |
| **Fact** | What is currently true? |
| **Rule** | What constrains truth? |

**Canonical schema locations (must converge, not fork):**
- Claims/decisions: `knowledge/authoritative/claim.schema.json`, `decision.schema.json`
- COS audit events: `vos/cos/schema/audit-event.schema.json`
- Runtime events: `runtime/kernel/commit-service/src/persistence/ledger_schema.sql`
- Argument graphs: `vos/cos/schema/argument-graph.schema.json`

**Derived systems (never own truth):** Events, Capabilities, Obligations, Dashboards, Reports, Views, Replay, Agents.

---

## Event Law

**Agents do NOT own truth. Events own truth.**

Agents **may:** analyze, classify, summarize, propose, validate, repair, generate diffs, generate tests.

Agents **may NOT:** mutate canonical truth directly, bypass policy, fabricate lineage, overwrite history, bypass replay validation.

**Required execution path:**

```
Event → Policy → Assignment → Execution → Validation → Replay Check → Audit Event
```

### Canonical Event Envelope (target — consolidate existing schemas into this)

```json
{
  "event_id": "",
  "event_type": "",
  "actor_id": "",
  "timestamp": "",
  "payload": {},
  "lineage": {},
  "policy_version": ""
}
```

No competing event schemas allowed. Current drift to resolve:
- COS `audit-event.schema.json` (governance audit)
- Runtime `execution_events` table (artifact commits)
- UCIA claim/decision lifecycle events

---

## Infrastructure Law

There must be **ONE** canonical infrastructure stack.

**Canonical path:** `infra/`

**Required layout:**

```
infra/
├── docker-compose.yml
├── .env
├── postgres/
├── redis/
├── ollama/
├── observability/
├── scripts/
└── volumes/
```

All services boot from `docker compose up -d` **ONLY**. No ad hoc infrastructure. No hidden services. No duplicate compose stacks. No agent-owned runtimes.

**Required core services:** postgres, redis, ollama, api, worker, scheduler, prometheus, grafana, loki, tempo.

Optional infrastructure requires justification.

**Current reality:** `agents/docker-compose.yml` exists (4 agent services, broken — missing code/dirs). No `infra/`. Runtime expects external Postgres via `DATABASE_URL`. **Consolidate into `infra/`; do not add a third compose stack.**

---

## Worktree Law

Agents **MUST** use git worktrees. **NEVER** create separate repository clones.

```
main repository → shared infrastructure → isolated worktrees → isolated branches
```

Benefits: shared lineage, shared infra, deterministic rebuilds, reduced entropy, replayable history.

Sub-repos today: `knowledge`, `vos`, `runtime`. Long-term: unify or meta-orchestrate without forking truth.

---

## Configuration Law

Centralize configuration into `infra/.env`.

Do not scatter: ports, runtime flags, service endpoints, model names, feature flags, secrets, observability settings.

**Current:** zero `.env` files exist. Runtime uses `DATABASE_URL` only.

---

## Observability Law

Observability derives from lineage.

Required outputs: replay timelines, lineage chains, event traces, policy decisions, execution graphs, constitutional violations, repair workflows.

All telemetry systems must converge. Do not install full observability before events are canonical.

**Current:** `pino` logger in runtime only. No metrics, traces, or log aggregation.

---

## Security Law

Assume all supply chains are hostile.

Audit: dependencies, CI/CD, container privilege boundaries, secrets, identity flows, authorization flows, replay integrity, provenance integrity, mutable runtime state.

Prioritize: deterministic builds, minimal trust surfaces, signed artifacts, SBOM readiness, audit lineage, immutable event history.

**Target architecture:**
```
Tailscale → Reverse Proxy → Auth Gateway → Policy Engine → Event Runtime → Replay Engine
```

Security = replayable causality. The event log is the security ledger.

See: `knowledge/authoritative/constitutional-threat-model.md`

---

## Agent Behavior Law

Agents are **execution transforms**, not authorities.

Agents **must:**
- explain reasoning
- preserve lineage
- justify changes
- minimize entropy
- prefer extension over replacement
- prefer deletion over duplication
- prefer canonicalization over expansion

Agents **must NEVER:**
- silently rewrite architecture
- introduce hidden state
- invent infrastructure
- fork schemas
- duplicate orchestration
- bypass validation or replay checks

### Bounded Agent Workers (not autonomous chaos)

| Agent Class | Allowed |
|-------------|---------|
| Refactor Agent | modify implementation only |
| Schema Agent | cannot alter constitutional contracts |
| Replay Agent | read-only |
| Audit Agent | append-only |
| Policy Agent | propose but not merge |

Permission matrix: `agents/agent_permissions.md`

**Three agent ontologies exist today — canonicalize to one:**
1. Docker agents (Planner/Refactor/Documentation/Governance) in `agents/`
2. Creator workflow agents in `knowledge/derived/agent-workflow-topology.md`
3. UCIA constitutional agents in `knowledge/authoritative/constitutional-agent-infrastructure.md`

---

## Architectural North Star

```
GitHub Kernel
  ↓
Event Runtime          ← runtime/kernel/commit-service (partial)
  ↓
Replay Engine          ← knowledge/authoritative/replay-reconstruction.md (spec only)
  ↓
Policy Engine          ← scattered; must unify
  ↓
Tool Routing           ← MCP/Composio direction
  ↓
Agent Runtime          ← agents/ (scaffold)
  ↓
Observability Layer    ← not built
  ↓
Domain Layers          ← education, FERPA, pedagogy (later)
```

**Transformer analogy (design compass, not implementation mandate):**
- Residual stream → event bus / cognition stream
- Attention → context routing / MCP selection
- FFN → specialized transforms/services
- LayerNorm → policy stabilization
- KV Cache → replay snapshots

---

## Mandatory Audit Behavior

Continuously search for:
- duplicate schemas, prompts, compose files, runtime definitions
- duplicate orchestration, replay logic, policy logic
- hidden mutable state, hardcoded ports
- committed build artifacts or dependencies
- fragmented observability or infrastructure

**Primary responsibility: reduce architectural entropy.**

---

## Required Output Format (Major Changes)

For ALL major changes, produce:

1. **Duplicate Systems Report**
2. **Consolidation Plan**
3. **Architectural Drift Report**
4. **Infrastructure Report**
5. **File-Level Recommendations**
6. **Replay Risk Assessment**
7. **Policy Risk Assessment**

Every recommendation must include:

```
FILE:
WHY:
MERGE INTO:
DELETE:
KEEP:
RISK:
```

---

## Current Phase — Infrastructure Consolidation

**Phase 1 goal:** single deterministic local runtime via `docker compose up`.

| Component | Status | Canonical Target |
|-----------|--------|------------------|
| `infra/` | Missing | Create and own all compose |
| postgres | Client only (`runtime`) | `infra/postgres/` |
| redis | Spec only | `infra/redis/` |
| ollama | Absent | `infra/ollama/` |
| api | Partial (`commit-service` :8080) | `infra/` service wrapping runtime |
| worker | Absent | `infra/` |
| scheduler | Absent | `infra/` |
| observability | Absent | `infra/observability/` |
| agents compose | Broken scaffold | Merge as optional profile under `infra/` |

**Do FIRST:** consolidate Docker Compose, centralize `infra/.env`, unify event definitions, unify schemas, unify replay logic, unify policy evaluation, unify agent interfaces.

**Do NOT YET:** microservices, Kubernetes, agent swarms, distributed inference, 40 frameworks, speculative abstractions, unnecessary repo splits.

---

## Language Discipline

Stay mostly **TypeScript** and **Python** until invariants stabilize.

Eventual split: Rust (replay/security/kernel), Go (infra/control plane), Zig (ultra-low-level). **Do not fragment now.**

---

## Final Rule

The goal is **NOT** to build autonomous agents.  
The goal is **NOT** to maximize automation.  
The goal is **NOT** to create abstraction layers.

The goal is to evolve this repository into:

**A deterministic constitutional cognition substrate** where provenance, claims, decisions, facts, and rules form canonical truth — and everything else remains derived.

Coding agents are **workers inside a constitutional operating substrate**, not truth authorities.
