/**
 * Repository Routes
 * 
 * Bounded context for repository object endpoints.
 * HTTP → RepositoryStore → Result
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../route_middleware');

function createRepositoryRoutes(repoStore) {
  router.post('/objects', asyncHandler('/repository/objects', async (req) => {
    const { object_id, kind, data, metadata } = req.body;
    if (!kind || data === undefined) {
      throw new Error('kind and data are required');
    }
    const id = await repoStore.append({ object_id, kind, data, metadata }, { client: null });
    return { object_id: id, kind, data, metadata };
  }));

  router.get('/objects/:id', asyncHandler('/repository/objects/:id', async (req) => {
    const obj = await repoStore.load(req.params.id);
    if (!obj) throw new Error('Object not found');
    return obj;
  }));

  router.get('/objects', asyncHandler('/repository/objects', async (req) => {
    const { kind, limit } = req.query;
    const results = await repoStore.search({
      kind: kind || undefined,
      limit: parseInt(limit) || 100,
    });
    return { results, total: results.length };
  }));

  router.delete('/objects/:id', asyncHandler('/repository/objects/:id', async (req) => {
    await repoStore.delete(req.params.id);
    return { deleted: true };
  }));

  return router;
}

module.exports = createRepositoryRoutes;
