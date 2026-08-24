/**
 * Test: Priority Boundary Adapter
 *
 * Verifies canonicalPriority() normalizes all 4 priority scales
 * to canonical int 0-3.
 */

const { canonicalPriority } = require('../ping-runtime/boundaries/priority_boundary.js');

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label} — expected ${expected}, got ${actual}`);
  }
}

// ─── Canonical (passthrough) ──────────────────────────────
console.log('Group 1: Canonical int 0-3 passthrough');
assert('0 → 0', canonicalPriority(0), 0);
assert('1 → 1', canonicalPriority(1), 1);
assert('2 → 2', canonicalPriority(2), 2);
assert('3 → 3', canonicalPriority(3), 3);

// ─── Orca scale (int 1-10) ────────────────────────────────
// NOTE: ints 1-3 overlap with canonical. The adapter treats them as canonical
// (passthrough) since canonical check runs first. Orca values 4-10 are converted.
console.log('Group 2: Orca int 4-10 → canonical (1-3 overlap canonical, see Group 1)');
assert('4 → 1', canonicalPriority(4), 1);
assert('5 → 2', canonicalPriority(5), 2);
assert('6 → 2', canonicalPriority(6), 2);
assert('7 → 3', canonicalPriority(7), 3);
assert('8 → 3', canonicalPriority(8), 3);
assert('9 → 3', canonicalPriority(9), 3);
assert('10 → 3', canonicalPriority(10), 3);

// ─── String scale ─────────────────────────────────────────
console.log('Group 3: IntelligenceWorker strings → canonical');
assert("'low' → 0", canonicalPriority('low'), 0);
assert("'normal' → 1", canonicalPriority('normal'), 1);
assert("'medium' → 2", canonicalPriority('medium'), 2);
assert("'high' → 3", canonicalPriority('high'), 3);
assert("'critical' → 3", canonicalPriority('critical'), 3);
assert("'urgent' → 3", canonicalPriority('urgent'), 3);
assert("'LOW' → 0 (case-insensitive)", canonicalPriority('LOW'), 0);

// ─── Computed float (mission_compiler) ────────────────────
console.log('Group 4: Computed float 0-10 → canonical');
assert('0.0 → 0', canonicalPriority(0.0), 0);
assert('1.5 → 0', canonicalPriority(1.5), 0);
assert('2.4 → 0', canonicalPriority(2.4), 0);
assert('2.5 → 1', canonicalPriority(2.5), 1);
assert('4.9 → 1', canonicalPriority(4.9), 1);
assert('5.0 → 2', canonicalPriority(5.0), 2);
assert('7.4 → 2', canonicalPriority(7.4), 2);
assert('7.5 → 3', canonicalPriority(7.5), 3);
assert('9.9 → 3', canonicalPriority(9.9), 3);
assert('10.0 → 3', canonicalPriority(10.0), 3);

// ─── Fallback ─────────────────────────────────────────────
console.log('Group 5: Fallback defaults');
assert('null → 1', canonicalPriority(null), 1);
assert('undefined → 1', canonicalPriority(undefined), 1);
assert("'unknown' → 1", canonicalPriority('unknown'), 1);
assert('-1 → 1 (out of range)', canonicalPriority(-1), 1);
assert('11 → 1 (out of range)', canonicalPriority(11), 1);

// ─── Summary ──────────────────────────────────────────────
console.log(`\n=== Summary ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) process.exit(1);
