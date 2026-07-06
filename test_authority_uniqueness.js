// PATCH_004 Authority Uniqueness Audit
// Verify PATCH_004 policy authorities are in kernel, gateway has shims only

const fs = require('fs');
const path = require('path');

console.log('=== PATCH_004 Authority Uniqueness Audit ===\n');

// PATCH_004 targeted authorities with their file names
const PATCH_004_AUTHORITIES = [
  { name: 'IdentityAuthority', file: 'identity_authority.js' },
  { name: 'CanonicalAuthority', file: 'canonical_authority.js' },
  { name: 'ConstitutionalTimeAuthority', file: 'constitutional_time_authority.js' },
  { name: 'VerificationAuthority', file: 'verification_authority.js' },
  { name: 'WitnessAuthority', file: 'witness_authority.js' },
  { name: 'LineageAuthority', file: 'lineage_authority.js' }
];

function findAuthorityClass(filePath, authorityName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(new RegExp(`class\\s+${authorityName}\\s*(?:extends\\s+\\w+)?`));
    if (match) {
      return {
        name: authorityName,
        line: i + 1,
        file: filePath
      };
    }
  }
  
  return null;
}

console.log('=== PATCH_004 Authority Location Report ===\n');

const results = {};

for (const authority of PATCH_004_AUTHORITIES) {
  const kernelPath = path.join(__dirname, 'runtime/kernel/authorities', authority.file);
  const gatewayPath = path.join(__dirname, 'gateway', authority.file);
  
  const kernelExists = fs.existsSync(kernelPath);
  const gatewayExists = fs.existsSync(gatewayPath);
  
  const kernelAuthority = kernelExists ? findAuthorityClass(kernelPath, authority.name) : null;
  const gatewayAuthority = gatewayExists ? findAuthorityClass(gatewayPath, authority.name) : null;
  
  results[authority.name] = {
    kernel: kernelAuthority,
    gateway: gatewayAuthority
  };
  
  console.log(`${authority.name}:`);
  if (kernelAuthority) {
    console.log(`  ✓ Kernel: ${path.relative(__dirname, kernelAuthority.file)}`);
  } else {
    console.log(`  ✗ Kernel: NOT FOUND`);
  }
  
  if (gatewayAuthority) {
    console.log(`  ✓ Gateway: ${path.relative(__dirname, gatewayAuthority.file)}`);
  } else {
    console.log(`  ✗ Gateway: NOT FOUND`);
  }
  console.log();
}

// Verify kernel has full implementations
console.log('=== Kernel Implementation Verification ===');
const missingKernel = [];

for (const authority of PATCH_004_AUTHORITIES) {
  if (!results[authority.name].kernel) {
    missingKernel.push(authority.name);
  }
}

if (missingKernel.length > 0) {
  console.log(`✗ Missing kernel implementations: ${missingKernel.join(', ')}`);
  process.exit(1);
} else {
  console.log('✓ All PATCH_004 authorities have kernel implementations');
}

// Verify gateway has shims only
console.log('\n=== Gateway Shim Verification ===');
const nonShimGateways = [];

for (const authority of PATCH_004_AUTHORITIES) {
  const gatewayAuthority = results[authority.name].gateway;
  if (gatewayAuthority) {
    const content = fs.readFileSync(gatewayAuthority.file, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    
    // Shims should be small (< 50 lines of actual code)
    if (lines.length > 50) {
      nonShimGateways.push({ name: authority.name, file: gatewayAuthority.file, lines: lines.length });
    }
  }
}

if (nonShimGateways.length > 0) {
  console.log('✗ Gateway authorities that may not be shims:');
  nonShimGateways.forEach(a => console.log(`  ⚠ ${a.name} in ${path.relative(__dirname, a.file)} (${a.lines} lines)`));
  process.exit(1);
} else {
  console.log('✓ All gateway authorities are shims (minimal implementation)');
}

console.log('\n=== Authority Uniqueness Audit: PASSED ===');
console.log('All PATCH_004 authorities are in kernel.');
console.log('Gateway authorities are shims only.');
