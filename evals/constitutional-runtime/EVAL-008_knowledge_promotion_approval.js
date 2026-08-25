/**
 * EVAL-008: Knowledge Promotion Requires Human Approval
 *
 * Proves INV-041 (observation ≠ knowledge), INV-042 (ADD-only promotion).
 *
 * Worker creates candidate node → only SNIPPET_APPROVED promotes to approved (1.0).
 */

let pass = 0;
let fail = 0;
function assert(condition, msg) {
  if (condition) { pass++; } else { fail++; console.log(`    FAIL: ${msg}`); }
}

async function run() {
  const { KnowledgeGraph } = require('../../ping-runtime/knowledge/knowledge_graph');
  const { KnowledgePromoter } = require('../../ping-runtime/knowledge/knowledge_promoter');

  // In-memory mock pool — addNode has 10 params, updateNodeBySourceEvent has dynamic params
  const nodes = {};
  let counter = 0;
  const mockPool = {
    query(sql, params) {
      if (sql.includes('CREATE TABLE') || sql.includes('CREATE INDEX') || sql.includes('ALTER TABLE')) {
        return Promise.resolve({});
      }
      // INSERT INTO knowledge_nodes — 10 columns
      if (sql.includes('INSERT INTO knowledge_nodes')) {
        // params: $1=nodeId, $2=nodeType, $3=entityType, $4=entityId,
        //         $5=label, $6=data(JSON), $7=sourceEventId, $8=namespace,
        //         $9=confidence, $10=status
        const nodeId = params[0];
        nodes[nodeId] = {
          node_id: nodeId,
          node_type: params[1],
          entity_type: params[2],
          entity_id: params[3],
          label: params[4],
          data: typeof params[5] === 'string' ? JSON.parse(params[5]) : (params[5] || {}),
          source_event_id: params[6] || null,
          namespace: params[7] || 'core::system',
          confidence: params[8] != null ? params[8] : null,
          status: params[9] || 'candidate',
        };
        return Promise.resolve({ rows: [nodes[nodeId]] });
      }
      // SELECT from knowledge_nodes
      if (sql.includes('SELECT') && sql.includes('knowledge_nodes')) {
        return Promise.resolve({ rows: Object.values(nodes) });
      }
      // UPDATE knowledge_nodes SET ... WHERE source_event_id = $1 ...
      // Dynamic params: first param is always $1=sourceEventId in WHERE clause,
      // but SET clauses are injected before. The actual order from the code:
      // params = [sourceEventId, ...namespace?, status?, confidence?]
      if (sql.includes('UPDATE knowledge_nodes') && sql.includes('source_event_id')) {
        // Parse the SET clauses from SQL to find which dynamic params exist
        const setMatch = sql.match(/SET (.+?) WHERE/);
        const setClause = setMatch ? setMatch[1] : '';

        let paramIdx = 0;
        // $1 is always sourceEventId in WHERE, but it might appear earlier
        // Actually the code builds params as: [sourceEventId, ...namespace, ...status, ...confidence]
        // Let's just check which SET columns are present
        const hasNamespace = setClause.includes('namespace');
        const hasStatus = setClause.includes('status =');
        const hasConfidence = setClause.includes('confidence');

        // params[0] = sourceEventId (always first, from WHERE clause setup)
        const sourceEventId = params[0];
        let status, confidence;
        let idx = 1; // skip sourceEventId at 0
        if (hasNamespace) idx++; // skip namespace value
        if (hasStatus) {
          status = params[idx++];
        }
        if (hasConfidence) {
          confidence = params[idx++];
        }

        let updated = 0;
        for (const node of Object.values(nodes)) {
          if (node.source_event_id === sourceEventId) {
            if (status !== undefined) node.status = status;
            if (confidence !== undefined) node.confidence = confidence;
            updated++;
          }
        }
        return Promise.resolve({ rowCount: updated });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    },
  };

  const kg = new KnowledgeGraph({ pool: mockPool });
  await kg.initialize();

  // Create a candidate node (simulating worker observation)
  const sourceEventId = 'evt_claim_001';
  await kg.addNode('claim', 'Test Claim', { text: 'Test claim' }, {
    namespace: 'tenant::hpp',
    confidence: null,
    sourceEventId,
  });

  // INV-041: Node created as candidate with null confidence
  const allNodes = Object.values(nodes);
  const claimNode = allNodes.find(n => n.source_event_id === sourceEventId);
  assert(claimNode !== undefined, 'claim node created');
  assert(claimNode.status === 'candidate', `status is candidate (got ${claimNode.status})`);
  assert(claimNode.confidence === null, `confidence is null (got ${claimNode.confidence})`);

  // INV-041/042: Promotion via SNIPPET_APPROVED
  const promoter = new KnowledgePromoter({ knowledgeGraph: kg });
  await promoter.handle({
    event_type: 'SNIPPET_APPROVED',
    source: 'eval-human',
    payload: { sourceEventId },
  });

  // INV-042: Node promoted to approved, confidence 1.0
  const approvedNode = Object.values(nodes).find(n => n.source_event_id === sourceEventId);
  assert(approvedNode.status === 'approved', `promoted to approved (got ${approvedNode.status})`);
  assert(approvedNode.confidence === 1.0, `confidence 1.0 (got ${approvedNode.confidence})`);

  // INV-042: ADD-only — data not rewritten
  assert(approvedNode.label === 'Test Claim', 'label preserved');
  assert(approvedNode.data?.text === 'Test claim', 'data preserved');

  // INV-041: SNIPPET_REJECTED
  const sourceEventId2 = 'evt_claim_002';
  await kg.addNode('claim', 'Rejected', { text: 'Bad' }, {
    namespace: 'tenant::hpp',
    confidence: null,
    sourceEventId: sourceEventId2,
  });

  await promoter.handle({
    event_type: 'SNIPPET_REJECTED',
    source: 'eval-human',
    payload: { sourceEventId: sourceEventId2 },
  });

  const rejectedNode = Object.values(nodes).find(n => n.source_event_id === sourceEventId2);
  assert(rejectedNode.status === 'rejected', `rejected (got ${rejectedNode.status})`);
  assert(rejectedNode.confidence === 0.2, `confidence 0.2 (got ${rejectedNode.confidence})`);

  return { pass, fail };
}

module.exports = { run };
