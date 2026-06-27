/**
 * CANONICAL CERTIFICATE
 * 
 * Canonical certificate serialization for certificate commitment.
 * 
 * Requirements:
 * - deterministic field ordering
 * - canonical UTF-8 encoding
 * - stable serialization
 * - no undefined fields
 * - no runtime metadata
 * 
 * PHASE 7: CERTIFICATE COMMITMENT
 * Allows certificates to be signed, transported, notarized, deduplicated, referenced, federated.
 */

import { ReplayCertificate } from './replay_types';
import { CanonicalJson } from './canonical_json';
import { utf8Encode } from './byte_utils';

/**
 * Canonical Certificate Serializer
 * 
 * Provides deterministic certificate serialization for commitment computation.
 * Ensures certificates can be:
 * - signed
 * - transported
 * - notarized
 * - deduplicated
 * - referenced
 * - federated
 */
export class CanonicalCertificate {
  /**
   * Serialize certificate for commitment computation
   * 
   * Removes certificate_commitment field before serialization
   * Ensures deterministic field ordering
   * Removes undefined fields
   * Removes runtime metadata
   */
  static serializeForCommitment(certificate: ReplayCertificate): string {
    const certificateWithoutCommitment: Omit<ReplayCertificate, 'certificate_commitment'> = {
      witness_root: certificate.witness_root,
      replay_commitment: certificate.replay_commitment,
      event_commitment: certificate.event_commitment,
      derivation_graph_commitment: certificate.derivation_graph_commitment,
      state_commitment: certificate.state_commitment,
      violation_commitment: certificate.violation_commitment,
      constitutional_law_commitment: certificate.constitutional_law_commitment,
      canonicalization_commitment: certificate.canonicalization_commitment,
      hash_authority_commitment: certificate.hash_authority_commitment,
      witness_law_version: certificate.witness_law_version,
      replay_version: certificate.replay_version,
      canonicalization_version: certificate.canonicalization_version,
      hash_version: certificate.hash_version,
      witness_leaf_count: certificate.witness_leaf_count,
      witness_tree_height: certificate.witness_tree_height
    };

    // Remove undefined fields
    const cleaned = this.removeUndefinedFields(certificateWithoutCommitment);

    // Canonicalize with deterministic field ordering
    return CanonicalJson.canonicalize(cleaned);
  }

  /**
   * Serialize certificate to Uint8Array
   * Uses canonical UTF-8 encoding
   */
  static toUint8Array(certificate: ReplayCertificate): Uint8Array {
    const canonical = this.serializeForCommitment(certificate);
    return utf8Encode(canonical);
  }

  /**
   * Remove undefined fields from object
   * Ensures no undefined fields in serialization
   */
  private static removeUndefinedFields<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedFields(item)) as T;
    }

    const result: any = {};
    for (const key of Object.keys(obj).sort()) {
      const value = (obj as any)[key];
      if (value !== undefined) {
        result[key] = this.removeUndefinedFields(value);
      }
    }

    return result;
  }

  /**
   * Validate certificate structure
   * Ensures all required fields are present
   */
  static validateCertificate(certificate: ReplayCertificate): boolean {
    const requiredFields: (keyof ReplayCertificate)[] = [
      'witness_root',
      'replay_commitment',
      'event_commitment',
      'derivation_graph_commitment',
      'state_commitment',
      'violation_commitment',
      'constitutional_law_commitment',
      'canonicalization_commitment',
      'hash_authority_commitment',
      'witness_law_version',
      'replay_version',
      'canonicalization_version',
      'hash_version',
      'witness_leaf_count',
      'witness_tree_height',
      'certificate_commitment'
    ];

    for (const field of requiredFields) {
      if (certificate[field] === undefined || certificate[field] === null) {
        return false;
      }
    }

    return true;
  }
}
