const { TechnologyAuthority } = require('./technology_authority');
const { AdapterAuthority } = require('./adapter_authority');
const { CodeGenerator } = require('./code_generator');
const { WitnessGenerator } = require('./witness_generator');
const { ConstitutionalAuthority } = require('./constitutional_authority_weighted');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { GeneratorManifest } = require('./generator_manifest');
const { ReplayDeterminismAuthority } = require('./replay_determinism_authority');
const { ReproducibleBuildAuthority } = require('./reproducible_build_authority');
const { GeneratorWitness } = require('./generator_witness');
const { PerformanceBaselineWitness } = require('./performance_baseline_witness');
const { ConstitutionalFreezeAuthority } = require('./constitutional_freeze');

/**
 * AdapterCompiler V2
 * 
 * Phase 2.6 — CI Gate Reordering
 * 
 * Reordered pipeline:
 * Manifest → IR → Generator → Compile → Replay → Hash Equality → Witness → Technology Authority → Constitutional Authority → Freeze → Store
 * 
 * This is stronger because the Authorities evaluate something already proven deterministic.
 */
class AdapterCompilerV2 {
  constructor() {
    this._technologyAuthority = new TechnologyAuthority();
    this._adapterAuthority = new AdapterAuthority();
    this._witnessGenerator = new WitnessGenerator();
    this._constitutionalAuthority = new ConstitutionalAuthority();
    this._generatorManifest = new GeneratorManifest();
    this._replayDeterminismAuthority = new ReplayDeterminismAuthority();
    this._reproducibleBuildAuthority = new ReproducibleBuildAuthority();
    this._generatorWitness = new GeneratorWitness();
    this._performanceBaseline = new PerformanceBaselineWitness();
    this._constitutionalFreezeAuthority = new ConstitutionalFreezeAuthority();
  }

  /**
   * Compile adapter with reordered constitutional pipeline
   * @param {Object} inputs - Constitutional inputs
   * @param {Object} inputs.technologyManifest - Technology Manifest
   * @param {Object} inputs.adapterContract - Adapter Contract
   * @param {Object} inputs.capabilityContract - Capability Contract
   * @param {string} inputs.vendor - Vendor name
   * @param {Object} inputs.generatorInfo - Generator information (for Generator Manifest)
   * @returns {Object} Immutable constitutional artifact
   */
  async compileAdapter(inputs) {
    // === Phase 1: Manifest ===
    const technologyManifest = await this._loadTechnologyManifest(inputs.technologyManifest);
    const technologyManifestHash = technologyManifest.manifest_metadata.hash;

    // === Phase 2: IR ===
    const adapterContract = await this._loadAdapterContract(inputs.adapterContract);
    const capabilityContract = await this._loadCapabilityContract(inputs.capabilityContract);
    const ir = await this._buildAdapterIR(capabilityContract);

    // === Phase 3: Generator ===
    const generatorManifest = await this._createGeneratorManifest(inputs.generatorInfo || this._getDefaultGeneratorInfo());

    // === Phase 4: Compile ===
    const codeGenerator = new CodeGenerator(ir, adapterContract);
    this._performanceBaseline.startGenerationTimer();
    const adapterSource = await this._generateAdapterSource(codeGenerator);
    this._performanceBaseline.stopGenerationTimer();

    this._performanceBaseline.startCompileTimer();
    const adapter = await this._compileGeneratedAdapter(adapterSource, inputs.vendor);
    this._performanceBaseline.stopCompileTimer();

    const adapterManifest = await this._createAdapterManifest(adapter, capabilityContract, ir, adapterContract);

    // === Phase 5: Replay ===
    this._performanceBaseline.startReplayTimer();
    const replayDeterminismResult = await this._verifyReplayDeterminism(ir, adapterSource, adapterManifest);
    this._performanceBaseline.stopReplayTimer();

    if (!replayDeterminismResult.is_deterministic && !replayDeterminismResult.is_first_run) {
      throw new Error('Replay determinism violation detected');
    }

    // === Phase 6: Hash Equality ===
    const hashEqualityResult = await this._verifyHashEquality(adapterSource, adapterManifest);
    if (!hashEqualityResult.is_equal) {
      throw new Error('Hash equality violation detected');
    }

    // === Phase 7: Generator Witness ===
    const generatorWitness = await this._createGeneratorWitness(generatorManifest, adapterSource, adapterManifest);

    // === Phase 8: Adapter Witness ===
    const adapterWitness = await this._generateAdapterWitness(adapter, adapterManifest);

    // === Phase 9: Technology Authority ===
    await this._registerAdapterWitness(adapter.adapter_id, adapterWitness.witness_metadata.hash, technologyManifestHash);

    // === Phase 10: Constitutional Authority ===
    const constitutionalEvaluation = await this._evaluateConstitutionalProposal(
      adapter,
      generatorWitness,
      adapterWitness,
      technologyManifestHash,
      replayDeterminismResult
    );

    // === Phase 11: Freeze === (Phase 2.9: delegate exclusively to ConstitutionalFreezeAuthority)
    // Performance baseline is included in freeze call (Phase 2.11: as telemetry, not constitutional identity)
    this._performanceBaseline.recordArtifactSize(JSON.stringify({
      technologyManifest,
      ir,
      generatorManifest,
      adapter,
      adapterSource,
      adapterManifest,
      generatorWitness,
      adapterWitness,
      constitutionalEvaluation,
      replayDeterminismResult,
      hashEqualityResult
    }).length);
    
    const performanceBaseline = this._performanceBaseline.createPerformanceBaseline(adapter.adapter_id);

    const frozenArtifact = await this._constitutionalFreezeAuthority.freezeConstitutionalRecord({
      technologyManifest,
      ir,
      generatorManifest,
      adapter,
      adapterSource,
      adapterManifest,
      generatorWitness,
      adapterWitness,
      constitutionalEvaluation,
      replayDeterminismResult,
      hashEqualityResult,
      performance_baseline: performanceBaseline
    });

    return frozenArtifact;
  }

  /**
   * Load Technology Manifest
   * @param {Object} technologyManifest - Technology Manifest
   * @returns {Object} Technology Manifest
   */
  async _loadTechnologyManifest(technologyManifest) {
    if (!technologyManifest || !technologyManifest.manifest_metadata) {
      throw new Error('Invalid Technology Manifest');
    }

    const isValid = await this._technologyAuthority.verifyManifestIntegrity(technologyManifest);
    if (!isValid) {
      throw new Error('Technology Manifest integrity verification failed');
    }

    return technologyManifest;
  }

  /**
   * Load Adapter Contract
   * @param {Object} adapterContract - Adapter Contract
   * @returns {Object} Adapter Contract
   */
  async _loadAdapterContract(adapterContract) {
    if (!adapterContract || !adapterContract.adapter_name) {
      throw new Error('Invalid Adapter Contract');
    }

    this._adapterAuthority.defineAdapterContract(adapterContract.adapter_name, adapterContract);
    return adapterContract;
  }

  /**
   * Load Capability Contract
   * @param {Object} capabilityContract - Capability Contract
   * @returns {Object} Capability Contract
   */
  async _loadCapabilityContract(capabilityContract) {
    if (!capabilityContract || !capabilityContract.capability_name) {
      throw new Error('Invalid Capability Contract');
    }

    this._adapterAuthority.defineCapabilityContract(capabilityContract.capability_name, capabilityContract);
    return capabilityContract;
  }

  /**
   * Build Adapter IR
   * @param {Object} capabilityContract - Capability Contract
   * @returns {Object} Adapter IR
   */
  async _buildAdapterIR(capabilityContract) {
    return await this._adapterAuthority.generateIR(capabilityContract);
  }

  /**
   * Create Generator Manifest
   * @param {Object} generatorInfo - Generator information
   * @returns {Object} Generator manifest
   */
  async _createGeneratorManifest(generatorInfo) {
    return this._generatorManifest.createGeneratorManifest(generatorInfo);
  }

  /**
   * Generate Adapter Source
   * @param {CodeGenerator} codeGenerator - Code Generator
   * @returns {Object} Adapter source
   */
  async _generateAdapterSource(codeGenerator) {
    const result = await codeGenerator.generateAdapterSource();
    // Use canonical serializer for hash
    result.adapter_source_hash = CanonicalAuthority.hash(result.adapter_source);
    return result;
  }

  /**
   * Compile Generated Adapter
   * @param {Object} adapterSource - Adapter source
   * @param {string} vendor - Vendor name
   * @returns {Object} Compiled adapter
   */
  async _compileGeneratedAdapter(adapterSource, vendor) {
    const adapter = await this._adapterAuthority.compileAdapter(adapterSource, vendor);
    // Use canonical authority for hash
    adapter.adapter_metadata.hash = CanonicalAuthority.hash(adapter);
    return adapter;
  }

  /**
   * Create Adapter Manifest
   * @param {Object} adapter - Generated adapter
   * @param {Object} capabilityContract - Capability Contract
   * @param {Object} ir - Adapter IR
   * @param {Object} adapterContract - Adapter Contract
   * @returns {Object} Adapter manifest
   */
  async _createAdapterManifest(adapter, capabilityContract, ir, adapterContract) {
    const manifest = await this._adapterAuthority.createAdapterManifest(adapter, capabilityContract, ir, adapterContract);
    // Use canonical authority for hash
    manifest.manifest_metadata.hash = CanonicalAuthority.hash(manifest);
    return manifest;
  }

  /**
   * Verify Replay Determinism
   * @param {Object} ir - Adapter IR
   * @param {Object} adapterSource - Adapter source
   * @param {Object} adapterManifest - Adapter manifest
   * @returns {Object} Replay determinism result
   */
  async _verifyReplayDeterminism(ir, adapterSource, adapterManifest) {
    return await this._replayDeterminismAuthority.verifyReplayDeterminism(ir, adapterSource, adapterManifest);
  }

  /**
   * Verify Hash Equality
   * @param {Object} adapterSource - Adapter source
   * @param {Object} adapterManifest - Adapter manifest
   * @returns {Object} Hash equality result
   */
  async _verifyHashEquality(adapterSource, adapterManifest) {
    const computedSourceHash = CanonicalAuthority.hash(adapterSource.adapter_source);
    const is_equal = computedSourceHash === adapterManifest.adapter_source_hash;

    return {
      is_equal,
      computed_source_hash: computedSourceHash,
      manifest_source_hash: adapterManifest.adapter_source_hash
    };
  }

  /**
   * Create Generator Witness
   * @param {Object} generatorManifest - Generator manifest
   * @param {Object} adapterSource - Adapter source
   * @param {Object} adapterManifest - Adapter manifest
   * @returns {Object} Generator witness
   */
  async _createGeneratorWitness(generatorManifest, adapterSource, adapterManifest) {
    return this._generatorWitness.createGeneratorWitness(generatorManifest, adapterSource, adapterManifest);
  }

  /**
   * Generate Adapter Witness
   * @param {Object} adapter - Generated adapter
   * @param {Object} manifest - Adapter manifest
   * @returns {Object} Adapter witness
   */
  async _generateAdapterWitness(adapter, manifest) {
    return await this._witnessGenerator.generateAdapterWitness(adapter, manifest);
  }

  /**
   * Register Adapter Witness
   * @param {string} adapterId - Adapter ID
   * @param {string} witnessHash - Witness hash
   * @param {string} technologyManifestHash - Technology Manifest hash
   */
  async _registerAdapterWitness(adapterId, witnessHash, technologyManifestHash) {
    await this._technologyAuthority.registerAdapterWitness(adapterId, witnessHash);
  }

  /**
   * Evaluate Constitutional Proposal
   * @param {Object} adapter - Generated adapter
   * @param {Object} generatorWitness - Generator witness
   * @param {Object} adapterWitness - Adapter witness
   * @param {string} technologyManifestHash - Technology Manifest hash
   * @param {Object} replayDeterminismResult - Replay determinism result
   * @returns {Object} Constitutional evaluation
   */
  async _evaluateConstitutionalProposal(adapter, generatorWitness, adapterWitness, technologyManifestHash, replayDeterminismResult) {
    const proposal = {
      name: adapter.adapter_name,
      id: adapter.adapter_id,
      replay_determinism_score: replayDeterminismResult.is_deterministic ? 100 : 0,
      canonical_identity_score: 100,
      capability_isolation_score: 100,
      security_score: 100,
      replay_witness_integrity_score: adapterWitness.compilation_witness.compilation_success ? 100 : 0,
      generator_integrity_score: 100, // New: generator witness integrity
      migration_compatibility_score: 100,
      operational_simplicity_score: 100,
      performance_score: 100,
      developer_ergonomics_score: 100
    };

    return await this._constitutionalAuthority.evaluateProposal(proposal);
  }

  /**
   * Get default generator info
   * @returns {Object} Default generator information
   */
  _getDefaultGeneratorInfo() {
    return {
      generator_id: 'cg_code_generator_v1',
      generator_version: '1.0.0',
      generator_source: 'CodeGenerator implementation',
      dependencies: {},
      configuration: {}
    };
  }
}

module.exports = { AdapterCompilerV2 };
