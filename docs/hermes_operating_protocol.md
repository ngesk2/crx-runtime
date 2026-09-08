# Hermes Operating Protocol

Date: 2026-08-06
Status: PLANNING (READ-ONLY)
Purpose: Define how a headless engineering worker ("Hermes") operates against the PING constitutional runtime — the operating protocol, restricted authority, deployment posture, and the continuous engineering pipeline it drives. Grounded in the verified deployment topology and runtime surface. No code changes.

## 1. Current Hermes Reality (verified)

- Hermes is **EXTERNAL**: host install at `C:\Users\nolan\AppData\Local\hermes\hermes-agent\`. The repo contains **zero code imports** of Hermes — only documentation references and a `workspace/hermes/memory/state-snapshots/` `.env` snapshot.
- Hermes' only current production role: its bundled Node binary (`C:\Users\nolan\AppData\Local\hermes\node\node.exe`) launches the PowerToys autocomplete service via `%STARTUP%\PingAutocomplete.vbs` (hidden, window style 0). That service runs on `127.0.0.1:11999` and proxies/streams to Ollama.
- There is **no headless worker container**, **no oracle deployment**, **no restricted operating protocol**, and **no CI/CD** anywhere in the repo today.

## 2. Design Principles for the Hermes Protocol

1. **Hermes is an operator, never a store.** Hermes interacts with the runtime exclusively through the gateway HTTP API (the constitutional boundary). It never touches Postgres/Qdrant/Ollama directly.
2. **Restricted operating protocol** — Hermes has no ambient authority. Every action it can take is enumerated (see §5). Anything else is forbidden by default.
3. **Every Hermes action is an event.** Observations, commands, decisions, and completions cross the Canonicalization Boundary and are recorded in the event spine. "If it wasn't canonicalized, it doesn't exist."
4. **Approval-gated mutation.** Hermes may propose; a human (or a governance gate) approves. Rejection feeds negative weight (the Slice 2 promotion semantics).
5. **Determinism and reversibility.** No `Math.random()` IDs, no wall-clock dependence, every change independently reversible.

## 3. Deployment Posture (target)

| Component | Deployment | Posture |
|---|---|---|
| **Hermes headless worker** | Worker on the host or a container in `ping_internal`, consuming the gateway API | Headless: no TTY, no interactive surface; logs + events only |
| **Oracle** | A dedicated process (or the Orca `/orchestration` fabric) that evaluates Hermes proposals against evidence and constitutional gates | Read-mostly evaluator; its outputs feed the Decision Inspector |
| **Restricted protocol** | Enforced by Hermes' own action allowlist (§5) + gateway governance validation | Hermes has no credentials beyond a single API token scoped to allowed routes |
| **Continuous pipeline** | GitHub Actions (or scheduled missions via the mission runtime) driving: build → test → audit → gate → report | All stages emit events; a broken gate aborts the chain |

Deployment gaps to close (from `docs/deployment_topology.md` §10): 3 missing worker Dockerfiles, env inconsistency, `compose.brain.yaml` external:true inconsistency, and **no CI/CD exists** — the continuous pipeline requires a CI host (GitHub Actions) or a mission-driven cron inside worker-runtime.

## 4. The Continuous Engineering Pipeline

```
 git push / scheduled trigger
        │
        ▼
 1. BUILD       ── compile/typecheck/lint      (node --check, tsc, npm test)
        │  emit: PIPELINE_BUILD_STARTED → COMPLETED/FAILED
        ▼
 2. TEST        ── full regression suite       (the 16 suites in AGENTS.md §Slice2)
        │  emit: PIPELINE_TEST_RESULTS (counts, failures)
        ▼
 3. AUDIT       ── merge-gate checks           (6 gates: time/hash/random/clone/subprocess/imports)
        │  emit: MERGE_GATE_PASSED / MERGE_GATE_FAILED
        ▼
 4. GATE        ── behavior-preservation check  (no deletion without golden-test proof)
        │
        ▼
 5. REPORT      ── pipeline report to Decision Inspector /ops + Mission Control
```

Every stage is an event; a failure at any stage stops the chain and creates a mission with the failure evidence attached. The pipeline is **not** a new subsystem: it is the existing `worker-runtime` polling loop + the existing `/orchestration` engine + the existing merge-gate logic (`orchestration/merge_gate.js`) scheduled on a cadence.

## 5. Restricted Operating Protocol — Action Allowlist

Hermes' world is a finite set of HTTP actions against the gateway. Everything else is denied.

### Allowed (read — always available)
- `GET /ops/status`, `/ops/health`, `/ops/drift`, `/system/state`, `/constitution`, `/runtime/fingerprint`
- `GET /knowledge/stats`, `/knowledge/nodes`, `/knowledge/edges`, `/knowledge/nodes/:id/neighborhood`
- `GET /missions/stats`, `/missions/pending`, `/missions/active`
- `GET /events`, `/events/recent`, `/events/stats`, `/events/stream/:stream`
- `GET /ai/providers`, `/ai/health`
- `GET /connectors/capabilities*`, `/connectors/:name/health`

### Allowed (write — with governance)
- `POST /ingest` — canonicalize an observation (namespace `core::system` for engineering observations, `core::owner` for personal)
- `POST /missions` — create a mission
- `POST /knowledge/nodes` — add a knowledge node (status `candidate`; never `approved` — only humans approve)
- `POST /events` — emit a canonical event (must pass governance validation)

### Forbidden (default deny)
- Direct Postgres/Qdrant/Ollama/network/filesystem access from Hermes' process.
- `DELETE`/`UPDATE` on any store (no data mutation; ADD-only via events).
- Creating or mutating authorities, contracts, or the event registry.
- Spawning subprocesses outside the pipeline runner (the P9 subprocess gate).
- Any action that bypasses `/ingest` or the event spine.

### Oracle (evaluator) rights
The oracle may read everything Hermes can read plus `GET /governance/violations` and `/mc/evidence/:canonicalHash` (glue route G3). It emits evaluation events (`consensus_started`, `consensus_completed`, `merge_gate_passed/failed`) — never store writes.

## 6. Hermes Mission Lifecycle

```
create mission (POST /missions)  ── status=created
   │  emit: MISSION_CREATED
   ▼
dispatch (worker-runtime)        ── status=assigned → running
   │  emit: MISSION_ASSIGNED, MISSION_STARTED
   ▼
Hermes executes (restricted actions, all HTTP)
   │  emit: worker_execution_started/completed
   ▼
proposal + evidence (artifact store / knowledge nodes)
   │  emit: artifact_produced
   ▼
oracle evaluation ── consensus + merge gate
   │  emit: consensus_completed, merge_gate_passed/failed
   ▼
human approval (Decision Inspector) ── approve/reject via promotion events
   │  emit: SNIPPET_APPROVED / SNIPPET_REJECTED (or AI_RESPONSE_*)
   ▼
apply (small, reversible, one-purpose change) ── status=completed
   ▼
replay/witness/lineage attach when chain activated (future)
```

Known to be imperfect today: phantom-complete (scheduler marks done at dispatch, `mission_scheduler.js:199-205`), and no verification decision exists in the current worker path. The protocol **assumes** the verification gate; closing the gap is a decision-graph change tracked separately (see `PING_AGENT_DECISION_GRAPH.md`).

## 7. Hermes Operating Rules (the standing orders)

1. **Read this file and AGENTS.md at session start.** Every Hermes session begins with the constitution and this protocol.
2. **Prefer extension over parallel implementation.** If the runtime already does X, use X.
3. **<200 lines per change, one purpose per commit, independently reversible.**
4. **No new constitutional abstractions.** EvidenceAuthority, Hybrid Search, Knowledge Promotion, Verification, Canonical Objects, Replay, Event lineage already exist — use them.
5. **Report honestly.** Use lifecycle states (implemented / wired / exercised / production / dormant). Never "complete" where the truth is "not wired."
6. **Append to AGENTS.md at the end of every logical unit.**
7. **Never commit unless explicitly instructed.** (Matches repository policy.)
8. **Never hand-edit generated artifacts** — regenerate via `event_generator.js` etc.
9. **The merge gate is the final authority.** Blocking violations must be zero before any commit.

## 8. Readiness Assessment

| Requirement | Status |
|---|---|
| Hermes install present | ✅ external host install |
| Headless worker (no TTY) | ❌ none |
| Oracle deployment | ⚠️ Orca `/orchestration` fabric exists, business-disconnected |
| Restricted protocol | ❌ none — this spec defines it |
| Continuous pipeline | ❌ no CI/CD; needs GitHub Actions or mission-driven cron |
| Pipeline report surface | ⚠️ `/ops/*` + Decision Inspector exist; pipeline metrics route (`/ops/pipeline`) planned in Slice 4 |

## 9. Next Steps (gated on this spec's acceptance)

1. Stand up Hermes headless worker as a container in `ping_internal` (or a host service) consuming only the §5 allowlist.
2. Wire the oracle to the existing Orca `/orchestration` engine (single chokepoint `gateway_runtime.js:66` → `engine.js`), enabled behind a flag (currently `discoverOllama:false`).
3. Add the continuous pipeline as a GitHub Actions workflow (build→test→audit→gate→report) with a `PIPELINE_*` event family registered via `event_generator.js`.
4. Fix the three missing worker Dockerfiles + env inconsistency before any container-based Hermes deployment (topology §10).
5. Do NOT begin until Docker is running and the live E2E chain is verified.
