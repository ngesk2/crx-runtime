'use strict';
/**
 * Committed self-test for the JEV shadow triage seam.
 *
 * Runs the STUB courier only (never live JEV): committed CI passes offline.
 * Asserts the routing shape (typed judgments, taxonomy keys, budget clamp)
 * and that deterministic purposes are refused before any live call.
 *
 * JEV JUDGES. TESTS FALSIFY. This file tests the seam, not the judgment.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { triage, liveCourier, JEV_BUDGET } = require('./jev_shadow_triage.js');

describe('jev shadow triage seam (stub, committed)', () => {
  it('routes fixture failures through the stub courier with the shadow shape', () => {
    const failures = require('./fixtures/failures.json');
    const { routed, budget_used, budget_total, live } = triage(failures, { live: false });
    assert.equal(live, false);
    assert.equal(budget_total, JEV_BUDGET);
    assert.equal(budget_used, Math.min(failures.length, JEV_BUDGET));
    for (const j of routed) {
      assert.equal(j.shadow, true);
      assert.equal(j.courier, 'stub');
      assert.ok('failure_class' in j && 'counterexample_class' in j);
    }
  });

  it('refuses deterministic purposes without calling JEV', () => {
    assert.throws(() => liveCourier({ property: 'x' }, 'hashing'), /refuses deterministic/);
    assert.throws(() => liveCourier({ property: 'x' }, 'replay'), /refuses deterministic/);
  });

  it('clamps the call budget at 30 even with 100 failures', () => {
    const big = new Array(100).fill({ property: 'x' });
    const r = triage(big, { live: false });
    assert.equal(r.budget_used, 30);
    assert.equal(r.routed.length, 30);
  });
});
