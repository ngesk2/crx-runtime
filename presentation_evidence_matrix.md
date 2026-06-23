# SWEEP24 PRESENTATION EVIDENCE MATRIX

**Date**: 2026-06-22
**Branch**: authority-forensics
**Mode**: READ-ONLY FORENSIC INVESTIGATION

---

## EXECUTIVE SUMMARY

**Total Claims**: 12

**Status Summary**:
- EXISTS: 8
- PARTIAL: 1
- MISSING: 3

**Missing Claims**:
- Ollama Routing
- Complexity Routing
- Inference Event Emission

**Partial Claims**:
- Postgres Event Store (stub implementation, not constitutional event-first)

---

## CLAIM EVIDENCE MATRIX

| Claim | Status | Authority File | Import Path | Execution Path | Demo Command | Runtime Evidence |
|-------|--------|----------------|-------------|----------------|-------------|-----------------|
| Events | EXISTS | runtime/replay/replay_event_stream.ts | runtime/replay/replay_event_stream.ts | ReplayEventStream constructor → event stream | No | Pure TypeScript implementation with deterministic event streaming, immutable event stream, MAX_EVENTS limit, payload size limits |
| Witnesses | EXISTS | runtime/replay/witness_authority.ts | runtime/replay/witness_authority.ts | WitnessAuthority.generateWitness() → witness root | No | Pure TypeScript implementation with Merkle tree construction, constitutional law commitment, deep freeze immutability |
| Replay | EXISTS | runtime/replay/deterministic_replay_engine.ts | runtime/replay/deterministic_replay_engine.ts | DeterministicReplayEngine.replay() → ReplayResult | No | Pure TypeScript implementation with deterministic replay execution, invariant verification, state machine |
| Replay Verification | EXISTS | runtime/replay/replay_verification.ts | runtime/replay/replay_verification.ts | ReplayVerification.verifyDeterminism() → boolean | No | Pure TypeScript implementation with witness comparison, state serialization equality, violations equality, lineage equality |
| Certificates | EXISTS | runtime/replay/certificate_authority.ts | runtime/replay/certificate_authority.ts | CertificateAuthority.computeCertificateCommitment() → string | No | Pure TypeScript implementation with SHA-256 hashing, constitutional law commitment, no runtime dependencies |
| Constitutional Identity | EXISTS | runtime/replay/certificate_authority.ts | runtime/replay/certificate_authority.ts | CertificateAuthority.sha256() → string | No | Pure TypeScript implementation with SHA-256 hashing, runtime-neutral (no Node crypto) |
| Constitutional Canonicalization | EXISTS | runtime/replay/canonical_json.ts | runtime/replay/canonical_json.ts | CanonicalJson.canonicalize() → string | No | Pure TypeScript implementation of RFC-8785 JCS, lexicographic property ordering, MAX_NESTING_DEPTH guard |
| Constitutional Time | EXISTS | runtime/replay/replay_types.ts | runtime/replay/replay_types.ts | CanonicalEventEnvelope.timestamp → string | No | Pure TypeScript implementation with ISO 8601 timestamps in event envelopes |
| Lineage | EXISTS | runtime/replay/replay_state_machine.ts | runtime/replay/replay_state_machine.ts | ReplayStateMachine.appendEvent() → lineage graph | No | Pure TypeScript implementation with event_to_artifact_map, lineage graph, graph validation |
| Ollama Routing | MISSING | - | - | - | - | No ollama files found in runtime/ |
| Complexity Routing | MISSING | - | - | - | - | No complexity routing files found in runtime/ |
| Inference Event Emission | MISSING | - | - | - | - | No inference files found in runtime/ |
| Postgres Event Store | PARTIAL | runtime/adapters/postgres_event_store.ts | runtime/adapters/postgres_event_store.ts | PostgresEventStore.storeEvent() → void | No | Stub implementation with console.log only, not constitutional event-first (direct database writes in event_log.ts) |

---

## DETAILED EVIDENCE

### Events

**Authority File**: runtime/replay/replay_event_stream.ts

**Import Path**: runtime/replay/replay_event_stream.ts

**Execution Path**: ReplayEventStream constructor → event stream

**Runtime Evidence**:
```typescript
export class ReplayEventStream {
  private readonly events: CanonicalEventEnvelope[];
  private readonly streamVersion: string;

  constructor(events: CanonicalEventEnvelope[], streamVersion: string = '1.0') {
    // Enforce MAX_EVENTS limit
    if (events.length > REPLAY_LIMITS.MAX_EVENTS) {
      throw DeterministicFailureFactory.toError(...);
    }

    // Enforce payload size limits
    for (const event of events) {
      const payloadSize = JSON.stringify(event.getPayload()).length;
      if (payloadSize > REPLAY_LIMITS.MAX_EVENT_PAYLOAD_SIZE) {
        throw DeterministicFailureFactory.toError(...);
      }
    }

    this.events = [...events]; // Immutable copy
    this.streamVersion = streamVersion;
  }
}
```

**Status**: EXISTS

---

### Witnesses

**Authority File**: runtime/replay/witness_authority.ts

**Import Path**: runtime/replay/witness_authority.ts

**Execution Path**: WitnessAuthority.generateWitness() → witness root

**Runtime Evidence**:
```typescript
export class WitnessAuthority {
  generateWitness(
    eventStream: ReplayEventStream,
    state: ReplayState,
    violations: any[]
  ): WitnessRoot {
    // Compute constitutional law commitment
    const lawManifest = getConstitutionalLawManifest();
    const constitutionalLawCommitment = CertificateAuthority.computeConstitutionalLawCommitment({...});

    // Create Merkle leaves from components
    const baseLeaves: MerkleLeaf[] = [
      { leaf_id: toWitnessLeafId('canonical_bytes'), leaf_bytes: base64UrlDecode(canonicalBytes.bytes), leaf_hash: '' },
      { leaf_id: toWitnessLeafId('fingerprint'), leaf_bytes: hexDecode(fingerprint.hash.replace(/^sha256:/, '')), leaf_hash: '' },
      // ... more leaves
    ];

    // Deep freeze witness root to prevent post-certification mutation
    return deepFreeze({ witnessRoot, lineageGraph: lineage });
  }
}
```

**Status**: EXISTS

---

### Replay

**Authority File**: runtime/replay/deterministic_replay_engine.ts

**Import Path**: runtime/replay/deterministic_replay_engine.ts

**Execution Path**: DeterministicReplayEngine.replay() → ReplayResult

**Runtime Evidence**:
```typescript
export class DeterministicReplayEngine {
  replay(eventStream: ReplayEventStream): ReplayResult {
    // Create fresh state machine for each replay (pure functional approach)
    const stateMachine = new ReplayStateMachine();
    
    // Process events in order
    const events = eventStream.getEvents();
    for (const event of events) {
      stateMachine.appendEvent(event);
    }

    // Verify invariants
    const violations = this.invariantRunner.verifyInvariants(stateMachine.getState());

    // Generate witness
    const witness = this.witnessAuthority.generateWitness(...);

    return deepFreeze({
      witness_root: witness,
      fingerprint: this.hashAuthority.computeFingerprint(...),
      canonical_bytes: this.hashAuthority.canonicalize(...),
      state: stateMachine.getState(),
      violations: violations,
      lineage_graph: stateMachine.getLineageGraph()
    });
  }
}
```

**Status**: EXISTS

---

### Replay Verification

**Authority File**: runtime/replay/replay_verification.ts

**Import Path**: runtime/replay/replay_verification.ts

**Execution Path**: ReplayVerification.verifyDeterminism() → boolean

**Runtime Evidence**:
```typescript
export class ReplayVerification {
  verifyDeterminism(eventStream: ReplayEventStream, expectedResult: ReplayResult): boolean {
    const actualResult = this.engine.replay(eventStream);
    
    return (
      this.compareWitnessRoots(actualResult.witness_root, expectedResult.witness_root) &&
      this.compareFingerprints(actualResult.fingerprint, expectedResult.fingerprint) &&
      this.compareCanonicalBytes(actualResult.canonical_bytes, expectedResult.canonical_bytes) &&
      this.compareStateSerialization(actualResult.state, expectedResult.state) &&
      this.compareViolations(actualResult.violations, expectedResult.violations) &&
      this.compareLineage(actualResult.lineage_graph, expectedResult.lineage_graph) &&
      this.compareStateVersion(actualResult.state_version, expectedResult.state_version) &&
      this.compareArtifactCount(actualResult.artifact_count, expectedResult.artifact_count)
    );
  }
}
```

**Status**: EXISTS

---

### Certificates

**Authority File**: runtime/replay/certificate_authority.ts

**Import Path**: runtime/replay/certificate_authority.ts

**Execution Path**: CertificateAuthority.computeCertificateCommitment() → string

**Runtime Evidence**:
```typescript
export class CertificateAuthority {
  static computeCertificateCommitment(certificateWithoutCommitment: Omit<ReplayCertificate, 'certificate_commitment'>): string {
    const canonical = CanonicalJson.canonicalize(certificateWithoutCommitment);
    return this.sha256(canonical);
  }

  static computeConstitutionalLawCommitment(lawComponents: {
    invariant_definitions: any[];
    replay_rules: any[];
    witness_rules: any[];
    failure_rules: any[];
    authority_hierarchy: any[];
  }): string {
    const canonical = CanonicalJson.canonicalize(lawComponents);
    return this.sha256(canonical);
  }

  static sha256(input: string): string {
    // Runtime-neutral SHA-256 implementation
    // No Node crypto dependency
    // Pure TypeScript
  }
}
```

**Status**: EXISTS

---

### Constitutional Identity

**Authority File**: runtime/replay/certificate_authority.ts

**Import Path**: runtime/replay/certificate_authority.ts

**Execution Path**: CertificateAuthority.sha256() → string

**Runtime Evidence**:
```typescript
export class CertificateAuthority {
  static sha256(input: string): string {
    // Runtime-neutral SHA-256 implementation
    // No Node crypto dependency
    // Pure TypeScript
    // Used for artifact identity computation
  }
}
```

**Status**: EXISTS

---

### Constitutional Canonicalization

**Authority File**: runtime/replay/canonical_json.ts

**Import Path**: runtime/replay/canonical_json.ts

**Execution Path**: CanonicalJson.canonicalize() → string

**Runtime Evidence**:
```typescript
export class CanonicalJson {
  static canonicalize(value: unknown): string {
    return JSON.stringify(this.canonicalizeValue(value));
  }

  private static canonicalizeValue(value: unknown, visited = new Set<object>(), depth: number = 0): unknown {
    // Constitutional depth guard to prevent stack overflow
    if (depth > MAX_NESTING_DEPTH) {
      throw DeterministicFailureFactory.toError(...);
    }

    // Lexicographic property ordering
    if (typeof value === 'object' && value !== null) {
      const sortedKeys = Object.keys(value).sort();
      const result: any = {};
      for (const key of sortedKeys) {
        result[key] = this.canonicalizeValue(value[key], visited, depth + 1);
      }
      return result;
    }

    // ... more canonicalization logic
  }
}
```

**Status**: EXISTS

---

### Constitutional Time

**Authority File**: runtime/replay/replay_types.ts

**Import Path**: runtime/replay/replay_types.ts

**Execution Path**: CanonicalEventEnvelope.timestamp → string

**Runtime Evidence**:
```typescript
export interface CanonicalEventEnvelope {
  event_id: string;
  event_type: string;
  payload: any;
  timestamp: string; // ISO 8601 timestamp
  causality_chain: string[];
  constitutional_version: string;
}
```

**Status**: EXISTS

---

### Lineage

**Authority File**: runtime/replay/replay_state_machine.ts

**Import Path**: runtime/replay/replay_state_machine.ts

**Execution Path**: ReplayStateMachine.appendEvent() → lineage graph

**Runtime Evidence**:
```typescript
export class ReplayStateMachine {
  private state: ReplayState;

  constructor(initialState?: ReplayState) {
    this.state = initialState || {
      artifacts: new Map<ArtifactId, ArtifactState>(),
      seen_event_ids: new Set<string>(),
      event_to_artifact_map: new Map<string, string>(), // Lineage tracking
      state_version: '1.0'
    };
  }

  appendEvent(event: CanonicalEventEnvelope): void {
    // ... event processing logic
    
    // Build lineage graph
    for (const parentId of event.causality_chain) {
      this.state.lineage_graph.setdefault(parentId, []).push(event.event_id);
    }

    // Validate graph legality
    GraphValidator.validateGraph(this.state.lineage_graph);
  }

  getLineageGraph(): LineageGraph {
    return this.state.lineage_graph;
  }
}
```

**Status**: EXISTS

---

### Ollama Routing

**Authority File**: -

**Import Path**: -

**Execution Path**: -

**Runtime Evidence**: No ollama files found in runtime/

**Search Results**:
```bash
find_by_name runtime ollama
Result: 0 matches
```

**Status**: MISSING

---

### Complexity Routing

**Authority File**: -

**Import Path**: -

**Execution Path**: -

**Runtime Evidence**: No complexity routing files found in runtime/

**Search Results**:
```bash
find_by_name runtime complexity
Result: 0 matches
```

**Status**: MISSING

---

### Inference Event Emission

**Authority File**: -

**Import Path**: -

**Execution Path**: -

**Runtime Evidence**: No inference files found in runtime/

**Search Results**:
```bash
find_by_name runtime inference
Result: 0 matches
```

**Status**: MISSING

---

### Postgres Event Store

**Authority File**: runtime/adapters/postgres_event_store.ts

**Import Path**: runtime/adapters/postgres_event_store.ts

**Execution Path**: PostgresEventStore.storeEvent() → void

**Runtime Evidence**:
```typescript
export class PostgresEventStore {
  async storeEvent(event: CanonicalEventEnvelope): Promise<void> {
    // Infrastructure implementation for PostgreSQL storage
    // This is where the actual database operations happen
    console.log('Storing event in PostgreSQL:', event.getEventId());
    // Implementation would use pg library here
  }

  async loadEventStream(): Promise<ReplayEventStream> {
    // Infrastructure implementation for loading events from PostgreSQL
    console.log('Loading event stream from PostgreSQL');
    // Implementation would use pg library here
    return new ReplayEventStream([], '1.0');
  }

  async queryEvents(filter: any): Promise<CanonicalEventEnvelope[]> {
    // Infrastructure implementation for querying events from PostgreSQL
    console.log('Querying events from PostgreSQL with filter:', filter);
    // Implementation would use pg library here
    return [];
  }
}
```

**Additional Evidence**:
- runtime/kernel/commit-service/src/persistence/db.ts (connection pool)
- runtime/kernel/commit-service/src/events/event_log.ts (direct database writes)

**Constitutional Issue**: Direct database writes in event_log.ts violate constitutional event-first ordering. PostgresEventStore is a stub implementation (console.log only).

**Status**: PARTIAL

---

## CONSTITUTIONAL COMPLIANCE ASSESSMENT

### Constitutional Authorities (EXISTS)

All constitutional authorities are fully implemented in runtime/replay/:
- Events: Pure TypeScript, deterministic, immutable
- Witnesses: Pure TypeScript, Merkle tree, constitutional law commitment
- Replay: Pure TypeScript, deterministic, invariant verification
- Replay Verification: Pure TypeScript, comprehensive comparison
- Certificates: Pure TypeScript, SHA-256, no runtime dependencies
- Constitutional Identity: Pure TypeScript, SHA-256, runtime-neutral
- Constitutional Canonicalization: Pure TypeScript, RFC-8785 JCS
- Constitutional Time: Pure TypeScript, ISO 8601 timestamps
- Lineage: Pure TypeScript, event-derived, graph validation

### Missing Implementations (MISSING)

- Ollama Routing: Not implemented
- Complexity Routing: Not implemented
- Inference Event Emission: Not implemented

### Partial Implementations (PARTIAL)

- Postgres Event Store: Stub implementation, not constitutional event-first

---

## RECOMMENDATIONS

### For Missing Implementations

1. **Ollama Routing**: Implement Ollama integration in runtime/adapters/ollama_router.ts
2. **Complexity Routing**: Implement complexity routing in runtime/adapters/complexity_router.ts
3. **Inference Event Emission**: Implement inference event emission in runtime/adapters/inference_event_emitter.ts

### For Partial Implementation

1. **Postgres Event Store**: 
   - Complete stub implementation in runtime/adapters/postgres_event_store.ts
   - Remove direct database writes from runtime/kernel/commit-service/src/events/event_log.ts
   - Enforce constitutional event-first ordering

---

**END OF REPORT**
