cross_anchor_drift_summary_presentation_adapter.js
/******************************************************************************
 * PATCH-073
 * CROSS-ANCHOR DRIFT SUMMARY ? PRESENTATION ADAPTER
 * MODULE: cross_anchor_drift_summary_presentation_adapter.js
 *
 * ROLE
 * ----
 * Transform a cross-anchor drift summary artifact into a UI-safe
 * presentation object.
 *
 * This module:
 *   - DOES NOT recalculate drift
 *   - DOES NOT alter counts
 *   - DOES NOT inject authority
 *   - DOES NOT suppress signals
 *   - DOES NOT mutate input
 *
 * This module:
 *   - Pure transformation only
 *
 * STATUS
 * ------
 * Non-Canonical · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


const CROSS_ANCHOR_DRIFT_SUMMARY_VIEW_SCHEMA =
  "merkle.anchor.cross_drift.summary.view";


const CROSS_ANCHOR_DRIFT_SUMMARY_VIEW_VERSION = "1.0.0";


/* =============================================================================
 * PUBLIC API
 * ========================================================================== */


/**
 * presentCrossAnchorDriftSummary(summaryArtifact)
 *
 * @param {Object} summaryArtifact
 * @returns {Object} presentation view
 */
function presentCrossAnchorDriftSummary(summaryArtifact) {
  if (!summaryArtifact || typeof summaryArtifact !== "object") {
    return buildEmptyView("invalid_input");
  }


  const counts = summaryArtifact.summary_counts || {};
  const narrative = summaryArtifact.narrative || [];


  const view = {
    schema: CROSS_ANCHOR_DRIFT_SUMMARY_VIEW_SCHEMA,
    schemaVersion: CROSS_ANCHOR_DRIFT_SUMMARY_VIEW_VERSION,


    header: {
      title: "Cross-Anchor Drift Summary",
      generated_from: summaryArtifact.summary_fingerprint || null
    },


    metrics: {
      total: counts.total || 0,
      root_divergence: counts.root_divergence || 0,
      anchor_replay: counts.replay || 0,
      leaf_inconsistency: counts.leaf_inconsistency || 0
    },


    narrative: narrative.map(line => ({
      text: line,
      declaredNonAuthoritative: true
    })),


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  view.view_fingerprint = stableFingerprint(view);
  return view;
}


/* =============================================================================
 * HELPERS
 * ========================================================================== */


function buildEmptyView(reason) {
  const view = {
    schema: CROSS_ANCHOR_DRIFT_SUMMARY_VIEW_SCHEMA,
    schemaVersion: CROSS_ANCHOR_DRIFT_SUMMARY_VIEW_VERSION,


    header: {
      title: "Cross-Anchor Drift Summary",
      note: reason || "empty"
    },


    metrics: {
      total: 0,
      root_divergence: 0,
      anchor_replay: 0,
      leaf_inconsistency: 0
    },


    narrative: [],


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  view.view_fingerprint = stableFingerprint(view);
  return view;
}


/* =============================================================================
 * INVARIANTS
 * ========================================================================== */


const CROSS_ANCHOR_DRIFT_SUMMARY_PRESENTATION_INVARIANTS =
  Object.freeze({
    nonCanonical: true,
    advisoryOnly: true,
    replaySafe: true,
    nonAuthoritative: true,


    mustNot: {
      recalculateDrift: true,
      suppressSignals: true,
      interpretMeaning: true,
      injectAuthority: true,
      mutateInput: true
    }
  });


/* =============================================================================
 * END OF cross_anchor_drift_summary_presentation_adapter.js
 * ========================================================================== */
merkle_anchor_chain_validator.js
