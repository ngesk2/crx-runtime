/**
 * Qdrant Access Sovereignty Test
 *
 * Guards the convergence: exactly ONE module on the gateway's enforced
 * request path may construct a Qdrant client — gateway/qdrant_access_authority.js.
 *
 * The test statically resolves the require() closure from gateway/server.js
 * (the live container's entrypoint: `node gateway/server.js`) and scans every
 * reachable module for direct client construction. Any second construction
 * site on the enforced path fails the test.
 *
 * Modules off the enforced path (dead code, harnesses, tests) are out of
 * scope by design; they cannot serve live traffic.
 *
 * Run: node gateway/test_qdrant_access_sovereignty.js
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SERVER_ENTRY = path.join(REPO_ROOT, 'gateway', 'server.js');
const AUTHORITY_REL = 'gateway/qdrant_access_authority.js';
const CONSTRUCT_RE = /new\s+QdrantClient\s*\(/g;

function stripComments(src) {
  // Remove block comments, then line comments. Order matters.
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^\S\n])\/\/.*$/gm, '$1');
}

function resolveRequire(fromFile, spec) {
  if (!spec.startsWith('.')) return null; // external module: out of scope
  const base = path.dirname(fromFile);
  const candidates = [
    path.resolve(base, spec),
    path.resolve(base, spec + '.js'),
    path.join(path.resolve(base, spec), 'index.js'),
  ];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) || null;
}

function collectReachable(entry) {
  const seen = new Set();
  const stack = [entry];
  const requireRe = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  while (stack.length) {
    const mod = stack.pop();
    if (seen.has(mod)) continue;
    seen.add(mod);
    let src;
    try {
      src = fs.readFileSync(mod, 'utf-8');
    } catch {
      continue;
    }
    let m;
    requireRe.lastIndex = 0;
    while ((m = requireRe.exec(src))) {
      const resolved = resolveRequire(mod, m[1]);
      if (resolved && !seen.has(resolved)) stack.push(resolved);
    }
  }
  return seen;
}

function countConstructions(file) {
  const src = stripComments(fs.readFileSync(file, 'utf-8'));
  const hits = src.match(CONSTRUCT_RE);
  return hits ? hits.length : 0;
}

let failures = 0;
function fail(msg) {
  console.log(`  FAIL: ${msg}`);
  failures += 1;
}

console.log('=== Qdrant Access Sovereignty ===\n');

const reachable = collectReachable(SERVER_ENTRY);
console.log(`Enforced-path modules scanned: ${reachable.size}`);

const authorityAbs = path.join(REPO_ROOT, AUTHORITY_REL);

// 1. The authority module must exist and contain exactly one construction.
if (!fs.existsSync(authorityAbs)) {
  fail(`authority module missing: ${AUTHORITY_REL}`);
} else {
  const n = countConstructions(authorityAbs);
  if (n !== 1) {
    fail(`${AUTHORITY_REL} constructs QdrantClient ${n} times (expected exactly 1)`);
  } else {
    console.log(`  OK: ${AUTHORITY_REL} is the single construction site`);
  }
}

// 2. No other enforced-path module may construct a Qdrant client.
let violations = 0;
for (const mod of [...reachable].sort()) {
  if (mod === authorityAbs) continue;
  if (!mod.endsWith('.js')) continue;
  const n = countConstructions(mod);
  if (n > 0) {
    violations += 1;
    fail(`${path.relative(REPO_ROOT, mod)} constructs QdrantClient ${n}x on the enforced path`);
  }
}
if (violations === 0) {
  console.log('  OK: no other enforced-path module constructs a Qdrant client');
}

console.log(`\n=== Result: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failure(s)) ===`);
process.exit(failures === 0 ? 0 : 1);
