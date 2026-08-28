/**
 * Priority Boundary — ADAPTER ONLY
 *
 * Normalizes all incoming priority representations to the canonical int 0-3
 * scale used by the production execution spine (bridge → scheduler → missions).
 *
 * [DOC-CONTRACT] Canonical live priority contract:
 *   - Single scale: int 0-3, HIGHER = MORE URGENT (0=system, 3=revenue-critical).
 *   - Single ingress: canonicalPriority() — applied ONLY at the bridge
 *     (event_to_mission_bridge.js, mapping.priority → mission payload priority).
 *   - Persisted as ping_missions.priority INT, ordered `priority DESC`
 *     (mission_runtime.getPending) — consistent with higher=more urgent.
 *   - The scheduler reads the persisted int column; it NEVER recomputes priority
 *     from payload at dispatch time. Downstream (workers, scheduler) never read
 *     a payload string/number priority — payload string priority is
 *     LIVE-PRODUCED but EXECUTION-INERT (Classification/Recommendation emit
 *     'urgent'|'high'|... strings that are carried in payload but never consulted
 *     for ping_missions.priority nor scheduler ordering).
 *   - Harmless legacy/default note (zero behavior change): mission_runtime.js
 *     column `DEFAULT 0` (routine) vs canonicalPriority(null)=1. The bridge
 *     NEVER passes null (it always has an EVENT_MISSION_MAP int), so the
 *     `DEFAULT 0` and the `?? 1` fallback never diverge on the live path.
 *
 * Canonical scale:
 *   0 = system maintenance (health checks, audit)
 *   1 = routine updates (emails sent, invoices paid, review acknowledgements)
 *   2 = new-entity processing (customer/project created, estimates prepared)
 *   3 = revenue-critical (leads, estimate followups, invoice followups, reviews)
 *
 * This boundary exists so that dormant priority scales (Orca int 1-10,
 * IntelligenceWorker strings, mission_compiler computed values) can be wired
 * into the production path WITHOUT modifying the bridge, scheduler, or
 * mission_runtime. The adapter is the single conversion point.
 *
 * RULE: No new business logic in this module. It maps values, nothing else.
 *
 * Reference: docs/P3_CONTRADICTION_CONVERGENCE_LEDGER.md (audit B).
 */

// ─── Conversion tables ───────────────────────────────────────────

/**
 * Orca scale: int 1-10 → canonical int 0-3
 *
 * Orca thresholds (engine.js):
 *   >= 8 → consensus (3 workers)
 *   >= 5 → floor
 *   >= 7 → highPriority report
 *   < 5  → standard
 */
const ORCA_TO_CANONICAL = {
  1: 0, 2: 0,   // system / low-priority maintenance
  3: 1, 4: 1,   // routine
  5: 2, 6: 2,   // new-entity processing
  7: 3, 8: 3,   // revenue-critical / consensus-worthy
  9: 3, 10: 3,  // highest urgency
};

/**
 * IntelligenceWorker scale: string → canonical int 0-3
 */
const STRING_TO_CANONICAL = {
  'low': 0,
  'normal': 1,
  'medium': 2,
  'high': 3,
  'critical': 3,
  'urgent': 3,
};

// ─── Adapter ─────────────────────────────────────────────────────

/**
 * Normalize any priority representation to canonical int 0-3.
 *
 * Accepts:
 *   - int 0-3 (canonical): returned as-is
 *   - int 1-10 (Orca): converted via ORCA_TO_CANONICAL table
 *   - string ('high', 'normal', etc.): converted via STRING_TO_CANONICAL table
 *   - computed float 0-10 (mission_compiler): quantized to 0-3
 *   - null/undefined: defaults to 1 (routine)
 *
 * @param {*} raw — any priority value from any scale
 * @returns {number} canonical priority 0-3
 */
function canonicalPriority(raw) {
  // Already canonical
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw <= 3) {
    return raw;
  }

  // Orca scale: int 1-10
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 1 && raw <= 10) {
    return ORCA_TO_CANONICAL[raw] ?? 1;
  }

  // Computed float 0-10 (mission_compiler entropy-based)
  if (typeof raw === 'number' && !Number.isInteger(raw) && raw >= 0 && raw <= 10) {
    // Quantize: 0-2.5 → 0, 2.5-5 → 1, 5-7.5 → 2, 7.5-10 → 3
    return Math.min(3, Math.floor(raw / 2.5));
  }

  // String scale
  if (typeof raw === 'string') {
    return STRING_TO_CANONICAL[raw.toLowerCase()] ?? 1;
  }

  // null, undefined, or unrecognized → routine
  return 1;
}

module.exports = { canonicalPriority };
