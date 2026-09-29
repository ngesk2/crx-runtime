# ZOOM 3 — EVENT ID PREIMAGE

## ISSUE
EXACT UNIFIEDEVENTRUNTIME EVENT IDENTITY PREIMAGE ANALYSIS

## SEVERITY
HIGH (IDENTITY FOUNDATION)

## CONFIDENCE
CONFIRMED

## PLANE
SOURCE @ SHA 88c9651be93fd45d3de2f76ac376a696f6413ff0

## EXACT FILE
ping-runtime/events/unified_event_runtime.js

## EXACT SYMBOL
UnifiedEventRuntime.emit() lines 68-73

## EXACT CALLER
Any emitter (EventBridge, WorkerRuntime, BusinessEmitters, etc.)

## CURRENT BEHAVIOR

### Event ID Preimage (Line 68-73)


### Exact Preimage Fields
1. eventType (string) - e.g., 'REVIEW_RECEIVED', 'CUSTOMER_CREATED'
2. source (string) - e.g., 'worker-runtime', 'canonical_events', 'repository_events'
3. namespace (string, optional) - e.g., 'core::system', 'tenant::tenant-1'
4. logical_id (string, optional) - OR payload (object) if logical_id not provided

### Field-by-Field Analysis

#### eventType
- AFFECTS IDENTITY: YES
- SEMANTIC: Event type discriminator
- DUPLICATE SEMANTIC: Different eventType = different event_id (correct)
- SHOULD IT AFFECT IDENTITY: YES (fundamental)

#### source
- AFFECTS IDENTITY: YES
- SEMANTIC: Emitter origin
- DUPLICATE SEMANTIC: Same event from different source = different event_id
- QUESTION: Should the same logical event from different sources have different identities?
- RISK: If a business fact can be emitted from multiple sources, source may fragment identity

#### namespace
- AFFECTS IDENTITY: YES (when provided)
- SEMANTIC: Privacy/tenant boundary
- DUPLICATE SEMANTIC: Same event in different namespace = different event_id (correct)
- DEFAULT: 'core::system' if not provided
- QUESTION: Should absent namespace default to something other than 'core::system' for non-system events?

#### logical_id
- AFFECTS IDENTITY: YES (when provided)
- SEMANTIC: Timestamp-stripped logical identity
- DUPLICATE SEMANTIC: Two emissions with same logical_id = same event_id (enables idempotent retries)
- PRIORITY: logical_id takes precedence over payload
- GOOD: This enables retry without timestamp collision

#### payload
- AFFECTS IDENTITY: YES (when logical_id NOT provided)
- SEMANTIC: Full event data
- DUPLICATE SEMANTIC: Same payload = same event_id (content-addressed)
- RISK: If payload contains retry metadata (timestamp, retry_count), identity will vary

### NOTABLE ABSENCE FROM PREIMAGE
- timestamp (ConstitutionalTimeAuthority.nowAsISOString() used AFTER identity calculation)
- causation_id (stored in metadata, not in identity)
- correlation_id (stored in metadata, not in identity)
- sequence (not used in UER identity)
- tenant_id (implicit via namespace, not explicit)

### Identity Calculation Order
1. Build identity object
2. JSON.stringify(identity)
3. SHA-256 hash
4. hex digest (64 characters)

### Critical Finding: JSON.stringify Ordering
JSON.stringify() does NOT guarantee key ordering across implementations
- JavaScript: insertion order preserved in V8
- Different runtimes: may differ
- This is a potential determinism issue if the identity object fields are reordered

## TARGET INVARIANT
Event identity should be:
- Deterministic across runs
- Reproducible across implementations
- Meaningful for deduplication
- Distinguish business facts from metadata

## REPRODUCTION
1. Emit event with logical_id = 'customer-123'
2. Emit same event with same logical_id but different timestamp
3. Both produce same event_id (correct)
4. Emit event without logical_id but with payload { value: 42 }
5. Emit same event with payload { value: 42 } but different timestamp
6. Both produce same event_id (correct IF payload stable)

## FAILURE WINDOW
If payload changes between retries (e.g., includes timestamp):
- Same logical event produces different event_id
- Deduplication fails
- Duplicate side effects possible

## AUTHORITY INVOLVED
- UnifiedEventRuntime (constitutional event authority)
- CanonicalAuthority (hashing, used elsewhere but not in UER identity)

## IDENTITY INVOLVED
- event_id (SHA-256)
- NOT using CanonicalAuthority.hash() directly

## RETRY INVOLVED
- logical_id provides explicit retry idempotency
- payload-based identity requires stable payload for retry safety

## PERSISTENCE INVOLVED
- ping_events.event_id (PK)
- ping_events.metadata (causation_id, correlation_id, timestamp stored here)

## BEST-PRACTICE COMPARISON
CANONICAL SERIALIZATION: The current JSON.stringify() approach may not guarantee key ordering. Better practice: use CanonicalAuthority.hash() which sorts keys.

## MINIMUM RECOMMENDATION
1. Consider using CanonicalAuthority.hash() for identity calculation to guarantee key ordering
2. If not, document that key ordering is insertion-order dependent
3. Ensure all producers use consistent field insertion order

## WHAT TO PRESERVE
- logical_id mechanism (provides explicit retry idempotency)
- namespace isolation
- SHA-256 hashing

## WHAT NOT TO DO
- Do NOT add timestamp to identity preimage (it already causes retry failures)
- Do NOT add causation_id to identity preimage (it creates identity chains, not logical identity)
- Do NOT assume JSON.stringify() is implementation-independent

## TEST THAT WOULD CLOSE IT
1. Test identity calculation with different key orders
2. Test identity calculation across different JavaScript runtimes
3. Verify logical_id provides stable identity across retries
4. Verify payload-based identity fails if payload contains retry metadata

## DEPENDENCIES
- CanonicalAuthority could be used for improved determinism

## STATUS
CONFIRMED (PREIMAGE ANALYZED, DETERMINISM QUESTION IDENTIFIED)

ENDOFPACKET
