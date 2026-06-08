/**
 * REPLAY VERIFICATION TESTS
 * 
 * Executable verification for deterministic replay kernel.
 */

import { ReplayEventStream } from '../../runtime/replay/replay_event_stream';
import { CanonicalEventEnvelope } from '../../runtime/replay/canonical_event_envelope';
import { DeterministicReplayEngine } from '../../runtime/replay/deterministic_replay_engine';
import { ReplayVerification } from '../../runtime/replay/replay_verification';
import { InvariantRunner } from '../../runtime/replay/invariant_runner';
import { ReplayInvariants } from '../../runtime/replay/replay_invariants';
import * as fs from 'fs';
import * as path from 'path';

async function runTests() {
  console.log('Starting replay verification tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Deterministic replay passes
  try {
    console.log('Test 1: Deterministic replay');
    const event = new CanonicalEventEnvelope({
      event_id: 'evt-001',
      event_type: 'artifact_commit',
      actor_id: 'actor-001',
      timestamp: '2026-06-07T00:00:00Z',
      payload: { artifact_id: 'artifact-001', artifact_content: 'test' },
      lineage: { parent_event_ids: [] },
      schema_version: '1.0',
      replay_version: '1.0',
      policy_version: '1.0'
    });
    
    const eventStream = new ReplayEventStream([event]);
    const engine = new DeterministicReplayEngine();
    const result = engine.replay(eventStream);
    
    if (result.witness_root.witness_root) {
      console.log('✓ PASSED: Deterministic replay executes\n');
      passed++;
    } else {
      console.log('✗ FAILED: Deterministic replay failed\n');
      failed++;
    }
  } catch (error) {
    console.log('✗ FAILED: Deterministic replay error:', error, '\n');
    failed++;
  }
  
  // Test 2: Witness roots stable
  try {
    console.log('Test 2: Witness root stability');
    const event = new CanonicalEventEnvelope({
      event_id: 'evt-002',
      event_type: 'artifact_commit',
      actor_id: 'actor-001',
      timestamp: '2026-06-07T00:00:00Z',
      payload: { artifact_id: 'artifact-002', artifact_content: 'test' },
      lineage: { parent_event_ids: [] },
      schema_version: '1.0',
      replay_version: '1.0',
      policy_version: '1.0'
    });
    
    const eventStream = new ReplayEventStream([event]);
    const engine = new DeterministicReplayEngine();
    const result1 = engine.replay(eventStream);
    const result2 = engine.replay(eventStream);
    
    if (result1.witness_root.witness_root === result2.witness_root.witness_root) {
      console.log('✓ PASSED: Witness roots are stable\n');
      passed++;
    } else {
      console.log('✗ FAILED: Witness roots are not stable\n');
      failed++;
    }
  } catch (error) {
    console.log('✗ FAILED: Witness root stability error:', error, '\n');
    failed++;
  }
  
  // Test 3: Invariant violations detected
  try {
    console.log('Test 3: Invariant violation detection');
    const invariantRunner = new InvariantRunner();
    invariantRunner.registerInvariant(ReplayInvariants.artifactHashInvariant);
    
    const state = {
      artifacts: new Map([['artifact-001', { artifact_id: 'artifact-001', artifact_hash: '', artifact_lineage: [] }]]),
      state_version: '1.0'
    };
    
    const violations = invariantRunner.runInvariants(state);
    
    if (violations.length > 0 && violations[0].invariant_id === 'ARTIFACT_HASH_VALID') {
      console.log('✓ PASSED: Invariant violations detected\n');
      passed++;
    } else {
      console.log('✗ FAILED: Invariant violations not detected\n');
      failed++;
    }
  } catch (error) {
    console.log('✗ FAILED: Invariant detection error:', error, '\n');
    failed++;
  }
  
  // Test 4: Cycle detection passes
  try {
    console.log('Test 4: Cycle detection');
    const invariantRunner = new InvariantRunner();
    
    const lineage = {
      edges: [
        { parent_id: 'evt-001', child_id: 'evt-002', edge_type: 'derivation' },
        { parent_id: 'evt-002', child_id: 'evt-003', edge_type: 'derivation' }
      ],
      graph_version: '1.0'
    };
    
    const cycles = invariantRunner.detectCycles(lineage);
    
    if (cycles.length === 0) {
      console.log('✓ PASSED: Cycle detection passes (no cycles)\n');
      passed++;
    } else {
      console.log('✗ FAILED: Cycle detection failed\n');
      failed++;
    }
  } catch (error) {
    console.log('✗ FAILED: Cycle detection error:', error, '\n');
    failed++;
  }
  
  // Test 5: Replay outputs byte-identical
  try {
    console.log('Test 5: Replay output determinism');
    const event = new CanonicalEventEnvelope({
      event_id: 'evt-003',
      event_type: 'artifact_commit',
      actor_id: 'actor-001',
      timestamp: '2026-06-07T00:00:00Z',
      payload: { artifact_id: 'artifact-003', artifact_content: 'test' },
      lineage: { parent_event_ids: [] },
      schema_version: '1.0',
      replay_version: '1.0',
      policy_version: '1.0'
    });
    
    const eventStream = new ReplayEventStream([event]);
    const verification = new ReplayVerification();
    
    const isReproducible = verification.verifyReproducibility(eventStream, 5);
    
    if (isReproducible) {
      console.log('✓ PASSED: Replay outputs are byte-identical\n');
      passed++;
    } else {
      console.log('✗ FAILED: Replay outputs are not byte-identical\n');
      failed++;
    }
  } catch (error) {
    console.log('✗ FAILED: Replay determinism error:', error, '\n');
    failed++;
  }
  
  // Test 6: No replay boundary violations
  try {
    console.log('Test 6: Replay boundary violations');
    const replayDir = path.join(__dirname, '../../runtime/replay');
    const files = fs.readdirSync(replayDir);
    
    let hasViolation = false;
    for (const file of files) {
      if (file.endsWith('.ts')) {
        const content = fs.readFileSync(path.join(replayDir, file), 'utf-8');
        if (content.includes('process.env') || content.includes('express') || content.includes('pg')) {
          hasViolation = true;
          break;
        }
      }
    }
    
    if (!hasViolation) {
      console.log('✓ PASSED: No replay boundary violations\n');
      passed++;
    } else {
      console.log('✗ FAILED: Replay boundary violations found\n');
      failed++;
    }
  } catch (error) {
    console.log('✗ FAILED: Boundary check error:', error, '\n');
    failed++;
  }
  
  // Summary
  console.log('='.repeat(50));
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log('='.repeat(50));
  
  if (failed === 0) {
    console.log('\n✓ ALL TESTS PASSED');
    process.exit(0);
  } else {
    console.log('\n✗ SOME TESTS FAILED');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test execution error:', error);
  process.exit(1);
});
