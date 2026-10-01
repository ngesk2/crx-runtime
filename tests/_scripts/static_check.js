#!/usr/bin/env node
'use strict';
/**
 * T0 static gate: syntax-check every ladder JS file and require every
 * _support module without executing tests. Fast, deterministic, no I/O
 * beyond the repo tree.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const failures = [];

function jsFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...jsFiles(p));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

for (const f of jsFiles(ROOT)) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (err) {
    failures.push(`${path.relative(ROOT, f)}: ${String(err.stderr || err.message).split('\n')[0]}`);
  }
}

// Support modules must be requirable without side effects. fast-check may
// not be installed yet on a bare checkout; tolerate only that one absence.
for (const m of ['budget', 'pg_stub', 'regression', 'arbitraries']) {
  try {
    require(path.join(ROOT, '_support', m + '.js'));
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && /fast-check/.test(err.message)) {
      console.log(`  (warning: fast-check not installed yet; _support/${m}.js deferred)`);
      continue;
    }
    failures.push(`_support/${m}.js require failed: ${err.message}`);
  }
}

if (failures.length) {
  console.error('T0 static gate FAILED:');
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log(`T0 static gate PASSED (${jsFiles(ROOT).length} files syntax-checked, 4 support modules required).`);
