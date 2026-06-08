/**
 * FCA-12: Ordering Fuzz Test
 * 
 * Verifies deterministic ordering by testing that the same event stream
 * in the same order produces identical results across multiple executions.
 * Expected: 0 ordering failures
 */

import { ReplayEventStream } from '../../runtime/replay/replay_event_stream';
import { CanonicalEventEnvelope } from '../../runtime/replay/canonical_event_envelope';
import { DeterministicReplayEngine } from '../../runtime/replay/deterministic_replay_engine';

async function runOrderingFuzzTest() {
  console.log('FCA-12: Ordering Fuzz Test\n');
  
  // Create events with different IDs to test ordering determinism
  const eventDefinitions = [
    {
      event_id: 'evt-001',
      event_type: 'artifact_commit',
      actor_id: 'actor-001',
      timestamp: '2026-06-07T00:00:00Z',
      payload: { artifact_id: 'artifact-001', artifact_content: 'a' },
      lineage: { parent_event_ids: [] },
      schema_version: '1.0',
      replay_version: '1.0',
      policy_version: '1.0'
    },
    {
      event_id: 'evt-002',
      event_type: 'artifact_commit',
      actor_id: 'actor-001',
      timestamp: '2026-06-07T00:01:00Z',
      payload: { artifact_id: 'artifact-002', artifact_content: 'b' },
      lineage: { parent_event_ids: [] },
      schema_version: '1.0',
      replay_version: '1.0',
      policy_version: '1.0'
    },
    {
      event_id: 'evt-003',
      event_type: 'artifact_commit',
      actor_id: 'actor-001',
      timestamp: '2026-06-07T00:02:00Z',
      payload: { artifact_id: 'artifact-003', artifact_content: 'c' },
      lineage: { parent_event_ids: [] },
      schema_version: '1.0',
      replay_version: '1.0',
      policy_version: '1.0'
    }
  ];
  
  const engine = new DeterministicReplayEngine();
  let failures = 0;
  
  // Test that the same order produces the same result 100 times
  const events = eventDefinitions.map(e => new CanonicalEventEnvelope(e));
  const eventStream = new ReplayEventStream(events);
  
  const witnessRoots: string[] = [];
  
  for (let i = 0; i < 100; i++) {
    const result = engine.replay(eventStream);
    witnessRoots.push(result.witness_root.witness_root);
  }
  
  // All witness roots should be identical for the same event order
  const firstRoot = witnessRoots[0];
  for (let i = 1; i < witnessRoots.length; i++) {
    if (witnessRoots[i] !== firstRoot) {
      failures++;
    }
  }
  
  console.log(`Ordering failures: ${failures}/100`);
  
  if (failures === 0) {
    console.log('\n✓ FCA-12 PASSED: 0 ordering failures');
    process.exit(0);
  } else {
    console.log('\n✗ FCA-12 FAILED');
    process.exit(1);
  }
}

runOrderingFuzzTest().catch(error => {
  console.error('Test execution error:', error);
  process.exit(1);
});
