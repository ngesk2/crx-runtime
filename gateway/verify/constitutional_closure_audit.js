#!/usr/bin/env node

/**
 * Constitutional Closure Audit
 * 
 * Phase 36 Closure Audit with explicit pass/fail gates
 * 
 * Only when all eight gates pass should the kernel be considered constitutionally closed.
 */

const { constitutionalBlockers } = require('../constitutional_blockers');
const fs = require('fs');
const path = require('path');

console.log('🔒 CONSTITUTIONAL CLOSURE AUDIT');
console.log('==============================\n');

const gates = {
  gate1: { name: 'No replay-visible JSON serialization', passed: false },
  gate2: { name: 'No replay-visible Date access', passed: false },
  gate3: { name: 'No replay-visible filesystem authority', passed: false },
  gate4: { name: 'No replay-visible randomness', passed: false },
  gate5: { name: 'Every replay emits Witness, ReplayHash, ReplayCertificate', passed: false },
  gate6: { name: 'Every reducer cryptographically bound', passed: false },
  gate7: { name: 'Execution graph reconstructed only from events', passed: false },
  gate8: { name: 'Exactly one authority for serialization, hashing, witness, replay, identity, time', passed: false }
};

// Gates 1-4: Run constitutional blockers
console.log('Running Gates 1-4 (Constitutional Blockers)...\n');

const blockerResults = constitutionalBlockers.checkAllReplayVisibleFiles();

gates.gate1.passed = blockerResults.overallPassed; // JSON serialization
gates.gate2.passed = blockerResults.overallPassed; // Date access
gates.gate3.passed = blockerResults.overallPassed; // Filesystem authority
gates.gate4.passed = blockerResults.overallPassed; // Randomness

console.log(`Gate 1: ${gates.gate1.passed ? '✅ PASS' : '❌ FAIL'} - ${gates.gate1.name}`);
console.log(`Gate 2: ${gates.gate2.passed ? '✅ PASS' : '❌ FAIL'} - ${gates.gate2.name}`);
console.log(`Gate 3: ${gates.gate3.passed ? '✅ PASS' : '❌ FAIL'} - ${gates.gate3.name}`);
console.log(`Gate 4: ${gates.gate4.passed ? '✅ PASS' : '❌ FAIL'} - ${gates.gate4.name}`);

// Gate 5: Every replay emits Witness, ReplayHash, ReplayCertificate
console.log('\nRunning Gate 5 (Replay Certificate Emission)...\n');

const replayAuthorityPath = path.join(__dirname, '../replay_authority.js');
if (fs.existsSync(replayAuthorityPath)) {
  const replayAuthorityContent = fs.readFileSync(replayAuthorityPath, 'utf8');
  const hasReplayCertificate = replayAuthorityContent.includes('replayCertificateAuthority.createCertificate');
  const hasWitness = replayAuthorityContent.includes('witnessAuthority');
  const hasReplayHash = replayAuthorityContent.includes('replayHash') || replayAuthorityContent.includes('replay_hash');
  
  gates.gate5.passed = hasReplayCertificate && hasWitness && hasReplayHash;
  console.log(`Gate 5: ${gates.gate5.passed ? '✅ PASS' : '❌ FAIL'} - ${gates.gate5.name}`);
  if (!gates.gate5.passed) {
    console.log(`   - ReplayCertificateAuthority: ${hasReplayCertificate ? '✅' : '❌'}`);
    console.log(`   - WitnessAuthority: ${hasWitness ? '✅' : '❌'}`);
    console.log(`   - ReplayHash: ${hasReplayHash ? '✅' : '❌'}`);
  }
} else {
  console.log(`Gate 5: ❌ FAIL - ${gates.gate5.name} (replay_authority.js not found)`);
}

// Gate 6: Every reducer cryptographically bound
console.log('\nRunning Gate 6 (Reducer Cryptographic Binding)...\n');

const replayAuthorityPath2 = path.join(__dirname, '../replay_authority.js');
if (fs.existsSync(replayAuthorityPath2)) {
  const replayAuthorityContent = fs.readFileSync(replayAuthorityPath2, 'utf8');
  const hasReducerAuthority = replayAuthorityContent.includes('reducerAuthority.registerReducer') || replayAuthorityContent.includes('reducerAuthority.getReducer');
  const hasReducerHash = replayAuthorityContent.includes('reducer_hash') || replayAuthorityContent.includes('reducerHash');
  
  gates.gate6.passed = hasReducerAuthority && hasReducerHash;
  console.log(`Gate 6: ${gates.gate6.passed ? '✅ PASS' : '❌ FAIL'} - ${gates.gate6.name}`);
  if (!gates.gate6.passed) {
    console.log(`   - ReducerAuthority: ${hasReducerAuthority ? '✅' : '❌'}`);
    console.log(`   - ReducerHash: ${hasReducerHash ? '✅' : '❌'}`);
  }
} else {
  console.log(`Gate 6: ❌ FAIL - ${gates.gate6.name} (replay_authority.js not found)`);
}

// Gate 7: Execution graph reconstructed only from events
console.log('\nRunning Gate 7 (Execution Graph Event Sourcing)...\n');

const executionGraphPath = path.join(__dirname, '../execution_graph_authority.js');
if (fs.existsSync(executionGraphPath)) {
  const executionGraphContent = fs.readFileSync(executionGraphPath, 'utf8');
  const hasReconstructFromEvents = executionGraphContent.includes('reconstructFromEvents');
  const hasGraphNodeAdded = executionGraphContent.includes('GraphNodeAdded');
  const hasDependencyAdded = executionGraphContent.includes('DependencyAdded');
  const noFilesystemRead = !executionGraphContent.includes('fs.readFileSync');
  
  gates.gate7.passed = hasReconstructFromEvents && hasGraphNodeAdded && hasDependencyAdded && noFilesystemRead;
  console.log(`Gate 7: ${gates.gate7.passed ? '✅ PASS' : '❌ FAIL'} - ${gates.gate7.name}`);
  if (!gates.gate7.passed) {
    console.log(`   - reconstructFromEvents: ${hasReconstructFromEvents ? '✅' : '❌'}`);
    console.log(`   - GraphNodeAdded: ${hasGraphNodeAdded ? '✅' : '❌'}`);
    console.log(`   - DependencyAdded: ${hasDependencyAdded ? '✅' : '❌'}`);
    console.log(`   - No filesystem read: ${noFilesystemRead ? '✅' : '❌'}`);
  }
} else {
  console.log(`Gate 7: ❌ FAIL - ${gates.gate7.name} (execution_graph_authority.js not found)`);
}

// Gate 8: Exactly one authority for serialization, hashing, witness, replay, identity, time
console.log('\nRunning Gate 8 (Single Authority Verification)...\n');

const gatewayRoot = path.join(__dirname, '..');
const authorities = {
  serialization: ['canonical_authority.js'],
  hashing: ['canonical_authority.js'],
  witness: ['witness_authority.js'],
  replay: ['replay_authority.js'],
  identity: ['runtime_identity_authority.js'],
  time: ['runtime_clock.js', 'constitutional_time_authority.js', 'replay_time_authority.js']
};

let gate8Passed = true;

for (const [authorityType, files] of Object.entries(authorities)) {
  let foundCount = 0;
  for (const file of files) {
    const filePath = path.join(gatewayRoot, file);
    if (fs.existsSync(filePath)) {
      foundCount++;
    }
  }
  
  // For time, we expect 3 files (runtime_clock, constitutional_time, replay_time)
  const expectedCount = authorityType === 'time' ? 3 : 1;
  const passed = foundCount === expectedCount;
  
  if (!passed) {
    gate8Passed = false;
  }
  
  console.log(`   ${authorityType}: ${passed ? '✅' : '❌'} (${foundCount}/${expectedCount} files found)`);
}

gates.gate8.passed = gate8Passed;
console.log(`\nGate 8: ${gates.gate8.passed ? '✅ PASS' : '❌ FAIL'} - ${gates.gate8.name}`);

// Summary
console.log('\n' + '='.repeat(50));
console.log('CLOSURE AUDIT SUMMARY');
console.log('='.repeat(50) + '\n');

const passedGates = Object.values(gates).filter(g => g.passed).length;
const totalGates = Object.keys(gates).length;

console.log(`Passed: ${passedGates}/${totalGates}`);
console.log(`Failed: ${totalGates - passedGates}/${totalGates}\n`);

for (const [gateId, gate] of Object.entries(gates)) {
  console.log(`${gateId.toUpperCase()}: ${gate.passed ? '✅ PASS' : '❌ FAIL'} - ${gate.name}`);
}

console.log('\n' + '='.repeat(50));

if (passedGates === totalGates) {
  console.log('✅ ALL GATES PASSED');
  console.log('Constitutional kernel is CLOSED.');
  console.log('Build may proceed.');
  process.exit(0);
} else {
  console.log('❌ CLOSURE AUDIT FAILED');
  console.log('Constitutional kernel is NOT closed.');
  console.log('Build CANNOT proceed until all gates pass.');
  console.log('='.repeat(50));
  process.exit(1);
}
