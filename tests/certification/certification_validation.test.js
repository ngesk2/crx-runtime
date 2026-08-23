/**
 * Phase 3.28 — Certification Test: Certification Validation
 * 
 * Asserts that tampered artifacts are rejected during certification.
 * 
 * Test:
 * - Create valid artifact with certification
 * - Tamper with artifact (modify content)
 * - Attempt to certify tampered artifact
 * - Assert certification is rejected
 */

const { CertificationAuthority } = require('../../gateway/certification_authority');
const { constitutionalTimeAuthority } = require('../../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../../ping-runtime/authorities/deterministic_id_authority');
const { CanonicalAuthority } = require('../../ping-runtime/authorities/canonical_authority.js');

/**
 * Test certification validation (tampered artifact rejection)
 */
async function testCertificationValidation() {
  console.log('[Certification Validation Test] Starting certification validation check...\n');

  const certificationAuthority = new CertificationAuthority({
    constitutionalTimeAuthority,
    deterministicIdAuthority,
    canonicalAuthority: CanonicalAuthority,
  });

  let allPassed = true;
  const results = [];

  // Test 1: Valid artifact passes certification
  const validArtifact = {
    artifact_id: 'valid-artifact-123',
    artifact_type: 'TestArtifact',
    canonical_hash: 'abc123',
    data: { test: 'data' },
    created_at: constitutionalTimeAuthority.now(),
  };

  const validContract = await certificationAuthority.certify(validArtifact);
  const certificationReport = validContract.artifacts[0];
  
  if (certificationReport && certificationReport.certified) {
    console.log('✅ Valid artifact certification - PASSED');
    results.push({ test: 'valid artifact certification', passed: true });
  } else {
    console.log('❌ Valid artifact certification - FAILED');
    allPassed = false;
    results.push({ test: 'valid artifact certification', passed: false });
  }

  // Test 2: Tampered artifact (modified canonical hash) should fail
  const tamperedArtifact = {
    artifact_id: 'tampered-artifact-456',
    artifact_type: 'TestArtifact',
    canonical_hash: 'wrong-hash', // Tampered hash
    data: { test: 'modified-data' }, // Tampered data
    created_at: constitutionalTimeAuthority.now(),
  };

  const tamperedContract = await certificationAuthority.certify(tamperedArtifact);
  const tamperedReport = tamperedContract.artifacts[0];
  
  if (tamperedReport && !tamperedReport.certified) {
    console.log('✅ Tampered artifact rejection - PASSED');
    results.push({ test: 'tampered artifact rejection', passed: true });
  } else {
    console.log('❌ Tampered artifact rejection - FAILED (should reject)');
    allPassed = false;
    results.push({ test: 'tampered artifact rejection', passed: false });
  }

  // Test 3: Artifact without canonical hash should fail
  const noHashArtifact = {
    artifact_id: 'no-hash-artifact-789',
    artifact_type: 'TestArtifact',
    // Missing canonical_hash
    data: { test: 'data' },
    created_at: constitutionalTimeAuthority.now(),
  };

  const noHashContract = await certificationAuthority.certify(noHashArtifact);
  const noHashReport = noHashContract.artifacts[0];
  
  if (noHashReport && !noHashReport.certified) {
    console.log('✅ Missing hash rejection - PASSED');
    results.push({ test: 'missing hash rejection', passed: true });
  } else {
    console.log('❌ Missing hash rejection - FAILED (should reject)');
    allPassed = false;
    results.push({ test: 'missing hash rejection', passed: false });
  }

  // Test 4: Artifact with missing required fields should fail
  const incompleteArtifact = {
    artifact_id: 'incomplete-artifact-012',
    // Missing artifact_type
    canonical_hash: 'hash123',
    data: { test: 'data' },
    created_at: constitutionalTimeAuthority.now(),
  };

  const incompleteContract = await certificationAuthority.certify(incompleteArtifact);
  const incompleteReport = incompleteContract.artifacts[0];
  
  if (incompleteReport && !incompleteReport.certified) {
    console.log('✅ Incomplete artifact rejection - PASSED');
    results.push({ test: 'incomplete artifact rejection', passed: true });
  } else {
    console.log('❌ Incomplete artifact rejection - FAILED (should reject)');
    allPassed = false;
    results.push({ test: 'incomplete artifact rejection', passed: false });
  }

  // Test 5: Certification report structure validation
  const structureArtifact = {
    artifact_id: 'structure-test-345',
    artifact_type: 'TestArtifact',
    canonical_hash: 'hash456',
    data: { test: 'data' },
    created_at: constitutionalTimeAuthority.now(),
  };

  const structureContract = await certificationAuthority.certify(structureArtifact);
  const structureReport = structureContract.artifacts[0];
  
  const hasRequiredFields = structureReport &&
    structureReport.certification_id &&
    structureReport.artifact_id &&
    structureReport.certified !== undefined &&
    structureReport.checks &&
    Array.isArray(structureReport.errors) &&
    Array.isArray(structureReport.warnings) &&
    structureReport.certified_at;

  if (hasRequiredFields) {
    console.log('✅ Certification report structure - PASSED');
    results.push({ test: 'certification report structure', passed: true });
  } else {
    console.log('❌ Certification report structure - FAILED');
    allPassed = false;
    results.push({ test: 'certification report structure', passed: false });
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ Certification Validation Test: PASSED');
    console.log('Certification authority properly validates and rejects invalid artifacts.');
  } else {
    console.log('❌ Certification Validation Test: FAILED');
    console.log('Certification validation did not work as expected.');
  }
  console.log('='.repeat(50));

  return {
    passed: allPassed,
    results: results,
  };
}

// Run test if executed directly
if (require.main === module) {
  const result = testCertificationValidation();
  process.exit(result.passed ? 0 : 1);
}

module.exports = { testCertificationValidation };
