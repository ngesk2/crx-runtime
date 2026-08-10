/**
 * Relationship Runtime
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
 * Pipeline:
 * Knowledge Objects
 *       ↓
 * Relationship Runtime
 *       ↓
 * Relationship Edges
 *       ↓
 * CanonicalBytes
 *       ↓
 * CanonicalHash
 *       ↓
 * Identity
 *       ↓
 * Lineage
 *       ↓
 * Witness
 *       ↓
 * Certificate
 */

const { RelationshipEdgeObject, RelationshipProposalObject } = require('./relationship_objects');
const { constitutionalVerificationAuthority } = require('../ping-runtime/evidence/constitutional_verification_authority');
const { CanonicalBytes, CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');

class RelationshipRuntime {
  constructor() {
    this._namespace = 'relationship';
    this._version = '1.0.0';
  }

  /**
   * Generate relationship edges from knowledge objects
   * 
   * @param {Object} knowledgeObjects - Knowledge objects
   * @param {Object} parserObjects - Parser objects (for call graph, import graph)
   * @returns {Object} Relationship proposal with edges
   */
  generate(knowledgeObjects, parserObjects) {
    const edges = [];

    // Generate CALLS edges from call graph
    const callsEdges = this._generateCallsEdges(parserObjects.callGraph, knowledgeObjects.functions);
    edges.push(...callsEdges);

    // Generate IMPLEMENTS edges from classes and interfaces
    const implementsEdges = this._generateImplementsEdges(knowledgeObjects.classes, knowledgeObjects.interfaces);
    edges.push(...implementsEdges);

    // Generate DEPENDS_ON edges from import graph
    const dependsEdges = this._generateDependsEdges(parserObjects.importGraph, knowledgeObjects.dependencies);
    edges.push(...dependsEdges);

    // Generate DERIVED_FROM edges from lineage
    const derivedEdges = this._generateDerivedEdges(knowledgeObjects);
    edges.push(...derivedEdges);

    // Generate USES edges from function parameters
    const usesEdges = this._generateUsesEdges(knowledgeObjects.functions);
    edges.push(...usesEdges);

    // Generate OWNS edges from class properties
    const ownsEdges = this._generateOwnsEdges(knowledgeObjects.classes);
    edges.push(...ownsEdges);

    // Generate proposal ID from edges (constitutional: CanonicalBytes → CanonicalHash → Identity)
    const proposalId = this._generateProposalId(edges);

    // Build relationship proposal
    const proposalBuilder = new RelationshipProposalObject(edges, proposalId);
    const { constitutionalObject, edgeObjects } = proposalBuilder.build();

    // Verify proposal
    const proposalVerification = constitutionalVerificationAuthority.verifyArtifact(constitutionalObject);
    if (!proposalVerification.valid) {
      throw new Error(`RelationshipProposal verification failed: ${proposalVerification.reason}`);
    }

    // Verify each edge
    for (const edgeObject of edgeObjects) {
      const edgeVerification = constitutionalVerificationAuthority.verifyArtifact(edgeObject);
      if (!edgeVerification.valid) {
        throw new Error(`RelationshipEdge verification failed: ${edgeVerification.reason}`);
      }
    }

    return {
      proposal: constitutionalObject,
      edges: edgeObjects,
    };
  }

  /**
   * Generate CALLS edges from call graph
   * @param {Object} callGraph - Call graph object
   * @param {Array} functions - Function knowledge objects
   * @returns {Array} CALLS edges
   */
  _generateCallsEdges(callGraph, functions) {
    const edges = [];
    
    if (!callGraph || !callGraph.payload) return edges;

    // Build function name to ID map
    const functionMap = new Map();
    for (const func of functions) {
      functionMap.set(func.payload.name, func.id);
    }

    for (const call of callGraph.payload.calls) {
      const callerId = functionMap.get(call.caller);
      const calleeId = functionMap.get(call.callee);

      if (callerId && calleeId && callerId !== calleeId) {
        const edge = new RelationshipEdgeObject(
          callerId,
          calleeId,
          'CALLS',
          {
            strength: 1.0,
            direction: 'directed',
            call_site: call.call_site,
          }
        );
        edges.push(edge);
      }
    }

    return edges;
  }

  /**
   * Generate IMPLEMENTS edges from classes and interfaces
   * @param {Array} classes - Class knowledge objects
   * @param {Array} interfaces - Interface knowledge objects
   * @returns {Array} IMPLEMENTS edges
   */
  _generateImplementsEdges(classes, interfaces) {
    const edges = [];

    // Build interface name to ID map
    const interfaceMap = new Map();
    for (const iface of interfaces) {
      interfaceMap.set(iface.payload.name, iface.id);
    }

    for (const cls of classes) {
      for (const implementedInterface of cls.payload.implements) {
        const interfaceId = interfaceMap.get(implementedInterface);
        if (interfaceId) {
          const edge = new RelationshipEdgeObject(
            cls.id,
            interfaceId,
            'IMPLEMENTS',
            {
              strength: 1.0,
              direction: 'directed',
            }
          );
          edges.push(edge);
        }
      }
    }

    return edges;
  }

  /**
   * Generate DEPENDS_ON edges from import graph
   * @param {Object} importGraph - Import graph object
   * @param {Array} dependencies - Dependency knowledge objects
   * @returns {Array} DEPENDS_ON edges
   */
  _generateDependsEdges(importGraph, dependencies) {
    const edges = [];

    if (!importGraph || !importGraph.payload) return edges;

    // Build module to dependency ID map
    const dependencyMap = new Map();
    for (const dep of dependencies) {
      for (const depInfo of dep.payload.dependencies) {
        dependencyMap.set(depInfo.module, dep.id);
      }
    }

    // For each import, create DEPENDS_ON edge from the file to the dependency
    // This is a simplification - in production, you'd map files to their knowledge objects
    for (const imp of importGraph.payload.imports) {
      const depId = dependencyMap.get(imp.module);
      if (depId) {
        const edge = new RelationshipEdgeObject(
          importGraph.id, // Source is the file/blob
          depId,
          'DEPENDS_ON',
          {
            strength: 1.0,
            direction: 'directed',
          }
        );
        edges.push(edge);
      }
    }

    return edges;
  }

  /**
   * Generate DERIVED_FROM edges from lineage
   * @param {Object} knowledgeObjects - Knowledge objects
   * @returns {Array} DERIVED_FROM edges
   */
  _generateDerivedEdges(knowledgeObjects) {
    const edges = [];

    const allObjects = [
      ...knowledgeObjects.functions,
      ...knowledgeObjects.classes,
      ...knowledgeObjects.interfaces,
      ...knowledgeObjects.apis,
      ...knowledgeObjects.dependencies,
      ...knowledgeObjects.concepts,
    ];

    for (const obj of allObjects) {
      for (const relationship of obj.relationships) {
        if (relationship.relation_type === 'derived_from') {
          const edge = new RelationshipEdgeObject(
            obj.id,
            relationship.target_id,
            'DERIVED_FROM',
            {
              strength: relationship.strength,
              direction: 'directed',
            }
          );
          edges.push(edge);
        }
      }
    }

    return edges;
  }

  /**
   * Generate USES edges from function parameters
   * @param {Array} functions - Function knowledge objects
   * @returns {Array} USES edges
   */
  _generateUsesEdges(functions) {
    const edges = [];

    // Build parameter name to function ID map
    const paramMap = new Map();
    for (const func of functions) {
      for (const param of func.payload.parameters) {
        paramMap.set(param, func.id);
      }
    }

    for (const func of functions) {
      for (const param of func.payload.parameters) {
        // If a parameter is used as a function call, create USES edge
        // This is a simplification - in production, you'd analyze the AST
        const paramId = paramMap.get(param);
        if (paramId && paramId !== func.id) {
          const edge = new RelationshipEdgeObject(
            func.id,
            paramId,
            'USES',
            {
              strength: 1.0,
              direction: 'directed',
              parameter: param,
            }
          );
          edges.push(edge);
        }
      }
    }

    return edges;
  }

  /**
   * Generate OWNS edges from class properties
   * Constitutional Constraint: Properties and methods must be constitutional objects
   * @param {Array} classes - Class knowledge objects
   * @returns {Array} OWNS edges
   */
  _generateOwnsEdges(classes) {
    const edges = [];

    for (const cls of classes) {
      for (const prop of cls.payload.properties) {
        // Constitutional Constraint: Properties should be constitutional objects
        // For now, generate canonical ID from property data
        const propertyCanonicalData = {
          class_id: cls.id,
          property_name: prop.name,
          property_type: prop.type,
        };
        
        const { CanonicalBytes, CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
        const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
        
        const propertyCanonicalBytes = CanonicalBytes.serialize(propertyCanonicalData);
        const propertyCanonicalHash = CanonicalAuthority.hashBytes(propertyCanonicalBytes);
        const propertyId = identityAuthority.generateFromCanonicalHash(propertyCanonicalBytes, 'Property');
        
        const edge = new RelationshipEdgeObject(
          cls.id,
          propertyId,
          'OWNS',
          {
            strength: 1.0,
            direction: 'directed',
            property: prop.name,
          }
        );
        edges.push(edge);
      }

      for (const method of cls.payload.methods) {
        // Constitutional Constraint: Methods should be constitutional objects
        const methodCanonicalData = {
          class_id: cls.id,
          method_name: method.name,
          method_kind: method.kind,
        };
        
        const { CanonicalBytes, CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
        const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
        
        const methodCanonicalBytes = CanonicalBytes.serialize(methodCanonicalData);
        const methodCanonicalHash = CanonicalAuthority.hashBytes(methodCanonicalBytes);
        const methodId = identityAuthority.generateFromCanonicalHash(methodCanonicalBytes, 'Method');
        
        const edge = new RelationshipEdgeObject(
          cls.id,
          methodId,
          'OWNS',
          {
            strength: 1.0,
            direction: 'directed',
            method: method.name,
          }
        );
        edges.push(edge);
      }
    }

    return edges;
  }

  /**
   * Generate proposal ID
   * Constitutional Constraint: Must derive from CanonicalBytes → CanonicalHash → Identity
   * Never use Date.now() or Math.random()
   * @param {Array} edges - Edges to generate proposal ID from
   * @returns {string} Proposal ID
   */
  _generateProposalId(edges) {
    // Sort edges deterministically for canonical proposal ID
    const sortedEdges = [...edges].sort((a, b) => {
      if (a._sourceId !== b._sourceId) return a._sourceId.localeCompare(b._sourceId);
      if (a._targetId !== b._targetId) return a._targetId.localeCompare(b._targetId);
      return a._edgeType.localeCompare(b._edgeType);
    });

    // Create canonical representation of edges
    const canonicalData = {
      edges: sortedEdges.map(edge => ({
        source_id: edge._sourceId,
        target_id: edge._targetId,
        edge_type: edge._edgeType,
      })),
    };

    // Generate canonical bytes
    const canonicalBytes = CanonicalBytes.serialize(canonicalData);
    
    // Generate canonical hash
    const canonicalHash = CanonicalAuthority.hashBytes(canonicalBytes);
    
    // Generate identity from canonical hash
    const identity = identityAuthority.generateFromCanonicalHash(canonicalBytes, 'RelationshipProposal');

    return identity;
  }
}

module.exports = { RelationshipRuntime };
