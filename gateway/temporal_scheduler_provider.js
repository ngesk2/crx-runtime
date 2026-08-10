/**
 * Temporal Scheduler Provider
 *
 * Phase 2.7.6 — Constitutional Boundary Collapse
 *
 * Implements SchedulerProvider interface using Temporal.
 *
 * Architecture:
 * Bootstrap
 *   ↓
 * Temporal Runtime (lifecycle owned by bootstrap)
 *   ↓
 * SchedulerPort
 *   ↓
 * TemporalSchedulerProvider (implements port only)
 *
 * Constitutional Constraints:
 * - Provider owns NO lifecycle (initialize, shutdown removed)
 * - Provider owns NO connection/client (injected by bootstrap)
 * - Provider implements only schedule(), cancel(), status()
 * - Provider NEVER generates IDs (delegates to WorkflowIdentityAuthority)
 * - No provider-specific semantics leak through port
 */

const { workflowIdentityAuthority } = require('../ping-runtime/authorities/workflow_identity_authority');

class TemporalSchedulerProvider {
  constructor(client, options = {}) {
    this._client = client;
    this._options = {
      taskQueue: options.taskQueue || 'constitutional-scheduler',
      ...options,
    };
  }

  /**
   * Schedule job via Temporal workflow
   * @param {Object} job - Job to schedule
   * @param {Object} options - Scheduling options
   * @returns {Promise<string>} Workflow execution ID
   */
  async schedule(job, options = {}) {
    const workflowId = job.id || workflowIdentityAuthority.generateWorkflowId(job);

    await this._client.workflow.start('ConstitutionalWorkflow', {
      taskQueue: this._options.taskQueue,
      workflowId,
      args: [job],
      ...options,
    });

    return workflowId;
  }

  /**
   * Cancel job via Temporal workflow cancellation
   * @param {string} jobId - Workflow execution ID
   * @returns {Promise<void>}
   */
  async cancel(jobId) {
    const handle = this._client.workflow.getHandle(jobId);
    await handle.cancel();
  }

  /**
   * Get job status (constitutional status, not provider-specific heartbeat)
   * @param {string} jobId - Workflow execution ID
   * @returns {Promise<Object>} Job status
   */
  async status(jobId) {
    const handle = this._client.workflow.getHandle(jobId);
    const description = await handle.describe();

    return {
      job_id: jobId,
      status: description.status.name,
    };
  }
}

module.exports = { TemporalSchedulerProvider };
