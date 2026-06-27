/**
 * Incremental Cache
 * 
 * Hash every file. If hash unchanged, never parse again.
 * 
 * Compiler metadata should never depend on wall-clock time.
 * Uses content hash, compiler version, IR version, registry version, rule version.
 */

import { createHash } from 'crypto';

export interface CacheEntry {
  filePath: string;
  hash: string;
  compilerVersion: string;
  irVersion: string;
  registryVersion: string;
  ruleVersion: string;
  symbolIDs: string[];
}

export class IncrementalCache {
  private cache: Map<string, CacheEntry> = new Map();
  private compilerVersion: string;
  private irVersion: string;
  private registryVersion: string;
  private ruleVersion: string;

  constructor(
    compilerVersion: string = '1.0.0',
    irVersion: string = '1.0.0',
    registryVersion: string = '1.0.0',
    ruleVersion: string = '1.0.0'
  ) {
    this.compilerVersion = compilerVersion;
    this.irVersion = irVersion;
    this.registryVersion = registryVersion;
    this.ruleVersion = ruleVersion;
  }

  /**
   * Compute file hash
   */
  computeHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check if file is cached and unchanged
   */
  isCached(filePath: string, content: string): boolean {
    const entry = this.cache.get(filePath);
    if (!entry) {
      return false;
    }

    const currentHash = this.computeHash(content);
    
    // Check hash and version compatibility
    return (
      entry.hash === currentHash &&
      entry.compilerVersion === this.compilerVersion &&
      entry.irVersion === this.irVersion &&
      entry.registryVersion === this.registryVersion &&
      entry.ruleVersion === this.ruleVersion
    );
  }

  /**
   * Get cached entry
   */
  get(filePath: string): CacheEntry | undefined {
    return this.cache.get(filePath);
  }

  /**
   * Set cache entry
   */
  set(filePath: string, content: string, symbolIDs: string[]): void {
    const entry: CacheEntry = {
      filePath,
      hash: this.computeHash(content),
      compilerVersion: this.compilerVersion,
      irVersion: this.irVersion,
      registryVersion: this.registryVersion,
      ruleVersion: this.ruleVersion,
      symbolIDs,
    };
    this.cache.set(filePath, entry);
  }

  /**
   * Invalidate cache entry
   */
  invalidate(filePath: string): void {
    this.cache.delete(filePath);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { total: number; hits: number; misses: number } {
    return {
      total: this.cache.size,
      hits: 0, // TODO: Track hits/misses
      misses: 0,
    };
  }

  /**
   * Update version
   */
  updateVersions(versions: {
    compilerVersion?: string;
    irVersion?: string;
    registryVersion?: string;
    ruleVersion?: string;
  }): void {
    if (versions.compilerVersion) this.compilerVersion = versions.compilerVersion;
    if (versions.irVersion) this.irVersion = versions.irVersion;
    if (versions.registryVersion) this.registryVersion = versions.registryVersion;
    if (versions.ruleVersion) this.ruleVersion = versions.ruleVersion;
  }
}
