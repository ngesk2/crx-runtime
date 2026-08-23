/**
 * Cross Repository Reasoning
 * 
 * Ω.53 — Cross Repository Reasoning
 * 
 * Now Ollama isn't analyzing one repository.
 * 
 * It's analyzing:
 * 
 * 500 repositories
 * ↓
 * find duplicate schedulers
 * ↓
 * find better event stores
 * ↓
 * find better parsers
 * ↓
 * find stronger proof engines
 * ↓
 * find reusable graph compilers
 * ↓
 * generate missions
 * 
 * This is where exponential leverage starts.
 * 
 * Constitutional Constraint: Cross-repository reasoning is computed deterministically from constitutional graphs.
 */

const crypto = require('crypto');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class CrossRepositoryReasoning {
  constructor(postgresPool, objectRegistry, witnessChain, symbolGraph, fingerprinting, patternDatabase, integrationIntelligence, ollamaAnalyst) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._symbolGraph = symbolGraph;
    this._fingerprinting = fingerprinting;
    this._patternDatabase = patternDatabase;
    this._integrationIntelligence = integrationIntelligence;
    this._ollamaAnalyst = ollamaAnalyst;
    this._reasoningCache = new Map(); // reasoning_id → reasoning result
    this._initialized = false;
  }

  /**
   * Initialize cross repository reasoning
   */
  async initialize() {
    await this._loadReasoningCache();
    this._initialized = true;
    console.log('[CrossRepositoryReasoning] Initialized with', this._reasoningCache.size, 'reasoning results');
  }

  /**
   * Perform cross-repository analysis
   */
  async analyzeCrossRepository(query, repositoryLimit = 500) {
    console.log(`[CrossRepositoryReasoning] Analyzing ${repositoryLimit} repositories for query: ${query}`);

    const reasoningId = `reasoning-${CanonicalAuthority.hash({ query, repositoryLimit, timestamp: constitutionalTimeAuthority.now() })}`;

    const reasoning = {
      reasoning_id: reasoningId,
      query: query,
      repository_limit: repositoryLimit,
      repositories_analyzed: [],
      findings: [],
      duplicate_components: [],
      better_alternatives: [],
    reusable_components: [],
      generated_missions: [],
      generated_at: new Date(constitutionalTimeAuthority.now()).toISOString(),
    };

    // Get all repository fingerprints
    const allFingerprints = this._fingerprinting.getAllFingerprints();
    const repositoriesToAnalyze = allFingerprints.slice(0, repositoryLimit);

    reasoning.repositories_analyzed = repositoriesToAnalyze.map(fp => fp.repo_id);

    // Find duplicate schedulers
    const duplicateSchedulers = await this._findDuplicateSchedulers(repositoriesToAnalyze);
    reasoning.duplicate_components.push(...duplicateSchedulers);

    // Find better event stores
    const betterEventStores = await this._findBetterEventStores(repositoriesToAnalyze);
    reasoning.better_alternatives.push(...betterEventStores);

    // Find better parsers
    const betterParsers = await this._findBetterParsers(repositoriesToAnalyze);
    reasoning.better_alternatives.push(...betterParsers);

    // Find stronger proof engines
    const strongerProofEngines = await this._findStrongerProofEngines(repositoriesToAnalyze);
    reasoning.better_alternatives.push(...strongerProofEngines);

    // Find reusable graph compilers
    const reusableGraphCompilers = await this._findReusableGraphCompilers(repositoriesToAnalyze);
    reasoning.reusable_components.push(...reusableGraphCompilers);

    // Generate missions from findings
    reasoning.generated_missions = await this._generateMissionsFromFindings(reasoning);

    // Cache reasoning
    this._reasoningCache.set(reasoningId, reasoning);
    await this._persistReasoning(reasoning);

    console.log(`[CrossRepositoryReasoning] Analysis completed: ${reasoningId}`);
    return reasoning;
  }

  /**
   * Find duplicate schedulers
   */
  async _findDuplicateSchedulers(repositories) {
    const duplicates = [];
    const schedulerSymbols = new Map();

    for (const repo of repositories) {
      const symbols = this._symbolGraph.getSymbolsByRepository(repo.repo_id);
      const schedulers = symbols.filter(s => 
        s.payload.canonical_name.toLowerCase().includes('scheduler') ||
        s.payload.canonical_name.toLowerCase().includes('task') ||
        s.payload.canonical_name.toLowerCase().includes('job')
      );

      for (const scheduler of schedulers) {
        const signature = scheduler.payload.signature || scheduler.payload.canonical_name;
        if (!schedulerSymbols.has(signature)) {
          schedulerSymbols.set(signature, []);
        }
        schedulerSymbols.get(signature).push({
          repo_id: repo.repo_id,
          symbol_id: scheduler.id,
          symbol: scheduler,
        });
      }
    }

    // Find duplicates (same signature in multiple repos)
    for (const [signature, instances] of schedulerSymbols.entries()) {
      if (instances.length > 1) {
        duplicates.push({
          component_type: 'scheduler',
          signature: signature,
          instances: instances,
          count: instances.length,
          recommendation: `Consolidate ${instances.length} duplicate scheduler implementations`,
        });
      }
    }

    return duplicates.slice(0, 10);
  }

  /**
   * Find better event stores
   */
  async _findBetterEventStores(repositories) {
    const alternatives = [];
    const eventStoreImplementations = [];

    for (const repo of repositories) {
      const fingerprint = this._fingerprinting.getFingerprint(repo.repo_id);
      if (!fingerprint) continue;

      const hasEventSourcing = fingerprint.architectural_style.includes('Event Sourced');
      if (hasEventSourcing) {
        eventStoreImplementations.push({
          repo_id: repo.repo_id,
          libraries: fingerprint.libraries.filter(l => l.category === 'Database'),
          complexity: fingerprint.complexity_metrics,
        });
      }
    }

    // Rank by complexity and library quality
    eventStoreImplementations.sort((a, b) => {
      const scoreA = this._calculateEventStoreScore(a);
      const scoreB = this._calculateEventStoreScore(b);
      return scoreB - scoreA;
    });

    // Recommend top implementations
    if (eventStoreImplementations.length > 1) {
      const best = eventStoreImplementations[0];
      alternatives.push({
        component_type: 'event_store',
        better_alternative: best.repo_id,
        reason: 'Lower complexity and better library choices',
        current_implementations: eventStoreImplementations.length,
        recommendation: `Consider adopting event store from ${best.repo_id}`,
      });
    }

    return alternatives;
  }

  /**
   * Calculate event store score
   */
  _calculateEventStoreScore(implementation) {
    let score = 0;
    
    // Lower coupling is better
    score += Math.max(0, 100 - implementation.complexity.coupling) / 100 * 0.5;
    
    // More specialized libraries is better
    const specializedLibs = implementation.libraries.filter(l => 
      l.name.toLowerCase().includes('event') || 
      l.name.toLowerCase().includes('kafka') ||
      l.name.toLowerCase().includes('rabbitmq')
    );
    score += Math.min(specializedLibs.length * 0.2, 0.5);

    return score;
  }

  /**
   * Find better parsers
   */
  async _findBetterParsers(repositories) {
    const alternatives = [];
    const parserImplementations = [];

    for (const repo of repositories) {
      const symbols = this._symbolGraph.getSymbolsByRepository(repo.repo_id);
      const parsers = symbols.filter(s => 
        s.payload.canonical_name.toLowerCase().includes('parser') ||
        s.payload.canonical_name.toLowerCase().includes('lexer')
      );

      if (parsers.length > 0) {
        parserImplementations.push({
          repo_id: repo.repo_id,
          parser_count: parsers.length,
          complexity: this._calculateParserComplexity(parsers),
        });
      }
    }

    // Rank by complexity and count
    parserImplementations.sort((a, b) => {
      const scoreA = this._calculateParserScore(a);
      const scoreB = this._calculateParserScore(b);
      return scoreB - scoreA;
    });

    if (parserImplementations.length > 1) {
      const best = parserImplementations[0];
      alternatives.push({
        component_type: 'parser',
        better_alternative: best.repo_id,
        reason: 'More efficient parser implementation',
        current_implementations: parserImplementations.length,
        recommendation: `Consider adopting parser from ${best.repo_id}`,
      });
    }

    return alternatives;
  }

  /**
   * Calculate parser complexity
   */
  _calculateParserComplexity(parsers) {
    let complexity = 0;
    for (const parser of parsers) {
      complexity += parser.payload.relationships?.calls?.length || 0;
    }
    return complexity;
  }

  /**
   * Calculate parser score
   */
  _calculateParserScore(implementation) {
    // More parsers with lower complexity is better
    return (implementation.parser_count * 10) / (implementation.complexity + 1);
  }

  /**
   * Find stronger proof engines
   */
  async _findStrongerProofEngines(repositories) {
    const alternatives = [];
    const proofImplementations = [];

    for (const repo of repositories) {
      const fingerprint = this._fingerprinting.getFingerprint(repo.repo_id);
      if (!fingerprint) continue;

      const hasProof = fingerprint.patterns.includes('Proof') || 
                       fingerprint.patterns.includes('Verification');
      
      if (hasProof) {
        proofImplementations.push({
          repo_id: repo.repo_id,
          complexity: fingerprint.complexity_metrics,
          patterns: fingerprint.patterns,
        });
      }
    }

    // Rank by pattern completeness
    proofImplementations.sort((a, b) => {
      const scoreA = a.patterns.length;
      const scoreB = b.patterns.length;
      return scoreB - scoreA;
    });

    if (proofImplementations.length > 1) {
      const best = proofImplementations[0];
      alternatives.push({
        component_type: 'proof_engine',
        better_alternative: best.repo_id,
        reason: 'More comprehensive proof patterns',
        current_implementations: proofImplementations.length,
        recommendation: `Consider adopting proof engine from ${best.repo_id}`,
      });
    }

    return alternatives;
  }

  /**
   * Find reusable graph compilers
   */
  async _findReusableGraphCompilers(repositories) {
    const reusable = [];
    const graphCompilerImplementations = [];

    for (const repo of repositories) {
      const symbols = this._symbolGraph.getSymbolsByRepository(repo.repo_id);
      const graphCompilers = symbols.filter(s => 
        s.payload.canonical_name.toLowerCase().includes('graph') ||
        s.payload.canonical_name.toLowerCase().includes('compiler')
      );

      if (graphCompilers.length > 0) {
        graphCompilerImplementations.push({
          repo_id: repo.repo_id,
          compiler_count: graphCompilers.length,
          compilers: graphCompilers,
        });
      }
    }

    // Group by functionality
    const compilerGroups = new Map();
    for (const impl of graphCompilerImplementations) {
      for (const compiler of impl.compilers) {
        const type = this._classifyGraphCompiler(compiler);
        if (!compilerGroups.has(type)) {
          compilerGroups.set(type, []);
        }
        compilerGroups.get(type).push(impl);
      }
    }

    // Find reusable implementations
    for (const [type, implementations] of compilerGroups.entries()) {
      if (implementations.length > 2) {
        const best = implementations.sort((a, b) => b.compiler_count - a.compiler_count)[0];
        reusable.push({
          component_type: 'graph_compiler',
          compiler_type: type,
          reusable_implementation: best.repo_id,
          usage_count: implementations.length,
          recommendation: `Consider adopting ${type} compiler from ${best.repo_id}`,
        });
      }
    }

    return reusable.slice(0, 10);
  }

  /**
   * Classify graph compiler
   */
  _classifyGraphCompiler(compiler) {
    const name = compiler.payload.canonical_name.toLowerCase();
    
    if (name.includes('call')) return 'call_graph';
    if (name.includes('import')) return 'import_graph';
    if (name.includes('type')) return 'type_graph';
    if (name.includes('dependency')) return 'dependency_graph';
    if (name.includes('ast')) return 'ast_compiler';
    
    return 'general_graph';
  }

  /**
   * Generate missions from findings
   */
  async _generateMissionsFromFindings(reasoning) {
    const missions = [];

    // Mission: Consolidate duplicates
    for (const duplicate of reasoning.duplicate_components) {
      missions.push({
        type: 'consolidation',
        priority: 'medium',
        description: `Consolidate ${duplicate.count} duplicate ${duplicate.component_type} implementations`,
        reasoning: `Found ${duplicate.count} implementations with signature: ${duplicate.signature}`,
        affected_repositories: duplicate.instances.map(i => i.repo_id),
        estimated_complexity: 'Medium',
      });
    }

    // Mission: Adopt better alternatives
    for (const alternative of reasoning.better_alternatives) {
      missions.push({
        type: 'adoption',
        priority: 'high',
        description: `Adopt better ${alternative.component_type} from ${alternative.better_alternative}`,
        reasoning: alternative.reason,
        source_repository: alternative.better_alternative,
        estimated_complexity: 'Medium',
      });
    }

    // Mission: Reuse components
    for (const reusable of reasoning.reusable_components) {
      missions.push({
        type: 'reuse',
        priority: 'low',
        description: `Reuse ${reusable.compiler_type} compiler from ${reusable.reusable_implementation}`,
        reasoning: `Component used in ${reusable.usage_count} repositories`,
        source_repository: reusable.reusable_implementation,
        estimated_complexity: 'Low',
      });
    }

    return missions.slice(0, 20);
  }

  /**
   * Get reasoning by ID
   */
  getReasoning(reasoningId) {
    return this._reasoningCache.get(reasoningId);
  }

  /**
   * Get all reasoning results
   */
  getAllReasoning() {
    return Array.from(this._reasoningCache.values());
  }

  /**
   * Get reasoning statistics
   */
  getStatistics() {
    const reasonings = Array.from(this._reasoningCache.values());
    
    const stats = {
      total_analyses: reasonings.length,
      average_repositories_analyzed: 0,
      total_duplicates_found: 0,
      total_better_alternatives: 0,
      total_reusable_components: 0,
      total_missions_generated: 0,
      by_component_type: {},
    };

    let totalRepositories = 0;

    for (const reasoning of reasonings) {
      totalRepositories += reasoning.repositories_analyzed.length;
      stats.total_duplicates_found += reasoning.duplicate_components.length;
      stats.total_better_alternatives += reasoning.better_alternatives.length;
      stats.total_reusable_components += reasoning.reusable_components.length;
      stats.total_missions_generated += reasoning.generated_missions.length;

      // Count by component type
      for (const duplicate of reasoning.duplicate_components) {
        stats.by_component_type[duplicate.component_type] = 
          (stats.by_component_type[duplicate.component_type] || 0) + 1;
      }
    }

    if (reasonings.length > 0) {
      stats.average_repositories_analyzed = totalRepositories / reasonings.length;
    }

    return stats;
  }

  /**
   * Persist reasoning
   */
  async _persistReasoning(reasoning) {
    try {
      await this._postgres.query(`
        INSERT INTO cross_repository_reasoning (reasoning_id, reasoning_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (reasoning_id) DO UPDATE SET
          reasoning_data = $2,
          updated_at = NOW()
      `, [reasoning.reasoning_id, JSON.stringify(reasoning)]);
    } catch (error) {
      console.error('[CrossRepositoryReasoning] Failed to persist reasoning:', error.message);
    }
  }

  /**
   * Load reasoning cache
   */
  async _loadReasoningCache() {
    try {
      const result = await this._postgres.query(`
        SELECT reasoning_id, reasoning_data
        FROM cross_repository_reasoning
        ORDER BY updated_at DESC
        LIMIT 1000
      `);

      for (const row of result.rows) {
        this._reasoningCache.set(row.reasoning_id, row.reasoning_data);
      }
    } catch (error) {
      console.error('[CrossRepositoryReasoning] Failed to load reasoning cache:', error.message);
    }
  }

  /**
   * Clear reasoning cache (memory only)
   */
  clearReasoningCache() {
    this._reasoningCache.clear();
  }
}

module.exports = { CrossRepositoryReasoning };
