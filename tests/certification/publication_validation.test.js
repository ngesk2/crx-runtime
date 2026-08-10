/**
 * Phase 3.29 — Certification Test: Publication Validation
 * 
 * Asserts that uncertified artifacts are never published.
 * 
 * Test:
 * - Attempt to publish uncertified artifact
 * - Assert publication is rejected
 * - Publish certified artifact
 * - Assert publication succeeds
 */

const { PublicationAuthority } = require('../../gateway/publication_authority');
const { constitutionalTimeAuthority } = require('../../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../../ping-runtime/authorities/deterministic_id_authority');

/**
 * Test publication validation (uncertified artifact rejection)
 */
async function testPublicationValidation() {
  console.log('[Publication Validation Test] Starting publication validation check...\n');

  const publicationAuthority = new PublicationAuthority({
    constitutionalTimeAuthority,
    deterministicIdAuthority,
  });

  let allPassed = true;
  const results = [];

  // Test 1: Uncertified artifact should be rejected
  const uncertifiedArtifact = {
    artifact_id: 'uncertified-artifact-123',
    artifact_type: 'TestArtifact',
    data: { test: 'data' },
    created_at: constitutionalTimeAuthority.now(),
  };

  const noCertification = null; // No certification

  const uncertifiedContract = await publicationAuthority.publish(uncertifiedArtifact, noCertification);
  const publicationRecord = uncertifiedContract.artifacts[0];
  
  if (publicationRecord && !publicationRecord.published) {
    console.log('✅ Uncertified artifact rejection - PASSED');
    results.push({ test: 'uncertified artifact rejection', passed: true });
  } else {
    console.log('❌ Uncertified artifact rejection - FAILED (should reject)');
    allPassed = false;
    results.push({ test: 'uncertified artifact rejection', passed: false });
  }

  // Test 2: Expired certification should be rejected
  const expiredCertification = {
    certification_id: 'expired-cert-456',
    artifact_id: 'expired-artifact-456',
    certified: true,
    certified_at: constitutionalTimeAuthority.now() - 90000000, // > 24 hours ago
    checks: {},
    errors: [],
    warnings: [],
  };

  const expiredArtifact = {
    artifact_id: 'expired-artifact-456',
    artifact_type: 'TestArtifact',
    data: { test: 'data' },
    created_at: constitutionalTimeAuthority.now(),
  };

  const expiredContract = await publicationAuthority.publish(expiredArtifact, expiredCertification);
  const expiredRecord = expiredContract.artifacts[0];
  
  if (expiredRecord && !expiredRecord.published) {
    console.log('✅ Expired certification rejection - PASSED');
    results.push({ test: 'expired certification rejection', passed: true });
  } else {
    console.log('❌ Expired certification rejection - FAILED (should reject)');
    allPassed = false;
    results.push({ test: 'expired certification rejection', passed: false });
  }

  // Test 3: Invalid certification (not certified) should be rejected
  const invalidCertification = {
    certification_id: 'invalid-cert-789',
    artifact_id: 'invalid-artifact-789',
    certified: false, // Not certified
    certified_at: constitutionalTimeAuthority.now(),
    checks: { replay_deterministic: false },
    errors: ['Artifact failed verification'],
    warnings: [],
  };

  const invalidArtifact = {
    artifact_id: 'invalid-artifact-789',
    artifact_type: 'TestArtifact',
    data: { test: 'data' },
    created_at: constitutionalTimeAuthority.now(),
  };

  const invalidContract = await publicationAuthority.publish(invalidArtifact, invalidCertification);
  const invalidRecord = invalidContract.artifacts[0];
  
  if (invalidRecord && !invalidRecord.published) {
    console.log('✅ Invalid certification rejection - PASSED');
    results.push({ test: 'invalid certification rejection', passed: true });
  } else {
    console.log('❌ Invalid certification rejection - FAILED (should reject)');
    allPassed = false;
    results.push({ test: 'invalid certification rejection', passed: false });
  }

  // Test 4: Valid certification should allow publication
  const validCertification = {
    certification_id: 'valid-cert-012',
    artifact_id: 'valid-artifact-012',
    certified: true,
    certified_at: constitutionalTimeAuthority.now(),
    checks: {
      replay_deterministic: true,
      witness_valid: true,
      lineage_complete: true,
      provider_trusted: true,
      policy_approved: true,
      schema_approved: true,
    },
    errors: [],
    warnings: [],
  };

  const validArtifact = {
    artifact_id: 'valid-artifact-012',
    artifact_type: 'TestArtifact',
    data: { test: 'data' },
    policy_version: '1.0.0',
    created_at: constitutionalTimeAuthority.now(),
  };

  const validContract = await publicationAuthority.publish(validArtifact, validCertification);
  const validRecord = validContract.artifacts[0];
  
  if (validRecord && validRecord.published) {
    console.log('✅ Valid certification publication - PASSED');
    results.push({ test: 'valid certification publication', passed: true });
  } else {
    console.log('❌ Valid certification publication - FAILED (should publish)');
    allPassed = false;
    results.push({ test: 'valid certification publication', passed: false });
  }

  // Test 5: Publication record structure validation
  const structureArtifact = {
    artifact_id: 'structure-test-345',
    artifact_type: 'TestArtifact',
    data: { test: 'data' },
    policy_version: '1.0.0',
    created_at: constitutionalTimeAuthority.now(),
  };

  const structureCertification = {
    certification_id: 'structure-cert-345',
    artifact_id: 'structure-test-345',
    certified: true,
    certified_at: constitutionalTimeAuthority.now(),
    checks: {},
    errors: [],
    warnings: [],
  };

  const structureContract = await publicationAuthority.publish(structureArtifact, structureCertification);
  const structureRecord = structureContract.artifacts[0];
  
  const hasRequiredFields = structureRecord &&
    structureRecord.publication_id &&
    structureRecord.artifact_id &&
    structureRecord.published !== undefined &&
    structureRecord.checks &&
    Array.isArray(structureRecord.errors) &&
    Array.isArray(structureRecord.warnings) &&
    structureRecord.published_at;

  if (hasRequiredFields) {
    console.log('✅ Publication record structure - PASSED');
    results.push({ test: 'publication record structure', passed: true });
  } else {
    console.log('❌ Publication record structure - FAILED');
    allPassed = false;
    results.push({ test: 'publication record structure', passed: false });
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ Publication Validation Test: PASSED');
    console.log('Publication authority properly validates and rejects uncertified artifacts.');
  } else {
    console.log('❌ Publication Validation Test: FAILED');
    console.log('Publication validation did not work as expected.');
  }
  console.log('='.repeat(50));

  return {
    passed: allPassed,
    results: results,
  };
}

// Run test if executed directly
if (require.main === module) {
  const result = testPublicationValidation();
  process.exit(result.passed ? 0 : 1);
}

module.exports = { testPublicationValidation };
