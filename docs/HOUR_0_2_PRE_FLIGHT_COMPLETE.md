# PING 24-HOUR WEBSITE PROOF — HOUR 0-2 PRE-FLIGHT COMPLETE

**Date:** 2026-09-20
**Status:** PRE-FLIGHT COMPLETE — 8 CRITICAL QUESTIONS RESOLVED

---

## PRE-FLIGHT FINDINGS

### 1. Which frontend is actually PING's website?

**ANSWER:** `CascadeProjects/infra/ui-next` (Next.js 14.1.0)

**Evidence:**
- Next.js application with React 18.2.0, TypeScript 5.3.0, Tailwind CSS 3.4.0
- Package.json: `crx-ui-next`
- Existing pages: `/`, `/chat`, `/command-center`
- Dev server: `npm run dev` (port 3000, host 0.0.0.0)
- Production: `npm run start` (port 3000, host 0.0.0.0)

**Source:** `CascadeProjects/infra/ui-next/package.json`

---

### 2. Which gateway/API composition serves it?

**ANSWER:** Gateway at `http://localhost:8080` via `gateway/server.js`

**Evidence:**
- Gateway runtime: `gateway/server.js` → `gateway/bootstrap/gateway_runtime.js`
- Port: 8080 (default, configurable via PORT env var)
- Express.js server with extensive authority integration
- Frontend connects via `lib/gateway.ts`: `GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080'`

**Source:** `gateway/server.js`, `gateway/bootstrap/gateway_runtime.js`, `CascadeProjects/infra/ui-next/src/lib/gateway.ts`

---

### 3. Which database is actually canonical?

**ANSWER:** PostgreSQL (via PostgresEventStore)

**Evidence:**
- PostgresEventStore in `runtime/adapters/postgres_event_store.ts`
- PostgreSQL `events` table is canonical event store
- Connection via `pg` Pool

**Source:** `runtime/adapters/postgres_event_store.ts`, `database/events.sql`

---

### 4. Is canonical PING transition history in `events` or `ping_events`?

**ANSWER:** `events` table (NO `ping_events` table exists)

**Evidence:**
- `database/events.sql` defines `events` table with append-only triggers
- `database/canonical_events.sql` exists but is tenant multi-tenancy system (not PING-specific)
- NO `ping_events` table exists in repository
- PostgresEventStore writes to `events` table
- PingTransitionMapper (PATCH 4) correctly targets `events` table

**Conclusion:** Canonical event store is `events` table. Earlier `ping_events` reference was conceptual, not actual.

**Source:** `database/events.sql`, `runtime/adapters/postgres_event_store.ts`, `runtime/constitutional/src/ping-transition-mapper.ts`

---

### 5. Which object tables are canonical vs projections?

**ANSWER:** Currently classified incorrectly — needs reclassification

**Current Classification (INCORRECT):**
- `ping_objects` — Currently CANONICAL (WRONG)
- `ping_relationships` — Currently CANONICAL (WRONG)
- `ping_transitions` — Currently CANONICAL (WRONG)

**Required Classification (CORRECT):**
- `ping_objects` — PROJECTION / MATERIALIZED STATE (rebuildable from canonical event history)
- `ping_relationships` — PROJECTION / MATERIALIZED STATE (rebuildable from canonical event history)
- `ping_transitions` — PROJECTION / MATERIALIZED STATE (rebuildable from canonical event history)

**Canonical Source:** `events` table (canonical event history)

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

**Action Required:** Reclassify before PATCH 7, implement projector, forbid direct mutations.

**Source:** `database/ping_objects.sql`, `runtime/constitutional/src/ping-object-kernel.ts`

---

### 6. Which existing capability authority is active?

**ANSWER:** `CapabilityAuthority` in `runtime/kernel/capabilities/capability-authority.ts`

**Evidence:**
- CapabilityAuthority implements ICapabilityAuthority
- Uses CapabilityRegistry and CapabilityResolver
- Registers capabilities, resolves requirements, lists with filters
- Supports: inputTypes, outputTypes, policies, maxLatency, maxCost, deterministic, replaySafe

**Source:** `runtime/kernel/capabilities/capability-authority.ts`, `runtime/kernel/capabilities/capability-resolver.ts`

---

### 7. Which existing agent/runtime path can satisfy Ask PING?

**ANSWER:** Multiple agent runtimes available — needs selection

**Evidence:**
- `ping-runtime/ai/ai_runtime.ts` — AI runtime with OllamaProvider
- `ping-runtime/external-agent-prototype/` — External agent prototype
- `ping-runtime/orchestration/execution/engine.ts` — ExecutionEngine
- Gateway has integration with AIRuntime, OllamaProvider, various connectors

**Selection Required:** For PATCH 7, use existing AIRuntime or extend external-agent-prototype for structured context capability.

**Source:** `gateway/bootstrap/gateway_runtime.js`, `ping-runtime/ai/ai_runtime.ts`

---

### 8. Which crypto implementation can provide real Ed25519?

**ANSWER:** NO real Ed25519 implementation found — dependency required

**Evidence:**
- JWT exists (runtime/security/jwt_auth.py) — Uses HS256, NOT Ed25519
- event_chain.py has ed25519 references (runtime/constitutional/event_chain.py) — Placeholder implementation
- PingIdentityManager uses placeholder Ed25519-like implementation (SHA-256 HMAC, NOT real Ed25519)
- Node.js crypto module supports ed25519 (in @types) but not used
- NO Web Crypto API, sodium/libsodium, or real Ed25519 usage found

**Required Dependency:** Must add sodium/libsodium (Python) or @noble/ed25519 (TypeScript/JavaScript) or use Node.js crypto module (ed25519 type)

**Action Required:** STOP and report dependency requirement before PATCH 7.

**Source:** `runtime/security/jwt_auth.py`, `runtime/constitutional/event_chain.py`, `runtime/constitutional/src/ping-identity.ts`

---

## PRE-FLIGHT CONCLUSIONS

### BLOCKERS (Must Resolve Before Sprint):

1. **Cryptographic Identity:** NO real Ed25519 implementation — requires dependency addition
2. **Object Table Classification:** ping_objects, ping_relationships, ping_transitions must be reclassified as PROJECTION/MATERIALIZED STATE

### NO ISSUES:

3. **Canonical Event Store:** `events` table is correct — PingTransitionMapper targets correctly
4. **Frontend:** CascadeProjects/infra/ui-next is actual PING website
5. **Gateway:** gateway/server.js at port 8080 is actual API composition
6. **Database:** PostgreSQL via PostgresEventStore is canonical
7. **Capability Authority:** CapabilityAuthority in runtime/kernel/capabilities exists and is active
8. **Agent Runtime:** Multiple agent runtimes available for Ask PING

---

## PRE-FLIGHT VERDICT

**BLOCKING:** Cannot proceed with 24-hour sprint until:

1. Cryptographic identity dependency is resolved (real Ed25519 implementation)
2. Object tables are reclassified as projections
3. Projector is implemented to rebuild from canonical event history

**Recommendation:** Resolve these two blockers before starting HOUR 2-4 (Real Identity + Crypto).

---

## NEXT STEPS

### Option A: Resolve Blockers First (Recommended)
1. Add real Ed25519 dependency (@noble/ed25519 or Node.js crypto ed25519)
2. Reclassify object tables as projections
3. Implement projector
4. Then start 24-hour sprint

### Option B: Sprint with Placeholder Crypto (Risky)
1. Proceed with placeholder Ed25519 for sprint
2. Replace with real Ed25519 after sprint
3. Document placeholder as TEMPORARY

**User Decision Required:** Which option to proceed with?
