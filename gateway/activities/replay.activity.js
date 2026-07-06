/**
 * Replay Activity
 *
 * Phase 3.1 — OSS Integration
 *
 * Thin wrapper around replay authorities.
 *
 * Constitutional Constraint:
 * - Activity delegates to authorities
 * - No business logic in activity
 */

const { replayAuthority } = require('../replay_authority');
const { consoleEventPort } = require('../console_event_port');

/**
 * Execute replay activity
 * @param {Object} job - Replay job
 * @returns {Promise<Object>} Replay result
 */
async function executeReplayActivity(job) {
  consoleEventPort.emitActivityStarted('executeReplayActivity', job);
  try {
    const result = await replayAuthority.verifyReplay(job);
    consoleEventPort.emitActivityCompleted('executeReplayActivity', job, result);
    return result;
  } catch (error) {
    consoleEventPort.emitActivityFailed('executeReplayActivity', job, error);
    throw error;
  }
}

module.exports = { executeReplayActivity };
