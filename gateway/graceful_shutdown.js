/**
 * Graceful Shutdown
 * 
 * Phase 3.13 — Graceful Shutdown
 * 
 * Before exit:
 * - Drain queues
 * - Flush pending embeddings
 * - Flush sqlite
 * - Close HTTP agent
 * - Close Qdrant
 * - Close watcher
 * 
 * No data loss.
 */

class GracefulShutdown {
  constructor(config = {}) {
    this._shutdownTimeout = config.shutdownTimeout || 30000; // 30 seconds
    this._handlers = new Map();
    this._isShuttingDown = false;
  }

  /**
   * Register shutdown handler
   */
  register(name, handler) {
    this._handlers.set(name, handler);
    console.log(`[GracefulShutdown] Registered handler: ${name}`);
  }

  /**
   * Unregister shutdown handler
   */
  unregister(name) {
    this._handlers.delete(name);
    console.log(`[GracefulShutdown] Unregistered handler: ${name}`);
  }

  /**
   * Setup signal handlers
   */
  setup() {
    console.log('[GracefulShutdown] Setting up signal handlers');

    process.on('SIGTERM', () => {
      console.log('[GracefulShutdown] SIGTERM received');
      this.shutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      console.log('[GracefulShutdown] SIGINT received');
      this.shutdown('SIGINT');
    });

    process.on('uncaughtException', (error) => {
      console.error('[GracefulShutdown] Uncaught exception:', error);
      this.shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[GracefulShutdown] Unhandled rejection:', reason);
      this.shutdown('unhandledRejection');
    });
  }

  /**
   * Execute shutdown
   */
  async shutdown(signal) {
    if (this._isShuttingDown) {
      console.log('[GracefulShutdown] Already shutting down');
      return;
    }

    this._isShuttingDown = true;
    console.log(`[GracefulShutdown] Starting shutdown (${signal})`);

    const startTime = Date.now();

    try {
      // Execute all handlers in order
      for (const [name, handler] of this._handlers) {
        const handlerStart = Date.now();

        try {
          console.log(`[GracefulShutdown] Executing handler: ${name}`);
          await Promise.race([
            handler(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Handler timeout')), this._shutdownTimeout)
            )
          ]);

          const duration = Date.now() - handlerStart;
          console.log(`[GracefulShutdown] Handler ${name} complete (${duration}ms)`);
        } catch (error) {
          const duration = Date.now() - handlerStart;
          console.error(`[GracefulShutdown] Handler ${name} failed (${duration}ms):`, error.message);
          // Continue with other handlers even if one fails
        }
      }

      const totalDuration = Date.now() - startTime;
      console.log(`[GracefulShutdown] Shutdown complete (${totalDuration}ms)`);

      // Exit process
      process.exit(0);
    } catch (error) {
      console.error('[GracefulShutdown] Shutdown error:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check if shutting down
   */
  isShuttingDown() {
    return this._isShuttingDown;
  }

  /**
   * Get handler count
   */
  getHandlerCount() {
    return this._handlers.size;
  }

  /**
   * Get handler names
   */
  getHandlerNames() {
    return Array.from(this._handlers.keys());
  }
}

module.exports = { GracefulShutdown };
