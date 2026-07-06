/**
 * Constitutional Classifier
 * 
 * Ω.49 — Constitutional Classifier
 * 
 * Classification logic for constitutional audit findings.
 * 
 * Separates classification logic from audit execution and reporting.
 * This classifier determines the severity category of violations.
 */

const { replayRuleSet } = require('./replay_rule_set');

class ConstitutionalClassifier {
  constructor() {
    this._classifierVersion = '1.0.0';
  }

  /**
   * Classify violation by category
   * @param {Object} violation - Violation object
   * @returns {string} Category (replay/infrastructure/compiler/authority/documentation)
   */
  classifyViolation(violation) {
    const { file, type, message } = violation;

    // Documentation files
    if (replayRuleSet.isDocumentationFile(file)) {
      return 'documentation';
    }

    // Replay kernel violations are critical
    if (replayRuleSet.isReplayKernelFile(file)) {
      return 'replay';
    }

    // Infrastructure violations are acceptable
    if (replayRuleSet.isInfrastructureFile(file)) {
      return 'infrastructure';
    }

    // Compiler violations
    if (replayRuleSet.isCompilerFile(file)) {
      return 'compiler';
    }

    // Authority violations
    if (replayRuleSet.isAuthorityFile(file)) {
      return 'authority';
    }

    // Default to infrastructure for unknown
    return 'infrastructure';
  }

  /**
   * Classify violation severity
   * @param {Object} violation - Violation object
   * @returns {string} Severity (critical/high/medium/low)
   */
  classifySeverity(violation) {
    const { severity } = violation;
    
    // If already specified, use it
    if (severity) {
      return severity;
    }

    // Default severity based on category
    const category = this.classifyViolation(violation);
    
    switch (category) {
      case 'replay':
        return 'critical';
      case 'compiler':
        return 'high';
      case 'authority':
        return 'high';
      case 'infrastructure':
        return 'low';
      case 'documentation':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Get category description
   * @param {string} category - Category name
   * @returns {string} Category description
   */
  getCategoryDescription(category) {
    const descriptions = {
      replay: 'Critical replay kernel violations - break replay determinism',
      infrastructure: 'Infrastructure-only violations - acceptable outside replay kernel',
      compiler: 'Compiler-related violations - affect compilation determinism',
      authority: 'Authority-related violations - affect constitutional object generation',
      documentation: 'Documentation-related violations - informational only',
    };
    
    return descriptions[category] || 'Unknown category';
  }

  /**
   * Get classifier version
   * @returns {string} Classifier version
   */
  getClassifierVersion() {
    return this._classifierVersion;
  }

  /**
   * Batch classify violations
   * @param {Array} violations - Array of violation objects
   * @returns {Object} Classified violations by category
   */
  classifyViolations(violations) {
    const classified = {
      replay: [],
      infrastructure: [],
      compiler: [],
      authority: [],
      documentation: [],
    };

    for (const violation of violations) {
      const category = this.classifyViolation(violation);
      classified[category].push(violation);
    }

    return classified;
  }

  /**
   * Get critical violations
   * @param {Array} violations - Array of violation objects
   * @returns {Array} Critical violations
   */
  getCriticalViolations(violations) {
    return violations.filter(v => this.classifySeverity(v) === 'critical');
  }

  /**
   * Get high severity violations
   * @param {Array} violations - Array of violation objects
   * @returns {Array} High severity violations
   */
  getHighSeverityViolations(violations) {
    return violations.filter(v => this.classifySeverity(v) === 'high');
  }

  /**
   * Check if audit passes (zero critical replay violations)
   * @param {Array} violations - Array of violation objects
   * @returns {boolean} Audit passes
   */
  auditPasses(violations) {
    const criticalViolations = this.getCriticalViolations(violations);
    const replayViolations = violations.filter(v => this.classifyViolation(v) === 'replay');
    
    // Pass if zero critical violations and zero replay violations
    return criticalViolations.length === 0 && replayViolations.length === 0;
  }
}

// Singleton instance
const constitutionalClassifier = new ConstitutionalClassifier();

module.exports = { ConstitutionalClassifier, constitutionalClassifier };
