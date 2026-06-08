"use strict";
/**
 * FCA-11: Constitutional Vector Generation
 *
 * Generates frozen constitutional vectors from corpus files.
 * These vectors become immutable reference values for certification.
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
async function generateConstitutionalVectors() {
    console.log('FCA-11: Generating Constitutional Vectors\n');
    const corpusFiles = [
        'minimal_replay.json',
        'multi_event_replay.json',
        'lineage_replay.json',
        'violation_replay.json',
        'unicode_replay.json'
    ];
    const engine = new deterministic_replay_engine_1.DeterministicReplayEngine();
    for (const corpusFile of corpusFiles) {
        const corpusPath = path.join(__dirname, '../corpus', corpusFile);
        const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));
        console.log(`Processing: ${corpus.name}`);
        const events = corpus.event_stream.map((e) => new canonical_event_envelope_1.CanonicalEventEnvelope(e));
        const eventStream = new replay_event_stream_1.ReplayEventStream(events);
        const result = engine.replay(eventStream);
        // Freeze constitutional vectors
        corpus.expected_vectors = {
            canonical_bytes: result.canonical_bytes.bytes,
            fingerprint: result.fingerprint.hash,
            witness_root: result.witness_root.witness_root,
            leaf_count: result.witness_root.leaf_count,
            tree_height: result.witness_root.tree_height,
            state_version: result.state_version,
            artifact_count: result.artifact_count
        };
        // Write frozen corpus
        fs.writeFileSync(corpusPath, JSON.stringify(corpus, null, 2));
        console.log(`  canonical_bytes: ${result.canonical_bytes.bytes.substring(0, 32)}...`);
        console.log(`  fingerprint: ${result.fingerprint.hash}`);
        console.log(`  witness_root: ${result.witness_root.witness_root}`);
        console.log(`  leaf_count: ${result.witness_root.leaf_count}`);
        console.log(`  tree_height: ${result.witness_root.tree_height}`);
        console.log(`  state_version: ${result.state_version}`);
        console.log(`  artifact_count: ${result.artifact_count}`);
        console.log(`  ✓ Frozen\n`);
    }
    console.log('='.repeat(50));
    console.log('FCA-11 COMPLETE: Constitutional vectors frozen');
    console.log('='.repeat(50));
}
generateConstitutionalVectors().catch(error => {
    console.error('Vector generation error:', error);
    process.exit(1);
});
