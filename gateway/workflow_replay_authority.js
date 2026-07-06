/**
 * Workflow Replay Authority
 *
 * Phase 34.7 — Constitutional Temporal Integration
 *
 * Reconstructs workflow execution from CRX events.
 *
 * Constitutional Constraint:
 * - Event log is constitutional source of truth
 * - Temporal replay is never constitutional replay
 * - Deterministic replay reconstructs workflow independently of Temporal history
 * - Comparisons use CanonicalBytes/HashAuthority/WitnessAuthority, not JSON.stringify
 */

const { identityAuthority } = require('./identity_authority');
const { CanonicalBytes } = require('./canonical_authority');
const { hashAuthority } = require('./hash_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class WorkflowReplayAuthority {
  constructor(eventRepository) {
    this._eventRepository = eventRepository;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '34.7.0';
  }

  /**
   * Reconstruct workflow execution from CRX events
   * @param {string} workflowId - Workflow execution ID
   * @returns {Promise<Object>} Reconstructed workflow execution
   */
  async reconstructWorkflow(workflowId) {
    // Get all activity events for this workflow
    const activityEvents = await this._eventRepository.getEventsByType('ActivityStarted');
    const workflowActivityEvents = activityEvents.filter(e => e.payload.jobId === workflowId);

    // Reconstruct execution sequence
    const executionSequence = [];
    for (const event of workflowActivityEvents) {
      const activityName = event.payload.activity;
      const completedEvent = await this._findActivityCompleted(activityName, workflowId);
      const failedEvent = await this._findActivityFailed(activityName, workflowId);

      executionSequence.push({
        activity: activityName,
        startedAt: event.timestamp,
        completedAt: completedEvent ? completedEvent.timestamp : null,
        failedAt: failedEvent ? failedEvent.timestamp : null,
        success: !!completedEvent,
        result: completedEvent ? completedEvent.payload.result : null,
        error: failedEvent ? failedEvent.payload.error : null,
      });
    }

    // Sort by start time
    executionSequence.sort((a, b) => a.startedAt - b.startedAt);

    return {
      workflowId,
      executionSequence,
      reconstructedAt: constitutionalTimeAuthority.nowAsMillis(),
      authority: this._authorityId,
      authorityVersion: this._authorityVersion,
    };
  }

  /**
   * Verify workflow determinism
   * @param {string} workflowId - Workflow execution ID
   * @param {Object} expectedExecution - Expected execution sequence
   * @returns {Promise<Object>} Determinism verification result
   */
  async verifyDeterminism(workflowId, expectedExecution) {
    const actualExecution = await this.reconstructWorkflow(workflowId);

    const isDeterministic = this._compareExecutions(expectedExecution, actualExecution);

    return {
      workflowId,
      deterministic: isDeterministic,
      expected: expectedExecution,
      actual: actualExecution,
      verifiedAt: constitutionalTimeAuthority.nowAsMillis(),
      authority: this._authorityId,
      authorityVersion: this._authorityVersion,
    };
  }

  /**
   * Find activity completed event
   * @param {string} activityName - Activity name
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object|null>} Completed event or null
   */
  async _findActivityCompleted(activityName, workflowId) {
    const events = await this._eventRepository.getEventsByType('ActivityCompleted');
    return events.find(e => 
      e.payload.activity === activityName && 
      e.payload.jobId === workflowId
    ) || null;
  }

  /**
   * Find activity failed event
   * @param {string} activityName - Activity name
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object|null>} Failed event or null
   */
  async _findActivityFailed(activityName, workflowId) {
    const events = await this._eventRepository.getEventsByType('ActivityFailed');
    return events.find(e => 
      e.payload.activity === activityName && 
      e.payload.jobId === workflowId
    ) || null;
  }

  /**
   * Compare two executions for determinism
   * @param {Object} expected - Expected execution
   * @param {Object} actual - Actual execution
   * @returns {boolean} Whether executions match
   */
  _compareExecutions(expected, actual) {
    if (expected.executionSequence.length !== actual.executionSequence.length) {
      return false;
    }

    for (let i = 0; i < expected.executionSequence.length; i++) {
      const expectedActivity = expected.executionSequence[i];
      const actualActivity = actual.executionSequence[i];

      if (expectedActivity.activity !== actualActivity.activity) {
        return false;
      }

      if (expectedActivity.success !== actualActivity.success) {
        return false;
      }

      // Compare results for successful activities using constitutional authorities
      if (expectedActivity.success && actualActivity.success) {
        const expectedBytes = CanonicalBytes.serialize(expectedActivity.result);
        const actualBytes = CanonicalBytes.serialize(actualActivity.result);
        
        const expectedHash = hashAuthority.hashBytes(expectedBytes);
        const actualHash = hashAuthority.hashBytes(actualBytes);
        
        if (expectedHash !== actualHash) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    return identityAuthority.generateId('authority', {
      name: 'workflow-replay-authority',
      version: this._authorityVersion,
    });
  }

  /**
   * Publish contract
   * @returns {Object} Authority contract
   */
  publishContract() {
    return {
      authority_id: this._authorityId,
      authority_name: 'WorkflowReplayAuthority',
      version: this._authorityVersion,
      consumes: ['activity_events'],
      produces: ['workflow_reconstruction', 'determinism_verification'],
      requires: ['event_repository'],
      guarantees: ['deterministic_reconstruction', 'event_based_replay'],
      failure_modes: ['event_log_corruption', 'missing_events'],
      rollback: 'none',
      determinism: 'deterministic',
    };
  }
}

// Singleton instance
let workflowReplayAuthority = null;

function getWorkflowReplayAuthority(eventRepository) {
  if (!workflowReplayAuthority) {
    workflowReplayAuthority = new WorkflowReplayAuthority(eventRepository);
  }
  return workflowReplayAuthority;
}

module.exports = { WorkflowReplayAuthority, getWorkflowReplayAuthority };
