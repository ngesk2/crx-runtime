/**
 * Replay Verifier
 * Verifies replay transcripts for constitutional compliance.
 */

import { ReplayTranscript } from '../replay/replay-transcript';
import { ReplayEventEnvelope } from '../replay/event-envelope';

export interface ReplayVerificationResult {
  transcriptId: string;
  timestamp: string;
  status: 'verified' | 'failed';
  errors: string[];
  warnings: string[];
  stageResults: StageVerificationResult[];
}

export interface StageVerificationResult {
  stage: string;
  status: 'verified' | 'failed';
  errors: string[];
  warnings: string[];
}

export class ReplayVerifier {
  async verifyTranscript(transcript: ReplayTranscript): Promise<ReplayVerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const stageResults: StageVerificationResult[] = [];
    
    // Verify transcript structure
    if (!transcript.transcript_id) {
      errors.push('Transcript missing ID');
    }
    
    if (!transcript.start_timestamp) {
      errors.push('Transcript missing start timestamp');
    }
    
    if (!transcript.end_timestamp) {
      errors.push('Transcript missing end timestamp');
    }
    
    if (transcript.envelopes.length === 0) {
      errors.push('Transcript has no envelopes');
    }
    
    // Verify each envelope
    for (const envelope of transcript.envelopes) {
      const stageResult = await this.verifyEnvelope(envelope);
      stageResults.push(stageResult);
      
      if (stageResult.status === 'failed') {
        errors.push(...stageResult.errors);
      }
      warnings.push(...stageResult.warnings);
    }
    
    // Verify stage sequence
    const stageSequence = this.extractStageSequence(transcript);
    if (!this.isValidStageSequence(stageSequence)) {
      warnings.push('Stage sequence may be invalid');
    }
    
    return {
      transcriptId: transcript.transcript_id,
      timestamp: new Date().toISOString(),
      status: errors.length === 0 ? 'verified' : 'failed',
      errors,
      warnings,
      stageResults,
    };
  }
  
  private async verifyEnvelope(envelope: ReplayEventEnvelope): Promise<StageVerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!envelope.envelope_id) {
      errors.push('Envelope missing ID');
    }
    
    if (!envelope.stage) {
      errors.push('Envelope missing stage');
    }
    
    if (!envelope.replay_metadata.replay_id) {
      errors.push('Envelope missing replay ID');
    }
    
    if (!envelope.replay_metadata.replay_hash) {
      errors.push('Envelope missing replay hash');
    }
    
    if (!envelope.witness_metadata.witness_id) {
      warnings.push('Envelope missing witness ID');
    }
    
    return {
      stage: envelope.stage,
      status: errors.length === 0 ? 'verified' : 'failed',
      errors,
      warnings,
    };
  }
  
  private extractStageSequence(transcript: ReplayTranscript): string[] {
    return transcript.envelopes.map(e => e.stage);
  }
  
  private isValidStageSequence(stages: string[]): boolean {
    // Placeholder for stage sequence validation
    return stages.length > 0;
  }
}
