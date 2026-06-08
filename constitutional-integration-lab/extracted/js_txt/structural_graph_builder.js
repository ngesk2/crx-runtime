structural_graph_builder.js
/* ============================================================
   structural_graph_builder.js
   ------------------------------------------------------------
   Deterministic Structural Identity Compiler


   Version: structural_graph_builder.2.0


   Guarantees:
   - Deterministic node generation
   - Domain-separated node identity
   - Stable replay across runtimes
   - Span validation
   - Non-overlapping siblings
   - Acyclic structure enforcement
   - Deep immutability
   - No UI dependency
   - No projection bleed
   - No mutation of input
   ============================================================ */


import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS
} from "../core/canonical_fingerprint_service.js";


export const STRUCTURAL_GRAPH_BUILDER_VERSION =
  "structural_graph_builder.2.0";


/* ============================================================
   Structural Node Types
   ============================================================ */


const ALLOWED_NODE_TYPES = new Set([
  "paragraph",
  "sentence",
  "clause",
  "token"
]);


/* ============================================================
   Utilities
   ============================================================ */


function isPlainObject(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    Object.getPrototypeOf(obj) === Object.prototype
  );
}


function deepFreeze(obj, visited = new WeakSet()) {
  if (obj === null || typeof obj !== "object") return obj;
  if (visited.has(obj)) return obj;


  visited.add(obj);


  Object.freeze(obj);


  for (const key of Object.keys(obj)) {
    deepFreeze(obj[key], visited);
  }


  return obj;
}


function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}


/* ============================================================
   Span Validation
   ============================================================ */


function validateSpan(span, documentLength) {
  assert(
    isPlainObject(span),
    "Span must be plain object"
  );


  const { start, end } = span;


  assert(
    Number.isInteger(start) &&
      Number.isInteger(end),
    "Span indices must be integers"
  );


  assert(
    start >= 0 && end >= 0,
    "Span indices must be non-negative"
  );


  assert(
    start <= end,
    "Span start must be <= end"
  );


  assert(
    end <= documentLength,
    "Span end exceeds document length"
  );
}


/* ============================================================
   Overlap & Hierarchy Validation
   ============================================================ */


function validateNoSiblingOverlap(nodes) {
  const byParent = new Map();


  for (const node of nodes) {
    const parent = node.parent_node_id || null;
    if (!byParent.has(parent)) {
      byParent.set(parent, []);
    }
    byParent.get(parent).push(node);
  }


  for (const siblings of byParent.values()) {
    siblings.sort((a, b) => a.span.start - b.span.start);


    for (let i = 1; i < siblings.length; i++) {
      const prev = siblings[i - 1];
      const current = siblings[i];


      assert(
        current.span.start >= prev.span.end,
        `Sibling span overlap detected between ${prev.node_id} and ${current.node_id}`
      );
    }
  }
}


function validateAcyclic(nodes) {
  const lookup = new Map(nodes.map(n => [n.node_id, n]));


  for (const node of nodes) {
    let current = node;
    const visited = new Set();


    while (current.parent_node_id) {
      assert(
        !visited.has(current.parent_node_id),
        `Cycle detected at node ${node.node_id}`
      );


      visited.add(current.parent_node_id);
      current = lookup.get(current.parent_node_id);


      assert(
        current,
        `Parent node ${node.parent_node_id} not found`
      );
    }
  }
}


/* ============================================================
   Deterministic Tokenizer (Minimal Constitutional Splitter)
   ============================================================ */


function buildStructuralSegments(documentText) {
  const nodes = [];


  let position = 0;
  let paragraphStart = 0;


  const paragraphs = documentText.split(/\n+/);


  for (const paragraphText of paragraphs) {
    const paragraphEnd = paragraphStart + paragraphText.length;


    nodes.push({
      node_type: "paragraph",
      span: {
        start: paragraphStart,
        end: paragraphEnd
      }
    });


    // Sentence split (simple deterministic period split)
    const sentences = paragraphText.split(/(?<=[.!?])\s+/);


    let sentenceOffset = paragraphStart;


    for (const sentence of sentences) {
      const sentenceEnd = sentenceOffset + sentence.length;


      nodes.push({
        node_type: "sentence",
        span: {
          start: sentenceOffset,
          end: sentenceEnd
        }
      });


      sentenceOffset = sentenceEnd + 1;
    }


    paragraphStart = paragraphEnd + 1;
  }


  return nodes;
}


/* ============================================================
   Main Builder
   ============================================================ */


export async function buildStructuralGraph({
  document_text,
  snapshot_fingerprint
}) {
  assert(
    typeof document_text === "string",
    "document_text must be string"
  );


  assert(
    typeof snapshot_fingerprint === "string",
    "snapshot_fingerprint required"
  );


  const rawNodes = buildStructuralSegments(document_text);


  const nodes = [];


  for (const raw of rawNodes) {
    assert(
      ALLOWED_NODE_TYPES.has(raw.node_type),
      `Invalid node_type: ${raw.node_type}`
    );


    validateSpan(raw.span, document_text.length);


    const nodeIdentityPayload = {
      snapshot_fingerprint,
      node_type: raw.node_type,
      span: raw.span
    };


    const node_id = await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.STRUCTURAL_NODE,
      nodeIdentityPayload
    );


    const fingerprint = await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.STRUCTURAL_NODE_CONTENT,
      {
        document_text_slice: document_text.slice(
          raw.span.start,
          raw.span.end
        ),
        node_type: raw.node_type
      }
    );


    nodes.push({
      node_id,
      node_type: raw.node_type,
      span: raw.span,
      parent_node_id: null, // can expand later
      fingerprint
    });
  }


  // Deterministic ordering
  nodes.sort((a, b) => {
    if (a.span.start !== b.span.start) {
      return a.span.start - b.span.start;
    }
    return a.span.end - b.span.end;
  });


  validateNoSiblingOverlap(nodes);
  validateAcyclic(nodes);


  const structural_graph = {
    builder_version: STRUCTURAL_GRAPH_BUILDER_VERSION,
    snapshot_fingerprint,
    node_count: nodes.length,
    nodes
  };


  deepFreeze(structural_graph);


  return structural_graph;
}
artifact_reversibility_validator.js
