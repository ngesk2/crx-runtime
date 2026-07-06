/**
 * Mission Repository
 * 
 * Phase 21 — Repository Pattern for SQL Centralization
 * 
 * Centralizes all mission-related SQL queries.
 */

class MissionRepository {
  constructor(postgresPool) {
    this._postgres = postgresPool;
  }

  /**
   * Create mission
   * @param {Object} mission - Mission data
   * @returns {Object} Created mission
   */
  async create(mission) {
    const result = await this._postgres.query(`
      INSERT INTO missions (
        mission_id, repo_id, mission_type, mission_description, 
        priority, feasibility_score, mission_status, dependencies
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      mission.mission_id,
      mission.repo_id,
      mission.mission_type,
      mission.mission_description,
      mission.priority,
      mission.feasibility_score,
      mission.mission_status || 'pending',
      JSON.stringify(mission.dependencies || [])
    ]);

    return result.rows[0];
  }

  /**
   * Get mission
   * @param {string} missionId - Mission ID
   * @returns {Object|null} Mission
   */
  async getById(missionId) {
    const result = await this._postgres.query(`
      SELECT * FROM missions WHERE mission_id = $1
    `, [missionId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get missions by status
   * @param {string} status - Mission status
   * @param {number} limit - Result limit
   * @returns {Array} Missions
   */
  async getByStatus(status, limit = 100) {
    const result = await this._postgres.query(`
      SELECT * FROM missions
      WHERE mission_status = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [status, limit]);

    return result.rows;
  }

  /**
   * Get missions by repository
   * @param {string} repoId - Repository ID
   * @returns {Array} Missions
   */
  async getByRepository(repoId) {
    const result = await this._postgres.query(`
      SELECT * FROM missions WHERE repo_id = $1 ORDER BY created_at DESC
    `, [repoId]);

    return result.rows;
  }

  /**
   * Get prioritized missions
   * @param {number} limit - Result limit
   * @returns {Array} Prioritized missions
   */
  async getPrioritized(limit = 10) {
    const result = await this._postgres.query(`
      SELECT mission_id, repo_id, mission_type, mission_description, 
             priority, feasibility_score
      FROM missions
      WHERE mission_status = 'pending'
      ORDER BY priority DESC, feasibility_score DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  /**
   * Update mission status
   * @param {string} missionId - Mission ID
   * @param {string} status - New status
   * @returns {Object} Updated mission
   */
  async updateStatus(missionId, status) {
    const result = await this._postgres.query(`
      UPDATE missions
      SET mission_status = $1
      WHERE mission_id = $2
      RETURNING *
    `, [status, missionId]);

    return result.rows[0];
  }

  /**
   * Update mission with scheduled time
   * @param {string} missionId - Mission ID
   * @param {string} status - Status
   * @param {Date} scheduledAt - Scheduled time
   * @returns {Object} Updated mission
   */
  async schedule(missionId, status, scheduledAt) {
    const result = await this._postgres.query(`
      UPDATE missions
      SET mission_status = $1, scheduled_at = $2
      WHERE mission_id = $3
      RETURNING *
    `, [status, scheduledAt, missionId]);

    return result.rows[0];
  }

  /**
   * Get mission statistics
   * @returns {Object} Statistics
   */
  async getStatistics() {
    const result = await this._postgres.query(`
      SELECT 
        mission_status,
        COUNT(*) as count
      FROM missions
      GROUP BY mission_status
    `, []);

    const stats = {};
    for (const row of result.rows) {
      stats[row.mission_status] = parseInt(row.count);
    }

    return stats;
  }

  /**
   * Delete mission
   * @param {string} missionId - Mission ID
   */
  async delete(missionId) {
    await this._postgres.query(`
      DELETE FROM missions WHERE mission_id = $1
    `, [missionId]);
  }
}

module.exports = { MissionRepository };
