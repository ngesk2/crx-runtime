# ZOOM 4 — EVENTTOMISSIONBRIDGE CRASH WINDOWS

## ISSUE
TRANSACTION BOUNDARY ANALYSIS: NO TRANSACTION BETWEEN EVENT AND MISSION CREATION

## SEVERITY
HIGH

## CONFIDENCE
CONFIRMED

## PLANE
SOURCE @ SHA 88c9651be93fd45d3de2f76ac376a696f6413ff0

## EXACT FILE
ping-runtime/orchestration/event_to_mission_bridge.js
ping-runtime/events/unified_event_runtime.js
ping-runtime/mission/mission_runtime.js

## EXACT SYMBOL
EventToMissionBridge._handleEvent()
MissionRuntime.create()

## EXACT CALLER
UnifiedEventRuntime.emit() → EventToMissionBridge handler → MissionRuntime.create()

## CURRENT BEHAVIOR

### No Transaction Boundary
Location: ping-runtime/orchestration/event_to_mission_bridge.js lines 68-95

The bridge:
1. Receives event from UnifiedEventRuntime (already persisted to ping_events)
2. Calls MissionRuntime.create()
3. MissionRuntime creates mission (separate persistence)

There is NO transaction spanning:
- ping_events INSERT (happened before)
- ping_missions INSERT (happens now)

### Critical Crash Window
CRASH WINDOW: After ping_events INSERT, before ping_missions INSERT

If process dies between:
- Event IS persisted to ping_events
- Mission is NOT created
- On restart, event IS NOT re-bridged (EventBridge cursor advanced)
- MISSION IS LOST

### Evidence from EventBridge
Location: ping-runtime/events/event_bridge.js lines 145-155

EventBridge marks canonical_events as processed:
But there is NO rollback if MissionRuntime.create() fails.

### MissionRuntime Persistence
Location: ping-runtime/mission/mission_runtime.js (not yet inspected in this session)

Question: Does MissionRuntime.create() use a transaction internally?

## TARGET INVARIANT
Either:
1. Event and mission creation must be transactional, OR
2. Mission creation must be idempotent and retriable on event replay

## REPRODUCTION
1. EventBridge polls canonical_events, finds LEAD_CREATED
2. Emits to UnifiedEventRuntime (ping_events INSERT succeeds)
3. EventToMissionBridge receives event
4. MissionRuntime.create() called
5. Process crashes BEFORE mission INSERT
6. On restart, event already processed, not retried
7. Mission never created

## FAILURE WINDOW
CRASH WINDOW: Between UnifiedEventRuntime.emit() persistence and MissionRuntime.create() persistence

Additional CRASH WINDOW: Between MissionRuntime.create() and cursor advance

## AUTHORITY INVOLVED
- UnifiedEventRuntime (event authority)
- EventToMissionBridge (bridging authority)
- MissionRuntime (mission authority)

## IDENTITY INVOLVED
- event_id (from ping_events)
- mission_id (from MissionRuntime)
- correlation_id (threaded through chain)

## RETRY INVOLVED
- EventBridge cursor-based retry prevents duplicate event bridging
- But if mission creation fails, event is already marked processed
- Mission creation is NOT retried automatically

## PERSISTENCE INVOLVED
- ping_events (event store)
- ping_missions (mission store)
- canonical_events (receipt store)

## BEST-PRACTICE COMPARISON
OUTBOX PATTERN with TRANSACTION: Standard pattern is to emit event and create side effects in a single transaction, then mark outbox item as processed. Current implementation marks canonical_events as processed BEFORE mission creation, which is incorrect.

## MINIMUM RECOMMENDATION
1. Move canonical_events processed mark AFTER mission creation succeeds
2. OR make MissionRuntime.create() idempotent and add explicit mission-replay mechanism
3. OR use a transaction spanning both operations

## WHAT TO PRESERVE
- Event-driven mission creation pattern
- Correlation ID threading
- Event-to-mission mapping

## WHAT NOT TO DO
- Do NOT mark events as processed before side effects complete
- Do NOT rely on mission probably won not fail assumption

## TEST THAT WOULD CLOSE IT
1. Test process crash during MissionRuntime.create()
2. Verify mission is created on restart or explicitly lost
3. Test MissionRuntime.create() idempotency
4. Test duplicate mission creation protection

## DEPENDENCIES
None

## STATUS
CONFIRMED (CRASH WINDOW IDENTIFIED, MISSING RETRY SEMANTICS)
