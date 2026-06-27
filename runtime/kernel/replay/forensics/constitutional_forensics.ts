/**
 * CONSTITUTIONAL FORENSICS UTILITIES
 * 
 * Grep-based inventory generation for P3 tests.
 * Supports Test 15, 17, 18 (entropy, forbidden primitives, Node-only inventories).
 * 
 * These are pure read-only scans — no refactoring.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Entropy Primitives
 * 
 * Test 15 result: Scan for Date/Math.random/UUID/hrtime
 */
export const ENTROPY_PRIMITIVES = [
  'Date.now()',
  'new Date()',
  'Math.random()',
  'crypto.randomUUID()',
  'process.hrtime()',
  'Math.random',
  'Date.now'
];

/**
 * Forbidden Primitives (non-deterministic)
 * 
 * Test 17 result: Scan for unsafe buffer/sorting operations
 */
export const FORBIDDEN_PRIMITIVES = [
  'Buffer.allocUnsafe',
  'Math.random',
  'WeakMap',
  'Object.keys(',  // Only flag if not followed by .sort()
  'localeCompare',
  'Intl.',
  'toLocaleString'
];

/**
 * Node-Only Primitives
 * 
 * Test 18 result: Inventory only (no assertions)
 */
export const NODE_ONLY_PRIMITIVES = [
  'Buffer',
  'crypto.createHash',
  'require(',
  'import(',
  'fs.',
  'process.env'
];

/**
 * Scan replay kernel for entropy usage
 * 
 * Returns: Array of { file, line, code, primitive }
 */
export function scanEntropyUsage(replayKernelPath: string): any[] {
  const results: any[] = [];

  const patterns = ENTROPY_PRIMITIVES.map(p => {
    // Escape regex special chars
    return p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('|');

  try {
    // Platform-agnostic: use TypeScript/Node directly instead of shell grep
    const files = findTypescriptFiles(replayKernelPath, { excludeTests: true });

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        ENTROPY_PRIMITIVES.forEach(primitive => {
          if (line.includes(primitive) && !line.trim().startsWith('//')) {
            results.push({
              file: path.relative(replayKernelPath, file),
              line: idx + 1,
              code: line.trim().substring(0, 100),
              primitive
            });
          }
        });
      });
    }
  } catch (err) {
    console.error('Error scanning entropy:', err);
  }

  return results;
}

/**
 * Scan replay kernel for forbidden primitives
 * 
 * Returns: Array of { file, line, code, primitive, severity }
 */
export function scanForbiddenPrimitives(replayKernelPath: string): any[] {
  const results: any[] = [];

  try {
    const files = findTypescriptFiles(replayKernelPath, { excludeTests: true });

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // Check Buffer.allocUnsafe
        if (line.includes('Buffer.allocUnsafe')) {
          results.push({
            file: path.relative(replayKernelPath, file),
            line: idx + 1,
            code: line.trim().substring(0, 100),
            primitive: 'Buffer.allocUnsafe',
            severity: 'CRITICAL',
            reason: 'Creates unpredictable buffer contents'
          });
        }

        // Check Math.random
        if (line.includes('Math.random')) {
          results.push({
            file: path.relative(replayKernelPath, file),
            line: idx + 1,
            code: line.trim().substring(0, 100),
            primitive: 'Math.random',
            severity: 'CRITICAL',
            reason: 'Non-deterministic'
          });
        }

        // Check WeakMap
        if (line.includes('WeakMap')) {
          results.push({
            file: path.relative(replayKernelPath, file),
            line: idx + 1,
            code: line.trim().substring(0, 100),
            primitive: 'WeakMap',
            severity: 'HIGH',
            reason: 'Iteration order undefined'
          });
        }

        // Check Object.keys without sort (conservative check)
        if (line.includes('Object.keys(') && !line.includes('.sort')) {
          results.push({
            file: path.relative(replayKernelPath, file),
            line: idx + 1,
            code: line.trim().substring(0, 100),
            primitive: 'Object.keys (unsorted)',
            severity: 'MEDIUM',
            reason: 'Insertion order dependent'
          });
        }

        // Check localeCompare
        if (line.includes('localeCompare')) {
          results.push({
            file: path.relative(replayKernelPath, file),
            line: idx + 1,
            code: line.trim().substring(0, 100),
            primitive: 'localeCompare',
            severity: 'HIGH',
            reason: 'Locale-dependent'
          });
        }

        // Check Intl
        if (line.includes('Intl.')) {
          results.push({
            file: path.relative(replayKernelPath, file),
            line: idx + 1,
            code: line.trim().substring(0, 100),
            primitive: 'Intl (locale-dependent)',
            severity: 'HIGH',
            reason: 'Locale and system dependent'
          });
        }
      });
    }
  } catch (err) {
    console.error('Error scanning forbidden primitives:', err);
  }

  return results;
}

/**
 * Inventory Node-only primitives (read-only report)
 * 
 * Returns: { primitiveType: count, locations: [...] }
 */
export function inventoryNodePrimitives(replayKernelPath: string): any {
  const inventory: any = {
    Buffer: { count: 0, files: new Set<string>() },
    crypto_createHash: { count: 0, files: new Set<string>() },
    require: { count: 0, files: new Set<string>() },
    dynamicImport: { count: 0, files: new Set<string>() },
    fs: { count: 0, files: new Set<string>() },
    process_env: { count: 0, files: new Set<string>() }
  };

  try {
    const files = findTypescriptFiles(replayKernelPath, { excludeTests: true });

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const relativePath = path.relative(replayKernelPath, file);

      lines.forEach(line => {
        if (line.includes('Buffer') && !line.includes('// ')) {
          inventory.Buffer.count++;
          inventory.Buffer.files.add(relativePath);
        }

        if (line.includes('crypto.createHash')) {
          inventory.crypto_createHash.count++;
          inventory.crypto_createHash.files.add(relativePath);
        }

        if (line.includes("require(") || line.includes('require(\'')) {
          inventory.require.count++;
          inventory.require.files.add(relativePath);
        }

        if (line.includes('import(')) {
          inventory.dynamicImport.count++;
          inventory.dynamicImport.files.add(relativePath);
        }

        if (line.includes('fs.') || line.includes('fs(')) {
          inventory.fs.count++;
          inventory.fs.files.add(relativePath);
        }

        if (line.includes('process.env')) {
          inventory.process_env.count++;
          inventory.process_env.files.add(relativePath);
        }
      });
    }

    // Convert sets to arrays for serialization
    Object.keys(inventory).forEach(key => {
      inventory[key].files = Array.from(inventory[key].files);
    });
  } catch (err) {
    console.error('Error inventorying Node primitives:', err);
  }

  return inventory;
}

/**
 * Helper: Find all TypeScript files in directory
 */
function findTypescriptFiles(
  dir: string,
  options: { excludeTests?: boolean; excludeDist?: boolean } = {}
): string[] {
  const files: string[] = [];

  function walk(currentPath: string) {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        // Skip excluded directories
        if (options.excludeTests && entry.isDirectory() && entry.name === '__tests__') {
          continue;
        }
        if (options.excludeDist && entry.isDirectory() && entry.name === 'dist') {
          continue;
        }
        if (entry.name.startsWith('.')) {
          continue;
        }

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      // Skip inaccessible directories
    }
  }

  walk(dir);
  return files;
}

/**
 * Format entropy results as readable report
 */
export function formatEntropyReport(results: any[]): string {
  if (results.length === 0) {
    return '✓ No entropy primitives detected';
  }

  let report = `⚠ Found ${results.length} entropy usages:\n\n`;
  const byFile = groupBy(results, r => r.file);

  Object.entries(byFile).forEach(([file, items]: [string, any]) => {
    report += `  ${file}:\n`;
    (items as any[]).forEach(item => {
      report += `    Line ${item.line}: ${item.primitive}\n`;
      report += `      ${item.code}\n`;
    });
  });

  return report;
}

/**
 * Format forbidden primitives results as readable report
 */
export function formatForbiddenReport(results: any[]): string {
  if (results.length === 0) {
    return '✓ No forbidden primitives detected';
  }

  let report = `⚠ Found ${results.length} forbidden primitives:\n\n`;
  
  const byFile = groupBy(results, r => r.file);
  Object.entries(byFile).forEach(([file, items]: [string, any]) => {
    report += `  ${file}:\n`;
    (items as any[]).forEach(item => {
      report += `    Line ${item.line}: [${item.severity}] ${item.primitive}\n`;
      report += `      Reason: ${item.reason}\n`;
      report += `      ${item.code}\n`;
    });
  });

  return report;
}

/**
 * Format node primitives as readable inventory report
 */
export function formatNodeInventory(inventory: any): string {
  let report = 'Node-Only Primitive Inventory\n';
  report += '==============================\n\n';

  Object.entries(inventory).forEach(([key, data]: [string, any]) => {
    const displayName = key.replace(/_/g, '.');
    report += `${displayName}: ${data.count} usages in ${data.files.length} files\n`;

    if (data.count > 0 && data.count <= 10) {
      data.files.forEach((file: string) => {
        report += `  - ${file}\n`;
      });
    } else if (data.count > 10) {
      const sample = data.files.slice(0, 5);
      sample.forEach((file: string) => {
        report += `  - ${file}\n`;
      });
      report += `  ... and ${data.files.length - 5} more files\n`;
    }
    report += '\n';
  });

  return report;
}

/**
 * Helper: Group array by function
 */
function groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  arr.forEach(item => {
    const key = fn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
  });
  return result;
}

/**
 * Export convenience functions for test integration
 */
export function runP15EntropyInventory(kernelPath: string) {
  const results = scanEntropyUsage(kernelPath);
  console.log(formatEntropyReport(results));
  return results;
}

export function runP17ForbiddenInventory(kernelPath: string) {
  const results = scanForbiddenPrimitives(kernelPath);
  console.log(formatForbiddenReport(results));
  return results;
}

export function runP18NodeInventory(kernelPath: string) {
  const inventory = inventoryNodePrimitives(kernelPath);
  console.log(formatNodeInventory(inventory));
  return inventory;
}
