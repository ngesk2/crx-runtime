/**
 * Provenance Authority
 * 
 * Ω.97.6 — Rename History Authority to Provenance Authority
 * 
 * History implies "time."
 * But what you're actually storing is:
 * - Mission
 * - Execution
 * - Evidence
 * - Commit
 * - Kernel evolution
 * 
 * That's provenance.
 * 
 * Provenance includes:
 * - parents
 * - lineage
 * - derivation
 * - causality
 * 
 * Not merely chronology.
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

class ProvenanceAuthority {
  constructor(postgresPool, artifactAuthority) {
    this._postgres = postgresPool;
    this._artifactAuthority = artifactAuthority;
    this._provenanceGraph = new Map(); // artifact_id → provenance record
  }

  /**
   * Initialize provenance authority
   */
  async initialize() {
    console.log('[ProvenanceAuthority] Initializing provenance authority');

    // Load provenance graph
    await this._loadProvenanceGraph();

    console.log('[ProvenanceAuthority] Provenance authority initialized');
  }

  /**
   * Load provenance graph
   */
  async _loadProvenanceGraph() {
    try {
      const result = await this._postgres.query(`
        SELECT artifact_id, provenance_data
        FROM provenance_records
      `);

      for (const row of result.rows) {
        this._provenanceGraph.set(row.artifact_id, row.provenance_data);
      }

      console.log(`[ProvenanceAuthority] Loaded ${this._provenanceGraph.size} provenance records`);
    } catch (error) {
      console.error('[ProvenanceAuthority] Failed to load provenance graph:', error.message);
    }
  }

  /**
   * Record provenance for artifact
   * 
   * @param {Object} artifact - Artifact
   * @param {Object} context - Execution context
   * @returns {Object} Provenance record
   */
  async recordProvenance(artifact, context) {
    console.log(`[ProvenanceAuthority] Recording provenance for artifact ${artifact.artifact_id}`);

    const provenanceRecord = {
      artifact_id: artifact.artifact_id,
      artifact_type: artifact.artifact_type,
      parents: context.parents || [],
      produced_by: context.authority || 'unknown',
      execution_node: context.node_id || 'unknown',
      plan_id: context.plan_id || 'unknown',
      mission_id: context.mission_id || 'unknown',
      schema_version: context.schema_version || '1.0.0',
      derivation_path: this._computeDerivationPath(context.parents),
      causality_chain: this._computeCausalityChain(context.parents),
      lineage: this._computeLineage(context.parents),
      recorded_at: constitutionalTimeAuthority.now(),
    };

    // Store provenance record
    this._provenanceGraph.set(artifact.artifact_id, provenanceRecord);
    await this._persistProvenance(artifact.artifact_id, provenanceRecord);

    console.log(`[ProvenanceAuthority] Recorded provenance for artifact ${artifact.artifact_id}`);
    return provenanceRecord;
  }

  /**
   * Compute derivation path
   */
  _computeDerivationPath(parents) {
    if (!parents || parents.length === 0) {
      return [];
    }

    const path = [];
    for (const parentId of parents) {
      const parentProvenance = this._provenanceGraph.get(parentId);
      if (parentProvenance) {
        path.push({
          artifact_id: parentId,
          artifact_type: parentProvenance.artifact_type,
          produced_by: parentProvenance.produced_by,
        });
      }
    }

    return path;
  }

  /**
   * Compute causality chain
   */
  _computeCausalityChain(parents) {
    if (!parents || parents.length === 0) {
      return [];
    }

    const chain = [];
    const visited = new Set();

    const traverse = (artifactId) => {
      if (visited.has(artifactId)) {
        return;
      }
      visited.add(artifactId);

      const provenance = this._provenanceGraph.get(artifactId);
      if (provenance) {
        chain.push({
          artifact_id: artifactId,
          produced_by: provenance.produced_by,
          execution_node: provenance.execution_node,
        });

        for (const parentId of provenance.parents) {
          traverse(parentId);
        }
      }
    };

    for (const parentId of parents) {
      traverse(parentId);
    }

    return chain;
  }

  /**
   * Compute lineage
   */
  _computeLineage(parents) {
    if (!parents || parents.length === 0) {
      return {
        depth: 0,
        ancestors: [],
        branches: 0,
      };
    }

    const ancestors = new Set();
    const visited = new Set();
    let maxDepth = 0;

    const traverse = (artifactId, depth) => {
      if (visited.has(artifactId)) {
        return;
      }
      visited.add(artifactId);

      ancestors.add(artifactId);
      maxDepth = Math.max(maxDepth, depth);

      const provenance = this._provenanceGraph.get(artifactId);
      if (provenance) {
        for (const parentId of provenance.parents) {
          traverse(parentId, depth + 1);
        }
      }
    };

    for (const parentId of parents) {
      traverse(parentId, 1);
    }

    return {
      depth: maxDepth,
      ancestors: Array.from(ancestors),
      branches: parents.length,
    };
  }

  /**
   * Get provenance for artifact
   * 
   * @param {string} artifactId - Artifact identifier
   * @returns {Object} Provenance record
   */
  getProvenance(artifactId) {
    return this._provenanceGraph.get(artifactId);
  }

  /**
   * Get lineage for artifact
   * 
   * @param {string} artifactId - Artifact identifier
   * @returns {Object} Lineage
   */
  getLineage(artifactId) {
    const provenance = this._provenanceGraph.get(artifactId);
    if (!provenance) {
      return null;
    }

    return provenance.lineage;
  }

  /**
   * Get derivation path for artifact
   * 
   * @param {string} artifactId - Artifact identifier
   * @returns {Array} Derivation path
   */
  getDerivationPath(artifactId) {
    const provenance = this._provenanceGraph.get(artifactId);
    if (!provenance) {
      return [];
    }

    return provenance.derivation_path;
  }

  /**
   * Get causality chain for artifact
   * 
   * @param {string} artifactId - Artifact identifier
   * @returns {Array} Causality chain
   */
  getCausalityChain(artifactId) {
    const provenance = this._provenanceGraph.get(artifactId);
    if (!provenance) {
      return [];
    }

    return provenance.causality_chain;
  }

  /**
   * Trace artifact origin
   * 
   * @param {string} artifactId - Artifact identifier
   * @returns {Object} Origin trace
   */
  traceOrigin(artifactId) {
    console.log(`[ProvenanceAuthority] Tracing origin for artifact ${artifactId}`);

    const provenance = this._provenanceGraph.get(artifactId);
    if (!provenance) {
      return {
        artifact_id: artifactId,
        found: false,
      };
    }

    const origin = this._findOrigin(artifactId);

    return {
      artifact_id: artifactId,
      found: true,
      origin: origin,
      path: this._getTracePath(artifactId, origin),
    };
  }

  /**
   * Find origin artifact
   */
  _findOrigin(artifactId) {
    const provenance = this._provenanceGraph.get(artifactId);
    if (!provenance) {
      return null;
    }

    if (provenance.parents.length === 0) {
      return artifactId;
    }

    for (const parentId of provenance.parents) {
      const origin = this._findOrigin(parentId);
      if (origin) {
        return origin;
      }
    }

    return artifactId;
  }

  /**
   * Get trace path
   */
  _getTracePath(artifactId, originId) {
    const path = [];
    const visited = new Set();

    const traverse = (currentId) => {
      if (visited.has(currentId)) {
        return;
      }
      visited.add(currentId);

      const provenance = this._provenanceGraph.get(currentId);
      if (provenance) {
        path.push(currentId);

        if (currentId === originId) {
          return true;
        }

        for (const parentId of provenance.parents) {
          if (traverse(parentId)) {
            return true;
          }
        }

        path.pop();
      }

      return false;
    };

    traverse(artifactId);
    return path;
  }

  /**
   * Verify provenance integrity
   * 
   * @param {string} artifactId - Artifact identifier
   * @returns {Object} Verification result
   */
  verifyProvenanceIntegrity(artifactId) {
    const provenance = this._provenanceGraph.get(artifactId);
    if (!provenance) {
      return {
        valid: false,
        errors: ['Provenance record not found'],
      };
    }

    const errors = [];

    // Verify all parents exist
    for (const parentId of provenance.parents) {
      if (!this._provenanceGraph.has(parentId)) {
        errors.push(`Parent artifact not found: ${parentId}`);
      }
    }

    // Verify causality chain consistency
    for (const chainItem of provenance.causality_chain) {
      if (!this._provenanceGraph.has(chainItem.artifact_id)) {
        errors.push(`Causality chain artifact not found: ${chainItem.artifact_id}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Persist provenance record
   */
  async _persistProvenance(artifactId, provenanceRecord) {
    try {
      await this._postgres.query(`
        INSERT INTO provenance_records (artifact_id, provenance_data, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (artifact_id) DO UPDATE SET
          provenance_data = $2,
          updated_at = NOW()
      `, [artifactId, JSON.stringify(provenanceRecord)]);
    } catch (error) {
      console.error(`[ProvenanceAuthority] Failed to persist provenance for ${artifactId}:`, error.message);
    }
  }

  /**
   * Get provenance statistics
   */
  getStatistics() {
    const byArtifactType = {};
    const byAuthority = {};
    const byMission = {};
    const lineageDepths = [];

    for (const provenance of this._provenanceGraph.values()) {
      byArtifactType[provenance.artifact_type] = (byArtifactType[provenance.artifact_type] || 0) + 1;
      byAuthority[provenance.produced_by] = (byAuthority[provenance.produced_by] || 0) + 1;
      byMission[provenance.mission_id] = (byMission[provenance.mission_id] || 0) + 1;
      lineageDepths.push(provenance.lineage.depth);
    }

    const avgDepth = lineageDepths.length > 0
      ? lineageDepths.reduce((a, b) => a + b, 0) / lineageDepths.length
      : 0;

    return {
      total_artifacts: this._provenanceGraph.size,
      by_artifact_type: byArtifactType,
      by_authority: byAuthority,
      by_mission: byMission,
      average_lineage_depth: avgDepth,
      max_lineage_depth: lineageDepths.length > 0 ? Math.max(...lineageDepths) : 0,
    };
  }

  /**
   * Publish contract
   * 
   * @returns {Object} Authority contract
   */
  publishContract() {
    return {
      authority_id: 'provenance-authority',
      authority_name: 'ProvenanceAuthority',
      version: '1.0.0',
      consumes: ['artifact', 'context'],
      produces: ['ProvenanceRecord', 'Lineage', 'DerivationPath', 'CausalityChain'],
      requires: ['artifact_authority'],
      guarantees: ['complete_lineage', 'traceable_origin', 'causality_tracking'],
      failure_modes: ['provenance_corruption', 'lineage_break'],
      rollback: 'none',
      determinism: 'deterministic',
    };
  }
}

module.exports = { ProvenanceAuthority };
