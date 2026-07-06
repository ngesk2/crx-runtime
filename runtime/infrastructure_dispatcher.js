/**
 * Infrastructure Dispatcher
 * 
 * Phase 4.4 — ExecutionRuntime Refactoring
 * 
 * Responsible for:
 * - Resolving adapters from InfrastructureRegistry
 * - Executing infrastructure calls
 * - Hydrating adapter results back into artifacts
 * 
 * Pipeline:
 * Infrastructure Contract → Adapter → Result → Hydration
 */

class InfrastructureDispatcher {
  constructor(infrastructureRegistry, canonicalAuthority) {
    this._infrastructureRegistry = infrastructureRegistry;
    this._canonicalAuthority = canonicalAuthority;
  }

  /**
   * Execute infrastructure call with output hydration
   */
  async execute(infraCall, artifactContext) {
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
      this._hydrateOutput(infraCall, result, artifactContext);
    }

    return result;
  }

  /**
   * Hydrate infrastructure output back into artifact
   */
  _hydrateOutput(infraCall, result, artifactContext) {
    const artifact = artifactContext.get(infraCall.artifact_id);
    
    if (!artifact) {
      console.warn(`[InfrastructureDispatcher] Artifact not found for hydration: ${infraCall.artifact_id}`);
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

    console.log(`[InfrastructureDispatcher] Hydrated ${infraCall.target_path} on artifact ${infraCall.artifact_id}`);
  }

  /**
   * Check health
   */
  async health() {
    return {
      healthy: true,
      message: 'Infrastructure dispatcher operational',
    };
  }
}

module.exports = { InfrastructureDispatcher };
