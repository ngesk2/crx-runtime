/**
 * Execution Repository
 * 
 * Phase 21 — Repository Pattern for SQL Centralization
 * 
 * Centralizes all execution-related SQL queries.
 */

class ExecutionRepository {
  constructor(postgresPool) {
    this._postgres = postgresPool;
  }

  /**
   * Create execution
   * @param {Object} execution - Execution data
   * @returns {Object} Execution
   */
  async create(execution) {
    const result = await this._postgres.query(`
      INSERT INTO mission_executions (
        execution_id, mission_id, execution_status, 
        context_hash, prompt_hash, patch_hash, replay_hash, 
        approval_status, commit_hash, witness_hash, checkpoint_id, started_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      execution.execution_id,
      execution.mission_id,
      execution.execution_status || 'pending',
      execution.context_hash,
      execution.prompt_hash,
      execution.patch_hash,
      execution.replay_hash,
      execution.approval_status,
      execution.commit_hash,
      execution.witness_hash,
      execution.checkpoint_id,
      execution.started_at || new Date()
    ]);

    return result.rows[0];
  }

  /**
   * Get execution
   * @param {string} executionId - Execution ID
   * @returns {Object|null} Execution
   */
  async getById(executionId) {
    const result = await this._postgres.query(`
      SELECT * FROM mission_executions WHERE execution_id = $1
    `, [executionId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get executions for mission
   * @param {string} missionId - Mission ID
   * @returns {Array} Executions
   */
  async getByMission(missionId) {
    const result = await this._postgres.query(`
      SELECT * FROM mission_executions 
      WHERE mission_id = $1 
      ORDER BY created_at DESC
    `, [missionId]);

    return result.rows;
  }

  /**
   * Update execution status
   * @param {string} executionId - Execution ID
   * @param {string} status - New status
   * @returns {Object} Updated execution
   */
  async updateStatus(executionId, status) {
    const result = await this._postgres.query(`
      UPDATE mission_executions
      SET execution_status = $1
      WHERE execution_id = $2
      RETURNING *
    `, [status, executionId]);

    return result.rows[0];
  }

  /**
   * Complete execution
   * @param {string} executionId - Execution ID
   * @param {Object} result - Execution result
   * @returns {Object} Updated execution
   */
  async complete(executionId, result) {
    const resultQuery = await this._postgres.query(`
      UPDATE mission_executions
      SET execution_status = 'completed',
          execution_result = $1,
          completed_at = NOW()
      WHERE execution_id = $2
      RETURNING *
    `, [JSON.stringify(result), executionId]);

    return resultQuery.rows[0];
  }

  /**
   * Get execution statistics
   * @returns {Object} Statistics
   */
  async getStatistics() {
    const result = await this._postgres.query(`
      SELECT 
        execution_status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
      FROM mission_executions
      WHERE completed_at IS NOT NULL
      GROUP BY execution_status
    `, []);

    const stats = {};
    for (const row of result.rows) {
      stats[row.execution_status] = {
        count: parseInt(row.count),
        avg_duration_seconds: row.avg_duration_seconds ? parseFloat(row.avg_duration_seconds) : null
      };
    }

    return stats;
  }
}

module.exports = { ExecutionRepository };
