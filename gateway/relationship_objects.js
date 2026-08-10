/**
 * Relationship Objects
 * 
 * Milestone 5 — Relationship Runtime
 * 
 * Constitutional Constraint: Generate replayable edges.
 * 
 * Edge types:
 * CALLS
 * IMPLEMENTS
 * DEPENDS_ON
 * DERIVED_FROM
 * USES
 * OWNS
 * 
 * Every edge receives:
 * canonical bytes
 * ↓
 * hash
 * ↓
 * identity
 * ↓
 * lineage
 * ↓
 * witness
 * 
 * Verify:
 * - edge ordering
 * - edge IDs
 * - proposal hashes
 * 
 * remain identical.
 */

const { CanonicalBytes, CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { constitutionalVerificationAuthority } = require('../ping-runtime/evidence/constitutional_verification_authority');

/**
 * Relationship Edge Object
 * 
 * Constitutional representation of a relationship edge
 */
class RelationshipEdgeObject {
  constructor(sourceId, targetId, edgeType, metadata = {}) {
    this._sourceId = sourceId;
    this._targetId = targetId;
    this._edgeType = edgeType;
    this._metadata = metadata;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional relationship edge object
   * @returns {Object} Constitutional relationship edge object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Extract canonical fields
    const canonicalData = {
      source_id: this._sourceId,
      target_id: this._targetId,
      edge_type: this._edgeType,
      strength: this._metadata.strength || 1.0,
      direction: this._metadata.direction || 'directed',
      metadata: this._sanitizeMetadata(this._metadata),
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'RelationshipEdge');

    // Build lineage
    this._lineage = {
      source_id: this._sourceId,
      derivation_path: ['KnowledgeRuntime', 'RelationshipEdge'],
      provenance_chain: [this._sourceId, this._targetId],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'RelationshipEdge',
      authority: 'RelationshipRuntime',
      identity: {
        namespace: 'relationship',
        version: 'v1',
        created_at: timestamp,
        created_by: 'RelationshipRuntime',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._sourceId,
          relation_type: 'source',
          strength: 1.0,
          metadata: { kind: 'knowledge' },
        },
        {
          target_id: this._targetId,
          relation_type: 'target',
          strength: 1.0,
          metadata: { kind: 'knowledge' },
        },
      ],
      metadata: {
        source_id: this._sourceId,
        target_id: this._targetId,
        edge_type: this._edgeType,
        timestamp,
      },
      payload: canonicalData,
      schema_version: '1.0.0',
      constitution_version: '1.0.0',
      witness: this._witness,
      certificate: this._certificate,
    };

    return constitutionalObject;
  }

  /**
   * Sanitize metadata (remove non-constitutional fields)
   * @param {Object} metadata - Raw metadata
   * @returns {Object} Sanitized metadata
   */
  _sanitizeMetadata(metadata) {
    const sanitized = {};
    
    // Only keep constitutional metadata fields
    const allowedFields = ['strength', 'direction', 'call_site', 'property', 'method', 'parameter'];
    
    for (const key of allowedFields) {
      if (key in metadata) {
        sanitized[key] = metadata[key];
      }
    }
    
    return sanitized;
  }
}

/**
 * Relationship Proposal Object
 * 
 * Constitutional representation of a relationship proposal
 * (batch of edges to be added to the graph)
 */
class RelationshipProposalObject {
  constructor(edges, proposalId) {
    this._edges = edges;
    this._proposalId = proposalId;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional relationship proposal object
   * @returns {Object} Constitutional relationship proposal object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Sort edges deterministically for canonical ordering
    const sortedEdges = [...this._edges].sort((a, b) => {
      // Sort by source_id, then target_id, then edge_type
      if (a._sourceId !== b._sourceId) return a._sourceId.localeCompare(b._sourceId);
      if (a._targetId !== b._targetId) return a._targetId.localeCompare(b._targetId);
      return a._edgeType.localeCompare(b._edgeType);
    });

    // Build edge objects
    const edgeObjects = sortedEdges.map(edge => {
      const edgeBuilder = new RelationshipEdgeObject(edge._sourceId, edge._targetId, edge._edgeType, edge._metadata);
      return edgeBuilder.build();
    });

    // Extract canonical fields
    const canonicalData = {
      proposal_id: this._proposalId,
      edges: edgeObjects.map(edge => ({
        edge_id: edge.id,
        source_id: edge.payload.source_id,
        target_id: edge.payload.target_id,
        edge_type: edge.payload.edge_type,
        strength: edge.payload.strength,
      })),
      edge_count: edgeObjects.length,
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'RelationshipProposal');

    // Build lineage
    this._lineage = {
      source_id: null,
      derivation_path: ['RelationshipRuntime', 'RelationshipProposal'],
      provenance_chain: edgeObjects.map(e => e.id),
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'RelationshipProposal',
      authority: 'RelationshipRuntime',
      identity: {
        namespace: 'relationship',
        version: 'v1',
        created_at: timestamp,
        created_by: 'RelationshipRuntime',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: edgeObjects.map(edge => ({
        target_id: edge.id,
        relation_type: 'contains',
        strength: 1.0,
        metadata: { kind: 'edge' },
      })),
      metadata: {
        proposal_id: this._proposalId,
        edge_count: edgeObjects.length,
        timestamp,
      },
      payload: canonicalData,
      schema_version: '1.0.0',
      constitution_version: '1.0.0',
      witness: this._witness,
      certificate: this._certificate,
    };

    return { constitutionalObject, edgeObjects };
  }
}

module.exports = {
  RelationshipEdgeObject,
  RelationshipProposalObject,
};
