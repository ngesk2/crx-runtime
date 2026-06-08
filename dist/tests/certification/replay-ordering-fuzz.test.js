"use strict";
/**
 * FCA-12: Ordering Fuzz Test
 *
 * Verifies deterministic ordering by testing events with different insertion orders.
 * Expected: 0 ordering failures
 */
Object.defineProperty(exports, "__esModule", { value: true });
const replay_event_stream_1 = require("../../runtime/replay/replay_event_stream");
const canonical_event_envelope_1 = require("../../runtime/replay/canonical_event_envelope");
const deterministic_replay_engine_1 = require("../../runtime/replay/deterministic_replay_engine");
async function runOrderingFuzzTest() {
    console.log('FCA-12: Ordering Fuzz Test\n');
    // Create events in different orders
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
    const engine = new deterministic_replay_engine_1.DeterministicReplayEngine();
    let failures = 0;
    // Test different insertion orders
    const permutations = [
        [0, 1, 2],
        [2, 1, 0],
        [1, 0, 2],
        [0, 2, 1],
        [1, 2, 0],
        [2, 0, 1]
    ];
    const witnessRoots = [];
    for (const perm of permutations) {
        const events = perm.map(i => new canonical_event_envelope_1.CanonicalEventEnvelope(eventDefinitions[i]));
        const eventStream = new replay_event_stream_1.ReplayEventStream(events);
        const result = engine.replay(eventStream);
        witnessRoots.push(result.witness_root.witness_root);
    }
    // All witness roots should be identical regardless of insertion order
    const firstRoot = witnessRoots[0];
    for (let i = 1; i < witnessRoots.length; i++) {
        if (witnessRoots[i] !== firstRoot) {
            failures++;
        }
    }
    console.log(`Ordering failures: ${failures}/${permutations.length}`);
    if (failures === 0) {
        console.log('\n✓ FCA-12 PASSED: 0 ordering failures');
        process.exit(0);
    }
    else {
        console.log('\n✗ FCA-12 FAILED');
        process.exit(1);
    }
}
runOrderingFuzzTest().catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
});
