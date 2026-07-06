/**
 * Execution Runtime
 * 
 * Phase 3.0 — Execution Runtime
 * 
 * The constitutional operating system:
 * 1. Execute authority
 * 2. Receive contract
 * 3. Execute adapter calls
 * 4. Persist artifacts
 * 5. Run verification
 * 6. Run witness
 * 7. Run certification
 * 8. Run publication
 * 9. Emit events
 * 10. Return immutable execution report
 * 
 * Pipeline:
 * Mission → ExecutionPlanner → ExecutionAuthority → AuthorityRegistry → 
 * Domain Authority → ExecutionRuntime → Adapters → Infrastructure
 * 
 * PATCH_008: Moved to runtime/kernel/execution/
 */

const { constitutionalTimeAuthority } = require('./kernel/authorities/constitutional_time_authority');
const { deterministicIdAuthority } = require('./kernel/authorities/deterministic_id_authority');
const { CanonicalAuthority } = require('./kernel/authorities/canonical_authority');
const { InfrastructureRegistry } = require('./infrastructure_registry');
const { EventCatalog } = require('./event_catalog');
const { InfrastructureDispatcher } = require('./infrastructure_dispatcher');
const { ArtifactPipeline } = require('./artifact_pipeline');
const { RollbackCoordinator } = require('./rollback_coordinator');

class ExecutionRuntime {
  constructor(container) {
    this._container = container;
    this._infrastructureRegistry = new InfrastructureRegistry();
    this._eventCatalog = new EventCatalog();
    this._canonicalAuthority = CanonicalAuthority;
    this._infrastructureDispatcher = new InfrastructureDispatcher(this._infrastructureRegistry, CanonicalAuthority);
    this._artifactPipeline = new ArtifactPipeline(CanonicalAuthority);
    this._rollbackCoordinator = new RollbackCoordinator(this._infrastructureRegistry);
    this._executions = new Map(); // execution_id → execution report
  }

  /**
   * Initialize execution runtime
   */
  async initialize() {
    console.log('[ExecutionRuntime] Initializing execution runtime');
    
    // Register adapters from container
    const adapters = this._container.getAdapters();
    for (const [name, adapter] of adapters) {
      this._infrastructureRegistry.register(name, adapter);
    }
    
    console.log('[ExecutionRuntime] Execution runtime initialized');
  }

  /**
   * Register adapter
   * 
   * @param {string} name - Adapter name
   * @param {Object} adapter - Adapter instance
   */
  registerAdapter(name, adapter) {
    this._infrastructureRegistry.register(name, adapter);
  }

  /**
   * Register event schema
   * 
   * @param {string} eventType - Event type
   * @param {Object} schema - Event schema
   */
  registerEventSchema(eventType, schema) {
    this._eventCatalog.register(eventType, schema);
  }

  /**
   * Execute authority and process contract
   * 
   * @param {string} authorityId - Authority to execute
   * @param {Object} node - Execution node
   * @param {Object} inputArtifacts - Input artifacts
   * @returns {Object} Execution report
   */
  async execute(authorityId, node, inputArtifacts) {
    console.log(`[ExecutionRuntime] Executing authority: ${authorityId}`);

    const executionId = deterministicIdAuthority.generateIdFromObject({
      authority_id: authorityId,
      node_id: node.node_id,
      timestamp: constitutionalTimeAuthority.now(),
    });

    const executionReport = {
      execution_id: executionId,
      authority_id: authorityId,
      node_id: node.node_id,
      status: 'running',
      started_at: constitutionalTimeAuthority.now(),
      completed_at: null,
      contract: null,
      infrastructure_calls: [],
      artifacts: [],
      errors: [],
    };

    try {
      // Step 1: Execute authority (returns contract)
      const authority = this._container.getAuthority(authorityId);
      if (!authority) {
        throw new Error(`Authority not found: ${authorityId}`);
      }

      const contract = await authority.execute(node, inputArtifacts);
      executionReport.contract = contract;

      // Track artifacts for hydration and rollback
      const artifactContext = new Map();
      const executedInfrastructureCalls = []; // For rollback

      if (contract.artifacts && contract.artifacts.length > 0) {
        for (const artifact of contract.artifacts) {
          artifactContext.set(artifact.artifact_id, artifact);
        }
      }

      try {
        // Step 2: Execute infrastructure calls from contract (delegated to InfrastructureDispatcher)
        if (contract.infrastructure && contract.infrastructure.length > 0) {
          for (const infraCall of contract.infrastructure) {
            const result = await this._infrastructureDispatcher.execute(infraCall, artifactContext);
            executedInfrastructureCalls.push({ call: infraCall, result: result });
            executionReport.infrastructure_calls.push({
              call: infraCall,
              result: result,
            });
          }
        }

        // Step 3: Process artifact lifecycle (delegated to ArtifactPipeline)
        if (contract.artifacts && contract.artifacts.length > 0) {
          for (const artifact of contract.artifacts) {
            // Use hydrated artifact if available
            const hydratedArtifact = artifactContext.get(artifact.artifact_id) || artifact;
            const processedArtifact = await this._artifactPipeline.process(hydratedArtifact);
            executionReport.artifacts.push(processedArtifact.artifact_id);
          }
        }

        // Step 4: Process lineage lifecycle (validate DAG, persist, reject cycles)
        if (contract.lineage && contract.lineage.length > 0) {
          await this._processLineageLifecycle(contract.lineage);
        }

        // Step 5: Process witness requests
        if (contract.witnesses && contract.witnesses.length > 0) {
          for (const witnessRequest of contract.witnesses) {
            await this._processWitnessRequest(witnessRequest, artifactContext);
          }
        }

        // Step 6: Process certification requests
        if (contract.certifications && contract.certifications.length > 0) {
          for (const certificationRequest of contract.certifications) {
            await this._processCertificationRequest(certificationRequest, artifactContext);
          }
        }

        // Step 7: Process publication requests
        if (contract.publications && contract.publications.length > 0) {
          for (const publicationRequest of contract.publications) {
            await this._processPublicationRequest(publicationRequest, artifactContext);
          }
        }

        // Step 8: Emit events (validate through EventCatalog, publish)
        if (contract.events && contract.events.length > 0) {
          for (const event of contract.events) {
            await this._emitEvent(event);
          }
        }

        executionReport.status = 'completed';
        executionReport.completed_at = constitutionalTimeAuthority.now();

        console.log(`[ExecutionRuntime] Execution completed: ${executionId}`);
      } catch (lifecycleError) {
        // Lifecycle step failed - attempt rollback (delegated to RollbackCoordinator)
        console.error(`[ExecutionRuntime] Lifecycle failed, attempting rollback: ${executionId}`, lifecycleError);
        
        const rollbackResult = await this._rollbackCoordinator.rollback(executedInfrastructureCalls, artifactContext);
        
        executionReport.status = 'failed';
        executionReport.completed_at = constitutionalTimeAuthority.now();
        executionReport.errors.push(lifecycleError.message);
        executionReport.rollback_attempted = true;
        executionReport.rollback_result = rollbackResult;
      }
    } catch (error) {
      console.error(`[ExecutionRuntime] Execution failed:`, error.message);

      executionReport.status = 'failed';
      executionReport.completed_at = constitutionalTimeAuthority.now();
      executionReport.errors.push(error.message);
    }

    // Freeze execution report for immutability
    this._executions.set(executionId, this._freeze(executionReport));

    return executionReport;
  }

  /**
   * Execute infrastructure call with output hydration
   */
  async _executeInfrastructureCall(infraCall, artifactContext) {
    // Use InfrastructureRegistry to resolve adapter
    const adapter = this._infrastructureRegistry.resolve(infraCall.adapter);
    
    if (!adapter) {
      throw new Error(`Adapter not found: ${infraCall.adapter}`);
    }

    const method = adapter[infraCall.operation];
    
    if (typeof method !== 'function') {
      throw new Error(`Adapter method not found: ${infraCall.adapter}.${infraCall.operation}`);
    }

    const result = await method.apply(adapter, infraCall.params || []);

    // If target_path is specified, hydrate the result back into the artifact
    if (infraCall.target_path && infraCall.artifact_id) {
      await this._hydrateInfrastructureOutput(infraCall, result, artifactContext);
    }

    return result;
  }

  /**
   * Hydrate infrastructure output back into artifact
   */
  async _hydrateInfrastructureOutput(infraCall, result, artifactContext) {
    const artifact = artifactContext.get(infraCall.artifact_id);
    
    if (!artifact) {
      console.warn(`[ExecutionRuntime] Artifact not found for hydration: ${infraCall.artifact_id}`);
      return;
    }

    // Parse target_path (e.g., "embeddings[3].vector")
    const pathParts = infraCall.target_path.split('.');
    
    let current = artifact;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
      
      if (arrayMatch) {
        const arrayName = arrayMatch[1];
        const index = parseInt(arrayMatch[2]);
        if (!current[arrayName]) {
          current[arrayName] = [];
        }
        if (!current[arrayName][index]) {
          current[arrayName][index] = {};
        }
        current = current[arrayName][index];
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }

    // Set the final value
    const finalPart = pathParts[pathParts.length - 1];
    const arrayMatch = finalPart.match(/(\w+)\[(\d+)\]/);
    
    if (arrayMatch) {
      const arrayName = arrayMatch[1];
      const index = parseInt(arrayMatch[2]);
      if (!current[arrayName]) {
        current[arrayName] = [];
      }
      current[arrayName][index] = result;
    } else {
      current[finalPart] = result;
    }

    console.log(`[ExecutionRuntime] Hydrated ${infraCall.target_path} on artifact ${infraCall.artifact_id}`);
  }

  /**
   * Process artifact lifecycle (Builder → Freeze → Hash → Verify → Witness → Certify → Publish → Persist)
   * DELEGATED to ArtifactPipeline
   */
  async _processArtifactLifecycle(artifact) {
    // This method is now handled by ArtifactPipeline
    // Kept for backward compatibility during transition
    return await this._artifactPipeline.process(artifact);
  }

  /**
   * Process lineage lifecycle (validate DAG, persist, reject cycles)
   */
  async _processLineageLifecycle(lineage) {
    const lineageGraph = new Map();

    // Build lineage graph
    for (const edge of lineage) {
      if (!lineageGraph.has(edge.parent_artifact_id)) {
        lineageGraph.set(edge.parent_artifact_id, []);
      }
      lineageGraph.get(edge.parent_artifact_id).push(edge.child_artifact_id);
    }

    // Detect cycles
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (nodeId) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const children = lineageGraph.get(nodeId) || [];
      for (const childId of children) {
        if (!visited.has(childId)) {
          if (hasCycle(childId)) {
            return true;
          }
        } else if (recursionStack.has(childId)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const parentId of lineageGraph.keys()) {
      if (!visited.has(parentId)) {
        if (hasCycle(parentId)) {
          throw new Error(`Lineage cycle detected involving artifact: ${parentId}`);
        }
      }
    }

    // Persistence is handled via infrastructure contracts from authorities
    // Runtime no longer directly persists lineage edges
  }

  /**
   * Process witness request
   */
  async _processWitnessRequest(witnessRequest, artifactContext) {
    const witnessAuthority = this._container.getAuthority('witness-authority');
    
    if (witnessAuthority) {
      const contract = await witnessAuthority.createWitness(witnessRequest.data, witnessRequest.metadata);
      
      // Process witness contract using InfrastructureDispatcher
      if (contract.infrastructure && contract.infrastructure.length > 0) {
        for (const infraCall of contract.infrastructure) {
          await this._infrastructureDispatcher.execute(infraCall, artifactContext);
        }
      }
    }
  }

  /**
   * Process certification request
   */
  async _processCertificationRequest(certificationRequest, artifactContext) {
    const certificationAuthority = this._container.getAuthority('certification-authority');
    
    if (certificationAuthority) {
      const contract = await certificationAuthority.certify(certificationRequest.artifact);
      
      // Process certification contract using InfrastructureDispatcher
      if (contract.infrastructure && contract.infrastructure.length > 0) {
        for (const infraCall of contract.infrastructure) {
          await this._infrastructureDispatcher.execute(infraCall, artifactContext);
        }
      }
    }
  }

  /**
   * Process publication request
   */
  async _processPublicationRequest(publicationRequest, artifactContext) {
    const publicationAuthority = this._container.getAuthority('publication-authority');
    
    if (publicationAuthority) {
      const contract = await publicationAuthority.publish(publicationRequest.artifact, publicationRequest.certification);
      
      // Process publication contract using InfrastructureDispatcher
      if (contract.infrastructure && contract.infrastructure.length > 0) {
        for (const infraCall of contract.infrastructure) {
          await this._infrastructureDispatcher.execute(infraCall, artifactContext);
        }
      }
    }
  }

  /**
   * Emit event (validate through EventCatalog, publish)
   */
  async _emitEvent(event) {
    // Validate event schema through EventCatalog
    const validation = this._eventCatalog.validate(event.type, event.payload);
    
    if (!validation.valid) {
      throw new Error(`Event validation failed for ${event.type}: ${validation.errors.join(', ')}`);
    }

    // Publish event through NATS
    const natsAdapter = this._infrastructureRegistry.resolve('nats');
    
    if (natsAdapter) {
      await natsAdapter.publish(event.type, event.payload);
    }
  }

  /**
   * Rollback execution (compensating actions for failed lifecycle)
   */
  async _rollbackExecution(executedCalls, artifactContext) {
    console.log('[ExecutionRuntime] Starting rollback...');
    
    // Execute compensating actions in reverse order
    for (let i = executedCalls.length - 1; i >= 0; i--) {
      const { call, result } = executedCalls[i];
      
      try {
        // If the call was a save operation, attempt to delete
        if (call.operation === 'save') {
          const adapter = this._infrastructureRegistry.resolve(call.adapter);
          if (adapter && adapter.delete) {
            await adapter.delete(call.params[0], call.params[1]);
            console.log(`[ExecutionRuntime] Rolled back: ${call.operation} on ${call.params[0]}`);
          }
        }
      } catch (rollbackError) {
        console.error(`[ExecutionRuntime] Rollback failed for ${call.operation}:`, rollbackError);
        // Continue with other rollbacks even if one fails
      }
    }
    
    console.log('[ExecutionRuntime] Rollback completed');
  }

  /**
   * Freeze object for immutability
   */
  _freeze(obj) {
    const freeze = (o) => {
      if (o === null || typeof o !== 'object') {
        return o;
      }

      if (Array.isArray(o)) {
        return Object.freeze(o.map(item => freeze(item)));
      }

      Object.keys(o).forEach(key => {
        o[key] = freeze(o[key]);
      });

      return Object.freeze(o);
    };

    return freeze(obj);
  }

  /**
   * Get execution report
   * 
   * @param {string} executionId - Execution ID
   * @returns {Object} Execution report
   */
  getExecution(executionId) {
    return this._executions.get(executionId);
  }

  /**
   * Get all executions
   * 
   * @returns {Array} Execution reports
   */
  getAllExecutions() {
    return Array.from(this._executions.values());
  }

  /**
   * Check health (aggregate health from all components)
   */
  async health() {
    const healthChecks = [];

    // Check infrastructure registry health
    const infraHealth = this._infrastructureRegistry.health();
    healthChecks.push({
      component: 'infrastructure_registry',
      health: infraHealth,
    });

    // Check event catalog health
    const eventCatalogHealth = this._eventCatalog.health();
    healthChecks.push({
      component: 'event_catalog',
      health: eventCatalogHealth,
    });

    // Check container health
    const containerHealth = await this._container.health();
    healthChecks.push({
      component: 'di_container',
      health: containerHealth,
    });

    const allHealthy = healthChecks.every(h => h.health.healthy);

    return {
      healthy: allHealthy,
      message: allHealthy ? 'Execution runtime operational' : 'Execution runtime degraded',
      active_executions: this._executions.size,
      components: healthChecks,
    };
  }
}

module.exports = { ExecutionRuntime };
