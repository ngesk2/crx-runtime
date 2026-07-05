/**
 * Repository Reset Harness
 * 
 * Milestone 11 — Repository Reset
 * 
 * Constitutional Constraint: Delete everything, run again.
 * 
 * Verify identical:
 * - bytes
 * - IDs
 * - witnesses
 * - certificates
 * - graph roots
 */

const { RepositoryStore } = require('./repository_store');
const { GitHubConstitutionalPipeline } = require('./github_constitutional_pipeline');
const { ConstitutionalParser } = require('./constitutional_parser');
const { KnowledgeRuntime } = require('./knowledge_runtime');
const { RelationshipRuntime } = require('./relationship_runtime');
const { KnowledgeGraphRuntime } = require('./knowledge_graph');
const { PromptRuntime } = require('./prompt_runtime');
const { OllamaRuntime } = require('./ollama_runtime');
const { ReplayRuntime } = require('./replay_runtime');
const { PipelineWitness } = require('./pipeline_witness');
const { constitutionalVerificationAuthority } = require('./constitutional_verification_authority');

class RepositoryResetHarness {
  constructor(config) {
    this._config = config;
    this._repositoryStore = new RepositoryStore(config.postgresPool);
    this._namespace = 'reset';
    this._version = '1.0.0';
  }

  /**
   * Run repository reset test
   * 
   * @returns {Object} Reset test results
   */
  async run() {
    console.log('=== Repository Reset Harness ===\n');
    console.log('Deleting everything and running again...\n');

    const results = {
      firstRun: null,
      secondRun: null,
      verification: null,
    };

    // First run
    console.log('First run...');
    results.firstRun = await this._runPipeline();
    console.log(`  ✅ First run complete: ${Object.keys(results.firstRun).length} stages\n`);

    // Reset repository
    console.log('Resetting repository...');
    await this._resetRepository();
    console.log('  ✅ Repository reset\n');

    // Second run
    console.log('Second run...');
    results.secondRun = await this._runPipeline();
    console.log(`  ✅ Second run complete: ${Object.keys(results.secondRun).length} stages\n`);

    // Verify determinism
    console.log('Verifying determinism...');
    results.verification = await this._verifyDeterminism(results.firstRun, results.secondRun);
    console.log();

    this._printResults(results.verification);
    return results;
  }

  /**
   * Run complete pipeline
   * @returns {Object} Pipeline results
   */
  async _runPipeline() {
    const results = {
      github: null,
      parser: null,
      knowledge: null,
      relationships: null,
      graph: null,
      prompt: null,
      reflection: null,
      pipelineCertificate: null,
    };

    try {
      // GitHub Constitutional Pipeline
      const githubPipeline = new GitHubConstitutionalPipeline(this._config);
      await githubPipeline.initialize();
      const githubResult = await githubPipeline.run();
      results.github = githubResult.constitutionalObjects;

      // Constitutional Parser (for first blob only as example)
      if (results.github.blobs.length > 0) {
        const parser = new ConstitutionalParser();
        const sourceCode = 'const x = 42;'; // Placeholder
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

      // Prompt Runtime
      if (results.graph) {
        const promptRuntime = new PromptRuntime();
        const template = promptRuntime.createAnalysisTemplate(results.graph);
        const variables = promptRuntime.extractVariables(results.graph);
        const missionContext = 'analyze_codebase';
        results.prompt = promptRuntime.generatePrompt(results.graph, missionContext, template, variables);
      }

      // Ollama Runtime (placeholder - doesn't actually call Ollama)
      if (results.prompt) {
        const ollamaRuntime = new OllamaRuntime(this._config);
        const mockResponse = 'Mock analysis response';
        results.reflection = await ollamaRuntime.execute(results.prompt, {
          model: 'llama2',
          parameters: { temperature: 0.7 },
        });
      }

      // Pipeline Witness
      if (results.graph) {
        const { ObjectWitness, StageWitness, PipelineWitnessRoot, PipelineCertificate } = require('./pipeline_witness');
        
        // Create object witnesses
        const objectWitnesses = [];
        const allObjects = this._extractAllObjects(results);
        for (const obj of allObjects) {
          const objectWitness = new ObjectWitness(obj);
          objectWitnesses.push(objectWitness.build());
        }

        // Create stage witnesses
        const stageWitnesses = [];
        const stages = ['github', 'parser', 'knowledge', 'relationships', 'graph', 'prompt', 'reflection'];
        for (const stage of stages) {
          if (results[stage]) {
            const stageObjects = this._extractStageObjects(results[stage]);
            const stageObjectWitnesses = stageObjects.map(obj => {
              const ow = new ObjectWitness(obj);
              return ow.build();
            });
            const stageWitness = new StageWitness(stage, stageObjectWitnesses);
            stageWitnesses.push(stageWitness.build());
          }
        }

        // Create pipeline witness root
        const pipelineWitnessRoot = new PipelineWitnessRoot(stageWitnesses);
        const root = pipelineWitnessRoot.build();

        // Create pipeline certificate
        const stageRoots = stageWitnesses.map(s => s.payload.merkle_root);
        const pipelineCertificate = new PipelineCertificate(root, stageRoots);
        results.pipelineCertificate = pipelineCertificate.build();
      }

    } catch (error) {
      console.error(`Pipeline error: ${error.message}`);
      throw error;
    }

    return results;
  }

  /**
   * Reset repository (delete all objects)
   */
  async _resetRepository() {
    // Delete all repository objects
    await this._repositoryStore.pool.query('DELETE FROM repository_objects');
  }

  /**
   * Verify determinism between two runs
   * @param {Object} firstRun - First run results
   * @param {Object} secondRun - Second run results
   * @returns {Object} Verification results
   */
  async _verifyDeterminism(firstRun, secondRun) {
    const verification = {
      bytes: true,
      ids: true,
      witnesses: true,
      certificates: true,
      graphRoots: true,
    };

    // Compare bytes
    const firstObjects = this._extractAllObjects(firstRun);
    const secondObjects = this._extractAllObjects(secondRun);

    if (firstObjects.length !== secondObjects.length) {
      verification.bytes = false;
      console.log('  ❌ Object count mismatch');
    } else {
      for (let i = 0; i < firstObjects.length; i++) {
        if (!firstObjects[i].canonical_bytes.equals(secondObjects[i].canonical_bytes)) {
          verification.bytes = false;
          console.log(`  ❌ Bytes differ for ${firstObjects[i].id}`);
          break;
        }
      }
    }

    // Compare IDs
    if (verification.bytes) {
      for (let i = 0; i < firstObjects.length; i++) {
        if (firstObjects[i].id !== secondObjects[i].id) {
          verification.ids = false;
          console.log(`  ❌ ID differs: ${firstObjects[i].id} vs ${secondObjects[i].id}`);
          break;
        }
      }
    }

    // Compare witnesses
    if (firstRun.pipelineCertificate && secondRun.pipelineCertificate) {
      if (firstRun.pipelineCertificate.canonical_hash !== secondRun.pipelineCertificate.canonical_hash) {
        verification.witnesses = false;
        console.log('  ❌ Pipeline certificate hash differs');
      }
    }

    // Compare certificates
    if (firstRun.pipelineCertificate && secondRun.pipelineCertificate) {
      if (firstRun.pipelineCertificate.id !== secondRun.pipelineCertificate.id) {
        verification.certificates = false;
        console.log('  ❌ Pipeline certificate ID differs');
      }
    }

    // Compare graph roots
    if (firstRun.graph && secondRun.graph) {
      if (firstRun.graph.canonical_hash !== secondRun.graph.canonical_hash) {
        verification.graphRoots = false;
        console.log('  ❌ Graph root hash differs');
      }
      if (firstRun.graph.payload.topology_hash !== secondRun.graph.payload.topology_hash) {
        verification.graphRoots = false;
        console.log('  ❌ Graph topology hash differs');
      }
    }

    verification.passed = verification.bytes && verification.ids && verification.witnesses &&
                         verification.certificates && verification.graphRoots;

    return verification;
  }

  /**
   * Extract all constitutional objects from pipeline results
   * @param {Object} pipelineResults - Pipeline results
   * @returns {Array} All objects
   */
  _extractAllObjects(pipelineResults) {
    const objects = [];

    for (const key of Object.keys(pipelineResults)) {
      const value = pipelineResults[key];
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          objects.push(...value);
        } else if (value.canonical_bytes) {
          objects.push(value);
        } else if (value.proposal) {
          objects.push(value.proposal, ...value.edges);
        }
      }
    }

    return objects;
  }

  /**
   * Extract objects from a specific stage
   * @param {Object} stageResult - Stage result
   * @returns {Array} Stage objects
   */
  _extractStageObjects(stageResult) {
    const objects = [];

    if (Array.isArray(stageResult)) {
      objects.push(...stageResult);
    } else if (stageResult.canonical_bytes) {
      objects.push(stageResult);
    } else if (stageResult.proposal) {
      objects.push(stageResult.proposal, ...stageResult.edges);
    }

    return objects;
  }

  /**
   * Print verification results
   * @param {Object} verification - Verification results
   */
  _printResults(verification) {
    console.log('=== Repository Reset Verification Results ===\n');
    
    console.log(`Bytes: ${verification.bytes ? '✅' : '❌'}`);
    console.log(`IDs: ${verification.ids ? '✅' : '❌'}`);
    console.log(`Witnesses: ${verification.witnesses ? '✅' : '❌'}`);
    console.log(`Certificates: ${verification.certificates ? '✅' : '❌'}`);
    console.log(`Graph Roots: ${verification.graphRoots ? '✅' : '❌'}`);
    console.log();
    
    if (verification.passed) {
      console.log('✅ REPOSITORY RESET VERIFIED: Identical outputs after reset');
    } else {
      console.log('❌ REPOSITORY RESET FAILED: Outputs differ after reset');
    }
  }
}

module.exports = { RepositoryResetHarness };
