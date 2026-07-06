/**
 * Replay Worker
 * 
 * Thin adapter for replay operations.
 * Delegates to ReplayAuthority.
 */

const { BaseWorker } = require('./base_worker');
const { CanonicalBytes } = require('./canonical_authority');

class ReplayWorker extends BaseWorker {
  constructor(workerId, dependencies = {}) {
    super(workerId, 'replay', dependencies);
    this._replayAuthority = dependencies.replayAuthority;
  }

  async process(job) {
    const payload = CanonicalBytes.deserialize(job.payload);
    return await this._transactionBoundary.execute(async (tx) => {
      const result = await this._replayAuthority.replay(payload.transcript_id, { tx });
      await tx.outbox.append('REPLAY_COMPLETED', payload.transcript_id, 'REPLAY', result, 'ReplayAuthority');
      return result;
    });
  }
}

module.exports = { ReplayWorker };
