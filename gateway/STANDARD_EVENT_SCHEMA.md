# Standard Event Schema

## Phase A1.4 — Constitutional Standard Event Schema

### Constitutional Rules

Every persisted event must conform to one immutable constitutional schema.

**Minimum fields:**
- event_id
- event_type
- authority
- authority_version
- causation_id
- correlation_id
- timestamp
- payload_version
- payload

No authority may define custom envelopes.

---

## Implementation

### StandardEventSchema Class

**Location:** `standard_event_schema.js`

### Schema Definition

```javascript
{
  event_id: string,           // Unique event identifier
  event_type: string,         // Event type (e.g., MissionGenerated)
  aggregate_id: string,       // Aggregate identifier (e.g., mission_id)
  aggregate_type: string,     // Aggregate type (e.g., mission)
  authority: string,          // Authority that created the event
  authority_version: string,  // Authority version
  causation_id: string,       // Event that caused this event (optional)
  correlation_id: string,     // Correlation ID for tracing
  timestamp: number,          // Constitutional timestamp
  payload_version: number,     // Payload version for evolution
  payload: object,            // Event payload
  witness: object             // Cryptographic witness
}
```

### Core Methods

#### `create(eventType, aggregateId, aggregateType, payload, authority, options)`
Creates a standard event.

- Generates event_id deterministically
- Sets timestamp from constitutionalTimeAuthority
- Sets correlation_id (defaults to event_id)
- Sets causation_id from options
- Sets payload_version from options
- Creates cryptographic witness
- Returns validated event

**Usage Example:**
```javascript
const event = StandardEventSchema.create(
  'MissionGenerated',
  missionId,
  'mission',
  { mission_type: 'bugfix', description: 'Fix bug' },
  'MissionGenerationService',
  {
    authority_version: '1.0.0',
    causation_id: parentEventId,
    correlation_id: correlationId,
    payload_version: 1
  }
);
```

#### `validate(event)`
Validates event schema.

- Checks all required fields present
- Validates field types
- Throws error if validation fails
- Returns validated event

**Required Fields:**
- event_id (string)
- event_type (string)
- aggregate_id (string)
- aggregate_type (string)
- authority (string)
- authority_version (string)
- timestamp (number)
- payload_version (number)
- payload (object)

#### `serialize(event)`
Serializes event for storage/transmission.

- Serializes in deterministic order
- Ensures consistent JSON output
- Returns JSON string

**Deterministic Order:**
1. event_id
2. event_type
3. aggregate_id
4. aggregate_type
5. authority
6. authority_version
7. causation_id
8. correlation_id
9. timestamp
10. payload_version
11. payload
12. witness_hash

#### `deserialize(serialized)`
Deserializes and validates event.

- Parses JSON
- Validates schema
- Returns validated event

---

## Repository Invariants Preserved

✓ Every event validates against StandardEventSchema
✓ Schema validation enforced
✓ Serialization determinism
✓ No custom event formats
✓ Immutable event history

---

## Evidence Required

### Schema Validation Tests
- Verify required fields validation
- Verify field type validation
- Verify error messages

### Migration Validation Tests
- Verify payload_version handling
- Verify event evolution strategy

### Serialization Determinism Tests
- Verify same event serializes identically
- Verify field order consistency
- Verify JSON consistency

---

## Forbidden Patterns

❌ Custom event envelopes
❌ Missing required fields
❌ Non-deterministic serialization
❌ Schema violations
❌ Authority-specific formats

---

## Status

**Implementation:** ✅ Complete
**Tests:** ⏳ Pending
**Documentation:** ✅ Complete
