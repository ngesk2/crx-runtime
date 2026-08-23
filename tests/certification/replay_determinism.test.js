/**
 * Phase 3.22 — Certification Test: Replay Determinism
 * 
 * Asserts that same inputs produce same outputs (deterministic behavior).
 * 
 * Test:
 * - Execute authority with same inputs twice
 * - Assert outputs are identical
 * - Verify deterministic ID generation
 */

const { deterministicIdAuthority } = require('../../ping-runtime/authorities/deterministic_id_authority');
const { constitutionalTimeAuthority } = require('../../ping-runtime/authorities/constitutional_time_authority.js');

/**
 * Test replay determinism
 */
function testReplayDeterminism() {
  console.log('[Replay Determinism Test] Starting replay determinism check...\n');

  let allPassed = true;
  const results = [];

  // Test 1: Deterministic ID generation with same inputs
  const input1 = {
    node_id: 'test-node-1',
    timestamp: 1234567890,
  };

  const id1 = deterministicIdAuthority.generateIdFromObject(input1);
  const id2 = deterministicIdAuthority.generateIdFromObject(input1);

  if (id1 === id2) {
    console.log('✅ Deterministic ID generation - PASSED');
    results.push({ test: 'deterministic ID', passed: true });
  } else {
    console.log('❌ Deterministic ID generation - FAILED');
    console.log(`   First ID: ${id1}`);
    console.log(`   Second ID: ${id2}`);
    allPassed = false;
    results.push({ test: 'deterministic ID', passed: false });
  }

  // Test 2: Different inputs produce different IDs
  const input2 = {
    node_id: 'test-node-2',
    timestamp: 1234567890,
  };

  const id3 = deterministicIdAuthority.generateIdFromObject(input2);

  if (id1 !== id3) {
    console.log('✅ Different inputs produce different IDs - PASSED');
    results.push({ test: 'different IDs for different inputs', passed: true });
  } else {
    console.log('❌ Different inputs produce different IDs - FAILED');
    allPassed = false;
    results.push({ test: 'different IDs for different inputs', passed: false });
  }

  // Test 3: Object property order doesn't affect ID
  const input3 = {
    timestamp: 1234567890,
    node_id: 'test-node-1',
  };

  const id4 = deterministicIdAuthority.generateIdFromObject(input3);

  if (id1 === id4) {
    console.log('✅ Property order independence - PASSED');
    results.push({ test: 'property order independence', passed: true });
  } else {
    console.log('❌ Property order independence - FAILED');
    console.log(`   Original ID: ${id1}`);
    console.log(`   Reordered ID: ${id4}`);
    allPassed = false;
    results.push({ test: 'property order independence', passed: false });
  }

  // Test 4: Nested object determinism
  const nestedInput1 = {
    node: {
      id: 'test',
      config: {
        model: 'llama2',
        temperature: 0.7,
      },
    },
    timestamp: 1234567890,
  };

  const nestedId1 = deterministicIdAuthority.generateIdFromObject(nestedInput1);
  const nestedId2 = deterministicIdAuthority.generateIdFromObject(nestedInput1);

  if (nestedId1 === nestedId2) {
    console.log('✅ Nested object determinism - PASSED');
    results.push({ test: 'nested object determinism', passed: true });
  } else {
    console.log('❌ Nested object determinism - FAILED');
    allPassed = false;
    results.push({ test: 'nested object determinism', passed: false });
  }

  // Test 5: Array order matters (different order = different ID)
  const arrayInput1 = {
    items: ['a', 'b', 'c'],
    timestamp: 1234567890,
  };

  const arrayInput2 = {
    items: ['c', 'b', 'a'],
    timestamp: 1234567890,
  };

  const arrayId1 = deterministicIdAuthority.generateIdFromObject(arrayInput1);
  const arrayId2 = deterministicIdAuthority.generateIdFromObject(arrayInput2);

  if (arrayId1 !== arrayId2) {
    console.log('✅ Array order sensitivity - PASSED');
    results.push({ test: 'array order sensitivity', passed: true });
  } else {
    console.log('❌ Array order sensitivity - FAILED (should be different)');
    allPassed = false;
    results.push({ test: 'array order sensitivity', passed: false });
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ Replay Determinism Test: PASSED');
    console.log('Deterministic ID generation works correctly.');
  } else {
    console.log('❌ Replay Determinism Test: FAILED');
    console.log('Deterministic behavior was not consistent.');
  }
  console.log('='.repeat(50));

  return {
    passed: allPassed,
    results: results,
  };
}

// Run test if executed directly
if (require.main === module) {
  const result = testReplayDeterminism();
  process.exit(result.passed ? 0 : 1);
}

module.exports = { testReplayDeterminism };
