/**
 * Replay Rule Set
 * 
 * Ω.49 — Replay Rule Set
 * 
 * Constitutional audit rule definitions.
 * 
 * Separates rule definitions from audit execution and reporting.
 * This rule set contains all forbidden patterns and constraints.
 */

class ReplayRuleSet {
  constructor() {
    this._ruleVersion = '1.0.0';
  }

  /**
   * Get forbidden replay inputs
   * @returns {Array} Array of forbidden input patterns
   */
  getForbiddenInputs() {
    return [
      'Date.now()',
      'performance.now()',
      'process.pid',
      'process.cwd()',
      'process.env',
      'locale',
      'filesystem ordering',
      'directory iteration',
      'OS',
      'CPU',
      'platform',
      'insertion order',
      'object identity',
      'Map iteration',
      'Set iteration',
      'WeakMap',
      'WeakSet',
      'pointer equality',
    ];
  }

  /**
   * Get forbidden runtime types in state
   * @returns {Array} Array of forbidden types
   */
  getForbiddenRuntimeTypes() {
    return [
      'Date',
      'Map',
      'Set',
      'WeakMap',
      'WeakSet',
      'Promise',
    ];
  }

  /**
   * Get whitelisted JSON.stringify contexts
   * These are allowed uses of JSON.stringify for constitutional reasons
   * @returns {Array} Array of whitelisted patterns
   */
  getWhitelistedJSONStringify() {
    return [
      '_computeWebhookSignature', // GitHub webhook signature verification requires standard JSON
      'webhook signature', // GitHub webhook signature verification requires standard JSON
      'console.log', // Debugging output (not replay-visible)
      'console.error', // Error logging (not replay-visible)
      'console.warn', // Warning logging (not replay-visible)
      'JSON.parse', // Paired with parse for data interchange
    ];
  }

  /**
   * Get alternate replay paths to detect
   * @returns {Array} Array of alternate path names
   */
  getAlternateReplayPaths() {
    return [
      'debug_replay',
      'fast_replay',
      'legacy_replay',
      'test_replay',
    ];
  }

  /**
   * Get replay entry points
   * @returns {Array} Array of entry point definitions
   */
  getReplayEntryPoints() {
    return [
      { file: 'replay_authority.js', method: 'record', line: 53 },
      { file: 'replay_authority.js', method: 'reconstruct', line: 142 },
      { file: 'replay_authority.js', method: 'verify', line: 164 },
      { file: 'replay_log.js', method: 'append', line: 116 },
      { file: 'replay_log.js', method: 'replay', line: 160 },
      { file: 'witness_recorder.js', method: 'record', line: 23 },
      { file: 'witness_recorder.js', method: 'verify', line: 118 },
      { file: 'witness_recorder.js', method: 'certify', line: 131 },
      { file: 'witness_recorder.js', method: 'verifySignature', line: 159 },
      { file: 'witness_chain.js', method: 'append', line: 151 },
      { file: 'witness_chain.js', method: 'verifyChain', line: 224 },
      { file: 'witness_chain.js', method: 'verifyProvenance', line: 242 },
    ];
  }

  /**
   * Get canonical SQL ordering fields
   * @returns {Array} Array of canonical field names
   */
  getCanonicalOrderingFields() {
    return [
      'event_id',
      'sequence',
      'blockNumber',
    ];
  }

  /**
   * Get non-canonical SQL ordering patterns
   * @returns {Array} Array of forbidden patterns
   */
  getNonCanonicalOrderingPatterns() {
    return [
      'ORDER BY timestamp',
      'ORDER BY created_at',
      'ORDER BY updated_at',
    ];
  }

  /**
   * Get replay kernel files (critical for replay determinism)
   * @returns {Array} Array of replay kernel file names
   */
  getReplayKernelFiles() {
    return [
      'replay_authority.js',
      'replay_log.js',
      'witness_recorder.js',
      'witness_chain.js',
      'replay_determinism_authority.js',
      'replay_plan_authority.js',
      'replay_certificate_authority.js',
      'replay_time_authority.js',
      'replay_validator_authority.js',
      'replay_verifier.js',
    ];
  }

  /**
   * Get infrastructure files (acceptable for non-deterministic patterns)
   * @returns {Array} Array of infrastructure file names
   */
  getInfrastructureFiles() {
    return [
      'console_event_port.js',
      'telemetry_subsystem.js',
      'health_authority.js',
      'bootstrap',
      'runtime',
    ];
  }

  /**
   * Get compiler files
   * @returns {Array} Array of compiler file names
   */
  getCompilerFiles() {
    return [
      'compiler_authority.js',
      'compilation_policy.js',
      'adapter_authority.js',
      'knowledge_compiler.js',
    ];
  }

  /**
   * Get rule version
   * @returns {string} Rule version
   */
  getRuleVersion() {
    return this._ruleVersion;
  }

  /**
   * Check if file is replay kernel file
   * @param {string} fileName - File name
   * @returns {boolean} Is replay kernel file
   */
  isReplayKernelFile(fileName) {
    return this.getReplayKernelFiles().some(f => fileName.includes(f));
  }

  /**
   * Check if file is infrastructure file
   * @param {string} fileName - File name
   * @returns {boolean} Is infrastructure file
   */
  isInfrastructureFile(fileName) {
    return this.getInfrastructureFiles().some(f => fileName.includes(f));
  }

  /**
   * Check if file is compiler file
   * @param {string} fileName - File name
   * @returns {boolean} Is compiler file
   */
  isCompilerFile(fileName) {
    return this.getCompilerFiles().some(f => fileName.includes(f));
  }

  /**
   * Check if file is authority file
   * @param {string} fileName - File name
   * @returns {boolean} Is authority file
   */
  isAuthorityFile(fileName) {
    return fileName.includes('authority.js');
  }

  /**
   * Check if file is documentation file
   * @param {string} fileName - File name
   * @returns {boolean} Is documentation file
   */
  isDocumentationFile(fileName) {
    return fileName.includes('readme') || fileName.includes('doc') || fileName.includes('md');
  }
}

// Singleton instance
const replayRuleSet = new ReplayRuleSet();

module.exports = { ReplayRuleSet, replayRuleSet };
