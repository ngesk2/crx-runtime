/**
 * Repository Fingerprinting
 * 
 * Ω.50 — Repository Fingerprinting
 * 
 * Instead of embeddings...
 * 
 * Every repository receives constitutional fingerprints.
 * 
 * Architectural Style:
 * - DDD
 * - CQRS
 * - MVC
 * - Layered
 * - Hexagonal
 * - Microkernel
 * - Event Sourced
 * - Actor Model
 * - Functional
 * - Reactive
 * 
 * Libraries:
 * - React
 * - Vue
 * - Angular
 * - Spring
 * - Actix
 * - Axum
 * - Tokio
 * - Express
 * - FastAPI
 * - etc
 * 
 * Patterns:
 * - Repository
 * - Factory
 * - Builder
 * - Visitor
 * - Strategy
 * - Command
 * - Mediator
 * - Observer
 * 
 * Now you can ask:
 * 
 * "show every repository using CQRS"
 * 
 * without LLM inference.
 * 
 * Constitutional Constraint: Fingerprints are computed deterministically from constitutional graphs.
 */

const crypto = require('crypto');
const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class RepositoryFingerprinting {
  constructor(postgresPool, objectRegistry, witnessChain, symbolGraph, callGraph, importGraph, typeGraph, buildGraph) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._symbolGraph = symbolGraph;
    this._callGraph = callGraph;
    this._importGraph = importGraph;
    this._typeGraph = typeGraph;
    this._buildGraph = buildGraph;
    this._fingerprintCache = new Map(); // repo_id → fingerprint
    this._initialized = false;
  }

  /**
   * Initialize repository fingerprinting
   */
  async initialize() {
    await this._loadFingerprintCache();
    this._initialized = true;
    console.log('[RepositoryFingerprinting] Initialized with', this._fingerprintCache.size, 'fingerprints');
  }

  /**
   * Generate fingerprint for repository
   */
  async generateFingerprint(repoId) {
    console.log(`[RepositoryFingerprinting] Generating fingerprint for: ${repoId}`);

    const fingerprint = {
      repo_id: repoId,
      architectural_style: null,
      libraries: [],
      patterns: [],
      complexity_metrics: {},
      fingerprint_hash: null,
      generated_at: new Date(constitutionalTimeAuthority.now()).toISOString(),
    };

    // Detect architectural style
    fingerprint.architectural_style = await this._detectArchitecturalStyle(repoId);

    // Detect libraries
    fingerprint.libraries = await this._detectLibraries(repoId);

    // Detect patterns
    fingerprint.patterns = await this._detectPatterns(repoId);

    // Compute complexity metrics
    fingerprint.complexity_metrics = await this._computeComplexityMetrics(repoId);

    // Compute fingerprint hash
    fingerprint.fingerprint_hash = this._computeFingerprintHash(fingerprint);

    // Cache fingerprint
    this._fingerprintCache.set(repoId, fingerprint);
    await this._persistFingerprint(fingerprint);

    console.log(`[RepositoryFingerprinting] Fingerprint generated for: ${repoId}`);
    return fingerprint;
  }

  /**
   * Detect architectural style
   */
  async _detectArchitecturalStyle(repoId) {
    const styles = [];

    // Get symbols and graphs
    const symbols = this._symbolGraph.getSymbolsByRepository(repoId);
    const importGraph = this._importGraph.getImportGraph(repoId);
    const typeGraph = this._typeGraph.getTypeGraph(repoId);

    // Detect DDD (Domain-Driven Design)
    if (this._detectDDD(symbols, typeGraph)) {
      styles.push('DDD');
    }

    // Detect CQRS (Command Query Responsibility Segregation)
    if (this._detectCQRS(symbols, typeGraph)) {
      styles.push('CQRS');
    }

    // Detect MVC (Model-View-Controller)
    if (this._detectMVC(symbols, importGraph)) {
      styles.push('MVC');
    }

    // Detect Layered Architecture
    if (this._detectLayered(symbols, importGraph)) {
      styles.push('Layered');
    }

    // Detect Hexagonal Architecture
    if (this._detectHexagonal(symbols, importGraph)) {
      styles.push('Hexagonal');
    }

    // Detect Microkernel
    if (this._detectMicrokernel(symbols, typeGraph)) {
      styles.push('Microkernel');
    }

    // Detect Event Sourced
    if (this._detectEventSourced(symbols, typeGraph)) {
      styles.push('Event Sourced');
    }

    // Detect Actor Model
    if (this._detectActorModel(symbols, typeGraph)) {
      styles.push('Actor Model');
    }

    // Detect Functional
    if (this._detectFunctional(symbols, typeGraph)) {
      styles.push('Functional');
    }

    // Detect Reactive
    if (this._detectReactive(symbols, typeGraph)) {
      styles.push('Reactive');
    }

    return styles.length > 0 ? styles : ['Unknown'];
  }

  /**
   * Detect DDD
   */
  _detectDDD(symbols, typeGraph) {
    const dddIndicators = ['domain', 'entity', 'valueobject', 'aggregate', 'repository', 'service'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return dddIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect CQRS
   */
  _detectCQRS(symbols, typeGraph) {
    const cqrsIndicators = ['command', 'query', 'commandhandler', 'queryhandler', 'commandbus', 'querybus'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return cqrsIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect MVC
   */
  _detectMVC(symbols, importGraph) {
    const mvcIndicators = ['controller', 'model', 'view', 'component'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return mvcIndicators.every(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Layered
   */
  _detectLayered(symbols, importGraph) {
    if (!importGraph) {
      return false;
    }
    
    // Check for clear layer structure in imports
    const layers = ['controller', 'service', 'repository', 'model'];
    const modules = Array.from(importGraph.modules.keys());
    
    return layers.some(layer => 
      modules.some(module => module.toLowerCase().includes(layer))
    );
  }

  /**
   * Detect Hexagonal
   */
  _detectHexagonal(symbols, importGraph) {
    const hexagonalIndicators = ['port', 'adapter', 'domain', 'application', 'infrastructure'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return hexagonalIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Microkernel
   */
  _detectMicrokernel(symbols, typeGraph) {
    const microkernelIndicators = ['plugin', 'kernel', 'core', 'extension', 'module'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return microkernelIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Event Sourced
   */
  _detectEventSourced(symbols, typeGraph) {
    const eventSourcedIndicators = ['event', 'eventstore', 'eventsourcing', 'aggregate', 'snapshot'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return eventSourcedIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Actor Model
   */
  _detectActorModel(symbols, typeGraph) {
    const actorIndicators = ['actor', 'actorref', 'mailbox', 'dispatcher', 'message'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return actorIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Functional
   */
  _detectFunctional(symbols, typeGraph) {
    const functionalIndicators = ['monad', 'functor', 'immutable', 'pure', 'higherorder'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return functionalIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Reactive
   */
  _detectReactive(symbols, typeGraph) {
    const reactiveIndicators = ['observable', 'subscriber', 'stream', 'reactive', 'flux', 'mono'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return reactiveIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect libraries
   */
  async _detectLibraries(repoId) {
    const libraries = [];
    const buildGraph = this._buildGraph.getBuildGraph(repoId);
    const symbols = this._symbolGraph.getSymbolsByRepository(repoId);

    // Detect from build graph dependencies
    if (buildGraph && buildGraph.dependencies) {
      for (const dep of buildGraph.dependencies) {
        const library = this._classifyLibrary(dep.name, dep.version);
        if (library) {
          libraries.push(library);
        }
      }
    }

    // Detect from symbol imports
    const symbolNames = symbols.map(s => s.payload.canonical_name);
    for (const name of symbolNames) {
      const library = this._classifyLibraryFromImport(name);
      if (library && !libraries.find(l => l.name === library.name)) {
        libraries.push(library);
      }
    }

    return libraries;
  }

  /**
   * Classify library from dependency
   */
  _classifyLibrary(name, version) {
    const libraryMap = {
      'react': { name: 'React', category: 'UI Framework', type: 'frontend' },
      'vue': { name: 'Vue', category: 'UI Framework', type: 'frontend' },
      'angular': { name: 'Angular', category: 'UI Framework', type: 'frontend' },
      'spring': { name: 'Spring', category: 'Web Framework', type: 'backend' },
      'actix': { name: 'Actix', category: 'Web Framework', type: 'backend' },
      'axum': { name: 'Axum', category: 'Web Framework', type: 'backend' },
      'tokio': { name: 'Tokio', category: 'Async Runtime', type: 'runtime' },
      'express': { name: 'Express', category: 'Web Framework', type: 'backend' },
      'fastapi': { name: 'FastAPI', category: 'Web Framework', type: 'backend' },
      'django': { name: 'Django', category: 'Web Framework', type: 'backend' },
      'flask': { name: 'Flask', category: 'Web Framework', type: 'backend' },
      'rails': { name: 'Rails', category: 'Web Framework', type: 'backend' },
      'lodash': { name: 'Lodash', category: 'Utility', type: 'utility' },
      'rxjs': { name: 'RxJS', category: 'Reactive', type: 'utility' },
      'redux': { name: 'Redux', category: 'State Management', type: 'utility' },
      'mobx': { name: 'MobX', category: 'State Management', type: 'utility' },
      'typeorm': { name: 'TypeORM', category: 'ORM', type: 'database' },
      'sequelize': { name: 'Sequelize', category: 'ORM', type: 'database' },
      'prisma': { name: 'Prisma', category: 'ORM', type: 'database' },
      'mongoose': { name: 'Mongoose', category: 'ODM', type: 'database' },
      'joi': { name: 'Joi', category: 'Validation', type: 'utility' },
      'zod': { name: 'Zod', category: 'Validation', type: 'utility' },
      'jest': { name: 'Jest', category: 'Testing', type: 'testing' },
      'mocha': { name: 'Mocha', category: 'Testing', type: 'testing' },
      'pytest': { name: 'Pytest', category: 'Testing', type: 'testing' },
    };

    const lowerName = name.toLowerCase();
    for (const [key, library] of Object.entries(libraryMap)) {
      if (lowerName.includes(key)) {
        return { ...library, version };
      }
    }

    return null;
  }

  /**
   * Classify library from import
   */
  _classifyLibraryFromImport(importName) {
    const lowerName = importName.toLowerCase();
    
    if (lowerName.includes('react')) {
      return { name: 'React', category: 'UI Framework', type: 'frontend' };
    }
    if (lowerName.includes('vue')) {
      return { name: 'Vue', category: 'UI Framework', type: 'frontend' };
    }
    if (lowerName.includes('angular')) {
      return { name: 'Angular', category: 'UI Framework', type: 'frontend' };
    }
    if (lowerName.includes('express')) {
      return { name: 'Express', category: 'Web Framework', type: 'backend' };
    }
    if (lowerName.includes('lodash')) {
      return { name: 'Lodash', category: 'Utility', type: 'utility' };
    }
    if (lowerName.includes('rxjs')) {
      return { name: 'RxJS', category: 'Reactive', type: 'utility' };
    }

    return null;
  }

  /**
   * Detect patterns
   */
  async _detectPatterns(repoId) {
    const patterns = [];
    const symbols = this._symbolGraph.getSymbolsByRepository(repoId);
    const typeGraph = this._typeGraph.getTypeGraph(repoId);

    // Detect Repository pattern
    if (this._detectRepositoryPattern(symbols)) {
      patterns.push('Repository');
    }

    // Detect Factory pattern
    if (this._detectFactoryPattern(symbols)) {
      patterns.push('Factory');
    }

    // Detect Builder pattern
    if (this._detectBuilderPattern(symbols)) {
      patterns.push('Builder');
    }

    // Detect Visitor pattern
    if (this._detectVisitorPattern(symbols, typeGraph)) {
      patterns.push('Visitor');
    }

    // Detect Strategy pattern
    if (this._detectStrategyPattern(symbols, typeGraph)) {
      patterns.push('Strategy');
    }

    // Detect Command pattern
    if (this._detectCommandPattern(symbols)) {
      patterns.push('Command');
    }

    // Detect Mediator pattern
    if (this._detectMediatorPattern(symbols)) {
      patterns.push('Mediator');
    }

    // Detect Observer pattern
    if (this._detectObserverPattern(symbols, typeGraph)) {
      patterns.push('Observer');
    }

    // Detect Singleton pattern
    if (this._detectSingletonPattern(symbols)) {
      patterns.push('Singleton');
    }

    // Detect Decorator pattern
    if (this._detectDecoratorPattern(symbols)) {
      patterns.push('Decorator');
    }

    return patterns;
  }

  /**
   * Detect Repository pattern
   */
  _detectRepositoryPattern(symbols) {
    const repositoryIndicators = ['repository', 'repo', 'dao'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return repositoryIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Factory pattern
   */
  _detectFactoryPattern(symbols) {
    const factoryIndicators = ['factory', 'create', 'builder'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return factoryIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Builder pattern
   */
  _detectBuilderPattern(symbols) {
    const builderIndicators = ['builder', 'build'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return builderIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Visitor pattern
   */
  _detectVisitorPattern(symbols, typeGraph) {
    const visitorIndicators = ['visitor', 'accept', 'visit'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return visitorIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Strategy pattern
   */
  _detectStrategyPattern(symbols, typeGraph) {
    const strategyIndicators = ['strategy', 'context', 'algorithm'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return strategyIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Command pattern
   */
  _detectCommandPattern(symbols) {
    const commandIndicators = ['command', 'execute', 'undo', 'redo'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return commandIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Mediator pattern
   */
  _detectMediatorPattern(symbols) {
    const mediatorIndicators = ['mediator', 'colleague', 'notify'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return mediatorIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Observer pattern
   */
  _detectObserverPattern(symbols, typeGraph) {
    const observerIndicators = ['observer', 'subject', 'subscribe', 'notify', 'event'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return observerIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Singleton pattern
   */
  _detectSingletonPattern(symbols) {
    const singletonIndicators = ['singleton', 'instance'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return singletonIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Detect Decorator pattern
   */
  _detectDecoratorPattern(symbols) {
    const decoratorIndicators = ['decorator', 'wrapper', 'decorate'];
    const symbolNames = symbols.map(s => s.payload.canonical_name.toLowerCase());
    
    return decoratorIndicators.some(indicator => 
      symbolNames.some(name => name.includes(indicator))
    );
  }

  /**
   * Compute complexity metrics
   */
  async _computeComplexityMetrics(repoId) {
    const symbols = this._symbolGraph.getSymbolsByRepository(repoId);
    const callGraph = this._callGraph.getCallGraph(repoId);
    const typeGraph = this._typeGraph.getTypeGraph(repoId);

    const metrics = {
      total_symbols: symbols.length,
      total_functions: symbols.filter(s => s.payload.kind === 'Function').length,
      total_classes: symbols.filter(s => s.payload.kind === 'Class').length,
      total_interfaces: symbols.filter(s => s.payload.kind === 'Interface').length,
      average_methods_per_class: 0,
      average_complexity: 0,
      cyclomatic_complexity: 0,
      inheritance_depth: 0,
      coupling: 0,
      cohesion: 0,
    };

    // Calculate average methods per class
    const classes = symbols.filter(s => s.payload.kind === 'Class');
    if (classes.length > 0) {
      const totalMethods = symbols.filter(s => s.payload.kind === 'Method').length;
      metrics.average_methods_per_class = totalMethods / classes.length;
    }

    // Calculate inheritance depth
    if (typeGraph && typeGraph.extends) {
      let maxDepth = 0;
      for (const ext of typeGraph.extends) {
        const depth = this._calculateInheritanceDepth(ext.target, typeGraph.extends, 0);
        if (depth > maxDepth) {
          maxDepth = depth;
        }
      }
      metrics.inheritance_depth = maxDepth;
    }

    // Calculate coupling
    if (callGraph && callGraph.calls) {
      metrics.coupling = callGraph.calls.length;
    }

    return metrics;
  }

  /**
   * Calculate inheritance depth
   */
  _calculateInheritanceDepth(node, extendsList, currentDepth) {
    const parents = extendsList.filter(e => e.target === node);
    if (parents.length === 0) {
      return currentDepth;
    }
    
    let maxDepth = currentDepth;
    for (const parent of parents) {
      const depth = this._calculateInheritanceDepth(parent.source, extendsList, currentDepth + 1);
      if (depth > maxDepth) {
        maxDepth = depth;
      }
    }
    
    return maxDepth;
  }

  /**
   * Compute fingerprint hash
   */
  _computeFingerprintHash(fingerprint) {
    const { CanonicalAuthority } = require('./canonical_authority');
    
    const fingerprintData = {
      architectural_style: fingerprint.architectural_style,
      libraries: fingerprint.libraries,
      patterns: fingerprint.patterns,
      complexity_metrics: fingerprint.complexity_metrics,
    };

    return CanonicalAuthority.hash(fingerprintData);
  }

  /**
   * Get fingerprint by repository
   */
  getFingerprint(repoId) {
    return this._fingerprintCache.get(repoId);
  }

  /**
   * Query repositories by architectural style
   */
  queryByArchitecturalStyle(style) {
    return Array.from(this._fingerprintCache.values())
      .filter(fp => fp.architectural_style.includes(style))
      .map(fp => fp.repo_id);
  }

  /**
   * Query repositories by library
   */
  queryByLibrary(libraryName) {
    return Array.from(this._fingerprintCache.values())
      .filter(fp => fp.libraries.some(lib => lib.name === libraryName))
      .map(fp => fp.repo_id);
  }

  /**
   * Query repositories by pattern
   */
  queryByPattern(pattern) {
    return Array.from(this._fingerprintCache.values())
      .filter(fp => fp.patterns.includes(pattern))
      .map(fp => fp.repo_id);
  }

  /**
   * Get all fingerprints
   */
  getAllFingerprints() {
    return Array.from(this._fingerprintCache.values());
  }

  /**
   * Get fingerprint statistics
   */
  getStatistics() {
    const fingerprints = Array.from(this._fingerprintCache.values());
    
    const stats = {
      total_repositories: fingerprints.length,
      by_architectural_style: {},
      by_library: {},
      by_pattern: {},
      average_complexity: 0,
      average_symbols: 0,
    };

    let totalComplexity = 0;
    let totalSymbols = 0;

    for (const fp of fingerprints) {
      // Count by architectural style
      for (const style of fp.architectural_style) {
        stats.by_architectural_style[style] = (stats.by_architectural_style[style] || 0) + 1;
      }

      // Count by library
      for (const lib of fp.libraries) {
        stats.by_library[lib.name] = (stats.by_library[lib.name] || 0) + 1;
      }

      // Count by pattern
      for (const pattern of fp.patterns) {
        stats.by_pattern[pattern] = (stats.by_pattern[pattern] || 0) + 1;
      }

      // Sum complexity
      totalComplexity += fp.complexity_metrics.coupling || 0;
      totalSymbols += fp.complexity_metrics.total_symbols || 0;
    }

    if (fingerprints.length > 0) {
      stats.average_complexity = totalComplexity / fingerprints.length;
      stats.average_symbols = totalSymbols / fingerprints.length;
    }

    return stats;
  }

  /**
   * Persist fingerprint
   */
  async _persistFingerprint(fingerprint) {
    try {
      await this._postgres.query(`
        INSERT INTO repository_fingerprints (repo_id, fingerprint_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (repo_id) DO UPDATE SET
          fingerprint_data = $2,
          updated_at = NOW()
      `, [fingerprint.repo_id, CanonicalBytes.serialize(fingerprint)]);
    } catch (error) {
      console.error('[RepositoryFingerprinting] Failed to persist fingerprint:', error.message);
    }
  }

  /**
   * Load fingerprint cache
   */
  async _loadFingerprintCache() {
    try {
      const result = await this._postgres.query(`
        SELECT repo_id, fingerprint_data
        FROM repository_fingerprints
        ORDER BY repo_id
        LIMIT 1000
      `);

      for (const row of result.rows) {
        this._fingerprintCache.set(row.repo_id, row.fingerprint_data);
      }
    } catch (error) {
      console.error('[RepositoryFingerprinting] Failed to load fingerprint cache:', error.message);
    }
  }

  /**
   * Clear fingerprint cache (memory only)
   */
  clearFingerprintCache() {
    this._fingerprintCache.clear();
  }
}

module.exports = { RepositoryFingerprinting };
