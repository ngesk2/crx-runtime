const assert = require('assert');
const { AdapterCompiler } = require('../gateway/adapter_compiler');
const crypto = require('crypto');

/**
 * Replay Stress Tests
 * 
 * Phase 7 — Replay Stress
 * 
 * Automatically generates 100, 500, 1000, and 5000 adapters.
 * Verifies:
 * - Deterministic generation
 * - Deterministic witnesses
 * - Deterministic hashes
 * - Deterministic constitutional evaluation
 */

// Test fixtures
const TECHNOLOGY_MANIFEST = {
  manifest_id: 'tm_test_1',
  version: '1.0.0',
  artifact_store: {
    component: 'PostgreSQL',
    version: '17',
    checksum: 'sha256:abc123'
  },
  manifest_metadata: {
    created_at: '2026-01-01T00:00:00Z',
    created_by: 'TechnologyAuthority',
    frozen: true,
    hash: null,
    previous_manifest_hash: null,
    approval_reference: null
  }
};

TECHNOLOGY_MANIFEST.manifest_metadata.hash = crypto.createHash('sha256')
  .update(JSON.stringify(TECHNOLOGY_MANIFEST, Object.keys(TECHNOLOGY_MANIFEST).sort()))
  .digest('hex');

const CAPABILITY_CONTRACT = {
  capability_name: 'ArtifactStore',
  version: '1.0.0',
  methods: [
    {
      name: 'saveArtifact',
      input: { artifact: 'Artifact' },
      output: { artifact_id: 'string' },
      constraints: {
        immutability: true,
        determinism: true
      }
    },
    {
      name: 'getArtifact',
      input: { artifact_id: 'string' },
      output: { artifact: 'Artifact' },
      constraints: {
        determinism: true
      }
    }
  ],
  requirements: {
    immutability: true,
    determinism: true,
    replay_safety: true
  }
};

const ADAPTER_CONTRACT = {
  adapter_name: 'PostgreSQLArtifactStoreAdapter',
  vendor: 'PostgreSQL',
  version: '1.0.0'
};

const STRESS_LEVELS = [100, 500, 1000, 5000];

/**
 * Generate adapters for stress testing
 * @param {number} count - Number of adapters to generate
 * @returns {Array} Array of artifacts
 */
async function generateAdapters(count) {
  const artifacts = [];
  const compiler = new AdapterCompiler();

  for (let i = 0; i < count; i++) {
    const inputs = {
      technologyManifest: TECHNOLOGY_MANIFEST,
      adapterContract: ADAPTER_CONTRACT,
      capabilityContract: CAPABILITY_CONTRACT,
      vendor: 'PostgreSQL'
    };

    const artifact = await compiler.compileAdapter(inputs);
    artifacts.push(artifact);

    if ((i + 1) % 100 === 0) {
      console.log(`  Generated ${i + 1}/${count} adapters`);
    }
  }

  return artifacts;
}

/**
 * Verify deterministic generation
 * @param {Array} artifacts - Array of artifacts
 */
function verifyDeterministicGeneration(artifacts) {
  // All artifacts should have identical adapter source (same inputs)
  const firstSource = artifacts[0].adapter_source;
  const firstSourceHash = artifacts[0].adapter_source_hash;

  for (let i = 1; i < artifacts.length; i++) {
    assert.strictEqual(
      artifacts[i].adapter_source,
      firstSource,
      `Adapter ${i} source must be identical to first adapter`
    );
    assert.strictEqual(
      artifacts[i].adapter_source_hash,
      firstSourceHash,
      `Adapter ${i} source hash must be identical to first adapter`
    );
  }
}

/**
 * Verify deterministic witnesses
 * @param {Array} artifacts - Array of artifacts
 */
function verifyDeterministicWitnesses(artifacts) {
  // All artifacts should have identical witness hashes (same inputs)
  const firstWitnessHash = artifacts[0].witness_hash;

  for (let i = 1; i < artifacts.length; i++) {
    assert.strictEqual(
      artifacts[i].witness_hash,
      firstWitnessHash,
      `Adapter ${i} witness hash must be identical to first adapter`
    );
  }
}

/**
 * Verify deterministic hashes
 * @param {Array} artifacts - Array of artifacts
 */
function verifyDeterministicHashes(artifacts) {
  // All artifacts should have identical manifest hashes (same inputs)
  const firstManifestHash = artifacts[0].technology_manifest_hash;

  for (let i = 1; i < artifacts.length; i++) {
    assert.strictEqual(
      artifacts[i].technology_manifest_hash,
      firstManifestHash,
      `Adapter ${i} manifest hash must be identical to first adapter`
    );
  }
}

/**
 * Verify deterministic constitutional evaluation
 * @param {Array} artifacts - Array of artifacts
 */
function verifyDeterministicConstitutionalEvaluation(artifacts) {
  // All artifacts should have identical constitutional scores (same inputs)
  const firstScore = artifacts[0].constitutional_evaluation.weighted_score;
  const firstApproval = artifacts[0].approved;

  for (let i = 1; i < artifacts.length; i++) {
    assert.strictEqual(
      artifacts[i].constitutional_evaluation.weighted_score,
      firstScore,
      `Adapter ${i} constitutional score must be identical to first adapter`
    );
    assert.strictEqual(
      artifacts[i].approved,
      firstApproval,
      `Adapter ${i} approval must be identical to first adapter`
    );
  }
}

/**
 * Run stress test for a specific count
 * @param {number} count - Number of adapters to generate
 */
async function runStressTest(count) {
  console.log(`Running stress test with ${count} adapters...`);
  
  const startTime = Date.now();
  const artifacts = await generateAdapters(count);
  const duration = Date.now() - startTime;

  console.log(`  Generated ${count} adapters in ${duration}ms`);

  verifyDeterministicGeneration(artifacts);
  console.log(`✓ Deterministic generation verified (${count} adapters)`);

  verifyDeterministicWitnesses(artifacts);
  console.log(`✓ Deterministic witnesses verified (${count} adapters)`);

  verifyDeterministicHashes(artifacts);
  console.log(`✓ Deterministic hashes verified (${count} adapters)`);

  verifyDeterministicConstitutionalEvaluation(artifacts);
  console.log(`✓ Deterministic constitutional evaluation verified (${count} adapters)`);

  console.log(`Stress test ${count} adapters: PASSED\n`);
}

/**
 * Run all stress tests
 */
async function runAllTests() {
  console.log('=== Replay Stress Tests ===\n');

  try {
    for (const count of STRESS_LEVELS) {
      await runStressTest(count);
    }

    console.log('=== All Stress Tests PASSED ===');
    process.exit(0);
  } catch (error) {
    console.error('Test FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  generateAdapters,
  verifyDeterministicGeneration,
  verifyDeterministicWitnesses,
  verifyDeterministicHashes,
  verifyDeterministicConstitutionalEvaluation,
  runStressTest,
  runAllTests
};
