const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { runtimeIOAuthority } = require('./runtime_io_authority');
const { runtimeAuthority } = require('./runtime_authority');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { witnessAuthority } = require('./witness_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

/**
 * Tool Gateway
 * 
 * Phase 4.6 — Tool Gateway
 * 
 * Expose tools constitutionally using:
 * - Runtime IO Authority
 * - Runtime Context
 * - Runtime Authority
 * 
 * Flow:
 * Ollama
 *   ↓
 * tool request
 *   ↓
 * Gateway
 *   ↓
 * constitutional validation
 *   ↓
 * tool
 *   ↓
 * tool witness
 *   ↓
 * LLM
 */

class ToolGateway {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._ioAuthority = runtimeIOAuthority;
    this._runtimeAuthority = runtimeAuthority;
    this._failureAuthority = runtimeFailureAuthority;
    this._registeredTools = new Map();
    this._toolExecutionHistory = new Map();
    this._toolRuntimeMetadata = new Map();
    this._gatewayId = this._generateGatewayId();
  }

  /**
   * Register tool
   * @param {Object} toolData - Tool data
   * @param {string} toolData.tool_id - Tool ID
   * @param {string} toolData.tool_name - Tool name
   * @param {Function} toolData.handler - Tool handler function
   * @param {Object} toolData.schema - Tool schema
   * @returns {Object} Registered tool
   */
  registerTool(toolData) {
    const toolId = this._generateToolId(toolData.tool_name);
    
    const tool = {
      tool_id: toolId,
      tool_name: toolData.tool_name,
      handler: toolData.handler,
      schema: toolData.schema || {},
      gateway_id: this._gatewayId,
      tool_metadata: {
        created_by: 'ToolGateway',
        frozen: true,
        hash: null
      }
    };

    // Compute tool hash using WitnessAuthority (excluding handler)
    const toolForHash = { ...tool };
    delete toolForHash.handler;
    
    tool.tool_metadata.hash = witnessAuthority.createWitness(toolForHash, {
      authority: 'ToolGateway',
      authority_version: '4.0.0'
    }).witness_metadata.hash;
    
    // Runtime metadata is separate
    const runtimeMetadata = {
      tool_id: toolId,
      registered_at: constitutionalTimeAuthority.nowAsMillis(),
      gateway_id: this._gatewayId
    };
    
    this._registeredTools.set(toolId, tool);
    this._toolRuntimeMetadata.set(toolId, runtimeMetadata);

    return { tool, runtime_metadata };
  }

  /**
   * Execute tool
   * @param {Object} executionData - Execution data
   * @param {string} executionData.tool_id - Tool ID
   * @param {Object} executionData.parameters - Tool parameters
   * @param {string} executionData.replay_id - Replay ID
   * @param {Object} executionData.runtime_context - Runtime context
   * @returns {Object} Tool execution result with witness
   */
  async executeTool(executionData) {
    const tool = this._registeredTools.get(executionData.tool_id);
    
    if (!tool) {
      throw this._failureAuthority.createFailure(
        'TOOL_NOT_FOUND',
        'STATE_TRANSITION',
        { tool_id: executionData.tool_id }
      );
    }

    const executionId = this._generateExecutionId(
      executionData.tool_id,
      executionData.parameters,
      executionData.replay_id,
      executionData.runtime_context.execution_id
    );
    
    // Record tool request
    const ioOperation = this._ioAuthority.recordHTTPRequest(
      `tool://${tool.tool_name}`,
      'POST'
    );

    // Validate parameters against schema
    const validationResult = this._validateParameters(
      executionData.parameters,
      tool.schema
    );
    
    if (!validationResult.valid) {
      throw this._failureAuthority.createFailure(
        'TOOL_VALIDATION_FAILED',
        'STATE_TRANSITION',
        { 
          tool_id: executionData.tool_id,
          validation_errors: validationResult.errors
        }
      );
    }

    // Canonicalize parameters
    const canonicalParameters = this._canonicalizeParameters(executionData.parameters);

    // Execute tool with constitutional contract
    let toolResult;
    try {
      // Tool handler receives only runtimeContext and ioAuthority
      toolResult = await tool.handler({
        parameters: canonicalParameters,
        runtimeContext: executionData.runtime_context,
        ioAuthority: this._ioAuthority
      });
    } catch (error) {
      throw this._failureAuthority.createFailure(
        'TOOL_EXECUTION_FAILED',
        'STATE_TRANSITION',
        { 
          tool_id: executionData.tool_id,
          failure_code: 'TOOL_EXECUTION_FAILED'
        }
      );
    }

    // Record tool output
    const outputHash = CanonicalAuthority.hash(toolResult);

    // Create tool witness
    const toolWitness = this._createToolWitness({
      execution_id: executionId,
      tool_id: executionData.tool_id,
      tool_name: tool.tool_name,
      parameters: canonicalParameters,
      parameters_hash: CanonicalAuthority.hash(canonicalParameters),
      output: toolResult,
      output_hash: outputHash,
      io_operation: ioOperation,
      replay_id: executionData.replay_id,
      runtime_context: executionData.runtime_context
    });

    // Constitutional result (no runtime metadata)
    const constitutionalResult = {
      execution_id: executionId,
      tool_id: executionData.tool_id,
      tool_name: tool.tool_name,
      output: toolResult,
      output_hash: outputHash,
      tool_witness: toolWitness
    };
    
    // Runtime metadata is separate
    const runtimeMetadata = {
      execution_id: executionId,
      gateway_id: this._gatewayId,
      executed_at: constitutionalTimeAuthority.nowAsMillis()
    };

    this._toolExecutionHistory.set(executionId, constitutionalResult);
    this._toolRuntimeMetadata.set(executionId, runtimeMetadata);

    return { constitutional_result: constitutionalResult, runtime_metadata };
  }

  /**
   * Validate parameters against schema
   * @param {Object} parameters - Parameters to validate
   * @param {Object} schema - Tool schema
   * @returns {Object} Validation result
   */
  _validateParameters(parameters, schema) {
    const errors = [];

    if (!schema.properties) {
      return { valid: true, errors: [] };
    }

    for (const [key, propertySchema] of Object.entries(schema.properties)) {
      if (propertySchema.required && parameters[key] === undefined) {
        errors.push(`Missing required parameter: ${key}`);
      }

      if (parameters[key] !== undefined) {
        const type = typeof parameters[key];
        const expectedType = propertySchema.type;

        if (expectedType && type !== expectedType) {
          errors.push(`Parameter ${key} has wrong type: expected ${expectedType}, got ${type}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Canonicalize parameters
   * 
   * Constitutional Canonical Law:
   * - Array order is SEMANTIC (preserved as-is)
   * - Object order is CANONICALIZED (sorted by key)
   * 
   * This ensures deterministic hashing while preserving
   * semantic meaning of ordered collections.
   * 
   * @param {Object} parameters - Raw parameters
   * @returns {Object} Canonical parameters
   */
  _canonicalizeParameters(parameters) {
    const canonical = {};

    for (const key of Object.keys(parameters).sort()) {
      const value = parameters[key];
      
      if (typeof value === 'object' && value !== null) {
        // Arrays: preserve order (semantic)
        if (Array.isArray(value)) {
          canonical[key] = value.map(item => 
            typeof item === 'object' && item !== null 
              ? this._canonicalizeParameters(item) 
              : (typeof item === 'string' ? this._normalizeString(item) : item)
          );
        } else {
          // Objects: canonicalize key order
          canonical[key] = this._canonicalizeParameters(value);
        }
      } else if (typeof value === 'string') {
        canonical[key] = this._normalizeString(value);
      } else {
        canonical[key] = value;
      }
    }

    return canonical;
  }

  /**
   * Normalize string
   * @param {string} str - String to normalize
   * @returns {string} Normalized string
   */
  _normalizeString(str) {
    if (typeof str !== 'string') {
      str = String(str);
    }

    // UTF-8 normalization (NFC)
    str = str.normalize('NFC');

    // Normalize line endings
    str = str.replace(/\r\n/g, '\n');
    str = str.replace(/\r/g, '\n');

    // Normalize encoding only (never trim - changes user input)
    return str;
  }

  /**
   * Create tool witness
   * @param {Object} witnessData - Witness data
   * @returns {Object} Tool witness
   */
  _createToolWitness(witnessData) {
    const witness = {
      execution_id: witnessData.execution_id,
      tool_id: witnessData.tool_id,
      tool_name: witnessData.tool_name,
      parameters_hash: witnessData.parameters_hash,
      output_hash: witnessData.output_hash,
      replay_id: witnessData.replay_id,
      runtime_context_id: witnessData.runtime_context?.execution_id,
      witness_metadata: {
        created_by: 'ToolGateway',
        frozen: true,
        hash: null
      }
    };

    // Use WitnessAuthority for hashing (exclude gateway_id from constitutional witness)
    witness.witness_metadata.hash = witnessAuthority.createWitness(witness, {
      authority: 'ToolGateway',
      authority_version: '4.0.0'
    }).witness_metadata.hash;
    
    return witness;
  }

  /**
   * Verify tool witness
   * @param {Object} witness - Tool witness to verify
   * @returns {Object} Verification result
   */
  verifyToolWitness(witness) {
    // Use WitnessAuthority to verify (hashes copy with hash removed)
    return witnessAuthority.verifyWitness(witness);
  }

  /**
   * Verify tool replay equivalence
   * @param {Object} execution1 - First execution
   * @param {Object} execution2 - Second execution
   * @returns {Object} Verification result
   */
  verifyToolReplayEquivalence(execution1, execution2) {
    // Check tool ID
    if (execution1.tool_id !== execution2.tool_id) {
      return {
        valid: false,
        reason: 'Tool ID mismatch',
        execution1: execution1.tool_id,
        execution2: execution2.tool_id
      };
    }

    // Check output hash
    if (execution1.output_hash !== execution2.output_hash) {
      return {
        valid: false,
        reason: 'Output hash mismatch',
        execution1: execution1.output_hash,
        execution2: execution2.output_hash
      };
    }

    // Check tool witness hash
    if (execution1.tool_witness.witness_metadata.hash !== 
        execution2.tool_witness.witness_metadata.hash) {
      return {
        valid: false,
        reason: 'Tool witness hash mismatch',
        execution1: execution1.tool_witness.witness_metadata.hash,
        execution2: execution2.tool_witness.witness_metadata.hash
      };
    }

    return {
      valid: true,
      reason: 'Tool replay equivalence verified'
    };
  }

  /**
   * Get tool by ID
   * @param {string} toolId - Tool ID
   * @returns {Object} Tool
   */
  getTool(toolId) {
    return this._registeredTools.get(toolId);
  }

  /**
   * Get tool by name
   * @param {string} toolName - Tool name
   * @returns {Object} Tool
   */
  getToolByName(toolName) {
    for (const tool of this._registeredTools.values()) {
      if (tool.tool_name === toolName) {
        return tool;
      }
    }
    return null;
  }

  /**
   * Get execution by ID
   * @param {string} executionId - Execution ID
   * @returns {Object} Execution result
   */
  getExecution(executionId) {
    return this._toolExecutionHistory.get(executionId);
  }

  /**
   * Get all registered tools
   * @returns {Array} Array of tools
   */
  getAllTools() {
    return Array.from(this._registeredTools.values());
  }

  /**
   * Get gateway ID
   * @returns {string} Gateway ID
   */
  getGatewayId() {
    return this._gatewayId;
  }

  /**
   * Clear history (for testing)
   */
  clear() {
    this._toolExecutionHistory.clear();
    this._registeredTools.clear();
    this._toolRuntimeMetadata.clear();
  }

  /**
   * Generate tool ID
   * @param {string} toolName - Tool name
   * @returns {string} Tool ID
   */
  _generateToolId(toolName) {
    // Tool ID should derive from tool name only (not gateway_id which is runtime identity)
    const toolData = {
      tool_name: toolName
    };
    const hash = CanonicalAuthority.hash(toolData);
    return `tool_${hash.substring(0, 16)}`;
  }

  /**
   * Generate execution ID from constitutional data
   * @param {string} toolId - Tool ID
   * @param {Object} parameters - Tool parameters
   * @param {string} replayId - Replay ID
   * @param {string} runtimeContextId - Runtime context ID
   * @returns {string} Execution ID
   */
  _generateExecutionId(toolId, parameters, replayId, runtimeContextId) {
    const parametersHash = CanonicalAuthority.hash(parameters);
    const executionData = {
      tool_id: toolId,
      parameters_hash: parametersHash,
      replay_id: replayId,
      runtime_context_id: runtimeContextId
    };
    const hash = CanonicalAuthority.hash(executionData);
    return `tool_exec_${hash.substring(0, 16)}`;
  }

  /**
   * Generate gateway ID
   * @returns {string} Gateway ID
   */
  _generateGatewayId() {
    const gatewayData = {
      gateway_version: '4.0.0',
      constitutional_version: '4.0.0'
    };
    const hash = CanonicalAuthority.hash(gatewayData);
    return `tool_gateway_${hash.substring(0, 16)}`;
  }
}

// Singleton instance
const toolGateway = new ToolGateway();

module.exports = { ToolGateway, toolGateway };
