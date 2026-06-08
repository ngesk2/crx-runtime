# Replay Analysis

## Current CRX Implementation

**STATUS:** NO REPLAY CAPABILITY

**CURRENT ARCHITECTURE:**
```
HTTP
↓
commit_controller
↓
hash
↓
validation
↓
postgres insert
```

**CAPABILITIES:**
- None (no replay system exists)

**MISSING CAPABILITIES:**
- Entire replay system
- Deterministic ordering
- Replay engine
- State reconstruction
- Transcript reconstruction
- Replay verification
- Replay divergence detection
- Replay witnesses
- Replay stability guarantees

---

## Legacy Implementation (deterministic_replay_harness.js)

**FILE:** JS.txt (lines ~5000-5200)

```javascript
export const DETERMINISTIC_REPLAY_HARNESS_VERSION = "replay.2.0";

export async function runDeterministicReplay({
  events,
  initialState,
  replayConfig
}) {
  // 1. Sort events deterministically
  const sortedEvents = deterministicSort(events);

  // 2. Verify event fingerprints
  for (const event of sortedEvents) {
    const expectedFingerprint = event.fingerprint;
    const actualFingerprint = await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.EVENT,
      event
    );

    if (expectedFingerprint !== actualFingerprint) {
      throw new Error(`Event fingerprint mismatch: ${event.id}`);
    }
  }

  // 3. Apply events in order
  let state = initialState;
  const transcript = [];

  for (const event of sortedEvents) {
    const result = applyEvent(event, state);
    state = result.state;
    transcript.push({
      event_id: event.id,
      previous_state_fingerprint: result.previousFingerprint,
      new_state_fingerprint: result.newFingerprint,
      action: event.action
    });
  }

  // 4. Verify final state
  const finalFingerprint = await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.REPLAY,
    state
  );

  return Object.freeze({
    valid: true,
    final_state: state,
    final_state_fingerprint: finalFingerprint,
    transcript,
    replay_fingerprint: await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.REPLAY,
      transcript
    )
  });
}

function deterministicSort(events) {
  // Sort by timestamp, then by fingerprint
  return [...events].sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp.localeCompare(b.timestamp);
    }
    return a.fingerprint.localeCompare(b.fingerprint);
  });
}

function applyEvent(event, state) {
  // Apply event to state
  // Return new state and fingerprints
}
```

**CAPABILITIES:**
- Deterministic event ordering
- Event fingerprint verification
- State reconstruction
- Transcript generation
- Replay fingerprinting
- Replay verification

---

## MCP0.txt Replay Structure

**FILE:** MCP0.txt (lines 79-85)

```
/kernel/replay
  ├── replay-engine.ts
  ├── deterministic-sort.ts
  ├── state-rebuilder.ts
  ├── snapshot.ts
  ├── projection-rebuild.ts
  └── replay-validator.ts
```

**TOOLING:** MCP0.txt (lines 201-204)

```
/tooling/replay
  ├── replay-runner.ts
  ├── replay-diff.ts
  └── replay-audit.ts
```

**TESTS:** MCP0.txt (lines 221-224)

```
/tests/replay
  ├── deterministic-replay.ts
  ├── state-rebuild.ts
  └── historical-policy.ts
```

---

## Comparison Analysis

**OVERLAP:**
- None (CRX has no replay capability)

**CRX MISSING:**
- Entire replay system (CRITICAL for constitutional compliance)

**LEGACY MISSING:**
- TypeScript implementation (CRX has this - better)
- Database integration (CRX has this - better)
- Runtime integration (CRX has this - better)

---

## Replay Relevance

**CRITICAL - ENTIRE REPLAY SYSTEM MISSING:**

**DETERMINISTIC ORDERING:**
- CRITICAL - replay requires deterministic event ordering
- Without ordering, replay cannot produce consistent state
- CRX has no ordering guarantees

**STATE RECONSTRUCTION:**
- CRITICAL - replay requires state reconstruction from events
- Without reconstruction, replay cannot verify state
- CRX has no state reconstruction

**TRANSCRIPT GENERATION:**
- CRITICAL - replay requires transcript for verification
- Without transcript, replay cannot be audited
- CRX has no transcript generation

**REPLAY VERIFICATION:**
- CRITICAL - replay requires verification of replay results
- Without verification, replay cannot guarantee correctness
- CRX has no replay verification

**REPLAY DIVERGENCE DETECTION:**
- CRITICAL - replay requires detection of replay divergence
- Without divergence detection, replay cannot detect corruption
- CRX has no divergence detection

**REPLAY WITNESSES:**
- CRITICAL - replay requires witnesses for verification
- Without witnesses, replay cannot be trusted
- CRX has no replay witnesses

**REPLAY STABILITY GUARANTEES:**
- CRITICAL - replay requires stability guarantees
- Without stability, replay cannot be reliable
- CRX has no stability guarantees

---

## Lineage Relevance

**DETERMINISTIC ORDERING:**
- CRITICAL - lineage requires deterministic ordering
- Without ordering, lineage cannot be reconstructed
- CRX has no ordering guarantees

**STATE RECONSTRUCTION:**
- CRITICAL - lineage requires state reconstruction
- Without reconstruction, lineage cannot be verified
- CRX has no state reconstruction

**TRANSCRIPT GENERATION:**
- CRITICAL - lineage requires transcript for verification
- Without transcript, lineage cannot be audited
- CRX has no transcript generation

---

## Execution vs Replay Separation

**CURRENT VIOLATION:**
- CRX has no separation between execution and replay
- All execution is runtime-only
- No replay capability exists
- No deterministic execution path
- No transcript generation
- No state reconstruction

**CONSTITUTIONAL VIOLATION:**
- AGENT.md mandates replay as authority
- AGENT.md mandates execution vs replay separation
- Current implementation has no replay capability
- Current implementation violates constitutional authority separation

---

## Storage Authority Violations

**CURRENT VIOLATION:**
- CRX treats PostgreSQL as truth authority
- No replay verification of stored state
- No transcript verification
- No state reconstruction from events
- Storage is treated as authority, not replay

**CONSTITUTIONAL VIOLATION:**
- AGENT.md mandates replay as authority
- AGENT.md mandates persistence as adapter
- Current implementation violates constitutional authority separation

---

## Recommendation

**ACTION:** CREATE replay system from scratch

**EXTRACT FROM LEGACY:**
1. deterministic_replay_harness.js → replay_engine.ts
2. deterministic-sort.ts → deterministic_sort.ts
3. state-rebuilder.ts → state_rebuilder.ts
4. snapshot.ts → snapshot.ts
5. projection-rebuild.ts → projection_rebuild.ts
6. replay-validator.ts → replay_validator.ts

**KEEP FROM CRX:**
1. Database integration (for event storage)
2. TypeScript implementation
3. Runtime integration

**RISK:** HIGH - requires architectural change

---

## Proposed Replay System

```typescript
export interface ReplayConfig {
  deterministicOrdering: boolean;
  verifyEventFingerprints: boolean;
  verifyStateFingerprints: boolean;
  generateTranscript: boolean;
}

export interface ReplayResult {
  valid: boolean;
  finalState: any;
  finalStateFingerprint: string;
  transcript: ReplayTranscript;
  replayFingerprint: string;
  divergenceDetected: boolean;
}

export interface ReplayTranscript {
  events: ReplayEvent[];
  stateTransitions: StateTransition[];
  finalFingerprint: string;
}

export interface ReplayEvent {
  eventId: string;
  previousStateFingerprint: string;
  newStateFingerprint: string;
  action: string;
  timestamp: string;
}

export interface StateTransition {
  eventId: string;
  previousState: any;
  newState: any;
  action: string;
}

export async function runDeterministicReplay(
  events: EventEnvelope[],
  initialState: any,
  config: ReplayConfig = {
    deterministicOrdering: true,
    verifyEventFingerprints: true,
    verifyStateFingerprints: true,
    generateTranscript: true
  }
): Promise<ReplayResult> {
  // 1. Sort events deterministically
  const sortedEvents = config.deterministicOrdering
    ? deterministicSort(events)
    : events;

  // 2. Verify event fingerprints
  if (config.verifyEventFingerprints) {
    for (const event of sortedEvents) {
      const isValid = await validateEventEnvelope(event);
      if (!isValid) {
        throw new Error(`Event fingerprint mismatch: ${event.id}`);
      }
    }
  }

  // 3. Apply events in order
  let state = initialState;
  const transcript: ReplayTranscript = {
    events: [],
    stateTransitions: [],
    finalFingerprint: ''
  };

  for (const event of sortedEvents) {
    const previousStateFingerprint = await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.REPLAY,
      state
    );

    const result = applyEvent(event, state);
    state = result.state;

    const newStateFingerprint = await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.REPLAY,
      state
    );

    transcript.events.push({
      eventId: event.id,
      previousStateFingerprint,
      newStateFingerprint,
      action: event.action,
      timestamp: event.timestamp
    });

    transcript.stateTransitions.push({
      eventId: event.id,
      previousState: result.previousState,
      newState: state,
      action: event.action
    });
  }

  // 4. Verify final state
  const finalStateFingerprint = await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.REPLAY,
    state
  );

  transcript.finalFingerprint = finalStateFingerprint;

  // 5. Generate replay fingerprint
  const replayFingerprint = await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.REPLAY,
    transcript
  );

  return Object.freeze({
    valid: true,
    finalState: state,
    finalStateFingerprint,
    transcript,
    replayFingerprint,
    divergenceDetected: false
  });
}

export function deterministicSort(events: EventEnvelope[]): EventEnvelope[] {
  // Sort by timestamp, then by fingerprint for deterministic ordering
  return [...events].sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp.localeCompare(b.timestamp);
    }
    return a.fingerprint.localeCompare(b.fingerprint);
  });
}

export function applyEvent(event: EventEnvelope, state: any): {
  state: any;
  previousState: any;
} {
  // Apply event to state based on action
  // This is action-specific logic
  const previousState = { ...state };

  switch (event.action) {
    case 'COMMIT':
      state = applyCommitEvent(event, state);
      break;
    case 'AUDIT':
      state = applyAuditEvent(event, state);
      break;
    default:
      throw new Error(`Unknown action: ${event.action}`);
  }

  return { state, previousState };
}

export async function verifyReplayResult(
  expected: ReplayResult,
  actual: ReplayResult
): Promise<boolean> {
  // Verify replay results match
  return (
    expected.replayFingerprint === actual.replayFingerprint &&
    expected.finalStateFingerprint === actual.finalStateFingerprint
  );
}

export async function detectReplayDivergence(
  originalResult: ReplayResult,
  replayResult: ReplayResult
): Promise<boolean> {
  // Detect divergence between original and replay
  return originalResult.replayFingerprint !== replayResult.replayFingerprint;
}
```

---

## Migration Path

1. Create replay_engine.ts with replay system
2. Create deterministic_sort.ts with sorting logic
3. Create state_rebuilder.ts with state reconstruction
4. Create snapshot.ts with snapshot management
5. Create projection_rebuild.ts with projection reconstruction
6. Create replay_validator.ts with validation logic
7. Update commit_controller.ts to generate replay-compatible events
8. Add tests for deterministic replay
9. Add tests for state reconstruction
10. Add tests for replay verification
11. Add tests for replay divergence detection
12. Update documentation

---

## Risk Assessment

**HIGH RISK:**
- Requires architectural change
- Requires event envelope system (depends on event_comparison.md)
- Requires state reconstruction logic
- Requires action-specific apply logic
- Requires database schema changes
- Breaking change to commit flow

**MITIGATION:**
- Implement incrementally
- Start with read-only replay verification
- Add write capability after validation
- Create migration script
- Add comprehensive tests
- Document migration process
- Provide rollback plan
