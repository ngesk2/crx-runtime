#!/usr/bin/env node
'use strict';
/**
 * ping-causal-debug — failure causal-chain CLI.
 *
 * NOT a browser debugger (the CEO order explicitly forbids building a custom
 * browser debugger). This is a thin CLI over the permanent regression ledger:
 * given a BUG-XXXX record, it prints the causal chain the ledger already
 * contains (invariant -> property -> seed -> counterexample -> first failing
 * SHA -> test owner -> how to replay), plus an optional Playwright trace
 * viewer link when a trace bundle is attached (trace viewer is the sanctioned
 * failure artifact; no new tooling).
 *
 * Usage:
 *   node tools/ping-causal-debug.js <regression_id>
 *   node tools/ping-causal-debug.js <regression_id> --trace <trace.zip path>
 */
const fs = require('node:fs');
const path = require('node:path');

const LEDGER_DIR = path.join(__dirname, '..', 'regression', 'generated');

function findRecord(id) {
  const files = fs.readdirSync(LEDGER_DIR).filter((f) => f.startsWith(id) && f.endsWith('.json'));
  if (!files.length) throw new Error(`no regression record for ${id} in ${LEDGER_DIR}`);
  return JSON.parse(fs.readFileSync(path.join(LEDGER_DIR, files[0]), 'utf8'));
}

function main() {
  const [id, ...rest] = process.argv.slice(2);
  if (!id) { console.error('usage: ping-causal-debug.js <regression_id> [--trace <trace.zip>]'); process.exit(2); }
  const traceIdx = rest.indexOf('--trace');
  const trace = traceIdx >= 0 ? rest[traceIdx + 1] : null;

  const r = findRecord(id);
  console.log('=== causal chain ===');
  console.log(`regression : ${r.regression_id}`);
  console.log(`invariant  : ${r.expected_invariant}`);
  console.log(`property   : ${r.property}`);
  console.log(`failure    : ${r.original_failure}`);
  console.log(`seed       : ${r.seed}   path: ${JSON.stringify(r.path || [])}`);
  console.log(`counterexample (minimized):`);
  console.log(JSON.stringify(r.minimal_counterexample, null, 2).slice(0, 2000));
  console.log(`first failing SHA: ${r.commit}`);
  console.log(`owner      : ${r.owner}`);
  console.log(`expected   : ${r.expected}`);
  console.log('');
  console.log('=== replay ===');
  console.log(`LADDER_DEEP=1 node --test tests/properties/<file>   # seed ${r.seed} reproduces the shrink`);
  if (trace) {
    console.log('');
    console.log('=== trace bundle ===');
    console.log(`trace.zip: ${trace}`);
    console.log('open with the Playwright trace viewer: npx playwright show-trace ' + trace);
  }
}

if (require.main === module) main();
module.exports = { findRecord };
