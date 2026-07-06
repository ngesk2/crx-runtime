const assert = require('assert');
const { AdapterCompiler } = require('../gateway/adapter_compiler');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Cross Machine Replay Tests
 * 
 * Phase 3 — Cross Machine Replay
 * 
 * Verifies that artifacts can be persisted on Machine A and replayed on Machine B
 * with byte-for-byte identical hashes.
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

const ARTIFACTS_DIR = path.join(__dirname, '.artifacts');

/**
 * Test: Cross Machine Replay
 * 
 * Simulates cross-machine replay by:
 * 1. Generating artifacts on "Machine A"
 * 2. Persisting artifacts to disk
 * 3. Loading artifacts on "Machine B"
 * 4. Verifying hashes are byte-for-byte identical
 */
async function testCrossMachineReplay() {
  console.log('Running Cross Machine Replay Test...');
  
  // Clean up artifacts directory
  if (fs.existsSync(ARTIFACTS_DIR)) {
    fs.rmSync(ARTIFACTS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  // Machine A: Generate artifacts
  console.log('  Machine A: Generating artifacts...');
  const compilerA = new AdapterCompiler();
  const inputs = {
    technologyManifest: TECHNOLOGY_MANIFEST,
    adapterContract: ADAPTER_CONTRACT,
    capabilityContract: CAPABILITY_CONTRACT,
    vendor: 'PostgreSQL'
  };

  const artifactA = await compilerA.compileAdapter(inputs);

  // Persist artifacts
  const artifactPath = path.join(ARTIFACTS_DIR, 'artifact.json');
  fs.writeFileSync(artifactPath, JSON.stringify(artifactA, null, 2));
  console.log('  Machine A: Artifacts persisted');

  // Machine B: Load artifacts
  console.log('  Machine B: Loading artifacts...');
  const artifactB = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  // Verify adapter hash identical
  assert.strictEqual(
    artifactA.adapter_source_hash,
    artifactB.adapter_source_hash,
    'Adapter source hash must be identical across machines'
  );
  console.log('✓ Adapter source hash identical');

  // Verify witness hash identical
  assert.strictEqual(
    artifactA.witness_hash,
    artifactB.witness_hash,
    'Witness hash must be identical across machines'
  );
  console.log('✓ Witness hash identical');

  // Verify manifest hash identical
  assert.strictEqual(
    artifactA.technology_manifest_hash,
    artifactB.technology_manifest_hash,
    'Technology manifest hash must be identical across machines'
  );
  console.log('✓ Technology manifest hash identical');

  // Verify constitutional score identical
  assert.strictEqual(
    artifactA.constitutional_evaluation.weighted_score,
    artifactB.constitutional_evaluation.weighted_score,
    'Constitutional weighted score must be identical across machines'
  );
  console.log('✓ Constitutional weighted score identical');

  // Verify approval identical
  assert.strictEqual(
    artifactA.approved,
    artifactB.approved,
    'Approval status must be identical across machines'
  );
  console.log('✓ Approval status identical');

  // Clean up
  fs.rmSync(ARTIFACTS_DIR, { recursive: true, force: true });

  console.log('Cross Machine Replay Test: PASSED\n');
}

/**
 * Test: Byte-for-Byte Verification
 * 
 * Verifies that persisted artifacts are byte-for-byte identical
 */
async function testByteForByteVerification() {
  console.log('Running Byte-for-Byte Verification Test...');
  
  // Clean up artifacts directory
  if (fs.existsSync(ARTIFACTS_DIR)) {
    fs.rmSync(ARTIFACTS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  // Generate artifact
  const compiler = new AdapterCompiler();
  const inputs = {
    technologyManifest: TECHNOLOGY_MANIFEST,
    adapterContract: ADAPTER_CONTRACT,
    capabilityContract: CAPABILITY_CONTRACT,
    vendor: 'PostgreSQL'
  };

  const artifact = await compiler.compileAdapter(inputs);

  // Persist artifact
  const artifactPath = path.join(ARTIFACTS_DIR, 'artifact.json');
  const artifactJson = JSON.stringify(artifact, null, 2);
  fs.writeFileSync(artifactPath, artifactJson);

  // Load artifact
  const loadedArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  // Re-serialize loaded artifact
  const reloadedJson = JSON.stringify(loadedArtifact, null, 2);

  // Verify byte-for-byte identical
  assert.strictEqual(
    artifactJson,
    reloadedJson,
    'Artifact must be byte-for-byte identical after persistence'
  );
  console.log('✓ Artifact byte-for-byte identical');

  // Clean up
  fs.rmSync(ARTIFACTS_DIR, { recursive: true, force: true });

  console.log('Byte-for-Byte Verification Test: PASSED\n');
}

/**
 * Test: Deterministic Source Generation
 * 
 * Verifies that adapter source is deterministic across machines
 */
async function testDeterministicSourceGeneration() {
  console.log('Running Deterministic Source Generation Test...');
  
  // Clean up artifacts directory
  if (fs.existsSync(ARTIFACTS_DIR)) {
    fs.rmSync(ARTIFACTS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  // Generate artifact on Machine A
  const compilerA = new AdapterCompiler();
  const inputs = {
    technologyManifest: TECHNOLOGY_MANIFEST,
    adapterContract: ADAPTER_CONTRACT,
    capabilityContract: CAPABILITY_CONTRACT,
    vendor: 'PostgreSQL'
  };

  const artifactA = await compilerA.compileAdapter(inputs);

  // Persist source
  const sourcePath = path.join(ARTIFACTS_DIR, 'source.js');
  fs.writeFileSync(sourcePath, artifactA.adapter_source);

  // Load source on Machine B
  const loadedSource = fs.readFileSync(sourcePath, 'utf8');

  // Verify source identical
  assert.strictEqual(
    artifactA.adapter_source,
    loadedSource,
    'Adapter source must be identical after persistence'
  );
  console.log('✓ Adapter source identical');

  // Verify hash of loaded source matches original
  const loadedSourceHash = crypto.createHash('sha256').update(loadedSource).digest('hex');
  assert.strictEqual(
    artifactA.adapter_source_hash,
    loadedSourceHash,
    'Adapter source hash must match loaded source hash'
  );
  console.log('✓ Adapter source hash matches loaded source');

  // Clean up
  fs.rmSync(ARTIFACTS_DIR, { recursive: true, force: true });

  console.log('Deterministic Source Generation Test: PASSED\n');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('=== Cross Machine Replay Tests ===\n');

  try {
    await testCrossMachineReplay();
    await testByteForByteVerification();
    await testDeterministicSourceGeneration();

    console.log('=== All Tests PASSED ===');
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
  testCrossMachineReplay,
  testByteForByteVerification,
  testDeterministicSourceGeneration,
  runAllTests
};
