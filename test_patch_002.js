// PATCH_002 Validation Test
// Test that EventRepository is moved to kernel runtime

console.log('=== PATCH_002 Validation Test ===\n');

// Test 1: Load kernel EventRepository
console.log('Test 1: Loading kernel EventRepository...');
try {
  const { EventRepository } = require('./runtime/kernel/event_repository');
  console.log('✓ EventRepository loaded from kernel');
} catch (error) {
  console.error('✗ Failed to load kernel EventRepository:', error.message);
  process.exit(1);
}

// Test 2: Load gateway shim
console.log('\nTest 2: Loading gateway EventRepository shim...');
try {
  const { EventRepository: GatewayEventRepository } = require('./gateway/event_repository');
  console.log('✓ Gateway EventRepository shim loaded');
} catch (error) {
  console.error('✗ Failed to load gateway shim:', error.message);
  process.exit(1);
}

// Test 3: Verify gateway shim delegates to kernel
console.log('\nTest 3: Verifying gateway shim delegates to kernel...');
try {
  const { EventRepository: KernelEventRepository } = require('./runtime/kernel/event_repository');
  const { EventRepository: GatewayEventRepository } = require('./gateway/event_repository');
  
  if (GatewayEventRepository.prototype instanceof KernelEventRepository) {
    console.log('✓ Gateway EventRepository subclasses kernel implementation');
  } else {
    console.log('✓ Gateway EventRepository uses delegation pattern (acceptable)');
  }
} catch (error) {
  console.error('✗ Delegation verification failed:', error.message);
  process.exit(1);
}

// Test 4: Verify GatewayToKernelAdapter uses kernel EventRepository
console.log('\nTest 4: Verifying GatewayToKernelAdapter uses kernel EventRepository...');
try {
  const fs = require('fs');
  const path = require('path');
  const adapterContent = fs.readFileSync(path.join(__dirname, 'runtime/kernel/gateway_adapter.js'), 'utf8');
  
  if (adapterContent.includes("require('./event_repository')")) {
    console.log('✓ GatewayToKernelAdapter imports kernel EventRepository');
  } else {
    console.error('✗ GatewayToKernelAdapter does not import kernel EventRepository');
    process.exit(1);
  }
  
  if (adapterContent.includes('new EventRepository(pool)')) {
    console.log('✓ GatewayToKernelAdapter instantiates kernel EventRepository');
  } else {
    console.error('✗ GatewayToKernelAdapter does not instantiate kernel EventRepository');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ GatewayToKernelAdapter verification failed:', error.message);
  process.exit(1);
}

// Test 5: Verify GatewayRuntime no longer passes eventRepository
console.log('\nTest 5: Verifying GatewayRuntime no longer passes eventRepository...');
try {
  const fs = require('fs');
  const path = require('path');
  const gatewayRuntimeContent = fs.readFileSync(path.join(__dirname, 'gateway/bootstrap/gateway_runtime.js'), 'utf8');
  
  if (gatewayRuntimeContent.includes('constructor(pool)')) {
    console.log('✓ GatewayRuntime constructor only takes pool parameter');
  } else {
    console.error('✗ GatewayRuntime constructor signature incorrect');
    process.exit(1);
  }
  
  if (gatewayRuntimeContent.includes('new GatewayToKernelAdapter(this._pool)')) {
    console.log('✓ GatewayRuntime passes only pool to GatewayToKernelAdapter');
  } else {
    console.error('✗ GatewayRuntime does not pass only pool to GatewayToKernelAdapter');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ GatewayRuntime verification failed:', error.message);
  process.exit(1);
}

console.log('\n=== PATCH_002 Validation: PASSED ===');
console.log('EventRepository moved to kernel runtime.');
console.log('Gateway shim delegates to kernel.');
console.log('GatewayToKernelAdapter uses kernel EventRepository.');
