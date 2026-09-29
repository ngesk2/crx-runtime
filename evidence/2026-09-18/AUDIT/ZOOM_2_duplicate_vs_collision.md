# ZOOM 2 — DUPLICATE VS COLLISION

## ISSUE
UNIFIEDEVENTRUNTIME COLLISION DETECTION IMPLEMENTED ON EVENT-RUNTIME BRANCH

## SEVERITY
MEDIUM (IMPLEMENTATION EXISTS, NEEDS INTEGRATION)

## CONFIDENCE
CONFIRMED

## PLANE
SOURCE @ SHA 1f40cf4328a09011ec5835e3824629815702d462 (event-runtime-deduplication branch)

## EXACT FILE
ping-runtime/events/unified_event_runtime.js
gateway/test_pipeline_bridge.js

## EXACT SYMBOL
UnifiedEventRuntime.emit() lines 156-184

## EXACT CALLER
EventBridge._bridgeCanonicalEvents()
UnifiedEventRuntime.emit()

## CURRENT BEHAVIOR

### Collision Detection Implementation
Location: ping-runtime/events/unified_event_runtime.js lines 156-184

Same event_id + same payload = DUPLICATE
Same event_id + different payload = COLLISION
Metadata differences are ALLOWED for retries

### Test Coverage
Location: gateway/test_pipeline_bridge.js (event-runtime branch)

Test: Collision detection: same event ID with different content errors
Passes on event-runtime branch

## TARGET INVARIANT
FAIL-CLOSE ON COLLISION

## REPRODUCTION
Emit event with payload { value: 42 }
Emit event with same event_id but payload { value: 999 }
Mock pool returns persisted payload { value: 42 }
Runtime returns error with collision: true flag

## FAILURE WINDOW
SQL race: Two concurrent INSERTs with same event_id but different payloads could both detect collision simultaneously. This is acceptable—both fail, which is fail-closed.

## AUTHORITY INVOLVED
UnifiedEventRuntime (constitutional event authority)

## IDENTITY INVOLVED
event_id (SHA-256 from event_type, source, namespace, payload)
Collision detection uses payload comparison only

## RETRY INVOLVED
Metadata differences (causation_id, correlation_id) are explicitly allowed

## PERSISTENCE INVOLVED
ping_events table
ON CONFLICT (event_id) DO NOTHING
SELECT readback for collision detection

## BEST-PRACTICE COMPARISON
CONTENT-ADDRESSED IDENTITY: Collision detection via payload comparison is content-addressed identity verification

## MINIMUM RECOMMENDATION
INTEGRATE event-runtime-deduplication branch (SHA 1f40cf432) into main

## WHAT TO PRESERVE
Collision detection implementation
Metadata allowance for retries
Fail-closed error semantics

## WHAT NOT TO DO
Do NOT weaken collision detection to metadata-only comparison
Do NOT treat collision as silent duplicate
Do NOT allow payload mutation under same event_id

## TEST THAT WOULD CLOSE IT
1. Integrate event-runtime-deduplication branch
2. Run gateway/test_pipeline_bridge.js (13 tests PASS)
3. Verify collision detection under real PostgreSQL
4. Test concurrent collision scenarios

## DEPENDENCIES
event-runtime-deduplication branch must be integrated
Branch SHA: 1f40cf4328a09011ec5835e3824629815702d462

## STATUS
CONFIRMED (IMPLEMENTATION EXISTS, PENDING INTEGRATION)
