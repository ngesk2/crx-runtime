'use strict';
/**
 * Regression corpus writer + schema validator.
 *
 * Every minimized generative failure becomes a permanent record under
 * tests/regression/generated/BUG-XXXX-<slug>.json carrying:
 *   regression_id, property, seed, path, ping_commit, minimal_counterexample,
 *   expected_invariant, original_failure, test_owner, recorded_at, status.
 *
 * KNOWLEDGE MUST COMPOUND: a red property run that is not recorded here is
 * a lesson the system will pay to re-learn.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const GENERATED_DIR = path.join(__dirname, '..', 'regression', 'generated');

const REQUIRED_FIELDS = [
  'regression_id', 'property', 'seed', 'path', 'ping_commit',
  'minimal_counterexample', 'expected_invariant', 'original_failure',
  'test_owner', 'recorded_at', 'status',
];

function validateRecord(rec) {
  const missing = REQUIRED_FIELDS.filter((f) => !(f in rec));
  if (missing.length) throw new Error(`regression record missing fields: ${missing.join(', ')}`);
  if (!/^BUG-\d{4}-[a-z0-9-]+$/.test(rec.regression_id)) {
    throw new Error(`regression_id must match BUG-NNNN-<slug>: ${rec.regression_id}`);
  }
  if (!['open', 'fixed'].includes(rec.status)) {
    throw new Error(`status must be open|fixed, got ${rec.status}`);
  }
  return true;
}

function nextId() {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  const ids = fs.readdirSync(GENERATED_DIR)
    .map((f) => (/^BUG-(\d{4})-/.exec(f) || [])[1])
    .filter(Boolean)
    .map(Number);
  return String((ids.length ? Math.max(...ids) : 0) + 1).padStart(4, '0');
}

function pingCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.join(__dirname, '..', '..'), stdio: 'pipe' })
      .toString().trim();
  } catch {
    return 'UNKNOWN';
  }
}

// Dedupe: the same minimized failure (property + seed + path + counterexample)
// is ONE regression, not one per run. A re-run that finds the identical open
// failure returns the existing record instead of minting a new id.
// (Semantic duplicates are the JEV COUNTEREXAMPLE_CLASS SEMANTIC DUPLICATE;
// the ledger itself must not manufacture them.)
function findDuplicate({ property, seed, fcPath, counterexample }) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  const target = JSON.stringify({ property, seed: seed == null ? null : Number(seed), fcPath, counterexample });
  for (const f of fs.readdirSync(GENERATED_DIR)) {
    if (f.includes('BUG-0000')) continue;
    try {
      const rec = JSON.parse(fs.readFileSync(path.join(GENERATED_DIR, f), 'utf8'));
      if (rec.status !== 'open') continue;
      const cand = JSON.stringify({
        property: rec.property,
        seed: rec.seed,
        fcPath: rec.path,
        counterexample: rec.minimal_counterexample,
      });
      if (cand === target) return path.join(GENERATED_DIR, f);
    } catch { /* unreadable record: ignore */ }
  }
  return null;
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'case';
}

/**
 * Record a minimized failure. Returns the file path written.
 */
function recordFailure({ property, seed, fcPath, counterexample, expectedInvariant, originalFailure, testOwner = 'ping-constitutional-ladder' }) {
  const dup = findDuplicate({ property, seed, fcPath, counterexample });
  if (dup) return dup;
  const id = nextId();
  const slug = slugify(property);
  const regressionId = `BUG-${id}-${slug}`;
  const rec = {
    regression_id: regressionId,
    property,
    seed: seed == null ? null : Number(seed),
    path: fcPath == null ? null : String(fcPath),
    ping_commit: pingCommit(),
    minimal_counterexample: counterexample,
    expected_invariant: expectedInvariant,
    original_failure: String(originalFailure).slice(0, 4000),
    test_owner: testOwner,
    recorded_at: new Date().toISOString(),
    status: 'open',
  };
  validateRecord(rec);
  const file = path.join(GENERATED_DIR, `${regressionId}.json`);
  fs.writeFileSync(file, JSON.stringify(rec, null, 2) + '\n');
  return file;
}

/**
 * Wrap an fc.assert call: on failure, record the minimized counterexample
 * into the regression corpus, then rethrow so the test still goes red.
 */
function withRegressionLedger({ property, expectedInvariant, testOwner }, seed, runAssert) {
  try {
    const out = runAssert();
    if (out && typeof out.then === 'function') {
      return out.catch((err) => { throw ledgerThrow({ property, expectedInvariant, testOwner }, seed, err); });
    }
    return out;
  } catch (err) {
    throw ledgerThrow({ property, expectedInvariant, testOwner }, seed, err);
  }
}

function ledgerThrow(meta, seed, err) {
  const file = recordFailure({
    property: meta.property,
    seed,
    fcPath: extractPath(err),
    counterexample: extractCounterexample(err),
    expectedInvariant: meta.expectedInvariant,
    originalFailure: err && err.message,
    testOwner: meta.testOwner,
  });
  err.message = `${err.message}\n[regression] recorded as ${path.basename(file)}`;
  return err;
}

function extractPath(err) {
  const m = /path:?\s*"?([0-9:]+)"?/i.exec(err && err.message || '');
  return m ? m[1] : null;
}

function extractCounterexample(err) {
  const msg = String((err && err.message) || '');
  // fast-check prints "Counterexample: <json>" followed by a blank line and
  // "Shrunk N time(s)". Capture the bracket-balanced JSON array.
  const start = msg.indexOf('Counterexample:');
  if (start >= 0) {
    const open = msg.indexOf('[', start);
    if (open >= 0) {
      let depth = 0, inStr = false, esc = false;
      for (let i = open; i < msg.length && i < open + 4000; i++) {
        const ch = msg[i];
        if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; }
        else if (ch === '"') inStr = true;
        else if (ch === '[') depth++;
        else if (ch === ']') { depth--; if (depth === 0) { try { return JSON.parse(msg.slice(open, i + 1)); } catch { return msg.slice(open, i + 1); } } }
      }
    }
  }
  return msg.slice(0, 2000);
}

module.exports = {
  GENERATED_DIR, REQUIRED_FIELDS, validateRecord, recordFailure, withRegressionLedger, pingCommit,
};
