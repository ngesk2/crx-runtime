merkle_anchor_chain_multi_graph_visualizer.js
/******************************************************************************
 * PATCH-086
 * MULTI-CHAIN GRAPH VISUALIZER
 *
 * MODULE:
 *   merkle_anchor_chain_multi_graph_visualizer.js
 *
 * ROLE
 * ----
 * Build a unified graph representation across multiple canonical chains.
 *
 * This module:
 *   - Identifies shared anchors
 *   - Identifies chain-unique anchors
 *   - Builds node/edge graph model
 *   - Emits visualization-safe structure
 *
 * This module:
 *   - NEVER resolves consensus
 *   - NEVER ranks chains
 *   - NEVER assigns correctness
 *   - NEVER mutates inputs
 *
 * STATUS
 * ------
 * Human-Facing · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


const MULTI_CHAIN_GRAPH_SCHEMA =
  "merkle.anchor.chain.multi_graph";


const MULTI_CHAIN_GRAPH_VERSION = "1.0.0";


/* =============================================================================
 * PUBLIC API
 * ========================================================================== */


/**
 * buildMultiChainGraph(canonicalChains)
 *
 * @param {Array<Object>} canonicalChains
 * @returns {Object} visualization artifact
 */
function buildMultiChainGraph(canonicalChains) {
  if (!Array.isArray(canonicalChains)) {
    return buildGraph([], [], "invalid_input");
  }


  const nodeMap = Object.create(null);
  const edges = [];


  canonicalChains.forEach((chain, chainIndex) => {
    if (!isValidCanonical(chain)) return;


    (chain.anchors || []).forEach(anchor => {
      const id = anchor.anchor_fingerprint;
      if (!id) return;


      if (!nodeMap[id]) {
        nodeMap[id] = {
          id,
          chains: new Set(),
          parents: new Set()
        };
      }


      nodeMap[id].chains.add(chainIndex);


      if (anchor.previous_anchor_fingerprint) {
        nodeMap[id].parents.add(
          anchor.previous_anchor_fingerprint
        );


        edges.push({
          from: anchor.previous_anchor_fingerprint,
          to: id,
          chainIndex,
          declaredNonAuthoritative: true
        });
      }
    });
  });


  const nodes = Object.values(nodeMap).map(n => ({
    id: n.id,
    chain_membership: Array.from(n.chains).sort(),
    parent_references: Array.from(n.parents).sort(),
    shared:
      n.chains.size > 1,
    declaredNonAuthoritative: true
  }));


  return buildGraph(nodes, edges);
}


/* =============================================================================
 * GRAPH BUILDER
 * ========================================================================== */


function buildGraph(nodes, edges, note = null) {
  const artifact = {
    schema: MULTI_CHAIN_GRAPH_SCHEMA,
    schemaVersion: MULTI_CHAIN_GRAPH_VERSION,


    node_count: nodes.length,
    edge_count: edges.length,


    nodes,
    edges,


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  if (note) artifact.note = note;


  artifact.graph_fingerprint =
    stableFingerprint(artifact);


  return artifact;
}


/* =============================================================================
 * HELPERS
 * ========================================================================== */


function isValidCanonical(chain) {
  return chain &&
         chain.schema === "merkle.anchor.chain.canonical" &&
         Array.isArray(chain.anchors);
}


/* =============================================================================
 * INVARIANTS
 * ========================================================================== */


const MULTI_CHAIN_GRAPH_VISUALIZER_INVARIANTS =
  Object.freeze({
    advisoryOnly: true,
    replaySafe: true,
    nonAuthoritative: true,


    mustNot: {
      resolveConsensus: true,
      rankChains: true,
      assignCorrectness: true,
      mutateInput: true,
      suppressNodes: true
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
 * END OF PATCH-086
 * ========================================================================== */
merkle_anchor_chain_multi_graph_misuse_tests.js
