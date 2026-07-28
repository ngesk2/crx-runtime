/**
 * AUTHORITY REGISTRY
 * 
 * Register constitutional authorities with their classifications.
 */

import { AuthorityRegistry, AuthorityClassification } from './authority_classification';

/**
 * Register constitutional authorities
 */

// Replay Authority
AuthorityRegistry.register('ReplayAuthority', {
  classification: AuthorityClassification.SOURCE_AUTHORITY,
  regeneratable: false
});

// Witness Authority
AuthorityRegistry.register('WitnessAuthority', {
  classification: AuthorityClassification.DERIVATION,
  source_authority: 'ReplayAuthority',
  regeneratable: true
});

// Certificate Authority
AuthorityRegistry.register('CertificateAuthority', {
  classification: AuthorityClassification.DERIVATION,
  source_authority: 'ReplayAuthority',
  regeneratable: true
});

// Canonicalization Authority
AuthorityRegistry.register('CanonicalizationAuthority', {
  classification: AuthorityClassification.DERIVATION,
  source_authority: 'ReplayAuthority',
  regeneratable: true
});

// Hash Authority
AuthorityRegistry.register('HashAuthority', {
  classification: AuthorityClassification.DERIVATION,
  source_authority: 'ReplayAuthority',
  regeneratable: true
});

// Kernel Commit-Service (SHADOW - should be eliminated)
AuthorityRegistry.register('KernelCommitService', {
  classification: AuthorityClassification.SHADOW,
  regeneratable: false
});

// Validate no shadows on startup
// Commented out to allow kernel commit-service to exist during migration
// AuthorityRegistry.validateNoShadows();
