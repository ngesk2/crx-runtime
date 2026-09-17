/**
 * Mission Activities — PING Core v1
 *
 * Temporal activities that wrap existing PING authorities.
 * Activities are the execution boundary between Temporal and PING.
 *
 * Constitutional Constraint:
 * - Activities invoke PING authorities
 * - Activities do NOT emit canonical events directly
 * - Activities do NOT change mission truth directly
 * - PING authorities own business decisions
 * - Temporal owns retry/durability
 */

/**
 * Activity: Execute WorkOrder via ExternalAgentAdapter
 *
 * NOTE: ExternalAgentAdapter is in feature/external-agent-hardening branch
 * This activity will be wired to ExternalAgentAdapter during integration.
 * For now, this is a stub that returns the expected structure.
 */
async function executeWorkOrder(params) {
  const { missionId, capability, input, constraints, externalAgentId } = params;

  // Production wiring (TODO during integration):
  // const adapter = new ExternalAgentAdapter();
  // const authorization = adapter.authorizeWorkOrder({
  //   agentId: externalAgentId,
  //   capability,
  //   namespace: input.context_pack_id ? 'tenant::default' : 'core::default',
  //   constraints,
  // });
  // if (!authorization.granted) {
  //   return { success: false, error: authorization.reason };
  // }
  // const workOrder = adapter.issueWorkOrder({
  //   agentId: externalAgentId,
  //   missionId,
  //   taskId: missionId,
  //   correlationId: input.correlation_id || missionId,
  //   capability,
  //   input,
  //   constraints,
  // });
  // const result = await adapter.verifyResultEnvelope({ workOrder, resultPath: workOrder.result_path });
  // return { success: result.verified, outcome: result.result, requiresApproval: false };

  // Stub for testing Temporal wiring
  return {
    success: true,
    requiresApproval: capability === 'email.send' || capability === 'sms.send',
    outcome: {
      result: 'Draft generated',
      draft: 'Hi Jane, thanks for reaching out...',
    },
  };
}

/**
 * Activity: Record mission outcome via MissionRuntime
 *
 * NOTE: MissionRuntime owns mission state
 * This activity will be wired to MissionRuntime during integration.
 * For now, this is a stub that returns the expected structure.
 */
async function recordMissionOutcome(params) {
  const { missionId, status, outcome, approval } = params;

  // Production wiring (TODO during integration):
  // const missionRuntime = getMissionRuntime();
  // if (status === 'completed') {
  //   await missionRuntime.complete(missionId, outcome);
  // } else if (status === 'failed') {
  //   await missionRuntime.fail(missionId, outcome);
  // }
  // return { success: true, recorded: true };

  // Stub for testing Temporal wiring
  return {
    success: true,
    recorded: true,
  };
}

module.exports = { executeWorkOrder, recordMissionOutcome };
