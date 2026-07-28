/**
 * Replay Authority
 * Replay owns ReplayID, ReplayHash, ReplaySequence, TranscriptID, CheckpointID.
 * Other services read these values but never write them.
 * Replay never observes runtime clock - receives CanonicalTimestamp.
 */

import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';

export interface ReplayMetadata {
  replayId: string;
  replayHash: string;
  replaySequence: number;
  transcriptId: string;
  checkpointId: string;
  timestamp: string;
  state: string;
}

export class ReplayAuthority {
  private identityService = CanonicalIdentityService.getInstance();
  private currentSequence: number = 0;
  
  /**
   * Generate replay metadata (authoritative)
   * Pure function: (canonicalTimestamp, sequence, stateHash) → ReplayMetadata
   */
  generateReplayMetadata(
    stage: string,
    outputHash: string,
    transcriptId: string,
    canonicalTimestamp: string
  ): ReplayMetadata {
    this.currentSequence++;
    
    return {
      replayId: this.identityService.generateReplayId(stage, outputHash),
      replayHash: outputHash,
      replaySequence: this.currentSequence,
      transcriptId,
      checkpointId: this.generateCheckpointId(transcriptId, this.currentSequence),
      timestamp: canonicalTimestamp,
      state: 'completed',
    };
  }
  
  /**
   * Generate transcript ID (authoritative)
   */
  generateTranscriptId(executionId: string): string {
    return this.identityService.generateUUIDv5('transcript', executionId);
  }
  
  /**
   * Generate checkpoint ID (authoritative)
   */
  private generateCheckpointId(transcriptId: string, sequence: number): string {
    return this.identityService.generateUUIDv5('checkpoint', `${transcriptId}:${sequence}`);
  }
  
  /**
   * Read-only access to current sequence
   */
  getCurrentSequence(): number {
    return this.currentSequence;
  }
  
  /**
   * Reset sequence (for testing only)
   */
  resetSequence(): void {
    this.currentSequence = 0;
  }
}
