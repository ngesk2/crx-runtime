/**
 * Reflection Activity
 *
 * Phase 3.1 — OSS Integration
 *
 * Thin wrapper around reflection authorities.
 *
 * Constitutional Constraint:
 * - Activity delegates to authorities
 * - No business logic in activity
 */

const { reflectionAuthority } = require('../reflection_authority');
const { consoleEventPort } = require('../console_event_port');

/**
 * Execute reflection activity
 * @param {Object} job - Reflection job
 * @returns {Promise<Object>} Reflection result
 */
async function executeReflectionActivity(job) {
  consoleEventPort.emitActivityStarted('executeReflectionActivity', job);
  try {
    const result = await reflectionAuthority.executeReflection(job);
    consoleEventPort.emitActivityCompleted('executeReflectionActivity', job, result);
    return result;
  } catch (error) {
    consoleEventPort.emitActivityFailed('executeReflectionActivity', job, error);
    throw error;
  }
}

module.exports = { executeReflectionActivity };
