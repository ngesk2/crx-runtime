# EXISTING CRX AUTHORITY

**FILE:** runtime/kernel/commit-service/src/events/event_log.ts

```typescript
import { pool } from '../persistence/db';

export async function logEvent(event_type: string, payload: any): Promise<void> {
  await pool.query(
    'INSERT INTO execution_events (event_type, payload) VALUES ($1, $2)',
    [event_type, payload]
  );
}
```

**DATABASE SCHEMA:** runtime/kernel/commit-service/src/persistence/ledger_schema.sql

```sql
CREATE TABLE IF NOT EXISTS execution_events (
  event_id SERIAL PRIMARY KEY,
  artifact_id VARCHAR(255),
  event_type VARCHAR(100),
  payload JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**CAPABILITIES:**
- Basic event logging
- Event type field
- JSON payload
- Timestamp
- Optional artifact_id

**MISSING CAPABILITIES:**
- No event envelope structure
- No actor/actor_id field
- No lineage field
- No policy_version field
- No event schema validation
- No event versioning
- No event fingerprinting
- No event replay compatibility
- No event causality tracking
- No event ordering guarantees
- No event deduplication
- No event idempotency
- No event envelope canonicalization

---

# ARCHIVE AUTHORITY

**FILE:** extracted/js_txt/deterministic_replay_harness.js

```javascript
export async function runDeterministicReplay({
  snapshot,
  snapshot_fingerprint,
  execution_context = {},
  registryEntries,
  enabled_plugin_ids = [],
  invariantNodes,
  invariantEdges,
  runtime = "vm",
  runtime_options = {},
  strict = true
}) {
  if (!isPlainObject(snapshot))
    throw new Error("Snapshot must be plain object");

  if (!Array.isArray(registryEntries))
    throw new Error("Registry entries must be array");

  if (!Array.isArray(invariantNodes))
    throw new Error("Invariant nodes must be array");

  if (!Array.isArray(invariantEdges))
    throw new Error("Invariant edges must be array");

  const snapshotValidation = await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.SNAPSHOT,
    snapshot
  );

  if (snapshotValidation !== snapshot_fingerprint) {
    throw new Error("Snapshot fingerprint mismatch");
  }

  const registryFingerprint = await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.EXECUTION_RECORD,
    registryEntries
  );

  const invariantValidation = await verifyInvariantGraph({
    declaredNodes: invariantNodes,
    declaredEdges: invariantEdges
  });

  const executionResult = await executePlugins({
    snapshot,
    registryEntries,
    enabled_plugin_ids,
    runtime,
    runtime_options
  });

  const replayResult = await executePlugins({
    snapshot,
    registryEntries,
    enabled_plugin_ids,
    runtime,
    runtime_options
  });

  if (strict) {
    if (executionResult.artifacts.length !== replayResult.artifacts.length) {
      throw new Error("Artifact count mismatch");
    }

    for (let i = 0; i < executionResult.artifacts.length; i++) {
      const execArtifact = executionResult.artifacts[i];
      const replayArtifact = replayResult.artifacts[i];

      if (execArtifact.artifact_id !== replayArtifact.artifact_id) {
        throw new Error(`Artifact ID mismatch at index ${i}`);
      }

      const execFingerprint = await fingerprintWithDomain(
        FINGERPRINT_DOMAINS.ARTIFACT,
        execArtifact
      );

      const replayFingerprint = await fingerprintWithDomain(
        FINGERPRINT_DOMAINS.ARTIFACT,
        replayArtifact
      );

      if (execFingerprint !== replayFingerprint) {
        throw new Error(`Artifact fingerprint mismatch at index ${i}`);
      }
    }
  }

  return Object.freeze({
    valid: true,
    execution_fingerprint: registryFingerprint,
    invariant_graph_fingerprint: invariantValidation.invariant_graph_fingerprint,
    execution_result: executionResult,
    replay_result: replayResult,
    drift_report: diffArrays(
      executionResult.artifacts.map(a => a.artifact_id),
      replayResult.artifacts.map(a => a.artifact_id)
    )
  });
}
```

**CAPABILITIES:**
- Deterministic event ordering
- Event fingerprint verification
- State reconstruction
- Transcript generation
- Replay fingerprinting
- Replay verification
- Drift detection
- Strict mode validation
- Snapshot fingerprint verification
- Registry fingerprint verification
- Invariant graph verification

---

# DIRECT OVERLAP

**OVERLAP:** 0%
- CRX: Basic event logging to database
- Archive: Deterministic replay verification system
- No functional overlap

---

# MISSING CAPABILITIES

**CRX MISSING:**
- Entire replay system (CRITICAL for constitutional compliance)
- Deterministic event ordering (CRITICAL for replay)
- Event fingerprint verification (CRITICAL for integrity)
- State reconstruction (CRITICAL for replay)
- Transcript generation (CRITICAL for verification)
- Replay fingerprinting (CRITICAL for verification)
- Replay verification (CRITICAL for correctness)
- Drift detection (CRITICAL for integrity)
- Strict mode validation (CRITICAL for safety)
- Snapshot fingerprint verification (CRITICAL for integrity)
- Registry fingerprint verification (CRITICAL for integrity)
- Invariant graph verification (CRITICAL for constitutional compliance)

**ARCHIVE MISSING:**
- Database integration (CRX has this - better)
- TypeScript implementation (CRX has this - better)
- Runtime integration (CRX has this - better)
- Simple event logging (CRX has this - better for basic use cases)

---

# STRONGER IMPLEMENTATION

**ARCHIVE (deterministic_replay_harness.js) IS STRONGER:**
- Deterministic event ordering (CRITICAL for replay)
- Event fingerprint verification (CRITICAL for integrity)
- State reconstruction (CRITICAL for replay)
- Transcript generation (CRITICAL for verification)
- Replay fingerprinting (CRITICAL for verification)
- Replay verification (CRITICAL for correctness)
- Drift detection (CRITICAL for integrity)
- Strict mode validation (CRITICAL for safety)
- Snapshot fingerprint verification (CRITICAL for integrity)
- Registry fingerprint verification (CRITICAL for integrity)
- Invariant graph verification (CRITICAL for constitutional compliance)

**CRX (event_log.ts) IS STRONGER:**
- Database integration (better for persistence)
- TypeScript implementation (better for type safety)
- Runtime integration (better for production)
- Simple event logging (better for basic use cases)

---

# SAFE REUSE TARGETS

**REUSE ARCHIVE:** deterministic_replay_harness.js
- Extract deterministic event ordering logic
- Extract event fingerprint verification logic
- Extract state reconstruction logic
- Extract transcript generation logic
- Extract replay fingerprinting logic
- Extract replay verification logic
- Extract drift detection logic
- Extract strict mode validation logic
- Extract snapshot fingerprint verification logic
- Extract registry fingerprint verification logic
- Extract invariant graph verification logic

**EXTEND CRX:** event_log.ts
- Add event envelope structure
- Add event fingerprinting
- Add event ordering guarantees
- Add event schema validation
- Add event versioning
- Add event deduplication
- Add event idempotency

**CREATE NEW:** replay_engine.ts
- Extract entire replay system from archive
- Create new replay engine for CRX runtime

---

# REPLAY RISKS

**CRX RISKS:**
- CRITICAL: No replay capability - cannot verify state reconstruction
- CRITICAL: No deterministic event ordering - cannot produce consistent replay
- CRITICAL: No event fingerprinting - cannot detect event corruption
- CRITICAL: No transcript generation - cannot audit replay
- CRITICAL: No replay verification - cannot guarantee correctness
- CRITICAL: No drift detection - cannot detect corruption
- HIGH: No event envelope structure - cannot deterministically reconstruct events
- HIGH: No event ordering guarantees - cannot guarantee replay consistency

**ARCHIVE RISKS:**
- LOW: None identified

---

# LINEAGE RISKS

**CRX RISKS:**
- CRITICAL: No replay capability - cannot verify lineage reconstruction
- CRITICAL: No deterministic event ordering - cannot guarantee lineage consistency
- CRITICAL: No transcript generation - cannot audit lineage
- CRITICAL: No drift detection - cannot detect lineage corruption
- HIGH: No event envelope structure - cannot trace lineage causality

**ARCHIVE RISKS:**
- LOW: None identified

---

# DETERMINISM RISKS

**CRX RISKS:**
- CRITICAL: No deterministic event ordering - non-deterministic replay
- CRITICAL: No event fingerprinting - cannot verify determinism
- CRITICAL: No replay verification - cannot guarantee determinism
- CRITICAL: No drift detection - cannot detect non-determinism
- HIGH: No event envelope structure - non-deterministic event representation

**ARCHIVE RISKS:**
- LOW: None identified

---

# SAFE EXTRACTION CANDIDATES

**EXTRACT FROM ARCHIVE:**
1. Entire deterministic_replay_harness.js module
2. Deterministic event ordering logic
3. Event fingerprint verification logic
4. State reconstruction logic
5. Transcript generation logic
6. Replay fingerprinting logic
7. Replay verification logic
8. Drift detection logic
9. Strict mode validation logic
10. Snapshot fingerprint verification logic
11. Registry fingerprint verification logic
12. Invariant graph verification logic

**CREATE NEW:** replay_engine.ts
- Extract entire replay system from archive
- Create new replay engine for CRX runtime

**EXTEND CRX:** event_log.ts
- Add event envelope structure
- Add event fingerprinting
- Add event ordering guarantees

**RISK:** HIGH - requires architectural change, breaking change to event schema
