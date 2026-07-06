/**
 * Temporal Runtime
 *
 * Phase 2.7.7 — Constitutional Boundary Collapse
 *
 * Owns Temporal infrastructure lifecycle.
 *
 * Constitutional Constraint:
 * - Connection, client, worker owned here
 * - Provider only implements schedule(), cancel(), status()
 * - Lifecycle belongs to Bootstrap
 */

const { Connection, Client, Worker } = require('@temporalio/client');
const { Worker: TemporalWorker } = require('@temporalio/worker');
const { consoleEventPort } = require('./console_event_port');

class TemporalRuntime {
  constructor(options = {}) {
    this._connection = null;
    this._client = null;
    this._worker = null;
    this._options = {
      address: options.address || 'localhost:7233',
      namespace: options.namespace || 'default',
      taskQueue: options.taskQueue || 'constitutional-scheduler',
      workflowsPath: options.workflowsPath,
      activitiesPath: options.activitiesPath,
      ...options,
    };
    this._isInitialized = false;
  }

  /**
   * Initialize Temporal connection and client
   */
  async initialize() {
    if (this._isInitialized) {
      consoleEventPort.info('TemporalRuntime', { message: 'Already initialized' });
      return;
    }

    consoleEventPort.info('TemporalRuntime', { message: 'Initializing' });

    this._connection = await Connection.connect({
      address: this._options.address,
    });

    this._client = new Client({
      connection: this._connection,
      namespace: this._options.namespace,
    });

    this._isInitialized = true;
    consoleEventPort.info('TemporalRuntime', { message: 'Initialized' });
  }

  /**
   * Start Temporal worker
   */
  async startWorker() {
    if (!this._isInitialized) {
      await this.initialize();
    }

    if (this._worker) {
      consoleEventPort.info('TemporalRuntime', { message: 'Worker already started' });
      return;
    }

    consoleEventPort.info('TemporalRuntime', { message: 'Starting worker' });

    this._worker = await TemporalWorker.create({
      connection: this._connection,
      namespace: this._options.namespace,
      taskQueue: this._options.taskQueue,
      workflowsPath: this._options.workflowsPath,
      activitiesPath: this._options.activitiesPath,
    });

    await this._worker.run();
    consoleEventPort.info('TemporalRuntime', { message: 'Worker started' });
  }

  /**
   * Get Temporal client
   * @returns {Client} Temporal client
   */
  getClient() {
    if (!this._isInitialized) {
      throw new Error('TemporalRuntime not initialized');
    }
    return this._client;
  }

  /**
   * Get Temporal connection
   * @returns {Connection} Temporal connection
   */
  getConnection() {
    if (!this._isInitialized) {
      throw new Error('TemporalRuntime not initialized');
    }
    return this._connection;
  }

  /**
   * Check if initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this._isInitialized;
  }

  /**
   * Shutdown Temporal connection and worker
   */
  async shutdown() {
    consoleEventPort.info('TemporalRuntime', { message: 'Shutting down' });

    if (this._worker) {
      await this._worker.shutdown();
      this._worker = null;
    }

    if (this._client) {
      await this._client.close();
      this._client = null;
    }

    if (this._connection) {
      await this._connection.close();
      this._connection = null;
    }

    this._isInitialized = false;
    consoleEventPort.info('TemporalRuntime', { message: 'Shutdown complete' });
  }
}

module.exports = { TemporalRuntime };
