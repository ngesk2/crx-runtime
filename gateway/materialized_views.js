/**
 * Materialized Views
 * 
 * Phase 21 — Materialized Views for ControlCenter Read-Heavy Queries
 * 
 * Optimizes ControlCenter queries with materialized views:
 * - Mission Summary
 * - Execution Summary
 * - Current Queue
 * 
 * Refreshed periodically to balance freshness vs performance.
 */

class MaterializedViews {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._refreshInterval = 30000; // 30 seconds
    this._refreshTimer = null;
  }

  /**
   * Initialize views
   */
  async initialize() {
    await this._createViews();
    await this._startRefreshTimer();
  }

  /**
   * Create materialized views
   */
  async _createViews() {
    // Mission Summary View
    await this._postgres.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_mission_summary AS
      SELECT 
        mission_status,
        COUNT(*) as count,
        AVG(priority) as avg_priority,
        AVG(feasibility_score) as avg_feasibility,
        MIN(created_at) as oldest_created,
        MAX(created_at) as newest_created
      FROM missions
      GROUP BY mission_status
    `);

    // Execution Summary View
    await this._postgres.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_execution_summary AS
      SELECT 
        execution_status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds,
        COUNT(DISTINCT mission_id) as unique_missions
      FROM mission_executions
      WHERE completed_at IS NOT NULL
      GROUP BY execution_status
    `);

    // Current Queue View
    await this._postgres.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_current_queue AS
      SELECT 
        queue_status,
        COUNT(*) as count,
        AVG(priority) as avg_priority,
        COUNT(DISTINCT scheduler_id) as active_schedulers
      FROM mission_queue
      GROUP BY queue_status
    `);

    // Mission by Repository View
    await this._postgres.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_mission_by_repository AS
      SELECT 
        repo_id,
        mission_status,
        COUNT(*) as count,
        AVG(priority) as avg_priority
      FROM missions
      GROUP BY repo_id, mission_status
    `);

    // Recent Activity View
    await this._postgres.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_recent_activity AS
      SELECT 
        'mission' as activity_type,
        mission_id as id,
        mission_status as status,
        created_at as timestamp
      FROM missions
      WHERE created_at > NOW() - INTERVAL '1 hour'
      UNION ALL
      SELECT 
        'execution' as activity_type,
        execution_id as id,
        execution_status as status,
        created_at as timestamp
      FROM mission_executions
      WHERE created_at > NOW() - INTERVAL '1 hour'
      ORDER BY timestamp DESC
      LIMIT 100
    `);

    console.log('[MaterializedViews] Created materialized views');
  }

  /**
   * Start refresh timer
   */
  async _startRefreshTimer() {
    this._refreshTimer = setInterval(async () => {
      await this.refreshAll();
    }, this._refreshInterval);
  }

  /**
   * Refresh all views
   */
  async refreshAll() {
    try {
      await this._postgres.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_mission_summary');
      await this._postgres.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_execution_summary');
      await this._postgres.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_current_queue');
      await this._postgres.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_mission_by_repository');
      await this._postgres.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recent_activity');
      console.log('[MaterializedViews] Refreshed all views');
    } catch (error) {
      console.error('[MaterializedViews] Refresh error:', error.message);
    }
  }

  /**
   * Refresh specific view
   * @param {string} viewName - View name
   */
  async refreshView(viewName) {
    await this._postgres.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`);
  }

  /**
   * Get mission summary
   * @returns {Array} Mission summary
   */
  async getMissionSummary() {
    const result = await this._postgres.query(`
      SELECT * FROM mv_mission_summary
    `);
    return result.rows;
  }

  /**
   * Get execution summary
   * @returns {Array} Execution summary
   */
  async getExecutionSummary() {
    const result = await this._postgres.query(`
      SELECT * FROM mv_execution_summary
    `);
    return result.rows;
  }

  /**
   * Get current queue
   * @returns {Array} Queue summary
   */
  async getCurrentQueue() {
    const result = await this._postgres.query(`
      SELECT * FROM mv_current_queue
    `);
    return result.rows;
  }

  /**
   * Get mission by repository
   * @returns {Array} Mission by repository
   */
  async getMissionByRepository() {
    const result = await this._postgres.query(`
      SELECT * FROM mv_mission_by_repository
    `);
    return result.rows;
  }

  /**
   * Get recent activity
   * @returns {Array} Recent activity
   */
  async getRecentActivity() {
    const result = await this._postgres.query(`
      SELECT * FROM mv_recent_activity
    `);
    return result.rows;
  }

  /**
   * Get dashboard data (aggregated for Control Center)
   * @returns {Object} Dashboard data
   */
  async getDashboardData() {
    const [missionSummary, executionSummary, currentQueue, recentActivity] = await Promise.all([
      this.getMissionSummary(),
      this.getExecutionSummary(),
      this.getCurrentQueue(),
      this.getRecentActivity()
    ]);

    return {
      mission_summary: missionSummary,
      execution_summary: executionSummary,
      current_queue: currentQueue,
      recent_activity: recentActivity,
      refreshed_at: new Date()
    };
  }

  /**
   * Stop refresh timer
   */
  stop() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  }
}

module.exports = { MaterializedViews };
