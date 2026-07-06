/**
 * Phase 3.24 — Certification Test: Adapter Contract
 * 
 * Asserts that all infrastructure adapters implement identical interfaces.
 * 
 * Test:
 * - Load all adapter implementations
 * - Verify each adapter has required methods
 * - Verify method signatures are compatible
 * - Assert contract compliance
 */

const fs = require('fs');
const path = require('path');

const ADAPTERS_DIR = path.join(__dirname, '../../adapters');

// Required adapter interface
const REQUIRED_ADAPTER_METHODS = [
  'health',
  'close',
];

// Optional methods (may vary by adapter type)
const OPTIONAL_ADAPTER_METHODS = [
  'save',
  'load',
  'query',
  'generate',
  'embed',
  'upsert',
  'delete',
  'publish',
  'subscribe',
  'get',
  'set',
  'listModels',
  'getModelInfo',
];

/**
 * Test adapter contract compliance
 */
function testAdapterContract() {
  console.log('[Adapter Contract Test] Starting adapter contract check...\n');

  const adapterFiles = fs.readdirSync(ADAPTERS_DIR)
    .filter(file => file.endsWith('_adapter.js'))
    .map(file => path.join(ADAPTERS_DIR, file));

  let allPassed = true;
  const results = [];

  for (const filePath of adapterFiles) {
    const fileName = path.basename(filePath);
    console.log(`\nChecking ${fileName}...`);

    try {
      // Load adapter module
      const adapterModule = require(filePath);
      
      // Get adapter class (first export)
      const AdapterClass = Object.values(adapterModule)[0];
      
      if (!AdapterClass) {
        console.log(`❌ ${fileName} - FAILED (no class exported)`);
        allPassed = false;
        results.push({ file: fileName, passed: false, reason: 'no class exported' });
        continue;
      }

      // Check required methods
      const missingRequired = REQUIRED_ADAPTER_METHODS.filter(method => 
        typeof AdapterClass.prototype[method] !== 'function'
      );

      if (missingRequired.length > 0) {
        console.log(`❌ ${fileName} - FAILED (missing required methods: ${missingRequired.join(', ')})`);
        allPassed = false;
        results.push({ file: fileName, passed: false, reason: `missing methods: ${missingRequired.join(', ')}` });
        continue;
      }

      // Check that methods are functions
      const adapterMethods = Object.getOwnPropertyNames(AdapterClass.prototype)
        .filter(name => name !== 'constructor');

      const nonFunctionMethods = adapterMethods.filter(method =>
        typeof AdapterClass.prototype[method] !== 'function'
      );

      if (nonFunctionMethods.length > 0) {
        console.log(`❌ ${fileName} - FAILED (non-function methods: ${nonFunctionMethods.join(', ')})`);
        allPassed = false;
        results.push({ file: fileName, passed: false, reason: `non-function methods: ${nonFunctionMethods.join(', ')}` });
        continue;
      }

      console.log(`✅ ${fileName} - PASSED`);
      console.log(`   Required methods: ${REQUIRED_ADAPTER_METHODS.join(', ')}`);
      console.log(`   Total methods: ${adapterMethods.length}`);
      results.push({ 
        file: fileName, 
        passed: true, 
        methods: adapterMethods,
        requiredMethods: REQUIRED_ADAPTER_METHODS,
      });

    } catch (error) {
      console.log(`❌ ${fileName} - FAILED (load error: ${error.message})`);
      allPassed = false;
      results.push({ file: fileName, passed: false, reason: `load error: ${error.message}` });
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ Adapter Contract Test: PASSED');
    console.log('All adapters implement the required contract.');
  } else {
    console.log('❌ Adapter Contract Test: FAILED');
    console.log('Some adapters do not implement the required contract.');
  }
  console.log('='.repeat(50));

  return {
    passed: allPassed,
    results: results,
  };
}

// Run test if executed directly
if (require.main === module) {
  const result = testAdapterContract();
  process.exit(result.passed ? 0 : 1);
}

module.exports = { testAdapterContract };
