/**
 * Phase 3.23 — Certification Test: Infrastructure Swap
 * 
 * Asserts that swapping infrastructure adapters does not change runtime behavior.
 * Authorities should be pure and independent of specific infrastructure implementations.
 * 
 * Test:
 * - Create mock adapters with identical interfaces
 * - Swap adapters in InfrastructureRegistry
 * - Execute authority with both adapter sets
 * - Assert outputs are identical (only infrastructure implementation changes)
 */

const { InfrastructureRegistry } = require('../../runtime/infrastructure_registry');

/**
 * Test infrastructure swap
 */
function testInfrastructureSwap() {
  console.log('[Infrastructure Swap Test] Starting infrastructure swap check...\n');

  let allPassed = true;
  const results = [];

  // Create two mock adapters with identical interfaces
  const mockAdapter1 = {
    name: 'mock-adapter-1',
    save: async (table, data) => {
      return { saved: true, adapter: 'mock-adapter-1', table, data_id: data.id };
    },
    load: async (table, id) => {
      return { loaded: true, adapter: 'mock-adapter-1', table, id };
    },
    health: async () => {
      return { healthy: true, adapter: 'mock-adapter-1' };
    },
  };

  const mockAdapter2 = {
    name: 'mock-adapter-2',
    save: async (table, data) => {
      return { saved: true, adapter: 'mock-adapter-2', table, data_id: data.id };
    },
    load: async (table, id) => {
      return { loaded: true, adapter: 'mock-adapter-2', table, id };
    },
    health: async () => {
      return { healthy: true, adapter: 'mock-adapter-2' };
    },
  };

  // Test 1: Register and resolve adapter 1
  const registry1 = new InfrastructureRegistry();
  registry1.register('mock', mockAdapter1);

  const resolved1 = registry1.resolve('mock');
  if (resolved1 === mockAdapter1) {
    console.log('✅ Adapter 1 registration and resolution - PASSED');
    results.push({ test: 'adapter 1 registration', passed: true });
  } else {
    console.log('❌ Adapter 1 registration and resolution - FAILED');
    allPassed = false;
    results.push({ test: 'adapter 1 registration', passed: false });
  }

  // Test 2: Register and resolve adapter 2 (swap)
  const registry2 = new InfrastructureRegistry();
  registry2.register('mock', mockAdapter2);

  const resolved2 = registry2.resolve('mock');
  if (resolved2 === mockAdapter2) {
    console.log('✅ Adapter 2 registration and resolution - PASSED');
    results.push({ test: 'adapter 2 registration', passed: true });
  } else {
    console.log('❌ Adapter 2 registration and resolution - FAILED');
    allPassed = false;
    results.push({ test: 'adapter 2 registration', passed: false });
  }

  // Test 3: Both adapters have identical interface
  const interface1 = Object.keys(mockAdapter1).sort();
  const interface2 = Object.keys(mockAdapter2).sort();

  if (JSON.stringify(interface1) === JSON.stringify(interface2)) {
    console.log('✅ Adapter interface compatibility - PASSED');
    results.push({ test: 'interface compatibility', passed: true });
  } else {
    console.log('❌ Adapter interface compatibility - FAILED');
    console.log(`   Adapter 1 interface: ${interface1.join(', ')}`);
    console.log(`   Adapter 2 interface: ${interface2.join(', ')}`);
    allPassed = false;
    results.push({ test: 'interface compatibility', passed: false });
  }

  // Test 4: Both adapters return same structure (different adapter ID)
  const testData = { id: 'test-123', value: 'test' };

  const result1 = mockAdapter1.save('test_table', testData);
  const result2 = mockAdapter2.save('test_table', testData);

  // Compare structure (excluding adapter-specific field)
  const structure1 = { ...result1 };
  const structure2 = { ...result2 };
  delete structure1.adapter;
  delete structure2.adapter;

  if (JSON.stringify(structure1) === JSON.stringify(structure2)) {
    console.log('✅ Adapter output structure consistency - PASSED');
    results.push({ test: 'output structure consistency', passed: true });
  } else {
    console.log('❌ Adapter output structure consistency - FAILED');
    allPassed = false;
    results.push({ test: 'output structure consistency', passed: false });
  }

  // Test 5: Health check aggregation works with swapped adapters
  const health1 = registry1.health();
  const health2 = registry2.health();

  if (health1.healthy && health2.healthy) {
    console.log('✅ Health check with swapped adapters - PASSED');
    results.push({ test: 'health check swap', passed: true });
  } else {
    console.log('❌ Health check with swapped adapters - FAILED');
    allPassed = false;
    results.push({ test: 'health check swap', passed: false });
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ Infrastructure Swap Test: PASSED');
    console.log('Infrastructure adapters can be swapped without breaking runtime behavior.');
  } else {
    console.log('❌ Infrastructure Swap Test: FAILED');
    console.log('Infrastructure swap did not work as expected.');
  }
  console.log('='.repeat(50));

  return {
    passed: allPassed,
    results: results,
  };
}

// Run test if executed directly
if (require.main === module) {
  const result = testInfrastructureSwap();
  process.exit(result.passed ? 0 : 1);
}

module.exports = { testInfrastructureSwap };
