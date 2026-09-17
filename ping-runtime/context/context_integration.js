/**
 * Context Integration — PING Core v1
 *
 * Wires ContextCompiler into mission execution path.
 * This is the integration layer that adds ContextPack to WorkOrder input.
 */

const { ContextCompiler } = require('./context_compiler');

class ContextIntegration {
  constructor(options = {}) {
    this._contextCompiler = options.contextCompiler || null;
    this._externalAgentAdapter = options.externalAgentAdapter || null;
  }

  async issueWorkOrderWithContext({ missionId, query, correlationId, workOrderParams } = {}) {
    if (!this._contextCompiler) {
      throw new Error('ContextCompiler not configured');
    }

    const contextPack = await this._contextCompiler.compile({
      missionId,
      query,
      correlationId,
    });

    const enhancedInput = {
      context_pack_id: contextPack.context_pack_id,
      context_refs: {
        canonical_objects: contextPack.canonical_object_refs,
        artifacts: contextPack.artifact_refs,
        evidence: contextPack.evidence_refs,
        relationships: contextPack.relationship_refs,
      },
      task_input: workOrderParams.input || {},
    };

    if (this._externalAgentAdapter) {
      const workOrder = await this._externalAgentAdapter.issueWorkOrder({
        ...workOrderParams,
        contextPackId: contextPack.context_pack_id,
        input: enhancedInput,
      });
      return workOrder;
    }

    return {
      context_pack_id: contextPack.context_pack_id,
      input: enhancedInput,
    };
  }

  async health() {
    return {
      healthy: !!this._contextCompiler,
      contextCompiler: !!this._contextCompiler,
      externalAgentAdapter: !!this._externalAgentAdapter,
    };
  }
}

module.exports = { ContextIntegration };
