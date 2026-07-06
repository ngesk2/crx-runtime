/**
 * Constitutional CI Enforcement
 * 
 * Tier 2 — Constitutional Enforcement
 * 
 * Enforces constitutional architectural rules in CI using import graph analysis.
 * 
 * Architectural Rules:
 * 1. Canonical Layer cannot import Runtime
 * 2. Runtime may import Canonical
 * 3. Infrastructure cannot import Domain
 * 4. Domain may import Infrastructure
 * 5. No circular dependencies
 * 6. No hidden dependencies
 * 
 * Run this script in CI to enforce constitutional correctness.
 */

const fs = require('fs');
const path = require('path');

class ConstitutionalCICheck {
  constructor() {
    this._violations = [];
    this._warnings = [];
    this._importGraph = new Map();
  }

  /**
   * Run all constitutional checks
   * @param {string} directory - Directory to check
   * @returns {Object} Check results
   */
  async run(directory = '.') {
    console.log('Running Constitutional CI Checks...');
    console.log(`Directory: ${directory}\n`);

    // Build import graph
    this._buildImportGraph(directory);

    // Check 1: Architectural layer violations
    this._checkArchitecturalLayers();

    // Check 2: Circular dependencies
    this._checkCircularDependencies();

    // Check 3: Hidden dependencies
    this._checkHiddenDependencies();

    // Report results
    this._reportResults();

    return {
      violations: this._violations,
      warnings: this._warnings,
      passed: this._violations.length === 0
    };
  }

  /**
   * Build import graph
   * @param {string} directory - Directory to check
   */
  _buildImportGraph(directory) {
    console.log('Building import graph...');

    const files = this._getJavaScriptFiles(directory);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const imports = this._extractImports(content);
      this._importGraph.set(file, imports);
    }

    console.log(`  Processed ${files.length} files\n`);
  }

  /**
   * Extract imports from file content
   * @param {string} content - File content
   * @returns {Array} Import paths
   */
  _extractImports(content) {
    const imports = [];
    const lines = content.split('\n');

    lines.forEach(line => {
      // Match require() statements
      const match = line.match(/require\(['"](.+?)['"]\)/);
      if (match) {
        const importPath = match[1];
        // Only include local imports (not node_modules)
        if (!importPath.startsWith('.')) return;
        imports.push(importPath);
      }
    });

    return imports;
  }

  /**
   * Check architectural layer violations
   */
  _checkArchitecturalLayers() {
    console.log('Check 1: Architectural layer violations...');

    // Define architectural layers
    const layers = {
      'tier0_canstitutional': ['canonical_authority.js', 'identity_authority.js', 'witness_authority.js', 'replay_authority.js', 'constitutional_time_authority.js', 'deterministic_id_authority.js'],
      'tier1_domain': ['mission_authority.js', 'execution_authority.js', 'knowledge_authority.js', 'observation_authority.js', 'artifact_authority.js', 'capability_authority.js', 'governance_authority.js', 'failure_authority.js', 'policy_authority.js'],
      'tier2_ports': ['persistence_port.js', 'transaction_port.js', 'scheduler_port.js', 'messaging_port.js', 'worker_port.js', 'publication_port.js'],
      'tier3_runtime': ['server.js', 'constitutional_runtime.js', 'constitutional_autonomous_scheduler.js', 'mission_queue.js']
    };

    // Define allowed layer transitions
    const allowedTransitions = {
      'tier0_canstitutional': ['tier0_constitutional', 'tier1_domain'],
      'tier1_domain': ['tier0_constitutional', 'tier1_domain', 'tier2_ports'],
      'tier2_ports': ['tier0_constitutional', 'tier1_domain', 'tier2_ports'],
      'tier3_runtime': ['tier0_constitutional', 'tier1_domain', 'tier2_ports', 'tier3_runtime']
    };

    for (const [file, imports] of this._importGraph) {
      const fileName = path.basename(file);
      const currentLayer = this._getLayer(fileName, layers);

      if (!currentLayer) continue;

      for (const importPath of imports) {
        const importFileName = path.basename(importPath);
        const importLayer = this._getLayer(importFileName, layers);

        if (!importLayer) continue;

        // Check if transition is allowed
        const allowed = allowedTransitions[currentLayer];
        if (!allowed.includes(importLayer)) {
          this._violations.push({
            check: 'Architectural layer violation',
            file: file,
            import: importPath,
            message: `${fileName} (${currentLayer}) cannot import ${importFileName} (${importLayer})`,
            currentLayer: currentLayer,
            importLayer: importLayer
          });
        }
      }
    }

    console.log(`  Found ${this._violations.filter(v => v.check === 'Architectural layer violation').length} violations\n`);
  }

  /**
   * Check circular dependencies
   */
  _checkCircularDependencies() {
    console.log('Check 2: Circular dependencies...');

    const visited = new Set();
    const recursionStack = new Set();

    for (const file of this._importGraph.keys()) {
      if (!visited.has(file)) {
        this._detectCycle(file, visited, recursionStack, []);
      }
    }

    console.log(`  Found ${this._violations.filter(v => v.check === 'Circular dependency').length} violations\n`);
  }

  /**
   * Detect cycle in import graph
   * @param {string} file - Current file
   * @param {Set} visited - Visited files
   * @param {Set} recursionStack - Recursion stack
   * @param {Array} path - Current path
   */
  _detectCycle(file, visited, recursionStack, path) {
    visited.add(file);
    recursionStack.add(file);
    path.push(file);

    const imports = this._importGraph.get(file) || [];

    for (const importPath of imports) {
      const importFile = this._resolveImportPath(file, importPath);
      if (!importFile) continue;

      if (!visited.has(importFile)) {
        this._detectCycle(importFile, visited, recursionStack, [...path]);
      } else if (recursionStack.has(importFile)) {
        // Cycle detected
        const cycleIndex = path.indexOf(importFile);
        const cycle = path.slice(cycleIndex).concat(importFile);
        this._violations.push({
          check: 'Circular dependency',
          cycle: cycle,
          message: `Circular dependency detected: ${cycle.join(' → ')}`
        });
      }
    }

    recursionStack.delete(file);
    path.pop();
  }

  /**
   * Resolve import path to absolute path
   * @param {string} currentFile - Current file path
   * @param {string} importPath - Import path
   * @returns {string|null} Resolved path
   */
  _resolveImportPath(currentFile, importPath) {
    const currentDir = path.dirname(currentFile);
    const resolvedPath = path.resolve(currentDir, importPath);
    
    // Try .js extension
    if (fs.existsSync(resolvedPath + '.js')) {
      return resolvedPath + '.js';
    }
    
    // Try directory with index.js
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
      const indexPath = path.join(resolvedPath, 'index.js');
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }
    
    return null;
  }

  /**
   * Check hidden dependencies
   */
  _checkHiddenDependencies() {
    console.log('Check 3: Hidden dependencies...');

    // Check for direct database access outside ports
    for (const [file, imports] of this._importGraph) {
      const fileName = path.basename(file);
      
      // Skip port files
      if (fileName.includes('_port.js')) continue;
      
      // Check for direct database access
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('pg.query') || content.includes('client.query')) {
        this._violations.push({
          check: 'Hidden dependency',
          file: file,
          message: 'Direct database access found outside port',
          type: 'database'
        });
      }
    }

    console.log(`  Found ${this._violations.filter(v => v.check === 'Hidden dependency').length} violations\n`);
  }

  /**
   * Get layer for file
   * @param {string} fileName - File name
   * @param {Object} layers - Layer definitions
   * @returns {string|null} Layer name
   */
  _getLayer(fileName, layers) {
    for (const [layer, files] of Object.entries(layers)) {
      if (files.includes(fileName)) {
        return layer;
      }
    }
    return null;
  }

  /**
   * Get all JavaScript files in directory
   * @param {string} directory - Directory to search
   * @returns {Array} File paths
   */
  _getJavaScriptFiles(directory) {
    const files = [];

    const walk = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules
          if (item !== 'node_modules' && item !== '.git') {
            walk(fullPath);
          }
        } else if (item.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    };

    walk(directory);
    return files;
  }

  /**
   * Report results
   */
  _reportResults() {
    console.log('\n=== Constitutional CI Check Results ===\n');

    if (this._violations.length === 0 && this._warnings.length === 0) {
      console.log('✅ All checks passed!');
    } else {
      if (this._violations.length > 0) {
        console.log(`❌ ${this._violations.length} violations found:\n`);
        this._violations.forEach((violation, index) => {
          console.log(`${index + 1}. ${violation.check}`);
          console.log(`   File: ${violation.file}`);
          if (violation.import) console.log(`   Import: ${violation.import}`);
          if (violation.currentLayer) console.log(`   Layer: ${violation.currentLayer} → ${violation.importLayer}`);
          if (violation.cycle) console.log(`   Cycle: ${violation.cycle.join(' → ')}`);
          console.log(`   Message: ${violation.message}`);
          console.log();
        });
      }

      if (this._warnings.length > 0) {
        console.log(`⚠️  ${this._warnings.length} warnings found:\n`);
        this._warnings.forEach((warning, index) => {
          console.log(`${index + 1}. ${warning.check}`);
          console.log(`   File: ${warning.file}`);
          console.log(`   Message: ${warning.message}`);
          console.log();
        });
      }
    }

    console.log('=== End of Results ===\n');
  }
}

// Run checks if executed directly
if (require.main === module) {
  const check = new ConstitutionalCICheck();
  const directory = process.argv[2] || '.';
  check.run(directory).then((results) => {
    process.exit(results.passed ? 0 : 1);
  }).catch((error) => {
    console.error('Error running constitutional checks:', error);
    process.exit(1);
  });
}

module.exports = ConstitutionalCICheck;
