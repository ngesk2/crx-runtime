/**
 * CONSTITUTIONAL LAW MANIFEST
 * 
 * Semantic law manifest for constitutional law commitment.
 * 
 * Requirements:
 * - Semantic law definitions (not raw source files)
 * - Canonical JSON serialization
 * - Deterministic ordering
 * - No runtime dependencies
 * 
 * PHASE 3: CONSTITUTIONAL LAW COMMITMENT
 * Witness root must commit to constitutional law itself.
 */

import { FailureCode } from './deterministic_failure';

/**
 * Semantic law manifest structure
 * This captures the actual constitutional laws, not implementation details
 */
export interface ConstitutionalLawManifest {
  // Invariant definitions (semantic, not code)
  invariant_definitions: InvariantLaw[];
  
  // Replay laws (semantic rules for replay execution)
  replay_rules: ReplayRule[];
  
  // Witness laws (semantic rules for witness construction)
  witness_rules: WitnessRule[];
  
  // Failure laws (semantic failure code definitions)
  failure_codes: FailureCodeDefinition[];
  
  // Authority hierarchy (semantic authority structure)
  authority_hierarchy: AuthorityRule[];
  
  // Canonicalization laws (semantic canonicalization rules)
  canonicalization_rules: CanonicalizationRule[];
  
  // Merkle construction laws (semantic Merkle tree rules)
  merkle_construction_rules: MerkleConstructionRule[];
}

/**
 * Invariant law definition
 */
export interface InvariantLaw {
  invariant_id: string;
  invariant_type: string;
  semantic_description: string;
}

/**
 * Replay rule definition
 */
export interface ReplayRule {
  rule_id: string;
  rule_type: string;
  semantic_description: string;
}

/**
 * Witness rule definition
 */
export interface WitnessRule {
  rule_id: string;
  rule_type: string;
  semantic_description: string;
}

/**
 * Failure code definition
 */
export interface FailureCodeDefinition {
  code: string;
  category: string;
  semantic_description: string;
}

/**
 * Authority rule definition
 */
export interface AuthorityRule {
  authority_id: string;
  authority_type: string;
  semantic_description: string;
}

/**
 * Canonicalization rule definition
 */
export interface CanonicalizationRule {
  rule_id: string;
  rule_type: string;
  semantic_description: string;
}

/**
 * Merkle construction rule definition
 */
export interface MerkleConstructionRule {
  rule_id: string;
  rule_type: string;
  semantic_description: string;
}

/**
 * Current constitutional law manifest
 * This is the semantic definition of CRX constitutional laws
 */
export const CURRENT_CONSTITUTIONAL_LAW_MANIFEST: ConstitutionalLawManifest = {
  invariant_definitions: [
    {
      invariant_id: 'ARTIFACT_HASH_VALID',
      invariant_type: 'VALIDATION',
      semantic_description: 'All artifacts must have valid SHA-256 hashes'
    },
    {
      invariant_id: 'LINEAGE_ACYCLIC',
      invariant_type: 'VALIDATION',
      semantic_description: 'Lineage graph must be acyclic (no circular dependencies)'
    },
    {
      invariant_id: 'LINEAGE_PARENT_EXISTS',
      invariant_type: 'VALIDATION',
      semantic_description: 'All lineage parent artifacts must exist in state'
    },
    {
      invariant_id: 'STATE_VERSION_CONSISTENT',
      invariant_type: 'VALIDATION',
      semantic_description: 'State version must be consistent and non-empty'
    }
  ],
  
  replay_rules: [
    {
      rule_id: 'DETERMINISTIC_EVENT_ORDERING',
      rule_type: 'EXECUTION',
      semantic_description: 'Events must be processed in deterministic order by event_id'
    },
    {
      rule_id: 'IMMUTABLE_EVENT_STREAM',
      rule_type: 'IMMUTABILITY',
      semantic_description: 'Event stream must be immutable after creation'
    },
    {
      rule_id: 'BRANDED_TYPE_ENFORCEMENT',
      rule_type: 'TYPE_SAFETY',
      semantic_description: 'Event IDs and Artifact IDs must use branded types'
    }
  ],
  
  witness_rules: [
    {
      rule_id: 'DETERMINISTIC_LEAF_ORDERING',
      rule_type: 'CONSTRUCTION',
      semantic_description: 'Witness leaves must be ordered deterministically by leaf_id'
    },
    {
      rule_id: 'MERKLE_SHA256_DOMAIN_SEPARATION',
      rule_type: 'HASHING',
      semantic_description: 'Merkle tree uses SHA-256 with domain separation (leaf vs parent)'
    },
    {
      rule_id: 'ODD_NODE_DUPLICATION',
      rule_type: 'CONSTRUCTION',
      semantic_description: 'Odd node count handled by duplicating last node'
    }
  ],
  
  failure_codes: Object.values(FailureCode).map(code => ({
    code,
    category: 'DETERMINISTIC_FAILURE',
    semantic_description: `Deterministic failure code: ${code}`
  })),
  
  authority_hierarchy: [
    {
      authority_id: 'WITNESS_ROOT_AUTHORITY',
      authority_type: 'REPLAY_IDENTITY',
      semantic_description: 'Witness root is the sole replay identity authority'
    },
    {
      authority_id: 'CERTIFICATE_AUTHORITY',
      authority_type: 'COMMITMENT',
      semantic_description: 'Certificate authority computes all commitments'
    },
    {
      authority_id: 'HASH_AUTHORITY',
      authority_type: 'CRYPTOGRAPHIC',
      semantic_description: 'SHA-256 is the sole hash algorithm authority'
    }
  ],
  
  canonicalization_rules: [
    {
      rule_id: 'RFC_8785_CANONICAL_JSON',
      rule_type: 'SERIALIZATION',
      semantic_description: 'JSON canonicalization follows RFC 8785 specification'
    },
    {
      rule_id: 'DETERMINISTIC_FIELD_ORDERING',
      rule_type: 'SERIALIZATION',
      semantic_description: 'Object fields must be sorted lexicographically'
    },
    {
      rule_id: 'NO_UNDEFINED_FIELDS',
      rule_type: 'SERIALIZATION',
      semantic_description: 'Undefined fields must be omitted from serialization'
    }
  ],
  
  merkle_construction_rules: [
    {
      rule_id: 'MAX_LEAVES_LIMIT',
      rule_type: 'EXECUTION_LIMIT',
      semantic_description: 'Maximum 1,000,000 leaves per Merkle tree'
    },
    {
      rule_id: 'DUPLICATE_LEAF_REJECTION',
      rule_type: 'VALIDATION',
      semantic_description: 'Duplicate leaf IDs must be rejected'
    },
    {
      rule_id: 'SHA256_WITH_DOMAIN_PREFIX',
      rule_type: 'HASHING',
      semantic_description: 'SHA-256 hashes include domain prefix byte (0x00 for leaf, 0x01 for parent)'
    }
  ]
};

/**
 * Get current constitutional law manifest
 */
export function getConstitutionalLawManifest(): ConstitutionalLawManifest {
  return CURRENT_CONSTITUTIONAL_LAW_MANIFEST;
}
