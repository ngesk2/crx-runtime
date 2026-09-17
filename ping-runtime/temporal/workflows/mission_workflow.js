/**
 * Mission Workflow — PING Core v1
 *
 * Temporal workflow for durable mission execution.
 * Wraps existing PING MissionRuntime + ExternalAgentAdapter with Temporal's
 * durable execution mechanics (retry, wait, resume, history).
 *
 * Constitutional Constraint:
 * - Temporal owns execution mechanics (retry, wait, resume, history)
 * - PING owns business state (missions, events, evidence)
 * - PING mission_id is the workflowId
 * - Temporal runId is operational metadata only
 * - Workflow does NOT emit canonical events directly
 * - Workflow does NOT change mission truth directly
 * - Workflow calls activities that invoke PING authorities
 */

const { defineQuery, defineSignal, setHandler, condition, proxyActivities } = require('@temporalio/workflow');

// Import activities from the activities file
const activities = proxyActivities({
  startToCloseTimeout: '5 minutes',
  retryPolicy: {
    initialInterval: '1s',
    maximumInterval: '30s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

/**
 * Signal for approval decision (human decision on proposed action)
 */
const approvalSignal = defineSignal('approval');

/**
 * Query for approval status
 */
const approvalStatusQuery = defineQuery('approvalStatus');

/**
 * Main mission execution workflow
 */
async function missionExecution(params) {
  const { missionId, capability, input, constraints, externalAgentId } = params;

  let approvalState = {
    status: 'none', // none, pending, approved, rejected, expired
    decision: null,
    decidedAt: null,
    decidedBy: null,
  };

  // Handle approval signal
  setHandler(approvalSignal, (decision) => {
    approvalState = {
      status: decision.approved ? 'approved' : 'rejected',
      decision: decision.approved,
      decidedAt: new Date().toISOString(),
      decidedBy: decision.decidedBy || 'unknown',
    };
  });

  // Handle approval status query
  setHandler(approvalStatusQuery, () => approvalState);

  // Step 1: Execute capability via activity
  const executeResult = await activities.executeWorkOrder({
    missionId,
    capability,
    input,
    constraints,
    externalAgentId,
  });

  if (!executeResult.success) {
    return {
      missionId,
      status: 'failed',
      error: executeResult.error,
      executedAt: new Date().toISOString(),
    };
  }

  // Step 2: If capability requires approval, wait for human decision
  if (executeResult.requiresApproval) {
    approvalState.status = 'pending';

    // Wait for approval signal (with timeout)
    const approved = await condition(
      () => approvalState.status === 'approved' || approvalState.status === 'rejected',
      3600 * 1000 // 1 hour timeout
    );

    if (!approved || approvalState.status === 'rejected') {
      return {
        missionId,
        status: 'rejected',
        approval: approvalState,
        executedAt: new Date().toISOString(),
      };
    }
  }

  // Step 3: Record canonical outcome via activity
  const recordResult = await activities.recordMissionOutcome({
    missionId,
    status: 'completed',
    outcome: executeResult.outcome,
    approval: approvalState.status !== 'none' ? approvalState : null,
  });

  return {
    missionId,
    status: 'completed',
    outcome: executeResult.outcome,
    approval: approvalState.status !== 'none' ? approvalState : null,
    recordedAt: new Date().toISOString(),
  };
}

module.exports = { missionExecution, approvalSignal, approvalStatusQuery };
