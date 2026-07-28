/**
 * CANONICAL HASH AUTHORITY
 * 
 * Pure TypeScript implementation of canonical hash authority.
 * Ported from constitutional-integration-lab/extracted/js_txt/canonical_fingerprint_service.js
 * Located in replay/ subsystem as per constitutional ownership boundaries (S.16 consolidation).
 * 
 * Requirements:
 * - deterministic canonicalization
 * - stable object ordering
 * - circular reference protection
 * - BigInt rejection
 * - Symbol rejection
 * - Function rejection
 * - NaN normalization
 * - scientific notation normalization
 * - byte-stable hashing
 * - SHA-256 cryptographic hashing
 * - runtime-neutral (no Buffer, no Node crypto)
 * 
 * CONSTITUTIONAL RULE: Delegates canonicalization to CanonicalJson (sole canonicalization authority)
 * CONSTITUTIONAL RULE: Uses CertificateAuthority for SHA-256 (sole hash authority)
 */

import { Fingerprint, CanonicalBytes } from './replay_types';
import { CanonicalJson } from './canonical_json';
import { CertificateAuthority } from './certificate_authority';
import { base64UrlEncode, base64UrlDecode, utf8Decode } from './byte_utils';

export class CanonicalHashAuthority {
  private readonly hashAlgorithm: string;
  private readonly hashVersion: string;
  private readonly canonicalizationVersion: string;

  constructor(
    hashAlgorithm: string = 'sha256',
    hashVersion: string = '1.0',
    canonicalizationVersion: string = 'v1'
  ) {
    this.hashAlgorithm = hashAlgorithm;
    this.hashVersion = hashVersion;
    this.canonicalizationVersion = canonicalizationVersion;
  }

  /**
   * Canonicalize an object to deterministic bytes
   * Constitutional rule: delegates to CanonicalJson (sole canonicalization authority)
   */
  canonicalize(obj: unknown): CanonicalBytes {
    const uint8Array = CanonicalJson.toUint8Array(obj);
    const bytes = base64UrlEncode(uint8Array);
    return {
      bytes,
      canonicalization_version: this.canonicalizationVersion
    };
  }

  /**
   * Compute fingerprint of canonical bytes
   */
  computeFingerprint(canonicalBytes: CanonicalBytes): Fingerprint {
    const hash = this.hashBytes(canonicalBytes.bytes);
    return {
      hash,
      hash_algorithm: this.hashAlgorithm,
      hash_version: this.hashVersion
    };
  }

  /**
   * Hash bytes using constitutional SHA-256 authority
   * Constitutional rule: delegates to CertificateAuthority (sole hash authority)
   */
  private hashBytes(base64UrlBytes: string): string {
    const uint8Array = base64UrlDecode(base64UrlBytes);
    const string = utf8Decode(uint8Array);
    const hash = CertificateAuthority['sha256'](string);
    return `${this.hashAlgorithm}:${hash}`;
  }
}
