/**
 * Rollback Coordinator
 * 
 * Phase 4.4 — ExecutionRuntime Refactoring
 * 
 * Responsible for:
 * - Tracking executed infrastructure calls
 * - Executing compensating actions on failure
 * - Coordinating rollback in reverse order
 * 
 * Pipeline:
 * Failed Lifecycle → Reverse Order Rollback → Compensating Actions
 */

class RollbackCoordinator {
  constructor(infrastructureRegistry) {
    this._infrastructureRegistry = infrastructureRegistry;
  }

  /**
   * Rollback execution (compensating actions for failed lifecycle)
   */
  async rollback(executedCalls, artifactContext) {
    console.log('[RollbackCoordinator] Starting rollback...');
    
    const rollbackResults = [];

    // Execute compensating actions in reverse order
    for (let i = executedCalls.length - 1; i >= 0; i--) {
      const { call, result } = executedCalls[i];
      
      try {
        const rollbackResult = await this._executeCompensatingAction(call, result);
        rollbackResults.push({
          call: call,
          status: 'success',
          result: rollbackResult,
        });
        console.log(`[RollbackCoordinator] Rolled back: ${call.operation} on ${call.params[0]}`);
      } catch (rollbackError) {
        rollbackResults.push({
          call: call,
          status: 'failed',
          error: rollbackError.message,
        });
        console.error(`[RollbackCoordinator] Rollback failed for ${call.operation}:`, rollbackError);
        // Continue with other rollbacks even if one fails
      }
    }
    
    console.log('[RollbackCoordinator] Rollback completed');
    
    return {
      success: rollbackResults.every(r => r.status === 'success'),
      results: rollbackResults,
    };
  }

  /**
   * Execute compensating action for a failed call
   */
  async _executeCompensatingAction(call, result) {
    // If the call was a save operation, attempt to delete
    if (call.operation === 'save') {
      const adapter = this._infrastructureRegistry.resolve(call.adapter);
      if (adapter && adapter.delete) {
        return await adapter.delete(call.params[0], call.params[1]);
      }
    }

    // If the call was a publish operation, attempt to retract
    if (call.operation === 'publish') {
      const adapter = this._infrastructureRegistry.resolve(call.adapter);
      if (adapter && adapter.retract) {
        return await adapter.retract(call.params[0], call.params[1]);
      }
    }

    // If the call was an embed operation, mark for cleanup
    if (call.operation === 'embed') {
      // Vector cleanup would be handled by a separate cleanup job
      return { status: 'marked_for_cleanup' };
    }

    // Default: no compensating action available
    return { status: 'no_compensating_action' };
  }

  /**
   * Check health
   */
  async health() {
    return {
      healthy: true,
      message: 'Rollback coordinator operational',
    };
  }
}

module.exports = { RollbackCoordinator };
