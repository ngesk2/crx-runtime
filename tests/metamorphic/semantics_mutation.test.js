'use strict';
/**
 * T3 metamorphic property — semantics mutation pairs (l).
 *
 * WHAT INVARIANT?
 *   Semantics-preserving mutation => identity preserved.
 *   Semantics-changing mutation => identity changes.
 *   The identity must track MEANING, not bytes: key reordering (which the
 *   canonical form erases) preserves identity; changing a value, adding or
 *   removing a field, or changing the type domain changes it.
 * WHO OWNS IT? CanonicalBytes + IdentityAuthority
 *   (runtime/kernel/authorities/*, via the ping-runtime shims).
 * HOW CAN IT FAIL? Identity minted from non-canonical bytes (insertion
 *   order leaking in); a mutation the canonical form should erase (key
 *   order) changing the identity; a semantic change the canonical form
 *   erases (it must not — that would be a collision by construction).
 * WHAT ATTACK DISPROVES IT? Apply paired mutations to generated domain
 *   objects and assert the identity (in)equality each pair demands.
 * WHAT EVIDENCE PROVES IT? Fixed-seed fast-check over (object, mutation)
 *   pairs, zero counterexamples.
 * CAN IT BE REPLAYED? Yes: seed + path.
 * DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes, BUG- ledger.
 * WHY CAN EXISTING RUNNER + LIBRARY + EXISTING PING AUTHORITY NOT EXPRESS THIS?
 *   node:test + fast-check + the existing authorities. The mutations are
 *   test-side transformations; the identity law under test is PING's.
 *
 * Metamorphic relations:
 *   MR-preserve: id(keyPermuted(x)) == id(x); id(x with volatile-only
 *     timestamp change under logical_id) == id(x)  [via generateSpineEventId
 *     logical_id: timestamps outside the logical identity do not move it]
 *   MR-change: id(x with one value changed) != id(x);
 *     id(x with a field added/removed) != id(x);
 *     id(x) under type A != id(x) under type B.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { fc, domainObjectArb, keyPermuted } = require('../_support/arbitraries');
const { fcOptions, RUNS } = require('../_support/budget');
const { withRegressionLedger } = require('../_support/regression');
const { CanonicalBytes } = require('../../ping-runtime/authorities/canonical_authority.js');
const { IdentityAuthority } = require('../../ping-runtime/authorities/identity_authority.js');

const SEED = 20260941;
const INVARIANT = 'semantics-preserving mutation preserves identity; semantics-changing mutation changes identity';

const identityOf = (obj, type = 'event') =>
  new IdentityAuthority().generateFromCanonicalHash(CanonicalBytes.serialize(obj), type);

function changeOneValue(obj) {
  // Deep-clone and flip exactly one leaf value.
  const clone = JSON.parse(JSON.stringify(obj));
  const path = [];
  let node = clone;
  while (node && typeof node === 'object') {
    const keys = Object.keys(node);
    if (!keys.length) break;
    const k = keys[0];
    path.push(k);
    if (node[k] && typeof node[k] === 'object') node = node[k];
    else break;
  }
  if (!path.length) return { mutated: { ...clone, __l1_changed: 1 }, path: ['__l1_changed'] };
  let target = clone;
  for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
  const leaf = path[path.length - 1];
  const v = target[leaf];
  target[leaf] = typeof v === 'number' ? v + 1 : typeof v === 'string' ? v + '!' : v === null ? 0 : !v;
  return { mutated: clone, path };
}

describe('semantics mutation pairs (l)', () => {
  it(`semantics-preserving mutations preserve identity over ${RUNS} cases`, () => {
    const prop = fc.property(domainObjectArb(), fc.integer({ min: 1, max: 2 ** 30 }), (obj, rand) => {
      const before = identityOf(obj);
      // Key reorder is erased by canonicalization: meaning unchanged.
      assert.equal(identityOf(keyPermuted(obj, rand)), before,
        'key reordering must not change identity');
      // Array ORDER is meaning (ordered sequences): it must be preserved by
      // the transform, i.e. we do NOT reorder arrays — assert the arbiter
      // didn't: identity of the untouched object is stable across calls.
      assert.equal(identityOf(obj), before, 'identity must be stable for the same object');
    });
    withRegressionLedger(
      { property: 'metamorphic.semantics-preserving', expectedInvariant: INVARIANT },
      SEED,
      () => fc.assert(prop, fcOptions(SEED)),
    );
  });

  it(`semantics-changing mutations change identity over ${RUNS} cases`, () => {
    const prop = fc.property(domainObjectArb(), (obj) => {
      const before = identityOf(obj);
      const { mutated } = changeOneValue(obj);
      assert.notEqual(identityOf(mutated), before,
        'changing one leaf value must change identity');
      const added = { ...JSON.parse(JSON.stringify(obj)), __l1_new_field: 'x' };
      assert.notEqual(identityOf(added), before,
        'adding a field must change identity');
      const removed = JSON.parse(JSON.stringify(obj));
      const firstKey = Object.keys(removed)[0];
      if (firstKey !== undefined) {
        delete removed[firstKey];
        assert.notEqual(identityOf(removed), before,
          'removing a field must change identity');
      }
      assert.notEqual(identityOf(obj, 'mission'), identityOf(obj, 'event'),
        'changing the type domain must change identity');
    });
    withRegressionLedger(
      { property: 'metamorphic.semantics-changing', expectedInvariant: INVARIANT },
      SEED + 1,
      () => fc.assert(prop, fcOptions(SEED + 1)),
    );
  });

  it('logical_id pins identity across volatile timestamp changes (spine)', () => {
    // The canonicalization service strips volatile fields so two emissions of
    // the same logical event hash identically even with different timestamps
    // in the payload. The spine's logical_id is the mechanism: same
    // logical_id => same event_id regardless of payload timestamp drift.
    const prop = fc.property(domainObjectArb(), (obj) => {
      const auth = new IdentityAuthority();
      const base = { ...obj, occurred_at: '2026-09-30T10:00:00Z' };
      const drifted = { ...obj, occurred_at: '2026-09-30T18:31:50Z' };
      const id1 = auth.generateSpineEventId('REVIEW_RECEIVED', 'test-harness', { logical_id: 'logic-1', payload: base });
      const id2 = auth.generateSpineEventId('REVIEW_RECEIVED', 'test-harness', { logical_id: 'logic-1', payload: drifted });
      assert.equal(id1, id2, 'logical_id must pin identity across volatile payload drift');
      const id3 = auth.generateSpineEventId('REVIEW_RECEIVED', 'test-harness', { payload: drifted });
      assert.notEqual(id1, id3, 'without logical_id, payload drift changes identity (documented legacy behavior)');
    });
    withRegressionLedger(
      { property: 'metamorphic.logical-id-pinning', expectedInvariant: INVARIANT },
      SEED + 2,
      () => fc.assert(prop, fcOptions(SEED + 2)),
    );
  });
});
