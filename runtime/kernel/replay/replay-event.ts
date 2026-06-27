/**
 * Replay Event
 * Represents a single replay event in the constitutional pipeline.
 */

import { CanonicalObject } from '../identity/canonical-object';
import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';

export interface ReplayEvent {
  event_id: string;
  timestamp: string;
  event_type: 'stage_execution' | 'validation' | 'witness_generation' | 'verification';
  stage: string;
  input: CanonicalObject;
  output: CanonicalObject;
  metadata: Record<string, unknown>;
}

export class ReplayEventBuilder {
  private identityService = CanonicalIdentityService.getInstance();
  private clock = CanonicalClock.getInstance();
  
  buildEvent(
    event_type: 'stage_execution' | 'validation' | 'witness_generation' | 'verification',
    stage: string,
    input: CanonicalObject,
    output: CanonicalObject,
    metadata: Record<string, unknown> = {}
  ): ReplayEvent {
    const timestamp = this.clock.now();
    return {
      event_id: this.identityService.generateEventId(event_type, timestamp),
      timestamp,
      event_type,
      stage,
      input,
      output,
      metadata,
    };
  }
}
