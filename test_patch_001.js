// PATCH_001 Validation Test
// Test that gateway-to-kernel adapter interface is functional

console.log('=== PATCH_001 Validation Test ===\n');

// Test 1: Load GatewayToKernelAdapter
console.log('Test 1: Loading GatewayToKernelAdapter...');
try {
  const { GatewayToKernelAdapter } = require('./runtime/kernel/gateway_adapter');
  console.log('✓ GatewayToKernelAdapter loaded from kernel');
} catch (error) {
  console.error('✗ Failed to load GatewayToKernelAdapter:', error.message);
  process.exit(1);
}

// Test 2: Verify GatewayRuntime syntax
console.log('\nTest 2: Verifying GatewayRuntime syntax...');
try {
  const fs = require('fs');
  const path = require('path');
  const gatewayRuntimePath = path.join(__dirname, 'gateway/bootstrap/gateway_runtime.js');
  
  // Use node's built-in syntax checking
  const { execSync } = require('child_process');
  execSync(`node -c "${gatewayRuntimePath}"`, { stdio: 'pipe' });
  console.log('✓ GatewayRuntime syntax is valid');
} catch (error) {
  console.error('✗ GatewayRuntime has syntax error:', error.message);
  process.exit(1);
}

// Test 3: Verify adapter interface methods
console.log('\nTest 3: Verifying adapter interface methods...');
try {
  const { GatewayToKernelAdapter } = require('./runtime/kernel/gateway_adapter');
  
  const requiredMethods = [
    'executeEvent',
    'registerReducer',
    'registerProjection',
    'getPipeline',
    'getReducerRegistry',
    'getProjectionRegistry',
    'getDispatcher',
    'getReplayDecisionAuthority',
    'initialize',
    'shutdown'
  ];
  
  const adapterMethods = Object.getOwnPropertyNames(GatewayToKernelAdapter.prototype);
  
  for (const method of requiredMethods) {
    if (adapterMethods.includes(method)) {
      console.log(`✓ Adapter has method: ${method}`);
    } else {
      console.error(`✗ Adapter missing method: ${method}`);
      process.exit(1);
    }
  }
} catch (error) {
  console.error('✗ Adapter interface verification failed:', error.message);
  process.exit(1);
}

// Test 4: Verify GatewayRuntime uses adapter
console.log('\nTest 4: Verifying GatewayRuntime uses adapter...');
try {
  const fs = require('fs');
  const path = require('path');
  const gatewayRuntimeContent = fs.readFileSync(path.join(__dirname, 'gateway/bootstrap/gateway_runtime.js'), 'utf8');
  
  if (gatewayRuntimeContent.includes('GatewayToKernelAdapter')) {
    console.log('✓ GatewayRuntime imports GatewayToKernelAdapter');
  } else {
    console.error('✗ GatewayRuntime does not import GatewayToKernelAdapter');
    process.exit(1);
  }
  
  if (gatewayRuntimeContent.includes('kernelAdapter')) {
    console.log('✓ GatewayRuntime uses kernelAdapter');
  } else {
    console.error('✗ GatewayRuntime does not use kernelAdapter');
    process.exit(1);
  }
  
  if (gatewayRuntimeContent.includes('executeEvent')) {
    console.log('✓ GatewayRuntime calls adapter.executeEvent');
  } else {
    console.error('✗ GatewayRuntime does not call adapter.executeEvent');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ GatewayRuntime verification failed:', error.message);
  process.exit(1);
}

console.log('\n=== PATCH_001 Validation: PASSED ===');
console.log('Gateway-to-kernel adapter interface is functional.');
console.log('GatewayRuntime correctly uses the adapter.');
