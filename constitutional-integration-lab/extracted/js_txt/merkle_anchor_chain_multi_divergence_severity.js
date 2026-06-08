merkle_anchor_chain_multi_divergence_severity.js
/******************************************************************************
 * PATCH-085
 * MULTI-CHAIN DIVERGENCE SEVERITY GRADIENT
 *
 * MODULE:
 *   merkle_anchor_chain_multi_divergence_severity.js
 *
 * ROLE
 * ----
 * Provide a descriptive structural divergence gradient across
 * multiple canonical chains.
 *
 * This module:
 *   - NEVER resolves consensus
 *   - NEVER ranks chains
 *   - NEVER assigns correctness
 *   - NEVER mutates input
 *
 * It only:
 *   - Measures structural divergence intensity
 *   - Emits advisory classification
 *
 * STATUS
 * ------
 * Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


const MULTI_CHAIN_DIVERGENCE_SEVERITY_SCHEMA =
  "merkle.anchor.chain.multi_divergence.severity";


const MULTI_CHAIN_DIVERGENCE_SEVERITY_VERSION = "1.0.0";


/* =============================================================================
 * PUBLIC API
 * ========================================================================== */


/**
 * classifyMultiChainDivergence(canonicalChains)
 *
 * @param {Array<Object>} canonicalChains
 * @returns {Object} severity artifact
 */
function classifyMultiChainDivergence(canonicalChains) {
  if (!Array.isArray(canonicalChains) ||
      canonicalChains.length < 2) {
    return buildSeverity("none", 0, 0, "insufficient_chains");
  }


  const anchorSets = [];
  const fingerprints = new Set();


  canonicalChains.forEach(chain => {
    if (!isValidCanonical(chain)) return;


    fingerprints.add(chain.chain_fingerprint);


    const set = new Set(
      chain.anchors.map(a => a.anchor_fingerprint)
    );
    anchorSets.push(set);
  });


  if (anchorSets.length < 2) {
    return buildSeverity("none", 0, 0, "invalid_chains");
  }


  const union = new Set();
  anchorSets.forEach(set =>
    set.forEach(a => union.add(a))
  );


  const intersection = new Set(anchorSets[0]);
  anchorSets.slice(1).forEach(set => {
    for (const val of intersection) {
      if (!set.has(val)) intersection.delete(val);
    }
  });


  const divergenceCount =
    union.size - intersection.size;


  const fingerprintDivergence =
    fingerprints.size - 1;


  const severityLevel =
    computeSeverityLevel(
      divergenceCount,
      fingerprintDivergence,
      canonicalChains.length
    );


  return buildSeverity(
    severityLevel,
    divergenceCount,
    fingerprintDivergence
  );
}


/* =============================================================================
 * SEVERITY LOGIC (PURELY DESCRIPTIVE)
 * ========================================================================== */


function computeSeverityLevel(
  divergenceCount,
  fingerprintDivergence,
  chainCount
) {
  const normalized =
    divergenceCount + fingerprintDivergence;


  if (normalized === 0) return "none";
  if (normalized <= chainCount) return "low";
  if (normalized <= chainCount * 2) return "moderate";
  return "high";
}


/* =============================================================================
 * HELPERS
 * ========================================================================== */


function isValidCanonical(chain) {
  return chain &&
         chain.schema === "merkle.anchor.chain.canonical" &&
         Array.isArray(chain.anchors);
}


function buildSeverity(
  level,
  anchorDivergence,
  fingerprintDivergence,
  note = null
) {
  const artifact = {
    schema: MULTI_CHAIN_DIVERGENCE_SEVERITY_SCHEMA,
    schemaVersion: MULTI_CHAIN_DIVERGENCE_SEVERITY_VERSION,


    severity: level,


    metrics: {
      anchor_divergence: anchorDivergence,
      fingerprint_divergence: fingerprintDivergence
    },


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  if (note) artifact.note = note;


  artifact.severity_fingerprint =
    stableFingerprint(artifact);


  return artifact;
}


/* =============================================================================
 * INVARIANTS
 * ========================================================================== */


const MULTI_CHAIN_DIVERGENCE_SEVERITY_INVARIANTS =
  Object.freeze({
    advisoryOnly: true,
    replaySafe: true,
    nonAuthoritative: true,


    mustNot: {
      resolveConsensus: true,
      rankChains: true,
      assignTrust: true,
      mutateInput: true
    }
  });


/* =============================================================================
 * HASHING
 * ========================================================================== */


function stableFingerprint(value) {
  return sha256Strict(JSON.stringify(sortKeysDeep(value)));
}


function sortKeysDeep(v) {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v && typeof v === "object") {
    return Object.keys(v)
      .sort()
      .reduce((a, k) => {
        a[k] = sortKeysDeep(v[k]);
        return a;
      }, {});
  }
  return v;
}


function sha256Strict(input) {
  if (
    typeof Utilities !== "undefined" &&
    Utilities.computeDigest
  ) {
    const bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      input,
      Utilities.Charset.UTF_8
    );
    return bytes
      .map(b => ("0" + (b & 0xff).toString(16)).slice(-2))
      .join("");
  }
  throw new Error("No cryptographic hashing available");
}


/* =============================================================================
 * END OF PATCH-085
 * ========================================================================== */
merkle_anchor_chain_multi_graph_visualizer.js
