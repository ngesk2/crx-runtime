#!/usr/bin/env node
'use strict';
/**
 * T4 replay gate — golden corpus verification.
 *
 * Replays every tests/corpus/*.json event_stream through the current
 * DeterministicReplayEngine and compares the snapshot against the golden
 * expected_vectors (canonical_bytes, fingerprint, witness_root,
 * state_version, artifact_count).
 *
 * A mismatch is CORPUS DRIFT, not a test bug: the golden vectors are the
 * recorded truth of a previous engine version. Drift fails the gate and
 * must be dispositioned explicitly (regenerate the corpus under a recorded
 * decision, or fix the engine) — never silently updated.
 *
 * Usage: node replay/corpus_verify.js [--json]
 * Exit 0 when all corpora verify; exit 1 on any mismatch or replay error.
 */
const fs = require('node:fs');
const path = require('node:path');

const { ReplayEventStream } = require('../../gateway/replay/kernel/replay_event_stream.js');
const { CanonicalEventEnvelope } = require('../../gateway/replay/kernel/canonical_event_envelope.js');
const { DeterministicReplayEngine } = require('../../gateway/replay/kernel/deterministic_replay_engine.js');
const { CanonicalBytes } = require('../../ping-runtime/authorities/canonical_authority.js');

const CORPUS_DIR = path.join(__dirname, '..', 'corpus');

// Golden vector semantics (established 2026-09-30 against the engine):
//   canonical_bytes = base64(CanonicalBytes.serialize(event_stream))
//       — the golden records the canonical form of its own input stream.
//   fingerprint     = engine snapshot fingerprint.hash ('sha256:...').
//   witness_root    = engine witness_root.witness_root (hex) — with
//                     leaf_count / tree_height cross-checked.
//   state_version / artifact_count = engine snapshot scalars.
function verifyOne(file) {
  const corpus = JSON.parse(fs.readFileSync(file, 'utf8'));
  const expected = corpus.expected_vectors || {};
  const mismatches = [];

  // 1. Fixture self-consistency: the golden canonical_bytes must be the
  // canonical form of the fixture's own event stream. (Goldens are stored
  // as unpadded base64; normalize before comparing.)
  const recomputed = CanonicalBytes.serialize(corpus.event_stream).toString('base64').replace(/=+$/, '');
  const goldenNorm = String(expected.canonical_bytes || '').replace(/=+$/, '');
  if (expected.canonical_bytes !== undefined && goldenNorm !== recomputed) {
    mismatches.push({ key: 'canonical_bytes', expected: String(expected.canonical_bytes).slice(0, 80), actual: recomputed.slice(0, 80) });
  }

  // 2. Engine vs golden: the current engine must reproduce the recorded
  // snapshot vectors.
  const envelopes = corpus.event_stream.map((d) => new CanonicalEventEnvelope(d));
  const engine = new DeterministicReplayEngine();
  const result = engine.replay(new ReplayEventStream(envelopes));
  const actual = {
    fingerprint: result.fingerprint && result.fingerprint.hash,
    witness_root: result.witness_root && result.witness_root.witness_root,
    leaf_count: result.witness_root && result.witness_root.leaf_count,
    tree_height: result.witness_root && result.witness_root.tree_height,
    state_version: result.state_version,
    artifact_count: result.artifact_count,
  };
  for (const k of ['fingerprint', 'witness_root', 'leaf_count', 'tree_height', 'state_version', 'artifact_count']) {
    if (expected[k] !== undefined && String(expected[k]) !== String(actual[k])) {
      mismatches.push({ key: k, expected: String(expected[k]).slice(0, 120), actual: String(actual[k]).slice(0, 120) });
    }
  }
  return { name: corpus.name || path.basename(file), mismatches, events: envelopes.length };
}

function main() {
  const asJson = process.argv.includes('--json');
  const files = fs.readdirSync(CORPUS_DIR).filter((f) => f.endsWith('.json')).sort();
  const results = files.map((f) => {
    try {
      return { file: f, ...verifyOne(path.join(CORPUS_DIR, f)), error: null };
    } catch (err) {
      return { file: f, name: f, mismatches: [], events: 0, error: err.message };
    }
  });
  const failed = results.filter((r) => r.error || r.mismatches.length);
  if (asJson) {
    console.log(JSON.stringify({ ok: failed.length === 0, results }, null, 2));
  } else {
    for (const r of results) {
      const status = r.error ? `ERROR: ${r.error}` : r.mismatches.length ? `DRIFT: ${r.mismatches.map((m) => m.key).join(',')}` : 'OK';
      console.log(`  [${status}] ${r.file} (${r.events} events)`);
    }
    console.log(failed.length === 0
      ? `corpus verify PASSED (${results.length} corpora)`
      : `corpus verify FAILED (${failed.length}/${results.length} corpora drifted or errored)`);
  }
  process.exit(failed.length ? 1 : 0);
}

if (require.main === module) main();
module.exports = { verifyOne };
