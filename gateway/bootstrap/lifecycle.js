/**
 * Application Lifecycle
 *
 * Priority 6 — Computed startup ordering via DependencyGraph.
 *
 * Owns application lifecycle (start, stop, shutdown).
 *
 * Constitutional Constraint:
 * - Lifecycle belongs to Bootstrap only
 * - No service owns its own lifecycle
 * - All initialization/shutdown happens here
 * - Startup order is computed from dependency graph, never hardcoded
 * - Cycles = FAIL. Orphans = flagged. Missing deps = FAIL.
 */

const { validateWiring, buildDependencyGraph } = require('./wiring');

/**
 * Constitutional startup order (services that need explicit start).
 * These run AFTER initialization.
 */
const START_ORDER = [
  { name: 'inferenceService',    description: 'Inference service (Ollama)' },
  { name: 'documentIngestion',   description: 'Document ingestion pipeline' },
  { name: 'temporalRuntime',     description: 'Temporal workflow worker' },
];

/**
 * Constitutional shutdown order.
 * Reverse of startup order.
 */
const SHUTDOWN_ORDER = [
  { name: 'temporalRuntime',     description: 'Temporal workflow worker' },
  { name: 'documentIngestion',   description: 'Document ingestion pipeline' },
  { name: 'inferenceService',    description: 'Inference service (Ollama)' },
  { name: 'persistence',         description: 'File-based state persistence (backup)' },
];

class Lifecycle {
  constructor(container) {
    this._container = container;
    this._isStarted = false;
    this._initialized = [];
    this._computedInitOrder = null;
  }

  /**
   * Compute initialization order from dependency graph.
   * Fails immediately on cycles, missing deps, or orphans.
   * 
   * @returns {string[]} Ordered list of service names
   */
  _computeInitOrder() {
    if (this._computedInitOrder) {
      return this._computedInitOrder;
    }

    const graph = buildDependencyGraph(this._container);
    const report = graph.validate();

    if (!report.valid) {
      const errorMessages = report.errors.map(e => `  ✗ ${e.message}`).join('\n');
      throw new Error(
        `[DEPENDENCY GRAPH VALIDATION FAILED]\n` +
        `${errorMessages}\n` +
        `Startup aborted. No partial runtime.`
      );
    }

    this._computedInitOrder = report.startupOrder;
    console.log(`[Lifecycle] Computed init order: ${this._computedInitOrder.join(' → ')}`);
    console.log(`[Lifecycle] Graph hash: ${report.graphHash}`);

    return this._computedInitOrder;
  }

  /**
   * Validate wiring before initialization.
   * Aborts if any required service is missing.
   */
  _validateWiring() {
    validateWiring(this._container);
  }

  /**
   * Initialize all services in computed order.
   * 
   * Order is derived from dependency graph via topological sort.
   * No parallel initialization.
   * Each service must succeed before the next begins.
   */
  async initialize() {
    console.log('[Lifecycle] Initializing services');

    // Fail-fast: verify all required services are registered
    this._validateWiring();

    // Compute init order from dependency graph
    const initOrder = this._computeInitOrder();

    for (const name of initOrder) {
      try {
        console.log(`[Lifecycle] Initializing ${name}`);
        const service = this._container.resolve(name);
        if (service && typeof service.initialize === 'function') {
          await service.initialize();
        } else if (service && typeof service.health === 'function') {
          await service.health();
        }
        this._initialized.push(name);
        console.log(`[Lifecycle] ${name} initialized`);
      } catch (error) {
        console.error(`[Lifecycle] FATAL: ${name} initialization failed: ${error.message}`);
        console.error(`[Lifecycle] Startup aborted. Initialized: ${this._initialized.join(', ')}`);
        throw new Error(
          `[LIFECYCLE FAILURE] ${name} initialization failed: ${error.message}\n` +
          `Initialized before failure: ${this._initialized.join(', ')}\n` +
          `No partial runtime.`
        );
      }
    }

    console.log(`[Lifecycle] All ${initOrder.length} services initialized`);
  }

  /**
   * Start all services in deterministic order.
   */
  async start() {
    if (this._isStarted) {
      console.log('[Lifecycle] Already started');
      return;
    }

    console.log('[Lifecycle] Starting services');

    for (const { name, description } of START_ORDER) {
      try {
        console.log(`[Lifecycle] Starting ${name} — ${description}`);
        const service = this._container.resolve(name);
        if (service && typeof service.start === 'function') {
          await service.start();
        }
        console.log(`[Lifecycle] ${name} started`);
      } catch (error) {
        console.error(`[Lifecycle] FATAL: ${name} start failed: ${error.message}`);
        throw new Error(
          `[LIFECYCLE FAILURE] ${name} start failed: ${error.message}\n` +
          `No partial runtime.`
        );
      }
    }

    this._isStarted = true;
    console.log('[Lifecycle] Services started');
  }

  /**
   * Stop all services in reverse order.
   */
  async stop() {
    if (!this._isStarted) {
      console.log('[Lifecycle] Already stopped');
      return;
    }

    console.log('[Lifecycle] Stopping services');

    for (const { name, description } of SHUTDOWN_ORDER) {
      try {
        console.log(`[Lifecycle] Stopping ${name} — ${description}`);
        const service = this._container.resolve(name);
        if (service && typeof service.stop === 'function') {
          await service.stop();
        } else if (service && typeof service.shutdown === 'function') {
          await service.shutdown();
        }
        console.log(`[Lifecycle] ${name} stopped`);
      } catch (error) {
        console.error(`[Lifecycle] WARNING: ${name} stop failed: ${error.message}`);
        // Continue stopping other services
      }
    }

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

module.exports = { Lifecycle, START_ORDER, SHUTDOWN_ORDER };
