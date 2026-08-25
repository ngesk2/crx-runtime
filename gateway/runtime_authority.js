/**
 * Runtime Authority (minimal stub for compatibility)
 * Manages runtime context for replay and execution.
 *
 * PRESERVED: constitutional-convergence 563a4113 (EXACTLY_INTEGRATE)
 * Imported by: gateway/tool_gateway.js (dormant), test/ollama_replay.test.js
 */

let _nextContextId = 1;

class RuntimeAuthority {
  constructor() {
    // No internal state for now
  }

  /**
   * Create a runtime context.
   * @param {Object} input - Input object (may contain replayId)
   * @returns {Object} Context object with execution_id.
   */
  createRuntimeContext(input) {
    const executionId = _nextContextId++;
    return { execution_id: executionId };
  }

  /**
   * Clear runtime state.
   */
  clear() {
    _nextContextId = 1;
  }
}

// Singleton instance
const runtimeAuthority = new RuntimeAuthority();

module.exports = {
  runtimeAuthority,
};
