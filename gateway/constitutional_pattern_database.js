/**
 * Constitutional Pattern Database
 * 
 * Ω.51 — Constitutional Pattern Database
 * 
 * Mine every admitted repository for reusable patterns.
 * 
 * Store:
 * 
 * PatternObject
 * - Problem
 * - Solution
 * - Tradeoffs
 * - Complexity
 * - Language
 * - Dependencies
 * - Proof
 * - Usage Count
 * - Confidence
 * 
 * Eventually you'll have tens of thousands of proven architectural patterns.
 * 
 * Constitutional Constraint: Patterns are mined deterministically from constitutional graphs.
 */

const crypto = require('crypto');
const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class ConstitutionalPatternDatabase {
  constructor(postgresPool, objectRegistry, witnessChain, symbolGraph, typeGraph, callGraph, importGraph, fingerprinting) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._symbolGraph = symbolGraph;
    this._typeGraph = typeGraph;
    this._callGraph = callGraph;
    this._importGraph = importGraph;
    this._fingerprinting = fingerprinting;
    this._patternCache = new Map(); // pattern_id → pattern object
    this._patternIndex = new Map(); // pattern_name → pattern_id
    this._repositoryPatternIndex = new Map(); // repo_id → pattern_ids
    this._initialized = false;
  }

  /**
   * Initialize constitutional pattern database
   */
  async initialize() {
    await this._loadPatternCache();
    await this._loadPatternIndex();
    await this._loadRepositoryPatternIndex();
    this._initialized = true;
    console.log('[ConstitutionalPatternDatabase] Initialized with', this._patternCache.size, 'patterns');
  }

  /**
   * Mine patterns from repository
   */
  async minePatternsFromRepository(repoId) {
    console.log(`[ConstitutionalPatternDatabase] Mining patterns from: ${repoId}`);

    const patterns = [];

    // Get repository data
    const symbols = this._symbolGraph.getSymbolsByRepository(repoId);
    const fingerprint = this._fingerprinting.getFingerprint(repoId);
    const typeGraph = this._typeGraph.getTypeGraph(repoId);
    const callGraph = this._callGraph.getCallGraph(repoId);

    // Mine architectural patterns
    patterns.push(...await this._mineArchitecturalPatterns(repoId, symbols, fingerprint, typeGraph));

    // Mine design patterns
    patterns.push(...await this._mineDesignPatterns(repoId, symbols, typeGraph, callGraph));

    // Mine implementation patterns
    patterns.push(...await this._mineImplementationPatterns(repoId, symbols, callGraph));

    // Mine integration patterns
    patterns.push(...await this._mineIntegrationPatterns(repoId, symbols, this._importGraph.getImportGraph(repoId)));

    // Store patterns
    for (const pattern of patterns) {
      await this._storePattern(pattern);
      this._indexPatternByRepository(repoId, pattern.id);
    }

    console.log(`[ConstitutionalPatternDatabase] Mined ${patterns.length} patterns from: ${repoId}`);
    return patterns;
  }

  /**
   * Mine architectural patterns
   */
  async _mineArchitecturalPatterns(repoId, symbols, fingerprint, typeGraph) {
    const patterns = [];

    // Repository Pattern
    const repositoryPattern = await this._mineRepositoryPattern(repoId, symbols, typeGraph);
    if (repositoryPattern) {
      patterns.push(repositoryPattern);
    }

    // Service Layer Pattern
    const serviceLayerPattern = await this._mineServiceLayerPattern(repoId, symbols, typeGraph);
    if (serviceLayerPattern) {
      patterns.push(serviceLayerPattern);
    }

    // Factory Pattern
    const factoryPattern = await this._mineFactoryPattern(repoId, symbols, typeGraph);
    if (factoryPattern) {
      patterns.push(factoryPattern);
    }

    // Builder Pattern
    const builderPattern = await this._mineBuilderPattern(repoId, symbols, typeGraph);
    if (builderPattern) {
      patterns.push(builderPattern);
    }

    return patterns;
  }

  /**
   * Mine Repository pattern
   */
  async _mineRepositoryPattern(repoId, symbols, typeGraph) {
    const repositorySymbols = symbols.filter(s => 
      s.payload.canonical_name.toLowerCase().includes('repository') ||
      s.payload.canonical_name.toLowerCase().includes('repo')
    );

    if (repositorySymbols.length === 0) {
      return null;
    }

    return await this._createPatternObject({
      name: 'Repository',
      category: 'Architectural',
      problem: 'How to abstract data access logic from business logic',
      solution: 'Create repository interfaces that encapsulate data access operations',
      tradeoffs: ['Adds abstraction layer', 'May introduce complexity for simple queries', 'Enables testing with mocks'],
      complexity: 'Medium',
      language: repositorySymbols[0].payload.language,
      dependencies: ['Database', 'ORM'],
      proof: {
        repo_id: repoId,
        symbol_ids: repositorySymbols.map(s => s.id),
        evidence_count: repositorySymbols.length,
      },
      usage_count: 1,
      confidence: this._calculateConfidence(repositorySymbols.length, 1),
    });
  }

  /**
   * Mine Service Layer pattern
   */
  async _mineServiceLayerPattern(repoId, symbols, typeGraph) {
    const serviceSymbols = symbols.filter(s => 
      s.payload.canonical_name.toLowerCase().includes('service')
    );

    if (serviceSymbols.length === 0) {
      return null;
    }

    return await this._createPatternObject({
      name: 'Service Layer',
      category: 'Architectural',
      problem: 'How to organize business logic and separate it from presentation and data layers',
      solution: 'Create service classes that contain business logic and coordinate between repositories',
      tradeoffs: ['Clear separation of concerns', 'May lead to anemic domain model', 'Enables code reuse'],
      complexity: 'Medium',
      language: serviceSymbols[0].payload.language,
      dependencies: ['Repository', 'Domain Model'],
      proof: {
        repo_id: repoId,
        symbol_ids: serviceSymbols.map(s => s.id),
        evidence_count: serviceSymbols.length,
      },
      usage_count: 1,
      confidence: this._calculateConfidence(serviceSymbols.length, 1),
    });
  }

  /**
   * Mine Factory pattern
   */
  async _mineFactoryPattern(repoId, symbols, typeGraph) {
    const factorySymbols = symbols.filter(s => 
      s.payload.canonical_name.toLowerCase().includes('factory') ||
      s.payload.canonical_name.toLowerCase().includes('create')
    );

    if (factorySymbols.length === 0) {
      return null;
    }

    return await this._createPatternObject({
      name: 'Factory',
      category: 'Creational',
      problem: 'How to create objects without specifying the exact class of object that will be created',
      solution: 'Define an interface for creating an object, but let subclasses decide which class to instantiate',
      tradeoffs: ['Encapsulates object creation', 'May increase complexity', 'Enables open/closed principle'],
      complexity: 'Low',
      language: factorySymbols[0].payload.language,
      dependencies: ['Interface', 'Concrete Classes'],
      proof: {
        repo_id: repoId,
        symbol_ids: factorySymbols.map(s => s.id),
        evidence_count: factorySymbols.length,
      },
      usage_count: 1,
      confidence: this._calculateConfidence(factorySymbols.length, 1),
    });
  }

  /**
   * Mine Builder pattern
   */
  async _mineBuilderPattern(repoId, symbols, typeGraph) {
    const builderSymbols = symbols.filter(s => 
      s.payload.canonical_name.toLowerCase().includes('builder')
    );

    if (builderSymbols.length === 0) {
      return null;
    }

    return await this._createPatternObject({
      name: 'Builder',
      category: 'Creational',
      problem: 'How to construct complex objects step by step',
      solution: 'Separate the construction of a complex object from its representation',
      tradeoffs: ['Clear construction process', 'May create many builder classes', 'Enables immutable objects'],
      complexity: 'Medium',
      language: builderSymbols[0].payload.language,
      dependencies: ['Product', 'Director'],
      proof: {
        repo_id: repoId,
        symbol_ids: builderSymbols.map(s => s.id),
        evidence_count: builderSymbols.length,
      },
      usage_count: 1,
      confidence: this._calculateConfidence(builderSymbols.length, 1),
    });
  }

  /**
   * Mine design patterns
   */
  async _mineDesignPatterns(repoId, symbols, typeGraph, callGraph) {
    const patterns = [];

    // Strategy Pattern
    const strategyPattern = await this._mineStrategyPattern(repoId, symbols, typeGraph);
    if (strategyPattern) {
      patterns.push(strategyPattern);
    }

    // Observer Pattern
    const observerPattern = await this._mineObserverPattern(repoId, symbols, typeGraph);
    if (observerPattern) {
      patterns.push(observerPattern);
    }

    // Decorator Pattern
    const decoratorPattern = await this._mineDecoratorPattern(repoId, symbols, typeGraph);
    if (decoratorPattern) {
      patterns.push(decoratorPattern);
    }

    // Singleton Pattern
    const singletonPattern = await this._mineSingletonPattern(repoId, symbols, typeGraph);
    if (singletonPattern) {
      patterns.push(singletonPattern);
    }

    return patterns;
  }

  /**
   * Mine Strategy pattern
   */
  async _mineStrategyPattern(repoId, symbols, typeGraph) {
    const strategySymbols = symbols.filter(s => 
      s.payload.canonical_name.toLowerCase().includes('strategy')
    );

    if (strategySymbols.length === 0) {
      return null;
    }

    return await this._createPatternObject({
      name: 'Strategy',
      category: 'Behavioral',
      problem: 'How to define a family of algorithms, encapsulate each one, and make them interchangeable',
      solution: 'Define a strategy interface and implement concrete strategies for each algorithm',
      tradeoffs: ['Open/closed principle', 'May increase number of classes', 'Runtime algorithm selection'],
      complexity: 'Low',
      language: strategySymbols[0].payload.language,
      dependencies: ['Strategy Interface', 'Concrete Strategies'],
      proof: {
        repo_id: repoId,
        symbol_ids: strategySymbols.map(s => s.id),
        evidence_count: strategySymbols.length,
      },
      usage_count: 1,
      confidence: this._calculateConfidence(strategySymbols.length, 1),
    });
  }

  /**
   * Mine Observer pattern
   */
  async _mineObserverPattern(repoId, symbols, typeGraph) {
    const observerSymbols = symbols.filter(s => 
      s.payload.canonical_name.toLowerCase().includes('observer') ||
      s.payload.canonical_name.toLowerCase().includes('subscribe') ||
      s.payload.canonical_name.toLowerCase().includes('event')
    );

    if (observerSymbols.length === 0) {
      return null;
    }

    return await this._createPatternObject({
      name: 'Observer',
      category: 'Behavioral',
      problem: 'How to define a subscription mechanism to notify multiple objects about any events',
      solution: 'Define a subject interface and observer interface, with subjects notifying observers of changes',
      tradeoffs: ['Loose coupling', 'May cause performance issues', 'Enables event-driven architecture'],
      complexity: 'Medium',
      language: observerSymbols[0].payload.language,
      dependencies: ['Subject', 'Observer'],
      proof: {
        repo_id: repoId,
        symbol_ids: observerSymbols.map(s => s.id),
        evidence_count: observerSymbols.length,
      },
      usage_count: 1,
      confidence: this._calculateConfidence(observerSymbols.length, 1),
    });
  }

  /**
   * Mine Decorator pattern
   */
  async _mineDecoratorPattern(repoId, symbols, typeGraph) {
    const decoratorSymbols = symbols.filter(s => 
      s.payload.canonical_name.toLowerCase().includes('decorator') ||
      s.payload.canonical_name.toLowerCase().includes('wrapper')
    );

    if (decoratorSymbols.length === 0) {
      return null;
    }

    return await this._createPatternObject({
      name: 'Decorator',
      category: 'Structural',
      problem: 'How to add responsibilities to individual objects dynamically without affecting other objects',
      solution: 'Create decorator classes that wrap the original object and add new behavior',
      tradeoffs: ['Flexible extension', 'May create many decorator classes', 'Single responsibility principle'],
      complexity: 'Medium',
      language: decoratorSymbols[0].payload.language,
      dependencies: ['Component', 'Concrete Decorator'],
      proof: {
        repo_id: repoId,
        symbol_ids: decoratorSymbols.map(s => s.id),
        evidence_count: decoratorSymbols.length,
      },
      usage_count: 1,
      confidence: this._calculateConfidence(decoratorSymbols.length, 1),
    });
  }

  /**
   * Mine Singleton pattern
   */
  async _mineSingletonPattern(repoId, symbols, typeGraph) {
    const singletonSymbols = symbols.filter(s => 
      s.payload.canonical_name.toLowerCase().includes('singleton') ||
      s.payload.canonical_name.toLowerCase().includes('instance')
    );

    if (singletonSymbols.length === 0) {
      return null;
    }

    return await this._createPatternObject({
      name: 'Singleton',
      category: 'Creational',
      problem: 'How to ensure a class has only one instance and provide a global point of access to it',
      solution: 'Make the class responsible for its own creation and provide a static access method',
      tradeoffs: ['Controlled access', 'Global state', 'Testing difficulties'],
      complexity: 'Low',
      language: singletonSymbols[0].payload.language,
      dependencies: [],
      proof: {
        repo_id: repoId,
        symbol_ids: singletonSymbols.map(s => s.id),
        evidence_count: singletonSymbols.length,
      },
      usage_count: 1,
      confidence: this._calculateConfidence(singletonSymbols.length, 1),
    });
  }

  /**
   * Mine implementation patterns
   */
  async _mineImplementationPatterns(repoId, symbols, callGraph) {
    const patterns = [];

    // Async/Await Pattern
    const asyncPattern = await this._mineAsyncPattern(repoId, symbols);
    if (asyncPattern) {
      patterns.push(asyncPattern);
    }

    // Error Handling Pattern
    const errorHandlingPattern = await this._mineErrorHandlingPattern(repoId, symbols);
    if (errorHandlingPattern) {
      patterns.push(errorHandlingPattern);
    }

    return patterns;
  }

  /**
   * Mine Async pattern
   */
  async _mineAsyncPattern(repoId, symbols) {
    const asyncSymbols = symbols.filter(s => 
      s.payload.signature && s.payload.signature.includes('async') ||
      s.payload.signature && s.payload.signature.includes('Promise') ||
      s.payload.signature && s.payload.signature.includes('Future')
    );

    if (asyncSymbols.length === 0) {
      return null;
    }

    return await this._createPatternObject({
      name: 'Async/Await',
      category: 'Implementation',
      problem: 'How to handle asynchronous operations without blocking',
      solution: 'Use async/await syntax to write asynchronous code in a synchronous style',
      tradeoffs: ['Non-blocking', 'May be complex to debug', 'Improved performance'],
      complexity: 'Medium',
      language: asyncSymbols[0].payload.language,
      dependencies: ['Promise', 'Future'],
      proof: {
        repo_id: repoId,
        symbol_ids: asyncSymbols.map(s => s.id),
        evidence_count: asyncSymbols.length,
      },
      usage_count: 1,
      confidence: this._calculateConfidence(asyncSymbols.length, 1),
    });
  }

  /**
   * Mine Error Handling pattern
   */
  async _mineErrorHandlingPattern(repoId, symbols) {
    const errorSymbols = symbols.filter(s => 
      s.payload.canonical_name.toLowerCase().includes('error') ||
      s.payload.canonical_name.toLowerCase().includes('exception') ||
      s.payload.canonical_name.toLowerCase().includes('catch')
    );

    if (errorSymbols.length === 0) {
      return null;
    }

    return await this._createPatternObject({
      name: 'Error Handling',
      category: 'Implementation',
      problem: 'How to handle errors gracefully and prevent application crashes',
      solution: 'Use try/catch blocks and error propagation to handle exceptions',
      tradeoffs: ['Robust error handling', 'May add boilerplate', 'Improved reliability'],
      complexity: 'Low',
      language: errorSymbols[0].payload.language,
      dependencies: ['Exception', 'Error Types'],
      proof: {
        repo_id: repoId,
        symbol_ids: errorSymbols.map(s => s.id),
        evidence_count: errorSymbols.length,
      },
      usage_count: 1,
      confidence: this._calculateConfidence(errorSymbols.length, 1),
    });
  }

  /**
   * Mine integration patterns
   */
  async _mineIntegrationPatterns(repoId, symbols, importGraph) {
    const patterns = [];

    // REST API Pattern
    const restPattern = await this._mineRestPattern(repoId, symbols, importGraph);
    if (restPattern) {
      patterns.push(restPattern);
    }

    // GraphQL Pattern
    const graphqlPattern = await this._mineGraphQLPattern(repoId, symbols, importGraph);
    if (graphqlPattern) {
      patterns.push(graphqlPattern);
    }

    return patterns;
  }

  /**
   * Mine REST pattern
   */
  async _mineRestPattern(repoId, symbols, importGraph) {
    const restSymbols = symbols.filter(s => 
      s.payload.canonical_name.toLowerCase().includes('controller') ||
      s.payload.canonical_name.toLowerCase().includes('route') ||
      s.payload.canonical_name.toLowerCase().includes('endpoint')
    );

    if (restSymbols.length === 0) {
      return null;
    }

    return await this._createPatternObject({
      name: 'REST API',
      category: 'Integration',
      problem: 'How to expose functionality over HTTP using RESTful principles',
      solution: 'Design resources with proper HTTP methods and status codes',
      tradeoffs: ['Standard interface', 'May be overfetching', 'Stateless communication'],
      complexity: 'Medium',
      language: restSymbols[0].payload.language,
      dependencies: ['HTTP', 'JSON'],
      proof: {
        repo_id: repoId,
        symbol_ids: restSymbols.map(s => s.id),
        evidence_count: restSymbols.length,
      },
      usage_count: 1,
      confidence: this._calculateConfidence(restSymbols.length, 1),
    });
  }

  /**
   * Mine GraphQL pattern
   */
  async _mineGraphQLPattern(repoId, symbols, importGraph) {
    const graphqlSymbols = symbols.filter(s => 
      s.payload.canonical_name.toLowerCase().includes('graphql') ||
      s.payload.canonical_name.toLowerCase().includes('resolver') ||
      s.payload.canonical_name.toLowerCase().includes('schema')
    );

    if (graphqlSymbols.length === 0) {
      return null;
    }

    return await this._createPatternObject({
      name: 'GraphQL',
      category: 'Integration',
      problem: 'How to provide flexible data querying and manipulation',
      solution: 'Use GraphQL schema and resolvers to define and execute queries',
      tradeoffs: ['Flexible queries', 'Complexity in schema design', 'Single endpoint'],
      complexity: 'High',
      language: graphqlSymbols[0].payload.language,
      dependencies: ['GraphQL', 'Schema'],
      proof: {
        repo_id: repoId,
        symbol_ids: graphqlSymbols.map(s => s.id),
        evidence_count: graphqlSymbols.length,
      },
      usage_count: 1,
      confidence: this._calculateConfidence(graphqlSymbols.length, 1),
    });
  }

  /**
   * Create pattern object
   */
  async _createPatternObject(patternData) {
    const patternId = `pattern-${CanonicalAuthority.hash({
      name: patternData.name,
      category: patternData.category,
      language: patternData.language,
    })}`;

    const patternObject = {
      id: patternId,
      kind: 'Pattern',
      canonical_hash: CanonicalAuthority.hash({
        name: patternData.name,
        category: patternData.category,
        problem: patternData.problem,
        solution: patternData.solution,
        language: patternData.language,
      }),
      payload: {
        name: patternData.name,
        category: patternData.category,
        problem: patternData.problem,
        solution: patternData.solution,
        tradeoffs: patternData.tradeoffs,
        complexity: patternData.complexity,
        language: patternData.language,
        dependencies: patternData.dependencies,
        proof: patternData.proof,
        usage_count: patternData.usage_count,
        confidence: patternData.confidence,
      },
      authority: 'ConstitutionalPatternDatabase',
      identity: {
        created_at: new Date(constitutionalTimeAuthority.now()).toISOString(),
        version: '1.0.0',
      },
      lineage: {
        source_id: patternData.proof.repo_id,
        source_kind: 'Repository',
      },
      relationships: patternData.proof.symbol_ids.map(id => ({
        target_id: id,
        relation: 'evidence',
      })),
      metadata: {
        schema_version: '1.0.0',
        language: patternData.language,
        category: patternData.category,
      },
    };

    return patternObject;
  }

  /**
   * Calculate confidence based on evidence
   */
  _calculateConfidence(evidenceCount, repositoryCount) {
    // Simple confidence calculation based on evidence
    const baseConfidence = 0.5;
    const evidenceBonus = Math.min(evidenceCount * 0.1, 0.3);
    const repositoryBonus = Math.min(repositoryCount * 0.05, 0.2);
    
    return Math.min(baseConfidence + evidenceBonus + repositoryBonus, 1.0);
  }

  /**
   * Store pattern
   */
  async _storePattern(patternObject) {
    // Check if pattern already exists
    const existingPattern = this._patternCache.get(patternObject.id);
    
    if (existingPattern) {
      // Update existing pattern
      existingPattern.payload.usage_count += 1;
      existingPattern.payload.confidence = this._calculateConfidence(
        existingPattern.payload.proof.evidence_count,
        existingPattern.payload.usage_count
      );
      existingPattern.payload.proof.repo_id = patternObject.payload.proof.repo_id;
      existingPattern.relationships.push(...patternObject.relationships);
    } else {
      // Register new pattern
      await this._objectRegistry.register(patternObject);
      this._patternCache.set(patternObject.id, patternObject);
      this._patternIndex.set(patternObject.payload.name, patternObject.id);
    }

    // Persist pattern
    await this._persistPattern(existingPattern || patternObject);
  }

  /**
   * Index pattern by repository
   */
  _indexPatternByRepository(repoId, patternId) {
    if (!this._repositoryPatternIndex.has(repoId)) {
      this._repositoryPatternIndex.set(repoId, new Set());
    }
    this._repositoryPatternIndex.get(repoId).add(patternId);
  }

  /**
   * Get pattern by ID
   */
  getPattern(patternId) {
    return this._patternCache.get(patternId);
  }

  /**
   * Get pattern by name
   */
  getPatternByName(patternName) {
    const patternId = this._patternIndex.get(patternName);
    if (patternId) {
      return this._patternCache.get(patternId);
    }
    return null;
  }

  /**
   * Get patterns by category
   */
  getPatternsByCategory(category) {
    return Array.from(this._patternCache.values()).filter(p => p.payload.category === category);
  }

  /**
   * Get patterns by language
   */
  getPatternsByLanguage(language) {
    return Array.from(this._patternCache.values()).filter(p => p.payload.language === language);
  }

  /**
   * Get patterns by repository
   */
  getPatternsByRepository(repoId) {
    const patternIds = this._repositoryPatternIndex.get(repoId);
    if (!patternIds) {
      return [];
    }
    
    return Array.from(patternIds).map(id => this._patternCache.get(id)).filter(p => p);
  }

  /**
   * Search patterns by problem
   */
  searchPatternsByProblem(query) {
    const regex = new RegExp(query, 'i');
    return Array.from(this._patternCache.values()).filter(p => regex.test(p.payload.problem));
  }

  /**
   * Get top patterns by usage
   */
  getTopPatternsByUsage(limit = 10) {
    return Array.from(this._patternCache.values())
      .sort((a, b) => b.payload.usage_count - a.payload.usage_count)
      .slice(0, limit);
  }

  /**
   * Get top patterns by confidence
   */
  getTopPatternsByConfidence(limit = 10) {
    return Array.from(this._patternCache.values())
      .sort((a, b) => b.payload.confidence - a.payload.confidence)
      .slice(0, limit);
  }

  /**
   * Get pattern statistics
   */
  getStatistics() {
    const patterns = Array.from(this._patternCache.values());
    
    const stats = {
      total_patterns: patterns.length,
      by_category: {},
      by_language: {},
      by_complexity: {},
      average_usage_count: 0,
      average_confidence: 0,
      total_usage_count: 0,
    };

    let totalUsage = 0;
    let totalConfidence = 0;

    for (const pattern of patterns) {
      // Count by category
      const category = pattern.payload.category || 'unknown';
      stats.by_category[category] = (stats.by_category[category] || 0) + 1;

      // Count by language
      const language = pattern.payload.language || 'unknown';
      stats.by_language[language] = (stats.by_language[language] || 0) + 1;

      // Count by complexity
      const complexity = pattern.payload.complexity || 'unknown';
      stats.by_complexity[complexity] = (stats.by_complexity[complexity] || 0) + 1;

      // Sum usage and confidence
      totalUsage += pattern.payload.usage_count || 0;
      totalConfidence += pattern.payload.confidence || 0;
    }

    stats.total_usage_count = totalUsage;

    if (patterns.length > 0) {
      stats.average_usage_count = totalUsage / patterns.length;
      stats.average_confidence = totalConfidence / patterns.length;
    }

    return stats;
  }

  /**
   * Persist pattern
   */
  async _persistPattern(patternObject) {
    try {
      await this._postgres.query(`
        INSERT INTO patterns (pattern_id, pattern_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (pattern_id) DO UPDATE SET
          pattern_data = $2,
          updated_at = NOW()
      `, [patternObject.id, JSON.stringify(patternObject)]);
    } catch (error) {
      console.error('[ConstitutionalPatternDatabase] Failed to persist pattern:', error.message);
    }
  }

  /**
   * Load pattern cache
   */
  async _loadPatternCache() {
    try {
      const result = await this._postgres.query(`
        SELECT pattern_id, pattern_data
        FROM patterns
        ORDER BY pattern_id
        LIMIT 100000
      `);

      for (const row of result.rows) {
        this._patternCache.set(row.pattern_id, row.pattern_data);
      }
    } catch (error) {
      console.error('[ConstitutionalPatternDatabase] Failed to load pattern cache:', error.message);
    }
  }

  /**
   * Load pattern index
   */
  async _loadPatternIndex() {
    try {
      const result = await this._postgres.query(`
        SELECT pattern_id, pattern_data->>'payload'->>'name' as pattern_name
        FROM patterns
      `);

      for (const row of result.rows) {
        this._patternIndex.set(row.pattern_name, row.pattern_id);
      }
    } catch (error) {
      console.error('[ConstitutionalPatternDatabase] Failed to load pattern index:', error.message);
    }
  }

  /**
   * Load repository pattern index
   */
  async _loadRepositoryPatternIndex() {
    try {
      const result = await this._postgres.query(`
        SELECT pattern_data->>'lineage'->>'source_id' as repo_id, pattern_id
        FROM patterns
      `);

      for (const row of result.rows) {
        if (!this._repositoryPatternIndex.has(row.repo_id)) {
          this._repositoryPatternIndex.set(row.repo_id, new Set());
        }
        this._repositoryPatternIndex.get(row.repo_id).add(row.pattern_id);
      }
    } catch (error) {
      console.error('[ConstitutionalPatternDatabase] Failed to load repository pattern index:', error.message);
    }
  }

  /**
   * Clear pattern cache (memory only)
   */
  clearPatternCache() {
    this._patternCache.clear();
  }

  /**
   * Clear pattern index (memory only)
   */
  clearPatternIndex() {
    this._patternIndex.clear();
  }

  /**
   * Clear repository pattern index (memory only)
   */
  clearRepositoryPatternIndex() {
    this._repositoryPatternIndex.clear();
  }
}

module.exports = { ConstitutionalPatternDatabase };
