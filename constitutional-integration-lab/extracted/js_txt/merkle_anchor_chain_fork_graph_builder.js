merkle_anchor_chain_fork_graph_builder.js
/******************************************************************************
 * PATCH-076
 * ANCHOR CHAIN FORK GRAPH BUILDER
 * MODULE: merkle_anchor_chain_fork_graph_builder.js
 *
 * ROLE
 * ----
 * Construct a structural fork graph from Merkle anchor artifacts
 * for human visualization.
 *
 * This module:
 *   - Builds parent ? child relationships
 *   - Detects forks
 *   - Detects orphans
 *   - Detects disconnected subgraphs
 *
 * This module:
 *   - NEVER validates correctness
 *   - NEVER assigns authority
 *   - NEVER mutates anchors
 *   - NEVER blocks execution
 *
 * STATUS
 * ------
 * Human-Facing · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


const ANCHOR_FORK_GRAPH_SCHEMA =
  "merkle.anchor.chain.fork_graph";


const ANCHOR_FORK_GRAPH_VERSION = "1.0.0";


/* =============================================================================
 * PUBLIC API
 * ========================================================================== */


/**
 * buildAnchorForkGraph(anchors)
 *
 * @param {Array<Object>} anchors
 * @returns {Object} fork graph artifact
 */
function buildAnchorForkGraph(anchors) {
  if (!Array.isArray(anchors)) {
    return buildGraph([], [], ["invalid_input"]);
  }


  const nodes = [];
  const edges = [];
  const signals = [];


  const byFingerprint = Object.create(null);
  const childrenMap = Object.create(null);


  anchors.forEach(a => {
    if (!a || typeof a !== "object") {
      signals.push("invalid_anchor_shape");
      return;
    }


    const fp = a.anchor_fingerprint;
    if (!fp) {
      signals.push("missing_anchor_fingerprint");
      return;
    }


    nodes.push({
      id: fp,
      merkle_root: a.merkle_root || null,
      created_at: a.created_at || null,
      declaredNonAuthoritative: true
    });


    byFingerprint[fp] = a;


    if (!childrenMap[a.previous_anchor_fingerprint]) {
      childrenMap[a.previous_anchor_fingerprint] = [];
    }


    childrenMap[a.previous_anchor_fingerprint].push(fp);
  });


  // Build edges
  anchors.forEach(a => {
    if (!a || !a.anchor_fingerprint) return;


    const parent = a.previous_anchor_fingerprint;
    const child = a.anchor_fingerprint;


    if (parent && byFingerprint[parent]) {
      edges.push({
        from: parent,
        to: child,
        declaredNonAuthoritative: true
      });
    } else if (parent && !byFingerprint[parent]) {
      signals.push("orphan_reference_detected");
    }
  });


  // Fork detection
  Object.keys(childrenMap).forEach(parent => {
    const children = childrenMap[parent] || [];
    if (children.length > 1) {
      signals.push("fork_detected");
    }
  });


  // Disconnected subgraph detection
  const connected = computeConnectedSet(edges);
  if (connected.size !== nodes.length) {
    signals.push("disconnected_subgraph_detected");
  }


  return buildGraph(nodes, edges, signals);
}


/* =============================================================================
 * CONNECTIVITY ANALYSIS
 * ========================================================================== */


function computeConnectedSet(edges) {
  const visited = new Set();
  const adjacency = Object.create(null);


  edges.forEach(e => {
    if (!adjacency[e.from]) adjacency[e.from] = [];
    if (!adjacency[e.to]) adjacency[e.to] = [];


    adjacency[e.from].push(e.to);
    adjacency[e.to].push(e.from);
  });


  const keys = Object.keys(adjacency);
  if (keys.length === 0) return visited;


  const stack = [keys[0]];


  while (stack.length) {
    const node = stack.pop();
    if (visited.has(node)) continue;


    visited.add(node);


    (adjacency[node] || []).forEach(n => {
      if (!visited.has(n)) stack.push(n);
    });
  }


  return visited;
}


/* =============================================================================
 * GRAPH BUILDER
 * ========================================================================== */


function buildGraph(nodes, edges, signalCodes) {
  const graph = {
    schema: ANCHOR_FORK_GRAPH_SCHEMA,
    schemaVersion: ANCHOR_FORK_GRAPH_VERSION,


    node_count: nodes.length,
    edge_count: edges.length,


    nodes,
    edges,


    signals: signalCodes.map(code => ({
      code,
      declaredNonAuthoritative: true
    })),


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  graph.graph_fingerprint = stableFingerprint(graph);
  return graph;
}


/* =============================================================================
 * INVARIANTS
 * ========================================================================== */


const ANCHOR_FORK_GRAPH_INVARIANTS = Object.freeze({
  humanFacing: true,
  advisoryOnly: true,
  replaySafe: true,
  nonAuthoritative: true,


  mustNot: {
    validateTruth: true,
    rankChains: true,
    mutateInput: true,
    suppressForks: true
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
 * END OF merkle_anchor_chain_fork_graph_builder.js
 * ========================================================================== */
merkle_anchor_chain_fork_graph_misuse_tests.js
