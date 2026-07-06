const assert = require('assert');
const { AdapterCompiler } = require('../gateway/adapter_compiler');
const crypto = require('crypto');

/**
 * Multi Vendor Validation Tests
 * 
 * Phase 4 — Multi Vendor Validation
 * 
 * Runs the identical pipeline for PostgreSQL, EventStoreDB, Ollama, and Qdrant.
 * No conditional orchestration - only vendor-specific CodeGenerator implementations differ.
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

const VENDORS = ['PostgreSQL', 'EventStoreDB', 'Ollama', 'Qdrant'];

/**
 * Test: Multi Vendor Generation
 * 
 * Runs the identical pipeline for all vendors and verifies:
 * - Each vendor generates a valid adapter
 * - Each adapter has a unique source (vendor-specific)
 * - Each adapter has a valid witness
 * - Each adapter passes constitutional evaluation
 */
async function testMultiVendorGeneration() {
  console.log('Running Multi Vendor Generation Test...');
  
  const artifacts = {};

  for (const vendor of VENDORS) {
    console.log(`  Generating adapter for ${vendor}...`);
    
    const compiler = new AdapterCompiler();
    const adapterContract = {
      adapter_name: `${vendor}ArtifactStoreAdapter`,
      vendor: vendor,
      version: '1.0.0'
    };

    const inputs = {
      technologyManifest: TECHNOLOGY_MANIFEST,
      adapterContract: adapterContract,
      capabilityContract: CAPABILITY_CONTRACT,
      vendor: vendor
    };

    const artifact = await compiler.compileAdapter(inputs);
    artifacts[vendor] = artifact;

    // Verify artifact structure
    assert.ok(artifact.adapter, 'Adapter must exist');
    assert.ok(artifact.adapter_source, 'Adapter source must exist');
    assert.ok(artifact.witness, 'Witness must exist');
    assert.ok(artifact.constitutional_evaluation, 'Constitutional evaluation must exist');
    assert.ok(typeof artifact.approved === 'boolean', 'Approval must be boolean');
    console.log(`  ✓ ${vendor} adapter generated successfully`);
  }

  // Verify each vendor has unique adapter source
  const sources = Object.values(artifacts).map(a => a.adapter_source);
  const uniqueSources = new Set(sources);
  assert.strictEqual(
    uniqueSources.size,
    VENDORS.length,
    'Each vendor must have unique adapter source'
  );
  console.log('✓ Each vendor has unique adapter source');

  // Verify all adapters are approved
  for (const [vendor, artifact] of Object.entries(artifacts)) {
    assert.strictEqual(
      artifact.approved,
      true,
      `${vendor} adapter must be approved`
    );
  }
  console.log('✓ All adapters approved');

  // Verify all adapters have valid witnesses
  for (const [vendor, artifact] of Object.entries(artifacts)) {
    assert.ok(
      artifact.witness.compilation_witness.compilation_success,
      `${vendor} witness compilation must succeed`
    );
    assert.ok(
      artifact.witness.validation_witness.validation_success,
      `${vendor} witness validation must succeed`
    );
  }
  console.log('✓ All adapters have valid witnesses');

  console.log('Multi Vendor Generation Test: PASSED\n');
}

/**
 * Test: Vendor Deterministic Replay
 * 
 * Verifies that each vendor produces deterministic results
 */
async function testVendorDeterministicReplay() {
  console.log('Running Vendor Deterministic Replay Test...');
  
  for (const vendor of VENDORS) {
    console.log(`  Testing ${vendor} deterministic replay...`);
    
    const compiler1 = new AdapterCompiler();
    const compiler2 = new AdapterCompiler();

    const adapterContract = {
      adapter_name: `${vendor}ArtifactStoreAdapter`,
      vendor: vendor,
      version: '1.0.0'
    };

    const inputs = {
      technologyManifest: TECHNOLOGY_MANIFEST,
      adapterContract: adapterContract,
      capabilityContract: CAPABILITY_CONTRACT,
      vendor: vendor
    };

    const artifact1 = await compiler1.compileAdapter(inputs);
    const artifact2 = await compiler2.compileAdapter(inputs);

    // Verify adapter source identical
    assert.strictEqual(
      artifact1.adapter_source,
      artifact2.adapter_source,
      `${vendor} adapter source must be identical`
    );

    // Verify adapter source hash identical
    assert.strictEqual(
      artifact1.adapter_source_hash,
      artifact2.adapter_source_hash,
      `${vendor} adapter source hash must be identical`
    );

    // Verify witness hash identical
    assert.strictEqual(
      artifact1.witness_hash,
      artifact2.witness_hash,
      `${vendor} witness hash must be identical`
    );

    // Verify constitutional score identical
    assert.strictEqual(
      artifact1.constitutional_evaluation.weighted_score,
      artifact2.constitutional_evaluation.weighted_score,
      `${vendor} constitutional score must be identical`
    );

    console.log(`  ✓ ${vendor} deterministic replay verified`);
  }

  console.log('Vendor Deterministic Replay Test: PASSED\n');
}

/**
 * Test: Vendor Isolation
 * 
 * Verifies that vendor-specific implementations don't interfere with each other
 */
async function testVendorIsolation() {
  console.log('Running Vendor Isolation Test...');
  
  const compiler = new AdapterCompiler();
  const artifacts = {};

  // Generate all adapters with the same compiler instance
  for (const vendor of VENDORS) {
    const adapterContract = {
      adapter_name: `${vendor}ArtifactStoreAdapter`,
      vendor: vendor,
      version: '1.0.0'
    };

    const inputs = {
      technologyManifest: TECHNOLOGY_MANIFEST,
      adapterContract: adapterContract,
      capabilityContract: CAPABILITY_CONTRACT,
      vendor: vendor
    };

    artifacts[vendor] = await compiler.compileAdapter(inputs);
  }

  // Verify each adapter has the correct vendor
  for (const [vendor, artifact] of Object.entries(artifacts)) {
    assert.strictEqual(
      artifact.adapter.vendor,
      vendor,
      `Adapter vendor must match requested vendor`
    );
  }
  console.log('✓ Each adapter has correct vendor');

  // Verify adapter names are vendor-specific
  for (const [vendor, artifact] of Object.entries(artifacts)) {
    assert.ok(
      artifact.adapter.adapter_name.includes(vendor),
      `Adapter name must include vendor name`
    );
  }
  console.log('✓ Adapter names are vendor-specific');

  console.log('Vendor Isolation Test: PASSED\n');
}

/**
 * Test: Vendor Constitutional Scores
 * 
 * Verifies that all vendors receive identical constitutional scores
 * (since the pipeline is identical, only implementation differs)
 */
async function testVendorConstitutionalScores() {
  console.log('Running Vendor Constitutional Scores Test...');
  
  const compiler = new AdapterCompiler();
  const scores = {};

  for (const vendor of VENDORS) {
    const adapterContract = {
      adapter_name: `${vendor}ArtifactStoreAdapter`,
      vendor: vendor,
      version: '1.0.0'
    };

    const inputs = {
      technologyManifest: TECHNOLOGY_MANIFEST,
      adapterContract: adapterContract,
      capabilityContract: CAPABILITY_CONTRACT,
      vendor: vendor
    };

    const artifact = await compiler.compileAdapter(inputs);
    scores[vendor] = artifact.constitutional_evaluation.weighted_score;
  }

  // Verify all scores are identical
  const scoreValues = Object.values(scores);
  const firstScore = scoreValues[0];
  for (const score of scoreValues) {
    assert.strictEqual(
      score,
      firstScore,
      'All vendors must receive identical constitutional scores'
    );
  }
  console.log('✓ All vendors receive identical constitutional scores');

  console.log('Vendor Constitutional Scores Test: PASSED\n');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('=== Multi Vendor Validation Tests ===\n');

  try {
    await testMultiVendorGeneration();
    await testVendorDeterministicReplay();
    await testVendorIsolation();
    await testVendorConstitutionalScores();

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
  testMultiVendorGeneration,
  testVendorDeterministicReplay,
  testVendorIsolation,
  testVendorConstitutionalScores,
  runAllTests
};
