/**
 * Reducer Validator
 * 
 * Priority 4: Reducer Constitution
 * 
 * Constitutional Constraint:
 * Every reducer must satisfy:
 * State × Event → Pure Function → Canonical State
 * 
 * Absolutely forbidden inside reducers:
 * - random
 * - time
 * - IO
 * - filesystem
 * - database
 * - network
 * - mutable globals
 */

class ReducerValidator {
  constructor() {
    this._validatorVersion = '1.0.0';
    this._forbiddenPatterns = [
      // Random
      /Math\.random\(\)/g,
      /crypto\.random/g,
      
      // Time
      /Date\.now\(\)/g,
      /new Date\(\)/g,
      /performance\.now\(\)/g,
      /process\.hrtime\(\)/g,
      /setTimeout\(/g,
      /setInterval\(/g,
      /setImmediate\(/g,
      
      // IO
      /require\(['"]fs['"]\)/g,
      /require\(['"]fs\/promises['"]\)/g,
      /require\(['"]child_process['"]\)/g,
      /require\(['"]net['"]\)/g,
      /require\(['"]http['"]\)/g,
      /require\(['"]https['"]\)/g,
      /require\(['"]tls['"]\)/g,
      /require\(['"]dgram['"]\)/g,
      
      // Filesystem
      /fs\.read/g,
      /fs\.write/g,
      /fs\.open/g,
      /fs\.stat/g,
      /fs\.exists/g,
      
      // Database
      /require\(['"]pg['"]\)/g,
      /require\(['"]mysql['"]\)/g,
      /require\(['"]mongodb['"]\)/g,
      /require\(['"]redis['"]\)/g,
      /require\(['"]sqlite3['"]\)/g,
      
      // Network
      /fetch\(/g,
      /axios\./g,
      /XMLHttpRequest/g,
      /WebSocket/g,
      
      // Mutable globals (basic detection)
      /global\./g,
      /process\.env\./g,
      /__dirname/g,
      /__filename/g
    ];
  }

  /**
   * Validate reducer function
   * @param {Function} reducerFn - Reducer function to validate
   * @param {string} reducerId - Reducer identifier
   * @returns {Object} Validation result
   */
  validateReducer(reducerFn, reducerId) {
    const reducerCode = this._extractReducerCode(reducerFn);
    const violations = this._detectViolations(reducerCode);
    
    return {
      valid: violations.length === 0,
      reducer_id: reducerId,
      violations: violations,
      validator_version: this._validatorVersion
    };
  }

  /**
   * Extract reducer source code
   * @param {Function} reducerFn - Reducer function
   * @returns {string} Source code
   * @private
   */
  _extractReducerCode(reducerFn) {
    return reducerFn.toString();
  }

  /**
   * Detect violations in reducer code
   * @param {string} code - Reducer source code
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
    if (pattern.includes('random') || pattern.includes('crypto')) {
      return 'random';
    }
    if (pattern.includes('Date') || pattern.includes('time') || pattern.includes('setTimeout') || pattern.includes('setInterval')) {
      return 'time';
    }
    if (pattern.includes('fs') || pattern.includes('child_process')) {
      return 'filesystem';
    }
    if (pattern.includes('pg') || pattern.includes('mysql') || pattern.includes('mongodb') || pattern.includes('redis') || pattern.includes('sqlite')) {
      return 'database';
    }
    if (pattern.includes('net') || pattern.includes('http') || pattern.includes('https') || pattern.includes('fetch') || pattern.includes('axios')) {
      return 'network';
    }
    if (pattern.includes('global') || pattern.includes('process.env') || pattern.includes('__dirname') || pattern.includes('__filename')) {
      return 'mutable_globals';
    }
    return 'unknown';
  }

  /**
   * Validate reducer signature
   * @param {Function} reducerFn - Reducer function
   * @returns {Object} Signature validation result
   */
  validateSignature(reducerFn) {
    const code = reducerFn.toString();
    
    // Check if function takes exactly 2 parameters (state, event)
    const paramMatch = code.match(/function\s*\(([^)]*)\)/) || code.match(/\(([^)]*)\)\s*=>/);
    if (!paramMatch) {
      return {
        valid: false,
        reason: 'Could not extract function signature'
      };
    }
    
    const params = paramMatch[1].split(',').map(p => p.trim());
    
    if (params.length !== 2) {
      return {
        valid: false,
        reason: `Reducer must take exactly 2 parameters (state, event), got ${params.length}`
      };
    }
    
    return {
      valid: true,
      parameters: params
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
const reducerValidator = new ReducerValidator();

module.exports = {
  ReducerValidator,
  reducerValidator
};
