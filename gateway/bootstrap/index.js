/**
 * Bootstrap Entry Point
 *
 * Phase 2.7.1 — Constitutional Boundary Collapse
 *
 * Replaces SecondBrain as the application entry point.
 *
 * Constitutional Constraint:
 * - No orchestration class
 * - Bootstrap owns construction and lifecycle
 * - Services receive dependencies via container
 */

const { wireContainer } = require('./wiring');
const { Lifecycle } = require('./lifecycle');

/**
 * Bootstrap the application
 * @param {Object} config - Configuration
 * @returns {Object} Bootstrap instance
 */
function bootstrap(config = {}) {
  const container = wireContainer(config);
  const lifecycle = new Lifecycle(container);

  return {
    container,
    lifecycle,

    async initialize() {
      await lifecycle.initialize();
    },

    async start() {
      await lifecycle.start();
    },

    async stop() {
      await lifecycle.stop();
    },

    isStarted() {
      return lifecycle.isStarted();
    },

    resolve(name) {
      return container.resolve(name);
    }
  };
}

module.exports = { bootstrap };
