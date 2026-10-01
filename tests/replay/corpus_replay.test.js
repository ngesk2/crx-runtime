'use strict';
/**
 * T4 replay gate as node:test — wraps the golden corpus verifier so the
 * replay tier runs inside the standard runner. See replay/corpus_verify.js
 * for the drift semantics.
 *
 * Falsifiability: WHAT INVARIANT? The engine reproduces the golden replay
 * vectors byte-for-byte. WHO OWNS IT? DeterministicReplayEngine. HOW CAN IT
 * FAIL? Engine behavior drift vs the recorded goldens. WHAT ATTACK DISPROVES
 * IT? Replay every corpus. WHAT EVIDENCE PROVES IT? Zero mismatches.
 * CAN IT BE REPLAYED? Yes — the corpora are fixtures. DOES THE FAILURE
 * BECOME PERMANENT REGRESSION KNOWLEDGE? Drift is recorded as a corpus
 * finding, not a BUG- property record (fixtures, not generative).
 * WHY NOT A NEW RUNNER? node:test wraps the existing verifier; nothing new.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { verifyOne } = require('./corpus_verify.js');

const CORPUS_DIR = path.join(__dirname, '..', 'corpus');

describe('replay golden corpus (T4)', () => {
  const files = fs.readdirSync(CORPUS_DIR).filter((f) => f.endsWith('.json')).sort();
  assert.ok(files.length > 0, 'corpus must not be empty');
  for (const f of files) {
    it(`corpus ${f} replays to its golden vectors`, () => {
      const r = verifyOne(path.join(CORPUS_DIR, f));
      assert.deepEqual(r.mismatches, [], `corpus drift in ${f}: ${JSON.stringify(r.mismatches)}`);
    });
  }
});
