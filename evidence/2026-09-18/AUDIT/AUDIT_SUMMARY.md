# ADVERSARIAL AUDIT SUMMARY

## CYCLE
2026-09-18_OVERNIGHT

## MODE
READ-ONLY ADVERSARIAL DEEP AUDIT
SPECIFIC-ISSUE ZOOM MODE

## BASELINE SHA
88c9651be93fd45d3de2f76ac376a696f6413ff0

## AUDIT PROGRESS
5 ZOOMs completed out of 30 prioritized targets

## CONFIRMED FINDINGS

### ZOOM 1 — CanonicalEventEnvelope → UER Seam
**ISSUE:** Dual event identity layer with different preimages and algorithms

**SEVERITY:** HIGH

**FINDING:**
- CanonicalEventEnvelope uses UUID v5 from (tenant_id, event_type, timestamp, sequence)
- UnifiedEventRuntime uses SHA-256 from (event_type, source, namespace, logical_id/payload)
- These represent different semantics: receipt identity vs constitutional identity
- Metadata propagation preserves original_event_id relationship

**CRASH WINDOW:** After canonical_events INSERT, before ping_events INSERT
- Receipt persisted, constitutional event lost
- EventBridge cursor NOT advanced, retry safe via event_id deduplication

**STATUS:** CONFIRMED (semantic distinction documented, retry mechanism safe)

### ZOOM 2 — Duplicate vs Collision
**ISSUE:** Collision detection implemented on event-runtime branch, pending integration

**SEVERITY:** MEDIUM (implementation exists, needs integration)

**FINDING:**
- Branch: event-runtime-deduplication SHA 1f40cf4328a09011ec5835e3824629815702d462
- Same event_id + same payload = DUPLICATE (deduplicated: true)
- Same event_id + different payload = COLLISION (error, collision: true)
- Metadata differences ALLOWED for retries (causation_id, correlation_id)
- Tests PASS on event-runtime branch

**STATUS:** CONFIRMED (implementation exists, pending integration into main)

### ZOOM 3 — Event ID Preimage
**ISSUE:** JSON.stringify() may not guarantee key ordering across implementations

**SEVERITY:** HIGH (identity foundation)

**FINDING:**
- Preimage: { eventType, source, [namespace], [logical_id|payload]}
- Timestamp NOT in preimage (correct for retry idempotency)
- Causation_id NOT in preimage (correct for identity vs metadata)
- CRITICAL: JSON.stringify() does NOT guarantee key ordering
- V8 preserves insertion order, but other runtimes may differ
- Determinism issue if fields reordered

**RECOMMENDATION:** Consider using CanonicalAuthority.hash() for guaranteed key ordering

**STATUS:** CONFIRMED (preimage analyzed, determinism question identified)

### ZOOM 4 — EventToMissionBridge Crash Windows
**ISSUE:** No transaction between event and mission creation; event marked processed before mission creation

**SEVERITY:** HIGH

**FINDING:**
- EventBridge marks canonical_events as processed BEFORE mission creation
- No transaction spanning ping_events INSERT and ping_missions INSERT
- CRASH WINDOW: After ping_events INSERT, before ping_missions INSERT
- If process dies: event persisted, mission LOST
- EventBridge cursor NOT advanced, but event already marked processed
- Mission NOT retried automatically

**RECOMMENDATION:**
1. Move canonical_events processed mark AFTER mission creation succeeds
2. OR make MissionRuntime.create() idempotent with explicit replay mechanism
3. OR use transaction spanning both operations

**STATUS:** CONFIRMED (crash window identified, missing retry semantics)

### ZOOM 5 — Mission Completion Semantics
**ISSUE:** Phantom completion vulnerability; mission completed without verifying downstream events

**SEVERITY:** HIGH

**FINDING:**
- MissionRuntime.complete() called when worker returns without throwing
- Completion certifies: worker returned, status !== 'failed', result not null
- Completion does NOT certify: downstream event emitted/persisted/verified
- Workers emit events directly (via _emit) without scheduler coordination
- CRASH WINDOW 1: After worker.handle() returns, before MissionRuntime.complete()
- CRASH WINDOW 2: After MissionRuntime.complete(), before downstream event persistence
- If process dies in window 2: mission marked complete, downstream event lost

**RECOMMENDATION:**
1. Mission completion should require downstream event persistence
2. OR workers should return results, scheduler should emit events
3. OR implement replay mechanism for lost downstream events
4. OR implement transaction spanning worker result and downstream events

**STATUS:** CONFIRMED (phantom completion vulnerability identified)

## RETIRED FINDINGS
None (no historical findings re-litigated without new evidence)

## PENDING ZOOMs (25 remaining from 80% priority list)
6. Receipt identity vs event identity (partial overlap with ZOOM 1)
7. Receipt order vs canonical order
8. HPP dotted event types
9. Event_<16hex> collision risk
10. W-1A trust boundary
11. Witness_root vs attestation identity
12. Replay completeness
13. Witness version semantics (12 vs 13 leaves)
14. ContextPack identity/completeness
15. WorkOrder semantic necessity
16. External effect idempotency
17. Temporal retry multiplication
18. ORCA A6 restart reconstruction
19. Oracle source/build/runtime provenance
20. Oracle backup quality
21. Mission Control claim provenance
22. Knowledge invalidation
23. Projection rebuildability
24. Error taxonomy
25. Observability ID survival
26. Authority bypass search
27. Best-practice comparison (ongoing)

## SINGLE MOST SPECIFIC BROKEN ARROW
**FILE:** ping-runtime/orchestration/event_to_mission_bridge.js line 145-155
**SYMBOL:** EventBridge canonical_events processed mark
**CALLER:** EventBridge._bridgeCanonicalEvents()
**STATE:** canonical_events.processed = TRUE set BEFORE mission creation
**FAILURE WINDOW:** Process crash between canonical_events UPDATE and MissionRuntime.create()
**CONSEQUENCE:** Event marked processed, mission never created, no automatic retry
**CLOSING TEST:** Move processed mark AFTER mission creation OR add mission replay mechanism

