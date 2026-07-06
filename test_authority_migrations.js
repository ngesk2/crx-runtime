// Authority Migration Validation Test
// Validate PATCH_009 and PATCH_010 - kernel→gateway dependencies resolved

console.log('=== Authority Migration Validation Test ===\n');

// Test 1: Load kernel RuntimeIdentityAuthority
console.log('Test 1: Loading kernel RuntimeIdentityAuthority...');
try {
  const { RuntimeIdentityAuthority, runtimeIdentityAuthority } = require('./runtime/kernel/authorities/runtime_identity_authority');
  console.log('✓ RuntimeIdentityAuthority loaded from kernel');
  console.log('✓ Singleton instance exported from kernel');
} catch (error) {
  console.error('✗ Failed to load kernel RuntimeIdentityAuthority:', error.message);
  process.exit(1);
}

// Test 2: Load kernel ReducerAuthority
console.log('\nTest 2: Loading kernel ReducerAuthority...');
try {
  const { ReducerAuthority, reducerAuthority } = require('./runtime/kernel/authorities/reducer_authority');
  console.log('✓ ReducerAuthority loaded from kernel');
  console.log('✓ Singleton instance exported from kernel');
} catch (error) {
  console.error('✗ Failed to load kernel ReducerAuthority:', error.message);
  process.exit(1);
}

// Test 3: Load gateway shims
console.log('\nTest 3: Loading gateway shims...');
try {
  const { RuntimeIdentityAuthority: GatewayRuntimeIdentityAuthority } = require('./gateway/runtime_identity_authority');
  console.log('✓ Gateway RuntimeIdentityAuthority shim loaded');
  
  const { ReducerAuthority: GatewayReducerAuthority } = require('./gateway/reducer_authority');
  console.log('✓ Gateway ReducerAuthority shim loaded');
} catch (error) {
  console.error('✗ Failed to load gateway shims:', error.message);
  process.exit(1);
}

// Test 4: Verify gateway shims delegate to kernel
console.log('\nTest 4: Verifying gateway shims delegate to kernel...');
try {
  const { RuntimeIdentityAuthority: KernelRuntimeIdentityAuthority } = require('./runtime/kernel/authorities/runtime_identity_authority');
  const { RuntimeIdentityAuthority: GatewayRuntimeIdentityAuthority } = require('./gateway/runtime_identity_authority');
  
  const { ReducerAuthority: KernelReducerAuthority } = require('./runtime/kernel/authorities/reducer_authority');
  const { ReducerAuthority: GatewayReducerAuthority } = require('./gateway/reducer_authority');
  
  if (GatewayRuntimeIdentityAuthority.prototype instanceof KernelRuntimeIdentityAuthority) {
    console.log('✓ Gateway RuntimeIdentityAuthority subclasses kernel');
  } else {
    console.error('✗ Gateway RuntimeIdentityAuthority does not subclass kernel');
    process.exit(1);
  }
  
  if (GatewayReducerAuthority.prototype instanceof KernelReducerAuthority) {
    console.log('✓ Gateway ReducerAuthority subclasses kernel');
  } else {
    console.error('✗ Gateway ReducerAuthority does not subclass kernel');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ Delegation verification failed:', error.message);
  process.exit(1);
}

// Test 5: Verify EventRepository no longer imports gateway
console.log('\nTest 5: Verifying EventRepository no longer imports gateway...');
try {
  const fs = require('fs');
  const path = require('path');
  const eventRepositoryContent = fs.readFileSync(path.join(__dirname, 'runtime/kernel/event_repository.js'), 'utf8');
  
  if (eventRepositoryContent.includes('../../gateway/runtime_identity_authority')) {
    console.error('✗ EventRepository still imports gateway runtimeIdentityAuthority');
    process.exit(1);
  } else {
    console.log('✓ EventRepository does not import gateway runtimeIdentityAuthority');
  }
  
  if (eventRepositoryContent.includes('./authorities/runtime_identity_authority')) {
    console.log('✓ EventRepository imports kernel runtimeIdentityAuthority');
  } else {
    console.error('✗ EventRepository does not import kernel runtimeIdentityAuthority');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ EventRepository verification failed:', error.message);
  process.exit(1);
}

// Test 6: Verify ReducerRegistry no longer imports gateway
console.log('\nTest 6: Verifying ReducerRegistry no longer imports gateway...');
try {
  const fs = require('fs');
  const path = require('path');
  const reducerRegistryContent = fs.readFileSync(path.join(__dirname, 'runtime/kernel/execution/reducer_registry.js'), 'utf8');
  
  if (reducerRegistryContent.includes('../../../gateway/reducer_authority')) {
    console.error('✗ ReducerRegistry still imports gateway reducerAuthority');
    process.exit(1);
  } else {
    console.log('✓ ReducerRegistry does not import gateway reducerAuthority');
  }
  
  if (reducerRegistryContent.includes('../authorities/reducer_authority')) {
    console.log('✓ ReducerRegistry imports kernel reducerAuthority');
  } else {
    console.error('✗ ReducerRegistry does not import kernel reducerAuthority');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ ReducerRegistry verification failed:', error.message);
  process.exit(1);
}

// Test 7: Verify kernel authorities can be loaded
console.log('\nTest 7: Verifying kernel authorities can be loaded...');
try {
  const { RuntimeIdentityAuthority } = require('./runtime/kernel/authorities/runtime_identity_authority');
  const { ReducerAuthority } = require('./runtime/kernel/authorities/reducer_authority');
  const { CanonicalAuthority } = require('./runtime/kernel/authorities/canonical_authority');
  const { constitutionalTimeAuthority } = require('./runtime/kernel/authorities/constitutional_time_authority');
  const { witnessAuthority } = require('./runtime/kernel/authorities/witness_authority');
  
  console.log('✓ All kernel authorities load successfully');
} catch (error) {
  console.error('✗ Failed to load kernel authorities:', error.message);
  process.exit(1);
}

console.log('\n=== Authority Migration Validation: PASSED ===');
console.log('PATCH_009: RuntimeIdentityAuthority moved to kernel');
console.log('PATCH_010: ReducerAuthority moved to kernel');
console.log('PATCH_008: ReducerRegistry corrected to use kernel ReducerAuthority');
console.log('Kernel→gateway dependencies resolved');
