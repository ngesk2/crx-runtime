'use strict';
/**
 * T2 constitutional properties — canonicalization (a, b).
 *
 * WHAT INVARIANT?
 *   (a) Canonical serialization is order-insensitive and idempotent:
 *       canonical(x) == canonical(key-permuted(x)) and
 *       canonical(x) == canonical(deserialize(canonical(x))).
 *   (b) Canonical equality implies hash equality:
 *       canonical(x) == canonical(y) IMPLIES hash(x) == hash(y).
 *       The converse is NEVER asserted: hash equality does not prove
 *       semantic equality (collision domain), and asserting it would be a lie.
 * WHO OWNS IT? CanonicalAuthority / CanonicalBytes
 *   (runtime/kernel/authorities/canonical_authority.js — the single
 *   constitutional serializer; ping-runtime/authorities/canonical_authority.js
 *   is a pure delegation shim).
 * HOW CAN IT FAIL? Key-order dependence, non-deterministic float/unicode
 *   handling, Buffer-vs-string mixing, a serializer change that breaks
 *   byte stability across versions.
 * WHAT ATTACK DISPROVES IT? Feed key-permuted clones and nested objects with
 *   adversarial key orders; serialize -> deserialize -> serialize round trips.
 * WHAT EVIDENCE PROVES IT? 100 (PR) / 500 (deep) generated domain objects
 *   with zero counterexamples at a fixed seed.
 * CAN IT BE REPLAYED? Yes: fixed seed + recorded fast-check path reproduce
 *   any failure; failures become BUG- records via withRegressionLedger.
 * DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes: the ledger
 *   writer records property, seed, path, minimal counterexample, invariant,
 *   and PING commit into tests/regression/generated/.
 * WHY CAN EXISTING RUNNER + LIBRARY + EXISTING PING AUTHORITY NOT EXPRESS THIS?
 *   node:test gives the runner; fast-check (new, inventoried: absent from the
 *   main tree) gives shrinking domain-object generation no existing test has;
 *   the authority itself is the system under test. No new authority is created.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { fc, domainObjectArb, keyPermuted } = require('../_support/arbitraries');
const { fcOptions, RUNS } = require('../_support/budget');
const { withRegressionLedger } = require('../_support/regression');
const { CanonicalBytes, CanonicalAuthority } = require('../../ping-runtime/authorities/canonical_authority.js');

const SEED_A = 20260930;
const SEED_B = 20260931;
const SEED_C = 20260932;

const INVARIANT_A = 'canonical(x)==canonical(key-permuted(x)) and canonical(x)==canonical(deserialize(canonical(x)))';
const INVARIANT_B = 'canonical(x)==canonical(y) IMPLIES hash(x)==hash(y); converse never asserted';
const INVARIANT_C = 'canonical serialization is injective on JSON-safe domain values: distinct values -> distinct bytes (element separators are load-bearing)'

describe('canonicalization properties (a, b)', () => {
  it(`(a) key-order insensitivity + idempotence over ${RUNS} domain objects`, () => {
    const prop = fc.property(domainObjectArb(), fc.integer({ min: 1, max: 2 ** 30 }), (obj, rand) => {
      const bytes = CanonicalBytes.serialize(obj);
      const permutedBytes = CanonicalBytes.serialize(keyPermuted(obj, rand));
      assert.equal(
        permutedBytes.toString('hex'), bytes.toString('hex'),
        'key-permuted clone must serialize to identical canonical bytes',
      );
      const roundTripped = CanonicalBytes.serialize(CanonicalBytes.deserialize(bytes));
      assert.equal(
        roundTripped.toString('hex'), bytes.toString('hex'),
        'serialize(deserialize(serialize(x))) must be byte-identical',
      );
      assert.ok(CanonicalBytes.isValidCanonical(bytes), 'output must be valid canonical bytes');
    });
    withRegressionLedger(
      { property: 'canonicalization.key-order-idempotence', expectedInvariant: INVARIANT_A },
      SEED_A,
      () => fc.assert(prop, fcOptions(SEED_A)),
    );
  });

  it(`(b) canonical equality implies hash equality over ${RUNS} pairs (converse never asserted)`, () => {
    const prop = fc.property(domainObjectArb(), domainObjectArb(), (x, y) => {
      const bx = CanonicalBytes.serialize(x).toString('hex');
      const by = CanonicalBytes.serialize(y).toString('hex');
      if (bx === by) {
        assert.equal(
          CanonicalAuthority.hashBytes(CanonicalBytes.serialize(x)),
          CanonicalAuthority.hashBytes(CanonicalBytes.serialize(y)),
          'equal canonical bytes must hash equally',
        );
      }
      // Deliberately NO assertion on the converse: hash(x)==hash(y) says
      // nothing about semantic equality. A test asserting it would certify
      // a collision-resistance claim the suite cannot prove.
    });
    withRegressionLedger(
      { property: 'canonicalization.hash-implication', expectedInvariant: INVARIANT_B },
      SEED_B,
      () => fc.assert(prop, fcOptions(SEED_B)),
    );
  });

  it(`(c) serialization is injective on JSON-safe values over ${RUNS} pairs`, () => {
    // FIRST BROKEN INVARIANT (2026-09-30): CanonicalBytes.serialize drops
    // the array element separator, so serialize([1,2]) === serialize([12])
    // === "[12]". Identity-by-hash depends on injectivity; without it two
    // distinct domain values share one identity. BUG-0001.
    const prop = fc.property(domainObjectArb(), domainObjectArb(), (x, y) => {
      const bx = CanonicalBytes.serialize(x).toString('hex');
      const by = CanonicalBytes.serialize(y).toString('hex');
      if (bx === by) {
        // Same bytes must mean the same value (key-order-insensitive deep
        // equality matches canonical semantics). If the values differ but
        // the bytes match, the serializer collided by construction.
        assert.deepEqual(x, y, `canonical collision by construction: distinct values share bytes ${bx.slice(0, 64)}`);
      }
    });
    withRegressionLedger(
      { property: 'canonicalization.injectivity', expectedInvariant: INVARIANT_C },
      SEED_C,
      () => fc.assert(prop, fcOptions(SEED_C)),
    );
  });

  it('(c-regression) array elements are separator-delimited (BUG-0001 pin)', () => {
    assert.notEqual(
      CanonicalBytes.serialize([1, 2]).toString('hex'),
      CanonicalBytes.serialize([12]).toString('hex'),
      'BUG-0001: [1,2] and [12] must not share canonical bytes',
    );
    assert.notEqual(
      CanonicalBytes.serialize(['a', 'b']).toString('hex'),
      CanonicalBytes.serialize(['ab']).toString('hex'),
      'BUG-0001: ["a","b"] and ["ab"] must not share canonical bytes',
    );
  });
});
