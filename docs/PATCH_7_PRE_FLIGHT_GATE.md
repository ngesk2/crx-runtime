# PATCH 7 Pre-Flight Gate Report

**Date:** 2026-09-20
**Status:** THREE FINDINGS REQUIRING RESOLUTION BEFORE PATCH 7

---

## A. CANONICAL EVENT STORE

### Repository Evidence

**Existing Event Tables:**
- `events` table (database/events.sql) - Used by PostgresEventStore
- `canonical_events` table (database/canonical_events.sql) - Tenant multi-tenancy system
- `execution_events` table (runtime/kernel/commit-service/src/events/event_log.ts) - Temporary persistence

**Canonical Event Authority:**
- **CANONICAL_EVENT_STORE:** `events` table
- **WRITER:** PostgresEventStore (runtime/adapters/postgres_event_store.ts)
- **REPLAY_READER:** ReplayEventStream, ReplayStateMachine (runtime/kernel/replay/)
- **PING_TRANSITION_PATH:** PingTransitionMapper currently writes to `events` table (CORRECT)

**Evidence from PostgresEventStore:**
```typescript
// Line 19: "Persists events to PostgreSQL events table"
// Line 47: "CREATE TABLE IF NOT EXISTS events ("
// Line 125: "INSERT INTO events (event_hash, event_type, payload)"
```

**Conclusion:** 
- Canonical event store is `events` table
- PingTransitionMapper correctly targets `events` table
- NO `ping_events` table exists (earlier reference was likely conceptual, not actual)
- No conflict found - PATCH 4 mapping is correct

---

## B. OBJECT TABLE AUTHORITY

### Current Classification (INCORRECT)

**Tables:**
- `ping_objects` - Currently classified as CANONICAL
- `ping_relationships` - Currently classified as CANONICAL
- `ping_transitions` - Currently classified as CANONICAL

### Required Classification

**Preferred Architecture:**
```
signed transition
      ↓
canonical event history (events table)
      ↓
   projector
      ↙   ↓   ↘
 objects relationships transitions
      ↓
  application
```

**Correct Classification:**
- **ping_objects:** PROJECTION / MATERIALIZED STATE (rebuildable from canonical event history)
- **ping_relationships:** PROJECTION / MATERIALIZED STATE (rebuildable from canonical event history)
- **ping_transitions:** PROJECTION / MATERIALIZED STATE (rebuildable from canonical event history)

**Canonical Source:** `events` table (canonical event history)

**Rebuild Source:** `events` table → projector → rebuild ping_objects, ping_relationships, ping_transitions

**Writer:** Projector (needs to be implemented)

**Reader:** Application runtime

**Mutation Policy:** Rebuild-only (no direct mutations to object tables)

**Conclusion:**
- Current schema creates multiple sources of truth
- Must reclassify as PROJECTION/MATERIALIZED STATE
- Must implement projector to rebuild from canonical event history
- Direct writes to object tables should be forbidden (use events only)

---

## C. CRYPTOGRAPHIC IDENTITY

### Repository Evidence

**Existing Cryptography:**
- JWT exists (runtime/security/jwt_auth.py) - Uses HS256, NOT Ed25519
- event_chain.py has ed25519 references (runtime/constitutional/event_chain.py) - Placeholder implementation
- PingIdentityManager uses placeholder Ed25519-like implementation (SHA-256 HMAC, NOT real Ed25519)

**Finding:**
- NO real Ed25519 implementation found in repository
- NO Web Crypto API usage found
- NO sodium/libsodium dependency found
- Node.js crypto module supports ed25519 (in @types) but not used

**Required Primitive:**
- Ed25519 (for cryptographic signatures)

**Required Operations:**
- generateKeyPair()
- sign(privateKey, canonicalBytes)
- verify(publicKey, canonicalBytes, signature)

**Dependency Required:**
- Would need to add sodium/libsodium (Python) or @noble/ed25519 (TypeScript/JavaScript) or use Node.js crypto module (ed25519 type)

**Private Key Policy:**
- Private keys MUST NOT enter: ping_events, ping_objects, ping_relationships, ping_transitions, logs, API responses, agent context

**Conclusion:**
- Placeholder implementation is NOT sufficient for mandatory identity proofs
- Would require adding new dependency to implement real Ed25519
- STOP and report dependency requirement

---

## PRE-FLIGHT GATE VERDICT

### BLOCKER: Cryptographic Identity

**BLOCKING:** Cannot proceed with PATCH 7 without real Ed25519 implementation.

**Required Action:**
1. STOP and report dependency requirement for real Ed25519
2. Awaiting decision on whether to:
   - Add sodium/libsodium (Python) or @noble/ed25519 (TypeScript/JavaScript)
   - Use Node.js crypto module (ed25519 type)
   - Use existing platform cryptographic service if available

### ACTION ITEM: Object Table Classification

**REQUIRES FIX:** Reclassify ping_objects, ping_relationships, ping_transitions as PROJECTION/MATERIALIZED STATE before PATCH 7

**Required Action:**
1. Update database/ping_objects.sql to mark tables as projections
2. Implement projector to rebuild from canonical event history
3. Add triggers to prevent direct mutations (if not already present)
4. Update documentation to reflect projection-only nature

### NO ISSUE: Canonical Event Store

**CONFIRMED:** Canonical event store is `events` table. PingTransitionMapper correctly targets `events` table. No action needed.

---

## RECOMMENDATION

**Do NOT proceed with PATCH 7 implementation until:**

1. Cryptographic identity dependency is resolved (real Ed25519 implementation)
2. Object tables are reclassified as projections
3. Projector is implemented to rebuild from canonical event history

**Next Steps:**
1. Report Ed25519 dependency requirement to user
2. Await decision on cryptographic implementation approach
3. Rebuild database schema with projection classification
4. Implement projector
5. Then proceed with PATCH 7
