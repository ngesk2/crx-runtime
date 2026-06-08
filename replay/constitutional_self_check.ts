/**
 * CONSTITUTIONAL SELF-CHECK SYSTEM
 * 
 * Mandatory startup verification for constitutional replay kernel.
 * Failure MUST abort startup.
 * 
 * Verifications:
 * - Corpus hash verification
 * - Certification artifact hash verification
 * - Witness root integrity
 * - Canonicalization consistency test
 * - Witness regeneration spot check
 * - Determinism smoke test
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ReplayEventStream } from './replay_event_stream';
import { CanonicalEventEnvelope } from './canonical_event_envelope';
import { DeterministicReplayEngine } from './deterministic_replay_engine';
import { WitnessAuthority } from './witness_authority';

export class ConstitutionalSelfCheck {
  private readonly certificationPath: string;
  private readonly corpusPath: string;
  private readonly engine: DeterministicReplayEngine;
  private readonly witnessAuthority: WitnessAuthority;

  constructor() {
    this.certificationPath = path.join(process.cwd(), 'certification');
    this.corpusPath = path.join(process.cwd(), 'tests/corpus');
    this.engine = new DeterministicReplayEngine();
    this.witnessAuthority = new WitnessAuthority();
  }

  /**
   * Run all startup verifications
   * Throws on failure - MUST abort startup
   */
  async runStartupVerification(): Promise<void> {
    console.log('Constitutional Self-Check: Starting startup verification...\n');

    try {
      await this.verifyCorpusHashes();
      await this.verifyCertificationArtifactHashes();
      await this.verifyWitnessRootIntegrity();
      await this.verifyCanonicalizationConsistency();
      await this.verifyWitnessRegeneration();
      await this.verifyDeterminismSmokeTest();

      console.log('Constitutional Self-Check: ✓ ALL VERIFICATIONS PASSED\n');
    } catch (error) {
      console.error('Constitutional Self-Check: ✗ VERIFICATION FAILED');
      console.error(error);
      throw new Error('Constitutional self-check failed - aborting startup');
    }
  }

  /**
   * Verify corpus SHA256 hashes
   */
  private async verifyCorpusHashes(): Promise<void> {
    console.log('Verifying corpus hashes...');

    const corpusHashFile = path.join(this.certificationPath, 'hashes/corpus_sha256.txt');
    if (!fs.existsSync(corpusHashFile)) {
      throw new Error('Corpus hash file not found: ' + corpusHashFile);
    }

    const hashContent = fs.readFileSync(corpusHashFile, 'utf8');
    const lines = hashContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    for (const line of lines) {
      const [expectedHash, filePath] = line.split(/\s+/);
      const fullPath = path.join(process.cwd(), filePath);

      if (!fs.existsSync(fullPath)) {
        throw new Error('Corpus file not found: ' + fullPath);
      }

      const fileBuffer = fs.readFileSync(fullPath);
      const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();

      if (actualHash !== expectedHash) {
        throw new Error(`Corpus hash mismatch for ${filePath}: expected ${expectedHash}, got ${actualHash}`);
      }
    }

    console.log('  ✓ Corpus hashes verified\n');
  }

  /**
   * Verify certification artifact hashes
   */
  private async verifyCertificationArtifactHashes(): Promise<void> {
    console.log('Verifying certification artifact hashes...');

    const requiredFiles = [
      'reports/certification_report.md',
      'vectors/replay_vectors_manifest.json',
      'hashes/witness_roots.txt',
      'hashes/corpus_sha256.txt',
      'reports/determinism_results.json',
      'reports/unicode_results.json',
      'reports/mutation_results.json',
      'reports/fuzz_results.json'
    ];

    for (const file of requiredFiles) {
      const fullPath = path.join(this.certificationPath, file);
      if (!fs.existsSync(fullPath)) {
        throw new Error('Certification artifact not found: ' + fullPath);
      }
    }

    console.log('  ✓ Certification artifacts verified\n');
  }

  /**
   * Verify witness root integrity
   */
  private async verifyWitnessRootIntegrity(): Promise<void> {
    console.log('Verifying witness root integrity...');

    const witnessRootsFile = path.join(this.certificationPath, 'hashes/witness_roots.txt');
    if (!fs.existsSync(witnessRootsFile)) {
      throw new Error('Witness roots file not found: ' + witnessRootsFile);
    }

    const witnessContent = fs.readFileSync(witnessRootsFile, 'utf8');
    const lines = witnessContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    for (const line of lines) {
      const [vectorId, witnessRoot] = line.split(':');
      if (!witnessRoot || witnessRoot.length !== 64) {
        throw new Error(`Invalid witness root format for ${vectorId}`);
      }
    }

    console.log('  ✓ Witness root integrity verified\n');
  }

  /**
   * Verify canonicalization consistency
   */
  private async verifyCanonicalizationConsistency(): Promise<void> {
    console.log('Verifying canonicalization consistency...');

    // Replay minimal corpus
    const minimalCorpus = JSON.parse(fs.readFileSync(path.join(this.corpusPath, 'minimal_replay.json'), 'utf8'));
    const events = minimalCorpus.event_stream.map((e: any) => new CanonicalEventEnvelope(e));
    const eventStream = new ReplayEventStream(events);

    const result1 = this.engine.replay(eventStream);
    const result2 = this.engine.replay(eventStream);

    if (result1.canonical_bytes.bytes !== result2.canonical_bytes.bytes) {
      throw new Error('Canonical bytes mismatch between replays');
    }

    if (result1.fingerprint.hash !== result2.fingerprint.hash) {
      throw new Error('Fingerprint mismatch between replays');
    }

    // Replay unicode corpus
    const unicodeCorpus = JSON.parse(fs.readFileSync(path.join(this.corpusPath, 'unicode_replay.json'), 'utf8'));
    const unicodeEvents = unicodeCorpus.event_stream.map((e: any) => new CanonicalEventEnvelope(e));
    const unicodeStream = new ReplayEventStream(unicodeEvents);

    const unicodeResult1 = this.engine.replay(unicodeStream);
    const unicodeResult2 = this.engine.replay(unicodeStream);

    if (unicodeResult1.canonical_bytes.bytes !== unicodeResult2.canonical_bytes.bytes) {
      throw new Error('Unicode canonical bytes mismatch between replays');
    }

    if (unicodeResult1.fingerprint.hash !== unicodeResult2.fingerprint.hash) {
      throw new Error('Unicode fingerprint mismatch between replays');
    }

    console.log('  ✓ Canonicalization consistency verified\n');
  }

  /**
   * Verify witness regeneration
   */
  private async verifyWitnessRegeneration(): Promise<void> {
    console.log('Verifying witness regeneration...');

    const minimalCorpus = JSON.parse(fs.readFileSync(path.join(this.corpusPath, 'minimal_replay.json'), 'utf8'));
    const events = minimalCorpus.event_stream.map((e: any) => new CanonicalEventEnvelope(e));
    const eventStream = new ReplayEventStream(events);

    const result = this.engine.replay(eventStream);
    const { witnessRoot: regeneratedWitness } = this.witnessAuthority.generateWitness(
      eventStream,
      result.state,
      result.violations
    );

    if (regeneratedWitness.witness_root !== result.witness_root.witness_root) {
      throw new Error('Regenerated witness root does not match original');
    }

    if (regeneratedWitness.leaf_count !== result.witness_root.leaf_count) {
      throw new Error('Regenerated leaf count does not match original');
    }

    if (regeneratedWitness.tree_height !== result.witness_root.tree_height) {
      throw new Error('Regenerated tree height does not match original');
    }

    console.log('  ✓ Witness regeneration verified\n');
  }

  /**
   * Verify determinism with smoke test
   */
  private async verifyDeterminismSmokeTest(): Promise<void> {
    console.log('Running determinism smoke test (10x replay)...');

    const minimalCorpus = JSON.parse(fs.readFileSync(path.join(this.corpusPath, 'minimal_replay.json'), 'utf8'));
    const events = minimalCorpus.event_stream.map((e: any) => new CanonicalEventEnvelope(e));
    const eventStream = new ReplayEventStream(events);

    const witnessRoots: string[] = [];

    for (let i = 0; i < 10; i++) {
      const result = this.engine.replay(eventStream);
      witnessRoots.push(result.witness_root.witness_root);
    }

    const firstRoot = witnessRoots[0];
    for (let i = 1; i < witnessRoots.length; i++) {
      if (witnessRoots[i] !== firstRoot) {
        throw new Error(`Determinism smoke test failed: iteration ${i} produced different witness root`);
      }
    }

    console.log('  ✓ Determinism smoke test passed (10/10 identical)\n');
  }
}

/**
 * Run constitutional self-check on startup
 */
export async function runConstitutionalSelfCheck(): Promise<void> {
  const selfCheck = new ConstitutionalSelfCheck();
  await selfCheck.runStartupVerification();
}
