/**
 * Regression test: worker payload timestamps must come from the
 * constitutional time authority, not new Date().
 *
 * Prior defect: canonical_workers.js (8 sites) and intelligence_worker.js
 * (2 sites) built replay-visible payload timestamps via
 * `new Date().toISOString()`. These timestamps are hashed into the payload
 * JSON that flows through the spine, so they are replay-critical — same
 * class as the unified_event_runtime.js spine fix.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const files = {
  canonical_workers: path.join(__dirname, '..', 'ping-runtime', 'workers', 'canonical_workers.js'),
  intelligence_worker: path.join(__dirname, '..', 'ping-runtime', 'workers', 'intelligence_worker.js'),
};

function main() {
  console.log('=== worker payload timestamps use constitutional time authority ===');

  for (const [name, file] of Object.entries(files)) {
    const source = fs.readFileSync(file, 'utf8');

    test(`${name}: no new Date() bypass remains`, () => {
      assert.strictEqual((source.match(/new Date\(\)/g) || []).length, 0, 'zero `new Date()` call sites');
    });

    test(`${name}: imports constitutional time authority`, () => {
      assert.ok(source.includes("require('../authorities/constitutional_time_authority.js')"), 'time authority import present');
    });

    test(`${name}: payload timestamps use nowAsISOString()`, () => {
      const sites = source.match(/timestamp: constitutionalTimeAuthority\.nowAsISOString\(\)/g) || [];
      assert.ok(sites.length >= 1, `at least one timestamp site fixed (found ${sites.length})`);
    });

    test(`${name}: module loads without error`, () => {
      delete require.cache[require.resolve(file.replace(/\.js$/, ''))];
      const mod = require(file.replace(/\.js$/, ''));
      assert.ok(mod, 'module exports');
    });
  }

  test('nowAsISOString() returns valid ISO timestamp', () => {
    const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority');
    const iso = constitutionalTimeAuthority.nowAsISOString();
    assert.ok(!Number.isNaN(Date.parse(iso)), 'parses as date');
    assert.ok(iso.endsWith('Z'), 'UTC ISO timestamp');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
