consensus_quorum_validator.js
/* ============================================================
   consensus_quorum_validator.js
   ------------------------------------------------------------
   Advisory Multi-Bundle Consensus Court


   Version: consensus_quorum_validator.1.0


   Guarantees:
   - Pure structural analysis
   - No authority injection
   - No bundle mutation
   - Deterministic cluster formation
   - Strict equivalence-based grouping
   ============================================================ */


import { analyzeDivergence } from "./cross_bundle_divergence_analyzer.js";


/* ============================================================
   Version
   ============================================================ */


export const CONSENSUS_QUORUM_VALIDATOR_VERSION =
  "consensus_quorum_validator.1.0";


/* ============================================================
   Utilities
   ============================================================ */


function freeze(obj) {
  return Object.freeze(obj);
}


function assertBundlesArray(bundles) {
  if (!Array.isArray(bundles) || bundles.length === 0) {
    throw new Error("bundles must be non-empty array");
  }
}


/* ============================================================
   Cluster Builder
   ============================================================ */


async function buildEquivalenceMatrix(bundles) {
  const size = bundles.length;
  const matrix = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false));


  for (let i = 0; i < size; i++) {
    matrix[i][i] = true;
  }


  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      const result = await analyzeDivergence(
        bundles[i],
        bundles[j],
        { mode: "strict" }
      );


      const equivalent = result.equivalent;


      matrix[i][j] = equivalent;
      matrix[j][i] = equivalent;
    }
  }


  return matrix;
}


/* ============================================================
   Connected Component Clustering
   ============================================================ */


function buildClusters(matrix) {
  const size = matrix.length;
  const visited = new Array(size).fill(false);
  const clusters = [];


  for (let i = 0; i < size; i++) {
    if (visited[i]) continue;


    const cluster = [];
    const stack = [i];


    while (stack.length) {
      const node = stack.pop();


      if (visited[node]) continue;
      visited[node] = true;
      cluster.push(node);


      for (let j = 0; j < size; j++) {
        if (!visited[j] && matrix[node][j]) {
          stack.push(j);
        }
      }
    }


    clusters.push(cluster.sort((a, b) => a - b));
  }


  return clusters;
}


/* ============================================================
   Main Quorum Validator
   ============================================================ */


export async function validateQuorum({
  bundles,
  quorum_threshold
}) {
  assertBundlesArray(bundles);


  const size = bundles.length;


  const threshold =
    quorum_threshold ||
    Math.floor(size / 2) + 1; // simple majority


  const matrix =
    await buildEquivalenceMatrix(bundles);


  const clusters =
    buildClusters(matrix);


  /* ============================================================
     Identify Majority Cluster
     ============================================================ */


  let majorityCluster = null;


  for (const cluster of clusters) {
    if (
      !majorityCluster ||
      cluster.length > majorityCluster.length
    ) {
      majorityCluster = cluster;
    }
  }


  const quorumReached =
    majorityCluster.length >= threshold;


  /* ============================================================
     Compute Consensus Fingerprint
     ============================================================ */


  let consensusFingerprint = null;


  if (quorumReached) {
    const representative =
      bundles[majorityCluster[0]];


    consensusFingerprint =
      representative.scheduler_fingerprint ||
      null;
  }


  /* ============================================================
     Minority Groups
     ============================================================ */


  const minorityClusters =
    clusters.filter(
      c => c !== majorityCluster
    );


  /* ============================================================
     Divergence Graph (Adjacency Representation)
     ============================================================ */


  const divergenceGraph = [];


  for (let i = 0; i < size; i++) {
    const edges = [];


    for (let j = 0; j < size; j++) {
      if (i !== j && matrix[i][j]) {
        edges.push(j);
      }
    }


    divergenceGraph.push({
      bundle_index: i,
      equivalent_to: edges.sort((a, b) => a - b)
    });
  }


  /* ============================================================
     Final Advisory Result
     ============================================================ */


  return freeze({
    quorum_reached: quorumReached,
    quorum_threshold: threshold,
    total_bundles: size,
    clusters,
    majority_cluster: majorityCluster,
    minority_clusters: minorityClusters,
    consensus_fingerprint: consensusFingerprint,
    divergence_graph: divergenceGraph,
    validator_version:
      CONSENSUS_QUORUM_VALIDATOR_VERSION
  });
}
structural_graph_builder.js
