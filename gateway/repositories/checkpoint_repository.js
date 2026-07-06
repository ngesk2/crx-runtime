/**
 * Checkpoint Repository
 * 
 * Phase 21 — Repository Pattern for SQL Centralization
 * 
 * Centralizes all checkpoint-related SQL queries.
 */

class CheckpointRepository {
  constructor(postgresPool) {
    this._postgres = postgresPool;
  }

  /**
   * Create checkpoint
   * @param {Object} checkpoint - Checkpoint data
   * @returns {Object} Checkpoint
   */
  async create(checkpoint) {
    const result = await this._postgres.query(`
      INSERT INTO checkpoints (
        checkpoint_id, mission_id, execution_id, checkpoint_data, 
        checkpoint_hash, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      checkpoint.checkpoint_id,
      checkpoint.mission_id,
      checkpoint.execution_id,
      JSON.stringify(checkpoint.checkpoint_data),
      checkpoint.checkpoint_hash,
      checkpoint.created_at || new Date()
    ]);

    return result.rows[0];
  }

  /**
   * Get checkpoint
   * @param {string} checkpointId - Checkpoint ID
   * @returns {Object|null} Checkpoint
   */
  async getById(checkpointId) {
    const result = await this._postgres.query(`
      SELECT * FROM checkpoints WHERE checkpoint_id = $1
    `, [checkpointId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get checkpoint for mission
   * @param {string} missionId - Mission ID
   * @returns {Object|null} Latest checkpoint
   */
  async getByMission(missionId) {
    const result = await this._postgres.query(`
      SELECT * FROM checkpoints 
      WHERE mission_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [missionId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get checkpoint for execution
   * @param {string} executionId - Execution ID
   * @returns {Object|null} Checkpoint
   */
  async getByExecution(executionId) {
    const result = await this._postgres.query(`
      SELECT * FROM checkpoints 
      WHERE execution_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [executionId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get latest checkpoint
   * @returns {Object|null} Latest checkpoint
   */
  async getLatest() {
    const result = await this._postgres.query(`
      SELECT * FROM checkpoints 
      ORDER BY created_at DESC 
      LIMIT 1
    `, []);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * List checkpoints
   * @param {string} missionId - Mission ID filter (optional)
   * @param {number} limit - Result limit
   * @returns {Array} Checkpoints
   */
  async list(missionId = null, limit = 100) {
    let query = `
      SELECT * FROM checkpoints
    `;
    const params = [];

    if (missionId) {
      query += ` WHERE mission_id = $1`;
      params.push(missionId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this._postgres.query(query, params);
    return result.rows;
  }

  /**
   * Delete checkpoint
   * @param {string} checkpointId - Checkpoint ID
   */
  async delete(checkpointId) {
    await this._postgres.query(`
      DELETE FROM checkpoints WHERE checkpoint_id = $1
    `, [checkpointId]);
  }

  /**
   * Delete old checkpoints
   * @param {number} daysToKeep - Days to keep
   */
  async deleteOld(daysToKeep = 30) {
    await this._postgres.query(`
      DELETE FROM checkpoints
      WHERE created_at < NOW() - INTERVAL '1 day' * $1
    `, [daysToKeep]);
  }
}

module.exports = { CheckpointRepository };
