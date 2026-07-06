/**
 * Repository Activity
 *
 * Phase 3.1 — OSS Integration
 *
 * Thin wrapper around repository authorities.
 *
 * Constitutional Constraint:
 * - Activity delegates to authorities
 * - No business logic in activity
 */

const { repositoryAuthority } = require('../repository_authority');
const { consoleEventPort } = require('../console_event_port');

/**
 * Execute repository activity
 * @param {Object} job - Repository job
 * @returns {Promise<Object>} Repository result
 */
async function executeRepositoryActivity(job) {
  consoleEventPort.emitActivityStarted('executeRepositoryActivity', job);
  try {
    const result = await repositoryAuthority.executeRepository(job);
    consoleEventPort.emitActivityCompleted('executeRepositoryActivity', job, result);
    return result;
  } catch (error) {
    consoleEventPort.emitActivityFailed('executeRepositoryActivity', job, error);
    throw error;
  }
}

module.exports = { executeRepositoryActivity };
