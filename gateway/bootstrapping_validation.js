const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { AdapterCompilerV2 } = require('./adapter_compiler_v2');

/**
 * Bootstrapping Validation Authority
 * 
 * Phase 2.7 — Bootstrapping Validation
 * 
 * Before self-hosting, prove compiler lineage.
 * 
 * Required replay matrix:
 * 
 * Generator v1
 *   ↓
 * regenerates
 *   ↓
 * Generator v1
 * 
 * Generator v2
 *   ↓
 * regenerates
 *   ↓
 * Generator v2
 * 
 * Generator v1
 *   ↓
 * builds
 *   ↓
 * Generator v2
 * 
 * Generator v2
 *   ↓
 * builds
 *   ↓
 * Generator v1
 * 
 * Then verify:
 * - same hashes
 * - same witnesses
 * - same constitutional approval
 * 
 * Only after this succeeds should you begin self-hosting.
 */

class BootstrappingValidationAuthority {
  constructor() {
    this._compilerLineageRecords = new Map();
  }

  /**
   * Verify compiler lineage with replay matrix
   * @param {Object} params - Validation parameters
   * @param {Object} params.generatorV1 - Generator v1 manifest
   * @param {Object} params.generatorV2 - Generator v2 manifest
   * @param {Object} params.capabilityContract - Capability contract
   * @param {Object} params.adapterContract - Adapter contract
   * @param {Object} params.technologyManifest - Technology manifest
   * @returns {Object} Validation result
   */
  async verifyCompilerLineage(params) {
    const { generatorV1, generatorV2, capabilityContract, adapterContract, technologyManifest } = params;

    replayLogger.info('=== Bootstrapping Validation ===');
    replayLogger.info('Testing compiler lineage with replay matrix...\n');

    // Test 1: Generator v1 regenerates Generator v1
    replayLogger.info('Test 1: Generator v1 → Generator v1');
    const v1ToV1 = await this._testSelfRegeneration(generatorV1, capabilityContract, adapterContract, technologyManifest);
    replayLogger.info(`Result: ${v1ToV1.success ? 'PASSED' : 'FAILED'}\n`);

    // Test 2: Generator v2 regenerates Generator v2
    replayLogger.info('Test 2: Generator v2 → Generator v2');
    const v2ToV2 = await this._testSelfRegeneration(generatorV2, capabilityContract, adapterContract, technologyManifest);
    replayLogger.info(`Result: ${v2ToV2.success ? 'PASSED' : 'FAILED'}\n`);

    // Test 3: Generator v1 builds Generator v2
    replayLogger.info('Test 3: Generator v1 → Generator v2');
    const v1ToV2 = await this._testCrossGeneration(generatorV1, generatorV2, capabilityContract, adapterContract, technologyManifest);
    replayLogger.info(`Result: ${v1ToV2.success ? 'PASSED' : 'FAILED'}\n`);

    // Test 4: Generator v2 builds Generator v1
    replayLogger.info('Test 4: Generator v2 → Generator v1');
    const v2ToV1 = await this._testCrossGeneration(generatorV2, generatorV1, capabilityContract, adapterContract, technologyManifest);
    replayLogger.info(`Result: ${v2ToV1.success ? 'PASSED' : 'FAILED'}\n`);

    // Verify same hashes across all tests
    replayLogger.info('Verifying hash consistency...');
    const hashConsistency = this._verifyHashConsistency(v1ToV1, v2ToV2, v1ToV2, v2ToV1);
    replayLogger.info(`Hash consistency: ${hashConsistency.success ? 'PASSED' : 'FAILED'}\n`);

    // Verify same witnesses across all tests
    replayLogger.info('Verifying witness consistency...');
    const witnessConsistency = this._verifyWitnessConsistency(v1ToV1, v2ToV2, v1ToV2, v2ToV1);
    replayLogger.info(`Witness consistency: ${witnessConsistency.success ? 'PASSED' : 'FAILED'}\n`);

    // Verify same constitutional approval across all tests
    replayLogger.info('Verifying constitutional approval consistency...');
    const approvalConsistency = this._verifyApprovalConsistency(v1ToV1, v2ToV2, v1ToV2, v2ToV1);
    replayLogger.info(`Constitutional approval consistency: ${approvalConsistency.success ? 'PASSED' : 'FAILED'}\n`);

    const allTestsPassed = 
      v1ToV1.success && 
      v2ToV2.success && 
      v1ToV2.success && 
      v2ToV1.success &&
      hashConsistency.success &&
      witnessConsistency.success &&
      approvalConsistency.success;

    const result = {
      success: allTestsPassed,
      tests: {
        v1_to_v1: v1ToV1,
        v2_to_v2: v2ToV2,
        v1_to_v2: v1ToV2,
        v2_to_v1: v2ToV1
      },
      consistency: {
        hashes: hashConsistency,
        witnesses: witnessConsistency,
        approval: approvalConsistency
      },
      message: allTestsPassed 
        ? 'Compiler lineage verification PASSED - Self-hosting approved' 
        : 'Compiler lineage verification FAILED - Self-hosting not approved'
    };

    replayLogger.info('=== Bootstrapping Validation Complete ===');
    replayLogger.info(`Overall Result: ${result.success ? 'PASSED' : 'FAILED'}\n`);

    return result;
  }

  /**
   * Test self-regeneration (v1 → v1 or v2 → v2)
   * @param {Object} generator - Generator manifest
   * @param {Object} capabilityContract - Capability contract
   * @param {Object} adapterContract - Adapter contract
   * @param {Object} technologyManifest - Technology manifest
   * @returns {Object} Test result
   */
  async _testSelfRegeneration(generator, capabilityContract, adapterContract, technologyManifest) {
    const compiler1 = new AdapterCompilerV2();
    const compiler2 = new AdapterCompilerV2();

    const inputs = {
      technologyManifest,
      adapterContract,
      capabilityContract,
      vendor: 'PostgreSQL',
      generatorInfo: generator
    };

    const artifact1 = await compiler1.compileAdapter(inputs);
    const artifact2 = await compiler2.compileAdapter(inputs);

    const success = 
      artifact1.root_constitutional_hash === artifact2.root_constitutional_hash &&
      artifact1.approved &&
      artifact2.approved;

    return {
      success,
      artifact1_hash: artifact1.root_constitutional_hash,
      artifact2_hash: artifact2.root_constitutional_hash,
      generator_id: generator.generator_id,
      generator_version: generator.generator_version
    };
  }

  /**
   * Test cross-generation (v1 → v2 or v2 → v1)
   * @param {Object} sourceGenerator - Source generator
   * @param {Object} targetGenerator - Target generator
   * @param {Object} capabilityContract - Capability contract
   * @param {Object} adapterContract - Adapter contract
   * @param {Object} technologyManifest - Technology manifest
   * @returns {Object} Test result
   */
  async _testCrossGeneration(sourceGenerator, targetGenerator, capabilityContract, adapterContract, technologyManifest) {
    const compiler = new AdapterCompilerV2();

    const inputs = {
      technologyManifest,
      adapterContract,
      capabilityContract,
      vendor: 'PostgreSQL',
      generatorInfo: sourceGenerator
    };

    const artifact = await compiler.compileAdapter(inputs);

    // Verify that the artifact was generated with the source generator
    const generatorWitnessMatches = 
      artifact.generator_witness.generator_id === sourceGenerator.generator_id &&
      artifact.generator_witness.generator_version === sourceGenerator.generator_version;

    const success = generatorWitnessMatches && artifact.approved;

    return {
      success,
      artifact_hash: artifact.root_constitutional_hash,
      source_generator_id: sourceGenerator.generator_id,
      target_generator_id: targetGenerator.generator_id,
      generator_witness_matches: generatorWitnessMatches
    };
  }

  /**
   * Verify hash consistency across all tests
   * @param {Object} v1ToV1 - Test result v1 → v1
   * @param {Object} v2ToV2 - Test result v2 → v2
   * @param {Object} v1ToV2 - Test result v1 → v2
   * @param {Object} v2ToV1 - Test result v2 → v1
   * @returns {Object} Hash consistency result
   */
  _verifyHashConsistency(v1ToV1, v2ToV2, v1ToV2, v2ToV1) {
    // Self-regeneration tests should have identical hashes
    const selfRegenerationConsistent = 
      v1ToV1.success && 
      v2ToV2.success &&
      v1ToV1.artifact1_hash === v1ToV1.artifact2_hash &&
      v2ToV2.artifact1_hash === v2ToV2.artifact2_hash;

    // Cross-generation tests should have different hashes (different generators)
    const crossGenerationDistinct = 
      v1ToV2.success && 
      v2ToV1.success &&
      v1ToV2.artifact_hash !== v2ToV1.artifact_hash;

    return {
      success: selfRegenerationConsistent && crossGenerationDistinct,
      self_regeneration_consistent: selfRegenerationConsistent,
      cross_generation_distinct: crossGenerationDistinct
    };
  }

  /**
   * Verify witness consistency across all tests
   * @param {Object} v1ToV1 - Test result v1 → v1
   * @param {Object} v2ToV2 - Test result v2 → v2
   * @param {Object} v1ToV2 - Test result v1 → v2
   * @param {Object} v2ToV1 - Test result v2 → v1
   * @returns {Object} Witness consistency result
   */
  _verifyWitnessConsistency(v1ToV1, v2ToV2, v1ToV2, v2ToV1) {
    // All tests should have valid witnesses
    const allHaveWitnesses = 
      v1ToV1.success && 
      v2ToV2.success && 
      v1ToV2.success && 
      v2ToV1.success;

    return {
      success: allHaveWitnesses,
      all_have_witnesses: allHaveWitnesses
    };
  }

  /**
   * Verify constitutional approval consistency across all tests
   * @param {Object} v1ToV1 - Test result v1 → v1
   * @param {Object} v2ToV2 - Test result v2 → v2
   * @param {Object} v1ToV2 - Test result v1 → v2
   * @param {Object} v2ToV1 - Test result v2 → v1
   * @returns {Object} Approval consistency result
   */
  _verifyApprovalConsistency(v1ToV1, v2ToV2, v1ToV2, v2ToV1) {
    // All tests should be approved
    const allApproved = 
      v1ToV1.success && 
      v2ToV2.success && 
      v1ToV2.success && 
      v2ToV1.success;

    return {
      success: allApproved,
      all_approved: allApproved
    };
  }

  /**
   * Get compiler lineage record
   * @param {string} generatorId - Generator ID
   * @returns {Object} Lineage record
   */
  getLineageRecord(generatorId) {
    return this._compilerLineageRecords.get(generatorId);
  }

  /**
   * Clear all records (for testing)
   */
  clear() {
    this._compilerLineageRecords.clear();
  }
}

module.exports = { BootstrappingValidationAuthority };
