# Storage Authority Violations Audit

## Constitutional Requirements

**AGENT.md MANDATES:**
- Replay is authority
- Persistence is adapter
- Storage must NOT be treated as truth authority
- Storage is infrastructure
- Replay must verify storage

**CURRENT VIOLATIONS:**
- CRX treats PostgreSQL as truth authority
- No replay verification of stored state
- No transcript verification
- No state reconstruction from events
- Storage is treated as authority, not replay

---

## Storage Authority Violations

**VIOLATION 1: PostgreSQL as Truth Authority**
- CRX treats PostgreSQL as source of truth
- No replay verification of stored artifacts
- No replay verification of stored lineage
- No replay verification of stored events
- Storage is treated as authority, not replay

**SEVERITY:** CRITICAL

**EVIDENCE:** commit_controller.ts directly inserts into PostgreSQL without replay verification

**FILE:** runtime/kernel/commit-service/src/api/commit_controller.ts
**LINE:** 19-21
```typescript
await storeArtifact(artifactId, artifact);
await storeLineage(parentIds, artifactId);
await logEvent("artifact_commit", { artifactId });
```

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates replay as authority, not storage

---

**VIOLATION 2: No Replay Verification Before Storage**
- Artifacts stored without replay verification
- Lineage stored without replay verification
- Events stored without replay verification
- No verification that stored state matches replay

**SEVERITY:** CRITICAL

**EVIDENCE:** No replay verification in commit_controller.ts

**FILE:** runtime/kernel/commit-service/src/api/commit_controller.ts
**LINE:** 4-36
**CONSTITUTIONAL VIOLATION:** AGENT.md mandates replay verification before storage

---

**VIOLATION 3: No Transcript Verification**
- No transcript generation
- No transcript verification
- No transcript storage
- No transcript replay verification

**SEVERITY:** CRITICAL

**EVIDENCE:** No transcript-related files in runtime/kernel/commit-service/src/

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates transcript verification

---

**VIOLATION 4: No State Reconstruction from Events**
- No state reconstruction capability
- No state verification from events
- No state fingerprint verification
- No state replay verification

**SEVERITY:** CRITICAL

**EVIDENCE:** No state reconstruction files in runtime/kernel/commit-service/src/

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates state reconstruction from events

---

**VIOLATION 5: Direct Database Access in Kernel**
- Kernel directly accesses PostgreSQL
- No abstraction layer for persistence
- No persistence adapter
- Kernel is infrastructure-dependent

**SEVERITY:** HIGH

**EVIDENCE:** db.ts exports pool directly, all persistence modules import pool

**FILE:** runtime/kernel/commit-service/src/persistence/db.ts
**LINE:** 3-5
```typescript
import { Pool } from 'pg';
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates kernel must NOT depend on Postgres

---

**VIOLATION 6: No Storage Adapter Pattern**
- No persistence adapter abstraction
- No storage interface
- No storage provider independence
- Storage is tightly coupled to PostgreSQL

**SEVERITY:** HIGH

**EVIDENCE:** No adapter files in runtime/kernel/commit-service/src/

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates persistence as adapter

---

**VIOLATION 7: No Storage Fingerprint Verification**
- No fingerprint verification of stored artifacts
- No fingerprint verification of stored lineage
- No fingerprint verification of stored events
- No storage integrity verification

**SEVERITY:** HIGH

**EVIDENCE:** No fingerprint verification in persistence modules

**FILE:** runtime/kernel/commit-service/src/persistence/artifact_store.ts
**LINE:** 6-13
```typescript
await pool.query(
  'INSERT INTO artifacts(artifact_id, artifact_type, content) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
  [id, artifact.artifact_type || 'unknown', JSON.stringify(artifact)]
);
```

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates fingerprint verification

---

**VIOLATION 8: No Storage Replay Verification**
- No replay verification of storage reads
- No replay verification of storage writes
- No replay verification of storage updates
- No replay verification of storage deletes

**SEVERITY:** HIGH

**EVIDENCE:** No replay verification in persistence modules

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates replay verification of storage operations

---

## Storage Authority Separation Strategy

**PHASE 1: Create Storage Adapter Pattern**
- Create persistence_adapter.ts interface
- Create postgres_adapter.ts implementation
- Create storage_adapter.ts abstraction layer
- Decouple kernel from PostgreSQL

**PHASE 2: Implement Replay Verification**
- Add replay verification before storage writes
- Add replay verification after storage reads
- Add replay verification for all storage operations
- Verify stored state matches replay

**PHASE 3: Implement Transcript System**
- Create transcript_generator.ts
- Create transcript_verifier.ts
- Add transcript generation to all operations
- Add transcript verification to all operations

**PHASE 4: Implement State Reconstruction**
- Create state_rebuilder.ts
- Create state_verifier.ts
- Add state reconstruction from events
- Add state verification from replay

**PHASE 5: Implement Storage Fingerprint Verification**
- Add fingerprint verification before storage writes
- Add fingerprint verification after storage reads
- Add fingerprint verification for all storage operations
- Verify storage integrity

---

## Proposed Storage Architecture

```
kernel/ (pure, deterministic, infrastructure-independent)
├── persistence/
│   ├── persistence_adapter.ts (interface)
│   └── storage_verifier.ts (pure)

adapters/ (infrastructure abstraction)
├── persistence/
│   ├── postgres_adapter.ts (Postgres-specific)
│   ├── sqlite_adapter.ts (SQLite-specific)
│   └── memory_adapter.ts (in-memory)

runtime/ (infrastructure-dependent, may have side effects)
├── persistence/
│   ├── storage_executor.ts (impure)
│   └── storage_orchestrator.ts (impure)
```

---

## Proposed Storage Adapter Interface

```typescript
export interface PersistenceAdapter {
  // Artifact operations
  storeArtifact(id: string, artifact: any): Promise<void>;
  getArtifact(id: string): Promise<any>;
  verifyArtifact(id: string, expectedFingerprint: string): Promise<boolean>;

  // Lineage operations
  storeLineage(parentIds: string[], childId: string): Promise<void>;
  getLineage(childId: string): Promise<string[]>;
  verifyLineage(childId: string, expectedFingerprint: string): Promise<boolean>;

  // Event operations
  storeEvent(event: EventEnvelope): Promise<void>;
  getEvent(eventId: string): Promise<EventEnvelope>;
  verifyEvent(eventId: string, expectedFingerprint: string): Promise<boolean>;

  // Transcript operations
  storeTranscript(transcript: ReplayTranscript): Promise<void>;
  getTranscript(replayId: string): Promise<ReplayTranscript>;
  verifyTranscript(replayId: string, expectedFingerprint: string): Promise<boolean>;

  // State operations
  storeState(stateId: string, state: any): Promise<void>;
  getState(stateId: string): Promise<any>;
  verifyState(stateId: string, expectedFingerprint: string): Promise<boolean>;
}

export interface StorageVerifier {
  verifyStorageIntegrity(): Promise<boolean>;
  verifyStorageReplayConsistency(): Promise<boolean>;
  detectStorageCorruption(): Promise<string[]>;
  repairStorageCorruption(): Promise<void>;
}
```

---

## Migration Path

**STEP 1: Create Storage Adapter Interface**
- Create kernel/persistence/persistence_adapter.ts
- Define PersistenceAdapter interface
- Define StorageVerifier interface

**STEP 2: Create PostgreSQL Adapter**
- Create adapters/persistence/postgres_adapter.ts
- Implement PersistenceAdapter interface
- Implement StorageVerifier interface

**STEP 3: Create Storage Verifier**
- Create kernel/persistence/storage_verifier.ts
- Implement storage integrity verification
- Implement replay consistency verification
- Implement corruption detection

**STEP 4: Update Persistence Modules**
- Update artifact_store.ts to use adapter
- Update lineage_store.ts to use adapter
- Update event_log.ts to use adapter
- Add replay verification

**STEP 5: Add Transcript System**
- Create runtime/persistence/transcript_generator.ts
- Create runtime/persistence/transcript_verifier.ts
- Add transcript generation to all operations
- Add transcript verification to all operations

**STEP 6: Add State Reconstruction**
- Create kernel/replay/state_rebuilder.ts
- Create kernel/replay/state_verifier.ts
- Add state reconstruction from events
- Add state verification from replay

**STEP 7: Add Storage Fingerprint Verification**
- Add fingerprint verification before storage writes
- Add fingerprint verification after storage reads
- Add fingerprint verification for all storage operations
- Verify storage integrity

**STEP 8: Decouple Kernel from PostgreSQL**
- Remove PostgreSQL dependency from kernel
- Remove pool import from kernel modules
- Verify kernel is infrastructure-independent

**STEP 9: Update Imports**
- Update all imports to use adapter pattern
- Update package.json scripts
- Update documentation

---

## Risk Assessment

**HIGH RISK:**
- Requires architectural restructuring
- Requires breaking changes
- Requires extensive testing
- Requires migration of existing data
- Requires migration of existing code

**MITIGATION:**
- Implement incrementally
- Create migration script
- Add comprehensive tests
- Document migration process
- Provide rollback plan
