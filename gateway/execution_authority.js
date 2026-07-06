/**
 * Execution Authority
 * 
 * Phase 45 Patch 45.6 — Pure Authority Dispatch
 * 
 * Constitutional Constraint: ExecutionAuthority is pure authority dispatch.
 * 
 * Moved to SequenceAuthority:
 * - sequential execution
 * - artifact passing between steps
 * - sequence failure handling
 * 
 * Moved to ParallelExecutionAuthority:
 * - parallel execution
 * - result aggregation
 * 
 * Moved to EventRoutingAuthority:
 * - event emission
 * - event routing
 * 
 * Removed:
 * - runtime cache (this._executions Map)
 * - witness routing (delegated to WitnessAuthority)
 * - event emission (delegated to EventRoutingAuthority)
 * - sequencing (delegated to SequenceAuthority)
 * - parallel execution (delegated to ParallelExecutionAuthority)
 * 
 * ExecutionAuthority now provides only:
 * - ExecutionRequest → Authority dispatch → ExecutionResult
 * - Witness forwarding to WitnessAuthority
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');
const { witnessAuthority } = require('./witness_authority');

class ExecutionAuthority {
  constructor(authorityRegistry, eventRoutingAuthority) {
    this._authorityRegistry = authorityRegistry;
    this._eventRouting = eventRoutingAuthority;
    this._witnessAuthority = witnessAuthority;
    this._constitutionalVersion = '45.6.0';
  }

  /**
   * Initialize execution authority
   */
  async initialize() {
    console.log('[ExecutionAuthority] Initializing execution authority');
    console.log('[ExecutionAuthority] Execution authority initialized');
  }

  /**
   * Execute authority (pure dispatch, no cache)
   * 
   * @param {string} authorityId - Authority to execute
   * @param {Object} node - Execution node
   * @param {Object} inputArtifacts - Input artifacts
   * @returns {Object} Execution result
   */
  async executeAuthority(authorityId, node, inputArtifacts) {
    console.log(`[ExecutionAuthority] Executing authority: ${authorityId}`);

    const executionId = identityAuthority.generateId('execution', {
      authority_id: authorityId,
      node_id: node.node_id,
      timestamp: constitutionalTimeAuthority.now(),
    });

    try {
      // Emit execution started event (delegated to EventRoutingAuthority)
      await this._eventRouting.emitExecutionStarted(executionId, authorityId, node.node_id);

      // Get authority implementation module from registry
      const implementationModule = this._authorityRegistry.getImplementationModule(authorityId);
      if (!implementationModule) {
        throw new Error(`Authority implementation not found: ${authorityId}`);
      }

      // Load authority class (ExecutionRuntime should instantiate)
      const AuthorityClass = require(implementationModule);
      const authority = new AuthorityClass();

      // Execute authority - authority returns ConstitutionalResult
      const constitutionalResult = await authority.execute(node, inputArtifacts);

      // Forward to WitnessAuthority for witness generation
      const witness = this._witnessAuthority.createWitnessFromConstitutionalResult(constitutionalResult);

      // Emit execution completed event (delegated to EventRoutingAuthority)
      const artifactIds = constitutionalResult.artifacts ? constitutionalResult.artifacts.map(a => a.artifact_id) : [];
      await this._eventRouting.emitExecutionCompleted(
        executionId,
        authorityId,
        node.node_id,
        {
          success: constitutionalResult.success,
          artifact_ids: artifactIds,
          witness_hash: witness.witness_metadata.hash
        }
      );

      console.log(`[ExecutionAuthority] Execution completed: ${executionId}`);
      return {
        success: true,
        execution_id: executionId,
        result: constitutionalResult,
        witness: witness
      };
    } catch (error) {
      console.error(`[ExecutionAuthority] Execution failed:`, error.message);

      // Emit execution failed event (delegated to EventRoutingAuthority)
      await this._eventRouting.emitExecutionFailed(executionId, authorityId, node.node_id, error.message);

      return {
        success: false,
        execution_id: executionId,
        error: error.message,
      };
    }
  }




  /**
   * Check health
   */
  async health() {
    return {
      healthy: true,
      message: 'Execution authority operational (pure dispatch)',
    };
  }

  /**
   * Publish contract
   */
  publishContract() {
    return {
      authority_id: 'execution-authority',
      authority_name: 'ExecutionAuthority',
      version: '45.6.0',
      consumes: ['ExecutionRequest'],
      produces: ['ExecutionResult'],
      replay_inputs: ['AuthorityVersion', 'NodeHash', 'InputArtifactHashes'],
      requires: ['authority_registry', 'event_routing_authority', 'witness_authority'],
      guarantees: ['pure_dispatch', 'no_cache', 'no_sequencing', 'no_parallel_execution', 'no_event_emission', 'authority_invocation_only'],
      failure_modes: ['authority_not_found', 'execution_error'],
      rollback: 'none',
      determinism: 'deterministic_dispatch',
      constitutional_outputs: ['inputs', 'outputs', 'input_hash', 'output_hash', 'execution_id', 'metadata']
    };
  }
}

module.exports = { ExecutionAuthority };
