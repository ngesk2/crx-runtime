/**
 * Contradiction detection (bounded analysis behavior).
 *
 * Forensics fix (2026-09-30, "forensics fix it", item 5 / §1 row 3 + §2
 * arrow 6): conflicting claims must be surfaced together for review. There
 * is no dedicated contradiction primitive — this is bounded analysis over
 * claims plus human review, exactly as the walkthrough prescribes.
 *
 * Path (no forks):
 *  - Subscribes to CLAIM_CREATED via UnifiedEventRuntime.on() — the same
 *    event the ClassificationWorker consumes (canonical_workers.js
 *    registration). It does NOT modify ClassificationWorker or fork its
 *    path; it is an additional listener on the same event.
 *  - Surfaces a conflict by emitting CONTRADICTION_SURFACED through the
 *    single emit() choke point, with BOTH claims in one payload so a
 *    reviewer sees them together. Review itself is human (Nolan) or a
 *    downstream review worker — never this module: it detects, it never
 *    decides which claim is true. NO authority, NONE-BY-DESIGN.
 *
 * Bounds:
 *  - In-memory ring window (default 500 claims); old claims age out.
 *  - One surfaced event per claim pair: logical_id
 *    `contradiction:<a>:<b>` makes re-detection idempotent at the spine.
 *  - Detection is syntactic and explicit: opposing verdicts on the same
 *    subject key, verified:true vs verified:false on the same subject key,
 *    or an explicit contradicts/negates link. It never invents conflicts
 *    from vague textual similarity.
 */

const CONTRADICTION_SURFACED = 'CONTRADICTION_SURFACED';
const DETECTOR_SOURCE = 'contradiction-detector';

const POSITIVE_VERDICTS = new Set(['CONFIRMED', 'SUPPORTED']);
const NEGATIVE_VERDICTS = new Set(['REFUTED', 'FALSIFIED']);

function _upper(v) {
  return typeof v === 'string' ? v.toUpperCase() : null;
}

function _claimBody(payload) {
  const p = payload || {};
  return (p.claim && typeof p.claim === 'object' ? p.claim : p);
}

function _normalize(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

/**
 * Subject key for a CLAIM_CREATED event. Two claims conflict only when
 * they talk about the same thing: same document plus same normalized
 * subject/text. Returns null when there is nothing to key on (a bare
 * documentId alone is not enough — different claims about one document
 * are not contradictions).
 */
function subjectKey(event) {
  const payload = event.payload || {};
  const claim = _claimBody(payload);
  const doc = payload.documentId || claim.documentId || '';
  const subject = _normalize(claim.subject || claim.topic || claim.entity_id);
  const text = _normalize(claim.text || claim.statement || claim.assertion || claim.title);
  const about = subject || text;
  if (!about) return null;
  return `${doc}::${about}`;
}

function _summarize(event) {
  const payload = event.payload || {};
  const claim = _claimBody(payload);
  return {
    event_id: event.event_id,
    document_id: payload.documentId || claim.documentId || null,
    verdict: _upper(claim.verdict),
    verified: claim.verified === true ? true : claim.verified === false ? false : null,
    text: claim.text || claim.statement || claim.assertion || claim.title || null,
    subject: claim.subject || claim.topic || null,
  };
}

/**
 * Pure rule: given a new CLAIM_CREATED event and the recent-claims window,
 * return the conflicting event (or null). Exported for tests.
 */
function findContradiction(newEvent, window) {
  const payload = newEvent.payload || {};
  const claim = _claimBody(payload);

  // Rule 1: explicit contradicts/negates link — strongest signal.
  const links = []
    .concat(claim.contradicts_event_id || [])
    .concat(claim.negates_event_id || [])
    .concat(claim.contradicts || [])
    .filter(Boolean);
  for (const link of links) {
    const other = window.find((e) => e.event_id === link && e.event_id !== newEvent.event_id);
    if (other) return other;
  }

  // Rule 2: opposing verdicts / verified flags on the same subject key.
  const key = subjectKey(newEvent);
  if (!key) return null;
  const verdict = _upper(claim.verdict);
  const verified = claim.verified;
  for (const other of window) {
    if (other.event_id === newEvent.event_id) continue;
    if (subjectKey(other) !== key) continue;
    const oClaim = _claimBody(other.payload || {});
    const oVerdict = _upper(oClaim.verdict);
    if (verdict && oVerdict
      && ((POSITIVE_VERDICTS.has(verdict) && NEGATIVE_VERDICTS.has(oVerdict))
        || (NEGATIVE_VERDICTS.has(verdict) && POSITIVE_VERDICTS.has(oVerdict)))) {
      return other;
    }
    if ((verified === true && oClaim.verified === false)
      || (verified === false && oClaim.verified === true)) {
      return other;
    }
  }
  return null;
}

class ContradictionDetector {
  /**
   * @param {object} options
   * @param {object} options.eventRuntime — UnifiedEventRuntime (subscribe + emit)
   * @param {number} [options.windowSize=500] — bound on the recent-claims ring
   */
  constructor(options = {}) {
    this._eventRuntime = options.eventRuntime || null;
    this._windowSize = options.windowSize || 500;
    this._window = [];
    this._stats = { claimsSeen: 0, contradictionsSurfaced: 0 };
  }

  start() {
    if (!this._eventRuntime) {
      console.log('[ContradictionDetector] Degraded — missing eventRuntime');
      return;
    }
    this._eventRuntime.on('CLAIM_CREATED', (event) => this._onClaim(event));
    console.log('[ContradictionDetector] Listening for CLAIM_CREATED');
  }

  async _onClaim(event) {
    this._stats.claimsSeen++;
    const other = findContradiction(event, this._window);
    this._push(event);
    if (!other) return null;

    const a = _summarize(other);
    const b = _summarize(event);
    const pair = [a.event_id, b.event_id].sort().join(':');
    const correlationId = (event.metadata && event.metadata.correlation_id)
      || event.correlation_id
      || event.event_id;

    const res = await this._eventRuntime.emit(CONTRADICTION_SURFACED, DETECTOR_SOURCE, {
      claim_a: a,
      claim_b: b,
      subject_key: subjectKey(event),
      detected_by: DETECTOR_SOURCE,
      review: 'human', // surfaced for review; the detector never decides truth
    }, {
      logical_id: `contradiction:${pair}`,
      causation_id: event.event_id,
      correlation_id: correlationId,
      namespace: event.namespace,
      tenant_id: event.tenant_id,
    });
    if (res && res.status === 'ok') {
      this._stats.contradictionsSurfaced++;
      console.log(`[ContradictionDetector] Surfaced contradiction ${a.event_id} <-> ${b.event_id}`);
    }
    return res;
  }

  _push(event) {
    this._window.push(event);
    while (this._window.length > this._windowSize) this._window.shift();
  }

  getStats() {
    return { ...this._stats, scope: 'session', windowSize: this._window.length };
  }
}

module.exports = {
  CONTRADICTION_SURFACED,
  DETECTOR_SOURCE,
  subjectKey,
  findContradiction,
  ContradictionDetector,
};
