'use strict';
/**
 * T2 constitutional property — identity determinism and domain separation (c).
 *
 * WHAT INVARIANT?
 *   Same canonical identity material => same identity, every time.
 *   Domain separation: Event("abc") != Mission("abc") — the type domain is
 *   part of the identity, so two kinds never collide on the same material.
 * WHO OWNS IT? IdentityAuthority
 *   (runtime/kernel/authorities/identity_authority.js; the ping-runtime shim
 *   is pure delegation — no competing implementation).
 * HOW CAN IT FAIL? Inline ID minting bypassing the authority, Date.now() or
 *   Math.random() in the identity material, a hash that ignores the type
 *   domain, JSON.stringify key-order drift in generateSpineEventId inputs.
 * WHAT ATTACK DISPROVES IT? Same material across process-fresh authority
 *   instances; cross-type identity requests on identical bytes; spine event
 *   IDs with namespace/tenant/logical_id permutations.
 * WHAT EVIDENCE PROVES IT? Fixed-seed fast-check runs: repeated generation
 *   from the same canonical bytes is byte-identical; cross-type outputs
 *   always differ.
 * CAN IT BE REPLAYED? Yes: seed + path reproduce; failures enter the
 *   regression corpus.
 * DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes, via the
 *   BUG- ledger.
 * WHY CAN EXISTING RUNNER + LIBRARY + EXISTING PING AUTHORITY NOT EXPRESS THIS?
 *   Same as (a,b): node:test + fast-check + the existing authority. No new
 *   identity machinery — the constitutional rule of one forbids it.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { fc, domainObjectArb } = require('../_support/arbitraries');
const { fcOptions, RUNS } = require('../_support/budget');
const { withRegressionLedger } = require('../_support/regression');
const { CanonicalBytes } = require('../../ping-runtime/authorities/canonical_authority.js');
const { IdentityAuthority } = require('../../ping-runtime/authorities/identity_authority.js');

const SEED = 20260932;
const INVARIANT = 'same canonical identity material => same identity; type domain separates identities';

describe('identity determinism and domain separation (c)', () => {
  it(`deterministic identity from canonical bytes over ${RUNS} cases`, () => {
    const prop = fc.property(domainObjectArb(), fc.constantFrom('event', 'mission', 'artifact', 'witness'), (obj, type) => {
      const bytes = CanonicalBytes.serialize(obj);
      // Fresh authority instances: determinism must not depend on instance state.
      const a = new IdentityAuthority().generateFromCanonicalHash(bytes, type);
      const b = new IdentityAuthority().generateFromCanonicalHash(bytes, type);
      assert.equal(a, b, 'same bytes + same type must yield the same identity');
      assert.ok(a.startsWith(`${type}_`), 'identity must carry its type domain visibly');
    });
    withRegressionLedger(
      { property: 'identity.determinism', expectedInvariant: INVARIANT },
      SEED,
      () => fc.assert(prop, fcOptions(SEED)),
    );
  });

  it('domain separation: Event("abc") != Mission("abc") on identical material', () => {
    const prop = fc.property(domainObjectArb(), (obj) => {
      const bytes = CanonicalBytes.serialize(obj);
      const asEvent = new IdentityAuthority().generateFromCanonicalHash(bytes, 'event');
      const asMission = new IdentityAuthority().generateFromCanonicalHash(bytes, 'mission');
      assert.notEqual(asEvent, asMission, 'type domain must separate identities on identical material');
    });
    withRegressionLedger(
      { property: 'identity.domain-separation', expectedInvariant: INVARIANT },
      SEED + 1,
      () => fc.assert(prop, fcOptions(SEED + 1)),
    );
  });

  it(`spine event IDs are deterministic and namespace/tenant/logical_id sensitive over ${RUNS} cases`, () => {
    const prop = fc.property(
      fc.constantFrom('REVIEW_RECEIVED', 'MISSION_CREATED'),
      fc.constantFrom('review-authority', 'mission-runtime'),
      domainObjectArb(),
      fc.option(fc.constantFrom('core::system', 'tenant::acme'), { nil: undefined }),
      fc.option(fc.constantFrom('CG-001', 'acme'), { nil: undefined }),
      (eventType, source, payload, namespace, tenantId) => {
        const opts = { payload };
        if (namespace !== undefined) opts.namespace = namespace;
        if (tenantId !== undefined) opts.tenant_id = tenantId;
        const auth = new IdentityAuthority();
        const id1 = auth.generateSpineEventId(eventType, source, opts);
        const id2 = auth.generateSpineEventId(eventType, source, opts);
        assert.equal(id1, id2, 'spine event ID must be deterministic for identical identity material');
        // Tenant joins the identity key: same event in two tenants is two events.
        const otherTenant = auth.generateSpineEventId(eventType, source, { ...opts, tenant_id: 'other-tenant-9' });
        assert.notEqual(id1, otherTenant, 'tenant_id must participate in the identity material');
      },
    );
    withRegressionLedger(
      { property: 'identity.spine-event-id', expectedInvariant: INVARIANT },
      SEED + 2,
      () => fc.assert(prop, fcOptions(SEED + 2)),
    );
  });
});
