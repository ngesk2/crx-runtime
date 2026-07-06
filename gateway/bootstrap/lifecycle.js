/**
 * Application Lifecycle
 *
 * Phase 2.7.1 — Constitutional Boundary Collapse
 * Phase 3.1 — Temporal Integration
 *
 * Owns application lifecycle (start, stop, shutdown).
 *
 * Constitutional Constraint:
 * - Lifecycle belongs to Bootstrap only
 * - No service owns its own lifecycle
 * - All initialization/shutdown happens here
 */

class Lifecycle {
  constructor(container) {
    this._container = container;
    this._isStarted = false;
  }

  /**
   * Initialize all services
   */
  async initialize() {
    console.log('[Lifecycle] Initializing services');

    const persistence = this._container.resolve('persistence');
    await persistence.initialize();

    const conversationMemory = this._container.resolve('conversationMemory');
    await conversationMemory.initialize();

    const knowledgeRetrieval = this._container.resolve('knowledgeRetrieval');
    await knowledgeRetrieval.initialize();

    const documentIngestion = this._container.resolve('documentIngestion');
    await documentIngestion.initialize();

    const temporalRuntime = this._container.resolve('temporalRuntime');
    await temporalRuntime.initialize();

    console.log('[Lifecycle] Services initialized');
  }

  /**
   * Start all services
   */
  async start() {
    if (this._isStarted) {
      console.log('[Lifecycle] Already started');
      return;
    }

    console.log('[Lifecycle] Starting services');

    const inferenceService = this._container.resolve('inferenceService');
    await inferenceService.start();

    const documentIngestion = this._container.resolve('documentIngestion');
    await documentIngestion.start();

    const temporalRuntime = this._container.resolve('temporalRuntime');
    await temporalRuntime.startWorker();

    this._isStarted = true;
    console.log('[Lifecycle] Services started');
  }

  /**
   * Stop all services
   */
  async stop() {
    if (!this._isStarted) {
      console.log('[Lifecycle] Already stopped');
      return;
    }

    console.log('[Lifecycle] Stopping services');

    const documentIngestion = this._container.resolve('documentIngestion');
    await documentIngestion.stop();

    const inferenceService = this._container.resolve('inferenceService');
    await inferenceService.stop();

    const temporalRuntime = this._container.resolve('temporalRuntime');
    await temporalRuntime.shutdown();

    const persistence = this._container.resolve('persistence');
    await persistence.backup();

    this._isStarted = false;
    console.log('[Lifecycle] Services stopped');
  }

  /**
   * Check if started
   * @returns {boolean}
   */
  isStarted() {
    return this._isStarted;
  }
}

module.exports = { Lifecycle };
