/**
 * Authority Purity Audit
 * 
 * Ω.86 — Authority Purity Audit
 * 
 * Verify every authority is a pure compiler:
 * - No cross-authority access
 * - No mutation of constitutional objects after admission
 * - Replayable from inputs alone
 */

const fs = require('fs').promises;
const path = require('path');

class AuthorityPurityAudit {
  constructor(gatewayPath) {
    this._gatewayPath = gatewayPath;
    this._violations = [];
    this._warnings = [];
    this._passes = [];
  }

  /**
   * Run authority purity audit
   * 
   * @returns {Object} Audit results
   */
  async audit() {
    console.log('[AuthorityPurityAudit] Starting authority purity audit...');

    const authorityFiles = await this._findAuthorityFiles();
    
    for (const authorityFile of authorityFiles) {
      await this._auditAuthority(authorityFile);
    }

    const results = {
      violations: this._violations,
      warnings: this._warnings,
      passes: this._passes,
      summary: this._generateSummary(),
    };

    console.log('[AuthorityPurityAudit] Audit complete');
    return results;
  }

  /**
   * Find all authority files
   * 
   * @returns {Array} Array of authority file paths
   */
  async _findAuthorityFiles() {
    const authorityFiles = [];
    const files = await fs.readdir(this._gatewayPath);
    
    for (const file of files) {
      if (file.endsWith('_authority.js') && file !== 'constitutional_authority.js') {
        authorityFiles.push(path.join(this._gatewayPath, file));
      }
    }

    return authorityFiles;
  }

  /**
   * Audit a single authority
   * 
   * @param {string} authorityPath - Path to authority file
   */
  async _auditAuthority(authorityPath) {
    const authorityName = path.basename(authorityPath, '.js');
    console.log(`[AuthorityPurityAudit] Auditing: ${authorityName}`);

    const content = await fs.readFile(authorityPath, 'utf-8');

    // Check for cross-authority access
    this._checkCrossAuthorityAccess(authorityName, content);

    // Check for constitutional object mutation
    this._checkConstitutionalMutation(authorityName, content);

    // Check for replayability
    this._checkReplayability(authorityName, content);

    // Check for pure compiler pattern
    this._checkPureCompilerPattern(authorityName, content);
  }

  /**
   * Check for cross-authority access
   * 
   * @param {string} authorityName - Authority name
   * @param {string} content - File content
   */
  _checkCrossAuthorityAccess(authorityName, content) {
    // CanonicalAuthority is a utility class, not an authority - allow it
    const canonicalAuthorityPattern = /require\(['"]\.\/canonical_authority['"]\)/g;
    const canonicalAuthorityMatches = content.match(canonicalAuthorityPattern);
    if (canonicalAuthorityMatches) {
      // CanonicalAuthority is a utility class - not a violation
    }

    // MissionRuleAuthority is allowed to be used by MissionAuthority
    const missionRulePattern = /require\(['"]\.\/mission_rule_authority['"]\)/g;
    const missionRuleMatches = content.match(missionRulePattern);
    if (missionRuleMatches && authorityName === 'mission_authority') {
      // MissionRuleAuthority is intentionally used by MissionAuthority - not a violation
    }

    // Patterns that indicate cross-authority access (excluding allowed cases)
    const forbiddenPatterns = [
      /this\._\w*Authority\./g,  // Accessing another authority's internals
      /get\w*Authority\(\)/g,   // Getting another authority instance
    ];

    let hasAllowedAccess = false;
    let hasForbiddenAccess = false;

    for (const pattern of forbiddenPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Allow MissionRuleAuthority to be used by MissionAuthority (policy dependency)
          if (authorityName === 'mission_authority' && 
              (match.includes('MissionRuleAuthority') || match.includes('missionRuleAuthority'))) {
            hasAllowedAccess = true;
            continue;
          }
          
          // Allow CanonicalGraphCompiler to be used by CanonicalGraphAuthority (compiler dependency)
          if (authorityName === 'canonical_graph_authority' && 
              (match.includes('CanonicalGraphCompiler') || match.includes('canonicalGraphCompiler'))) {
            hasAllowedAccess = true;
            continue;
          }

          // Allow MultiLanguageParser to be used by ParserAuthority (parser dependency)
          if (authorityName === 'parser_authority' && 
              (match.includes('MultiLanguageParser') || match.includes('multiLanguageParser'))) {
            hasAllowedAccess = true;
            continue;
          }

          // Allow CanonicalSymbolMapper to be used by CanonicalSymbolAuthority (mapper dependency)
          if (authorityName === 'canonical_symbol_authority' && 
              (match.includes('CanonicalSymbolMapper') || match.includes('canonicalSymbolMapper'))) {
            hasAllowedAccess = true;
            continue;
          }

          hasForbiddenAccess = true;
          this._violations.push({
            authority: authorityName,
            type: 'cross_authority_access',
            message: `Cross-authority access detected: ${match}`,
            severity: 'high',
          });
        }
      }
    }

    if (!hasForbiddenAccess) {
      this._passes.push({
        authority: authorityName,
        type: 'cross_authority_access',
        message: hasAllowedAccess ? 'Only allowed dependency access detected' : 'No cross-authority access detected',
      });
    }
  }

  /**
   * Check for constitutional object mutation
   * 
   * @param {string} authorityName - Authority name
   * @param {string} content - File content
   */
  _checkConstitutionalMutation(authorityName, content) {
    // Split content into lines for context-aware checking
    const lines = content.split('\n');
    const violations = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const prevLine = i > 0 ? lines[i - 1] : '';
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';

      // Check for payload.field = pattern (exclude comparisons like ===, ==, !=, !==)
      const payloadMatch = line.match(/payload\.(\w+)\s*=(?!=)/);
      if (payloadMatch) {
        // Allow if it's in a create method or object literal
        const isCreateMethod = line.includes('create') || prevLine.includes('create') || nextLine.includes('create');
        const isObjectLiteral = line.includes('{') || prevLine.includes('{') || nextLine.includes('{');
        const isConstLet = line.includes('const ') || line.includes('let ') || line.includes('var ');

        if (!isCreateMethod && !isObjectLiteral && !isConstLet) {
          violations.push({
            line: i + 1,
            match: payloadMatch[0],
          });
        }
      }

      // Check for constitutional_object.field = pattern (exclude comparisons)
      const objectMatch = line.match(/constitutional_object\.(\w+)\s*=(?!=)/);
      if (objectMatch) {
        const isCreateMethod = line.includes('create') || prevLine.includes('create') || nextLine.includes('create');
        const isConstLet = line.includes('const ') || line.includes('let ') || line.includes('var ');

        if (!isCreateMethod && !isConstLet) {
          violations.push({
            line: i + 1,
            match: objectMatch[0],
          });
        }
      }
    }

    for (const violation of violations) {
      this._violations.push({
        authority: authorityName,
        type: 'constitutional_mutation',
        message: `Constitutional object mutation detected at line ${violation.line}: ${violation.match}`,
        severity: 'high',
      });
    }

    if (violations.length === 0) {
      this._passes.push({
        authority: authorityName,
        type: 'constitutional_mutation',
        message: 'No constitutional object mutation detected',
      });
    }
  }

  /**
   * Check for replayability
   * 
   * @param {string} authorityName - Authority name
   * @param {string} content - File content
   */
  _checkReplayability(authorityName, content) {
    // Check for compile method that takes inputs
    const hasCompileMethod = content.match(/async compile\(/);
    
    if (!hasCompileMethod) {
      this._warnings.push({
        authority: authorityName,
        type: 'replayability',
        message: 'No compile method found - may not be replayable',
        severity: 'medium',
      });
      return;
    }

    // Check for external dependencies that could affect determinism
    const nonDeterministicPatterns = [
      /Date\.now\(\)/g,  // Current time
      /Math\.random\(\)/g,  // Random numbers
      /process\.env\./g,  // Environment variables (except GATEWAY_NAME)
      /fs\.writeFile/g,  // File writes (side effects)
    ];

    for (const pattern of nonDeterministicPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Allow process.env.GATEWAY_NAME
          if (match.includes('GATEWAY_NAME')) {
            continue;
          }

          this._warnings.push({
            authority: authorityName,
            type: 'replayability',
            message: `Non-deterministic pattern detected: ${match}`,
            severity: 'medium',
          });
        }
      }
    }

    if (!content.match(/Date\.now\(\)/g) && !content.match(/Math\.random\(\)/g)) {
      this._passes.push({
        authority: authorityName,
        type: 'replayability',
        message: 'No obvious non-deterministic patterns detected',
      });
    }
  }

  /**
   * Check for pure compiler pattern
   * 
   * @param {string} authorityName - Authority name
   * @param {string} content - File content
   */
  _checkPureCompilerPattern(authorityName, content) {
    // Check that authority uses ConstitutionalObjectFactory
    const usesFactory = content.includes('ConstitutionalObjectFactory');
    
    if (!usesFactory) {
      this._warnings.push({
        authority: authorityName,
        type: 'pure_compiler',
        message: 'Does not use ConstitutionalObjectFactory',
        severity: 'low',
      });
    } else {
      this._passes.push({
        authority: authorityName,
        type: 'pure_compiler',
        message: 'Uses ConstitutionalObjectFactory',
      });
    }

    // Check that authority wraps in OperationalEnvelope
    const usesEnvelope = content.includes('OperationalEnvelope.wrap');
    
    if (!usesEnvelope) {
      this._warnings.push({
        authority: authorityName,
        type: 'pure_compiler',
        message: 'Does not wrap in OperationalEnvelope',
        severity: 'low',
      });
    } else {
      this._passes.push({
        authority: authorityName,
        type: 'pure_compiler',
        message: 'Wraps in OperationalEnvelope',
      });
    }

    // Check that authority registers with ObjectRegistry
    const usesRegistry = content.includes('objectRegistry.register');
    
    if (!usesRegistry) {
      this._warnings.push({
        authority: authorityName,
        type: 'pure_compiler',
        message: 'Does not register with ObjectRegistry',
        severity: 'low',
      });
    } else {
      this._passes.push({
        authority: authorityName,
        type: 'pure_compiler',
        message: 'Registers with ObjectRegistry',
      });
    }
  }

  /**
   * Generate audit summary
   * 
   * @returns {Object} Summary
   */
  _generateSummary() {
    return {
      total_authorities: this._violations.length + this._warnings.length + this._passes.length,
      violations: this._violations.length,
      warnings: this._warnings.length,
      passes: this._passes.length,
      purity_score: this._computePurityScore(),
    };
  }

  /**
   * Compute purity score
   * 
   * @returns {number} Purity score (0-10)
   */
  _computePurityScore() {
    const totalChecks = this._violations.length + this._warnings.length + this._passes.length;
    if (totalChecks === 0) return 10;

    const weightedViolations = this._violations.length * 10;
    const weightedWarnings = this._warnings.length * 3;
    const weightedTotal = weightedViolations + weightedWarnings;
    const maxWeighted = totalChecks * 10;

    const score = Math.max(0, 10 - (weightedTotal / maxWeighted) * 10);
    return Math.round(score * 10) / 10;
  }

  /**
   * Print audit results
   * 
   * @param {Object} results - Audit results
   */
  printResults(results) {
    console.log('\n=== Authority Purity Audit Results ===');
    console.log(`Total Authorities: ${results.summary.total_authorities}`);
    console.log(`Violations: ${results.summary.violations}`);
    console.log(`Warnings: ${results.summary.warnings}`);
    console.log(`Passes: ${results.summary.passes}`);
    console.log(`Purity Score: ${results.summary.purity_score}/10`);

    if (results.violations.length > 0) {
      console.log('\n=== Violations ===');
      for (const violation of results.violations) {
        console.log(`[${violation.authority}] ${violation.type}: ${violation.message}`);
      }
    }

    if (results.warnings.length > 0) {
      console.log('\n=== Warnings ===');
      for (const warning of results.warnings) {
        console.log(`[${warning.authority}] ${warning.type}: ${warning.message}`);
      }
    }

    if (results.passes.length > 0) {
      console.log('\n=== Passes ===');
      for (const pass of results.passes) {
        console.log(`[${pass.authority}] ${pass.type}: ${pass.message}`);
      }
    }
  }
}

module.exports = { AuthorityPurityAudit };
