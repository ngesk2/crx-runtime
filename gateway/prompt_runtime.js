/**
 * Prompt Runtime
 * 
 * Milestone 7 — Prompt Runtime
 * 
 * Constitutional Constraint: Introduce Prompt Object.
 * 
 * Pipeline:
 * Knowledge
 *       ↓
 * Mission Context
 *       ↓
 * Prompt Object
 *       ↓
 * CanonicalBytes
 *       ↓
 * Prompt Hash
 *       ↓
 * Identity
 *       ↓
 * Witness
 *       ↓
 * Certificate
 * 
 * Prompt evolution now becomes replayable.
 */

const { PromptObject, ReflectionObject } = require('./prompt_objects');
const { constitutionalVerificationAuthority } = require('../ping-runtime/evidence/constitutional_verification_authority');

class PromptRuntime {
  constructor() {
    this._namespace = 'prompt';
    this._version = '1.0.0';
  }

  /**
   * Generate prompt from knowledge graph and mission context
   * 
   * @param {Object} knowledgeGraph - Knowledge graph object
   * @param {Object} missionContext - Mission context
   * @param {string} template - Prompt template
   * @param {Object} variables - Template variables
   * @returns {Object} Prompt object
   */
  generatePrompt(knowledgeGraph, missionContext, template, variables) {
    // Build prompt object
    const promptBuilder = new PromptObject(missionContext, knowledgeGraph.id, template, variables);
    const promptObject = promptBuilder.build();

    // Verify prompt
    const promptVerification = constitutionalVerificationAuthority.verifyArtifact(promptObject);
    if (!promptVerification.valid) {
      throw new Error(`Prompt verification failed: ${promptVerification.reason}`);
    }

    return promptObject;
  }

  /**
   * Generate reflection from prompt and LLM response
   * 
   * @param {Object} promptObject - Prompt object
   * @param {string} llmResponse - LLM response
   * @param {string} llmModel - LLM model name
   * @param {Object} llmParameters - LLM parameters
   * @returns {Object} Reflection object
   */
  generateReflection(promptObject, llmResponse, llmModel, llmParameters) {
    // Build reflection object
    const reflectionBuilder = new ReflectionObject(promptObject.id, llmResponse, llmModel, llmParameters);
    const reflectionObject = reflectionBuilder.build();

    // Verify reflection
    const reflectionVerification = constitutionalVerificationAuthority.verifyArtifact(reflectionObject);
    if (!reflectionVerification.valid) {
      throw new Error(`Reflection verification failed: ${reflectionVerification.reason}`);
    }

    return reflectionObject;
  }

  /**
   * Create analysis prompt template
   * @param {Object} knowledgeGraph - Knowledge graph
   * @returns {string} Analysis template
   */
  createAnalysisTemplate(knowledgeGraph) {
    return `Analyze the following codebase knowledge graph:

Knowledge Graph ID: {{knowledge_graph_id}}
Node Count: {{node_count}}
Edge Count: {{edge_count}}
Topology Hash: {{topology_hash}}

Please provide:
1. Overall architecture summary
2. Key components and their relationships
3. Potential issues or improvements
4. Code quality assessment`;
  }

  /**
   * Create summary prompt template
   * @param {Object} knowledgeGraph - Knowledge graph
   * @returns {string} Summary template
   */
  createSummaryTemplate(knowledgeGraph) {
    return `Summarize the following codebase:

Knowledge Graph ID: {{knowledge_graph_id}}
Total Functions: {{function_count}}
Total Classes: {{class_count}}
Total Interfaces: {{interface_count}}

Provide a concise summary of the codebase purpose and structure.`;
  }

  /**
   * Extract variables from knowledge graph for template
   * @param {Object} knowledgeGraph - Knowledge graph
   * @returns {Object} Template variables
   */
  extractVariables(knowledgeGraph) {
    const payload = knowledgeGraph.payload;
    
    // Count node types
    const functionCount = payload.nodes.filter(n => n.kind === 'FunctionKnowledge').length;
    const classCount = payload.nodes.filter(n => n.kind === 'ClassKnowledge').length;
    const interfaceCount = payload.nodes.filter(n => n.kind === 'InterfaceKnowledge').length;

    return {
      knowledge_graph_id: knowledgeGraph.id,
      node_count: payload.node_count,
      edge_count: payload.edge_count,
      topology_hash: payload.topology_hash,
      function_count: functionCount,
      class_count: classCount,
      interface_count: interfaceCount,
    };
  }
}

module.exports = { PromptRuntime };
