# AUTHORITY_LOSERS.md

**Generated:** 2026-06-07
**Method:** Direct comparison of competing implementations

---

## DEFINITION

"Losers" are implementations that are superseded by a strictly superior alternative. They should be **deprecated** (not deleted) and moved to `archives/`.

---

## FINGERPRINT LOSERS

### `identity_engine.ts` — LOSER

**Path:** `CRX/runtime/kernel/commit-service/src/engines/identity_engine.ts`
**LOC:** 15
**Winner:** `canonical_fingerprint_service.js` (479 LOC)

**Deficiencies vs winner:**
- No domain separation (winner: 14 domains)
- No Unicode NFC normalization (winner: `val.normalize("NFC")`)
- No circular reference detection (winner: `WeakSet` tracking)
- No type rejection (winner: rejects BigInt, Symbol, Function, undefined)
- No hash verification (winner: `verifyFingerprint()`)
- No schema version tracking (winner: `FINGERPRINT_SCHEMA_VERSION`)
- No length-prefixed preimage (winner: `buildPreimage()`)
- No negative zero preservation (winner: `Object.is(val, -0)`)

**Verdict:** Strictly inferior. Replace.

---

### `canonical_engine.ts` — LOSER

**Path:** `CRX/runtime/kernel/commit-service/src/engines/canonical_engine.ts`
**LOC:** 18
**Winner:** `canonical_fingerprint_service.js` (479 LOC)

**Deficiencies vs winner:**
- No domain separation
- No type rejection guards
- No circular reference detection
- No error handling (winner: `CanonicalizationError`)
- No configurable options (winner: `maxDepth`, `strictNumberMode`, `rejectUnknownFields`)
- No negative zero handling
- No sparse array detection

**Verdict:** Strictly inferior. Replace.

---

## LINEAGE LOSERS

### `dag_validator.ts` — LOSER

**Path:** `CRX/runtime/kernel/commit-service/src/validation/dag_validator.ts`
**LOC:** 13
**Winner:** `formal_invariant_graph_verifier.js` (262 LOC)

**Deficiencies vs winner:**
- No transitive cycle detection (winner: full DFS)
- No required edge verification (winner: 8 constitutional edges)
- No forbidden edge detection (winner: 5 bypass patterns)
- No graph fingerprinting (winner: via `fingerprintWithDomain`)
- No invariant topology binding (winner: 9 invariant nodes)
- No domain separation (winner: `STRUCTURAL_NODE` domain)

**Verdict:** Strictly inferior. Replace.

---

## EVENT LOSERS

### `event_log.ts` — LOSER

**Path:** `CRX/runtime/kernel/commit-service/src/events/event_log.ts`
**LOC:** 11
**Winner:** `canonical-event-envelope.json` (schema) + `init-db.sql` (full schema)

**Deficiencies vs winner:**
- No event_id (winner: UUID v4)
- No actor attribution (winner: actor_id required)
- No fingerprint field (winner: fingerprint for replay verification)
- No lineage field (winner: parent_event_ids + causal_chain)
- No policy version (winner: policy_version required)
- No timestamp column (winner: ISO 8601 timestamptz)
- No append-only constraint (winner: DB-level enforcement)

**Verdict:** Strictly inferior. Replace with canonical envelope.

---

## PERSISTENCE LOSERS

### `ledger_schema.sql` — LOSER

**Path:** `CRX/runtime/kernel/commit-service/src/persistence/ledger_schema.sql`
**LOC:** 20
**Winner:** `init-db.sql` (156 LOC, in `CRX/constitutional-integration-lab/extracted/schemas/`)

**Deficiencies vs winner:**
- 3 tables (winner: 10+ tables)
- No policy_evaluations table
- No lineage_chains table
- No replay_snapshots table
- No constitutional_violations table
- No agent_executions table
- No facts table
- No claims table
- No rules table
- No audit_log table
- No indexes for lineage traversal
- No GIN indexes for JSONB queries

**Verdict:** Strictly inferior. Replace.

---

## MISNAMED / MISCLASSIFIED

### `audit_controller.ts` — MISNAMED

**Path:** `CRX/runtime/kernel/commit-service/src/api/audit_controller.ts`
**LOC:** 14
**Issue:** Named "audit" but performs no audit logic. Simply lists 100 most recent artifacts from PostgreSQL.
**Verdict:** Rename to `artifact_listing_controller.ts` or replace with actual audit logic.

### `models/artifact.ts` — EMPTY

**Path:** `CRX/runtime/kernel/commit-service/src/models/artifact.ts`
**LOC:** 0 (empty file)
**Issue:** Referenced by `commit_controller.ts` but contains no type definition.
**Verdict:** Either populate with proper type definition or remove import.

---

## DEPRECATION PLAN

| File | Deprecate To | Preserve? |
|------|-------------|-----------|
| `identity_engine.ts` | `archives/runtime-fingerprint/` | YES — for reference |
| `canonical_engine.ts` | `archives/runtime-fingerprint/` | YES — for reference |
| `dag_validator.ts` | `archives/runtime-lineage/` | YES — for reference |
| `event_log.ts` | `archives/runtime-events/` | YES — after refactoring |
| `ledger_schema.sql` | `archives/runtime-persistence/` | YES — for reference |
| `audit_controller.ts` | `archives/runtime-api/` | YES — after renaming |
| `models/artifact.ts` | DELETE | NO — empty file |

---

**Classification:** FACT (all comparisons based on direct source inspection)
**Confidence:** HIGH
