/**
 * Symbol-Level Incremental Cache (Bazel-style)
 * 
 * Currently: hash(file)
 * 
 * This won't scale.
 * 
 * Eventually you need:
 * - Repository<User> hash
 * - Authority<User> hash
 * - Projection<Order> hash
 * - Capability hash
 * - Mutation edge hash
 * 
 * Think Bazel. Or LLVM. Or Rust incremental compilation.
 * 
 * If one repository changes, you shouldn't rebuild 40 million graph edges.
 * Only:
 * - Repository<User>
 * - Mutation graph
 * - Ownership graph
 * - Dependent rules
 */

import { SymbolID } from './node-types';
import { createHash } from 'crypto';

/**
 * Symbol Cache Entry
 */
export interface SymbolCacheEntry {
  symbolId: SymbolID;
  hash: string;
  dependencies: SymbolID[];
  dependents: SymbolID[];
  version: {
    compilerVersion: string;
    irVersion: string;
    registryVersion: string;
    ruleVersion: string;
  };
  timestamp: number; // Unix timestamp for ordering, not for cache validation
}

/**
 * Cache Statistics
 */
export interface CacheStatistics {
  totalSymbols: number;
  cacheHits: number;
  cacheMisses: number;
  invalidations: number;
  hitRate: number;
}

/**
 * Symbol-Level Incremental Cache
 */
export class SymbolLevelCache {
  private cache: Map<SymbolID, SymbolCacheEntry> = new Map();
  private dependencyGraph: Map<SymbolID, Set<SymbolID>> = new Map(); // symbol -> dependencies
  private dependentGraph: Map<SymbolID, Set<SymbolID>> = new Map(); // symbol -> dependents
  
  private statistics: CacheStatistics = {
    totalSymbols: 0,
    cacheHits: 0,
    cacheMisses: 0,
    invalidations: 0,
    hitRate: 0,
  };

  /**
   * Compute symbol hash
   * 
   Hash based on semantic properties, not file content.
   */
  computeSymbolHash(symbolId: SymbolID, content: any): string {
    const hash = createHash('sha256');
    hash.update(symbolId);
    hash.update(JSON.stringify(content));
    return hash.digest('hex');
  }

  /**
   * Cache symbol
   */
  cacheSymbol(
    symbolId: SymbolID,
    content: any,
    dependencies: SymbolID[] = [],
    version: {
      compilerVersion: string;
      irVersion: string;
      registryVersion: string;
      ruleVersion: string;
    }
  ): SymbolCacheEntry {
    const hash = this.computeSymbolHash(symbolId, content);
    
    const entry: SymbolCacheEntry = {
      symbolId,
      hash,
      dependencies,
      dependents: [],
      version,
      timestamp: Date.now(),
    };

    this.cache.set(symbolId, entry);
    this.statistics.totalSymbols++;

    // Update dependency graph
    this.dependencyGraph.set(symbolId, new Set(dependencies));
    for (const dep of dependencies) {
      if (!this.dependentGraph.has(dep)) {
        this.dependentGraph.set(dep, new Set());
      }
      this.dependentGraph.get(dep)!.add(symbolId);
    }

    return entry;
  }

  /**
   * Check cache hit
   */
  checkCacheHit(
    symbolId: SymbolID,
    content: any,
    version: {
      compilerVersion: string;
      irVersion: string;
      registryVersion: string;
      ruleVersion: string;
    }
  ): boolean {
    const entry = this.cache.get(symbolId);
    
    if (!entry) {
      this.statistics.cacheMisses++;
      this.updateHitRate();
      return false;
    }

    // Check version compatibility
    if (
      entry.version.compilerVersion !== version.compilerVersion ||
      entry.version.irVersion !== version.irVersion ||
      entry.version.registryVersion !== version.registryVersion ||
      entry.version.ruleVersion !== version.ruleVersion
    ) {
      this.statistics.cacheMisses++;
      this.updateHitRate();
      return false;
    }

    // Check hash
    const currentHash = this.computeSymbolHash(symbolId, content);
    if (entry.hash !== currentHash) {
      this.statistics.cacheMisses++;
      this.updateHitRate();
      return false;
    }

    this.statistics.cacheHits++;
    this.updateHitRate();
    return true;
  }

  /**
   * Get cache entry
   */
  getCacheEntry(symbolId: SymbolID): SymbolCacheEntry | undefined {
    return this.cache.get(symbolId);
  }

  /**
   * Invalidate symbol
   * 
   When a symbol changes, invalidate it and all its dependents.
   */
  invalidateSymbol(symbolId: SymbolID): void {
    const toInvalidate = new Set<SymbolID>();
    const queue: SymbolID[] = [symbolId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (toInvalidate.has(current)) continue;
      toInvalidate.add(current);
      
      // Add dependents to queue
      const dependents = this.dependentGraph.get(current);
      if (dependents) {
        for (const dependent of dependents) {
          queue.push(dependent);
        }
      }
    }
    
    // Invalidate all affected symbols
    for (const id of toInvalidate) {
      this.cache.delete(id);
      this.statistics.invalidations++;
    }
  }

  /**
   * Invalidate by dependency
   * 
   Invalidate all symbols that depend on a given symbol.
   */
  invalidateByDependency(dependencyId: SymbolID): void {
    const dependents = this.dependentGraph.get(dependencyId);
    if (!dependents) return;
    
    for (const dependent of dependents) {
      this.invalidateSymbol(dependent);
    }
  }

  /**
   * Get dependencies of symbol
   */
  getDependencies(symbolId: SymbolID): SymbolID[] {
    const deps = this.dependencyGraph.get(symbolId);
    return deps ? Array.from(deps) : [];
  }

  /**
   * Get dependents of symbol
   */
  getDependents(symbolId: SymbolID): SymbolID[] {
    const deps = this.dependentGraph.get(symbolId);
    return deps ? Array.from(deps) : [];
  }

  /**
   * Get transitive dependents
   */
  getTransitiveDependents(symbolId: SymbolID): SymbolID[] {
    const transitive = new Set<SymbolID>();
    const queue: SymbolID[] = [symbolId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (transitive.has(current)) continue;
      transitive.add(current);
      
      const dependents = this.dependentGraph.get(current);
      if (dependents) {
        for (const dependent of dependents) {
          queue.push(dependent);
        }
      }
    }
    
    transitive.delete(symbolId); // Remove the original symbol
    return Array.from(transitive);
  }

  /**
   * Get transitive dependencies
   */
  getTransitiveDependencies(symbolId: SymbolID): SymbolID[] {
    const transitive = new Set<SymbolID>();
    const queue: SymbolID[] = [symbolId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (transitive.has(current)) continue;
      transitive.add(current);
      
      const deps = this.dependencyGraph.get(current);
      if (deps) {
        for (const dep of deps) {
          queue.push(dep);
        }
      }
    }
    
    transitive.delete(symbolId); // Remove the original symbol
    return Array.from(transitive);
  }

  /**
   * Build minimal rebuild set
   * 
   Given changed symbols, compute the minimal set of symbols to rebuild.
   */
  computeMinimalRebuildSet(changedSymbols: SymbolID[]): Set<SymbolID> {
    const rebuildSet = new Set<SymbolID>();
    
    for (const changed of changedSymbols) {
      // Add the changed symbol itself
      rebuildSet.add(changed);
      
      // Add all transitive dependents
      const transitiveDependents = this.getTransitiveDependents(changed);
      for (const dependent of transitiveDependents) {
        rebuildSet.add(dependent);
      }
    }
    
    return rebuildSet;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.dependencyGraph.clear();
    this.dependentGraph.clear();
    this.statistics = {
      totalSymbols: 0,
      cacheHits: 0,
      cacheMisses: 0,
      invalidations: 0,
      hitRate: 0,
    };
  }

  /**
   * Get statistics
   */
  getStatistics(): CacheStatistics {
    return { ...this.statistics };
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.statistics.cacheHits + this.statistics.cacheMisses;
    this.statistics.hitRate = total > 0 ? this.statistics.cacheHits / total : 0;
  }

  /**
   * Export cache to JSON
   */
  exportToJSON(): string {
    const data = {
      cache: Array.from(this.cache.entries()),
      dependencyGraph: Array.from(this.dependencyGraph.entries()).map(([k, v]) => [k, Array.from(v)]),
      dependentGraph: Array.from(this.dependentGraph.entries()).map(([k, v]) => [k, Array.from(v)]),
      statistics: this.statistics,
    };
    return JSON.stringify(data);
  }

  /**
   * Import cache from JSON
   */
  importFromJSON(json: string): void {
    const data = JSON.parse(json);
    
    this.cache = new Map(data.cache);
    this.dependencyGraph = new Map(data.dependencyGraph.map(([k, v]: [string, string[]]) => [k, new Set(v)]));
    this.dependentGraph = new Map(data.dependentGraph.map(([k, v]: [string, string[]]) => [k, new Set(v)]));
    this.statistics = data.statistics;
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Get dependency graph size
   */
  getDependencyGraphSize(): number {
    return this.dependencyGraph.size;
  }

  /**
   * Get dependent graph size
   */
  getDependentGraphSize(): number {
    return this.dependentGraph.size;
  }

  /**
   * Prune cache
   * 
   Remove cache entries that are no longer needed.
   */
  pruneCache(keepSymbols: Set<SymbolID>): void {
    for (const symbolId of this.cache.keys()) {
      if (!keepSymbols.has(symbolId)) {
        this.cache.delete(symbolId);
      }
    }
  }

  /**
   * Validate cache consistency
   */
  validateCache(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check that all dependencies exist in cache
    for (const [symbolId, deps] of this.dependencyGraph) {
      for (const dep of deps) {
        if (!this.cache.has(dep)) {
          errors.push(`Symbol ${symbolId} depends on ${dep} which is not in cache`);
        }
      }
    }
    
    // Check that all dependents exist in cache
    for (const [symbolId, dependents] of this.dependentGraph) {
      for (const dependent of dependents) {
        if (!this.cache.has(dependent)) {
          errors.push(`Symbol ${symbolId} is depended on by ${dependent} which is not in cache`);
        }
      }
    }
    
    // Check that dependency and dependent graphs are consistent
    for (const [symbolId, deps] of this.dependencyGraph) {
      for (const dep of deps) {
        const dependentsOfDep = this.dependentGraph.get(dep);
        if (!dependentsOfDep || !dependentsOfDep.has(symbolId)) {
          errors.push(`Inconsistency: ${symbolId} depends on ${dep} but ${dep} does not list ${symbolId} as dependent`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Visualize dependency graph
   */
  visualizeDependencyGraph(symbolId: SymbolID): string {
    const visited = new Set<SymbolID>();
    const lines: string[] = [];
    
    const visualize = (id: SymbolID, depth: number = 0) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const indent = '  '.repeat(depth);
      lines.push(`${indent}${id}`);
      
      const deps = this.dependencyGraph.get(id);
      if (deps) {
        for (const dep of deps) {
          visualize(dep, depth + 1);
        }
      }
    };
    
    visualize(symbolId);
    return lines.join('\n');
  }

  /**
   * Visualize dependent graph
   */
  visualizeDependentGraph(symbolId: SymbolID): string {
    const visited = new Set<SymbolID>();
    const lines: string[] = [];
    
    const visualize = (id: SymbolID, depth: number = 0) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const indent = '  '.repeat(depth);
      lines.push(`${indent}${id}`);
      
      const dependents = this.dependentGraph.get(id);
      if (dependents) {
        for (const dependent of dependents) {
          visualize(dependent, depth + 1);
        }
      }
    };
    
    visualize(symbolId);
    return lines.join('\n');
  }
}
