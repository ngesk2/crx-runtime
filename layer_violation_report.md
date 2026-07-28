# Layer Violation Report

### Violation in kernel/execution/audit-hook.ts
- **Target Import:** `../identity/canonical-identity-service`
- **Violated Layer:** execution illegally depending on identity
- **Evidence Statement:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/audit-hook.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** execution illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/execution-context.ts
- **Target Import:** `../identity/canonical-identity-service`
- **Violated Layer:** execution illegally depending on identity
- **Evidence Statement:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/execution-context.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** execution illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/execution-event-bus.ts
- **Target Import:** `../identity/canonical-identity-service`
- **Violated Layer:** execution illegally depending on identity
- **Evidence Statement:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/execution-event-bus.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** execution illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/metrics-hook.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** execution illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/replay-hook.ts
- **Target Import:** `../replay/event-envelope`
- **Violated Layer:** execution illegally depending on replay
- **Evidence Statement:** `import { ReplayEventEnvelopeBuilder } from '../replay/event-envelope';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/replay-hook.ts
- **Target Import:** `../replay/replay-transcript`
- **Violated Layer:** execution illegally depending on replay
- **Evidence Statement:** `import { ReplayTranscriptBuilder } from '../replay/replay-transcript';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/replay-hook.ts
- **Target Import:** `../replay/event-store`
- **Violated Layer:** execution illegally depending on replay
- **Evidence Statement:** `import { InMemoryEventStore } from '../replay/event-store';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/replay-hook.ts
- **Target Import:** `../identity/canonical-object`
- **Violated Layer:** execution illegally depending on identity
- **Evidence Statement:** `import { CanonicalObject } from '../identity/canonical-object';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/replay-hook.ts
- **Target Import:** `../identity/canonical-identity-service`
- **Violated Layer:** execution illegally depending on identity
- **Evidence Statement:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/replay-hook.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** execution illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/replay-hook.ts
- **Target Import:** `../replay/replay-authority-interface`
- **Violated Layer:** execution illegally depending on replay
- **Evidence Statement:** `import { IReplayAuthority } from '../replay/replay-authority-interface';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/telemetry-hook.ts
- **Target Import:** `../identity/canonical-identity-service`
- **Violated Layer:** execution illegally depending on identity
- **Evidence Statement:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/execution/telemetry-hook.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** execution illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/governance/governance-authority-interface.ts
- **Target Import:** `../repository/repository-authority-interface`
- **Violated Layer:** governance illegally depending on repository
- **Evidence Statement:** `import { CanonicalObject } from '../repository/repository-authority-interface';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/replay/event-envelope.ts
- **Target Import:** `../identity/canonical-object`
- **Violated Layer:** replay illegally depending on identity
- **Evidence Statement:** `import { CanonicalObject } from '../identity/canonical-object';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/replay/event-envelope.ts
- **Target Import:** `../identity/canonical-identity-service`
- **Violated Layer:** replay illegally depending on identity
- **Evidence Statement:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/replay/replay-authority.ts
- **Target Import:** `../identity/canonical-identity-service`
- **Violated Layer:** replay illegally depending on identity
- **Evidence Statement:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/replay/replay-authority.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** replay illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/replay/replay-event.ts
- **Target Import:** `../identity/canonical-object`
- **Violated Layer:** replay illegally depending on identity
- **Evidence Statement:** `import { CanonicalObject } from '../identity/canonical-object';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/replay/replay-event.ts
- **Target Import:** `../identity/canonical-identity-service`
- **Violated Layer:** replay illegally depending on identity
- **Evidence Statement:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/replay/replay-event.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** replay illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/replay/replay-transcript.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** replay illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/scheduler/execution-request.ts
- **Target Import:** `../identity/canonical-identity-service`
- **Violated Layer:** scheduler illegally depending on identity
- **Evidence Statement:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/scheduler/execution-request.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** scheduler illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/canonical_hash_authority.ts
- **Target Import:** `../replay/replay_types`
- **Violated Layer:** witness illegally depending on replay
- **Evidence Statement:** `import { Fingerprint, CanonicalBytes } from '../replay/replay_types';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/canonical_hash_authority.ts
- **Target Import:** `../replay/canonical_json`
- **Violated Layer:** witness illegally depending on replay
- **Evidence Statement:** `import { CanonicalJson } from '../replay/canonical_json';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/canonical_hash_authority.ts
- **Target Import:** `../replay/byte_utils`
- **Violated Layer:** witness illegally depending on replay
- **Evidence Statement:** `import { base64UrlEncode, base64UrlDecode, utf8Decode } from '../replay/byte_utils';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/certificate-engine.ts
- **Target Import:** `../replay/replay-transcript`
- **Violated Layer:** witness illegally depending on replay
- **Evidence Statement:** `import { ReplayTranscript } from '../replay/replay-transcript';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/certificate-engine.ts
- **Target Import:** `../identity/typed-references`
- **Violated Layer:** witness illegally depending on identity
- **Evidence Statement:** `import { KnowledgeReference } from '../identity/typed-references';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/certificate-engine.ts
- **Target Import:** `../identity/canonical-identity-service`
- **Violated Layer:** witness illegally depending on identity
- **Evidence Statement:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/certificate-engine.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** witness illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/certificate_authority.ts
- **Target Import:** `../replay/canonical_json`
- **Violated Layer:** witness illegally depending on replay
- **Evidence Statement:** `import { CanonicalJson } from '../replay/canonical_json';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/certificate_authority.ts
- **Target Import:** `../replay/replay_types`
- **Violated Layer:** witness illegally depending on replay
- **Evidence Statement:** `import { ReplayCertificate } from '../replay/replay_types';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/cryptographic-authorities.ts
- **Target Import:** `../identity/canonical-identity-service`
- **Violated Layer:** witness illegally depending on identity
- **Evidence Statement:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/cryptographic-authorities.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** witness illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/replay-verifier.ts
- **Target Import:** `../replay/replay-transcript`
- **Violated Layer:** witness illegally depending on replay
- **Evidence Statement:** `import { ReplayTranscript } from '../replay/replay-transcript';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/replay-verifier.ts
- **Target Import:** `../replay/event-envelope`
- **Violated Layer:** witness illegally depending on replay
- **Evidence Statement:** `import { ReplayEventEnvelope } from '../replay/event-envelope';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/verification-engine.ts
- **Target Import:** `../replay/replay-transcript`
- **Violated Layer:** witness illegally depending on replay
- **Evidence Statement:** `import { ReplayTranscript } from '../replay/replay-transcript';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/witness-engine.ts
- **Target Import:** `../replay/event-envelope`
- **Violated Layer:** witness illegally depending on replay
- **Evidence Statement:** `import { ReplayEventEnvelope } from '../replay/event-envelope';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/witness-engine.ts
- **Target Import:** `../replay/replay-transcript`
- **Violated Layer:** witness illegally depending on replay
- **Evidence Statement:** `import { ReplayTranscript } from '../replay/replay-transcript';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/witness-engine.ts
- **Target Import:** `../identity/canonical-identity-service`
- **Violated Layer:** witness illegally depending on identity
- **Evidence Statement:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/witness/witness-engine.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** witness illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/workers/lease.ts
- **Target Import:** `../identity/canonical-identity-service`
- **Violated Layer:** workers illegally depending on identity
- **Evidence Statement:** `import { CanonicalIdentityService } from '../identity/canonical-identity-service';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/workers/lease.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** workers illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

### Violation in kernel/workers/worker-registry.ts
- **Target Import:** `../identity/canonical-clock`
- **Violated Layer:** workers illegally depending on identity
- **Evidence Statement:** `import { CanonicalClock } from '../identity/canonical-clock';`
- **Constitutional Rule Violated:** Upward layer dependency.

