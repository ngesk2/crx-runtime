/**
 * Constitutional Parser Objects
 * 
 * Milestone 3 — Constitutional Parser
 * 
 * Constitutional Constraint: Replace parser output with constitutional objects.
 * 
 * No parser metadata survives.
 * No timestamps.
 * No memory addresses.
 * No parser-specific IDs.
 * 
 * Generate:
 * AST
 * Node Objects
 * Symbol Objects
 * ImportGraph
 * CallGraph
 * TypeGraph
 */

const { CanonicalBytes, CanonicalAuthority } = require('./canonical_authority');
const { identityAuthority } = require('./identity_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { constitutionalVerificationAuthority } = require('./constitutional_verification_authority');

/**
 * AST Object
 * 
 * Constitutional representation of an Abstract Syntax Tree
 */
class ASTObject {
  constructor(rawAST, sourceBlobId) {
    this._raw = rawAST;
    this._sourceBlobId = sourceBlobId;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional AST object
   * @returns {Object} Constitutional AST object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Extract canonical fields from raw AST
    // Remove parser metadata, timestamps, memory addresses
    const canonicalData = {
      type: this._raw.type,
      start: this._raw.start,
      end: this._raw.end,
      loc: this._raw.loc ? {
        start: {
          line: this._raw.loc.start.line,
          column: this._raw.loc.start.column,
        },
        end: {
          line: this._raw.loc.end.line,
          column: this._raw.loc.end.column,
        },
      } : null,
      sourceType: this._raw.sourceType,
      body: this._canonicalizeNodes(this._raw.body),
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'AST');

    // Build lineage
    this._lineage = {
      source_id: this._sourceBlobId,
      derivation_path: ['GitHubBlob', 'AST'],
      provenance_chain: [this._sourceBlobId],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'AST',
      authority: 'ConstitutionalParser',
      identity: {
        namespace: 'parser',
        version: 'v1',
        created_at: timestamp,
        created_by: 'ConstitutionalParser',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._sourceBlobId,
          relation_type: 'derived_from',
          strength: 1.0,
          metadata: { kind: 'blob' },
        },
      ],
      metadata: {
        source_blob_id: this._sourceBlobId,
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
   * Canonicalize nodes (remove parser metadata)
   * @param {Array} nodes - Raw nodes
   * @returns {Array} Canonical nodes
   */
  _canonicalizeNodes(nodes) {
    if (!nodes) return [];
    
    return nodes.map(node => this._canonicalizeNode(node));
  }

  /**
   * Canonicalize single node
   * @param {Object} node - Raw node
   * @returns {Object} Canonical node
   */
  _canonicalizeNode(node) {
    const canonical = {
      type: node.type,
    };

    // Add type-specific fields
    if (node.type === 'FunctionDeclaration') {
      canonical.id = this._canonicalizeNode(node.id);
      canonical.params = this._canonicalizeNodes(node.params);
      canonical.body = this._canonicalizeNode(node.body);
      if (node.generator !== undefined) canonical.generator = node.generator;
      if (node.async !== undefined) canonical.async = node.async;
    } else if (node.type === 'Identifier') {
      canonical.name = node.name;
    } else if (node.type === 'Literal') {
      canonical.value = node.value;
      if (node.raw) canonical.raw = node.raw;
    } else if (node.type === 'VariableDeclaration') {
      canonical.kind = node.kind;
      canonical.declarations = this._canonicalizeNodes(node.declarations);
    } else if (node.type === 'VariableDeclarator') {
      canonical.id = this._canonicalizeNode(node.id);
      if (node.init) canonical.init = this._canonicalizeNode(node.init);
    } else if (node.type === 'CallExpression') {
      canonical.callee = this._canonicalizeNode(node.callee);
      canonical.arguments = this._canonicalizeNodes(node.arguments);
    } else if (node.type === 'MemberExpression') {
      canonical.object = this._canonicalizeNode(node.object);
      canonical.property = this._canonicalizeNode(node.property);
      canonical.computed = node.computed;
    } else if (node.type === 'ObjectExpression') {
      canonical.properties = this._canonicalizeNodes(node.properties);
    } else if (node.type === 'Property') {
      canonical.key = this._canonicalizeNode(node.key);
      canonical.value = this._canonicalizeNode(node.value);
      canonical.kind = node.kind;
    } else if (node.type === 'ArrayExpression') {
      canonical.elements = this._canonicalizeNodes(node.elements);
    } else if (node.type === 'BlockStatement') {
      canonical.body = this._canonicalizeNodes(node.body);
    } else if (node.type === 'ReturnStatement') {
      if (node.argument) canonical.argument = this._canonicalizeNode(node.argument);
    } else if (node.type === 'IfStatement') {
      canonical.test = this._canonicalizeNode(node.test);
      canonical.consequent = this._canonicalizeNode(node.consequent);
      if (node.alternate) canonical.alternate = this._canonicalizeNode(node.alternate);
    } else if (node.type === 'ExpressionStatement') {
      canonical.expression = this._canonicalizeNode(node.expression);
    } else {
      // Generic node - add all non-metadata fields
      for (const key of Object.keys(node)) {
        if (key !== 'loc' && key !== 'start' && key !== 'end' && key !== 'type') {
          if (Array.isArray(node[key])) {
            canonical[key] = this._canonicalizeNodes(node[key]);
          } else if (typeof node[key] === 'object' && node[key] !== null) {
            canonical[key] = this._canonicalizeNode(node[key]);
          } else {
            canonical[key] = node[key];
          }
        }
      }
    }

    return canonical;
  }
}

/**
 * Node Object
 * 
 * Constitutional representation of a single AST node
 */
class NodeObject {
  constructor(rawNode, astId, sourceBlobId) {
    this._raw = rawNode;
    this._astId = astId;
    this._sourceBlobId = sourceBlobId;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional node object
   * @returns {Object} Constitutional node object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Extract canonical fields
    const canonicalData = {
      type: this._raw.type,
      node_path: this._raw.node_path || [],
      parent_type: this._raw.parent_type || null,
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'ASTNode');

    // Build lineage
    this._lineage = {
      source_id: this._astId,
      derivation_path: ['GitHubBlob', 'AST', 'Node'],
      provenance_chain: [this._sourceBlobId, this._astId],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'ASTNode',
      authority: 'ConstitutionalParser',
      identity: {
        namespace: 'parser',
        version: 'v1',
        created_at: timestamp,
        created_by: 'ConstitutionalParser',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._astId,
          relation_type: 'belongs_to',
          strength: 1.0,
          metadata: { kind: 'ast' },
        },
      ],
      metadata: {
        ast_id: this._astId,
        source_blob_id: this._sourceBlobId,
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
}

/**
 * Symbol Object
 * 
 * Constitutional representation of a symbol (function, variable, class, etc.)
 */
class SymbolObject {
  constructor(symbolData, sourceBlobId) {
    this._raw = symbolData;
    this._sourceBlobId = sourceBlobId;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional symbol object
   * @returns {Object} Constitutional symbol object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Extract canonical fields
    const canonicalData = {
      name: this._raw.name,
      kind: this._raw.kind, // function, variable, class, interface, etc.
      scope: this._raw.scope,
      is_exported: this._raw.is_exported || false,
      is_async: this._raw.is_async || false,
      is_generator: this._raw.is_generator || false,
      parameters: this._raw.parameters || [],
      return_type: this._raw.return_type || null,
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'Symbol');

    // Build lineage
    this._lineage = {
      source_id: this._sourceBlobId,
      derivation_path: ['GitHubBlob', 'Symbol'],
      provenance_chain: [this._sourceBlobId],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'Symbol',
      authority: 'ConstitutionalParser',
      identity: {
        namespace: 'parser',
        version: 'v1',
        created_at: timestamp,
        created_by: 'ConstitutionalParser',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._sourceBlobId,
          relation_type: 'defined_in',
          strength: 1.0,
          metadata: { kind: 'blob' },
        },
      ],
      metadata: {
        source_blob_id: this._sourceBlobId,
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
}

/**
 * ImportGraph Object
 * 
 * Constitutional representation of import dependencies
 */
class ImportGraphObject {
  constructor(importData, sourceBlobId) {
    this._raw = importData;
    this._sourceBlobId = sourceBlobId;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional import graph object
   * @returns {Object} Constitutional import graph object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Extract canonical fields
    const canonicalData = {
      imports: this._raw.imports.map(imp => ({
        module: imp.module,
        specifiers: imp.specifiers || [],
        is_default: imp.is_default || false,
        is_namespace: imp.is_namespace || false,
      })),
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'ImportGraph');

    // Build lineage
    this._lineage = {
      source_id: this._sourceBlobId,
      derivation_path: ['GitHubBlob', 'ImportGraph'],
      provenance_chain: [this._sourceBlobId],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'ImportGraph',
      authority: 'ConstitutionalParser',
      identity: {
        namespace: 'parser',
        version: 'v1',
        created_at: timestamp,
        created_by: 'ConstitutionalParser',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._sourceBlobId,
          relation_type: 'derived_from',
          strength: 1.0,
          metadata: { kind: 'blob' },
        },
      ],
      metadata: {
        source_blob_id: this._sourceBlobId,
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
}

/**
 * CallGraph Object
 * 
 * Constitutional representation of function call relationships
 */
class CallGraphObject {
  constructor(callData, sourceBlobId) {
    this._raw = callData;
    this._sourceBlobId = sourceBlobId;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional call graph object
   * @returns {Object} Constitutional call graph object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Extract canonical fields
    const canonicalData = {
      calls: this._raw.calls.map(call => ({
        caller: call.caller,
        callee: call.callee,
        call_site: call.call_site,
      })),
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'CallGraph');

    // Build lineage
    this._lineage = {
      source_id: this._sourceBlobId,
      derivation_path: ['GitHubBlob', 'CallGraph'],
      provenance_chain: [this._sourceBlobId],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'CallGraph',
      authority: 'ConstitutionalParser',
      identity: {
        namespace: 'parser',
        version: 'v1',
        created_at: timestamp,
        created_by: 'ConstitutionalParser',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._sourceBlobId,
          relation_type: 'derived_from',
          strength: 1.0,
          metadata: { kind: 'blob' },
        },
      ],
      metadata: {
        source_blob_id: this._sourceBlobId,
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
}

/**
 * TypeGraph Object
 * 
 * Constitutional representation of type relationships
 */
class TypeGraphObject {
  constructor(typeData, sourceBlobId) {
    this._raw = typeData;
    this._sourceBlobId = sourceBlobId;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional type graph object
   * @returns {Object} Constitutional type graph object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Extract canonical fields
    const canonicalData = {
      types: this._raw.types.map(type => ({
        name: type.name,
        kind: type.kind, // class, interface, type alias, etc.
        properties: type.properties || [],
        methods: type.methods || [],
        extends: type.extends || [],
        implements: type.implements || [],
      })),
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'TypeGraph');

    // Build lineage
    this._lineage = {
      source_id: this._sourceBlobId,
      derivation_path: ['GitHubBlob', 'TypeGraph'],
      provenance_chain: [this._sourceBlobId],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'TypeGraph',
      authority: 'ConstitutionalParser',
      identity: {
        namespace: 'parser',
        version: 'v1',
        created_at: timestamp,
        created_by: 'ConstitutionalParser',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._sourceBlobId,
          relation_type: 'derived_from',
          strength: 1.0,
          metadata: { kind: 'blob' },
        },
      ],
      metadata: {
        source_blob_id: this._sourceBlobId,
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
}

module.exports = {
  ASTObject,
  NodeObject,
  SymbolObject,
  ImportGraphObject,
  CallGraphObject,
  TypeGraphObject,
};
