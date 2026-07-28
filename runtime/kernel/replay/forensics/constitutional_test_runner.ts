/**
 * CONSTITUTIONAL TEST RUNNER
 * 
 * Harness for running P3 forensic tests (inventory/grep).
 * Generates reports without refactoring.
 * 
 * Usage:
 *   ts-node constitutional_test_runner.ts [test-id] [kernel-path]
 * 
 * Test IDs:
 *   15  - Entropy inventory (Date/Math.random/UUID)
 *   17  - Forbidden primitives (Buffer.allocUnsafe/WeakMap/etc)
 *   18  - Node-only primitives (Buffer/crypto/fs/process)
 *   all - Run all three
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  runP15EntropyInventory,
  runP17ForbiddenInventory,
  runP18NodeInventory,
  formatEntropyReport,
  formatForbiddenReport,
  formatNodeInventory
} from './constitutional_forensics';

interface TestConfig {
  testId: string;
  kernelPath: string;
  outputDir?: string;
  verbose?: boolean;
}

/**
 * Main test runner
 */
export async function runConstitutionalTests(config: TestConfig): Promise<void> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`CONSTITUTIONAL TEST RUNNER`);
  console.log(`${'='.repeat(70)}\n`);

  const { testId, kernelPath, outputDir = './reports', verbose = true } = config;

  // Validate kernel path
  if (!fs.existsSync(kernelPath)) {
    console.error(`✗ Kernel path not found: ${kernelPath}`);
    process.exit(1);
  }

  console.log(`Kernel path: ${kernelPath}`);
  console.log(`Output dir: ${outputDir}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Run requested tests
  if (testId === 'all' || testId === '15') {
    await runTest15(kernelPath, outputDir, verbose);
  }

  if (testId === 'all' || testId === '17') {
    await runTest17(kernelPath, outputDir, verbose);
  }

  if (testId === 'all' || testId === '18') {
    await runTest18(kernelPath, outputDir, verbose);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Reports saved to: ${path.resolve(outputDir)}`);
  console.log(`${'='.repeat(70)}\n`);
}

/**
 * Test 15: Entropy Inventory
 */
async function runTest15(
  kernelPath: string,
  outputDir: string,
  verbose: boolean
): Promise<void> {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`TEST 15: No Timestamp Entropy`);
  console.log(`${'─'.repeat(70)}\n`);

  const results = runP15EntropyInventory(kernelPath);
  const report = formatEntropyReport(results);

  const timestamp = new Date().toISOString().split('T')[0];
  const reportFile = path.join(outputDir, `test-15-entropy-${timestamp}.txt`);

  fs.writeFileSync(reportFile, report);

  if (verbose) {
    console.log(report);
  }

  console.log(`✓ Test 15 complete. Results: ${results.length} findings`);
  console.log(`  Report: ${reportFile}\n`);

  // Exit code 1 if violations found (for CI)
  if (results.length > 0) {
    process.exitCode = 1;
  }
}

/**
 * Test 17: Forbidden Primitives
 */
async function runTest17(
  kernelPath: string,
  outputDir: string,
  verbose: boolean
): Promise<void> {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`TEST 17: Forbidden Primitive Scanner`);
  console.log(`${'─'.repeat(70)}\n`);

  const results = runP17ForbiddenInventory(kernelPath);
  const report = formatForbiddenReport(results);

  const timestamp = new Date().toISOString().split('T')[0];
  const reportFile = path.join(outputDir, `test-17-forbidden-${timestamp}.txt`);

  fs.writeFileSync(reportFile, report);

  if (verbose) {
    console.log(report);
  }

  console.log(`✓ Test 17 complete. Results: ${results.length} findings`);
  console.log(`  Report: ${reportFile}\n`);

  // Exit code 1 if violations found (for CI)
  if (results.length > 0) {
    process.exitCode = 1;
  }
}

/**
 * Test 18: Node-Only Primitives Inventory
 */
async function runTest18(
  kernelPath: string,
  outputDir: string,
  verbose: boolean
): Promise<void> {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`TEST 18: Node-Only Primitive Inventory`);
  console.log(`${'─'.repeat(70)}\n`);

  const inventory = runP18NodeInventory(kernelPath);
  const report = formatNodeInventory(inventory);

  const timestamp = new Date().toISOString().split('T')[0];
  const reportFile = path.join(outputDir, `test-18-node-inventory-${timestamp}.txt`);
  const jsonFile = path.join(outputDir, `test-18-node-inventory-${timestamp}.json`);

  fs.writeFileSync(reportFile, report);
  fs.writeFileSync(jsonFile, JSON.stringify(inventory, null, 2));

  if (verbose) {
    console.log(report);
  }

  console.log(`✓ Test 18 complete.`);
  console.log(`  Text report: ${reportFile}`);
  console.log(`  JSON report: ${jsonFile}\n`);
}

/**
 * CLI Entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const testId = args[0] || 'all';
  const kernelPath = args[1] || './runtime/replay';

  runConstitutionalTests({
    testId,
    kernelPath,
    verbose: true
  }).catch(err => {
    console.error('✗ Test runner error:', err);
    process.exit(1);
  });
}

export default runConstitutionalTests;
