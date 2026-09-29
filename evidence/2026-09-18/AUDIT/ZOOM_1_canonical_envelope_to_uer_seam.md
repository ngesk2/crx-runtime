# ZOOM 1 — CANONICAL EVENT ENVELOPE → UER SEAM

## ISSUE
DUAL EVENT IDENTITY LAYER BETWEEN CANONICALEVENTENVELOPE AND UNIFIEDEVENTRUNTIME

## SEVERITY
HIGH

## CONFIDENCE
CONFIRMED

## PLANE
SOURCE @ SHA 88c9651be93fd45d3de2f76ac376a696f6413ff0

## EXACT FILE
gateway/canonical_event_envelope.js
ping-runtime/events/event_bridge.js
ping-runtime/events/unified_event_runtime.js

## EXACT SYMBOL
CanonicalEventEnvelope.executeEmitEvent()
EventBridge._bridgeCanonicalEvents()
UnifiedEventRuntime.emit()

## EXACT CALLER
POST /canonical-events (gateway/routes/canonical_events.js)
→ CanonicalEventEnvelope.executeEmitEvent()
→ canonical_events INSERT
→ EventBridge._bridgeCanonicalEvents() (poll)
→ UnifiedEventRuntime.emit()
→ ping_events INSERT

## CURRENT BEHAVIOR

### Receipt Layer (CanonicalEventEnvelope)
Location: gateway/canonical_event_envelope.js line 142-145

Event ID Preimage (Receipt Layer):
- tenant_id
- event_type
- timestamp
- sequence (MAX(sequence)+1 per tenant)

Algorithm: UUID v5 (SHA-1(namespace + name))

Target Table: canonical_events

PK: (tenant_id, sequence) — ON CONFLICT DO NOTHING

### Constitutional Layer (UnifiedEventRuntime)
Location: ping-runtime/events/unified_event_runtime.js (inferred from earlier evidence)

Event ID Preimage (Constitutional Layer):
- event_type
- source (='canonical_events' when bridged)
- namespace (from metadata)
- logical_id OR payload

Algorithm: SHA-256

Target Table: ping_events

PK: event_id — ON CONFLICT DO NOTHING

### Bridge Seam
Location: ping-runtime/events/event_bridge.js line 169-184

Metadata Propagation:
- canonical_events.event_id → ping_events.metadata.original_event_id
- canonical_events.tenant_id → ping_events.metadata.tenant_id
- canonical_events.actor → ping_events.metadata.actor

## TARGET INVARIANT
Envelope identity (UUID v5) should NOT be canonical logical event identity (SHA-256).

## REPRODUCTION
1. POST /canonical-events with tenant_id=tenant-1, event_type=LEAD_CREATED
2. CanonicalEventEnvelope generates UUID v5 from (tenant-1, LEAD_CREATED, timestamp, sequence)
3. Persists to canonical_events
4. EventBridge polls, calls UnifiedEventRuntime.emit()
5. UnifiedEventRuntime generates SHA-256 from (LEAD_CREATED, 'canonical_events', namespace, payload)
6. Persists to ping_events

## FAILURE WINDOW
CRASH WINDOW: After canonical_events INSERT, before ping_events INSERT

If process dies between step 3 and 6:
- canonical_events contains the receipt
- ping_events does NOT contain the constitutional event
- EventBridge cursor not advanced
- Next poll will retry (idempotent via event_id check in ping_events)

SPECIFIC QUESTION: Is the retry safe given different event_id generation algorithms?

## AUTHORITY INVOLVED
- CanonicalEventEnvelope (receipt authority)
- UnifiedEventRuntime (constitutional event authority)
- EventBridge (bridging authority)

## IDENTITY INVOLVED
- CanonicalEventEnvelope.event_id (UUID v5, receipt identity)
- UnifiedEventRuntime.event_id (SHA-256, constitutional identity)
- Relationship: original_event_id in metadata

## RETRY INVOLVED
EventBridge uses cursor-based polling with event_id deduplication:
Location: ping-runtime/events/event_bridge.js line 159-162

This prevents duplicate bridging even if process crashes mid-bridge.

## PERSISTENCE INVOLVED
- canonical_events table (receipt store)
- ping_events table (constitutional event store)
- ping_bridge_cursors table (bridge state)

## BEST-PRACTICE COMPARISON
OUTBOX PATTERN: This resembles an outbox pattern where canonical_events is the outbox and ping_events is the canonical event log. However, the bridge is polling-based rather than transactionally bound.

IDEMPOTENCY: Dual event IDs provide natural idempotency at different layers. This is actually a good pattern if the semantic distinction is maintained.

## MINIMUM RECOMMENDATION
Document the explicit semantic distinction:
- UUID v5 identifies receipt/envelope (tenant, type, timestamp, sequence)
- SHA-256 identifies canonical logical event (type, source, namespace, payload)

Ensure no downstream consumer incorrectly treats receipt identity as constitutional identity.

## WHAT TO PRESERVE
- Dual identity pattern (it serves different purposes)
- Receipt ordering via canonical_events.sequence
- Constitutional ordering via ping_events acceptance order
- Metadata propagation (original_event_id in ping_events)

## WHAT NOT TO DO
- Do NOT conflate the two identities
- Do NOT use canonical_events.event_id as constitutional PK
- Do NOT skip the bridge layer without understanding semantic loss

## TEST THAT WOULD CLOSE IT
1. Prove that receipt identity collisions (unlikely UUID v5) do not affect constitutional identity
2. Prove that constitutional identity collisions handle retry semantics correctly
3. Verify that downstream consumers use ping_events.event_id, not canonical_events.event_id
4. Test crash window recovery to ensure no duplicate constitutional events

## DEPENDENCIES
None

## STATUS
CONFIRMED
