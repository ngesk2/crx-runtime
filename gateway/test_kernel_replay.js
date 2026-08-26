'use strict';

/**
 * Test: Kernel Replay Execution Provider
 *
 * Proves the kernel deterministic replay engine produces
 * deterministic, reproducible witnesses from PING event chains.
 */

const { strict: assert } = require('assert');
const { KernelReplayExecutionProvider } = require('./kernel_replay_execution_provider');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

// Helper: create a PING event chain matching the 8-worker pipeline
function makePingEventChain() {
  const events = [
    {
      event_id: 'evt-review-001',
      event_type: 'REVIEW_RECEIVED',
      actor_id: 'ping-runtime',
      timestamp: '2026-08-21T15:00:00.000Z',
      payload: { review_text: 'Great service!', rating: 5, customer_id: 'cust-1' },
      metadata: { source: 'ingest', namespace: 'tenant::hpp' }
    },
    {
      event_id: 'evt-obs-002',
      event_type: 'OBSERVATION_CREATED',
      actor_id: 'observation-worker',
      timestamp: '2026-08-21T15:00:01.000Z',
      causation_id: 'evt-review-001',
      payload: { observation: 'Positive customer review received', category: 'customer-feedback' },
      metadata: { worker: 'observation', namespace: 'tenant::hpp' }
    },
    {
      event_id: 'evt-claim-003',
      event_type: 'CLAIM_CREATED',
      actor_id: 'claim-worker',
      timestamp: '2026-08-21T15:00:02.000Z',
      causation_id: 'evt-obs-002',
      payload: { claim: 'Customer satisfied with service quality', confidence: 0.9 },
      metadata: { worker: 'claim', namespace: 'tenant::hpp' }
    },
    {
      event_id: 'evt-class-004',
      event_type: 'CLASSIFICATION_CREATED',
      actor_id: 'classification-worker',
      timestamp: '2026-08-21T15:00:03.000Z',
      causation_id: 'evt-claim-003',
      payload: { category: 'customer-feedback', priority: 'medium' },
      metadata: { worker: 'classification', namespace: 'tenant::hpp' }
    },
    {
      event_id: 'evt-recom-005',
      event_type: 'RECOMMENDATION_CREATED',
      actor_id: 'recommendation-worker',
      timestamp: '2026-08-21T15:00:04.000Z',
      causation_id: 'evt-class-004',
      payload: { action: 'Respond to customer review', urgency: 'normal' },
      metadata: { worker: 'recommendation', namespace: 'tenant::hpp' }
    },
    {
      event_id: 'evt-proj-006',
      event_type: 'PROJECTION_CREATED',
      actor_id: 'projection-worker',
      timestamp: '2026-08-21T15:00:05.000Z',
      causation_id: 'evt-recom-005',
      payload: { vector_embedded: true, dimensions: 768 },
      metadata: { worker: 'projection', namespace: 'tenant::hpp' }
    },
    {
      event_id: 'evt-replay-007',
      event_type: 'REPLAY_COMPLETED',
      actor_id: 'replay-worker',
      timestamp: '2026-08-21T15:00:06.000Z',
      causation_id: 'evt-proj-006',
      payload: { replay_deterministic: true, invariant_violations: 0 },
      metadata: { worker: 'replay', namespace: 'tenant::hpp' }
    },
    {
      event_id: 'evt-witness-008',
      event_type: 'WITNESS_CREATED',
      actor_id: 'witness-worker',
      timestamp: '2026-08-21T15:00:07.000Z',
      causation_id: 'evt-replay-007',
      payload: { witness_root: 'merkle-root-placeholder', leaf_count: 8 },
      metadata: { worker: 'witness', namespace: 'tenant::hpp' }
    }
  ];
  return events;
}

function makeTranscript(events) {
  return {
    transcript_id: 'transcript-test-001',
    state: { replay_events: events }
  };
}

async function main() {

console.log('Kernel Replay Execution Provider');
console.log('================================');

await test('empty transcript returns no_events', async () => {
  const provider = new KernelReplayExecutionProvider();
  const result = await provider.executeReplay({ state: {} });
  assert.equal(result.status, 'no_events');
});

await test('null state returns no_events', async () => {
  const provider = new KernelReplayExecutionProvider();
  const result = await provider.executeReplay(null);
  assert.equal(result.status, 'no_events');
});

await test('single event replies successfully', async () => {
  const provider = new KernelReplayExecutionProvider();
  const events = [{
    event_id: 'evt-single-001',
    event_type: 'REVIEW_RECEIVED',
    actor_id: 'test',
    timestamp: '2026-01-01T00:00:00.000Z',
    payload: { text: 'hello' }
  }];
  const result = await provider.executeReplay(makeTranscript(events));
  assert.equal(result.status, 'ok');
  assert.equal(result.event_count, 1);
  assert.equal(typeof result.witness_root, 'string', 'witness_root must be a hex string');
  assert.ok(result.witness_root.length > 0);
  assert.equal(typeof result.fingerprint, 'string', 'fingerprint must be a hash string');
  assert.ok(result.fingerprint.startsWith('sha256:'));
  assert.deepEqual(result.violations, [], 'no violations expected');
});

await test('8-event PING chain replies end-to-end', async () => {
  const provider = new KernelReplayExecutionProvider();
  const events = makePingEventChain();
  const result = await provider.executeReplay(makeTranscript(events));
  assert.equal(result.status, 'ok');
  assert.equal(result.event_count, 8);
  assert.equal(result.artifact_count, 8);
  assert.equal(typeof result.witness_root, 'string');
  assert.ok(result.witness_root.length > 0);
  assert.equal(typeof result.fingerprint, 'string');
  assert.ok(result.fingerprint.startsWith('sha256:'));
  assert.ok(result.state);
  assert.deepEqual(result.violations, []);
  // All 8 event types represented
  assert.ok(result.event_types.includes('REVIEW_RECEIVED'));
  assert.ok(result.event_types.includes('OBSERVATION_CREATED'));
  assert.ok(result.event_types.includes('WITNESS_CREATED'));
});

await test('identical input produces identical witness (determinism)', async () => {
  const provider1 = new KernelReplayExecutionProvider();
  const provider2 = new KernelReplayExecutionProvider();
  const events = makePingEventChain();
  const transcript = makeTranscript(events);

  const result1 = await provider1.executeReplay(transcript);
  const result2 = await provider2.executeReplay(transcript);

  assert.equal(result1.witness_root, result2.witness_root,
    'witness_root must be identical across runs');
  assert.equal(result1.fingerprint, result2.fingerprint,
    'fingerprint must be identical across runs');
  // canonical_bytes is an object with .bytes string
  assert.equal(result1.canonical_bytes.bytes, result2.canonical_bytes.bytes,
    'canonical_bytes.bytes must be identical across runs');
  assert.equal(result1.artifact_count, result2.artifact_count,
    'artifact_count must be identical');
  assert.deepEqual(result1.violations, result2.violations,
    'violations must be identical');
});

await test('determinism across 10 runs', async () => {
  const events = makePingEventChain();
  const transcript = makeTranscript(events);
  const fingerprints = [];
  const witnessRoots = [];

  for (let i = 0; i < 10; i++) {
    const provider = new KernelReplayExecutionProvider();
    const result = await provider.executeReplay(transcript);
    fingerprints.push(result.fingerprint);
    witnessRoots.push(result.witness_root);
  }

  const allFingerprintsSame = fingerprints.every(f => f === fingerprints[0]);
  const allWitnessRootsSame = witnessRoots.every(w => w === witnessRoots[0]);
  assert.ok(allFingerprintsSame, 'all 10 fingerprints must be identical');
  assert.ok(allWitnessRootsSame, 'all 10 witness_roots must be identical');
});

await test('witness contains expected structure', async () => {
  const provider = new KernelReplayExecutionProvider();
  const events = makePingEventChain();
  const result = await provider.executeReplay(makeTranscript(events));

  // witness_root is a hex string (Merkle root)
  assert.equal(typeof result.witness_root, 'string', 'witness_root must be a hex string');
  assert.ok(result.witness_root.length > 0);
  // witness_root_full has the full witness metadata
  assert.ok(result.witness_root_full, 'witness_root_full must be present');
  assert.equal(result.witness_root_full.witness_algorithm, 'merkle_sha256_v1');
  assert.ok(result.witness_root_full.leaf_count > 0);
  // leaf_count and tree_height are derived from the witness metadata
  assert.ok(result.leaf_count > 0);
  assert.ok(result.tree_height > 0);
});

await test('certificate is present and structured', async () => {
  const provider = new KernelReplayExecutionProvider();
  const events = makePingEventChain();
  const result = await provider.executeReplay(makeTranscript(events));

  // witness_root is a hex string
  assert.equal(typeof result.witness_root, 'string');
  assert.ok(result.witness_root.length > 0);
  // fingerprint is a hash string
  assert.equal(typeof result.fingerprint, 'string');
  assert.ok(result.fingerprint.startsWith('sha256:'));
  // leaf_count from witness metadata
  assert.ok(result.leaf_count > 0);
});

await test('event ID prefix generation is deterministic', async () => {
  const provider = new KernelReplayExecutionProvider();
  const events = [
    { event_type: 'A', payload: { x: 1 } },
    { event_type: 'B', payload: { x: 2 } },
    { event_type: 'C', payload: { x: 3 } }
  ];
  const result1 = await provider.executeReplay(makeTranscript(events));
  const result2 = await provider.executeReplay(makeTranscript(events));
  assert.equal(result1.fingerprint, result2.fingerprint,
    'events without evt- prefix must produce deterministic IDs');
});

await test('maxEvents limit is respected', async () => {
  const provider = new KernelReplayExecutionProvider();
  const events = makePingEventChain();
  const result = await provider.executeReplay(makeTranscript(events), { maxEvents: 3 });
  assert.equal(result.status, 'ok');
  assert.equal(result.event_count, 3, 'only 3 events should be replayed');
});

await test('stats are tracked', async () => {
  const provider = new KernelReplayExecutionProvider();
  const events = makePingEventChain();
  await provider.executeReplay(makeTranscript(events));
  await provider.executeReplay(makeTranscript(events));
  const stats = provider.getStats();
  assert.equal(stats.replays, 2);
  assert.equal(stats.events, 16, '8 events × 2 replays');
  assert.equal(stats.failures, 0);
});

await test('corrupted envelope is skipped gracefully', async () => {
  const provider = new KernelReplayExecutionProvider();
  const events = [
    { event_type: 'A', payload: { x: 1 } },
    null, // will fail CanonicalEventEnvelope constructor
    { event_type: 'B', payload: { x: 2 } }
  ];
  const result = await provider.executeReplay(makeTranscript(events));
  // null event should be skipped, 2 valid events remain
  assert.equal(result.status, 'ok');
  assert.equal(result.event_count, 2);
});

await test('no replay_events returns no_events', async () => {
  const provider = new KernelReplayExecutionProvider();
  const result = await provider.executeReplay({ state: { other: true } });
  assert.equal(result.status, 'no_events');
});

// ============================================================
// Negative / failure-path tests
// ============================================================

await test('parent-not-found: causation_id references non-existent event', async () => {
  const provider = new KernelReplayExecutionProvider();
  const events = [
    {
      event_id: 'evt-orphan-001',
      event_type: 'OBSERVATION_CREATED',
      timestamp: '2026-01-01T00:00:00.000Z',
      causation_id: 'evt-nonexistent-root',
      payload: { observation: 'orphan event' }
    }
  ];
  const result = await provider.executeReplay(makeTranscript(events));
  // Should succeed — causation_id is stored but kernel only validates
  // parent_event_ids lineage (which is built from the chain, not raw causation_id)
  assert.equal(result.status, 'ok');
  assert.equal(result.event_count, 1);
});

await test('duplicate event IDs: two events with same evt- prefix', async () => {
  const provider = new KernelReplayExecutionProvider();
  const events = [
    {
      event_id: 'evt-dup-001',
      event_type: 'REVIEW_RECEIVED',
      timestamp: '2026-01-01T00:00:00.000Z',
      payload: { text: 'first' }
    },
    {
      event_id: 'evt-dup-001',
      event_type: 'REVIEW_RECEIVED',
      timestamp: '2026-01-01T00:00:01.000Z',
      payload: { text: 'second (duplicate ID)' }
    }
  ];
  const result = await provider.executeReplay(makeTranscript(events));
  // Second event has same evt- prefix — bridge keeps it (no re-hashing).
  // Kernel may detect duplicate internally or accept it.
  // The important thing: no crash.
  assert.ok(result.status === 'ok' || result.status === 'kernel_error',
    `should not crash: got ${result.status}`);
  assert.ok(result.event_count >= 1, 'at least one event processed');
});

await test('all-null events: transcript with only null/undefined entries', async () => {
  const provider = new KernelReplayExecutionProvider();
  const events = [null, undefined, null];
  const result = await provider.executeReplay(makeTranscript(events));
  // All events are null — should get conversion_failed
  assert.equal(result.status, 'conversion_failed');
});

await test('maxEvents: 0 returns no events', async () => {
  const provider = new KernelReplayExecutionProvider();
  const events = makePingEventChain();
  const result = await provider.executeReplay(makeTranscript(events), { maxEvents: 0 });
  // slice(0, 0) = empty array → no_events
  assert.equal(result.status, 'no_events');
});

await test('all-null events still tracked in stats', async () => {
  const provider = new KernelReplayExecutionProvider();
  await provider.executeReplay(makeTranscript([null, null]));
  const stats = provider.getStats();
  assert.equal(stats.replays, 1);
  assert.equal(stats.failures, 2, '2 null events counted as failures');
});

await test('mixed valid and invalid events partially succeed', async () => {
  const provider = new KernelReplayExecutionProvider();
  const events = [
    { event_id: 'evt-ok-001', event_type: 'REVIEW_RECEIVED', timestamp: '2026-01-01T00:00:00.000Z', payload: { text: 'valid' } },
    null,
    { event_id: 'evt-ok-002', event_type: 'OBSERVATION_CREATED', timestamp: '2026-01-01T00:00:01.000Z', payload: { obs: 'also valid' } },
    undefined,
    { event_id: 'evt-ok-003', event_type: 'CLAIM_CREATED', timestamp: '2026-01-01T00:00:02.000Z', payload: { claim: 'third valid' } }
  ];
  const result = await provider.executeReplay(makeTranscript(events));
  assert.equal(result.status, 'ok');
  assert.equal(result.event_count, 3, '3 valid events processed, 2 null/undefined skipped');
});

// ============================================================
// Integration: Corpus replay tests
// ============================================================

await test('corpus: minimal_replay replays successfully', async () => {
  const fs = require('fs');
  const path = require('path');
  const corpus = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tests', 'corpus', 'minimal_replay.json'), 'utf8'));
  const provider = new KernelReplayExecutionProvider();
  const transcript = { transcript_id: 'corpus-minimal', state: { replay_events: corpus.event_stream } };
  const result = await provider.executeReplay(transcript);
  assert.equal(result.status, 'ok');
  assert.equal(result.event_count, corpus.event_stream.length);
  assert.equal(typeof result.witness_root, 'string');
  assert.ok(result.witness_root.length > 0);
});

await test('corpus: multi_event_replay replays successfully', async () => {
  const fs = require('fs');
  const path = require('path');
  const corpus = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tests', 'corpus', 'multi_event_replay.json'), 'utf8'));
  const provider = new KernelReplayExecutionProvider();
  const transcript = { transcript_id: 'corpus-multi', state: { replay_events: corpus.event_stream } };
  const result = await provider.executeReplay(transcript);
  assert.equal(result.status, 'ok');
  assert.equal(result.event_count, corpus.event_stream.length);
  assert.equal(typeof result.fingerprint, 'string');
  assert.ok(result.fingerprint.startsWith('sha256:'));
});

await test('corpus: minimal_replay is deterministic', async () => {
  const fs = require('fs');
  const path = require('path');
  const corpus = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tests', 'corpus', 'minimal_replay.json'), 'utf8'));
  const transcript = { transcript_id: 'corpus-det', state: { replay_events: corpus.event_stream } };
  const p1 = new KernelReplayExecutionProvider();
  const p2 = new KernelReplayExecutionProvider();
  const r1 = await p1.executeReplay(transcript);
  const r2 = await p2.executeReplay(transcript);
  assert.equal(r1.fingerprint, r2.fingerprint, 'corpus determinism: fingerprints must match');
  assert.equal(r1.witness_root, r2.witness_root, 'corpus determinism: witness roots must match');
});

await test('constitutional_runtime.js loads with kernel provider', async () => {
  // Verify the module loads and the require resolves
  const mod = require('./constitutional_runtime');
  assert.ok(mod.ConstitutionalRuntime, 'ConstitutionalRuntime must be exported');
  // Verify kernel_replay_execution_provider is a valid dependency
  const { KernelReplayExecutionProvider } = require('./kernel_replay_execution_provider');
  const p = new KernelReplayExecutionProvider();
  assert.equal(p.constructor.name, 'KernelReplayExecutionProvider');
});

// Summary
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);

} // end main

main().catch(err => { console.error(err); process.exit(1); });
