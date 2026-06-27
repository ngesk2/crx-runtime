/**
 * AUTHORITY CLASSIFICATION TAXONOMY
 * 
 * Every subsystem must be classified to prevent generated artifacts
 * from impersonating canonical truth.
 */

import { DeterministicFailureFactory } from './deterministic_failure';

export enum AuthorityClassification {
  /**
   * SOURCE_AUTHORITY
   * Canonical truth. The single source of reality.
   * Examples: Replay kernel, constitutional law
   */
  SOURCE_AUTHORITY = 'SOURCE_AUTHORITY',

  /**
   * DERIVATION
   * Regeneratable from source authority.
   * Examples: Witness roots, certificates, fingerprints
   */
  DERIVATION = 'DERIVATION',

  /**
   * SHADOW
   * Dangerous duplicate. Should not exist.
   * Examples: kernel/commit-service (duplicate canonicalization)
   */
  SHADOW = 'SHADOW',

  /**
   * CACHE
   * Disposable. Can be regenerated.
   * Examples: Computed projections, materialized views
   */
  CACHE = 'CACHE',

  /**
   * PROJECTION
   * Read-only view of source authority.
   * Examples: UI displays, API responses
   */
  PROJECTION = 'PROJECTION'
}

/**
 * Authority metadata
 */
export interface AuthorityMetadata {
  classification: AuthorityClassification;
  source_authority?: string; // For DERIVATION, PROJECTION
  regeneratable: boolean;
  ttl?: number; // For CACHE
}

/**
 * Authority registry
 */
export class AuthorityRegistry {
  private static authorities = new Map<string, AuthorityMetadata>();

  static register(
    name: string,
    metadata: AuthorityMetadata
  ): void {
    this.authorities.set(name, metadata);
  }

  static get(name: string): AuthorityMetadata | undefined {
    return this.authorities.get(name);
  }

  static getAll(): Map<string, AuthorityMetadata> {
    return new Map(this.authorities);
  }

  static validateNoShadows(): void {
    const shadows = Array.from(this.authorities.entries())
      .filter(([_, meta]) => meta.classification === AuthorityClassification.SHADOW)
      .map(([name, _]) => name);

    if (shadows.length > 0) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'SHADOW_AUTHORITY_DETECTED' as any,
          'AUTHORITY_VALIDATION' as any,
          { shadows }
        )
      );
    }
  }
}
