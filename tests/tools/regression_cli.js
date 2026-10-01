#!/usr/bin/env node
'use strict';
/**
 * regression_cli — list/query the permanent regression ledger.
 *
 * Usage:
 *   node tools/regression_cli.js list
 *   node tools/regression_cli.js show <regression_id>
 *   node tools/regression_cli.js count
 *
 * Read-only over tests/regression/generated/BUG-*.json (the schema example
 * BUG-0000 is excluded from counts). Every failure the property tiers find
 * lands here with seed, minimized counterexample, first failing SHA, and
 * owner — KNOWLEDGE MUST COMPOUND.
 */
const fs = require('node:fs');
const path = require('node:path');

const LEDGER_DIR = path.join(__dirname, '..', 'regression', 'generated');

function records() {
  return fs.readdirSync(LEDGER_DIR)
    .filter((f) => f.endsWith('.json') && !f.includes('BUG-0000'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(LEDGER_DIR, f), 'utf8')));
}

function main() {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'list') {
    for (const r of records()) {
      console.log(`${r.regression_id}  ${r.property}  seed=${r.seed}  ${r.failure_class || ''}  owner=${r.owner}`);
    }
  } else if (cmd === 'show') {
    const r = records().find((x) => x.regression_id === arg);
    if (!r) { console.error(`unknown ${arg}`); process.exit(1); }
    console.log(JSON.stringify(r, null, 2));
  } else if (cmd === 'count') {
    console.log(records().length);
  } else {
    console.error('usage: regression_cli.js list|show <id>|count');
    process.exit(2);
  }
}

if (require.main === module) main();
module.exports = { records };
