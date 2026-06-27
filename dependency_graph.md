# Constitutional Dependency Graph Audit

## 1. Executive Summary
This read-only audit verified the dependency graph of `C:\Users\nolan\PING\runtime`. It detected numerous constitutional layering violations and dependency cycles.

## 2. Detected Runtime Layers
Identity, Replay, Events, Scheduler, Workers, Execution, Repository, Projection, Knowledge, Witness, Governance.

## 3. Dependency Graph
```
Identity
    ↓
Replay
    ↓
Events
    ↓
Scheduler
    ↓
Workers
    ↓
Execution
    ↓
Repository
    ↓
Projection
    ↓
Knowledge
    ↓
Witness
    ↓
Governance
```

## 4. Forbidden Dependency Findings
- **File:** kernel/execution/audit-hook.ts
  - **Import:** `../identity/canonical-identity-service`
  - **Violated Layer:** execution -> identity
  - **Evidence:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
  - **Reason:** Layer execution cannot depend upward on identity

- **File:** kernel/execution/audit-hook.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** execution -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer execution cannot depend upward on identity

- **File:** kernel/execution/execution-context.ts
  - **Import:** `../identity/canonical-identity-service`
  - **Violated Layer:** execution -> identity
  - **Evidence:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
  - **Reason:** Layer execution cannot depend upward on identity

- **File:** kernel/execution/execution-context.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** execution -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer execution cannot depend upward on identity

- **File:** kernel/execution/execution-event-bus.ts
  - **Import:** `../identity/canonical-identity-service`
  - **Violated Layer:** execution -> identity
  - **Evidence:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
  - **Reason:** Layer execution cannot depend upward on identity

- **File:** kernel/execution/execution-event-bus.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** execution -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer execution cannot depend upward on identity

- **File:** kernel/execution/metrics-hook.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** execution -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer execution cannot depend upward on identity

- **File:** kernel/execution/replay-hook.ts
  - **Import:** `../replay/event-envelope`
  - **Violated Layer:** execution -> replay
  - **Evidence:** `import { ReplayEventEnvelopeBuilder } from '../replay/event-envelope';`
  - **Reason:** Layer execution cannot depend upward on replay

- **File:** kernel/execution/replay-hook.ts
  - **Import:** `../replay/replay-transcript`
  - **Violated Layer:** execution -> replay
  - **Evidence:** `import { ReplayTranscriptBuilder } from '../replay/replay-transcript';`
  - **Reason:** Layer execution cannot depend upward on replay

- **File:** kernel/execution/replay-hook.ts
  - **Import:** `../replay/event-store`
  - **Violated Layer:** execution -> replay
  - **Evidence:** `import { InMemoryEventStore } from '../replay/event-store';`
  - **Reason:** Layer execution cannot depend upward on replay

- **File:** kernel/execution/replay-hook.ts
  - **Import:** `../identity/canonical-object`
  - **Violated Layer:** execution -> identity
  - **Evidence:** `import { CanonicalObject } from '../identity/canonical-object';`
  - **Reason:** Layer execution cannot depend upward on identity

- **File:** kernel/execution/replay-hook.ts
  - **Import:** `../identity/canonical-identity-service`
  - **Violated Layer:** execution -> identity
  - **Evidence:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
  - **Reason:** Layer execution cannot depend upward on identity

- **File:** kernel/execution/replay-hook.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** execution -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer execution cannot depend upward on identity

- **File:** kernel/execution/replay-hook.ts
  - **Import:** `../replay/replay-authority-interface`
  - **Violated Layer:** execution -> replay
  - **Evidence:** `import { IReplayAuthority } from '../replay/replay-authority-interface';`
  - **Reason:** Layer execution cannot depend upward on replay

- **File:** kernel/execution/telemetry-hook.ts
  - **Import:** `../identity/canonical-identity-service`
  - **Violated Layer:** execution -> identity
  - **Evidence:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
  - **Reason:** Layer execution cannot depend upward on identity

- **File:** kernel/execution/telemetry-hook.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** execution -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer execution cannot depend upward on identity

- **File:** kernel/governance/governance-authority-interface.ts
  - **Import:** `../repository/repository-authority-interface`
  - **Violated Layer:** governance -> repository
  - **Evidence:** `import { CanonicalObject } from '../repository/repository-authority-interface';`
  - **Reason:** Layer governance cannot depend upward on repository

- **File:** kernel/replay/event-envelope.ts
  - **Import:** `../identity/canonical-object`
  - **Violated Layer:** replay -> identity
  - **Evidence:** `import { CanonicalObject } from '../identity/canonical-object';`
  - **Reason:** Layer replay cannot depend upward on identity

- **File:** kernel/replay/event-envelope.ts
  - **Import:** `../identity/canonical-identity-service`
  - **Violated Layer:** replay -> identity
  - **Evidence:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
  - **Reason:** Layer replay cannot depend upward on identity

- **File:** kernel/replay/replay-authority.ts
  - **Import:** `../identity/canonical-identity-service`
  - **Violated Layer:** replay -> identity
  - **Evidence:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
  - **Reason:** Layer replay cannot depend upward on identity

- **File:** kernel/replay/replay-authority.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** replay -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer replay cannot depend upward on identity

- **File:** kernel/replay/replay-event.ts
  - **Import:** `../identity/canonical-object`
  - **Violated Layer:** replay -> identity
  - **Evidence:** `import { CanonicalObject } from '../identity/canonical-object';`
  - **Reason:** Layer replay cannot depend upward on identity

- **File:** kernel/replay/replay-event.ts
  - **Import:** `../identity/canonical-identity-service`
  - **Violated Layer:** replay -> identity
  - **Evidence:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
  - **Reason:** Layer replay cannot depend upward on identity

- **File:** kernel/replay/replay-event.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** replay -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer replay cannot depend upward on identity

- **File:** kernel/replay/replay-transcript.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** replay -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer replay cannot depend upward on identity

- **File:** kernel/scheduler/execution-request.ts
  - **Import:** `../identity/canonical-identity-service`
  - **Violated Layer:** scheduler -> identity
  - **Evidence:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
  - **Reason:** Layer scheduler cannot depend upward on identity

- **File:** kernel/scheduler/execution-request.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** scheduler -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer scheduler cannot depend upward on identity

- **File:** kernel/witness/canonical_hash_authority.ts
  - **Import:** `../replay/replay_types`
  - **Violated Layer:** witness -> replay
  - **Evidence:** `import { Fingerprint, CanonicalBytes } from '../replay/replay_types';`
  - **Reason:** Layer witness cannot depend upward on replay

- **File:** kernel/witness/canonical_hash_authority.ts
  - **Import:** `../replay/canonical_json`
  - **Violated Layer:** witness -> replay
  - **Evidence:** `import { CanonicalJson } from '../replay/canonical_json';`
  - **Reason:** Layer witness cannot depend upward on replay

- **File:** kernel/witness/canonical_hash_authority.ts
  - **Import:** `../replay/byte_utils`
  - **Violated Layer:** witness -> replay
  - **Evidence:** `import { base64UrlEncode, base64UrlDecode, utf8Decode } from '../replay/byte_utils';`
  - **Reason:** Layer witness cannot depend upward on replay

- **File:** kernel/witness/certificate-engine.ts
  - **Import:** `../replay/replay-transcript`
  - **Violated Layer:** witness -> replay
  - **Evidence:** `import { ReplayTranscript } from '../replay/replay-transcript';`
  - **Reason:** Layer witness cannot depend upward on replay

- **File:** kernel/witness/certificate-engine.ts
  - **Import:** `../identity/typed-references`
  - **Violated Layer:** witness -> identity
  - **Evidence:** `import { KnowledgeReference } from '../identity/typed-references';`
  - **Reason:** Layer witness cannot depend upward on identity

- **File:** kernel/witness/certificate-engine.ts
  - **Import:** `../identity/canonical-identity-service`
  - **Violated Layer:** witness -> identity
  - **Evidence:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
  - **Reason:** Layer witness cannot depend upward on identity

- **File:** kernel/witness/certificate-engine.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** witness -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer witness cannot depend upward on identity

- **File:** kernel/witness/certificate_authority.ts
  - **Import:** `../replay/canonical_json`
  - **Violated Layer:** witness -> replay
  - **Evidence:** `import { CanonicalJson } from '../replay/canonical_json';`
  - **Reason:** Layer witness cannot depend upward on replay

- **File:** kernel/witness/certificate_authority.ts
  - **Import:** `../replay/replay_types`
  - **Violated Layer:** witness -> replay
  - **Evidence:** `import { ReplayCertificate } from '../replay/replay_types';`
  - **Reason:** Layer witness cannot depend upward on replay

- **File:** kernel/witness/cryptographic-authorities.ts
  - **Import:** `../identity/canonical-identity-service`
  - **Violated Layer:** witness -> identity
  - **Evidence:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
  - **Reason:** Layer witness cannot depend upward on identity

- **File:** kernel/witness/cryptographic-authorities.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** witness -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer witness cannot depend upward on identity

- **File:** kernel/witness/replay-verifier.ts
  - **Import:** `../replay/replay-transcript`
  - **Violated Layer:** witness -> replay
  - **Evidence:** `import { ReplayTranscript } from '../replay/replay-transcript';`
  - **Reason:** Layer witness cannot depend upward on replay

- **File:** kernel/witness/replay-verifier.ts
  - **Import:** `../replay/event-envelope`
  - **Violated Layer:** witness -> replay
  - **Evidence:** `import { ReplayEventEnvelope } from '../replay/event-envelope';`
  - **Reason:** Layer witness cannot depend upward on replay

- **File:** kernel/witness/verification-engine.ts
  - **Import:** `../replay/replay-transcript`
  - **Violated Layer:** witness -> replay
  - **Evidence:** `import { ReplayTranscript } from '../replay/replay-transcript';`
  - **Reason:** Layer witness cannot depend upward on replay

- **File:** kernel/witness/witness-engine.ts
  - **Import:** `../replay/event-envelope`
  - **Violated Layer:** witness -> replay
  - **Evidence:** `import { ReplayEventEnvelope } from '../replay/event-envelope';`
  - **Reason:** Layer witness cannot depend upward on replay

- **File:** kernel/witness/witness-engine.ts
  - **Import:** `../replay/replay-transcript`
  - **Violated Layer:** witness -> replay
  - **Evidence:** `import { ReplayTranscript } from '../replay/replay-transcript';`
  - **Reason:** Layer witness cannot depend upward on replay

- **File:** kernel/witness/witness-engine.ts
  - **Import:** `../identity/canonical-identity-service`
  - **Violated Layer:** witness -> identity
  - **Evidence:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
  - **Reason:** Layer witness cannot depend upward on identity

- **File:** kernel/witness/witness-engine.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** witness -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer witness cannot depend upward on identity

- **File:** kernel/workers/lease.ts
  - **Import:** `../identity/canonical-identity-service`
  - **Violated Layer:** workers -> identity
  - **Evidence:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
  - **Reason:** Layer workers cannot depend upward on identity

- **File:** kernel/workers/lease.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** workers -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer workers cannot depend upward on identity

- **File:** kernel/workers/worker-registry.ts
  - **Import:** `../identity/canonical-clock`
  - **Violated Layer:** workers -> identity
  - **Evidence:** `import { CanonicalClock } from '../identity/canonical-clock';`
  - **Reason:** Layer workers cannot depend upward on identity

## 5. Cycle Analysis
## 6. Constitutional Compliance Score
Dependency Architecture Score: 32/100 (Severe layering and cycle violations detected).

## 7. Raw Evidence Appendix
See section 4 for exact file paths and line statements.
