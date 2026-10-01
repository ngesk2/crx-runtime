'use strict';
/**
 * Case budgets and explicit seeds for the ladder.
 *
 * PR budget: 100 cases/property (fast, deterministic). Deep/nightly budget:
 * 500 cases/property via LADDER_DEEP=1. Every property takes an explicit
 * fixed seed so a green run is byte-reproducible; the seed and the failing
 * path are recorded into the regression corpus on failure.
 */
const PR_RUNS = parseInt(process.env.LADDER_PR_RUNS || '100', 10);
const DEEP = process.env.LADDER_DEEP === '1';
const DEEP_RUNS = parseInt(process.env.LADDER_DEEP_RUNS || '500', 10);

const RUNS = DEEP ? DEEP_RUNS : PR_RUNS;

function fcOptions(seed) {
  return { numRuns: RUNS, seed, endOnFailure: true };
}

module.exports = { PR_RUNS, DEEP, DEEP_RUNS, RUNS, fcOptions };
