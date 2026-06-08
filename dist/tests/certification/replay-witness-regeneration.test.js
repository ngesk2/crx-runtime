"use strict";
/**
 * FCA-12: Witness Regeneration Test
 *
 * Verifies that witness roots can be regenerated from stored replay results.
 * Expected: 0 witness regeneration failures
 */
Object.defineProperty(exports, "__esModule", { value: true });
const replay_event_stream_1 = require("../../runtime/replay/replay_event_stream");
const canonical_event_envelope_1 = require("../../runtime/replay/canonical_event_envelope");
const deterministic_replay_engine_1 = require("../../runtime/replay/deterministic_replay_engine");
const witness_authority_1 = require("../../runtime/replay/witness_authority");
const invariant_runner_1 = require("../../runtime/replay/invariant_runner");
async function runWitnessRegenerationTest() {
    console.log('FCA-12: Witness Regeneration Test\n');
    const event = new canonical_event_envelope_1.CanonicalEventEnvelope({
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
    const eventStream = new replay_event_stream_1.ReplayEventStream([event]);
    const engine = new deterministic_replay_engine_1.DeterministicReplayEngine();
    const result = engine.replay(eventStream);
    // Regenerate witness from stored result
    const witnessAuthority = new witness_authority_1.WitnessAuthority();
    const invariantRunner = new invariant_runner_1.InvariantRunner();
    const state = result.state;
    const regeneratedWitness = witnessAuthority.generateWitness(eventStream, invariantRunner, state);
    let failures = 0;
    if (regeneratedWitness.witness_root !== result.witness_root.witness_root) {
        console.log('✗ FAILED: Regenerated witness root does not match original');
        failures++;
    }
    if (regeneratedWitness.leaf_count !== result.witness_root.leaf_count) {
        console.log('✗ FAILED: Regenerated leaf count does not match original');
        failures++;
    }
    if (regeneratedWitness.tree_height !== result.witness_root.tree_height) {
        console.log('✗ FAILED: Regenerated tree height does not match original');
        failures++;
    }
    console.log(`Witness regeneration failures: ${failures}`);
    if (failures === 0) {
        console.log('\n✓ FCA-12 PASSED: 0 witness regeneration failures');
        process.exit(0);
    }
    else {
        console.log('\n✗ FCA-12 FAILED');
        process.exit(1);
    }
}
runWitnessRegenerationTest().catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
});
