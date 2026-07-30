/**
 * AI Workspace Routes
 *
 * HTTP interface for HPP AI Workspace capabilities.
 * Routes → AIWorkspaceAuthority → HuggingFaceAdapter → HuggingFace API
 *
 * All persistence flows through ai_workspace_authority → storage adapter.
 * No direct pool.query().
 */

const express = require('express');
const { asyncHandler } = require('../route_middleware');

function createAiWorkspaceRoutes(aiWorkspaceAuthority) {
  const router = express.Router();

  /**
   * POST /ai-workspace/sentiment — Analyze review sentiment
   *
   * Body: { projectId, text, tenantId? }
   */
  router.post('/sentiment', asyncHandler('/ai-workspace/sentiment', async (req) => {
    const { projectId, text, tenantId } = req.body;
    if (!projectId || !text) {
      throw new Error('projectId and text are required');
    }
    return await aiWorkspaceAuthority.executeAnalyzeSentiment({ projectId, text, tenantId });
  }));

  /**
   * POST /ai-workspace/tag — Zero-shot content classification
   *
   * Body: { projectId, text, labels, tenantId? }
   */
  router.post('/tag', asyncHandler('/ai-workspace/tag', async (req) => {
    const { projectId, text, labels, tenantId } = req.body;
    if (!projectId || !text || !labels) {
      throw new Error('projectId, text, and labels are required');
    }
    if (!Array.isArray(labels) || labels.length === 0) {
      throw new Error('labels must be a non-empty array');
    }
    return await aiWorkspaceAuthority.executeTagContent({ projectId, text, labels, tenantId });
  }));

  /**
   * POST /ai-workspace/parse — Parse invoice or estimate document
   *
   * Body: { projectId, input, tenantId? }
   */
  router.post('/parse', asyncHandler('/ai-workspace/parse', async (req) => {
    const { projectId, input, tenantId } = req.body;
    if (!projectId || !input) {
      throw new Error('projectId and input are required');
    }
    return await aiWorkspaceAuthority.executeParseDocument({ projectId, input, tenantId });
  }));

  /**
   * POST /ai-workspace/translate — English ↔ Spanish translation
   *
   * Body: { projectId, text, direction?, tenantId? }
   */
  router.post('/translate', asyncHandler('/ai-workspace/translate', async (req) => {
    const { projectId, text, direction, tenantId } = req.body;
    if (!projectId || !text) {
      throw new Error('projectId and text are required');
    }
    return await aiWorkspaceAuthority.executeTranslate({ projectId, text, direction, tenantId });
  }));

  /**
   * POST /ai-workspace/summarize — Summarize project updates
   *
   * Body: { projectId, text, maxLength?, tenantId? }
   */
  router.post('/summarize', asyncHandler('/ai-workspace/summarize', async (req) => {
    const { projectId, text, maxLength, tenantId } = req.body;
    if (!projectId || !text) {
      throw new Error('projectId and text are required');
    }
    return await aiWorkspaceAuthority.executeSummarize({ projectId, text, maxLength, tenantId });
  }));

  /**
   * GET /ai-workspace/project/:projectId — Get all AI results for a project
   *
   * Query: operation?, limit?
   */
  router.get('/project/:projectId', asyncHandler('/ai-workspace/project/:projectId', async (req) => {
    const { projectId } = req.params;
    const { operation, limit, tenantId } = req.query;
    return await aiWorkspaceAuthority.executeGetProjectResults({
      projectId,
      operation,
      limit: limit ? parseInt(limit) : undefined,
      tenantId,
    });
  }));

  /**
   * GET /ai-workspace/project/:projectId/stats — AI usage stats for a project
   */
  router.get('/project/:projectId/stats', asyncHandler('/ai-workspace/project/:projectId/stats', async (req) => {
    const { projectId } = req.params;
    const { tenantId } = req.query;
    return await aiWorkspaceAuthority.executeGetWorkspaceStats({ projectId, tenantId });
  }));

  return router;
}

module.exports = createAiWorkspaceRoutes;
