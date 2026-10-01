'use strict';
/**
 * T2 constitutional property — event append round-trip (f).
 *
 * WHAT INVARIANT?
 *   canonical(E) == canonical(read(append(E))): what the spine persists is
 *   byte-identical to what was emitted. And: appending the same logical
 *   event twice yields one row and one identity (ON CONFLICT idempotency) —
 *   retries never duplicate canonical state.
 * WHO OWNS IT? UnifiedEventRuntime.emit
 *   (ping-runtime/events/unified_event_runtime.js — the single canonical
 *   event pipeline; verdict admission, identity minting, persistence).
 * HOW CAN IT FAIL? Payload mutation between emit and INSERT, JSON
 *   round-trip loss (undefined/functions), timestamp fields leaking into
 *   identity material, a broken ON CONFLICT path double-inserting.
 * WHAT ATTACK DISPROVES IT? Emit domain payloads, read the stored row back,
 *   compare canonical bytes; emit the same logical event twice and count rows.
 * WHAT EVIDENCE PROVES IT? Fixed-seed fast-check: byte-identical round trips
 *   and exactly-one-row dedup on every case.
 * CAN IT BE REPLAYED? Yes: seed + path.
 * DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes, BUG- ledger.
 * WHY CAN EXISTING RUNNER + LIBRARY + EXISTING PING AUTHORITY NOT EXPRESS THIS?
 *   node:test + fast-check + the existing runtime. Persistence is a pg.Pool
 *   seam, so the fast tier uses the documented PgStub test double (protocol
 *   only, no PING semantics); the integration lane certifies real Postgres.
 *   No second event store is created.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { fc, domainObjectArb, eventTypeArb, sourceArb, tenantArb } = require('../_support/arbitraries');
const { fcOptions, RUNS } = require('../_support/budget');
const { withRegressionLedger } = require('../_support/regression');
const { PgStub } = require('../_support/pg_stub');
const { CanonicalBytes } = require('../../ping-runtime/authorities/canonical_authority.js');
const { UnifiedEventRuntime } = require('../../ping-runtime/events/unified_event_runtime.js');

const SEED = 20260935;
const INVARIANT = 'canonical(E)==canonical(read(append(E))); same logical event appended twice => one row, one identity';

function makeRuntime() {
  const pool = new PgStub();
  const rt = new UnifiedEventRuntime({ pool });
  return { pool, rt };
}

describe('event append round-trip (f)', () => {
  it(`canonical(E)==canonical(read(append(E))) over ${RUNS} events`, async () => {
    const prop = fc.asyncProperty(
      eventTypeArb, sourceArb, domainObjectArb(), tenantArb,
      async (eventType, source, payload, tenantId) => {
        const { pool, rt } = makeRuntime();
        const res = await rt.emit(eventType, source, payload, { tenant_id: tenantId, logical_id: `logic-${tenantId}-${eventType}` });
        assert.equal(res.status, 'ok', `emit must succeed, got: ${JSON.stringify(res)}`);
        const stored = pool.events.get(res.eventId);
        assert.ok(stored, 'emitted event must be persisted');
        assert.equal(
          CanonicalBytes.serialize(JSON.parse(stored.payload)).toString('hex'),
          CanonicalBytes.serialize(payload).toString('hex'),
          'persisted payload must be canonically identical to the emitted payload',
        );
        assert.equal(stored.source, source, 'source must survive the round trip');
        assert.equal(stored.tenant_id, tenantId, 'tenant partition must survive the round trip');
      },
    );
    await withRegressionLedger(
      { property: 'event.append-round-trip', expectedInvariant: INVARIANT },
      SEED,
      () => fc.assert(prop, fcOptions(SEED)),
    );
  });

  it(`idempotent retry: same logical event twice => one row, one identity over ${RUNS} events`, async () => {
    const prop = fc.asyncProperty(
      eventTypeArb, sourceArb, domainObjectArb(),
      async (eventType, source, payload) => {
        const { pool, rt } = makeRuntime();
        const opts = { logical_id: 'retry-logic-1', tenant_id: 'acme' };
        const r1 = await rt.emit(eventType, source, payload, opts);
        const r2 = await rt.emit(eventType, source, payload, opts); // simulated retry after response loss
        assert.equal(r1.status, 'ok');
        assert.equal(r2.status, 'ok', 'retry of the same logical event must not error');
        assert.equal(r1.eventId, r2.eventId, 'retry must resolve to the same canonical identity');
        assert.equal(pool.events.size, 1, 'retry must not duplicate the canonical row');
      },
    );
    await withRegressionLedger(
      { property: 'event.retry-idempotency', expectedInvariant: INVARIANT },
      SEED + 1,
      () => fc.assert(prop, fcOptions(SEED + 1)),
    );
  });
});
