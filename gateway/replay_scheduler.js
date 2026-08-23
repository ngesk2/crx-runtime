const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class ReplayScheduler {
  constructor() {
    this._schedule = []; // pending replay decisions
  }

  _decide(event, verificationResult) {
    if (!verificationResult.verified) {
      return { type: 'none', reason: 'Verification failed — no replay' };
    }
    if (event.event_type === 'DOCUMENT_IMPORTED') {
      return { type: 'immediate', priority: 'high', reason: 'New document ingested' };
    }
    if (event.event_type === 'REPLAY_COMPLETED') {
      return { type: 'none', reason: 'Replay already completed' };
    }
    return { type: 'deferred', priority: 'normal', reason: 'Standard event' };
  }

  async schedule(event, verificationResult) {
    const decision = this._decide(event, verificationResult);
    const entry = {
      eventId: event.event_id,
      eventType: event.event_type,
      decision,
      scheduledAt: constitutionalTimeAuthority.now()
    };
    this._schedule.push(entry);
    return entry;
  }

  getPending() {
    return this._schedule.filter(s => s.decision.type !== 'none');
  }

  getSchedule() {
    return this._schedule;
  }
}

module.exports = { ReplayScheduler };
