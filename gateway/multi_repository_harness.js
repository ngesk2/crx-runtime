/**
 * Multi-Repository Harness
 * 
 * Milestone 12 — Multi-Repository
 * 
 * Constitutional Constraint: Verify merge determinism.
 * 
 * Verify:
 * A + B == B + A
 * 
 * Graph merges must be canonical.
 * Merge ordering changes should not affect hashes.
 */

const { RepositoryStore } = require('./repository_store');
const { GitHubConstitutionalPipeline } = require('./github_constitutional_pipeline');
const { ConstitutionalParser } = require('./constitutional_parser');
const { KnowledgeRuntime } = require('./knowledge_runtime');
const { RelationshipRuntime } = require('./relationship_runtime');
const { KnowledgeGraphRuntime } = require('./knowledge_graph');
const { constitutionalVerificationAuthority } = require('./constitutional_verification_authority');

class MultiRepositoryHarness {
  constructor(config) {
    this._config = config;
    this._repositoryStore = new RepositoryStore(config.postgresPool);
    this._namespace = 'multirepo';
    this._version = '1.0.0';
  }

  /**
   * Run multi-repository test
   * 
   * @returns {Object} Multi-repository test results
   */
  async run() {
    console.log('=== Multi-Repository Harness ===\n');
    console.log('Testing merge determinism: A + B == B + A\n');

    const results = {
      repoA: null,
      repoB: null,
      mergeAB: null,
      mergeBA: null,
      verification: null,
    };

    // Process Repo A
    console.log('Processing Repo A...');
    results.repoA = await this._processRepository('repo-a');
    console.log(`  ✅ Repo A complete: ${results.repoA.graph.id}\n`);

    // Process Repo B
    console.log('Processing Repo B...');
    results.repoB = await this._processRepository('repo-b');
    console.log(`  ✅ Repo B complete: ${results.repoB.graph.id}\n`);

    // Merge A then B
    console.log('Merging A + B...');
    results.mergeAB = await this._mergeRepositories(results.repoA, results.repoB);
    console.log(`  ✅ Merge A+B complete: ${results.mergeAB.graph.id}\n`);

    // Reset repository
    console.log('Resetting repository...');
    await this._resetRepository();
    console.log('  ✅ Repository reset\n');

    // Process Repo A again (after reset)
    console.log('Processing Repo A (after reset)...');
    results.repoA = await this._processRepository('repo-a');
    console.log(`  ✅ Repo A complete: ${results.repoA.graph.id}\n`);

    // Process Repo B again (after reset)
    console.log('Processing Repo B (after reset)...');
    results.repoB = await this._processRepository('repo-b');
    console.log(`  ✅ Repo B complete: ${results.repoB.graph.id}\n`);

    // Merge B then A
    console.log('Merging B + A...');
    results.mergeBA = await this._mergeRepositories(results.repoB, results.repoA);
    console.log(`  ✅ Merge B+A complete: ${results.mergeBA.graph.id}\n`);

    // Verify merge determinism
    console.log('Verifying merge determinism...');
    results.verification = await this._verifyMergeDeterminism(results.mergeAB, results.mergeBA);
    console.log();

    this._printResults(results.verification);
    return results;
  }

  /**
   * Process a single repository
   * @param {string} repoName - Repository name
   * @returns {Object} Repository results
   */
  async _processRepository(repoName) {
    const results = {
      name: repoName,
      github: null,
      parser: null,
      knowledge: null,
      relationships: null,
      graph: null,
    };

    try {
      // GitHub Constitutional Pipeline (placeholder - use mock data)
      results.github = this._createMockGitHubData(repoName);

      // Constitutional Parser (placeholder)
      if (results.github.blobs.length > 0) {
        const parser = new ConstitutionalParser();
        const sourceCode = `// ${repoName} code\nconst x = 42;`;
        results.parser = parser.parse(results.github.blobs[0], sourceCode);
      }

      // Knowledge Runtime
      if (results.parser) {
        const knowledgeRuntime = new KnowledgeRuntime();
        results.knowledge = knowledgeRuntime.transform(results.parser);
      }

      // Relationship Runtime
      if (results.knowledge && results.parser) {
        const relationshipRuntime = new RelationshipRuntime();
        results.relationships = relationshipRuntime.generate(results.knowledge, results.parser);
      }

      // Knowledge Graph
      if (results.knowledge && results.relationships) {
        const graphRuntime = new KnowledgeGraphRuntime();
        results.graph = graphRuntime.construct(results.knowledge, results.relationships.proposal);
      }

    } catch (error) {
      console.error(`Repository ${repoName} error: ${error.message}`);
      throw error;
    }

    return results;
  }

  /**
   * Merge two repositories
   * @param {Object} repo1 - First repository
   * @param {Object} repo2 - Second repository
   * @returns {Object} Merged results
   */
  async _mergeRepositories(repo1, repo2) {
    const results = {
      mergedKnowledge: null,
      mergedRelationships: null,
      mergedGraph: null,
    };

    // Merge knowledge objects
    results.mergedKnowledge = this._mergeKnowledge(repo1.knowledge, repo2.knowledge);

    // Merge relationship edges
    results.mergedRelationships = this._mergeRelationships(repo1.relationships, repo2.relationships);

    // Construct merged graph
    const graphRuntime = new KnowledgeGraphRuntime();
    results.mergedGraph = graphRuntime.construct(results.mergedKnowledge, results.mergedRelationships.proposal);

    return results;
  }

  /**
   * Merge knowledge objects from two repositories
   * @param {Object} knowledge1 - First knowledge
   * @param {Object} knowledge2 - Second knowledge
   * @returns {Object} Merged knowledge
   */
  _mergeKnowledge(knowledge1, knowledge2) {
    return {
      functions: [...(knowledge1.functions || []), ...(knowledge2.functions || [])],
      classes: [...(knowledge1.classes || []), ...(knowledge2.classes || [])],
      interfaces: [...(knowledge1.interfaces || []), ...(knowledge2.interfaces || [])],
      apis: [...(knowledge1.apis || []), ...(knowledge2.apis || [])],
      dependencies: [...(knowledge1.dependencies || []), ...(knowledge2.dependencies || [])],
      concepts: [...(knowledge1.concepts || []), ...(knowledge2.concepts || [])],
    };
  }

  /**
   * Merge relationship edges from two repositories
   * @param {Object} relationships1 - First relationships
   * @param {Object} relationships2 - Second relationships
   * @returns {Object} Merged relationships
   */
  _mergeRelationships(relationships1, relationships2) {
    const edges1 = relationships1 ? relationships1.edges : [];
    const edges2 = relationships2 ? relationships2.edges : [];
    
    // Combine edges and deduplicate by edge ID
    const edgeMap = new Map();
    
    for (const edge of edges1) {
      edgeMap.set(edge.id, edge);
    }
    
    for (const edge of edges2) {
      edgeMap.set(edge.id, edge);
    }
    
    const mergedEdges = Array.from(edgeMap.values());
    
    return {
      proposal: relationships1 ? relationships1.proposal : null,
      edges: mergedEdges,
    };
  }

  /**
   * Verify merge determinism
   * @param {Object} mergeAB - Merge A+B results
   * @param {Object} mergeBA - Merge B+A results
   * @returns {Object} Verification results
   */
  async _verifyMergeDeterminism(mergeAB, mergeBA) {
    const verification = {
      graphRootIdentical: true,
      topologyHashIdentical: true,
      nodeCountIdentical: true,
      edgeCountIdentical: true,
      nodeIdsIdentical: true,
      edgeIdsIdentical: true,
    };

    // Compare graph roots
    if (mergeAB.mergedGraph.canonical_hash !== mergeBA.mergedGraph.canonical_hash) {
      verification.graphRootIdentical = false;
      console.log('  ❌ Graph root hash differs');
    }

    // Compare topology hashes
    if (mergeAB.mergedGraph.payload.topology_hash !== mergeBA.mergedGraph.payload.topology_hash) {
      verification.topologyHashIdentical = false;
      console.log('  ❌ Graph topology hash differs');
    }

    // Compare node counts
    if (mergeAB.mergedGraph.payload.node_count !== mergeBA.mergedGraph.payload.node_count) {
      verification.nodeCountIdentical = false;
      console.log('  ❌ Node count differs');
    }

    // Compare edge counts
    if (mergeAB.mergedGraph.payload.edge_count !== mergeBA.mergedGraph.payload.edge_count) {
      verification.edgeCountIdentical = false;
      console.log('  ❌ Edge count differs');
    }

    // Compare node IDs
    const nodesAB = mergeAB.mergedGraph.payload.nodes.map(n => n.id).sort();
    const nodesBA = mergeBA.mergedGraph.payload.nodes.map(n => n.id).sort();
    if (JSON.stringify(nodesAB) !== JSON.stringify(nodesBA)) {
      verification.nodeIdsIdentical = false;
      console.log('  ❌ Node IDs differ');
    }

    // Compare edge IDs
    const edgesAB = mergeAB.mergedGraph.payload.edges.map(e => e.id).sort();
    const edgesBA = mergeBA.mergedGraph.payload.edges.map(e => e.id).sort();
    if (JSON.stringify(edgesAB) !== JSON.stringify(edgesBA)) {
      verification.edgeIdsIdentical = false;
      console.log('  ❌ Edge IDs differ');
    }

    verification.passed = verification.graphRootIdentical && verification.topologyHashIdentical &&
                         verification.nodeCountIdentical && verification.edgeCountIdentical &&
                         verification.nodeIdsIdentical && verification.edgeIdsIdentical;

    return verification;
  }

  /**
   * Reset repository
   */
  async _resetRepository() {
    await this._repositoryStore.pool.query('DELETE FROM repository_objects');
  }

  /**
   * Create mock GitHub data for testing
   * @param {string} repoName - Repository name
   * @returns {Object} Mock GitHub data
   */
  _createMockGitHubData(repoName) {
    return {
      repository: {
        id: `repo-${repoName}`,
        kind: 'GitHubRepository',
        canonical_bytes: Buffer.from(repoName),
        canonical_hash: `hash-${repoName}`,
        id: `repo-${repoName}`,
        authority: 'GitHubConstitutionalPipeline',
        lineage: { source_id: null, derivation_path: [], provenance_chain: [] },
        schema_version: '1.0.0',
        constitution_version: '1.0.0',
        witness: null,
        certificate: null,
      },
      commits: [],
      trees: [],
      directories: [],
      blobs: [
        {
          id: `blob-${repoName}`,
          kind: 'GitHubBlob',
          canonical_bytes: Buffer.from(`// ${repoName} code`),
          canonical_hash: `blob-hash-${repoName}`,
          id: `blob-${repoName}`,
          authority: 'GitHubConstitutionalPipeline',
          lineage: { source_id: `repo-${repoName}`, derivation_path: [], provenance_chain: [] },
          schema_version: '1.0.0',
          constitution_version: '1.0.0',
          witness: null,
          certificate: null,
          payload: { sha: `sha-${repoName}`, path: 'index.js' },
        },
      ],
    };
  }

  /**
   * Print verification results
   * @param {Object} verification - Verification results
   */
  _printResults(verification) {
    console.log('=== Multi-Repository Verification Results ===\n');
    
    console.log(`Graph Root: ${verification.graphRootIdentical ? '✅' : '❌'}`);
    console.log(`Topology Hash: ${verification.topologyHashIdentical ? '✅' : '❌'}`);
    console.log(`Node Count: ${verification.nodeCountIdentical ? '✅' : '❌'}`);
    console.log(`Edge Count: ${verification.edgeCountIdentical ? '✅' : '❌'}`);
    console.log(`Node IDs: ${verification.nodeIdsIdentical ? '✅' : '❌'}`);
    console.log(`Edge IDs: ${verification.edgeIdsIdentical ? '✅' : '❌'}`);
    console.log();
    
    if (verification.passed) {
      console.log('✅ MULTI-REPOSITORY VERIFIED: A + B == B + A');
      console.log('Graph merges are canonical.');
    } else {
      console.log('❌ MULTI-REPOSITORY FAILED: Merge ordering affects results');
      console.log('Graph merges are not canonical.');
    }
  }
}

module.exports = { MultiRepositoryHarness };
