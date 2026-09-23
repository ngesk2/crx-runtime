// PRODUCTION BOOTSTRAP LOAD GATE (PB) — permanent regression gate.
//
// Lesson that created this gate (2026-09-23): the candidate SHA 5bb2d08b5
// passed all twelve security gates while its committed tree could not even
// load the production gateway bootstrap: gateway/bootstrap/gateway_runtime.js
// required ../../ping-runtime/jev/shadow_worker unconditionally, but
// ping-runtime/jev/ was never committed, so require() threw
// MODULE_NOT_FOUND. No gate suite ever required the bootstrap, so the
// packaging failure was invisible.
//
// This gate loads the production composition root and the shadow worker
// it requires. Any missing committed file fails LOUDLY here instead of
// shipping a tree that cannot boot the product.
//
// A GREEN TEST SUITE THAT CANNOT BOOT THE PRODUCT IS NOT GREEN.
//
// Run: node gateway/test_production_bootstrap_load.js   (from repo root)

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL ${name}: ${err.message}`);
  }
}

console.log('=== Production bootstrap load gate (PB) ===');

// PB-1: the production composition root loads from the committed tree.
// This is the exact failure mode that killed 5bb2d08b5: MODULE_NOT_FOUND
// at the top-level shadow_worker require inside the bootstrap.
test('PB-1 production bootstrap module loads (gateway/bootstrap/gateway_runtime)', () => {
  const { GatewayRuntime } = require('./bootstrap/gateway_runtime');
  assert.strictEqual(typeof GatewayRuntime, 'function',
    'GatewayRuntime must be exported as a constructor');
});

// PB-2: the shadow worker the bootstrap requires is present and loadable.
test('PB-2 shadow worker module loads (ping-runtime/jev/shadow_worker)', () => {
  const { JevShadowWorker } = require('../ping-runtime/jev/shadow_worker');
  assert.strictEqual(typeof JevShadowWorker, 'function',
    'JevShadowWorker must be exported as a constructor');
});

// PB-3: the typed decision contract the shadow worker requires is present.
test('PB-3 typed decision contract loads (ping-runtime/jev/typed_decision)', () => {
  const { JEV_DECISION_EVALUATED, RuleClaimDecisionProvider } =
    require('../ping-runtime/jev/typed_decision');
  assert.strictEqual(JEV_DECISION_EVALUATED, 'JEV_DECISION_EVALUATED');
  assert.strictEqual(typeof RuleClaimDecisionProvider, 'function');
});

// PB-4: the shadow worker's in-tree dependencies exist in the committed tree.
test('PB-4 shadow worker in-tree dependencies exist in the committed tree', () => {
  for (const rel of [
    'ping-runtime/workers/canonical_workers.js',
    'ping-runtime/authorities/constitutional_time_authority.js',
  ]) {
    const abs = path.join(REPO_ROOT, rel);
    assert.ok(fs.existsSync(abs), `missing committed file: ${rel}`);
  }
});

// PB-5: the bootstrap wires the shadow worker into worker runtime registration
// with zero execution authority (shadow-only), not as an optional late bind.
test('PB-5 bootstrap registers jev-shadow worker (static composition check)', () => {
  const src = fs.readFileSync(path.join(__dirname, 'bootstrap', 'gateway_runtime.js'), 'utf8');
  assert.ok(src.includes("require('../../ping-runtime/jev/shadow_worker')"),
    'bootstrap must require the shadow worker');
  assert.ok(src.includes("register('jev-shadow'"),
    'bootstrap must register the jev-shadow worker');
  assert.ok(/eventTypes:\s*\[\s*'CLAIM_CREATED'\s*\]/.test(src),
    'jev-shadow must observe CLAIM_CREATED');
  assert.ok(!/require\(['"]\.\.\/\.\.\/ping-runtime\/jev\/shadow_worker['"]\)\s*\.catch|try\s*{\s*require\(['"]\.\.\/\.\.\/ping-runtime\/jev\/shadow_worker['"]\)/.test(src),
    'shadow worker require must NOT be lazy/optional — missing required code fails loudly');
});

// PB-6: the committed shadow worker is shadow-only (zero execution authority).
test('PB-6 shadow worker mayExecutePolicy denies execution', () => {
  const { JevShadowWorker } = require('../ping-runtime/jev/shadow_worker');
  const w = new JevShadowWorker({});
  const verdict = w._policy.mayExecute({ decision: 'ACCEPT_CLAIM' }, { domain: 'claim-classification' });
  assert.strictEqual(verdict.allowed, false, 'shadow worker must never grant execution');
  assert.strictEqual(verdict.mode, 'shadow');
});

console.log(`\nPB: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
