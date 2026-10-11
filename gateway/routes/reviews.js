/**
 * Google Business Profile Reviews Routes
 *
 * HTTP interface for review moderation.
 *
 * POST /reviews/sync — Sync reviews from Google
 * GET  /reviews — List reviews (tenant-scoped)
 * GET  /reviews/:id — Get single review
 * POST /reviews/:id/reply — Reply to a review
 * GET  /reviews/stats — Review statistics
 */

const express = require('express');
const { asyncHandler, requireTenantScope, denyAuthUnconfigured } = require('../route_middleware');

function createReviewRoutes(reviewAuthority, auth) {
  // NOTE: the router is created per factory call (not at module level) so
  // repeated invocations (tests, remounts) never stack duplicate handlers.
  const router = express.Router();
  // P2 write-authority closure (2026-10-11): the mutating routes run behind
  // exterior authentication AND the tenant-scope gate. A valid key alone is
  // not enough — the declared tenant_id must be inside the agent's
  // operator-provisioned allow-list, or the request never reaches the
  // authority. Without an auth instance the mutations fail closed (503).
  const authenticate = auth && typeof auth.middleware === 'function'
    ? auth.middleware()
    : denyAuthUnconfigured;
  const scoped = (getScope, label, handler) =>
    [authenticate, requireTenantScope(getScope), asyncHandler(label, handler)];

  router.post('/sync', ...scoped(
    (req) => req.body && (req.body.tenant_id || req.body.tenantId),
    'POST /reviews/sync', async (req) => {
    const { tenant_id, location_id } = req.body;

    if (!tenant_id || !location_id) {
      throw new Error('tenant_id and location_id are required');
    }

    const result = await reviewAuthority.executeSyncReviews({
      tenantId: tenant_id,
      locationId: location_id,
    });

    return { sync: result };
  }));

  router.get('/', asyncHandler('GET /reviews', async (req) => {
    const { tenant_id, location_id, limit } = req.query;

    if (!tenant_id) {
      throw new Error('tenant_id is required');
    }

    const reviews = await reviewAuthority.executeListReviews({
      tenantId: tenant_id,
      locationId: location_id,
      limit: limit ? parseInt(limit) : undefined,
    });

    return { reviews, count: reviews.length };
  }));

  router.get('/stats', asyncHandler('GET /reviews/stats', async (req) => {
    const { tenant_id, location_id } = req.query;

    if (!tenant_id) {
      throw new Error('tenant_id is required');
    }

    const stats = await reviewAuthority.executeGetStats({
      tenantId: tenant_id,
      locationId: location_id,
    });

    return { stats };
  }));

  router.get('/:id', asyncHandler('GET /reviews/:id', async (req) => {
    const { id } = req.params;
    const { tenant_id } = req.query;

    if (!tenant_id) {
      throw new Error('tenant_id is required');
    }

    const review = await reviewAuthority.executeGetReview({
      tenantId: tenant_id,
      reviewId: id,
    });

    if (!review) throw new Error(`Review ${id} not found`);
    return { review };
  }));

  router.post('/:id/reply', ...scoped(
    (req) => req.body && (req.body.tenant_id || req.body.tenantId),
    'POST /reviews/:id/reply', async (req) => {
    const { id } = req.params;
    const { tenant_id, location_id, reply_text } = req.body;

    if (!tenant_id || !location_id || !reply_text) {
      throw new Error('tenant_id, location_id, and reply_text are required');
    }

    const result = await reviewAuthority.executeReplyToReview({
      tenantId: tenant_id,
      locationId: location_id,
      reviewId: id,
      replyText: reply_text,
    });

    return { result };
  }));

  return router;
}

module.exports = { createReviewRoutes };
