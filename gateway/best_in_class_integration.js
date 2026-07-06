/**
 * Best-in-Class Software Integration
 *
 * Phase 36M — Autonomous Engineering Fabric
 *
 * Constitutional authority for leveraging existing tools via ports.
 *
 * Don't reinvent solved problems. Use best-in-class software behind constitutional ports.
 *
 * Integration Strategy:
 * - Code Generation: CodeGenerationPort (Devin, OpenCode, Claude Code, Codex CLI, Continue, Cline)
 * - Workflow Orchestration: SchedulerPort (Temporal - already exists)
 * - Queues: QueuePort (BullMQ, Redis Streams, Kafka - already exists)
 * - Memory: MemoryPort (Qdrant)
 * - Search: SearchPort (ripgrep, Tree-sitter, Sourcegraph/Cody APIs)
 * - Build Graph: BuildGraphPort (Nx, Turborepo, Bazel concepts)
 * - Git Automation: RepositoryPort (GitHub App, GitHub Actions, GraphQL API - already exists)
 *
 * Constitutional Constraint:
 * - All external tools are behind ports
 * - Ports are constitutional interfaces
 * - Adapters are implementation details
 * - Tools are interchangeable capability providers
 */

const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');
const { witnessAuthority } = require('./witness_authority');
const { constitutionVersionAuthority } = require('./constitution_version_authority');

/**
 * Code Generation Port
 *
 * Constitutional interface for code generation tools.
 */
class CodeGenerationPort {
  /**
   * Generate code from prompt
   * @param {string} prompt - Code generation prompt
   * @param {Object} context - Code context
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated code
   */
  async generateCode(prompt, context, options = {}) {
    throw new Error('CodeGenerationPort.generateCode must be implemented by adapter');
  }
  
  /**
   * Refactor code
   * @param {string} code - Code to refactor
   * @param {string} instruction - Refactoring instruction
   * @param {Object} options - Refactoring options
   * @returns {Promise<Object>} Refactored code
   */
  async refactorCode(code, instruction, options = {}) {
    throw new Error('CodeGenerationPort.refactorCode must be implemented by adapter');
  }
  
  /**
   * Review code
   * @param {string} code - Code to review
   * @param {Object} options - Review options
   * @returns {Promise<Object>} Code review
   */
  async reviewCode(code, options = {}) {
    throw new Error('CodeGenerationPort.reviewCode must be implemented by adapter');
  }
  
  /**
   * Complete code
   * @param {string} code - Code to complete
   * @param {Object} options - Completion options
   * @returns {Promise<Object>} Code completion
   */
  async completeCode(code, options = {}) {
    throw new Error('CodeGenerationPort.completeCode must be implemented by adapter');
  }
}

/**
 * Memory Port
 *
 * Constitutional interface for memory systems.
 */
class MemoryPort {
  /**
   * Store memory
   * @param {string} key - Memory key
   * @param {Object} value - Memory value
   * @param {Object} metadata - Memory metadata
   * @returns {Promise<void>}
   */
  async storeMemory(key, value, metadata = {}) {
    throw new Error('MemoryPort.storeMemory must be implemented by adapter');
  }
  
  /**
   * Retrieve memory
   * @param {string} key - Memory key
   * @returns {Promise<Object>} Memory value
   */
  async retrieveMemory(key) {
    throw new Error('MemoryPort.retrieveMemory must be implemented by adapter');
  }
  
  /**
   * Search memory
   * @param {string} query - Search query
   * @param {Object} filters - Search filters
   * @returns {Promise<Array<Object>>} Search results
   */
  async searchMemory(query, filters = {}) {
    throw new Error('MemoryPort.searchMemory must be implemented by adapter');
  }
  
  /**
   * Delete memory
   * @param {string} key - Memory key
   * @returns {Promise<void>}
   */
  async deleteMemory(key) {
    throw new Error('MemoryPort.deleteMemory must be implemented by adapter');
  }
}

/**
 * Search Port
 *
 * Constitutional interface for search systems.
 */
class SearchPort {
  /**
   * Search code
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array<Object>>} Search results
   */
  async searchCode(query, options = {}) {
    throw new Error('SearchPort.searchCode must be implemented by adapter');
  }
  
  /**
   * Search files
   * @param {string} pattern - File pattern
   * @param {Object} options - Search options
   * @returns {Promise<Array<Object>>} Search results
   */
  async searchFiles(pattern, options = {}) {
    throw new Error('SearchPort.searchFiles must be implemented by adapter');
  }
  
  /**
   * Search symbols
   * @param {string} symbol - Symbol name
   * @param {Object} options - Search options
   * @returns {Promise<Array<Object>>} Search results
   */
  async searchSymbols(symbol, options = {}) {
    throw new Error('SearchPort.searchSymbols must be implemented by adapter');
  }
  
  /**
   * Get code context
   * @param {string} filePath - File path
   * @param {number} line - Line number
   * @param {number} contextLines - Context lines
   * @returns {Promise<Object>} Code context
   */
  async getCodeContext(filePath, line, contextLines = 10) {
    throw new Error('SearchPort.getCodeContext must be implemented by adapter');
  }
}

/**
 * Build Graph Port
 *
 * Constitutional interface for build graph systems.
 */
class BuildGraphPort {
  /**
   * Get build graph
   * @param {Object} options - Build options
   * @returns {Promise<Object>} Build graph
   */
  async getBuildGraph(options = {}) {
    throw new Error('BuildGraphPort.getBuildGraph must be implemented by adapter');
  }
  
  /**
   * Get dependencies
   * @param {string} project - Project name
   * @returns {Promise<Array<Object>>} Dependencies
   */
  async getDependencies(project) {
    throw new Error('BuildGraphPort.getDependencies must be implemented by adapter');
  }
  
  /**
   * Get affected projects
   * @param {Array<string>} changedFiles - Changed files
   * @returns {Promise<Array<string>>} Affected projects
   */
  async getAffectedProjects(changedFiles) {
    throw new Error('BuildGraphPort.getAffectedProjects must be implemented by adapter');
  }
  
  /**
   * Build project
   * @param {string} project - Project name
   * @param {Object} options - Build options
   * @returns {Promise<Object>} Build result
   */
  async buildProject(project, options = {}) {
    throw new Error('BuildGraphPort.buildProject must be implemented by adapter');
  }
}

/**
 * Adapter Specifications
 *
 * Constitutional adapter specifications for best-in-class tools.
 */

/**
 * Devin Adapter for CodeGenerationPort
 */
class DevinAdapter extends CodeGenerationPort {
  constructor(apiKey, endpoint) {
    super();
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }
  
  async generateCode(prompt, context, options = {}) {
    // Call Devin API
    const response = await fetch(`${this.endpoint}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, context, options })
    });
    return response.json();
  }
  
  async refactorCode(code, instruction, options = {}) {
    const response = await fetch(`${this.endpoint}/refactor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, instruction, options })
    });
    return response.json();
  }
  
  async reviewCode(code, options = {}) {
    const response = await fetch(`${this.endpoint}/review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, options })
    });
    return response.json();
  }
  
  async completeCode(code, options = {}) {
    const response = await fetch(`${this.endpoint}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, options })
    });
    return response.json();
  }
}

/**
 * OpenCode Adapter for CodeGenerationPort
 */
class OpenCodeAdapter extends CodeGenerationPort {
  constructor(apiKey, endpoint) {
    super();
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }
  
  async generateCode(prompt, context, options = {}) {
    const response = await fetch(`${this.endpoint}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, context, options })
    });
    return response.json();
  }
  
  async refactorCode(code, instruction, options = {}) {
    const response = await fetch(`${this.endpoint}/refactor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, instruction, options })
    });
    return response.json();
  }
  
  async reviewCode(code, options = {}) {
    const response = await fetch(`${this.endpoint}/review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, options })
    });
    return response.json();
  }
  
  async completeCode(code, options = {}) {
    const response = await fetch(`${this.endpoint}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, options })
    });
    return response.json();
  }
}

/**
 * Qdrant Adapter for MemoryPort
 */
class QdrantAdapter extends MemoryPort {
  constructor(endpoint, apiKey = null) {
    super();
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }
  
  async storeMemory(key, value, metadata = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['api-key'] = this.apiKey;
    }
    
    const response = await fetch(`${this.endpoint}/collections/memory/points`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        points: [{
          id: key,
          vector: this._vectorize(value),
          payload: { value, metadata }
        }]
      })
    });
    return response.json();
  }
  
  async retrieveMemory(key) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['api-key'] = this.apiKey;
    }
    
    const response = await fetch(`${this.endpoint}/collections/memory/points/${key}`, {
      method: 'GET',
      headers
    });
    const data = await response.json();
    return data.result?.payload?.value;
  }
  
  async searchMemory(query, filters = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['api-key'] = this.apiKey;
    }
    
    const response = await fetch(`${this.endpoint}/collections/memory/points/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        vector: this._vectorize(query),
        limit: 10,
        filter: filters
      })
    });
    const data = await response.json();
    return data.result.map(point => point.payload);
  }
  
  async deleteMemory(key) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['api-key'] = this.apiKey;
    }
    
    const response = await fetch(`${this.endpoint}/collections/memory/points/${key}`, {
      method: 'DELETE',
      headers
    });
    return response.json();
  }
  
  _vectorize(text) {
    // Simplified vectorization - in production, use actual embedding model
    const hash = CanonicalAuthority.hash(text);
    return hash.split('').map(c => c.charCodeAt(0) / 255);
  }
}

/**
 * Ripgrep Adapter for SearchPort
 */
class RipgrepAdapter extends SearchPort {
  constructor(rootPath) {
    super();
    this.rootPath = rootPath;
  }
  
  async searchCode(query, options = {}) {
    // Use ripgrep via child_process
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const cmd = `rg "${query}" ${this.rootPath} --json ${options.caseSensitive ? '' : '-i'} ${options.context ? '-C ' + options.context : ''}`;
    const { stdout } = await execAsync(cmd);
    
    return stdout.split('\n')
      .filter(line => line)
      .map(line => JSON.parse(line));
  }
  
  async searchFiles(pattern, options = {}) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const cmd = `rg --files ${this.rootPath} --glob "${pattern}"`;
    const { stdout } = await execAsync(cmd);
    
    return stdout.split('\n').filter(line => line);
  }
  
  async searchSymbols(symbol, options = {}) {
    // Use tree-sitter for symbol search
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const cmd = `rg "${symbol}" ${this.rootPath} --type-add 'code:*.{js,ts,py,java,go,rs}' -t code --json`;
    const { stdout } = await execAsync(cmd);
    
    return stdout.split('\n')
      .filter(line => line)
      .map(line => JSON.parse(line));
  }
  
  async getCodeContext(filePath, line, contextLines = 10) {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const startLine = Math.max(0, line - contextLines - 1);
    const endLine = Math.min(lines.length, line + contextLines);
    
    return {
      file: filePath,
      line: line,
      context: lines.slice(startLine, endLine).join('\n'),
      start_line: startLine + 1,
      end_line: endLine
    };
  }
}

/**
 * Nx Adapter for BuildGraphPort
 */
class NxAdapter extends BuildGraphPort {
  constructor(workspacePath) {
    super();
    this.workspacePath = workspacePath;
  }
  
  async getBuildGraph(options = {}) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const cmd = `npx nx graph --json ${this.workspacePath}`;
    const { stdout } = await execAsync(cmd);
    
    return JSON.parse(stdout);
  }
  
  async getDependencies(project) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const cmd = `npx nx show project ${project} --json ${this.workspacePath}`;
    const { stdout } = await execAsync(cmd);
    
    const data = JSON.parse(stdout);
    return data.data?.targets || [];
  }
  
  async getAffectedProjects(changedFiles) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const filesArg = changedFiles.join(',');
    const cmd = `npx nx affected:graph --base=HEAD --files=${filesArg} --json ${this.workspacePath}`;
    const { stdout } = await execAsync(cmd);
    
    const data = JSON.parse(stdout);
    return data.affected || [];
  }
  
  async buildProject(project, options = {}) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const cmd = `npx nx run ${project}:build ${this.workspacePath}`;
    const { stdout, stderr } = await execAsync(cmd);
    
    return {
      project,
      success: !stderr,
      output: stdout,
      error: stderr
    };
  }
}

/**
 * Best-in-Class Integration Authority
 *
 * Constitutional authority for managing best-in-class tool integrations.
 */
class BestInClassIntegrationAuthority {
  constructor(eventRepository, runtimeIdentity = null) {
    this._eventRepository = eventRepository;
    this._runtimeIdentity = runtimeIdentity;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '36.0.0';
    this._adapters = new Map();
  }
  
  /**
   * Register code generation adapter
   * @param {string} provider - Provider name (devin, opencode, claude, codex, continue, cline)
   * @param {CodeGenerationPort} adapter - Adapter instance
   */
  registerCodeGenerationAdapter(provider, adapter) {
    this._adapters.set(`code_generation_${provider}`, adapter);
    
    // Emit AdapterRegistered event
    this._emitAdapterRegistered('code_generation', provider);
  }
  
  /**
   * Register memory adapter
   * @param {string} provider - Provider name (qdrant)
   * @param {MemoryPort} adapter - Adapter instance
   */
  registerMemoryAdapter(provider, adapter) {
    this._adapters.set(`memory_${provider}`, adapter);
    
    // Emit AdapterRegistered event
    this._emitAdapterRegistered('memory', provider);
  }
  
  /**
   * Register search adapter
   * @param {string} provider - Provider name (ripgrep, treesitter, sourcegraph)
   * @param {SearchPort} adapter - Adapter instance
   */
  registerSearchAdapter(provider, adapter) {
    this._adapters.set(`search_${provider}`, adapter);
    
    // Emit AdapterRegistered event
    this._emitAdapterRegistered('search', provider);
  }
  
  /**
   * Register build graph adapter
   * @param {string} provider - Provider name (nx, turborepo, bazel)
   * @param {BuildGraphPort} adapter - Adapter instance
   */
  registerBuildGraphAdapter(provider, adapter) {
    this._adapters.set(`build_graph_${provider}`, adapter);
    
    // Emit AdapterRegistered event
    this._emitAdapterRegistered('build_graph', provider);
  }
  
  /**
   * Get code generation adapter
   * @param {string} provider - Provider name
   * @returns {CodeGenerationPort} Adapter
   */
  getCodeGenerationAdapter(provider) {
    return this._adapters.get(`code_generation_${provider}`);
  }
  
  /**
   * Get memory adapter
   * @param {string} provider - Provider name
   * @returns {MemoryPort} Adapter
   */
  getMemoryAdapter(provider) {
    return this._adapters.get(`memory_${provider}`);
  }
  
  /**
   * Get search adapter
   * @param {string} provider - Provider name
   * @returns {SearchPort} Adapter
   */
  getSearchAdapter(provider) {
    return this._adapters.get(`search_${provider}`);
  }
  
  /**
   * Get build graph adapter
   * @param {string} provider - Provider name
   * @returns {BuildGraphPort} Adapter
   */
  getBuildGraphAdapter(provider) {
    return this._adapters.get(`build_graph_${provider}`);
  }
  
  /**
   * Get all adapters
   * @returns {Map} All adapters
   */
  getAllAdapters() {
    return this._adapters;
  }
  
  /**
   * Generate authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: this._authorityVersion,
      constitutional_version: '36.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `best_in_class_integration_${hash.substring(0, 16)}`;
  }
  
  /**
   * Emit AdapterRegistered event
   */
  _emitAdapterRegistered(portType, provider) {
    const event = {
      event_id: identityAuthority.generateEventId('AdapterRegistered', `${portType}_${provider}`),
      event_type: 'AdapterRegistered',
      aggregate_id: `${portType}_${provider}`,
      aggregate_type: 'Adapter',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'BestInClassIntegrationAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        port_type: portType,
        provider: provider,
        registered_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: null,
      correlation_id: `${portType}_${provider}`
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
}

// Singleton instance
let bestInClassIntegrationAuthority = null;

function getBestInClassIntegrationAuthority(eventRepository, runtimeIdentity = null) {
  if (!bestInClassIntegrationAuthority) {
    bestInClassIntegrationAuthority = new BestInClassIntegrationAuthority(eventRepository, runtimeIdentity);
  }
  return bestInClassIntegrationAuthority;
}

module.exports = {
  BestInClassIntegrationAuthority,
  CodeGenerationPort,
  MemoryPort,
  SearchPort,
  BuildGraphPort,
  DevinAdapter,
  OpenCodeAdapter,
  QdrantAdapter,
  RipgrepAdapter,
  NxAdapter,
  bestInClassIntegrationAuthority,
  getBestInClassIntegrationAuthority
};
