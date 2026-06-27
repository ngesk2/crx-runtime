/**
 * Replay Authority Interface
 * Public interface for replay subsystem.
 * Only this interface crosses subsystem boundaries.
 */

export interface IReplayAuthority {
  generateReplayMetadata(
    stage: string,
    outputHash: string,
    transcriptId: string,
    canonicalTimestamp: string
  ): ReplayMetadata;
  generateTranscriptId(executionId: string): string;
  getCurrentSequence(): number;
  resetSequence(): void;
}

export interface ReplayMetadata {
  replayId: string;
  replayHash: string;
  replaySequence: number;
  transcriptId: string;
  checkpointId: string;
  timestamp: string;
  state: string;
}
