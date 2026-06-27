/**
 * Replay Transcript
 * Records the complete execution history for replay verification.
 */

import { ReplayEventEnvelope } from './event-envelope';
import { CanonicalClock } from '../identity/canonical-clock';

export interface ReplayTranscript {
  transcript_id: string;
  start_timestamp: string;
  end_timestamp: string;
  stages: string[];
  envelopes: ReplayEventEnvelope[];
  final_hash: string;
  verification_status: string;
}

export class ReplayTranscriptBuilder {
  private envelopes: ReplayEventEnvelope[] = [];
  private stages: Set<string> = new Set();
  private clock = CanonicalClock.getInstance();
  private startTimestamp: string;
  
  constructor() {
    this.startTimestamp = this.clock.now();
  }
  
  addEnvelope(envelope: ReplayEventEnvelope): void {
    this.envelopes.push(envelope);
    this.stages.add(envelope.stage);
  }
  
  build(transcriptId: string): ReplayTranscript {
    const endTimestamp = this.clock.now();
    const finalHash = this.computeFinalHash();
    
    return {
      transcript_id: transcriptId,
      start_timestamp: this.startTimestamp,
      end_timestamp: endTimestamp,
      stages: Array.from(this.stages),
      envelopes: this.envelopes,
      final_hash: finalHash,
      verification_status: 'pending',
    };
  }
  
  private computeFinalHash(): string {
    const hashes = this.envelopes.map(e => e.replay_metadata.replay_hash);
    return hashes.join('|');
  }
}
