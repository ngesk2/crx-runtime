/**
 * Projector Validator
 * 
 * Priority 5: Projector Constitution
 * 
 * Constitutional Constraint:
 * Event Stream → Projection → Canonical Projection
 * 
 * Must produce identical canonical projection regardless of:
 * - insertion order
 * - batching
 * - async execution
 * 
 * Projectors must be:
 * - Deterministic
 * - Order-independent
 * - Idempotent
 * - Pure functions
 */

class ProjectorValidator {
  constructor() {
    this._validatorVersion = '1.0.0';
    this._forbiddenPatterns = [
      // Ordering dependencies
      /forEach\(/g,
      /for\s*\(\s*let\s+\w+\s+of\s+/g,
      /for\s*\(\s*var\s+\w+\s+of\s+/g,
      /for\s*\(\s*const\s+\w+\s+of\s+/g,
      
      // Async ordering issues
      /Promise\.all\(/g,
      /Promise\.race\(/g,
      /await\s+forEach/g,
      
      // Non-deterministic operations
      /Math\.random\(\)/g,
      /Date\.now\(\)/g,
      /new Date\(\)/g,
      
      // Mutable state
      /let\s+\w+\s*=/g,
      /var\s+\w+\s*=/g,
      /\w+\s*\+=\s*/g,
      /\w+\s*-=\s*/g,
      /\w+\s*\+\+/g,
      /\w+\s*--/g,
      /\.push\(/g,
      /\.pop\(\)/g,
      /\.shift\(\)/g,
      /\.unshift\(\)/g,
      /\.splice\(/g
    ];
  }

  /**
   * Validate projector function
   * @param {Function} projectorFn - Projector function to validate
   * @param {string} projectorId - Projector identifier
   * @returns {Object} Validation result
   */
  validateProjector(projectorFn, projectorId) {
    const projectorCode = this._extractProjectorCode(projectorFn);
    const violations = this._detectViolations(projectorCode);
    
    return {
      valid: violations.length === 0,
      projector_id: projectorId,
      violations: violations,
      validator_version: this._validatorVersion
    };
  }

  /**
   * Extract projector source code
   * @param {Function} projectorFn - Projector function
   * @returns {string} Source code
   * @private
   */
  _extractProjectorCode(projectorFn) {
    return projectorFn.toString();
  }

  /**
   * Detect violations in projector code
   * @param {string} code - Projector source code
   * @returns {Array} Array of violations
   * @private
   */
  _detectViolations(code) {
    const violations = [];
    
    for (const pattern of this._forbiddenPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        violations.push({
          pattern: pattern.source,
          count: matches.length,
          category: this._categorizePattern(pattern.source)
        });
      }
    }
    
    return violations;
  }

  /**
   * Categorize violation pattern
   * @param {string} pattern - Pattern source
   * @returns {string} Category
   * @private
   */
  _categorizePattern(pattern) {
    if (pattern.includes('forEach') || pattern.includes('for') || pattern.includes('Promise')) {
      return 'ordering_dependency';
    }
    if (pattern.includes('random') || pattern.includes('Date')) {
      return 'non_deterministic';
    }
    if (pattern.includes('let') || pattern.includes('var') || pattern.includes('+=') || pattern.includes('-=') || pattern.includes('push') || pattern.includes('pop')) {
      return 'mutable_state';
    }
    return 'unknown';
  }

  /**
   * Validate projector signature
   * @param {Function} projectorFn - Projector function
   * @returns {Object} Signature validation result
   */
  validateSignature(projectorFn) {
    const code = projectorFn.toString();
    
    // Check if function takes exactly 1 parameter (event stream)
    const paramMatch = code.match(/function\s*\(([^)]*)\)/) || code.match(/\(([^)]*)\)\s*=>/);
    if (!paramMatch) {
      return {
        valid: false,
        reason: 'Could not extract function signature'
      };
    }
    
    const params = paramMatch[1].split(',').map(p => p.trim());
    
    if (params.length !== 1) {
      return {
        valid: false,
        reason: `Projector must take exactly 1 parameter (event stream), got ${params.length}`
      };
    }
    
    return {
      valid: true,
      parameters: params
    };
  }

  /**
   * Test projector determinism
   * @param {Function} projectorFn - Projector function
   * @param {Array} events - Test events
   * @returns {Object} Determinism test result
   */
  testDeterminism(projectorFn, events) {
    // Run projector multiple times with different orderings
    const results = [];
    
    // Original order
    results.push(projectorFn([...events]));
    
    // Reverse order
    results.push(projectorFn([...events].reverse()));
    
    // Random order
    const shuffled = [...events].sort(() => Math.random() - 0.5);
    results.push(projectorFn(shuffled));
    
    // Check if all results are identical
    const firstResult = JSON.stringify(results[0]);
    const allIdentical = results.every(r => JSON.stringify(r) === firstResult);
    
    return {
      deterministic: allIdentical,
      results: results,
      test_count: results.length
    };
  }

  /**
   * Get validator version
   * @returns {string} Validator version
   */
  getValidatorVersion() {
    return this._validatorVersion;
  }
}

// Singleton instance
const projectorValidator = new ProjectorValidator();

module.exports = {
  ProjectorValidator,
  projectorValidator
};
