/**
 * Temporal Workflows
 *
 * Phase 2.7.8 — Constitutional Boundary Collapse
 *
 * Constitutional workflows for Temporal orchestration.
 *
 * Constraints:
 * - ZERO behavior inside workflows
 * - ZERO runtime state
 * - ZERO signal handlers
 * - ZERO query handlers
 * - ZERO console.log
 * - ZERO try/catch
 * - Workflow is merely routing to activity
 */

/**
 * Constitutional Workflow
 *
 * Pure routing: delegates to activity.
 * All intelligence belongs in activities (which invoke authorities).
 */
async function ConstitutionalWorkflow(job) {
  return workflow.executeActivity(
    'executeConstitutionalJob',
    {
      taskQueue: 'constitutional-activities',
      args: [job],
    }
  );
}

module.exports = {
  ConstitutionalWorkflow,
};
