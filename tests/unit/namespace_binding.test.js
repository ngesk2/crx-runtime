'use strict';
/**
 * T1 unit tests — namespace binding policy.
 *
 * WHAT INVARIANT? "requested wins iff bound": an explicit namespace override
 *   is honored ONLY when the source is operator-bound to it; otherwise
 *   trusted routing (per-source default, then the global default) resolves.
 *   Malformed namespaces always fail.
 * WHO OWNS IT? createNamespaceBinder
 *   (ping-runtime/canonicalization/namespace_binding.js). The binding table
 *   is operator-registered; the service keeps resolution ownership.
 * HOW CAN IT FAIL? Honoring an unbound override (tenant spoof, proven
 *   2026-09-23); accepting a malformed namespace; bindSource accepting an
 *   empty/invalid list.
 * WHAT ATTACK DISPROVES IT? Bound and unbound override attempts across
 *   sources, malformed namespaces, unregistered sources.
 * WHAT EVIDENCE PROVES IT? These deterministic unit cases (the policy is a
 *   pure function; PBT adds nothing here — this is the documented reason
 *   this file is unit, not property).
 * CAN IT BE REPLAYED? Yes: no randomness, no I/O.
 * DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes, BUG- ledger.
 * WHY CAN EXISTING RUNNER + LIBRARY + EXISTING PING AUTHORITY NOT EXPRESS THIS?
 *   It can — node:test alone. That is why this is a unit test and not a new
 *   framework.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { createNamespaceBinder } = require('../../ping-runtime/canonicalization/namespace_binding.js');

describe('namespace binding policy (unit)', () => {
  it('bound explicit override wins', () => {
    const b = createNamespaceBinder({ bindings: { 'review-authority': 'tenant::acme' } });
    assert.deepEqual(b.authorize('review-authority', 'tenant::acme'), { authorized: true, namespace: 'tenant::acme' });
  });

  it('unbound explicit override is denied (tenant-spoof fix)', () => {
    const b = createNamespaceBinder({ bindings: { 'review-authority': 'tenant::acme' } });
    const d = b.authorize('review-authority', 'tenant::victim');
    assert.equal(d.authorized, false);
    assert.match(d.reason, /not bound/);
  });

  it('unregistered source falls back to the global default', () => {
    const b = createNamespaceBinder({ defaultNamespace: 'core::owner' });
    assert.deepEqual(b.authorize(' stranger ', undefined), { authorized: true, namespace: 'core::owner' });
  });

  it('per-source default wins when no override is requested', () => {
    const b = createNamespaceBinder({ bindings: { 'review-authority': ['tenant::acme', 'tenant::hpp'] } });
    const d = b.authorize('review-authority');
    assert.equal(d.authorized, true);
    assert.equal(d.namespace, 'tenant::acme');
  });

  it('malformed namespaces are denied, never honored', () => {
    const b = createNamespaceBinder({});
    for (const bad of ['tenant::', 'evil', 'core::a b', '../../../etc', '']) {
      const d = b.authorize('review-authority', bad || undefined);
      if (bad) assert.equal(d.authorized, false, bad);
    }
  });

  it('bindSource rejects empty and invalid namespace lists', () => {
    const b = createNamespaceBinder({});
    assert.throws(() => b.bindSource('s', []), /at least one valid namespace/);
    assert.throws(() => b.bindSource('s', ['nope']), /at least one valid namespace/);
    assert.throws(() => b.bindSource('', 'tenant::acme'), /source required/);
    b.bindSource('s', 'tenant::acme');
    assert.deepEqual(b.authorize('s', 'tenant::acme'), { authorized: true, namespace: 'tenant::acme' });
  });

  // --- Stryker-trial survivor kills (2026-09-30) ---
  // The original suite asserted only authorized:false for malformed input, so
  // a mutant deleting the malformed-rejection branch still passed (the request
  // fell through to the unbound-denial). These cases pin the REASON, which is
  // the observable difference between "malformed" and "unbound".

  it('malformed rejection is distinguishable from unbound denial (reason pins the branch)', () => {
    const b = createNamespaceBinder({ bindings: { 'review-authority': 'tenant::acme' } });
    for (const bad of ['tenant::', 'evil', 'core::a b', '../../../etc', 'core::owner!!!', 'xxcore::owner']) {
      const d = b.authorize('review-authority', bad);
      assert.equal(d.authorized, false, bad);
      assert.match(d.reason, /Invalid namespace/, 'malformed input must be rejected as malformed, not unbound: ' + bad);
    }
    // A well-formed but unbound namespace is denied for the OTHER reason.
    const u = b.authorize('review-authority', 'tenant::victim');
    assert.equal(u.authorized, false);
    assert.match(u.reason, /not bound/);
  });

  it('regex anchors hold: leading/trailing junk is malformed', () => {
    const b = createNamespaceBinder({ bindings: { 's': 'core::owner' } });
    // Removing the ^ anchor would accept 'xxcore::owner'; removing $ would
    // accept 'core::owner!!!'. Both must be rejected as malformed.
    assert.match(b.authorize('s', 'xxcore::owner').reason, /Invalid namespace/);
    assert.match(b.authorize('s', 'core::owner!!!').reason, /Invalid namespace/);
    // NOTE (flagged for the product lane, 2026-09-30): JS "$" also matches
    // before a trailing newline, so 'tenant::acme\n' PASSES NAMESPACE_RE.
    // Left out of the assertions; the regex owner should decide whether
    // that is acceptable.
  });

  it('non-string namespaces are malformed (typeof guard)', () => {
    const b = createNamespaceBinder({ bindings: { 's': 'tenant::acme' } });
    // new String('tenant::acme') passes the regex after coercion but must
    // still be rejected: the guard requires a primitive string.
    const d = b.authorize('s', new String('tenant::acme'));
    assert.equal(d.authorized, false);
    assert.match(d.reason, /Invalid namespace/);
  });

  it('the default namespace is core::owner unless overridden', () => {
    const b = createNamespaceBinder({});
    assert.deepEqual(b.authorize('unknown-source'), { authorized: true, namespace: 'core::owner' });
  });

  it('a source bound to an empty set falls through to the default', () => {
    const b = createNamespaceBinder({ bindings: { 's': [] } });
    // allowed.size > 0 is false for the empty set; >= 0 or bare truthiness
    // would wrongly resolve namespace: undefined.
    assert.deepEqual(b.authorize('s'), { authorized: true, namespace: 'core::owner' });
  });

  it('bindSource rejects non-string sources (typeof guard)', () => {
    const b = createNamespaceBinder({});
    assert.throws(() => b.bindSource(123, 'tenant::acme'), /source required/);
    assert.throws(() => b.bindSource(null, 'tenant::acme'), /source required/);
  });
});
