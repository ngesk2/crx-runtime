/**
 * Temporal Activities
 *
 * Phase 3.1 — OSS Integration
 *
 * Activities invoke Authorities.
 * Authorities never call Temporal.
 *
 * Constitutional Constraint:
 * - Activities are thin wrappers around authorities
 * - No business logic in activities
 * - All intelligence belongs in authorities
 */

const { executeMissionActivity } = require('./mission.activity');
const { executeReplayActivity } = require('./replay.activity');
const { executeRepositoryActivity } = require('./repository.activity');
const { executeCompilerActivity } = require('./compiler.activity');
const { executeKnowledgeActivity } = require('./knowledge.activity');
const { executeReflectionActivity } = require('./reflection.activity');

module.exports = {
  executeMissionActivity,
  executeReplayActivity,
  executeRepositoryActivity,
  executeCompilerActivity,
  executeKnowledgeActivity,
  executeReflectionActivity,
};
