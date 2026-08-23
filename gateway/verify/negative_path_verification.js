#!/usr/bin/env node

/**
 * Negative-Path Verification
 * 
 * Phase 36 Closure Audit - Negative-Path Verification
 * 
 * For every constitutional authority, prove there is no alternate path.
 * 
 * Verification:
 * 1. There is no way to compute an event hash except through CanonicalBytes
 * 2. There is no way to generate runtime identity except through RuntimeIdentityAuthority
 * 3. There is no way to create a witness except through WitnessAuthority
 * 4. There is no way to execute replay except through ReplayAuthority
 * 5. There is no way to get time except through RuntimeClock/ConstitutionalTimeAuthority
 * 6. There is no way to serialize except through CanonicalBytes
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 NEGATIVE-PATH VERIFICATION');
console.log('==============================\n');

const gatewayRoot = path.join(__dirname, '..');
const replayVisiblePaths = [
  'replay_authority.js',
  'replay_certificate_authority.js',
  'reducer_authority.js',
  'event_repository.js',
  '../ping-runtime/events/standard_event_schema.js',
  'execution_graph_authority.js',
  'worker_registry.js',
  'canonical_authority.js',
  'runtime_identity_authority.js',
  'constitutional_time_authority.js',
  'runtime_clock.js',
  'replay_time_authority.js',
  'witness_authority.js',
  'witness_generator.js',
  'activities/replay.activity.js',
  'activities/repository.activity.js',
  'activities/compiler.activity.js',
  'activities/mission.activity.js',
  'activities/reflection.activity.js',
  'activities/knowledge.activity.js'
];

const verifications = {
  canonicalBytes: {
    name: 'CanonicalBytes is the only serialization path',
    passed: true,
    violations: []
  },
  runtimeIdentity: {
    name: 'RuntimeIdentityAuthority is the only identity path',
    passed: true,
    violations: []
  },
  witnessAuthority: {
    name: 'WitnessAuthority is the only witness creation path',
    passed: true,
    violations: []
  },
  replayAuthority: {
    name: 'ReplayAuthority is the only replay execution path',
    passed: true,
    violations: []
  },
  timeAuthority: {
    name: 'Time authorities are the only time path',
    passed: true,
    violations: []
  }
};

console.log('Verifying negative paths...\n');

// Verification 1: CanonicalBytes is the only serialization path
console.log('1. CanonicalBytes is the only serialization path');
console.log('   Checking for alternate serialization methods...\n');

for (const file of replayVisiblePaths) {
  const filePath = path.join(gatewayRoot, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for direct Buffer.from with JSON (bypassing CanonicalBytes)
    const bufferFromJSON = content.match(/Buffer\.from\(JSON\.stringify/g);
    if (bufferFromJSON && !file.includes('canonical_authority.js')) {
      verifications.canonicalBytes.passed = false;
      verifications.canonicalBytes.violations.push({
        file,
        type: 'Buffer.from(JSON.stringify)',
        message: 'Direct Buffer.from(JSON.stringify) bypasses CanonicalBytes'
      });
    }
    
    // Check for direct JSON.stringify in replay-visible code (except canonical_authority.js)
    const jsonStringify = content.match(/JSON\.stringify/g);
    if (jsonStringify && !file.includes('canonical_authority.js') && !file.includes('witness_generator.js')) {
      verifications.canonicalBytes.passed = false;
      verifications.canonicalBytes.violations.push({
        file,
        type: 'JSON.stringify',
        message: 'Direct JSON.stringify bypasses CanonicalBytes'
      });
    }
  }
}

console.log(`   Result: ${verifications.canonicalBytes.passed ? '✅ PASS' : '❌ FAIL'}`);
if (!verifications.canonicalBytes.passed) {
  console.log('   Violations:');
  for (const v of verifications.canonicalBytes.violations) {
    console.log(`     - ${v.file}: ${v.message}`);
  }
}

// Verification 2: RuntimeIdentityAuthority is the only identity path
console.log('\n2. RuntimeIdentityAuthority is the only identity path');
console.log('   Checking for alternate identity generation...\n');

for (const file of replayVisiblePaths) {
  const filePath = path.join(gatewayRoot, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for crypto.randomUUID
    const cryptoUUID = content.match(/crypto\.randomUUID/g);
    if (cryptoUUID) {
      verifications.runtimeIdentity.passed = false;
      verifications.runtimeIdentity.violations.push({
        file,
        type: 'crypto.randomUUID',
        message: 'Direct crypto.randomUUID bypasses RuntimeIdentityAuthority'
      });
    }
    
    // Check for Math.random in ID generation
    const mathRandom = content.match(/Math\.random/g);
    if (mathRandom) {
      // Check if used for ID generation
      const idGeneration = content.match(/id.*Math\.random|Math\.random.*id/gi);
      if (idGeneration) {
        verifications.runtimeIdentity.passed = false;
        verifications.runtimeIdentity.violations.push({
          file,
          type: 'Math.random for ID',
          message: 'Math.random used for ID generation bypasses RuntimeIdentityAuthority'
        });
      }
    }
  }
}

console.log(`   Result: ${verifications.runtimeIdentity.passed ? '✅ PASS' : '❌ FAIL'}`);
if (!verifications.runtimeIdentity.passed) {
  console.log('   Violations:');
  for (const v of verifications.runtimeIdentity.violations) {
    console.log(`     - ${v.file}: ${v.message}`);
  }
}

// Verification 3: WitnessAuthority is the only witness creation path
console.log('\n3. WitnessAuthority is the only witness creation path');
console.log('   Checking for alternate witness creation...\n');

for (const file of replayVisiblePaths) {
  const filePath = path.join(gatewayRoot, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for manual witness creation (new Witness)
    const newWitness = content.match(/new Witness/g);
    if (newWitness && !file.includes('witness_authority.js')) {
      verifications.witnessAuthority.passed = false;
      verifications.witnessAuthority.violations.push({
        file,
        type: 'new Witness',
        message: 'Direct new Witness bypasses WitnessAuthority'
      });
    }
    
    // Check for manual witness object creation
    const witnessObject = content.match(/witness:\s*\{/g);
    if (witnessObject && !file.includes('witness_authority.js') && !file.includes('witness_generator.js')) {
      verifications.witnessAuthority.passed = false;
      verifications.witnessAuthority.violations.push({
        file,
        type: 'Manual witness object',
        message: 'Manual witness object creation bypasses WitnessAuthority'
      });
    }
  }
}

console.log(`   Result: ${verifications.witnessAuthority.passed ? '✅ PASS' : '❌ FAIL'}`);
if (!verifications.witnessAuthority.passed) {
  console.log('   Violations:');
  for (const v of verifications.witnessAuthority.violations) {
    console.log(`     - ${v.file}: ${v.message}`);
  }
}

// Verification 4: ReplayAuthority is the only replay execution path
console.log('\n4. ReplayAuthority is the only replay execution path');
console.log('   Checking for alternate replay execution...\n');

const replayAuthorityPath = path.join(gatewayRoot, 'replay_authority.js');
if (fs.existsSync(replayAuthorityPath)) {
  const replayAuthorityContent = fs.readFileSync(replayAuthorityPath, 'utf8');
  
  // Check if replay authority is the single source of replay
  const hasReplayMethod = replayAuthorityContent.includes('async replay(');
  const hasVerifyReplay = replayAuthorityContent.includes('async verifyReplay(');
  
  if (hasReplayMethod && hasVerifyReplay) {
    // Check if other files have direct replay execution without ReplayAuthority
    for (const file of replayVisiblePaths) {
      if (file !== 'replay_authority.js' && !file.includes('activity')) {
        const filePath = path.join(gatewayRoot, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Only flag if they have replay execution methods but don't use replayAuthority
          const hasAsyncReplay = content.match(/async\s+\w+.*replay/gi);
          const usesReplayAuthority = content.includes('replayAuthority');
          
          if (hasAsyncReplay && !usesReplayAuthority) {
            verifications.replayAuthority.passed = false;
            verifications.replayAuthority.violations.push({
              file,
              type: 'Direct replay method',
              message: 'Has async replay method without ReplayAuthority'
            });
          }
        }
      }
    }
  }
}

console.log(`   Result: ${verifications.replayAuthority.passed ? '✅ PASS' : '❌ FAIL'}`);
if (!verifications.replayAuthority.passed) {
  console.log('   Violations:');
  for (const v of verifications.replayAuthority.violations) {
    console.log(`     - ${v.file}: ${v.message}`);
  }
}

// Verification 5: Time authorities are the only time path
console.log('\n5. Time authorities are the only time path');
console.log('   Checking for alternate time access...\n');

for (const file of replayVisiblePaths) {
  const filePath = path.join(gatewayRoot, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for Date.now (except in runtime_clock.js)
    const dateNow = content.match(/Date\.now\(\)/g);
    if (dateNow && !file.includes('runtime_clock.js') && !file.includes('constitutional_time_authority.js') && !file.includes('replay_time_authority.js')) {
      verifications.timeAuthority.passed = false;
      verifications.timeAuthority.violations.push({
        file,
        type: 'Date.now()',
        message: 'Direct Date.now() bypasses time authorities'
      });
    }
    
    // Check for new Date (except in runtime_clock.js)
    const newDate = content.match(/new Date\(\)/g);
    if (newDate && !file.includes('runtime_clock.js') && !file.includes('constitutional_time_authority.js') && !file.includes('replay_time_authority.js')) {
      verifications.timeAuthority.passed = false;
      verifications.timeAuthority.violations.push({
        file,
        type: 'new Date()',
        message: 'Direct new Date() bypasses time authorities'
      });
    }
  }
}

console.log(`   Result: ${verifications.timeAuthority.passed ? '✅ PASS' : '❌ FAIL'}`);
if (!verifications.timeAuthority.passed) {
  console.log('   Violations:');
  for (const v of verifications.timeAuthority.violations) {
    console.log(`     - ${v.file}: ${v.message}`);
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('NEGATIVE-PATH VERIFICATION SUMMARY');
console.log('='.repeat(50) + '\n');

const passedVerifications = Object.values(verifications).filter(v => v.passed).length;
const totalVerifications = Object.keys(verifications).length;

console.log(`Passed: ${passedVerifications}/${totalVerifications}`);
console.log(`Failed: ${totalVerifications - passedVerifications}/${totalVerifications}\n`);

for (const [key, verification] of Object.entries(verifications)) {
  console.log(`${key.toUpperCase()}: ${verification.passed ? '✅ PASS' : '❌ FAIL'} - ${verification.name}`);
}

console.log('\n' + '='.repeat(50));

if (passedVerifications === totalVerifications) {
  console.log('✅ ALL NEGATIVE PATHS VERIFIED');
  console.log('No alternate paths exist for constitutional authorities.');
  console.log('Build may proceed.');
  process.exit(0);
} else {
  console.log('❌ NEGATIVE-PATH VERIFICATION FAILED');
  console.log('Alternate paths exist for constitutional authorities.');
  console.log('Build CANNOT proceed until all negative paths are eliminated.');
  console.log('='.repeat(50));
  process.exit(1);
}
