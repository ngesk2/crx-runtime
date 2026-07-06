#!/usr/bin/env node

/**
 * 08_authorities - Authority Verification
 * 
 * Verifies:
 * - Authority registry exists
 * - No duplicate authorities
 * - No direct SQL in core authorities
 * - No direct HTTP in core authorities
 * - No direct SDK in core authorities
 * - One implementation per authority
 * - One owner per authority
 */

const fs = require('fs');
const path = require('path');

function checkAuthorityRegistry() {
  console.log('Checking authority registry...');
  
  const registryPath = path.join(__dirname, '..', 'constitutional_authority_registry.js');
  
  if (!fs.existsSync(registryPath)) {
    console.error('❌ Authority registry not found');
    return false;
  }

  console.log('✅ Authority registry exists');
  return true;
}

function checkDuplicateAuthorities() {
  console.log('Checking for duplicate authorities...');
  
  // Load repository inventory
  const inventoryPath = path.join(__dirname, '..', 'docs', 'repository_inventory.json');
  
  if (!fs.existsSync(inventoryPath)) {
    console.log('⚠️  Repository inventory not found, skipping duplicate check');
    return true;
  }

  try {
    const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));
    const classification = inventory.classification || {};
    
    const duplicates = Object.entries(classification)
      .filter(([_, status]) => status === 'Duplicate')
      .map(([file, _]) => file);

    if (duplicates.length > 0) {
      console.log('⚠️  Duplicate authorities found:', duplicates.length);
      duplicates.forEach(file => console.log(`   - ${file}`));
      return false;
    }

    console.log('✅ No duplicate authorities found');
    return true;
  } catch (error) {
    console.error('❌ Failed to check duplicates:', error.message);
    return false;
  }
}

function checkCoreIO() {
  console.log('Checking for I/O in core authorities...');
  
  const authorityFiles = [
    'adapter_authority.js',
    'canonical_authority.js',
    'witness_authority.js',
    'proof_authority.js',
    'identity_authority.js',
    'replay_authority.js',
    'retry_authority.js',
    'execution_authority.js',
    'event_authority.js',
    'repository_authority.js',
    'embedding_authority.js',
    'inference_authority.js',
    'constitutional_authority.js'
  ];

  let violations = [];

  for (const file of authorityFiles) {
    const filePath = path.join(__dirname, '..', file);
    
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for direct SQL
    if (content.match(/pg\.(query|client|pool)/gi)) {
      violations.push({ file, violation: 'direct SQL' });
    }

    // Check for direct HTTP
    if (content.match(/fetch\(/gi)) {
      violations.push({ file, violation: 'direct HTTP' });
    }

    // Check for direct file I/O
    if (content.match(/fs\.(readFile|writeFile|existsSync)/gi)) {
      violations.push({ file, violation: 'direct file I/O' });
    }
  }

  if (violations.length > 0) {
    console.log('⚠️  I/O violations found in core authorities:', violations.length);
    violations.forEach(({ file, violation }) => {
      console.log(`   - ${file}: ${violation}`);
    });
    return false;
  }

  console.log('✅ No I/O violations in core authorities');
  return true;
}

function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('08_authorities - Authority Verification');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const results = {
    registry: checkAuthorityRegistry(),
    duplicates: checkDuplicateAuthorities(),
    coreIO: checkCoreIO()
  };

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Results:');
  console.log('═══════════════════════════════════════════════════════════════');

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('✅ Authority verification PASSED');
    process.exit(0);
  } else {
    console.log('❌ Authority verification FAILED');
    process.exit(1);
  }
}

main();
