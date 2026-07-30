/**
 * Knowledge Graph Routes — PING Core v1
 */

function createKnowledgeRoutes(knowledgeGraph) {
  const express = require('express');
  const router = express.Router();

  // Get knowledge stats
  router.get('/stats', async (req, res) => {
    try {
      const stats = await knowledgeGraph.getStats();
      res.json({ status: 'ok', stats });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Query nodes
  router.get('/nodes', async (req, res) => {
    try {
      const nodes = await knowledgeGraph.queryNodes({
        nodeType: req.query.type,
        entityType: req.query.entityType,
        entityId: req.query.entityId,
        search: req.query.q,
        limit: parseInt(req.query.limit) || 50,
      });
      res.json({ status: 'ok', nodes, count: nodes.length });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Add a node
  router.post('/nodes', async (req, res) => {
    try {
      const { nodeType, label, data, entityType, entityId } = req.body;
      const nodeId = await knowledgeGraph.addNode(nodeType, label, data, { entityType, entityId });
      res.json({ status: 'ok', nodeId });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Get neighborhood
  router.get('/nodes/:nodeId/neighborhood', async (req, res) => {
    try {
      const depth = parseInt(req.query.depth) || 1;
      const neighborhood = await knowledgeGraph.getNeighborhood(req.params.nodeId, depth);
      res.json({ status: 'ok', ...neighborhood });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Add an edge
  router.post('/edges', async (req, res) => {
    try {
      const { sourceId, targetId, edgeType, weight, data } = req.body;
      const edgeId = await knowledgeGraph.addEdge(sourceId, targetId, edgeType, data, weight);
      res.json({ status: 'ok', edgeId });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  return router;
}

module.exports = createKnowledgeRoutes;
