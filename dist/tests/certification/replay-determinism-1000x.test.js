"use strict";
/**
 * FCA-12: 1000x Determinism Test
 *
 * Verifies that replay produces identical results across 1000 executions.
 * Expected: 1000/1000 witness matches
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const replay_event_stream_1 = require("../../runtime/replay/replay_event_stream");
const canonical_event_envelope_1 = require("../../runtime/replay/canonical_event_envelope");
const deterministic_replay_engine_1 = require("../../runtime/replay/deterministic_replay_engine");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function run1000xDeterminismTest() {
    console.log('FCA-12: 1000x Determinism Test\n');
    const corpusFiles = [
        'minimal_replay.json',
        'multi_event_replay.json',
        'lineage_replay.json',
        'unicode_replay.json'
    ];
    let totalMatches = 0;
    let totalTests = 0;
    for (const corpusFile of corpusFiles) {
        const corpusPath = path.join(__dirname, '../corpus', corpusFile);
        const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));
        console.log(`Testing corpus: ${corpus.name}`);
        const events = corpus.event_stream.map((e) => new canonical_event_envelope_1.CanonicalEventEnvelope(e));
        const eventStream = new replay_event_stream_1.ReplayEventStream(events);
        const engine = new deterministic_replay_engine_1.DeterministicReplayEngine();
        // Run 1000 times
        const results = [];
        for (let i = 0; i < 1000; i++) {
            const result = engine.replay(eventStream);
            results.push(result);
        }
        // Verify all results are identical
        const firstResult = results[0];
        let matches = 0;
        for (let i = 1; i < results.length; i++) {
            if (results[i].witness_root.witness_root === firstResult.witness_root.witness_root &&
                results[i].witness_root.leaf_count === firstResult.witness_root.leaf_count &&
                results[i].witness_root.tree_height === firstResult.witness_root.tree_height) {
                matches++;
            }
        }
        totalTests += 1000;
        totalMatches += matches + 1; // +1 for the first result
        console.log(`  Matches: ${matches + 1}/1000`);
        if (matches === 999) {
            console.log(`  ✓ PASSED\n`);
        }
        else {
            console.log(`  ✗ FAILED\n`);
        }
    }
    console.log('='.repeat(50));
    console.log(`Total matches: ${totalMatches}/${totalTests}`);
    console.log('='.repeat(50));
    if (totalMatches === totalTests) {
        console.log('\n✓ FCA-12 PASSED: 1000/1000 witness matches');
        process.exit(0);
    }
    else {
        console.log('\n✗ FCA-12 FAILED');
        process.exit(1);
    }
}
run1000xDeterminismTest().catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
});
