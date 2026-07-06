/**
 * Console Event Port
 *
 * Phase 3.2.5 — Constitutional OSS Continuation
 *
 * Console implementation of EventPort.
 *
 * Constitutional Constraint:
 * - Only this adapter may use console.log
 * - All infrastructure emits through EventPort
 */

const { EventPort } = require('./event_port');

class ConsoleEventPort extends EventPort {
  emit(level, source, data) {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] [${level.toUpperCase()}] [${source}] ${JSON.stringify(data)}`;
    
    switch (level) {
      case 'info':
        console.log(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
        console.error(message);
        break;
      default:
        console.log(message);
    }
  }
}

// Singleton instance
const consoleEventPort = new ConsoleEventPort();

module.exports = { ConsoleEventPort, consoleEventPort };
