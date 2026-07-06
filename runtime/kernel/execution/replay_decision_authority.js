class ReplayDecisionAuthority {
  decide(event, artifact) {
    const verification = artifact.getStage('verification');
    if (!verification || !verification.verified) {
      return { type: 'none', priority: null, reason: 'Verification failed or missing' };
    }
    if (event.event_type === 'DOCUMENT_IMPORTED') {
      return { type: 'immediate', priority: 'high', reason: 'New document ingested' };
    }
    if (event.event_type === 'REPLAY_COMPLETED') {
      return { type: 'none', priority: null, reason: 'Replay already completed' };
    }
    if (event.event_type === 'CLAIM_CREATED' || event.event_type === 'CANDIDATE_CLAIM_CREATED') {
      return { type: 'deferred', priority: 'normal', reason: 'Derived artifact' };
    }
    if (event.event_type.startsWith('OBSERVATION_')) {
      return { type: 'background', priority: 'low', reason: 'Observational event' };
    }
    return { type: 'deferred', priority: 'normal', reason: 'Standard event' };
  }
}

module.exports = { ReplayDecisionAuthority };
