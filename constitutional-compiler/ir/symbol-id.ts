/**
 * Symbol ID Generator
 * 
 * Every symbol receives a stable UUID.
 * Paths change, symbols don't.
 * 
 * Compiler IDs must be deterministic.
 * Same source → Same symbol → Same ID forever.
 * 
 * Canonical Symbol Path UUID Generation:
 * - Organization
 * - Package
 * - Module
 * - Authority
 * - Capability
 * - Identity
 * - Semantic signature
 * 
 * Paths move. Organizations rename. Packages split.
 * Semantic ownership should survive refactors.
 */

import { createHash } from 'crypto';

export type SymbolID = string;

/**
 * Canonical Symbol Path
 */
export interface CanonicalSymbolPath {
  organization: string;
  package: string;
  module: string;
  authority?: string;
  capability?: string;
  identity?: string;
}

/**
 * Semantic Signature
 */
export interface SemanticSignature {
  kind: string;
  name: string;
  properties: Record<string, any>;
}

/**
 * Generate a deterministic UUID v5 using Canonical Symbol Path
 * 
 * Uses SHA256(organization/package/module/authority/capability/identity + semantic signature)
 * This ensures the same symbol always produces the same ID, even after refactors.
 * 
 * @param path - Canonical Symbol Path
 * @param signature - Semantic signature
 * @returns Stable Symbol ID
 */
export function generateCanonicalSymbolID(
  path: CanonicalSymbolPath,
  signature: SemanticSignature
): SymbolID {
  const canonicalName = buildCanonicalName(path);
  const context = JSON.stringify(signature);
  const input = `canonical:${canonicalName}:${context}`;
  const hash = createHash('sha256').update(input).digest('hex');
  
  // Convert first 16 bytes of hash to UUID v5 format
  const bytes = Buffer.from(hash.substring(0, 32), 'hex');
  
  // Set version to 5 (name-based UUID)
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  // Set variant to RFC 4122
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  
  // Convert to hex string
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Format as UUID
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32)
  ].join('-');
}

/**
 * Build canonical name from path
 */
function buildCanonicalName(path: CanonicalSymbolPath): string {
  const parts = [
    path.organization,
    path.package,
    path.module,
  ];

  if (path.authority) parts.push(path.authority);
  if (path.capability) parts.push(path.capability);
  if (path.identity) parts.push(path.identity);

  return parts.join('/');
}

/**
 * Generate a deterministic UUID v5
 * 
 * Uses SHA256(namespace + canonical symbol + signature)
 * This ensures the same symbol always produces the same ID.
 * 
 * @param namespace - Symbol namespace (e.g., "authority", "service")
 * @param canonicalName - Canonical symbol name
 * @param signature - Additional signature (e.g., module path, context)
 * @returns Stable Symbol ID
 */
export function generateDeterministicSymbolID(
  namespace: string,
  canonicalName: string,
  signature: string
): SymbolID {
  const input = `${namespace}:${canonicalName}:${signature}`;
  const hash = createHash('sha256').update(input).digest('hex');
  
  // Convert first 16 bytes of hash to UUID v5 format
  const bytes = Buffer.from(hash.substring(0, 32), 'hex');
  
  // Set version to 5 (name-based UUID)
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  // Set variant to RFC 4122
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  
  // Convert to hex string
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Format as UUID
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32)
  ].join('-');
}

/**
 * Generate a Symbol ID with canonical components
 * 
 * @param namespace - Symbol namespace (e.g., "authority", "service")
 * @param name - Canonical symbol name
 * @param context - Additional context (e.g., module path)
 * @returns Stable Symbol ID
 */
export function generateSymbolID(
  namespace: string,
  name: string,
  context: string
): SymbolID {
  return generateDeterministicSymbolID(namespace, name, context);
}

/**
 * Symbol ID Registry
 * 
 * Tracks all generated Symbol IDs and their canonical names
 * to ensure uniqueness and enable reverse lookup.
 */
export class SymbolIDRegistry {
  private symbols: Map<SymbolID, { name: string; namespace: string; context: string }> = new Map();
  private nameIndex: Map<string, SymbolID> = new Map();

  /**
   * Register a symbol ID
   */
  register(id: SymbolID, name: string, namespace: string, context: string): void {
    const key = `${namespace}:${name}:${context}`;
    
    if (this.nameIndex.has(key)) {
      throw new Error(`Symbol already registered: ${key}`);
    }

    this.symbols.set(id, { name, namespace, context });
    this.nameIndex.set(key, id);
  }

  /**
   * Look up symbol ID by canonical name
   */
  lookup(namespace: string, name: string, context: string): SymbolID | undefined {
    const key = `${namespace}:${name}:${context}`;
    return this.nameIndex.get(key);
  }

  /**
   * Get symbol metadata by ID
   */
  getMetadata(id: SymbolID): { name: string; namespace: string; context: string } | undefined {
    return this.symbols.get(id);
  }

  /**
   * Get all registered symbols
   */
  getAll(): Map<SymbolID, { name: string; namespace: string; context: string }> {
    return new Map(this.symbols);
  }

  /**
   * Clear registry (for testing)
   */
  clear(): void {
    this.symbols.clear();
    this.nameIndex.clear();
  }
}
