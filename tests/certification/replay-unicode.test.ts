/**
 * FCA-12: Unicode Test
 * 
 * Verifies deterministic handling of unicode payloads.
 * Expected: 0 unicode failures
 */

import { ReplayEventStream } from '../../runtime/replay/replay_event_stream';
import { CanonicalEventEnvelope } from '../../runtime/replay/canonical_event_envelope';
import { DeterministicReplayEngine } from '../../runtime/replay/deterministic_replay_engine';

async function runUnicodeTest() {
  console.log('FCA-12: Unicode Test\n');
  
  const unicodePayloads = [
    'Hello 世界 🌍',
    'Привет мир',
    'مرحبا بالعالم',
    'こんにちは世界',
    '🎉🎊🎈',
    'Ñoño café',
    'München',
    'São Paulo'
  ];
  
  const engine = new DeterministicReplayEngine();
  let failures = 0;
  
  for (const payload of unicodePayloads) {
    const event = new CanonicalEventEnvelope({
      event_id: 'evt-001',
      event_type: 'artifact_commit',
      actor_id: 'actor-001',
      timestamp: '2026-06-07T00:00:00Z',
      payload: { artifact_id: 'artifact-001', artifact_content: payload },
      lineage: { parent_event_ids: [] },
      schema_version: '1.0',
      replay_version: '1.0',
      policy_version: '1.0'
    });
    
    const eventStream = new ReplayEventStream([event]);
    
    // Run twice to verify determinism
    const result1 = engine.replay(eventStream);
    const result2 = engine.replay(eventStream);
    
    if (result1.witness_root.witness_root !== result2.witness_root.witness_root) {
      failures++;
      console.log(`✗ FAILED for payload: ${payload}`);
    }
  }
  
  console.log(`Unicode failures: ${failures}/${unicodePayloads.length}`);
  
  if (failures === 0) {
    console.log('\n✓ FCA-12 PASSED: 0 unicode failures');
    process.exit(0);
  } else {
    console.log('\n✗ FCA-12 FAILED');
    process.exit(1);
  }
}

runUnicodeTest().catch(error => {
  console.error('Test execution error:', error);
  process.exit(1);
});
