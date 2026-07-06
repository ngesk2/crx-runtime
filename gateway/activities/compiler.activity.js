/**
 * Compiler Activity
 *
 * Phase 3.1 — OSS Integration
 *
 * Thin wrapper around compiler authorities.
 *
 * Constitutional Constraint:
 * - Activity delegates to authorities
 * - No business logic in activity
 */

const { compilerAuthority } = require('../compiler_authority');
const { consoleEventPort } = require('../console_event_port');

/**
 * Execute compiler activity
 * @param {Object} job - Compiler job
 * @returns {Promise<Object>} Compiler result
 */
async function executeCompilerActivity(job) {
  consoleEventPort.emitActivityStarted('executeCompilerActivity', job);
  try {
    const result = await compilerAuthority.compileAndCreate(job.sourceData, job.sourceType, job.lifecycleId);
    consoleEventPort.emitActivityCompleted('executeCompilerActivity', job, result);
    return result;
  } catch (error) {
    consoleEventPort.emitActivityFailed('executeCompilerActivity', job, error);
    throw error;
  }
}

module.exports = { executeCompilerActivity };
