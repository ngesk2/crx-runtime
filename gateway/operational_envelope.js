/**
 * Operational Envelope Pattern
 * 
 * Ω.63 — Operational Envelope Pattern
 * 
 * A replay-verifiable kernel separates:
 * 
 * Constitutional State (replay-derived):
 * - payload
 * - authority
 * - lineage
 * - canonical_hash
 * 
 * Operational Metadata (wall-clock, ingestion):
 * - observed_at
 * - parser_version
 * - gateway
 * - hostname
 * - ingestion_latency
 * 
 * Constitutional Constraint: Operational metadata never affects constitutional identity.
 * The envelope wraps the constitutional object but is excluded from canonical hashing.
 */

const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class OperationalEnvelope {
  constructor(constitutionalObject, operationalMetadata = {}) {
    this._constitutionalObject = constitutionalObject;
    this._operationalMetadata = {
      parser_version: operationalMetadata.parser_version || 'unknown',
      gateway: operationalMetadata.gateway || 'unknown',
      hostname: operationalMetadata.hostname || 'unknown',
      ingestion_latency_ms: operationalMetadata.ingestion_latency_ms || 0,
      observed_at: operationalMetadata.observed_at,
      pipeline_stage: operationalMetadata.pipeline_stage,
      source: operationalMetadata.source,
      correlation_id: operationalMetadata.correlation_id,
      ...operationalMetadata,
    };
  }

  /**
   * Get the constitutional object
   * 
   * Constitutional Constraint: Returns immutable deep clone to prevent mutation.
   * A replay kernel should never expose mutable constitutional state.
   * 
   * @returns {Object} The wrapped constitutional object (immutable deep clone)
   */
  getConstitutionalObject() {
    return this._deepClone(this._constitutionalObject);
  }

  /**
   * Deep clone an object to ensure immutability
   * 
   * @param {Object} obj - Object to clone
   * @returns {Object} Deep cloned object
   */
  _deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this._deepClone(item));
    }

    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this._deepClone(obj[key]);
      }
    }

    return cloned;
  }

  /**
   * Get operational metadata
   * 
   * @returns {Object} The operational metadata
   */
  getOperationalMetadata() {
    return { ...this._operationalMetadata };
  }

  /**
   * Get the canonical hash of the constitutional object
   * 
   * @returns {string} Canonical hash (excludes operational envelope)
   */
  getCanonicalHash() {
    return this._constitutionalObject.canonical_hash;
  }

  /**
   * Get the constitutional object ID
   * 
   * @returns {string} Constitutional object ID
   */
  getConstitutionalId() {
    return this._constitutionalObject.id;
  }

  /**
   * Serialize the envelope for persistence
   * 
   * Constitutional object and operational envelope are stored separately
   * to ensure replay determinism.
   * 
   * @returns {Object} Serialized envelope
   */
  serialize() {
    return {
      constitutional_id: this._constitutionalObject.id,
      constitutional_hash: this._constitutionalObject.canonical_hash,
      operational_metadata: this._operationalMetadata,
      envelope_version: '1.0.0',
    };
  }

  /**
   * Deserialize an envelope
   * 
   * @param {Object} serialized - Serialized envelope data
   * @param {Object} constitutionalObject - The constitutional object
   * @returns {OperationalEnvelope} Deserialized envelope
   */
  static deserialize(serialized, constitutionalObject) {
    return new OperationalEnvelope(constitutionalObject, serialized.operational_metadata);
  }

  /**
   * Create envelope from constitutional object
   * 
   * Factory method to wrap a constitutional object with operational metadata.
   * 
   * @param {Object} constitutionalObject - The constitutional object to wrap
   * @param {Object} operationalMetadata - Operational metadata
   * @returns {OperationalEnvelope} The envelope
   */
  static wrap(constitutionalObject, operationalMetadata = {}) {
    return new OperationalEnvelope(constitutionalObject, operationalMetadata);
  }

  /**
   * Extract constitutional object from envelope
   * 
   * @param {OperationalEnvelope} envelope - The envelope
   * @returns {Object} The constitutional object
   */
  static unwrap(envelope) {
    return envelope.getConstitutionalObject();
  }
}

/**
 * Constitutional Object Factory
 * 
 * Creates constitutional objects without operational metadata.
 * Operational envelopes are applied separately.
 */
class ConstitutionalObjectFactory {
  constructor() {
    this._authority = 'ConstitutionalObjectFactory';
    this._version = '1.0.0';
  }

  /**
   * Create a constitutional object
   * 
   * Constitutional Object Schema:
   * {
   *   id: string,
   *   kind: string,
   *   canonical_hash: string,
   *   payload: Object,
   *   authority: string,
   *   lineage: Object,
   *   relationships: Array,
   *   metadata: Object
   * }
   * 
   * Note: No identity.created_at, no operational metadata.
   * 
   * @param {Object} spec - Constitutional object specification
   * @returns {Object} Constitutional object
   */
  createConstitutionalObject(spec) {
    const canonicalHash = this._computeCanonicalHash(spec);

    const constitutionalObject = {
      id: spec.id || `obj-${canonicalHash}`,
      kind: spec.kind,
      canonical_hash: canonicalHash,
      payload: spec.payload,
      authority: spec.authority || this._authority,
      lineage: spec.lineage || {
        source_id: null,
        source_kind: 'Unknown',
      },
      relationships: spec.relationships || [],
      metadata: {
        schema_version: this._version,
        ...spec.metadata,
      },
    };

    return constitutionalObject;
  }

  /**
   * Compute canonical hash
   * 
   * Hashes only the constitutional fields, excluding operational metadata.
   * 
   * @param {Object} spec - Constitutional object specification
   * @returns {string} Canonical hash
   */
  _computeCanonicalHash(spec) {
    const constitutionalFields = {
      kind: spec.kind,
      payload: spec.payload,
      authority: spec.authority || this._authority,
      lineage: spec.lineage,
      relationships: spec.relationships || [],
      metadata: spec.metadata,
    };
    return CanonicalAuthority.hash(constitutionalFields);
  }

  /**
   * Create a file constitutional object
   * 
   * @param {Object} fileSpec - File specification
   * @returns {Object} Constitutional file object
   */
  createFileObject(fileSpec) {
    return this.createConstitutionalObject({
      kind: 'File',
      payload: {
        path: fileSpec.path,
        content_hash: fileSpec.content_hash,
        size: fileSpec.size,
        encoding: fileSpec.encoding || 'utf-8',
      },
      authority: 'FilesystemScanner',
      lineage: {
        source_id: fileSpec.repo_id,
        source_kind: 'Repository',
      },
      metadata: {
        file_type: fileSpec.file_type || 'unknown',
        language: fileSpec.language || 'unknown',
      },
    });
  }

  /**
   * Create an AST constitutional object
   * 
   * @param {Object} astSpec - AST specification
   * @returns {Object} Constitutional AST object
   */
  createASTObject(astSpec) {
    return this.createConstitutionalObject({
      kind: 'AST',
      payload: {
        language: astSpec.language,
        root_hash: astSpec.root_hash,
        node_count: astSpec.node_count,
        tree_structure: astSpec.tree_structure,
      },
      authority: 'LanguageParser',
      lineage: {
        source_id: astSpec.file_id,
        source_kind: 'File',
      },
      metadata: {
        parser_type: astSpec.parser_type || 'unknown',
        ast_version: astSpec.ast_version || '1.0.0',
      },
    });
  }

  /**
   * Create a symbol constitutional object
   * 
   * @param {Object} symbolSpec - Symbol specification
   * @returns {Object} Constitutional symbol object
   */
  createSymbolObject(symbolSpec) {
    return this.createConstitutionalObject({
      kind: 'Symbol',
      payload: {
        canonical_name: symbolSpec.canonical_name,
        canonical_kind: symbolSpec.canonical_kind,
        canonical_signature: symbolSpec.canonical_signature,
        relationships_hash: symbolSpec.relationships_hash,
        provenance: symbolSpec.provenance,
        relationships: symbolSpec.relationships,
        properties: symbolSpec.properties,
      },
      authority: 'CanonicalSymbolFactory',
      lineage: {
        source_id: symbolSpec.ast_id,
        source_kind: 'AST',
      },
      metadata: {
        canonical_kind: symbolSpec.canonical_kind,
        language: symbolSpec.provenance?.language || 'unknown',
      },
    });
  }

  /**
   * Create a graph constitutional object
   * 
   * @param {Object} graphSpec - Graph specification
   * @returns {Object} Constitutional graph object
   */
  createGraphObject(graphSpec) {
    return this.createConstitutionalObject({
      kind: 'Graph',
      payload: {
        graph_type: graphSpec.graph_type,
        node_ids: graphSpec.node_ids,
        edge_ids: graphSpec.edge_ids,
        node_root: graphSpec.node_root,
        edge_root: graphSpec.edge_root,
        node_count: graphSpec.node_count,
        edge_count: graphSpec.edge_count,
        graph_root: graphSpec.graph_root,
      },
      authority: 'CanonicalGraphCompiler',
      lineage: {
        source_id: graphSpec.repo_id,
        source_kind: 'Repository',
      },
      metadata: {
        graph_type: graphSpec.graph_type,
        schema_version: '1.0.0',
      },
    });
  }

  /**
   * Create a repository constitutional object
   * 
   * @param {Object} repoSpec - Repository specification
   * @returns {Object} Constitutional repository object
   */
  createRepositoryObject(repoSpec) {
    return this.createConstitutionalObject({
      kind: 'Repository',
      payload: {
        repo_id: repoSpec.repo_id,
        commit_sha: repoSpec.commit_sha,
        file_root: repoSpec.file_root,
        symbol_root: repoSpec.symbol_root,
        graph_root: repoSpec.graph_root,
        file_count: repoSpec.file_count,
        symbol_count: repoSpec.symbol_count,
        graph_count: repoSpec.graph_count,
      },
      authority: 'UniversalSourceAnalysisPipeline',
      lineage: {
        source_id: null,
        source_kind: 'Git',
      },
      metadata: {
        repository_type: repoSpec.repository_type || 'git',
        schema_version: '1.0.0',
      },
    });
  }

  /**
   * Create a mission constitutional object
   * 
   * @param {Object} missionSpec - Mission specification
   * @returns {Object} Constitutional mission object
   */
  createMissionObject(missionSpec) {
    return this.createConstitutionalObject({
      kind: 'Mission',
      payload: {
        reasoning: missionSpec.reasoning,
        tasks: missionSpec.tasks,
        priority: missionSpec.priority,
        target_id: missionSpec.target_id,
        target_kind: missionSpec.target_kind,
      },
      authority: missionSpec.authority || 'MissionGenerator',
      lineage: {
        source_id: missionSpec.source_id,
        source_kind: missionSpec.source_kind || 'Analysis',
      },
      metadata: {
        mission_type: missionSpec.mission_type || 'improvement',
        schema_version: '1.0.0',
      },
    });
  }

  /**
   * Create a reflection constitutional object
   * 
   * @param {Object} reflectionSpec - Reflection specification
   * @returns {Object} Constitutional reflection object
   */
  createReflectionObject(reflectionSpec) {
    return this.createConstitutionalObject({
      kind: 'Reflection',
      payload: {
        insights: reflectionSpec.insights,
        confidence: reflectionSpec.confidence,
        source_id: reflectionSpec.source_id,
        source_kind: reflectionSpec.source_kind,
        patterns: reflectionSpec.patterns,
        recommendations: reflectionSpec.recommendations,
      },
      authority: reflectionSpec.authority || 'ReflectionEngine',
      lineage: {
        source_id: reflectionSpec.source_id,
        source_kind: reflectionSpec.source_kind || 'Analysis',
      },
      metadata: {
        reflection_type: reflectionSpec.reflection_type || 'general',
        schema_version: '1.0.0',
      },
    });
  }

  /**
   * Create a proof constitutional object
   * 
   * @param {Object} proofSpec - Proof specification
   * @returns {Object} Constitutional proof object
   */
  createProofObject(proofSpec) {
    return this.createConstitutionalObject({
      kind: 'Proof',
      payload: {
        repository_root: proofSpec.repository_root,
        mission_root: proofSpec.mission_root,
        reflection_root: proofSpec.reflection_root,
        proof_root: proofSpec.proof_root,
        mission_count: proofSpec.mission_count,
        reflection_count: proofSpec.reflection_count,
      },
      authority: 'ProofAuthority',
      lineage: {
        source_id: proofSpec.repo_id,
        source_kind: 'Repository',
      },
      metadata: {
        proof_type: proofSpec.proof_type || 'constitutional',
        schema_version: '1.0.0',
      },
    });
  }

  /**
   * Create a mission rule constitutional object
   * 
   * @param {Object} ruleSpec - Mission rule specification
   * @returns {Object} Constitutional mission rule object
   */
  createMissionRuleObject(ruleSpec) {
    return this.createConstitutionalObject({
      kind: 'MissionRule',
      payload: {
        rule_id: ruleSpec.rule_id,
        rule_name: ruleSpec.rule_name,
        rule_type: ruleSpec.rule_type,
        conditions: ruleSpec.conditions,
        actions: ruleSpec.actions,
        confidence_threshold: ruleSpec.confidence_threshold,
        pattern_matchers: ruleSpec.pattern_matchers,
        priority_mapping: ruleSpec.priority_mapping,
        task_templates: ruleSpec.task_templates,
      },
      authority: ruleSpec.authority || 'MissionRuleAuthority',
      lineage: {
        source_id: ruleSpec.source_id || null,
        source_kind: ruleSpec.source_kind || 'Constitutional',
      },
      metadata: {
        schema_version: '1.0.0',
      },
    });
  }
}

/**
 * Operational Metadata Collector
 * 
 * Collects operational metadata during pipeline execution.
 */
class OperationalMetadataCollector {
  constructor() {
    this._gateway = process.env.GATEWAY_NAME || 'unknown';
    this._hostname = require('os').hostname();
    this._parserVersions = new Map();
  }

  /**
   * Register parser version
   * 
   * @param {string} language - Programming language
   * @param {string} version - Parser version
   */
  registerParserVersion(language, version) {
    this._parserVersions.set(language, version);
  }

  /**
   * Get parser version
   * 
   * @param {string} language - Programming language
   * @returns {string} Parser version
   */
  getParserVersion(language) {
    return this._parserVersions.get(language) || 'unknown';
  }

  /**
   * Collect operational metadata
   * 
   * @param {Object} context - Execution context
   * @returns {Object} Operational metadata
   */
  collect(context = {}) {
    return {
      observed_at: new Date(constitutionalTimeAuthority.now()).toISOString(),
      parser_version: context.parser_version || 'unknown',
      gateway: this._gateway,
      hostname: this._hostname,
      ingestion_latency_ms: context.ingestion_latency_ms || 0,
      pipeline_stage: context.pipeline_stage || 'unknown',
      source: context.source || 'unknown',
      correlation_id: context.correlation_id || null,
    };
  }

  /**
   * Measure ingestion latency
   * 
   * @param {Function} fn - Function to measure
   * @returns {Object} Result with latency
   */
  async measureLatency(fn) {
    const start = constitutionalTimeAuthority.nowAsMillis();
    const result = await fn();
    const latency = constitutionalTimeAuthority.nowAsMillis() - start;
    return {
      result,
      latency_ms: latency,
    };
  }
}

module.exports = {
  OperationalEnvelope,
  ConstitutionalObjectFactory,
  OperationalMetadataCollector,
};
