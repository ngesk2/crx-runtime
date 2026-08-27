#!/usr/bin/env node
/**
 * Constitutional Eval Harness
 *
 * Runs 8 deterministic scenarios proving invariants hold under stress.
 * No Docker dependency — all infrastructure mocked.
 *
 * Usage: node evals/constitutional-runtime/eval_harness.js
 */

const path = require('path');
const fs = require('fs');

const SCENARIOS = [
  'EVAL-001_idempotent_reingest',
  'EVAL-002_namespace_privacy_chain',
  'EVAL-003_confidence_null_propagation',
  'EVAL-004_priority_canonicalization',
  'EVAL-005_governance_rejection',
  'EVAL-006_double_completion_prevention',
  'EVAL-007_worker_failure_propagation',
  'EVAL-008_knowledge_promotion_approval',
  'EVAL-009_replay_convergence',
];

async function run() {
  let totalPass = 0;
  let totalFail = 0;
  const results = [];

  for (const name of SCENARIOS) {
    const filePath = path.join(__dirname, `${name}.js`);
    if (!fs.existsSync(filePath)) {
      console.log(`  SKIP  ${name} (file not found)`);
      results.push({ name, pass: 0, fail: 0, skip: true });
      continue;
    }

    try {
      const mod = require(filePath);
      const result = await mod.run();
      const pass = result.pass || 0;
      const fail = result.fail || 0;
      totalPass += pass;
      totalFail += fail;
      const status = fail === 0 ? 'PASS' : 'FAIL';
      console.log(`  ${status}  ${name} (${pass}/${pass + fail})`);
      results.push({ name, pass, fail, skip: false });
    } catch (err) {
      totalFail++;
      console.log(`  ERROR ${name}: ${err.message}`);
      results.push({ name, pass: 0, fail: 1, skip: false, error: err.message });
    }
  }

  console.log(`\nTotal: ${totalPass} pass, ${totalFail} fail, ${SCENARIOS.length} scenarios`);
  if (totalFail > 0) process.exit(1);
}

run().catch(err => {
  console.error('Harness failed:', err);
  process.exit(1);
});
