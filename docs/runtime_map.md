# Runtime Map

Date: 2026-08-06
Status: PLANNING (READ-ONLY)
Purpose: Map every existing constitutional runtime capability to the operator surfaces and implementation backlog. This is the canonical "what exists, where it lives, what it powers" reference. It grounds `PING_MISSION_CONTROL_AGENT_INTERFACE_SPEC.md`, `PING_UI_COMPONENT_HARVEST_MAP.md`, and the PSIE spec. No code changes.

## 1. Capability → Surface Map

| Capability | Runtime asset | File | Production-wired | Powers surface(s) |
|---|---|---|---|---|
| **Unified event spine** | UnifiedEventRuntime (dedup via `ON CONFLICT(event_id) DO NOTHING`, governance validation) | `ping-runtime/events/unified_event_runtime.js` | YES | Agent Dashboard, Knowledge Explorer, Mission Timeline |
| **Canonicalization boundary** | CanonicalizationService + `/ingest` | `ping-runtime/canonicalization/canonicalization_service.js`, `gateway/routes/ingest.js` | YES | Knowledge Explorer (ingest surface) |
| **Canonical Objects** | `createCanonicalObject` / `verifyCanonicalObject` | `gateway/canonical_object.js` | YES (primary producers) | Decision Inspector, Knowledge Explorer |
| **EvidenceAuthority** | accumulate / verify / rank | `ping-runtime/evidence/evidence_authority.js` | YES (Slice 2) | Knowledge Explorer, Decision Inspector |
| **Hybrid Search** | semantic (Qdrant) + verify + KG context | `ping-runtime/search/hybrid_search.js`, `POST /knowledge/search` | YES (Slice 2) | Knowledge Explorer, Collaboration Graph |
| **Knowledge Promotion** | SNIPPET_APPROVED/REJECTED, AI_RESPONSE_ACCEPTED/REJECTED | `ping-runtime/knowledge/knowledge_promoter.js` | YES (Slice 2) | Knowledge Explorer (approval workflow) |
| **Knowledge Graph** | Postgres nodes/edges + namespace/status/confidence | `ping-runtime/knowledge/knowledge_graph.js` | YES | Collaboration Graph, Knowledge Explorer |
| **Verification** | `verifyCanonicalObject` + EvidenceAuthority trace-to-event | `gateway/canonical_object.js`, evidence_authority | YES | Decision Inspector |
| **Replay** | ReplayAuthority/ReplayExecutor | `runtime/replay/` (TS, untracked), `runtime/workers/replay_worker.py` | **NO — dormant.** Nothing emits REPLAY_VERIFY; 0 HTTP endpoints | (future) Mission Timeline detail |
| **Event lineage** | LINEAGE_CREATED worker (registered, unreachable) | `ping-runtime/workers/canonical_workers.js` | **NO — dead at stage 6** | (future) Decision Inspector provenance |
| **Mission runtime** | MissionRuntime (`ping_missions`) | `ping-runtime/orchestration/mission_runtime.js` | YES | Mission Timeline, Agent Dashboard |
| **Worker chain** | 9 canonical workers (obs→claim→class→rec→proj live) | `ping-runtime/workers/canonical_workers.js` | YES (5 stages honest) | Agent Dashboard, Knowledge Explorer |
| **AI Runtime** | AIRuntime + OllamaProvider | `ping-runtime/ai/ai_runtime.js`, `ollama_provider.js` | YES | Capability Explorer, AI Workspace |
| **Capability Registry + OAuth** | 9 categories, 15+ providers | `ping-runtime/connectors/capability_registry.js`, `oauth_provider.js` | YES | Capability Explorer |
| **Event Governance** | NAMESPACE_OWNERS PING/HPP | `gateway/.../event_governance.js` | YES | Decision Inspector, Capability Explorer |
| **Generated registries** | 231 events / 31 capabilities / 20 workflows / 21 state machines | `gateway/generated/` | YES (boot, hash-validated) | Decision Inspector (`/ops/status`, `/constitution`) |
| **Orca execution fabric** | Engine/Consensus/ArtifactStore/WorkerPort | `orchestration/execution/` | REACHABLE via `/orchestration`, business-disconnected | (future) Decision Inspector, Evolution layer |
| **Repository intelligence** | Constitutional Compiler (TS, proof.json), IntelligenceGraph, CanonicalObjectGenerator | `constitutional-compiler/`, `orchestration/intelligence_graph.js`, `gateway/canonical_object_generator.js` | **NO — compiler output unconsumed; generator not on production path** | (future) PSIE Observation/Evolution |

## 2. Lifecycle State by Capability

| Capability | Implemented | Wired | Exercised | Production |
|---|---|---|---|---|
| Event spine | ✅ | ✅ | ✅ (test suite) | ✅ |
| Canonicalization | ✅ | ✅ | ✅ | ✅ |
| Canonical Objects | ✅ | ✅ | ✅ | ✅ |
| EvidenceAuthority | ✅ | ✅ | ✅ (12/12) | ✅ |
| Hybrid Search | ✅ | ✅ | ✅ (10/10) | ✅ |
| Knowledge Promotion | ✅ | ✅ | ✅ (10/10) | ✅ |
| Knowledge Graph | ✅ | ✅ | ✅ | ✅ |
| Mission Runtime | ✅ | ✅ | ✅ (commissioning) | ✅ |
| Worker chain | ✅ | ✅ (5 stages) | ✅ | ✅ (partial) |
| AI Runtime | ✅ | ✅ | ✅ | ✅ |
| Capability/OAuth | ✅ | ✅ | ✅ (28/28) | ✅ |
| Event Governance | ✅ | ✅ | ✅ | ✅ |
| Generated registries | ✅ | ✅ | ✅ | ✅ |
| Replay | ✅ | ❌ | ❌ | ❌ dormant |
| Lineage | ✅ | ❌ | ❌ | ❌ dormant |
| Witness | ✅ | ❌ | ❌ | ❌ dormant |
| Orca fabric | ✅ | ⚠️ reachable | ⚠️ | ❌ business-disconnected |
| Repository intelligence (compiler) | ✅ | ❌ | ❌ | ❌ dormant |

## 3. Backlog Requirements for the Operator Surfaces

From the interface spec: **all six surfaces are directly backed by the live API.** The minimal backend additions are the four glue routes:

| Glue | Backing | Lines |
|---|---|---|
| `GET /missions/:id` trace (missionRuntime.getTrace) | Mission Timeline detail | ~20 |
| `GET /mc/capabilities` composite (capabilities + ai + health) | Capability Explorer dashboard | ~40 |
| `GET /mc/evidence/:canonicalHash` (verify + accumulate) | Decision Inspector "why this?" drill-down | ~30 |
| Client OAuth state machine (`@/lib/oauth.ts`) | Capability Explorer onboarding | ~80 (client) |

Plus three UI conventions (single fetch helper, poll hook, ApiState union) — see `PING_UI_COMPONENT_HARVEST_MAP.md` §5.

## 4. Backlog that requires NEW design (not in these specs)

- **Replay/lineage/witness activation** — the honest chain is 5 stages; replay/witness/lineage workers exist but nothing emits `REPLAY_VERIFY`. Enabling requires a REPLAY_VERIFY producer decision (new event flow), which is a separate planning track.
- **Confidence on the spine** — `emit()` builds events with no confidence field; 8+ incompatible confidence sites. Fixing requires a schema change (`ping_events.confidence`), a separate planning decision.
- **IntelligenceWorker duplication** — listens to the same business events as observation and emits CLASSIFICATION/RECOMMENDATION directly (provenance split, namespace drop at `intelligence_worker.js:20`). Fix is a decision-graph change, out of the presentation scope.
- **Phantom-complete** — scheduler marks missions completed at dispatch (`mission_scheduler.js:199-205`) without verification. Fix is orchestration-level, out of scope here.

## 5. Constraints

- Every implementation change: <200 lines, independently reversible, one purpose per commit, no new constitutional abstractions.
- Reuse existing endpoints; prefer extension over parallel implementation.
- No deletions without a working wired-and-tested replacement (Behavior Preservation Gate).
