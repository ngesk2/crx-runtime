/**
 * Knowledge Activity
 *
 * Phase 3.1 — OSS Integration
 *
 * Thin wrapper around knowledge authorities.
 *
 * Constitutional Constraint:
 * - Activity delegates to authorities
 * - No business logic in activity
 */

const { knowledgeRetrieval } = require('../knowledge_retrieval');
const { consoleEventPort } = require('../console_event_port');

/**
 * Execute knowledge activity
 * @param {Object} job - Knowledge job
 * @returns {Promise<Object>} Knowledge result
 */
async function executeKnowledgeActivity(job) {
  consoleEventPort.emitActivityStarted('executeKnowledgeActivity', job);
  try {
    const result = await knowledgeRetrieval.answerQuestion(job.question);
    consoleEventPort.emitActivityCompleted('executeKnowledgeActivity', job, result);
    return result;
  } catch (error) {
    consoleEventPort.emitActivityFailed('executeKnowledgeActivity', job, error);
    throw error;
  }
}

module.exports = { executeKnowledgeActivity };
