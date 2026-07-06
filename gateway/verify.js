#!/usr/bin/env node

/**
 * Verification Harness
 * 
 * One command to answer: Can this repository be trusted?
 * 
 * Usage:
 *   node verify.js all
 *   node verify.js 00_repository
 *   node verify.js 01_build
 *   ...
 *   node verify.js 12_end_to_end
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VERIFICATION_SCRIPTS = [
  '00_repository',
  '01_build',
  '02_typescript',
  '03_python',
  '04_containers',
  '05_database',
  '06_gateway',
  '07_workers',
  '08_authorities',
  '09_replay',
  '10_pipeline',
  '11_ollama',
  '12_end_to_end'
];

function runVerification(scriptName) {
  const scriptPath = path.join(__dirname, 'verify', `${scriptName}.js`);
  
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Verification script not found: ${scriptPath}`);
    return { success: false, error: 'Script not found' };
  }

  try {
    const output = execSync(`node ${scriptPath}`, { 
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      exitCode: error.status
    };
  }
}

function printHeader() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           CONSTITUTIONAL VERIFICATION HARNESS                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
}

function printResults(results) {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                      VERIFICATION RESULTS                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const [script, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`✅ ${script}`);
      passed++;
    } else if (result.skipped) {
      console.log(`⏭️  ${script} (skipped)`);
      skipped++;
    } else {
      console.log(`❌ ${script}`);
      failed++;
    }
  }

  console.log('');
  console.log(`Total: ${passed + failed + skipped}`);
  process.stdout.write(`Passed: ${passed} `);
  process.stdout.write(`Failed: ${failed} `);
  process.stdout.write(`Skipped: ${skipped}`);
  console.log('');
  console.log('');

  if (failed > 0) {
    console.log('❌ VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('✅ VERIFICATION PASSED');
    process.exit(0);
  }
}

function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'all';

  printHeader();

  const results = {};

  if (target === 'all') {
    for (const script of VERIFICATION_SCRIPTS) {
      console.log(`Running: ${script}`);
      results[script] = runVerification(script);
      console.log('');
    }
  } else {
    if (VERIFICATION_SCRIPTS.includes(target)) {
      console.log(`Running: ${target}`);
      results[target] = runVerification(target);
    } else {
      console.error(`Unknown verification: ${target}`);
      console.error(`Available verifications: ${VERIFICATION_SCRIPTS.join(', ')}`);
      process.exit(1);
    }
  }

  printResults(results);
}

main();
