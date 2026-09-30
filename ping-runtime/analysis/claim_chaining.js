/**
 * Claim -> Mission chaining (bounded analysis behavior).
 *
 * Forensics fix (2026-09-30, "forensics fix it", item 5 / §1 row 14 / §2
 * arrow 18): the chaining RULE ("unverified claim -> next
 * INTELLIGENCE_RESEARCH / EXPERIMENT_RUN mission") is not encoded anywhere
 * yet. This module encodes it as a bounded worker-side behavior — not a
 * store, not an authority.
 *
 * Path (no forks):
 *  - Subscribes to CLAIM_CREATED via UnifiedEventRuntime.on(), the same
 *    subscription mechanism EventToMissionBridge uses. It does NOT modify
 *    the bridge, the workers, or the scheduler.
 *  - Proposes the next mission via MissionRuntime.create() — the canonical
 *    mission truth (L3 §6). The mission row IS the durable next-question
 *    record; MissionScheduler picks it up on its poll.
 *  - Correlation/causation lineage: the mission payload carries the claim
 *    event's correlation_id (root of the chain) and causation_id (the claim
 *    event itself), mirroring the bridge's lineage contract.
 *
 * Mission labels: INTELLIGENCE_RESEARCH / EXPERIMENT_RUN are bounded label
 * vocabulary from the forensics (mission_type is free-form on
 * MissionRuntime). Coordination point: if Writer A's lane lands a label
 * registry with different literals, adopt those; the selection logic here
 * (RESEARCH vs EXPERIMENT) stays the same.
 *
 * Bounds:
 *  - One mission per claim event: MissionRuntime.create() is idempotent on
 *    (tenant, missionType, event_id), so replays never duplicate.
 *  - Settled claims (verdict CONFIRMED/SUPPORTED, verified:true) do NOT
 *    chain. Everything else is "unverified/remaining" — today the claim
 *    payload is thin (no verdict), so all claims chain exactly once; when
 *    Writer A lands the verdict vocabulary, settled claims stop chaining
 *    with no code change here.
 *  - The mission is a proposal: the scheduler skips mission types with no
 *    registered worker, so nothing executes until a research worker
 *    declares the label. No phantom execution.
 */

const MISSION_LABELS = Object.freeze({
  INTELLIGENCE_RESEARCH: 'INTELLIGENCE_RESEARCH',
  EXPERIMENT_RUN: 'EXPERIMENT_RUN',
});

// Verdicts that settle a claim: no follow-up research mission is proposed.
// (Forensics §1 row 3: CONFIRMED/REFUTED/UNCLEAR; §1 row 7:
// SUPPORTED/FALSIFIED/INCONCLUSIVE. Writer A lane owns the literals;
// read them here so settled claims stop chaining once they land.)
const SETTLED_VERDICTS = new Set(['CONFIRMED', 'SUPPORTED']);
const UNSETTLED_VERDICTS = new Set(['UNCLEAR', 'INCONCLUSIVE', 'REFUTED', 'FALSIFIED', 'UNVERIFIED']);

function _claimBody(payload) {
  const p = payload || {};
  return (p.claim && typeof p.claim === 'object' ? p.claim : p);
}

/**
 * Pure rule: does this CLAIM_CREATED payload need a follow-up research mission?
 * Exported for tests and for reuse by any worker that wants the same rule.
 */
function needsFollowupResearch(payload) {
  const claim = _claimBody(payload);
  const verdict = typeof claim.verdict === 'string' ? claim.verdict.toUpperCase() : null;
  if (verdict && SETTLED_VERDICTS.has(verdict)) return false;
  if (claim.verified === true || claim.status === 'verified') return false;
  // No verdict at all, or an unsettled verdict, or verified === false:
  // the claim is unverified/remaining.
  return true;
}

/**
 * Select the follow-up mission label for a claim.
 * EXPERIMENT_RUN only when the claim is explicitly an experiment hypothesis;
 * otherwise INTELLIGENCE_RESEARCH (the §6.1 training-mission shape).
 */
function selectMissionLabel(payload) {
  const claim = _claimBody(payload);
  if (claim.experiment_hypothesis === true || claim.hypothesis_for_experiment === true) {
    return MISSION_LABELS.EXPERIMENT_RUN;
  }
  return MISSION_LABELS.INTELLIGENCE_RESEARCH;
}

/**
 * Build the §6.1 research-mission payload from a CLAIM_CREATED event.
 */
function buildResearchMissionPayload(claimEvent, missionLabel) {
  const claimPayload = claimEvent.payload || {};
  const claim = _claimBody(claimPayload);
  const claimText = claim.text || claim.statement || claim.assertion || claim.title || '(claim text not provided)';
  const correlationId = (claimEvent.metadata && claimEvent.metadata.correlation_id)
    || claimEvent.correlation_id
    || claimEvent.event_id;

  return {
    event_id: claimEvent.event_id,
    event_type: missionLabel,
    source: 'claim-mission-chainer',
    namespace: claimEvent.namespace,
    // Lineage: causation = the claim event; correlation = the chain root.
    causation_id: claimEvent.event_id,
    correlation_id: correlationId,
    confidence: (claimEvent.metadata && claimEvent.metadata.confidence != null)
      ? claimEvent.metadata.confidence : null,
    // §6.1 mission template fields.
    research: {
      questions: [`Is the following claim true? ${claimText}`],
      claims_to_verify: [{
        claim_event_id: claimEvent.event_id,
        document_id: claimPayload.documentId || claim.documentId || null,
        text: claimText,
        verdict: claim.verdict || null,
      }],
      evidence_requirements: [
        'primary sources preferred (a live call beats docs; docs beat marketing prose)',
        'every verdict needs evidence URLs',
      ],
      output_schema: { verdict: 'CONFIRMED | REFUTED | UNCLEAR', evidence_urls: [], grade: '' },
      synthesis_rule: 'grade evidence honestly; surface conflicts, never average them away',
    },
    payload: claimPayload,
  };
}

class ClaimMissionChainer {
  /**
   * @param {object} options
   * @param {object} options.eventRuntime — UnifiedEventRuntime (subscribe only)
   * @param {object} options.missionRuntime — MissionRuntime (propose missions)
   * @param {number} [options.priority=2]
   * @param {number} [options.maxRecent=1000] — bound on the in-memory dedupe set
   */
  constructor(options = {}) {
    this._eventRuntime = options.eventRuntime || null;
    this._missionRuntime = options.missionRuntime || null;
    this._priority = options.priority != null ? options.priority : 2;
    this._maxRecent = options.maxRecent || 1000;
    this._recent = new Set();
    this._stats = { claimsSeen: 0, missionsProposed: 0, skippedSettled: 0, skippedDuplicate: 0 };
  }

  start() {
    if (!this._eventRuntime || !this._missionRuntime) {
      console.log('[ClaimMissionChainer] Degraded — missing eventRuntime or missionRuntime');
      return;
    }
    this._eventRuntime.on('CLAIM_CREATED', (event) => this._onClaim(event));
    console.log('[ClaimMissionChainer] Listening for CLAIM_CREATED');
  }

  async _onClaim(claimEvent) {
    this._stats.claimsSeen++;
    const claimPayload = claimEvent.payload || {};
    if (!needsFollowupResearch(claimPayload)) {
      this._stats.skippedSettled++;
      return null;
    }
    const dedupeKey = `${claimEvent.tenant_id || 'UNKNOWN'}:${claimEvent.event_id}`;
    if (this._recent.has(dedupeKey)) {
      this._stats.skippedDuplicate++;
      return null;
    }
    const missionLabel = selectMissionLabel(claimPayload);
    const missionPayload = buildResearchMissionPayload(claimEvent, missionLabel);
    const missionId = await this._missionRuntime.create(missionLabel, missionPayload, {
      priority: this._priority,
      createdBy: 'claim-mission-chainer',
      // Tenant threads from the triggering event (bridge precedent).
      tenant_id: claimEvent.tenant_id || 'UNKNOWN',
    });
    this._recent.add(dedupeKey);
    if (this._recent.size > this._maxRecent) {
      const oldest = this._recent.values().next().value;
      this._recent.delete(oldest);
    }
    this._stats.missionsProposed++;
    console.log(`[ClaimMissionChainer] CLAIM_CREATED ${claimEvent.event_id} -> ${missionLabel} mission ${missionId}`);
    return missionId;
  }

  getStats() {
    return { ...this._stats, scope: 'session' };
  }
}

module.exports = {
  MISSION_LABELS,
  SETTLED_VERDICTS,
  UNSETTLED_VERDICTS,
  needsFollowupResearch,
  selectMissionLabel,
  buildResearchMissionPayload,
  ClaimMissionChainer,
};
