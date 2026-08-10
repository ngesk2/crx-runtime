/**
 * Execution Metadata Authority
 * 
 * Phase 7.1 — ExecutionMetadataAuthority
 * 
 * NON-CONSTITUTIONAL AUTHORITY
 * 
 * This authority is explicitly NON-CONSTITUTIONAL.
 * It contains only operational metadata that must never influence:
 * - replay hashes
 * - witness hashes
 * - transcript hashes
 * - execution identity
 * - Merkle roots
 * - replay equivalence
 * - constitutional serialization
 * 
 * WARNING: No constitutional authority should import this module.
 * 
 * Phase 36F: Even non-constitutional authorities must use constitutional time
 * to prevent hidden authority bypasses.
 * 
 * Responsibilities:
 * - timestamps
 * - durations
 * - cpu
 * - memory
 * - pid
 * - thread
 * - host
 * - runtime diagnostics
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

class ExecutionMetadataAuthority {
  constructor() {
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '7.0.0';
    this._metadataStore = new Map();
  }

  /**
   * Create execution metadata
   * @param {Object} metadata - Metadata fields
   * @returns {Object} Execution metadata
   */
  createExecutionMetadata(metadata = {}) {
    const metadataId = this._generateMetadataId();
    
    const executionMetadata = {
      metadata_id: metadataId,
      authority_id: this._authorityId,
      authority_version: this._authorityVersion,
      
      // Operational metadata (NON-CONSTITUTIONAL)
      timestamps: {
        created_at: constitutionalTimeAuthority.nowAsMillis(),
        started_at: metadata.started_at || null,
        completed_at: metadata.completed_at || null,
        duration_ms: null
      },
      
      system: {
        pid: process.pid,
        platform: process.platform,
        arch: process.arch,
        node_version: process.version,
        host: metadata.host || 'unknown',
        hostname: metadata.hostname || null
      },
      
      resources: {
        cpu: metadata.cpu || null,
        memory: metadata.memory || null,
        heap_used: metadata.heap_used || null,
        heap_total: metadata.heap_total || null
      },
      
      execution: {
        thread_id: metadata.thread_id || null,
        execution_id: metadata.execution_id || null,
        parent_id: metadata.parent_id || null
      },
      
      diagnostics: {
        error_count: metadata.error_count || 0,
        warning_count: metadata.warning_count || 0,
        custom_diagnostics: metadata.custom_diagnostics || {}
      },
      
      // Explicitly marked as NON-CONSTITUTIONAL
      constitutional: false,
      metadata_type: 'operational'
    };
    
    // Calculate duration if both timestamps are present
    if (executionMetadata.timestamps.started_at && executionMetadata.timestamps.completed_at) {
      executionMetadata.timestamps.duration_ms = 
        executionMetadata.timestamps.completed_at - executionMetadata.timestamps.started_at;
    }
    
    this._metadataStore.set(metadataId, executionMetadata);
    
    return executionMetadata;
  }

  /**
   * Update execution metadata
   * @param {string} metadataId - Metadata ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated metadata
   */
  updateExecutionMetadata(metadataId, updates) {
    const metadata = this._metadataStore.get(metadataId);
    
    if (!metadata) {
      throw new Error(`Execution metadata not found: ${metadataId}`);
    }
    
    // Update timestamps
    if (updates.started_at) {
      metadata.timestamps.started_at = updates.started_at;
    }
    
    if (updates.completed_at) {
      metadata.timestamps.completed_at = updates.completed_at;
    }
    
    // Recalculate duration
    if (metadata.timestamps.started_at && metadata.timestamps.completed_at) {
      metadata.timestamps.duration_ms = 
        metadata.timestamps.completed_at - metadata.timestamps.started_at;
    }
    
    // Update resources
    if (updates.cpu !== undefined) {
      metadata.resources.cpu = updates.cpu;
    }
    
    if (updates.memory !== undefined) {
      metadata.resources.memory = updates.memory;
    }
    
    if (updates.heap_used !== undefined) {
      metadata.resources.heap_used = updates.heap_used;
    }
    
    if (updates.heap_total !== undefined) {
      metadata.resources.heap_total = updates.heap_total;
    }
    
    // Update diagnostics
    if (updates.error_count !== undefined) {
      metadata.diagnostics.error_count = updates.error_count;
    }
    
    if (updates.warning_count !== undefined) {
      metadata.diagnostics.warning_count = updates.warning_count;
    }
    
    if (updates.custom_diagnostics) {
      metadata.diagnostics.custom_diagnostics = {
        ...metadata.diagnostics.custom_diagnostics,
        ...updates.custom_diagnostics
      };
    }
    
    return metadata;
  }

  /**
   * Get execution metadata
   * @param {string} metadataId - Metadata ID
   * @returns {Object} Execution metadata
   */
  getExecutionMetadata(metadataId) {
    return this._metadataStore.get(metadataId);
  }

  /**
   * Delete execution metadata
   * @param {string} metadataId - Metadata ID
   */
  deleteExecutionMetadata(metadataId) {
    this._metadataStore.delete(metadataId);
  }

  /**
   * Clear all metadata
   */
  clearAllMetadata() {
    this._metadataStore.clear();
  }

  /**
   * Get current system snapshot
   * @returns {Object} System snapshot
   */
  getSystemSnapshot() {
    const memoryUsage = process.memoryUsage();
    
    return {
      pid: process.pid,
      platform: process.platform,
      arch: process.arch,
      node_version: process.version,
      memory: {
        rss: memoryUsage.rss,
        heap_total: memoryUsage.heapTotal,
        heap_used: memoryUsage.heapUsed,
        external: memoryUsage.external,
        array_buffers: memoryUsage.arrayBuffers
      },
      uptime: process.uptime(),
      cpu_usage: process.cpuUsage()
    };
  }

  /**
   * Get authority ID
   * @returns {string} Authority ID
   */
  getAuthorityId() {
    return this._authorityId;
  }

  /**
   * Get authority version
   * @returns {string} Authority version
   */
  getAuthorityVersion() {
    return this._authorityVersion;
  }

  /**
   * Generate metadata ID
   * Phase 36F: Use constitutional authorities for ID generation
   * @returns {string} Metadata ID
   */
  _generateMetadataId() {
    const data = {
      authority: 'ExecutionMetadataAuthority',
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority_version: this._authorityVersion
    };
    const hash = CanonicalAuthority.hash(data);
    return `exec_meta_${hash.substring(0, 16)}`;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    return `execution_metadata_authority_v${this._authorityVersion}`;
  }
}

// Singleton instance
const executionMetadataAuthority = new ExecutionMetadataAuthority();

module.exports = { ExecutionMetadataAuthority, executionMetadataAuthority };
