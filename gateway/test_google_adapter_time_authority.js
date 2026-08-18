/**
 * Regression test: gateway/google adapters must not bypass the
 * constitutional time authority.
 *
 * Prior defect: business_profile.js set review_time via
 * `raw.createTime || new Date().toISOString()` — a synthesized timestamp
 * flowing into the REVIEW_RECEIVED event stream (replay-visible), bypassing
 * ConstitutionalTimeAuthority.
 *
 * This test proves no `new Date()`/`Date.now()` remains in any live-wired
 * google adapter.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const dir = path.join(__dirname, 'google');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

function main() {
  console.log('=== gateway/google adapters use constitutional time authority ===');

  test('google adapter dir has expected live files', () => {
    assert.ok(files.includes('business_profile.js'), 'business_profile.js present');
  });

  test('no new Date()/Date.now() bypass in any google adapter', () => {
    let bypasses = 0;
    for (const f of files) {
      const source = fs.readFileSync(path.join(dir, f), 'utf8');
      bypasses += (source.match(/new Date\(\)/g) || []).length;
      bypasses += (source.match(/Date\.now\(\)/g) || []).length;
    }
    assert.strictEqual(bypasses, 0, `zero bypasses across google adapters (found ${bypasses})`);
  });

  test('business_profile imports constitutional time authority', () => {
    const source = fs.readFileSync(path.join(dir, 'business_profile.js'), 'utf8');
    assert.ok(source.includes("require('../../ping-runtime/authorities/constitutional_time_authority.js')"), 'time authority import present');
  });

  test('business_profile review_time uses nowAsISOString() fallback', () => {
    const source = fs.readFileSync(path.join(dir, 'business_profile.js'), 'utf8');
    assert.ok(source.includes('raw.createTime || constitutionalTimeAuthority.nowAsISOString()'), 'review_time fallback sourced from time authority');
  });

  test('business_profile module loads without error', () => {
    delete require.cache[require.resolve('./google/business_profile.js')];
    const mod = require('./google/business_profile.js');
    assert.ok(mod.BusinessProfileAdapter || mod.businessProfileAdapter, 'exports adapter');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
