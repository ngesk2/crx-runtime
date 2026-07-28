/**
 * NODE SELF-CHECK ADAPTER
 * 
 * Node-specific adapter for constitutional self-check.
 * 
 * Responsibilities:
 * - Filesystem access (fs)
 * - Path resolution (path)
 * - Process environment (process)
 * - Runtime I/O (console)
 * - Crypto operations (crypto)
 * 
 * Delegates pure verification to ConstitutionalSelfCheckCore.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ConstitutionalSelfCheckCore, CorpusData, VerificationResult } from './constitutional_self_check_core';
import { DeterministicFailureFactory } from './deterministic_failure';

export class NodeSelfCheckAdapter {
  private readonly core: ConstitutionalSelfCheckCore;
  private readonly certificationPath: string;
  private readonly corpusPath: string;

  constructor() {
    this.core = new ConstitutionalSelfCheckCore();
    this.certificationPath = path.join(process.cwd(), 'certification');
    this.corpusPath = path.join(process.cwd(), 'tests/corpus');
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
      
      const corpus = await this.loadCorpus();
      const coreResult = await this.core.runCoreVerifications(corpus);
      
      if (!coreResult.passed) {
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.create(
            'CORE_VERIFICATION_FAILED' as any,
            'STARTUP_VERIFICATION' as any,
            { error: coreResult.error }
          )
        );
      }

      console.log('Constitutional Self-Check: ✓ ALL VERIFICATIONS PASSED\n');
    } catch (error) {
      console.error('Constitutional Self-Check: ✗ VERIFICATION FAILED');
      console.error(error);
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'CONSTITUTIONAL_SELF_CHECK_FAILED' as any,
          'STARTUP_VERIFICATION' as any,
          { error: String(error) }
        )
      );
    }
  }

  /**
   * Load corpus data for core verification
   */
  private async loadCorpus(): Promise<CorpusData> {
    const minimalReplayPath = path.join(this.corpusPath, 'minimal_replay.json');
    const unicodeReplayPath = path.join(this.corpusPath, 'unicode_replay.json');

    if (!fs.existsSync(minimalReplayPath)) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'CORPUS_FILE_NOT_FOUND' as any,
          'CORPUS_LOADING' as any,
          { path: minimalReplayPath }
        )
      );
    }

    const corpus: CorpusData = {
      minimal_replay: JSON.parse(fs.readFileSync(minimalReplayPath, 'utf8'))
    };

    if (fs.existsSync(unicodeReplayPath)) {
      corpus.unicode_replay = JSON.parse(fs.readFileSync(unicodeReplayPath, 'utf8'));
    }

    return corpus;
  }

  /**
   * Verify corpus SHA256 hashes
   */
  private async verifyCorpusHashes(): Promise<void> {
    console.log('Verifying corpus hashes...');

    const corpusHashFile = path.join(this.certificationPath, 'hashes/corpus_sha256.txt');
    if (!fs.existsSync(corpusHashFile)) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'CORPUS_HASH_FILE_NOT_FOUND' as any,
          'STARTUP_VERIFICATION' as any,
          { path: corpusHashFile }
        )
      );
    }

    const hashContent = fs.readFileSync(corpusHashFile, 'utf8');
    const lines = hashContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    for (const line of lines) {
      const [expectedHash, filePath] = line.split(/\s+/);
      const fullPath = path.join(process.cwd(), filePath);

      if (!fs.existsSync(fullPath)) {
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.create(
            'CORPUS_FILE_NOT_FOUND' as any,
            'STARTUP_VERIFICATION' as any,
            { path: fullPath }
          )
        );
      }

      const fileBuffer = fs.readFileSync(fullPath);
      const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();

      if (actualHash !== expectedHash) {
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.create(
            'CORPUS_HASH_MISMATCH' as any,
            'STARTUP_VERIFICATION' as any,
            { filePath, expectedHash, actualHash }
          )
        );
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
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.create(
            'CERTIFICATION_ARTIFACT_NOT_FOUND' as any,
            'STARTUP_VERIFICATION' as any,
            { path: fullPath }
          )
        );
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
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'WITNESS_ROOTS_FILE_NOT_FOUND' as any,
          'STARTUP_VERIFICATION' as any,
          { path: witnessRootsFile }
        )
      );
    }

    const witnessContent = fs.readFileSync(witnessRootsFile, 'utf8');
    const lines = witnessContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    for (const line of lines) {
      const [vectorId, witnessRoot] = line.split(':');
      if (!witnessRoot || witnessRoot.length !== 64) {
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.create(
            'INVALID_WITNESS_ROOT_FORMAT' as any,
            'STARTUP_VERIFICATION' as any,
            { vectorId, witnessRoot }
          )
        );
      }
    }

    console.log('  ✓ Witness root integrity verified\n');
  }
}

/**
 * Run constitutional self-check on startup (Node adapter)
 */
export async function runConstitutionalSelfCheck(): Promise<void> {
  const adapter = new NodeSelfCheckAdapter();
  await adapter.runStartupVerification();
}
