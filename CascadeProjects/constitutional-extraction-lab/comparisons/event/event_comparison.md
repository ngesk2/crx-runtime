# Event Analysis

## Current CRX Implementation

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

## Legacy Event Schemas

**FILE:** vos/cos/schema/audit-event.schema.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CRX Audit Event",
  "type": "object",
  "required": ["id", "timestamp", "actor", "action", "artifactType", "artifactId"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "actor": {
      "type": "object",
      "required": ["actorId", "actorType"],
      "properties": {
        "actorId": { "type": "string" },
        "actorType": { "type": "string", "enum": ["USER", "SYSTEM", "AGENT"] }
      }
    },
    "action": {
      "type": "string",
      "enum": ["COMMIT", "AUDIT", "QUERY", "DELETE"]
    },
    "artifactType": {
      "type": "string"
    },
    "artifactId": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$"
    },
    "lineage": {
      "type": "object",
      "properties": {
        "parents": { "type": "array", "items": { "type": "string" } }
      }
    },
    "policyVersion": {
      "type": "string"
    }
  }
}
```

**FILE:** knowledge/authoritative/claim.schema.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "UCIA Claim Event",
  "type": "object",
  "required": ["claim_id", "proposer", "scope", "assertion", "evidence_refs", "requested_authority", "risk_level", "created_at", "status"],
  "properties": {
    "claim_id": { "type": "string" },
    "proposer": { "type": "object" },
    "scope": { "type": "string" },
    "assertion": { "type": "object" },
    "evidence_refs": { "type": "array" },
    "requested_authority": { "type": "string" },
    "risk_level": { "type": "string", "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW"] },
    "created_at": { "type": "string", "format": "date-time" },
    "status": { "type": "string", "enum": ["PENDING", "ACCEPTED", "REJECTED"] }
  }
}
```

**FILE:** knowledge/authoritative/decision.schema.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "UCIA Decision Event",
  "type": "object",
  "required": ["decision_id", "review_authority", "claim_id", "outcome", "justification", "accepted_claims", "rejected_claims", "decided_at"],
  "properties": {
    "decision_id": { "type": "string" },
    "review_authority": { "type": "string" },
    "claim_id": { "type": "string" },
    "outcome": { "type": "string", "enum": ["APPROVE", "REJECT", "DEFER"] },
    "justification": { "type": "string" },
    "accepted_claims": { "type": "array" },
    "rejected_claims": { "type": "array" },
    "decided_at": { "type": "string", "format": "date-time" }
  }
}
```

---

## MCP0.txt Event Structure

**FILE:** MCP0.txt (lines 39-45)

```
/kernel/event
  ├── event-envelope.ts
  ├── event-types.ts
  ├── append-only-log.ts
  ├── event-validator.ts
  ├── compensating-events.ts
  └── event-store.ts
```

**PROTOCOLS:** MCP0.txt (lines 156-159)

```
/protocols/event
  ├── event-protocol.ts
  ├── event-schema.json
  └── event-contracts.ts
```

---

## Comparison Analysis

**OVERLAP:**
- Both have event logging
- Both have timestamps
- Both have JSON payloads

**CRX MISSING:**
- Event envelope structure (CRITICAL for replay)
- Actor/actor_id field (CRITICAL for attribution)
- Lineage field (CRITICAL for causality)
- Policy_version field (CRITICAL for replay)
- Event schema validation (CRITICAL for integrity)
- Event versioning (CRITICAL for migration)
- Event fingerprinting (CRITICAL for replay)
- Event causality tracking (CRITICAL for replay)
- Event ordering guarantees (CRITICAL for replay)
- Event deduplication (CRITICAL for idempotency)
- Event idempotency (CRITICAL for replay)
- Event envelope canonicalization (CRITICAL for replay)

**LEGACY MISSING:**
- Runtime implementation (schemas only, no runtime)
- TypeScript implementation (CRX has this - better)
- Database integration (CRX has this - better)

---

## Replay Relevance

**EVENT ENVELOPE STRUCTURE:**
- CRITICAL - replay requires canonical event structure
- Without envelope, events cannot be deterministically reconstructed
- Replay requires event fingerprinting
- Replay requires event ordering

**ACTOR/ACTOR_ID FIELD:**
- CRITICAL - replay requires attribution
- Without actor, replay cannot verify who performed action
- Replay requires actor identity verification

**LINEAGE FIELD:**
- CRITICAL - replay requires causality
- Without lineage, replay cannot reconstruct state
- Replay requires parent event references

**POLICY_VERSION FIELD:**
- CRITICAL - replay requires policy context
- Without policy_version, replay cannot verify policy compliance
- Replay requires historical policy evaluation

**EVENT FINGERPRINTING:**
- CRITICAL - replay requires event verification
- Without fingerprinting, replay cannot detect event corruption
- Replay requires domain-separated event fingerprints

**EVENT ORDERING GUARANTEES:**
- CRITICAL - replay requires deterministic ordering
- Without ordering, replay cannot produce consistent state
- Replay requires append-only log semantics

**EVENT DEDUPLICATION:**
- CRITICAL - replay requires idempotency
- Without deduplication, replay cannot handle duplicate events
- Replay requires event idempotency

---

## Lineage Relevance

**LINEAGE FIELD:**
- CRITICAL - lineage requires event causality
- Without lineage, events cannot be traced
- Lineage requires parent event references

**EVENT FINGERPRINTING:**
- CRITICAL - lineage requires event verification
- Without fingerprinting, lineage cannot verify event integrity
- Lineage requires event fingerprinting

**EVENT ORDERING GUARANTEES:**
- CRITICAL - lineage requires event ordering
- Without ordering, lineage cannot reconstruct causality
- Lineage requires append-only log semantics

---

## Storage Authority Violations

**CURRENT VIOLATION:**
- CRX treats execution_events table as truth authority
- Events are stored directly without envelope validation
- No event fingerprint verification before storage
- No event schema validation before storage
- Storage is treated as authority, not replay

**CONSTITUTIONAL VIOLATION:**
- AGENT.md mandates replay as authority
- AGENT.md mandates persistence as adapter
- Current implementation violates constitutional authority separation

---

## Recommendation

**ACTION:** CREATE canonical event envelope system

**EXTRACT FROM LEGACY:**
1. Event envelope structure from audit-event.schema.json
2. Actor structure from audit-event.schema.json
3. Lineage structure from audit-event.schema.json
4. Policy_version field from audit-event.schema.json
5. Event schema validation logic
6. Event fingerprinting logic

**KEEP FROM CRX:**
1. Database integration
2. TypeScript implementation
3. Basic event logging (as fallback)

**RISK:** HIGH - requires breaking change to event schema

---

## Proposed Event Envelope

```typescript
export interface Actor {
  actorId: string;
  actorType: "USER" | "SYSTEM" | "AGENT";
  actorIdentity?: {
    domain: string;
    identifier: string;
  };
}

export interface EventLineage {
  parents: string[];
  causalityId?: string;
  ancestryDepth?: number;
}

export interface EventEnvelope {
  id: string; // SHA-256 fingerprint
  timestamp: string; // ISO 8601
  actor: Actor;
  action: string;
  artifactType?: string;
  artifactId?: string;
  lineage?: EventLineage;
  policyVersion?: string;
  payload: any;
  fingerprint: string; // Domain-separated fingerprint
  schemaVersion: string;
}

export interface EventLogEntry {
  envelope: EventEnvelope;
  sequence: number;
  committed: boolean;
}

export async function createEventEnvelope(
  action: string,
  actor: Actor,
  payload: any,
  options: {
    artifactType?: string;
    artifactId?: string;
    lineage?: EventLineage;
    policyVersion?: string;
  } = {}
): Promise<EventEnvelope> {
  const timestamp = new Date().toISOString();
  const envelope: Omit<EventEnvelope, 'id' | 'fingerprint'> = {
    timestamp,
    actor,
    action,
    artifactType: options.artifactType,
    artifactId: options.artifactId,
    lineage: options.lineage,
    policyVersion: options.policyVersion,
    payload,
    schemaVersion: "event.envelope.v1"
  };

  const canonical = canonicalize(envelope);
  const serialized = JSON.stringify(canonical);
  const fingerprint = await fingerprintWithDomain(FINGERPRINT_DOMAINS.EVENT, envelope);
  const id = fingerprint;

  return {
    ...envelope,
    id,
    fingerprint
  };
}

export async function validateEventEnvelope(envelope: EventEnvelope): Promise<boolean> {
  // 1. Schema validation
  // 2. Fingerprint verification
  // 3. Actor validation
  // 4. Lineage validation
  // 5. Policy version validation
  const expectedFingerprint = await fingerprintWithDomain(FINGERPRINT_DOMAINS.EVENT, envelope);
  return envelope.fingerprint === expectedFingerprint;
}

export async function logEventEnvelope(envelope: EventEnvelope): Promise<void> {
  // Validate envelope before storage
  const isValid = await validateEventEnvelope(envelope);
  if (!isValid) {
    throw new Error('Invalid event envelope');
  }

  // Store envelope with sequence number
  await pool.query(
    'INSERT INTO execution_events (event_id, artifact_id, event_type, payload, envelope, sequence) VALUES ($1, $2, $3, $4, $5, $6)',
    [envelope.id, envelope.artifactId, envelope.action, envelope.payload, JSON.stringify(envelope), nextSequence()]
  );
}
```

---

## Migration Path

1. Create event-envelope.ts with EventEnvelope interface
2. Create event-validator.ts with validation logic
3. Update event_log.ts to use event envelopes
4. Update ledger_schema.sql to add envelope column
5. Update commit_controller.ts to create event envelopes
6. Add tests for event envelope creation
7. Add tests for event envelope validation
8. Add tests for event envelope fingerprinting
9. Add migration script for existing events
10. Update documentation

---

## Risk Assessment

**HIGH RISK:**
- Breaking change to event schema
- Requires database migration
- Requires updating all event producers
- Requires updating all event consumers

**MITIGATION:**
- Create migration script
- Support both old and new formats during transition
- Add comprehensive tests
- Document migration process
- Provide rollback plan
