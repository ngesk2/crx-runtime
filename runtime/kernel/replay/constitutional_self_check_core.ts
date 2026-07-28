/**
 * CONSTITUTIONAL SELF-CHECK CORE
 * 
 * Pure verification logic for constitutional replay kernel.
 * 
 * Constitutional rule: ZERO host dependencies
 * - NO fs
 * - NO path
 * - NO process
 * - NO crypto
 * - NO console
 * 
 * Verifications:
 * - Canonicalization consistency test
 * - Witness regeneration spot check
 * - Determinism smoke test
 * 
 * Note: Corpus hash verification and certification artifact verification
 * require host filesystem access and are handled by the adapter layer.
 */

import { ReplayEventStream } from './replay_event_stream';
import { CanonicalEventEnvelope } from './canonical_event_envelope';
import { DeterministicReplayEngine } from './deterministic_replay_engine';
import { WitnessAuthority } from './witness_authority';
import { DeterministicFailureFactory } from './deterministic_failure';

export interface VerificationResult {
  passed: boolean;
  error?: string;
}

export interface CorpusData {
  minimal_replay: any;
  unicode_replay?: any;
}

export class ConstitutionalSelfCheckCore {
  private readonly engine: DeterministicReplayEngine;
  private readonly witnessAuthority: WitnessAuthority;

  constructor() {
    this.engine = new DeterministicReplayEngine();
    this.witnessAuthority = new WitnessAuthority();
  }

  /**
   * Run all core verifications
   * Returns verification result - does not throw
   */
  async runCoreVerifications(corpus: CorpusData): Promise<VerificationResult> {
    try {
      await this.verifyCanonicalizationConsistency(corpus);
      await this.verifyWitnessRegeneration(corpus);
      await this.verifyDeterminismSmokeTest(corpus);
      return { passed: true };
    } catch (error) {
      return { passed: false, error: String(error) };
    }
  }

  /**
   * Verify canonicalization consistency
   */
  private async verifyCanonicalizationConsistency(corpus: CorpusData): Promise<void> {
    if (!corpus.minimal_replay) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'CORPUS_DATA_MISSING' as any,
          'CANONICALIZATION_CONSISTENCY' as any,
          { field: 'minimal_replay' }
        )
      );
    }

    const events = corpus.minimal_replay.event_stream.map((e: any) => new CanonicalEventEnvelope(e));
    const eventStream = new ReplayEventStream(events);

    const result1 = this.engine.replay(eventStream);
    const result2 = this.engine.replay(eventStream);

    if (result1.canonical_bytes.bytes !== result2.canonical_bytes.bytes) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'CANONICAL_BYTES_MISMATCH' as any,
          'CANONICALIZATION_CONSISTENCY' as any,
          {}
        )
      );
    }

    if (result1.fingerprint.hash !== result2.fingerprint.hash) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'FINGERPRINT_MISMATCH' as any,
          'CANONICALIZATION_CONSISTENCY' as any,
          {}
        )
      );
    }

    // Replay unicode corpus if available
    if (corpus.unicode_replay) {
      const unicodeEvents = corpus.unicode_replay.event_stream.map((e: any) => new CanonicalEventEnvelope(e));
      const unicodeStream = new ReplayEventStream(unicodeEvents);

      const unicodeResult1 = this.engine.replay(unicodeStream);
      const unicodeResult2 = this.engine.replay(unicodeStream);

      if (unicodeResult1.canonical_bytes.bytes !== unicodeResult2.canonical_bytes.bytes) {
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.create(
            'UNICODE_CANONICAL_BYTES_MISMATCH' as any,
            'CANONICALIZATION_CONSISTENCY' as any,
            {}
          )
        );
      }

      if (unicodeResult1.fingerprint.hash !== unicodeResult2.fingerprint.hash) {
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.create(
            'UNICODE_FINGERPRINT_MISMATCH' as any,
            'CANONICALIZATION_CONSISTENCY' as any,
            {}
          )
        );
      }
    }
  }

  /**
   * Verify witness regeneration
   */
  private async verifyWitnessRegeneration(corpus: CorpusData): Promise<void> {
    if (!corpus.minimal_replay) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'CORPUS_DATA_MISSING' as any,
          'WITNESS_REGENERATION' as any,
          { field: 'minimal_replay' }
        )
      );
    }

    const events = corpus.minimal_replay.event_stream.map((e: any) => new CanonicalEventEnvelope(e));
    const eventStream = new ReplayEventStream(events);

    const result = this.engine.replay(eventStream);
    const { witnessRoot: regeneratedWitness } = this.witnessAuthority.generateWitness(
      eventStream,
      result.state,
      result.violations
    );

    if (regeneratedWitness.witness_root !== result.witness_root.witness_root) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'REGENERATED_WITNESS_ROOT_MISMATCH' as any,
          'WITNESS_REGENERATION' as any,
          {}
        )
      );
    }

    if (regeneratedWitness.leaf_count !== result.witness_root.leaf_count) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'REGENERATED_LEAF_COUNT_MISMATCH' as any,
          'WITNESS_REGENERATION' as any,
          {}
        )
      );
    }

    if (regeneratedWitness.tree_height !== result.witness_root.tree_height) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'REGENERATED_TREE_HEIGHT_MISMATCH' as any,
          'WITNESS_REGENERATION' as any,
          {}
        )
      );
    }
  }

  /**
   * Verify determinism with replay independence test
   */
  private async verifyDeterminismSmokeTest(corpus: CorpusData): Promise<void> {
    if (!corpus.minimal_replay) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'CORPUS_DATA_MISSING' as any,
          'DETERMINISM_VERIFICATION' as any,
          { field: 'minimal_replay' }
        )
      );
    }

    const witnessRoots: string[] = [];

    for (let i = 0; i < 1000; i++) {
      const corpusClone = JSON.parse(JSON.stringify(corpus.minimal_replay));
      const events = corpusClone.event_stream.map((e: any) => new CanonicalEventEnvelope(e));
      const eventStream = new ReplayEventStream(events);
      const freshEngine = new DeterministicReplayEngine();
      const freshWitnessAuthority = new WitnessAuthority();
      const result = freshEngine.replay(eventStream);
      witnessRoots.push(result.witness_root.witness_root);
    }

    const firstRoot = witnessRoots[0];
    for (let i = 1; i < witnessRoots.length; i++) {
      if (witnessRoots[i] !== firstRoot) {
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.create(
            'REPLAY_INDEPENDENCE_TEST_FAILED' as any,
            'DETERMINISM_VERIFICATION' as any,
            { iteration: i, expectedRoot: firstRoot, actualRoot: witnessRoots[i] }
          )
        );
      }
    }
  }
}
