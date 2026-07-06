/**
 * Telemetry Subsystem
 * 
 * Ω.86.A — Constitutional Autonomous Analysis Runtime
 * 
 * Collect metrics:
 * - queue depth
 * - worker utilization
 * - average latency
 * - proposal acceptance rate
 * - proposal rejection rate
 * - mission generation rate
 * - GPU utilization
 * - repository throughput
 * 
 * Store metrics as constitutional telemetry objects.
 * 
 * Constitutional Constraint: Telemetry is operational metadata, not constitutional state.
 * It never influences replay determinism.
 */

const crypto = require('crypto');

class TelemetrySubsystem {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._initialized = false;
    this._metrics = new Map(); // metric_name -> value
    this._metricHistory = new Map(); // metric_name -> Array of {timestamp, value}
    this._running = false;
    this._collectionInterval = null;
  }

  /**
   * Initialize telemetry subsystem
   */
  async initialize() {
    await this._createTables();
    this._initialized = true;
    console.log('[TelemetrySubsystem] Initialized');
  }

  /**
   * Create telemetry tables
   */
  async _createTables() {
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS telemetry_metrics (
        metric_id VARCHAR(255) PRIMARY KEY,
        metric_name VARCHAR(255) NOT NULL,
        metric_value FLOAT NOT NULL,
        metric_unit VARCHAR(50),
        tags JSONB,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes
    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_telemetry_metrics_name 
      ON telemetry_metrics(metric_name)
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_telemetry_metrics_timestamp 
      ON telemetry_metrics(timestamp DESC)
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_telemetry_metrics_name_timestamp 
      ON telemetry_metrics(metric_name, timestamp DESC)
    `);
  }

  /**
   * Start telemetry collection
   */
  async start() {
    if (this._running) {
      console.log('[TelemetrySubsystem] Already running');
      return;
    }

    this._running = true;
    this._startCollectionLoop();

    console.log('[TelemetrySubsystem] Started');
  }

  /**
   * Stop telemetry collection
   */
  async stop() {
    this._running = false;

    if (this._collectionInterval) {
      clearInterval(this._collectionInterval);
      this._collectionInterval = null;
    }

    console.log('[TelemetrySubsystem] Stopped');
  }

  /**
   * Start collection loop
   */
  _startCollectionLoop() {
    const collectionInterval = 60000; // 1 minute

    this._collectionInterval = setInterval(async () => {
      if (!this._running) return;

      try {
        await this._collectMetrics();
      } catch (error) {
        console.error('[TelemetrySubsystem] Collection loop error:', error.message);
      }
    }, collectionInterval);
  }

  /**
   * Collect metrics
   */
  async _collectMetrics() {
    const now = new Date().toISOString();

    // Collect all registered metrics
    for (const [metricName, metricValue] of this._metrics.entries()) {
      await this._recordMetric(metricName, metricValue, now);
    }
  }

  /**
   * Record metric
   * 
   * @param {string} metricName - Metric name
   * @param {number} metricValue - Metric value
   * @param {string} unit - Unit
   * @param {Object} tags - Tags
   */
  async recordMetric(metricName, metricValue, unit = null, tags = {}) {
    const { identityAuthority } = require('./identity_authority');
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
    const metricId = identityAuthority.generateId('metric', { type: 'metric' });
    const now = constitutionalTimeAuthority.now();

    await this._postgres.query(`
      INSERT INTO telemetry_metrics (
        metric_id,
        metric_name,
        metric_value,
        metric_unit,
        tags,
        timestamp,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      metricId,
      metricName,
      metricValue,
      unit,
      CanonicalBytes.serialize(tags),
      now,
      now,
    ]);

    // Update in-memory metrics
    this._metrics.set(metricName, metricValue);

    // Update history
    if (!this._metricHistory.has(metricName)) {
      this._metricHistory.set(metricName, []);
    }
    const history = this._metricHistory.get(metricName);
    history.push({ timestamp: now, value: metricValue });

    // Keep only last 1000 data points
    if (history.length > 1000) {
      history.shift();
    }

    console.log(`[TelemetrySubsystem] Recorded metric: ${metricName} = ${metricValue}`);
  }

  /**
   * Set metric value
   * 
   * @param {string} metricName - Metric name
   * @param {number} metricValue - Metric value
   */
  setMetric(metricName, metricValue) {
    this._metrics.set(metricName, metricValue);
  }

  /**
   * Increment metric
   * 
   * @param {string} metricName - Metric name
   * @param {number} delta - Delta
   */
  incrementMetric(metricName, delta = 1) {
    const currentValue = this._metrics.get(metricName) || 0;
    this._metrics.set(metricName, currentValue + delta);
  }

  /**
   * Get metric value
   * 
   * @param {string} metricName - Metric name
   * @returns {number|null} Metric value or null
   */
  getMetric(metricName) {
    return this._metrics.get(metricName) || null;
  }

  /**
   * Get metric history
   * 
   * @param {string} metricName - Metric name
   * @param {number} limit - Limit
   * @returns {Array} History
   */
  getMetricHistory(metricName, limit = 100) {
    const history = this._metricHistory.get(metricName) || [];
    return history.slice(-limit);
  }

  /**
   * Get metrics from database
   * 
   * @param {string} metricName - Metric name
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   * @returns {Array} Metrics
   */
  async getMetricsFromDB(metricName, startTime = null, endTime = null) {
    let query = `
      SELECT * FROM telemetry_metrics
      WHERE metric_name = $1
    `;
    const params = [metricName];

    if (startTime) {
      query += ` AND timestamp >= $2`;
      params.push(startTime);
    }

    if (endTime) {
      const paramIndex = params.length + 1;
      query += ` AND timestamp <= $${paramIndex}`;
      params.push(endTime);
    }

    query += ` ORDER BY timestamp ASC`;

    const result = await this._postgres.query(query, params);
    return result.rows;
  }

  /**
   * Get aggregate metrics
   * 
   * @param {string} metricName - Metric name
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   * @returns {Object} Aggregates
   */
  async getAggregateMetrics(metricName, startTime = null, endTime = null) {
    let query = `
      SELECT 
        COUNT(*) as count,
        AVG(metric_value) as avg,
        MIN(metric_value) as min,
        MAX(metric_value) as max,
        STDDEV(metric_value) as stddev
      FROM telemetry_metrics
      WHERE metric_name = $1
    `;
    const params = [metricName];

    if (startTime) {
      query += ` AND timestamp >= $2`;
      params.push(startTime);
    }

    if (endTime) {
      const paramIndex = params.length + 1;
      query += ` AND timestamp <= $${paramIndex}`;
      params.push(endTime);
    }

    const result = await this._postgres.query(query, params);
    return result.rows[0];
  }

  /**
   * Get all current metrics
   * 
   * @returns {Object} Metrics
   */
  getAllMetrics() {
    return Object.fromEntries(this._metrics);
  }

  /**
   * Record queue depth
   * 
   * @param {Object} queueDepth - Queue depth by status
   */
  async recordQueueDepth(queueDepth) {
    for (const [status, count] of Object.entries(queueDepth)) {
      await this.recordMetric(
        `queue_depth_${status}`,
        count,
        'count',
        { status }
      );
    }

    const totalDepth = Object.values(queueDepth).reduce((sum, count) => sum + count, 0);
    await this.recordMetric('queue_depth_total', totalDepth, 'count');
  }

  /**
   * Record worker utilization
   * 
   * @param {Object} workerStatus - Worker status
   */
  async recordWorkerUtilization(workerStatus) {
    const totalWorkers = workerStatus.total_workers || 0;
    const workersByType = workerStatus.workers_by_type || {};

    await this.recordMetric('workers_total', totalWorkers, 'count');

    for (const [workerType, typeStatus] of Object.entries(workersByType)) {
      const utilization = typeStatus.total > 0 
        ? typeStatus.busy / typeStatus.total 
        : 0;

      await this.recordMetric(
        `worker_utilization_${workerType}`,
        utilization,
        'ratio',
        { worker_type: workerType }
      );
    }

    // Calculate overall utilization
    let totalBusy = 0;
    for (const typeStatus of Object.values(workersByType)) {
      totalBusy += typeStatus.busy || 0;
    }

    const overallUtilization = totalWorkers > 0 ? totalBusy / totalWorkers : 0;
    await this.recordMetric('worker_utilization_overall', overallUtilization, 'ratio');
  }

  /**
   * Record latency
   * 
   * @param {string} operation - Operation name
   * @param {number} latencyMs - Latency in milliseconds
   */
  async recordLatency(operation, latencyMs) {
    await this.recordMetric(
      `latency_${operation}`,
      latencyMs,
      'ms',
      { operation }
    );
  }

  /**
   * Record proposal acceptance
   */
  async recordProposalAccepted() {
    this.incrementMetric('proposals_accepted');
  }

  /**
   * Record proposal rejection
   */
  async recordProposalRejected() {
    this.incrementMetric('proposals_rejected');
  }

  /**
   * Record mission generated
   */
  async recordMissionGenerated() {
    this.incrementMetric('missions_generated');
  }

  /**
   * Record GPU utilization
   * 
   * @param {number} utilization - GPU utilization (0-1)
   */
  async recordGPUUtilization(utilization) {
    await this.recordMetric('gpu_utilization', utilization, 'ratio');
  }

  /**
   * Record repository throughput
   * 
   * @param {number} count - Number of repositories processed
   */
  async recordRepositoryThroughput(count) {
    this.incrementMetric('repositories_processed', count);
  }

  /**
   * Get dashboard metrics
   * 
   * @returns {Object} Dashboard metrics
   */
  async getDashboardMetrics() {
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();

    const metrics = {
      current: this.getAllMetrics(),
      queue_depth: await this.getAggregateMetrics('queue_depth_total', oneHourAgo),
      worker_utilization: await this.getAggregateMetrics('worker_utilization_overall', oneHourAgo),
      proposals_accepted: await this.getAggregateMetrics('proposals_accepted', oneHourAgo),
      proposals_rejected: await this.getAggregateMetrics('proposals_rejected', oneHourAgo),
      missions_generated: await this.getAggregateMetrics('missions_generated', oneHourAgo),
      gpu_utilization: await this.getAggregateMetrics('gpu_utilization', oneHourAgo),
      repositories_processed: await this.getAggregateMetrics('repositories_processed', oneHourAgo),
    };

    return metrics;
  }

  /**
   * Clear old metrics
   * 
   * @param {number} olderThanDays - Clear metrics older than this many days
   */
  async clearOldMetrics(olderThanDays = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this._postgres.query(`
      DELETE FROM telemetry_metrics
      WHERE timestamp < $1
      RETURNING metric_id
    `, [cutoffDate]);

    console.log(`[TelemetrySubsystem] Cleared ${result.rows.length} old metrics`);
    return result.rows.length;
  }

  /**
   * Get subsystem status
   * 
   * @returns {Object} Status
   */
  getStatus() {
    return {
      running: this._running,
      metrics_count: this._metrics.size,
      history_count: Array.from(this._metricHistory.values())
        .reduce((sum, history) => sum + history.length, 0),
    };
  }
}

module.exports = { TelemetrySubsystem };
