# REPLAY AUTHORITY LEDGER 2026-09-16

**STATUS:** CLASSIFIED
**DATE:** 2026-09-16
**PHASE:** E - REPLAY CONVERGENCE

---

## EVIDENCE

### Replay Authority Candidates

#### 1. ReplayAuthority (TypeScript)
- **File:** /home/nolan/ping/runtime/kernel/replay/replay-authority.ts
- **Status:** DORMANT METADATA AUTHORITY
- **Evidence:**
  - [STAT] Owns replay metadata (replayId, replayHash, replaySequence, transcriptId, checkpointId)
  - [STAT] Pure function: (canonicalTimestamp, sequence, stateHash) → ReplayMetadata
  - [STAT] Never observes runtime clock - receives CanonicalTimestamp
  - [INFR] Constitutional compiler artifact, not integrated with PING runtime
  - [INFR] Provides metadata authority, not execution authority

#### 2. ReplayWorker (JavaScript)
- **File:** /home/nolan/ping/ping-runtime/workers/canonical_workers.js
- **Status:** ACTIVE REPLAY EXECUTION ADAPTER
- **Evidence:**
  - [STAT] Handles REPLAY_VERIFY and PROJECTION_CREATE events
  - [STAT] Accepts replayProvider (kernel engine) via dependency injection
  - [STAT] Builds transcripts from event chains
  - [STAT] Executes replay through deterministic kernel engine
  - [STAT] Emits REPLAY_COMPLETED events with replay verdict
  - [STAT] Implements failure-honesty for kernel errors
  - [STAT] Uses correlation_id and causation_id for trace preservation
  - [EMPR] Registered with WorkerRuntime in registerCanonicalWorkers()
  - [EMPR] eventTypes: ['REPLAY_VERIFY', 'PROJECTION_CREATE']
  - [INFR] Active in canonical worker chain

#### 3. Kernel Replay Engine
- **Status:** DETERMINISTIC EXECUTION ENGINE
- **Evidence:**
  - [STAT] Injected as replayProvider to ReplayWorker
  - [STAT] Executes deterministic replay from transcript
  - [INFR] Execution engine, not authority

---

## CLASSIFICATION

**DECISION:** What is the replay decision?

**ANSWER:** Replay should establish:
- Replay identity (replayId, transcriptId, checkpointId)
- Replay hash (replayHash)
- Replay sequence (replaySequence)
- Replay execution (deterministic re-execution)
- Replay verification (verified/unverified)
- Replay source (canonical events)

**CURRENT STATE:**
- **Replay metadata authority:** ReplayAuthority (TS) - DORMANT
- **Replay execution adapter:** ReplayWorker (JS) - ACTIVE
- **Replay execution engine:** Kernel engine - INJECTED DEPENDENCY
- **Replay source:** ping_events (via correlation groups)

**FINDING:** Replay is already CONVERGED with proper decomposition

**CONCLUSION:** NO CODE CHANGE REQUIRED

---

## VERIFICATION

**Evidence for Replay Decomposition:**

1. **Different Decisions:**
   - **ReplayAuthority (TS):** Owns replay metadata/identity (dormant, not used)
   - **ReplayWorker (JS):** Owns replay execution adaptation (active)
   - **Kernel engine:** Owns deterministic execution (injected dependency)
   - **These are DIFFERENT DECISIONS, not competing authorities**

2. **Replay Execution Path:**
   - [STAT] ReplayWorker._buildReplayEvents() queries correlation groups from ping_events
   - [STAT] ReplayWorker builds transcript from replay events
   - [STAT] ReplayWorker calls replayProvider.executeReplay(transcript)
   - [STAT] Kernel engine executes deterministic replay
   - [STAT] ReplayWorker emits REPLAY_COMPLETED with verdict

3. **Replay Source:**
   - [STAT] ReplayWorker._buildReplayEvents() reads from ping_events
   - [STAT] Uses correlation_id to get correlation group
   - [STAT] This reads from canonical event store

4. **Trace Preservation:**
   - [STAT] ReplayWorker preserves correlation_id and causation_id
   - [STAT] Source event_id and namespace preserved in evidence
   - [STAT] Fingerprint from kernel engine preserved in replay result

5. **Failure-Honesty:**
   - [STAT] ReplayWorker reports kernel_error when kernel throws
   - [STAT] ReplayWorker reports no_replay_provider when provider absent
   - [STAT] Verified: true ONLY when kernel status === 'ok' AND violations.length === 0

---

## CONVERGENCE DECISION

**STATUS:** NO CODE CHANGE REQUIRED

**RATIONALE:**
1. Replay is already converged with proper decomposition
2. ReplayAuthority (TS) provides metadata authority (dormant, not currently needed)
3. ReplayWorker (JS) provides execution adapter (active)
4. Kernel engine provides deterministic execution (injected dependency)
5. Replay source is ping_events (canonical event store)
6. These are DIFFERENT DECISIONS, not competing authorities

**PATH ALREADY IMPLEMENTED:**
REPLAY_VERIFY event → ReplayWorker.handle() → _buildReplayEvents() (from ping_events via correlation_id) → transcript → replayProvider.executeReplay() → kernel engine (deterministic execution) → REPLAY_COMPLETED event → ping_events → WitnessWorker (attests verified replays)

**DECOMPOSITION:**
- **Replay metadata authority:** ReplayAuthority (TS) - dormant, provides replayId/replayHash/replaySequence
- **Replay execution adapter:** ReplayWorker (JS) - active, wires kernel engine
- **Replay execution engine:** Kernel engine - injected dependency, deterministic execution
- **Replay source:** ping_events (canonical event store)

---

## FINAL STATUS

**REPLAY_AUTHORITY = CONVERGED**

**EVIDENCE:**
- [STAT] Replay is already converged with proper decomposition
- [STAT] ReplayAuthority (TS) provides metadata authority (dormant)
- [STAT] ReplayWorker (JS) provides execution adapter (active)
- [STAT] Kernel engine provides deterministic execution (injected)
- [STAT] Replay source is ping_events (canonical event store)
- [INFR] These are DIFFERENT DECISIONS, not competing authorities

**NO CODE CHANGE REQUIRED**

**DECISIONS:**
- **Replay identity:** ReplayAuthority (TS) - dormant, not currently used
- **Replay execution:** ReplayWorker (JS) + kernel engine - active
- **Replay source:** ping_events (canonical event store)
- **Replay verification:** WitnessWorker attests verified replays

**CLASSIFICATION:**
- **ReplayAuthority (TS):** DORMANT metadata authority
- **ReplayWorker (JS):** ACTIVE execution adapter
- **Kernel engine:** DETERMINISTIC execution engine
- **Replay source:** ping_events (canonical event store)
