#!/usr/bin/env node
'use strict';
/**
 * T4-full helper: run every directly-executable tests/certification/*.test.js
 * (the ones with a require.main guard) and report pass/fail.
 *
 * The *.test.ts files in tests/certification are NOT executed here: they
 * import from ../../runtime/replay/*, a path that does not exist in the main
 * tree, and no TS runner is configured for them. Their claim (ordering fuzz)
 * is preserved and generalized by tests/properties/replay_determinism.test.js
 * (fast-check, same engine). Reactivating the .ts files is a recorded
 * follow-up, not a silent skip.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const CERT_DIR = path.join(__dirname, '..', '..', 'certification');
const files = fs.readdirSync(CERT_DIR).filter((f) => f.endsWith('.test.js')).sort();

let failed = 0;
for (const f of files) {
  const full = path.join(CERT_DIR, f);
  const src = fs.readFileSync(full, 'utf8');
  if (!/require\.main\s*===\s*module/.test(src)) {
    console.log(`  [skip: no main guard] ${f}`);
    continue;
  }
  try {
    execFileSync(process.execPath, [full], { stdio: 'pipe', timeout: 120000 });
    console.log(`  [PASS] ${f}`);
  } catch (err) {
    failed++;
    console.log(`  [FAIL] ${f}: ${String(err.stderr || err.message).split('\n').slice(0, 3).join(' ')}`);
  }
}
console.log(failed ? `certification js runners: ${failed} FAILED` : `certification js runners: all passed (${files.length} files considered)`);
process.exit(failed ? 1 : 0);
