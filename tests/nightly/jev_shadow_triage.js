#!/usr/bin/env node
'use strict';
/**
 * JEV shadow triage — the JEV seam, and NOTHING else.
 *
 * JEV JUDGES. TESTS FALSIFY. PING AUTHORIZES. SOFTWARE EXECUTES. EVIDENCE
 * VERIFIES. PING RECORDS.
 *
 * This module routes minimized test failures to JEV for judgment in SHADOW
 * mode: JEV's verdict never flips a test result, never writes to PING, and
 * never leaves this file's JSONL output. Deterministic checks stay
 * deterministic — JEV is never asked to evaluate hashing, schema, exact
 * match, permissions, arithmetic, state transitions, replay equality, or any
 * other deterministic check (DETERMINISTIC_BLOCKED from jev_contract.py).
 *
 * Modes:
 *   node nightly/jev_shadow_triage.js selftest     -> committed CI gate:
 *     runs the stub courier over fixtures/failures.json, asserts routing
 *     shape, never touches a live JEV. Always green offline.
 *   node nightly/jev_shadow_triage.js --live       -> nightly/weekly only:
 *     calls the sanctioned JEV interface (~/workspace/fyd-intel/jev_ask.py)
 *     with --budget 30, one failure per call, only safe evaluation metadata
 *     persisted (NO SECRETS, no raw private context).
 *
 * Call budget: <= 30 JEV evaluations per run, per the CEO order. The courier
 * enforces the budget even if the input has more failures.
 *
 * JEV taxonomy (verbatim from the order):
 *   FAILURE_CLASS: FAILURE_CLASS/REGRESSION/FIXTURE/ENVIRONMENT/NETWORK/
 *     AUTH/SECURITY/STALE_TEST/PRODUCT/UNKNOWN
 *   COUNTEREXAMPLE_CLASS: NEW FAILURE/KNOWN FAILURE/SEMANTIC DUPLICATE/
 *     EXPECTED REJECTION/FLAKY/UNKNOWN
 *   CLAIM_SUPPORT_CLASS: SUPPORTED/PARTIALLY_SUPPORTED/CONTRADICTED/
 *     UNSUPPORTED/AMBIGUOUS
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const JEV_BUDGET = 30;
const JEV_ASK = process.env.JEV_ASK_PATH || path.join(process.env.HOME || '/root', 'workspace', 'fyd-intel', 'jev_ask.py');

// Purposes JEV may never be asked about (deterministic checks stay deterministic).
const DETERMINISTIC_BLOCKED = new Set([
  'hashing', 'schema-validate', 'exact-match', 'permissions', 'arithmetic',
  'state-transition', 'execution', 'dedupe', 'replay', 'projection', 'url-sanitize',
]);

// Stub courier: offline shape-preserving stand-in for JEV.
// Returns a typed judgment skeleton marked shadow + stub so no consumer can
// mistake it for a real evaluation.
function stubCourier(failure) {
  return {
    shadow: true,
    courier: 'stub',
    failure_class: 'UNKNOWN',
    counterexample_class: 'UNKNOWN',
    claim_support: 'AMBIGUOUS',
    regression_priority: 'p3',
    note: 'stub courier: shape only, no judgment performed',
    failure_ref: failure.regression_id || failure.property || 'unknown',
  };
}

// Live courier: one JEV call per failure via the sanctioned jev_ask.py interface.
// Typed decisions only; attestation rejection (ATTESTATION_REJECTED on
// stderr, exit 6) -> DO NOT CONSUME -> propagate as an error, never as a
// silent judgment. Safe evaluation metadata only: property name, invariant,
// failure summary. No raw private context, no secrets.
const FAILURE_CRITERIA = {
  REGRESSION: 'a previously green invariant now fails on a code path that used to pass',
  FIXTURE: 'the failure is an artifact of the test fixture or test data, not product behavior',
  ENVIRONMENT: 'the failure is caused by the execution environment (containers, network, tooling)',
  STALE_TEST: 'the test asserts behavior the product intentionally changed',
  PRODUCT: 'the product behaves incorrectly against its stated invariant',
  UNKNOWN: 'the evidence does not discriminate between these classes',
};

function liveCourier(failure, purpose) {
  if (DETERMINISTIC_BLOCKED.has(purpose)) {
    throw new Error(`jev shadow triage refuses deterministic purpose: ${purpose}`);
  }
  const state = [
    `property=${failure.property || 'unknown'}`,
    `invariant=${failure.invariant || 'unknown'}`,
    `failure=${String(failure.failure || '').slice(0, 500)}`,
    `seed=${failure.seed ?? 'unknown'}`,
  ].join('\n');
  const res = spawnSync('python3', [
    JEV_ASK,
    '--profile', 'TYPESAFE_JEV',
    '--purpose', purpose,
    '--type', 'choice',
    '--instructions', 'Shadow triage of a minimized PING test failure. Judge only; do not execute. Classify the failure with the FAILURE_CLASS taxonomy.',
    '--criteria', JSON.stringify(FAILURE_CRITERIA),
    '--state', state,
  ], { encoding: 'utf8', timeout: 180000 });
  if (res.status !== 0) {
    const tail = String(res.stderr || res.stdout || '').slice(0, 400);
    if (/ATTESTATION_REJECTED/.test(tail)) {
      throw new Error('JEV attestation rejected: DO NOT CONSUME this output');
    }
    throw new Error(`jev_ask failed (exit ${res.status}): ${tail}`);
  }
  let parsed;
  try { parsed = JSON.parse(res.stdout); } catch (e) {
    throw new Error('jev_ask returned non-JSON output');
  }
  if (parsed.status !== 'PASS') {
    throw new Error(`jev_ask did not pass: ${String(res.stdout).slice(0, 200)}`);
  }
  return { shadow: true, courier: 'jev_ask', judgment: parsed, failure_ref: failure.regression_id || failure.property };
}

// Route failures to JEV in shadow mode. Returns the routing records.
function triage(failures, { live = false, purpose = 'ambiguity-triage' } = {}) {
  const budget = Math.min(failures.length, JEV_BUDGET);
  const routed = [];
  for (let i = 0; i < budget; i++) {
    const failure = failures[i];
    routed.push(live ? liveCourier(failure, purpose) : stubCourier(failure));
  }
  return { routed, budget_used: budget, budget_total: JEV_BUDGET, live };
}

function loadFixtures() {
  const p = path.join(__dirname, 'fixtures', 'failures.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function selftest() {
  const fixtures = loadFixtures();
  if (!Array.isArray(fixtures)) throw new Error('fixtures/failures.json must be a JSON array');
  const r = triage(fixtures, { live: false });
  if (r.routed.length !== Math.min(fixtures.length, JEV_BUDGET)) throw new Error('budget math wrong');
  for (const j of r.routed) {
    if (j.shadow !== true || j.courier !== 'stub') throw new Error('stub shape violated');
    if (!('failure_class' in j) || !('counterexample_class' in j)) throw new Error('taxonomy keys missing');
  }
  // Deterministic purposes must be refused even to reach the live path.
  let refused = false;
  try { liveCourier({ property: 'x' }, 'hashing'); } catch (e) { refused = /refuses deterministic/.test(e.message); }
  if (!refused) throw new Error('deterministic purpose was not refused');
  // Over-budget input: courier must clamp to JEV_BUDGET, never exceed.
  const big = triage(new Array(100).fill({ property: 'x' }), { live: false });
  if (big.budget_used !== JEV_BUDGET) throw new Error('budget not clamped');
  console.log(`jev shadow triage selftest OK: ${r.routed.length} fixture failures routed, budget ${r.budget_used}/${r.budget_total}, deterministic purposes refused`);
}

if (require.main === module) {
  const mode = process.argv[2];
  if (mode === 'selftest') {
    selftest();
  } else if (mode === '--live') {
    const failures = JSON.parse(fs.readFileSync(process.argv[3] || '/dev/stdin', 'utf8'));
    const out = triage(failures, { live: true, purpose: process.argv[4] || 'ambiguity-triage' });
    const outPath = path.join(__dirname, `triage-${Date.now()}.jsonl`);
    fs.writeFileSync(outPath, out.routed.map((j) => JSON.stringify(j)).join('\n'));
    console.log(`live shadow triage: ${out.budget_used} judgments -> ${outPath} (shadow only, nothing marked fixed)`);
  } else {
    console.error('usage: jev_shadow_triage.js selftest | --live [failures.json] [purpose]');
    process.exit(2);
  }
}

module.exports = { triage, stubCourier, liveCourier, selftest, JEV_BUDGET, DETERMINISTIC_BLOCKED };
