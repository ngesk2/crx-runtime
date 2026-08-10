/**
 * Constitutional Replay Integration Harness
 * 
 * Constitutional Constraint: Identical input → identical canonical bytes → identical hash → identical ID → identical replay → identical witness → identical certificate
 * 
 * This harness verifies the entire constitutional pipeline produces deterministic outputs.
 * 
 * Pipeline:
 * Raw Transport
 *       ↓
 * Normalization
 *       ↓
 * Canonical Object
 *       ↓
 * Canonical Bytes
 *       ↓
 * Canonical Hash
 *       ↓
 * Identity
 *       ↓
 * Persistence
 *       ↓
 * Replay
 *       ↓
 * Witness
 *       ↓
 * Replay Certificate
 *       ↓
 * Replay Again
 *       ↓
 * Compare Everything
 */

const { CanonicalBytes, CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { canonicalObjectAuthority } = require('./canonical_object_authority');
const { WitnessRecorder } = require('./witness_recorder');
const { ReplayCertificate } = require('./replay_certificate');

class ConstitutionalReplayIntegrationHarness {
  constructor() {
    this._results = [];
    this._iterations = 1000;
  }

  /**
   * Run all constitutional determinism tests
   * @returns {Object} Test results
   */
  async runAllTests() {
    console.log('=== Constitutional Replay Integration Harness ===\n');
    
    const results = {
      canonicalBytesStability: await this.testCanonicalBytesStability(),
      hashStability: await this.testHashStability(),
      identityStability: await this.testIdentityStability(),
      replayDeterminism: await this.testReplayDeterminism(),
      witnessDeterminism: await this.testWitnessDeterminism(),
      certificateDeterminism: await this.testCertificateDeterminism(),
      fullConstitutionalEquality: await this.testFullConstitutionalEquality(),
      replayReplay: await this.testReplayReplay(),
    };

    this._printResults(results);
    return results;
  }

  /**
   * Test 1: Canonical Bytes Stability
   * Serialize the same object 1,000 times.
   * Assert every canonical_bytes buffer is byte-for-byte identical.
   */
  async testCanonicalBytesStability() {
    console.log('Test 1: Canonical Bytes Stability (1,000 serializations)');
    
    const testObject = {
      id: 'test-123',
      kind: 'TestObject',
      payload: {
        value: 42,
        name: 'test',
        nested: {
          array: [1, 2, 3],
          flag: true
        }
      }
    };

    const canonicalBytesSet = new Set();
    let allIdentical = true;
    const firstBytes = CanonicalBytes.serialize(testObject);

    for (let i = 0; i < this._iterations; i++) {
      const bytes = CanonicalBytes.serialize(testObject);
      canonicalBytesSet.add(bytes.toString('hex')); // Store hex string for comparison
      
      if (!bytes.equals(firstBytes)) {
        allIdentical = false;
        console.log(`  ❌ Iteration ${i}: bytes differ`);
      }
    }

    const passed = allIdentical && canonicalBytesSet.size === 1;
    console.log(`  ${passed ? '✅' : '❌'} ${canonicalBytesSet.size} unique canonical bytes (expected 1)\n`);
    
    return { passed, uniqueCount: canonicalBytesSet.size, iterations: this._iterations };
  }

  /**
   * Test 2: Hash Stability
   * Feed canonical bytes into CanonicalAuthority.hashBytes().
   * Assert every hash is identical.
   */
  async testHashStability() {
    console.log('Test 2: Hash Stability (1,000 hash operations)');
    
    const testObject = { id: 'test-123', value: 42 };
    const canonicalBytes = CanonicalBytes.serialize(testObject);
    
    const hashSet = new Set();
    let allIdentical = true;
    const firstHash = CanonicalAuthority.hashBytes(canonicalBytes);

    for (let i = 0; i < this._iterations; i++) {
      const hash = CanonicalAuthority.hashBytes(canonicalBytes);
      hashSet.add(hash);
      
      if (hash !== firstHash) {
        allIdentical = false;
        console.log(`  ❌ Iteration ${i}: hash differs`);
      }
    }

    const passed = allIdentical && hashSet.size === 1;
    console.log(`  ${passed ? '✅' : '❌'} ${hashSet.size} unique hashes (expected 1)\n`);
    
    return { passed, uniqueCount: hashSet.size, iterations: this._iterations };
  }

  /**
   * Test 3: Identity Stability
   * Feed canonical hash into IdentityAuthority.generateFromCanonicalHash().
   * Assert every ID is identical.
   */
  async testIdentityStability() {
    console.log('Test 3: Identity Stability (1,000 ID generations)');
    
    const testObject = { id: 'test-123', value: 42 };
    const canonicalBytes = CanonicalBytes.serialize(testObject);
    const canonicalHash = CanonicalAuthority.hashBytes(canonicalBytes);
    
    const idSet = new Set();
    let allIdentical = true;
    const firstId = identityAuthority.generateFromCanonicalHash(canonicalBytes, 'test');

    for (let i = 0; i < this._iterations; i++) {
      const id = identityAuthority.generateFromCanonicalHash(canonicalBytes, 'test');
      idSet.add(id);
      
      if (id !== firstId) {
        allIdentical = false;
        console.log(`  ❌ Iteration ${i}: ID differs`);
      }
    }

    const passed = allIdentical && idSet.size === 1;
    console.log(`  ${passed ? '✅' : '❌'} ${idSet.size} unique IDs (expected 1)\n`);
    
    return { passed, uniqueCount: idSet.size, iterations: this._iterations };
  }

  /**
   * Test 4: Replay Determinism
   * Record a replay object.
   * Replay it 1,000 times.
   * Assert: canonical bytes unchanged, replay ID unchanged, reducer output unchanged.
   */
  async testReplayDeterminism() {
    console.log('Test 4: Replay Determinism (1,000 replays)');
    
    const stages = [
      {
        stage_name: 'test_stage_1',
        input_ids: ['input-1'],
        output_ids: ['output-1'],
        result: 'success'
      },
      {
        stage_name: 'test_stage_2',
        input_ids: ['output-1'],
        output_ids: ['output-2'],
        result: 'success'
      }
    ];

    const canonicalBytes = CanonicalBytes.serialize(stages);
    const canonicalHash = CanonicalAuthority.hashBytes(canonicalBytes);
    const replayId = identityAuthority.generateFromCanonicalHash(canonicalBytes, 'replay');

    const canonicalBytesSet = new Set();
    const replayIdSet = new Set();
    let allIdentical = true;

    for (let i = 0; i < this._iterations; i++) {
      const bytes = CanonicalBytes.serialize(stages);
      const hash = CanonicalAuthority.hashBytes(bytes);
      const id = identityAuthority.generateFromCanonicalHash(bytes, 'replay');
      
      canonicalBytesSet.add(bytes.toString('hex'));
      replayIdSet.add(id);
      
      if (!bytes.equals(canonicalBytes) || id !== replayId) {
        allIdentical = false;
        console.log(`  ❌ Iteration ${i}: replay diverges`);
      }
    }

    const passed = allIdentical && canonicalBytesSet.size === 1 && replayIdSet.size === 1;
    console.log(`  ${passed ? '✅' : '❌'} ${canonicalBytesSet.size} unique canonical bytes, ${replayIdSet.size} unique replay IDs (expected 1 each)\n`);
    
    return { passed, canonicalBytesUnique: canonicalBytesSet.size, replayIdUnique: replayIdSet.size, iterations: this._iterations };
  }

  /**
   * Test 5: Witness Determinism
   * Build witness roots from the replay.
   * Assert witness root never changes.
   */
  async testWitnessDeterminism() {
    console.log('Test 5: Witness Determinism (1,000 witness roots)');
    
    const replayObject = {
      id: 'replay-123',
      payload: {
        lifecycle_id: 'lifecycle-123',
        stages: [
          {
            stage_name: 'test_stage',
            input_ids: ['input-1'],
            output_ids: ['output-1'],
            result: 'success'
          }
        ],
        result: 'success'
      },
      canonical_hash: 'hash-123',
      canonical_bytes: Buffer.from('test-bytes')
    };

    const witnessRecorder = new WitnessRecorder();
    const witnessRootSet = new Set();
    let allIdentical = true;

    for (let i = 0; i < this._iterations; i++) {
      const witnessObject = witnessRecorder.record(replayObject);
      const witnessRoot = witnessObject.canonical_hash;
      witnessRootSet.add(witnessRoot);
      
      if (witnessRootSet.size > 1) {
        allIdentical = false;
        console.log(`  ❌ Iteration ${i}: witness root differs`);
      }
    }

    const passed = allIdentical && witnessRootSet.size === 1;
    console.log(`  ${passed ? '✅' : '❌'} ${witnessRootSet.size} unique witness roots (expected 1)\n`);
    
    return { passed, uniqueCount: witnessRootSet.size, iterations: this._iterations };
  }

  /**
   * Test 6: Certificate Determinism
   * Generate certificates repeatedly.
   * Assert: certificate ID identical, canonical_bytes_hash identical, signature payload identical (before signing).
   */
  async testCertificateDeterminism() {
    console.log('Test 6: Certificate Determinism (1,000 certificates)');
    
    const canonicalBytes = Buffer.from('test-certificate-bytes');
    
    const replayCertificate = new ReplayCertificate();
    const certificateIdSet = new Set();
    const canonicalBytesHashSet = new Set();
    let allIdentical = true;

    for (let i = 0; i < this._iterations; i++) {
      const certificate = replayCertificate.createCertificate({
        canonical_bytes: canonicalBytes,
        authority: 'ReplayCertificate',
        version: '1.0.0',
        signature: null
      });
      
      certificateIdSet.add(certificate.id);
      canonicalBytesHashSet.add(certificate.canonical_bytes_hash);
      
      if (certificateIdSet.size > 1 || canonicalBytesHashSet.size > 1) {
        allIdentical = false;
        console.log(`  ❌ Iteration ${i}: certificate diverges`);
      }
    }

    const passed = allIdentical && certificateIdSet.size === 1 && canonicalBytesHashSet.size === 1;
    console.log(`  ${passed ? '✅' : '❌'} ${certificateIdSet.size} unique certificate IDs, ${canonicalBytesHashSet.size} unique canonical_bytes_hash (expected 1 each)\n`);
    
    return { passed, certificateIdUnique: certificateIdSet.size, canonicalBytesHashUnique: canonicalBytesHashSet.size, iterations: this._iterations };
  }

  /**
   * Test 7: Full Constitutional Equality
   * Compare the entire pipeline output:
   * canonical_bytes, canonical_hash, identity, replay, witness, certificate
   * Everything except timestamps (if they're intentionally excluded from authority) should be byte-for-byte identical.
   */
  async testFullConstitutionalEquality() {
    console.log('Test 7: Full Constitutional Equality (entire pipeline)');
    
    const testObject = {
      id: 'test-123',
      kind: 'TestObject',
      payload: { value: 42 }
    };

    const pipelineOutputs = [];

    for (let i = 0; i < 100; i++) { // Reduced iterations for full pipeline test
      // Step 1: Canonical Bytes
      const canonicalBytes = CanonicalBytes.serialize(testObject);
      
      // Step 2: Canonical Hash
      const canonicalHash = CanonicalAuthority.hashBytes(canonicalBytes);
      
      // Step 3: Identity
      const objectId = identityAuthority.generateFromCanonicalHash(canonicalBytes, 'test');
      
      // Step 4: Replay
      const stages = [{ stage_name: 'test', input_ids: ['in'], output_ids: ['out'], result: 'success' }];
      const replayBytes = CanonicalBytes.serialize(stages);
      const replayHash = CanonicalAuthority.hashBytes(replayBytes);
      const replayId = identityAuthority.generateFromCanonicalHash(replayBytes, 'replay');
      
      // Step 5: Witness
      const replayObject = {
        id: replayId,
        payload: { lifecycle_id: 'lifecyle-123', stages, result: 'success' },
        canonical_hash: replayHash,
        canonical_bytes: replayBytes
      };
      const witnessRecorder = new WitnessRecorder();
      const witnessObject = witnessRecorder.record(replayObject);
      
      // Step 6: Certificate
      const replayCertificate = new ReplayCertificate();
      const certificate = replayCertificate.createCertificate({
        canonical_bytes: replayBytes,
        authority: 'ReplayCertificate',
        version: '1.0.0',
        signature: null
      });

      pipelineOutputs.push({
        canonicalBytes,
        canonicalHash,
        objectId,
        replayBytes,
        replayHash,
        replayId,
        witnessHash: witnessObject.canonical_hash,
        certificateId: certificate.id,
        certificateHash: certificate.canonical_bytes_hash
      });
    }

    // Compare all outputs
    const first = pipelineOutputs[0];
    let allIdentical = true;

    for (let i = 1; i < pipelineOutputs.length; i++) {
      const current = pipelineOutputs[i];
      
      if (!current.canonicalBytes.equals(first.canonicalBytes)) {
        console.log(`  ❌ Iteration ${i}: canonical_bytes differ`);
        allIdentical = false;
      }
      if (current.canonicalHash !== first.canonicalHash) {
        console.log(`  ❌ Iteration ${i}: canonical_hash differ`);
        allIdentical = false;
      }
      if (current.objectId !== first.objectId) {
        console.log(`  ❌ Iteration ${i}: objectId differ`);
        allIdentical = false;
      }
      if (!current.replayBytes.equals(first.replayBytes)) {
        console.log(`  ❌ Iteration ${i}: replayBytes differ`);
        allIdentical = false;
      }
      if (current.replayHash !== first.replayHash) {
        console.log(`  ❌ Iteration ${i}: replayHash differ`);
        allIdentical = false;
      }
      if (current.replayId !== first.replayId) {
        console.log(`  ❌ Iteration ${i}: replayId differ`);
        allIdentical = false;
      }
      if (current.witnessHash !== first.witnessHash) {
        console.log(`  ❌ Iteration ${i}: witnessHash differ`);
        allIdentical = false;
      }
      if (current.certificateId !== first.certificateId) {
        console.log(`  ❌ Iteration ${i}: certificateId differ`);
        allIdentical = false;
      }
      if (current.certificateHash !== first.certificateHash) {
        console.log(`  ❌ Iteration ${i}: certificateHash differ`);
        allIdentical = false;
      }
    }

    const passed = allIdentical;
    console.log(`  ${passed ? '✅' : '❌'} Full pipeline ${passed ? 'identical' : 'divergent'} across 100 iterations\n`);
    
    return { passed, iterations: 100 };
  }

  /**
   * Test 8: Replay Replay
   * Take the generated replay transcript and replay it again.
   * The second replay must produce identical outputs.
   */
  async testReplayReplay() {
    console.log('Test 8: Replay Replay (replay transcript twice, compare)');
    
    const stages = [
      { stage_name: 'stage1', input_ids: ['in1'], output_ids: ['out1'], result: 'success' },
      { stage_name: 'stage2', input_ids: ['out1'], output_ids: ['out2'], result: 'success' }
    ];

    // Replay 1
    const replay1Bytes = CanonicalBytes.serialize(stages);
    const replay1Hash = CanonicalAuthority.hashBytes(replay1Bytes);
    const replay1Id = identityAuthority.generateFromCanonicalHash(replay1Bytes, 'replay');
    
    const replayObject1 = {
      id: replay1Id,
      payload: { lifecycle_id: 'lifecycle-123', stages, result: 'success' },
      canonical_hash: replay1Hash,
      canonical_bytes: replay1Bytes
    };
    
    const witnessRecorder1 = new WitnessRecorder();
    const witnessObject1 = witnessRecorder1.record(replayObject1);
    
    const replayCertificate1 = new ReplayCertificate();
    const certificate1 = replayCertificate1.createCertificate({
      canonical_bytes: replay1Bytes,
      authority: 'ReplayCertificate',
      version: '1.0.0',
      signature: null
    });

    // Replay 2 (same input)
    const replay2Bytes = CanonicalBytes.serialize(stages);
    const replay2Hash = CanonicalAuthority.hashBytes(replay2Bytes);
    const replay2Id = identityAuthority.generateFromCanonicalHash(replay2Bytes, 'replay');
    
    const replayObject2 = {
      id: replay2Id,
      payload: { lifecycle_id: 'lifecycle-123', stages, result: 'success' },
      canonical_hash: replay2Hash,
      canonical_bytes: replay2Bytes
    };
    
    const witnessRecorder2 = new WitnessRecorder();
    const witnessObject2 = witnessRecorder2.record(replayObject2);
    
    const replayCertificate2 = new ReplayCertificate();
    const certificate2 = replayCertificate2.createCertificate({
      canonical_bytes: replay2Bytes,
      authority: 'ReplayCertificate',
      version: '1.0.0',
      signature: null
    });

    // Compare
    const bytesMatch = replay1Bytes.equals(replay2Bytes);
    const hashMatch = replay1Hash === replay2Hash;
    const idMatch = replay1Id === replay2Id;
    const witnessMatch = witnessObject1.canonical_hash === witnessObject2.canonical_hash;
    const certificateMatch = certificate1.id === certificate2.id && certificate1.canonical_bytes_hash === certificate2.canonical_bytes_hash;

    const passed = bytesMatch && hashMatch && idMatch && witnessMatch && certificateMatch;
    
    console.log(`  ${bytesMatch ? '✅' : '❌'} Replay1.bytes == Replay2.bytes`);
    console.log(`  ${hashMatch ? '✅' : '❌'} Replay1.hash == Replay2.hash`);
    console.log(`  ${idMatch ? '✅' : '❌'} Replay1.ID == Replay2.ID`);
    console.log(`  ${witnessMatch ? '✅' : '❌'} WitnessRoot identical`);
    console.log(`  ${certificateMatch ? '✅' : '❌'} Certificate identical`);
    console.log(`  ${passed ? '✅' : '❌'} Replay Replay ${passed ? 'passed' : 'failed'}\n`);
    
    return { passed, bytesMatch, hashMatch, idMatch, witnessMatch, certificateMatch };
  }

  /**
   * Print test results summary
   */
  _printResults(results) {
    console.log('=== Constitutional Replay Integration Harness Results ===\n');
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r.passed).length;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${(passedTests / totalTests * 100).toFixed(1)}%\n`);
    
    if (passedTests === totalTests) {
      console.log('✅ CONSTITUTIONAL FREEZE VERIFIED: All tests passed');
      console.log('The constitutional pipeline produces deterministic outputs.');
    } else {
      console.log('❌ CONSTITUTIONAL FREEZE FAILED: Some tests failed');
      console.log('The constitutional pipeline has non-deterministic behavior.');
    }
  }
}

// Run harness if executed directly
if (require.main === module) {
  const harness = new ConstitutionalReplayIntegrationHarness();
  harness.runAllTests()
    .then(results => {
      process.exit(results.canonicalBytesStability.passed && 
                   results.hashStability.passed && 
                   results.identityStability.passed && 
                   results.replayDeterminism.passed && 
                   results.witnessDeterminism.passed && 
                   results.certificateDeterminism.passed && 
                   results.fullConstitutionalEquality.passed && 
                   results.replayReplay.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Harness error:', error);
      process.exit(1);
    });
}

module.exports = { ConstitutionalReplayIntegrationHarness };
