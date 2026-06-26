/**
 * FCA-12: Mutation Test
 * 
 * Verifies that replay results are immutable and cannot be mutated.
 * Expected: 0 mutation failures
 */

import { ReplayEventStream } from '../../runtime/replay/replay_event_stream';
import { CanonicalEventEnvelope } from '../../runtime/replay/canonical_event_envelope';
import { DeterministicReplayEngine } from '../../runtime/replay/deterministic_replay_engine';

async function runMutationTest() {
  console.log('FCA-12: Mutation Test\n');
  
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
  
  const result1 = engine.replay(eventStream);
  const originalWitnessRoot = result1.witness_root.witness_root;
  
  // Attempt to mutate the result
  try {
    (result1.witness_root as any).witness_root = 'mutated';
  } catch (e) {
    // Expected - readonly property
  }
  
  // Run again to verify immutability
  const result2 = engine.replay(eventStream);
  
  let failures = 0;
  
  if (result1.witness_root.witness_root !== originalWitnessRoot) {
    console.log('✗ FAILED: Witness root was mutated');
    failures++;
  }
  
  if (result2.witness_root.witness_root !== originalWitnessRoot) {
    console.log('✗ FAILED: Mutation affected subsequent replays');
    failures++;
  }
  
  console.log(`Mutation failures: ${failures}`);
  
  if (failures === 0) {
    console.log('\n✓ FCA-12 PASSED: 0 mutation failures');
    process.exit(0);
  } else {
    console.log('\n✗ FCA-12 FAILED');
    process.exit(1);
  }
}

runMutationTest().catch(error => {
  console.error('Test execution error:', error);
  process.exit(1);
});
