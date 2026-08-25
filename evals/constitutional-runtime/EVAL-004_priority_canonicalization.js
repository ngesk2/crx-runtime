/**
 * EVAL-004: Priority Canonicalization
 *
 * Proves INV-022 (canonical priority scale 0-3).
 *
 * Mission with string 'urgent' priority → bridge normalizes to 3.
 * Orca int 8 → normalizes to 3.
 * Canonical int 2 → passthrough.
 */

let pass = 0;
let fail = 0;

function assert(condition, msg) {
  if (condition) { pass++; } else { fail++; console.log(`    FAIL: ${msg}`); }
}

async function run() {
  const { canonicalPriority } = require('../../ping-runtime/boundaries/priority_boundary');

  // INV-022: Canonical int 0-3 passthrough
  assert(canonicalPriority(0) === 0, 'canonical 0 passthrough');
  assert(canonicalPriority(1) === 1, 'canonical 1 passthrough');
  assert(canonicalPriority(2) === 2, 'canonical 2 passthrough');
  assert(canonicalPriority(3) === 3, 'canonical 3 passthrough');

  // INV-022: Orca int 4-10 mapped
  assert(canonicalPriority(4) === 1, 'orca 4 → 1');
  assert(canonicalPriority(5) === 2, 'orca 5 → 2');
  assert(canonicalPriority(6) === 2, 'orca 6 → 2');
  assert(canonicalPriority(7) === 3, 'orca 7 → 3');
  assert(canonicalPriority(8) === 3, 'orca 8 → 3');
  assert(canonicalPriority(9) === 3, 'orca 9 → 3');
  assert(canonicalPriority(10) === 3, 'orca 10 → 3');

  // INV-022: String scale mapped
  assert(canonicalPriority('low') === 0, 'low → 0');
  assert(canonicalPriority('normal') === 1, 'normal → 1');
  assert(canonicalPriority('medium') === 2, 'medium → 2');
  assert(canonicalPriority('high') === 3, 'high → 3');
  assert(canonicalPriority('critical') === 3, 'critical → 3');
  assert(canonicalPriority('urgent') === 3, 'urgent → 3');

  // INV-022: Case-insensitive
  assert(canonicalPriority('HIGH') === 3, 'HIGH (uppercase) → 3');
  assert(canonicalPriority('Urgent') === 3, 'Urgent (mixed case) → 3');

  // INV-022: Out-of-range defaults to 1 (routine)
  assert(canonicalPriority(99) === 1, 'out-of-range int → 1');
  assert(canonicalPriority(-1) === 1, 'negative int → 1');
  assert(canonicalPriority('unknown') === 1, 'unknown string → 1');

  return { pass, fail };
}

module.exports = { run };
