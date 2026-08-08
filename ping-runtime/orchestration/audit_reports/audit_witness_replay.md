# Combined Audit: Witness Integrity (G) + Replay (H)

**Date:** 2026-07-04
**Scope:** `orchestration/execution/` + `orchestration/dormant_classifier.js`
**Files audited:**
- `orchestration/execution/artifact_authorities.js` (329 lines)
- `orchestration/execution/engine.js` (716 lines)
- `orchestration/execution/artifact_store.js` (197 lines)
- `orchestration/execution/event_queue.js` (218 lines)
- `orchestration/execution/worker_state_machine.js` (234 lines)
- `orchestration/dormant_classifier.js` (215 lines — ReplayCertifier class)

---

## Witness Integrity Audit (G)

### G.1 Does every artifact produced have a witness_hash?

`ArtifactAuthority.produce()` (artifact_authorities.js, line 63-76) constructs each artifact with a `witness_hash` field set to `this._computeWitness(payload)`.

```js
const artifact = {
  id, type, content, hash, bytes,
  worker_id, mission_id, parent_artifact_id,
  files, confidence, metadata,
  witness_hash: this._computeWitness(payload)   // line 75
};
```

All 10 artifact types (mission, proposal, analysis, patch, consensus_proof, merge_decision, replay_proof, witness, documentation, test) flow through the same `super.produce()` call, so **every artifact gets a witness_hash**.

**Verdict: PASS.** Every artifact carries a deterministic witness hash.

---

### G.2 Does every event carry a witness_id?

`EventQueue.emit()` (event_queue.js, line 68-114) constructs each event with:

```js
witness_id: data.witnessId || null,    // line 93
```

The field exists in the schema, but:

| Location | `data.witnessId` passed? |
|----------|------------------------|
| `artifact_produced` event (artifact_authorities.js:80-88) | NO — passes `witnessHash` but NOT `witnessId` |
| All events in engine.js (`git_diff`, `knowledge_compiled`, `consensus_reached`, `merge_decision_created`, `mission_accepted`, etc.) | NO — `witnessId` never appears in any `emit()` or `emitChain()` call |
| Worker state machine transitions (worker_state_machine.js:40-48) | NO |
| Consensus engine evaluations | NO |

**grep for `witnessId` across entire `orchestration/`**: 1 match — the declaration in event_queue.js. **Zero callers.**

**Every event in the system carries `witness_id: null`.**

**Verdict: FAIL.** The `witness_id` field is a dead schema attribute. No code populates it.

**Remediation:** Either:
1. Wire the artifact's `witness_hash` into the `witnessId` field of `artifact_produced` events (artifact_authorities.js line 80-88)
2. Or remove the field from the event schema if witness tracking is handled entirely by artifact authorities

---

### G.3 Does every merge decision carry a witness reference?

`MergeDecisionArtifact.produce()` (artifact_authorities.js, lines 222-237) produces a `merge_decision` artifact. This artifact:

- Has a `witness_hash` (inherited from `ArtifactAuthority.produce()`)
- References `consensusArtifactId` in its content data
- Has `parentArtifactId: consensusArtifactId` in its metadata

The `consensusArtifactId` is the ID of the consensus proof artifact, which itself has a `witness_hash`. So there is an **implicit witness chain**: merge_decision → consensus_proof (via `consensusArtifactId` content field + `parentArtifactId` metadata).

However, this is **not explicitly labeled as a witness reference**. There is no `witness_id`, `witness_artifact_id`, or `witness_ref` field on the merge decision artifact itself.

**Verdict: PARTIAL PASS.** The witness chain exists implicitly (merge_decision → consensus_proof → hash), but the witness reference is not explicitly distinguished from ordinary artifact dependencies. No cryptographic linking (signing) of the chain.

---

### G.4 Does every replay proof carry a witness?

`ReplayArtifact.produce()` (artifact_authorities.js, lines 241-257) produces a `replay_proof` artifact. This artifact has a `witness_hash` from the base `produce()` method. The `_computeWitness()` hash includes `contentHash` of the replay proof content.

So the replay proof has a deterministic witness hash embedded in it. The hash covers:
- artifactType, workerId, missionId
- `canonicalHash(payload.content)` — hash of the replay proof content
- parentArtifactId

**Verdict: PASS.** Replay proofs carry deterministic witness hashes.

---

### G.5 Is witness ownership fragmented?

Three distinct witness concepts exist:

| Mechanism | File | What it does |
|-----------|------|-------------|
| `ArtifactAuthority._computeWitness()` | `artifact_authorities.js:92-101` | Deterministic SHA-256 hash embedded in every artifact. Pure content-addressed witness. |
| `WitnessArtifact` class | `artifact_authorities.js:260-276` | Creates standalone `witness`-type artifacts that reference other artifacts via `artifactId`. Used for explicit witness statements. |
| `ReplayCertifier.witness_proof` | `dormant_classifier.js:158-162` | Metadata scoring — tracks witness_score per module node. Not a witness creation mechanism. |

**Problems:**

1. **`_computeWitness()` and `WitnessArtifact` are not connected.** `_computeWitness()` runs automatically in every `produce()` call, but `WitnessArtifact` is never instantiated or called anywhere in the engine (grep confirms zero usage of `this._witnessAuthority` outside its construction at engine.js:82).

2. **No single WitnessAuthority coordinates witness creation.** The base class embeds witness hashes implicitly, but there is no service that: issues witness certificates, chains witnesses across artifact lineages, verifies witness chains across restarts.

3. **The witness hash is purely internal.** It is never anchored to an external root (no Merkle root, no git commit binding, no digital signature).

**Verdict: FAIL — moderately fragmented.** The codebase has two witness mechanisms that run independently and are not linked. `WitnessArtifact` is instantiated but never used.

---

### G.6 Does `_computeWitness` use `Date.now()`? (Replay safety)

**Checking `_computeWitness`** (artifact_authorities.js:92-101):

```js
_computeWitness(payload) {
    const witnessPayload = {
      artifactType: payload.type,
      workerId: payload.workerId,
      missionId: payload.missionId,
      contentHash: canonicalHash(payload.content),
      parentArtifactId: payload.parentArtifactId
    };
    return canonicalHash(witnessPayload);
}
```

All inputs are deterministic: artifactType, workerId, missionId, contentHash (SHA-256), parentArtifactId. **No `Date.now()`, no `Math.random()`, no non-deterministic input.**

**Verdict: PASS.** The witness computation is fully deterministic and replay-safe. G6 from the audit directive was a false expectation — the code is clean here.

---

### Witness Integrity Audit — Summary

| Check | Verdict | Detail |
|-------|---------|--------|
| G.1 witness_hash on all artifacts | **PASS** | Every artifact has one |
| G.2 witness_id on events | **FAIL** | Schema field exists; zero callers |
| G.3 merge decision witness ref | **PARTIAL** | Implicit via consensusArtifactId; not explicit |
| G.4 replay proof witness | **PASS** | Deterministic witness hash embedded |
| G.5 Fragmentation | **FAIL** | Two unconnected mechanisms; WitnessArtifact unused |
| G.6 Determinism | **PASS** | No Date.now() in witness computation |

---

## Replay Audit (H)

### H.1 Does the engine store its state as events?

**Events are persisted.** `EventQueue._persist()` (event_queue.js:192-195) writes every event to `orchestration/event_queue/<event_id>.json`. The event log captures: mission lifecycle, worker assignments, consensus decisions, merge decisions, artifact productions.

**But engine state is NOT stored as events.** The engine maintains:

| State | Location | Persisted? |
|-------|----------|-----------|
| `_missions` array (mission objects) | engine.js:48 | **NO** — in-memory only |
| `_pendingProposals` array | engine.js:49 | **NO** — in-memory only |
| Mission status + `_resolved` flag | mission objects | **NO** — in-memory only |
| `mission.workerOutputs` | mission objects | **NO** — in-memory only |
| `mission.consensus` decision | mission objects | **NO** — in-memory only |
| Worker state transitions | WorkerStateMachine._states Map | **PARTIAL** — persisted only on terminal states |
| Artifact records | ArtifactStore._artifacts array | **PARTIAL** — persisted to disk, reloadable |

**Verdict: FAIL.** Events are a chronological log, not a state snapshot. There is no checkpoint/snapshot mechanism. Restarting the engine loses all active mission context.

---

### H.2 Can the event queue be replayed to reconstruct mission state?

`EventQueue._load()` (event_queue.js:197-215) reads event JSON files from disk and populates:
- `_events` array — all events
- `_emittedIds` Set — deduplication IDs
- `_globalSequence` — sequence counter

It does NOT reconstruct:
- Which missions are active vs completed vs failed
- Which workers were assigned to which missions
- Worker output data attached to missions
- Consensus decisions attached to missions
- Artifact-to-mission associations

The event log contains all the information needed to reconstruct mission state (by replaying events in sequence), but **no replay engine exists** to do this reconstruction.

**Verdict: FAIL.** Event replay is data-level only (event list reconstruction). No functional state reconstruction exists.

---

### H.3 Is the engine itself replayable?

For a system to be replayable, `replay(sequence_of_events) => identical_state` must hold. In this engine:

1. `_missions` starts as `[]` on every initialization (engine.js:48)
2. Missions are compiled fresh by `compileMissions()` (engine.js:146-154) based on the current intelligence graph — **not from events**
3. Worker outputs are collected via `collectWorkerOutput()` which mutates mission objects — these mutations are lost on restart
4. `_pendingProposals` starts as `[]` on every initialization (engine.js:49) — no reconstruction
5. Consensus decisions are stored on mission objects (`mission.consensus`) — lost on restart

**The only replay-adjacent behavior**: the `_eventQueue._load()` restores events, and `_artifactStore._load()` restores artifacts. But neither connects these back to the engine's active state.

**Verdict: FAIL.** The engine has zero replay capability for active state.

---

### H.4 Is the artifact store replayable?

`ArtifactStore._load()` (artifact_store.js:181-194) reads all JSON files from `orchestration/artifact_store/` and populates `_artifacts` and `_records`. This is **partial reconstruction**:

| Aspect | Replayable? |
|--------|-----------|
| All artifact records | YES — reloaded from disk |
| Artifact IDs | YES — reloaded |
| Artifact hashes | YES — stored and reloaded |
| Mission-to-artifact associations | **NO** — `mission.consensusArtifactId` and `mission.mergeArtifactId` are on the mission object (in-memory only) |
| Artifact statistics | Computed from reloaded data |

The artifact store itself is portable (all data on disk), but the semantic links to engine state are lost.

**Verdict: PARTIAL PASS.** Artifact records are persistent and reloadable, but their semantic context (which mission produced them, which consensus they belong to) is not reconstructed.

---

### H.5 Is the WorkerStateMachine persisted?

`WorkerStateMachine` has two persistence mechanisms:

| Data | Storage | Replayable? |
|------|---------|-----------|
| Worker memory (findings, fixes, patterns) | `orchestration/worker_memory/<workerId>.json` | YES — loaded via `_loadMemory()` at init |
| Current state (`_states` Map) | **In-memory only** | **NO** — only persisted on terminal transitions (completed/failed/archived at line 50-52) |
| Last transition timestamp (`_timestamps` Map) | **In-memory only** | **NO** — persisted in `lastTransition` field only on terminal transitions |

On restart:
- `_loadMemory()` populates `_memoryCache` with worker memory
- But `_states` Map is empty — all workers start as 'idle'
- The `_timestamps` Map is empty — no stuck detection can work until new transitions occur

**Verdict: FAIL.** Worker memory persists, but worker state (running vs idle vs assigned) is entirely lost on restart.

---

### H.6 Comprehensive Replay Conclusion

```
Event Persistence  ✅ (all events written to disk)
State Snapshots    ❌ (no checkpoint mechanism)
Mission State      ❌ (missions array, statuses, outputs — all lost)
Worker State       ❌ (current state lost; memory only persists)
Artifact State     ⚠️ (records persist; mission links lost)
Consensus State    ❌ (decisions live on mission objects only)
```

The orchestration engine has **event persistence but NOT state reconstruction**. You can replay the event log to audit what happened, but you cannot replay the engine's decision logic to reconstruct identical state.

**Seven specific gaps to close for full replayability:**

1. **Mission checkpointing** — persist `_missions` array state (including status, _resolved, workerOutputs, consensus) to disk on state changes
2. **Worker state persistence** — persist `_states` and `_timestamps` on every transition, not just terminal ones
3. **State snapshot mechanism** — periodic checkpoint of all in-memory state to disk (missions, worker states, pending proposals)
4. **Checkpoint loader** — reconstruct engine state from latest checkpoint on initialization
5. **Event-driven state reconstruction** — optionally replay events from last checkpoint to catch up
6. **Artifact-to-mission link reconstruction** — rebuild `mission.consensusArtifactId`/`mergeArtifactId` from artifact store on load
7. **Replay engine** — a `ReplayEngine` that can take a sequence of events and replay them through a deterministic state machine to produce identical state

---

## Combined Findings

### Critical Findings (blocking witness integrity + replay)

| # | Finding | Impact | File(s) |
|---|---------|--------|---------|
| C1 | `witness_id` never populated on events | Witness chain cannot be traced through event log. Every event has `witness_id: null`. | `event_queue.js:93`; zero callers in entire orchestration |
| C2 | Engine has zero active-state persistence | All mission, worker, and consensus state lost on restart. No checkpoint mechanism. | `engine.js:48-49`; `worker_state_machine.js:10-12` |
| C3 | `WitnessArtifact` instantiated but never used | Standalone witness artifacts never produced despite having a full artifact authority class | `engine.js:82`; `artifact_authorities.js:260-276` |

### High Findings

| # | Finding | Impact | File(s) |
|---|---------|--------|---------|
| H1 | Artifact store reconstructs records but not mission links | Artifacts survive restart but cannot be associated with their missions | `artifact_store.js:181-194`; `engine.js:414-415` |
| H2 | Worker state only persisted on terminal transitions | Running/assigned/waiting states lost on crash | `worker_state_machine.js:50-52` |
| H3 | Mission consensus/merge artifact IDs stored only on in-memory mission objects | Links between events, artifacts, and decisions severed on restart | `engine.js:414-415` |
| H4 | No replay engine for state reconstruction | Event log is comprehensive but no code replays it to rebuild state | (missing entirely) |

### Medium Findings

| # | Finding | Impact | File(s) |
|---|---------|--------|---------|
| M1 | Witness ownership split across `_computeWitness` and `WitnessArtifact` | Two mechanisms, no clear authority, `WitnessArtifact` unused | `artifact_authorities.js:92-101;260-276` |
| M2 | `MergeDecisionArtifact` witness chain is implicit | No explicit `witness_ref` or `witness_artifact_id` field | `artifact_authorities.js:222-237` |
| M3 | `ReplayCertifier` tracks metadata but does not create artifacts | Certification is scoring only — no replay proofs produced at engine level | `dormant_classifier.js:119-212` |

### Positive Findings (unexpectedly clean)

| # | Finding | Detail |
|---|---------|--------|
| P1 | `_computeWitness` is fully deterministic | No `Date.now()`, no `Math.random()`, no entropy — replay-safe |
| P2 | All artifacts carry witness_hash | 100% coverage across all 10 artifact types |
| P3 | Event IDs are deterministic SHA-256 | No collisions, no duplicates, dedup enforced via `_emittedIds` |
| P4 | Event causation chains intact | `emitChain()` preserves `causation_id`, `correlation_id`, `parent_event_id` |

---

## Recommendations

### Immediate (add before next restart-sensitive operation)

1. **Wire `witnessHash` into `artifact_produced` event data** as `witnessId` (artifact_authorities.js:80-88)
2. **Persist worker state on every transition**, not just terminal (worker_state_machine.js:50-52)
3. **Periodically checkpoint missions array** — serialized mission state (status, workerOutputs, consensus, artifact IDs) to disk

### Short-term (Phase 39-40 scope)

4. **Create mission state persistence** — store mission objects to `orchestration/mission_state/` on every state change
5. **Reconstruct mission-to-artifact links on load** — load mission state from disk + artifact store, rebuild `consensusArtifactId` and `mergeArtifactId`
6. **Activate `WitnessArtifact`** — wire into `consensus_reached` / `merge_decision_created` event handlers to produce explicit witness artifacts

### Architectural (constitutional)

7. **Define single WitnessAuthority** — collapse `_computeWitness` and `WitnessArtifact` into one authority with clear lifecycle: produce → anchor (to event) → chain (to parent) → verify
8. **Define ReplayEngine** — a deterministic state machine that replays events from checkpoint to reconstruct engine state. This is the missing piece for constitutional replay integrity.

---

*Report generated from live code audit of `orchestration/execution/*.js` + `orchestration/dormant_classifier.js`.*
