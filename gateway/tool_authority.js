/**
 * Tool Authority
 * 
 * Refactor 6 — Tool Authority for Inference
 * 
 * Pipeline:
 * Mission → Tool Authority → Tool Manifest → Inference
 * 
 * Separates tool management from Inference Authority.
 * Tools are registered, permission-checked, and executed through this authority.
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');

class ToolAuthority {
  constructor(postgresPool, permissionAuthority) {
    this._postgres = postgresPool;
    this._permissionAuthority = permissionAuthority;
    this._tools = new Map(); // tool_id → tool descriptor
    this._toolCategories = new Map(); // category → Set<tool_id>
  }

  /**
   * Initialize tool authority
   */
  async initialize() {
    console.log('[ToolAuthority] Initializing tool authority');

    // Load tool descriptors
    await this._loadToolDescriptors();

    console.log('[ToolAuthority] Tool authority initialized');
  }

  /**
   * Register tool
   * 
   * @param {Object} toolDescriptor - Tool descriptor
   */
  registerTool(toolDescriptor) {
    console.log(`[ToolAuthority] Registering tool: ${toolDescriptor.tool_id}`);

    this._tools.set(toolDescriptor.tool_id, toolDescriptor);

    // Add to category
    const category = toolDescriptor.category || 'general';
    if (!this._toolCategories.has(category)) {
      this._toolCategories.set(category, new Set());
    }
    this._toolCategories.get(category).add(toolDescriptor.tool_id);
  }

  /**
   * Get tool manifest for mission
   * 
   * @param {Object} mission - Mission descriptor
   * @returns {Array} Tool manifest
   */
  async getToolManifest(mission) {
    console.log(`[ToolAuthority] Getting tool manifest for mission: ${mission.mission_id}`);

    const toolManifest = [];

    // Get allowed tools from mission
    const allowedToolIds = mission.allowed_tools || [];
    const allowedCategories = mission.allowed_tool_categories || [];

    // Get tools by category
    for (const category of allowedCategories) {
      const toolIds = this._toolCategories.get(category) || new Set();
      for (const toolId of toolIds) {
        if (!allowedToolIds.includes(toolId)) {
          allowedToolIds.push(toolId);
        }
      }
    }

    // Build tool manifest
    for (const toolId of allowedToolIds) {
      const tool = this._tools.get(toolId);
      if (!tool) {
        console.warn(`[ToolAuthority] Tool not found: ${toolId}`);
        continue;
      }

      // Check permission
      const permission = await this._checkToolPermission(tool, mission);
      if (!permission.allowed) {
        console.warn(`[ToolAuthority] Tool not permitted: ${toolId} - ${permission.reason}`);
        continue;
      }

      toolManifest.push({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        tool_id: tool.tool_id,
        category: tool.category,
      });
    }

    return toolManifest;
  }

  /**
   * Check tool permission
   */
  async _checkToolPermission(tool, mission) {
    if (!this._permissionAuthority) {
      // No permission authority, allow all
      return { allowed: true };
    }

    // Check with permission authority
    const permission = await this._permissionAuthority.checkPermission({
      resource_type: 'tool',
      resource_id: tool.tool_id,
      mission_id: mission.mission_id,
      authority_id: mission.authority_id,
    });

    return permission;
  }

  /**
   * Execute tool
   * 
   * @param {string} toolId - Tool identifier
   * @param {Object} parameters - Tool parameters
   * @param {Object} context - Execution context
   * @returns {Object} Execution result
   */
  async executeTool(toolId, parameters, context) {
    console.log(`[ToolAuthority] Executing tool: ${toolId}`);

    const tool = this._tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    // Check permission
    const permission = await this._checkToolPermission(tool, context.mission);
    if (!permission.allowed) {
      throw new Error(`Tool not permitted: ${toolId} - ${permission.reason}`);
    }

    // Execute tool
    const executionId = deterministicIdAuthority.generateIdFromObject({
      tool_id: toolId,
      timestamp: constitutionalTimeAuthority.now(),
    });

    try {
      // Call tool implementation
      const result = await tool.implementation(parameters, context);

      return {
        success: true,
        tool_id: toolId,
        execution_id: executionId,
        result: result,
        timestamp: constitutionalTimeAuthority.now(),
      };
    } catch (error) {
      return {
        success: false,
        tool_id: toolId,
        execution_id: executionId,
        error: error.message,
        timestamp: constitutionalTimeAuthority.now(),
      };
    }
  }

  /**
   * Load tool descriptors
   */
  async _loadToolDescriptors() {
    // Load default tools if empty
    if (this._tools.size === 0) {
      await this._loadDefaultTools();
    }
  }

  /**
   * Load default tools
   */
  async _loadDefaultTools() {
    const defaultTools = [
      {
        tool_id: 'file-read',
        name: 'file_read',
        description: 'Read file contents from the repository',
        category: 'filesystem',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to read',
            },
          },
          required: ['path'],
        },
        implementation: this._fileReadImplementation.bind(this),
      },
      {
        tool_id: 'file-write',
        name: 'file_write',
        description: 'Write content to a file in the repository',
        category: 'filesystem',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to write',
            },
            content: {
              type: 'string',
              description: 'Content to write',
            },
          },
          required: ['path', 'content'],
        },
        implementation: this._fileWriteImplementation.bind(this),
      },
      {
        tool_id: 'code-search',
        name: 'code_search',
        description: 'Search for code patterns in the repository',
        category: 'code',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            file_pattern: {
              type: 'string',
              description: 'File pattern (e.g., *.js)',
            },
          },
          required: ['query'],
        },
        implementation: this._codeSearchImplementation.bind(this),
      },
      {
        tool_id: 'artifact-query',
        name: 'artifact_query',
        description: 'Query artifacts from the artifact authority',
        category: 'artifact',
        parameters: {
          type: 'object',
          properties: {
            artifact_type: {
              type: 'string',
              description: 'Artifact type to query',
            },
            filters: {
              type: 'object',
              description: 'Additional filters',
            },
          },
          required: ['artifact_type'],
        },
        implementation: this._artifactQueryImplementation.bind(this),
      },
    ];

    for (const tool of defaultTools) {
      this.registerTool(tool);
    }

    console.log(`[ToolAuthority] Loaded ${defaultTools.length} default tools`);
  }

  /**
   * File read implementation
   */
  async _fileReadImplementation(parameters, context) {
    const { path } = parameters;
    // Implementation would read from filesystem authority
    return {
      path: path,
      content: 'File content placeholder',
    };
  }

  /**
   * File write implementation
   */
  async _fileWriteImplementation(parameters, context) {
    const { path, content } = parameters;
    // Implementation would write to filesystem authority
    return {
      path: path,
      success: true,
    };
  }

  /**
   * Code search implementation
   */
  async _codeSearchImplementation(parameters, context) {
    const { query, file_pattern } = parameters;
    // Implementation would search code
    return {
      query: query,
      results: [],
    };
  }

  /**
   * Artifact query implementation
   */
  async _artifactQueryImplementation(parameters, context) {
    const { artifact_type, filters } = parameters;
    // Implementation would query artifact authority
    return {
      artifact_type: artifact_type,
      artifacts: [],
    };
  }

  /**
   * List all tools
   * 
   * @returns {Array} Tool descriptors
   */
  listTools() {
    return Array.from(this._tools.values());
  }

  /**
   * List tools by category
   * 
   * @param {string} category - Category name
   * @returns {Array} Tool descriptors
   */
  listToolsByCategory(category) {
    const toolIds = this._toolCategories.get(category) || new Set();
    return Array.from(toolIds).map(id => this._tools.get(id));
  }

  /**
   * Get tool by ID
   * 
   * @param {string} toolId - Tool identifier
   * @returns {Object} Tool descriptor
   */
  getTool(toolId) {
    return this._tools.get(toolId);
  }

  /**
   * Check health
   */
  async health() {
    return {
      healthy: true,
      total_tools: this._tools.size,
      total_categories: this._toolCategories.size,
    };
  }

  /**
   * Publish contract
   */
  publishContract() {
    return {
      authority_id: 'tool-authority',
      authority_name: 'ToolAuthority',
      version: '1.0.0',
      consumes: ['mission', 'tool_execution'],
      produces: ['tool_manifest', 'tool_result'],
      requires: ['permission_authority'],
      guarantees: ['permission_checking', 'tool_registration'],
      failure_modes: ['tool_not_found', 'permission_denied'],
      rollback: 'none',
      determinism: 'deterministic',
    };
  }
}

module.exports = { ToolAuthority };
