/**
 * Temporal Entry Point — PING Core v1
 *
 * Exports workflows and activities for Temporal worker registration.
 */

const { missionExecution } = require('./workflows/mission_workflow');
const { executeWorkOrder, recordMissionOutcome } = require('./activities/mission_activities');

module.exports = {
  workflows: {
    missionExecution,
  },
  activities: {
    executeWorkOrder,
    recordMissionOutcome,
  },
};
