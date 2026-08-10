/**
 * Event Port
 *
 * Phase 3.2.5 — Constitutional OSS Continuation
 * Phase 34.4 — Constitutional Temporal Integration
 *
 * Port interface for event emission.
 *
 * Constitutional Constraint:
 * - Infrastructure emits through this port
 * - Never direct console.log
 * - Activities emit lifecycle events through this port
 * - Timestamps must use ConstitutionalTimeAuthority
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class EventPort {
  /**
   * Emit event
   * @param {string} level - Event level (info, warn, error)
   * @param {string} source - Event source
   * @param {Object} data - Event data
   */
  emit(level, source, data) {
    throw new Error('EventPort.emit must be implemented by adapter');
  }

  /**
   * Emit info event
   * @param {string} source - Event source
   * @param {Object} data - Event data
   */
  info(source, data) {
    this.emit('info', source, data);
  }

  /**
   * Emit warn event
   * @param {string} source - Event source
   * @param {Object} data - Event data
   */
  warn(source, data) {
    this.emit('warn', source, data);
  }

  /**
   * Emit error event
   * @param {string} source - Event source
   * @param {Object} data - Event data
   */
  error(source, data) {
    this.emit('error', source, data);
  }

  /**
   * Emit activity started event
   * @param {string} activityName - Activity name
   * @param {Object} job - Job data
   */
  emitActivityStarted(activityName, job) {
    this.emit('info', 'Activity', {
      type: 'ActivityStarted',
      activity: activityName,
      jobId: job.id,
      timestamp: constitutionalTimeAuthority.now(),
      job
    });
  }

  /**
   * Emit activity completed event
   * @param {string} activityName - Activity name
   * @param {Object} job - Job data
   * @param {Object} result - Activity result
   */
  emitActivityCompleted(activityName, job, result) {
    this.emit('info', 'Activity', {
      type: 'ActivityCompleted',
      activity: activityName,
      jobId: job.id,
      timestamp: constitutionalTimeAuthority.now(),
      job,
      result
    });
  }

  /**
   * Emit activity failed event
   * @param {string} activityName - Activity name
   * @param {Object} job - Job data
   * @param {Error} error - Error that caused failure
   */
  emitActivityFailed(activityName, job, error) {
    this.emit('error', 'Activity', {
      type: 'ActivityFailed',
      activity: activityName,
      jobId: job.id,
      timestamp: constitutionalTimeAuthority.now(),
      job,
      failureCode: error.name || 'UNKNOWN_ERROR',
      failureReason: error.message,
      authority: activityName.replace('Activity', 'Authority'),
      activity: activityName,
      lifecycleId: job.id
    });
  }
}

module.exports = { EventPort };
