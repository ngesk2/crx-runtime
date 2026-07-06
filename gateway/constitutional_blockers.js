/**
 * Constitutional Blockers
 * 
 * Phase 36A — Eliminate Hidden Authorities
 * 
 * These are CONSTITUTIONAL BLOCKERS.
 * 
 * Not warnings.
 * Not TODOs.
 * BUILD BREAKERS.
 * 
 * Any violation of these blockers MUST fail the build.
 * 
 * Hidden Authorities Blocked:
 * 1. JSON serialization in replay-visible code
 * 2. Date access in replay-visible code
 * 3. Filesystem authority in replay-visible code
 * 4. Random generation in replay-visible code
 */

const fs = require('fs');
const path = require('path');

class ConstitutionalBlockers {
  constructor() {
    this._violations = [];
    this._replayVisiblePaths = this._defineReplayVisiblePaths();
    this._dateAllowedPaths = this._defineDateAllowedPaths();
    this._jsonAllowedPaths = this._defineJSONAllowedPaths();
  }

  /**
   * Define replay-visible code paths
   * Code in these paths MUST be constitutionally compliant
   */
  _defineReplayVisiblePaths() {
    const gatewayRoot = path.join(__dirname);
    return [
      path.join(gatewayRoot, 'replay_authority.js'),
      path.join(gatewayRoot, 'replay_certificate_authority.js'),
      path.join(gatewayRoot, 'reducer_authority.js'),
      path.join(gatewayRoot, 'event_repository.js'),
      path.join(gatewayRoot, 'standard_event_schema.js'),
      path.join(gatewayRoot, 'execution_graph_authority.js'),
      path.join(gatewayRoot, 'worker_registry.js'),
      path.join(gatewayRoot, 'canonical_authority.js'),
      path.join(gatewayRoot, 'runtime_identity_authority.js'),
      path.join(gatewayRoot, 'constitutional_time_authority.js'),
      path.join(gatewayRoot, 'replay_time_authority.js'),
      path.join(gatewayRoot, 'witness_authority.js'),
      path.join(gatewayRoot, 'witness_generator.js'),
      path.join(gatewayRoot, 'activities/replay.activity.js'),
      path.join(gatewayRoot, 'activities/repository.activity.js'),
      path.join(gatewayRoot, 'activities/compiler.activity.js'),
      path.join(gatewayRoot, 'activities/mission.activity.js'),
      path.join(gatewayRoot, 'activities/reflection.activity.js'),
      path.join(gatewayRoot, 'activities/knowledge.activity.js')
    ];
  }

  /**
   * Define paths where Date access is allowed
   * runtime_clock.js is the ONLY place where Date access is permitted
   * constitutional_time_authority.js and replay_time_authority.js are also allowed (they wrap Date)
   */
  _defineDateAllowedPaths() {
    const gatewayRoot = path.join(__dirname);
    return [
      path.join(gatewayRoot, 'runtime_clock.js'),
      path.join(gatewayRoot, 'constitutional_time_authority.js'),
      path.join(gatewayRoot, 'replay_time_authority.js')
    ];
  }

  /**
   * Define paths where JSON serialization is allowed
   * canonical_authority.js and witness_generator.js implement the canonical serialization layer
   */
  _defineJSONAllowedPaths() {
    const gatewayRoot = path.join(__dirname);
    return [
      path.join(gatewayRoot, 'canonical_authority.js'),
      path.join(gatewayRoot, 'witness_generator.js')
    ];
  }

  /**
   * Check if a file is replay-visible
   * @param {string} filePath - File path to check
   * @returns {boolean} True if replay-visible
   */
  isReplayVisible(filePath) {
    const normalizedPath = path.normalize(filePath);
    return this._replayVisiblePaths.some(replayPath => 
      normalizedPath === path.normalize(replayPath)
    );
  }

  /**
   * Blocker 1: No JSON serialization in replay-visible code
   * @param {string} filePath - File to check
   * @returns {Object} Violation report
   */
  blockJSONSerialization(filePath) {
    if (!this.isReplayVisible(filePath)) {
      return { passed: true, violations: [] };
    }

    // Allow JSON serialization in canonical_authority.js and witness_generator.js (they implement the canonical serialization layer)
    const normalizedPath = path.normalize(filePath);
    if (this._jsonAllowedPaths.some(allowedPath => normalizedPath === path.normalize(allowedPath))) {
      return { passed: true, violations: [] };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];

    // Check for JSON.stringify
    const stringifyMatches = content.match(/JSON\.stringify/g);
    if (stringifyMatches) {
      violations.push({
        type: 'JSON_STRINGIFY',
        severity: 'BLOCKER',
        message: 'JSON.stringify() found in replay-visible code. Use CanonicalBytes.serialize() instead.',
        count: stringifyMatches.length
      });
    }

    // Check for JSON.parse
    const parseMatches = content.match(/JSON\.parse/g);
    if (parseMatches) {
      violations.push({
        type: 'JSON_PARSE',
        severity: 'BLOCKER',
        message: 'JSON.parse() found in replay-visible code. Use CanonicalBytes.deserialize() instead.',
        count: parseMatches.length
      });
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Blocker 2: No Date access in replay-visible code
   * @param {string} filePath - File to check
   * @returns {Object} Violation report
   */
  blockDateAccess(filePath) {
    if (!this.isReplayVisible(filePath)) {
      return { passed: true, violations: [] };
    }

    // Allow Date access in runtime_clock.js (the only place where Date should be used)
    const normalizedPath = path.normalize(filePath);
    if (this._dateAllowedPaths.some(allowedPath => normalizedPath === path.normalize(allowedPath))) {
      return { passed: true, violations: [] };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];

    // Check for Date.now()
    const dateNowMatches = content.match(/Date\.now\(\)/g);
    if (dateNowMatches) {
      violations.push({
        type: 'DATE_NOW',
        severity: 'BLOCKER',
        message: 'Date.now() found in replay-visible code. Use runtimeClock.nowAsMillis() instead.',
        count: dateNowMatches.length
      });
    }

    // Check for new Date()
    const newDateMatches = content.match(/new Date\(\)/g);
    if (newDateMatches) {
      violations.push({
        type: 'NEW_DATE',
        severity: 'BLOCKER',
        message: 'new Date() found in replay-visible code. Use runtimeClock.nowAsDate() instead.',
        count: newDateMatches.length
      });
    }

    // Check for new Date(x) with arguments
    const newDateArgMatches = content.match(/new Date\([^)]+\)/g);
    if (newDateArgMatches) {
      violations.push({
        type: 'NEW_DATE_ARG',
        severity: 'BLOCKER',
        message: 'new Date(x) found in replay-visible code. Use constitutional time authorities instead.',
        count: newDateArgMatches.length
      });
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Blocker 3: No filesystem authority in replay-visible code
   * @param {string} filePath - File to check
   * @returns {Object} Violation report
   */
  blockFilesystemAuthority(filePath) {
    if (!this.isReplayVisible(filePath)) {
      return { passed: true, violations: [] };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];

    // Check for fs.readFileSync
    const readSyncMatches = content.match(/fs\.readFileSync/g);
    if (readSyncMatches) {
      violations.push({
        type: 'FS_READ_SYNC',
        severity: 'BLOCKER',
        message: 'fs.readFileSync() found in replay-visible code. Use event-sourced data loading instead.',
        count: readSyncMatches.length
      });
    }

    // Check for fs.writeFileSync
    const writeSyncMatches = content.match(/fs\.writeFileSync/g);
    if (writeSyncMatches) {
      violations.push({
        type: 'FS_WRITE_SYNC',
        severity: 'BLOCKER',
        message: 'fs.writeFileSync() found in replay-visible code. Use event-sourced persistence instead.',
        count: writeSyncMatches.length
      });
    }

    // Check for fs.readFile
    const readMatches = content.match(/fs\.readFile/g);
    if (readMatches) {
      violations.push({
        type: 'FS_READ',
        severity: 'BLOCKER',
        message: 'fs.readFile() found in replay-visible code. Use event-sourced data loading instead.',
        count: readMatches.length
      });
    }

    // Check for fs.writeFile
    const writeMatches = content.match(/fs\.writeFile/g);
    if (writeMatches) {
      violations.push({
        type: 'FS_WRITE',
        severity: 'BLOCKER',
        message: 'fs.writeFile() found in replay-visible code. Use event-sourced persistence instead.',
        count: writeMatches.length
      });
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Blocker 4: No random generation in replay-visible code
   * @param {string} filePath - File to check
   * @returns {Object} Violation report
   */
  blockRandomGeneration(filePath) {
    if (!this.isReplayVisible(filePath)) {
      return { passed: true, violations: [] };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];

    // Check for Math.random
    const mathRandomMatches = content.match(/Math\.random/g);
    if (mathRandomMatches) {
      violations.push({
        type: 'MATH_RANDOM',
        severity: 'BLOCKER',
        message: 'Math.random() found in replay-visible code. Use CanonicalAuthority.hash() for deterministic values.',
        count: mathRandomMatches.length
      });
    }

    // Check for crypto.randomBytes
    const cryptoRandomMatches = content.match(/crypto\.randomBytes/g);
    if (cryptoRandomMatches) {
      violations.push({
        type: 'CRYPTO_RANDOM',
        severity: 'BLOCKER',
        message: 'crypto.randomBytes() found in replay-visible code. Use deterministic ID generation instead.',
        count: cryptoRandomMatches.length
      });
    }

    // Check for crypto.randomUUID
    const uuidMatches = content.match(/crypto\.randomUUID/g);
    if (uuidMatches) {
      violations.push({
        type: 'CRYPTO_UUID',
        severity: 'BLOCKER',
        message: 'crypto.randomUUID() found in replay-visible code. Use IdentityAuthority for ID generation.',
        count: uuidMatches.length
      });
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Run all blockers on a file
   * @param {string} filePath - File to check
   * @returns {Object} Complete violation report
   */
  checkFile(filePath) {
    const results = {
      filePath,
      isReplayVisible: this.isReplayVisible(filePath),
      blockers: {
        jsonSerialization: this.blockJSONSerialization(filePath),
        dateAccess: this.blockDateAccess(filePath),
        filesystemAuthority: this.blockFilesystemAuthority(filePath),
        randomGeneration: this.blockRandomGeneration(filePath)
      },
      passed: true
    };

    // Check if any blocker failed
    for (const [blockerName, blockerResult] of Object.entries(results.blockers)) {
      if (!blockerResult.passed) {
        results.passed = false;
        this._violations.push({
          filePath,
          blocker: blockerName,
          violations: blockerResult.violations
        });
      }
    }

    return results;
  }

  /**
   * Run all blockers on all replay-visible files
   * @returns {Object} Complete violation report
   */
  checkAllReplayVisibleFiles() {
    const results = {
      totalFiles: this._replayVisiblePaths.length,
      passedFiles: 0,
      failedFiles: 0,
      fileResults: [],
      overallPassed: true
    };

    for (const filePath of this._replayVisiblePaths) {
      if (fs.existsSync(filePath)) {
        const fileResult = this.checkFile(filePath);
        results.fileResults.push(fileResult);
        
        if (fileResult.passed) {
          results.passedFiles++;
        } else {
          results.failedFiles++;
          results.overallPassed = false;
        }
      }
    }

    return results;
  }

  /**
   * Get all violations
   * @returns {Array} All violations found
   */
  getViolations() {
    return this._violations;
  }

  /**
   * Clear violations
   */
  clearViolations() {
    this._violations = [];
  }

  /**
   * Fail build if violations exist
   * @throws {Error} If violations exist
   */
  enforceBuildFailure() {
    if (this._violations.length > 0) {
      const violationSummary = this._violations.map(v => 
        `${v.filePath}: ${v.blocker} - ${v.violations.map(vv => vv.message).join(', ')}`
      ).join('\n');
      
      throw new Error(
        `CONSTITUTIONAL BLOCKER VIOLATIONS DETECTED\n\n` +
        `The following hidden authorities are present in replay-visible code:\n\n` +
        `${violationSummary}\n\n` +
        `These are CONSTITUTIONAL BLOCKERS.\n` +
        `Build cannot proceed until all violations are resolved.\n\n` +
        `Total violations: ${this._violations.length}`
      );
    }
  }
}

// Singleton instance
const constitutionalBlockers = new ConstitutionalBlockers();

module.exports = {
  ConstitutionalBlockers,
  constitutionalBlockers
};
