/**
 * EXPRESS COMMIT ADAPTER
 * 
 * Infrastructure adapter for Express HTTP API.
 * Depends on kernel/replay/ for replay verification.
 * kernel/replay/ NEVER depends on this adapter.
 */

import { CanonicalEventEnvelope } from '../kernel/replay/canonical_event_envelope';
import { ReplayVerification } from '../kernel/replay/replay_verification';
import { ReplayEventStream } from '../kernel/replay/replay_event_stream';

export class ExpressCommitAdapter {
  private replayVerification: ReplayVerification;

  constructor() {
    this.replayVerification = new ReplayVerification();
  }

  async handleCommitRequest(req: any, res: any): Promise<void> {
    try {
      const event = new CanonicalEventEnvelope(req.body);
      const eventStream = new ReplayEventStream([event]);
      
      // Verify replay determinism
      const isDeterministic = this.replayVerification.verifyReproducibility(eventStream);
      
      if (!isDeterministic) {
        res.status(400).json({ error: 'Replay determinism verification failed' });
        return;
      }
      
      // Process commit
      res.status(200).json({ success: true, event_id: event.getEventId() });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
