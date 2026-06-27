/**
 * Symbol Canonicalizer
 * 
 * Transforms language-specific symbols into canonical symbols.
 * 
 * Every symbol becomes canonical regardless of source language:
 * - TypeScript
 * - Python
 * - Rust
 * - Go
 * - Java
 * - C#
 * - Solidity
 * - protobuf
 * - OpenAPI
 * - GraphQL
 * 
 * Everything becomes canonical.
 */

import { SymbolID } from '../ir/node-types';
import { CanonicalSymbol, CanonicalSymbolKind, CanonicalSymbolPath } from '../lowering/semantic-lowerer';

/**
 * Canonical Symbol Registry
 * 
 * Maps canonical symbols across all languages.
 * Ensures semantic ownership survives refactors.
 */
export class SymbolCanonicalizer {
  private canonicalSymbols: Map<SymbolID, CanonicalSymbol> = new Map();
  private symbolIndex: Map<string, SymbolID> = new Map();

  /**
   * Canonicalize a symbol
   */
  canonicalize(
    id: SymbolID,
    kind: CanonicalSymbolKind,
    name: string,
    path: CanonicalSymbolPath,
    owner: SymbolID,
    constitutionalRoot: SymbolID,
    sourceLanguage: string
  ): CanonicalSymbol {
    const semanticFingerprint = this.computeSemanticFingerprint(kind, name, path);
    
    const canonicalSymbol: CanonicalSymbol = {
      id,
      kind,
      name,
      path,
      owner,
      constitutionalRoot,
      semanticFingerprint,
      sourceLanguage,
    };

    this.canonicalSymbols.set(id, canonicalSymbol);
    this.symbolIndex.set(semanticFingerprint, id);

    return canonicalSymbol;
  }

  /**
   * Compute semantic fingerprint
   * 
   Based on semantic properties, not syntax.
   * Survives refactors, path changes, renames.
   */
  private computeSemanticFingerprint(
    kind: CanonicalSymbolKind,
    name: string,
    path: CanonicalSymbolPath
  ): string {
    const fingerprint = {
      kind,
      name,
      organization: path.organization,
      package: path.package,
      module: path.module,
      authority: path.authority,
      capability: path.capability,
      identity: path.identity,
    };
    
    // Hash the fingerprint for stable ID
    return this.hashFingerprint(fingerprint);
  }

  /**
   * Hash fingerprint
   */
  private hashFingerprint(fingerprint: any): string {
    const str = JSON.stringify(fingerprint);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Get canonical symbol by ID
   */
  getCanonicalSymbol(id: SymbolID): CanonicalSymbol | undefined {
    return this.canonicalSymbols.get(id);
  }

  /**
   * Get canonical symbol by semantic fingerprint
   */
  getBySemanticFingerprint(fingerprint: string): CanonicalSymbol | undefined {
    const id = this.symbolIndex.get(fingerprint);
    if (!id) return undefined;
    return this.canonicalSymbols.get(id);
  }

  /**
   * Find symbols by kind
   */
  findByKind(kind: CanonicalSymbolKind): CanonicalSymbol[] {
    const results: CanonicalSymbol[] = [];
    
    for (const symbol of this.canonicalSymbols.values()) {
      if (symbol.kind === kind) {
        results.push(symbol);
      }
    }
    
    return results;
  }

  /**
   * Find symbols by owner
   */
  findByOwner(owner: SymbolID): CanonicalSymbol[] {
    const results: CanonicalSymbol[] = [];
    
    for (const symbol of this.canonicalSymbols.values()) {
      if (symbol.owner === owner) {
        results.push(symbol);
      }
    }
    
    return results;
  }

  /**
   * Find symbols by constitutional root
   */
  findByConstitutionalRoot(root: SymbolID): CanonicalSymbol[] {
    const results: CanonicalSymbol[] = [];
    
    for (const symbol of this.canonicalSymbols.values()) {
      if (symbol.constitutionalRoot === root) {
        results.push(symbol);
      }
    }
    
    return results;
  }

  /**
   * Find symbols by path
   */
  findByPath(path: CanonicalSymbolPath): CanonicalSymbol[] {
    const results: CanonicalSymbol[] = [];
    
    for (const symbol of this.canonicalSymbols.values()) {
      if (
        symbol.path.organization === path.organization &&
        symbol.path.package === path.package &&
        symbol.path.module === path.module &&
        (path.authority === undefined || symbol.path.authority === path.authority) &&
        (path.capability === undefined || symbol.path.capability === path.capability) &&
        (path.identity === undefined || symbol.path.identity === path.identity)
      ) {
        results.push(symbol);
      }
    }
    
    return results;
  }

  /**
   * Get all canonical symbols
   */
  getAllCanonicalSymbols(): CanonicalSymbol[] {
    return Array.from(this.canonicalSymbols.values());
  }

  /**
   * Merge canonical symbols from another canonicalizer
   */
  merge(other: SymbolCanonicalizer): void {
    for (const symbol of other.getAllCanonicalSymbols()) {
      this.canonicalSymbols.set(symbol.id, symbol);
      this.symbolIndex.set(symbol.semanticFingerprint, symbol.id);
    }
  }

  /**
   * Clear all canonical symbols
   */
  clear(): void {
    this.canonicalSymbols.clear();
    this.symbolIndex.clear();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalSymbols: number;
    byKind: Record<CanonicalSymbolKind, number>;
    bySourceLanguage: Record<string, number>;
  } {
    const byKind: Record<CanonicalSymbolKind, number> = {} as any;
    const bySourceLanguage: Record<string, number> = {};

    for (const symbol of this.canonicalSymbols.values()) {
      byKind[symbol.kind] = (byKind[symbol.kind] || 0) + 1;
      bySourceLanguage[symbol.sourceLanguage] = (bySourceLanguage[symbol.sourceLanguage] || 0) + 1;
    }

    return {
      totalSymbols: this.canonicalSymbols.size,
      byKind,
      bySourceLanguage,
    };
  }
}
