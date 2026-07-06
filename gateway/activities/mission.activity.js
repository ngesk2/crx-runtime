/**
 * Mission Activity
 *
 * Phase 3.1 — OSS Integration
 *
 * Thin wrapper around mission execution authorities.
 *
 * Constitutional Constraint:
 * - Activity delegates to authorities
 * - No business logic in activity
 */

const { missionAuthority } = require('../mission_authority');
const { consoleEventPort } = require('../console_event_port');

/**
 * Execute mission activity
 * @param {Object} job - Mission job
 * @returns {Promise<Object>} Mission result
 */
async function executeMissionActivity(job) {
  consoleEventPort.emitActivityStarted('executeMissionActivity', job);
  try {
    const result = await missionAuthority.executeMission(job);
    consoleEventPort.emitActivityCompleted('executeMissionActivity', job, result);
    return result;
  } catch (error) {
    consoleEventPort.emitActivityFailed('executeMissionActivity', job, error);
    throw error;
  }
}

module.exports = { executeMissionActivity };
