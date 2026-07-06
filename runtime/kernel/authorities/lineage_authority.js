/**
 * Lineage Authority
 * 
 * Phase 46 Constitutional Freeze — Pure Lineage Edge Creation
 * 
 * Constitutional Constraint: LineageAuthority has no mutable state.
 * 
 * Removed:
 * - lineageEdges Map (mutable state)
 * - executionLineage Map (mutable state)
 * - in-memory lineage queries (getLineageForArtifact, getAncestors, getDescendants)
 * - event emission (delegated to ExecutionRuntime)
 * 
 * LineageAuthority now provides only:
 * - LineageEdge creation
 * - Lineage witness generation
 * - Persistence delegation
 * 
 * Lineage queries should go through persistence layer.
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');
const { witnessAuthority } = require('./witness_authority');
const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');

class LineageAuthority {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._witnessAuthority = witnessAuthority;
    this._constitutionalVersion = '46.0.0';
  }

  /**
   * Initialize lineage authority
   */
  async initialize() {
    console.log('[LineageAuthority] Initializing lineage authority');
    console.log('[LineageAuthority] Lineage authority initialized');
  }

  /**
   * Create lineage edge (pure function, no in-memory storage)
   * 
   * @param {string} parentArtifactId - Parent artifact ID
   * @param {string} childArtifactId - Child artifact ID
   * @param {string} authority - Authority responsible
   * @param {string} executionId - Execution ID
   * @returns {Object} LineageEdge with witness
   */
  async createLineageEdge(parentArtifactId, childArtifactId, authority, executionId) {
    console.log(`[LineageAuthority] Creating lineage edge: ${parentArtifactId} → ${childArtifactId}`);

    const edgeId = identityAuthority.generateId('lineage_edge', {
      parent_artifact_id: parentArtifactId,
      child_artifact_id: childArtifactId,
      authority: authority,
      execution_id: executionId,
      timestamp: constitutionalTimeAuthority.now(),
    });

    const lineageEdge = {
      edge_id: edgeId,
      parent_artifact_id: parentArtifactId,
      child_artifact_id: childArtifactId,
      authority: authority,
      execution_id: executionId,
      created_at: constitutionalTimeAuthority.now(),
    };

    // Create lineage witness
    const lineageWitness = await this._createLineageWitness(lineageEdge);

    console.log(`[LineageAuthority] Lineage edge created: ${edgeId}`);
    return {
      lineage_edge: lineageEdge,
      witness: lineageWitness
    };
  }

  /**
   * Create lineage witness
   * @param {Object} lineageEdge - Lineage edge
   * @returns {Object} Lineage witness
   */
  async _createLineageWitness(lineageEdge) {
    const witnessData = {
      edge_id: lineageEdge.edge_id,
      parent_artifact_id: lineageEdge.parent_artifact_id,
      child_artifact_id: lineageEdge.child_artifact_id,
      authority: lineageEdge.authority,
      execution_id: lineageEdge.execution_id,
      constitutional_version: this._constitutionalVersion
    };

    const witness = this._witnessAuthority.createWitness(witnessData, {
      authority: 'LineageAuthority',
      authority_version: this._constitutionalVersion
    });

    return witness;
  }

  /**
   * Verify lineage witness (pure function, no in-memory state)
   * @param {Object} witness - Lineage witness
   * @returns {Object} Verification result
   */
  async verifyLineageWitness(witness) {
    return this._witnessAuthority.verifyWitness(witness);
  }

  /**
   * Persist lineage edge to PostgreSQL (delegated to caller)
   * 
   * @param {Object} lineageEdge - Lineage edge to persist
   */
  async persistLineageEdge(lineageEdge) {
    try {
      await this._postgres.query(
        `INSERT INTO lineage_edges (
          edge_id, parent_artifact_id, child_artifact_id, 
          authority, execution_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (edge_id) DO NOTHING`,
        [
          lineageEdge.edge_id,
          lineageEdge.parent_artifact_id,
          lineageEdge.child_artifact_id,
          lineageEdge.authority,
          lineageEdge.execution_id,
          lineageEdge.created_at,
        ]
      );
    } catch (error) {
      console.error('[LineageAuthority] Failed to persist lineage edge:', error.message);
    }
  }

  /**
   * Check health
   */
  async health() {
    return {
      healthy: true,
      message: 'Lineage authority operational (pure function)',
    };
  }

  /**
   * Publish contract
   */
  publishContract() {
    return {
      authority_id: 'lineage-authority',
      authority_name: 'LineageAuthority',
      version: '46.0.0',
      consumes: ['parentArtifactId', 'childArtifactId', 'authority', 'executionId'],
      produces: ['LineageEdge', 'LineageWitness'],
      replay_inputs: ['ArtifactHash', 'LineagePolicyVersion'],
      requires: ['witness_authority'],
      guarantees: ['pure_function', 'no_mutable_state', 'no_in_memory_storage', 'lineage_witness_creation'],
      failure_modes: ['invalid_input', 'witness_generation_error'],
      rollback: 'none',
      determinism: 'deterministic',
      constitutional_outputs: ['lineage_edge', 'witness']
    };
  }
}

module.exports = { LineageAuthority };
