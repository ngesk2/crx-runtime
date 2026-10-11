/**
 * Canonical Event Routes
 * 
 * P001: HTTP interface for the Canonical Event Envelope Authority.
 * 
 * POST /canonical-events — Alias of commissioned writes to the PING journal
 * GET /canonical-events — Query historical canonical_events (not new PING writes)
 * GET /canonical-events/stats — Event statistics
 * GET /canonical-events/unprocessed — Unprocessed events
 * Processing mutations are rejected until their operation has admission support.
 */

const express = require('express');
const { asyncHandler, commissionedWriteHandler, denyUnadmittedMutation } = require('../route_middleware');

function createCanonicalEventRoutes(canonicalEventEnvelope, { eventRuntime, tenantRegistry } = {}) {
  const router = express.Router();
  router.post('/', commissionedWriteHandler(eventRuntime, tenantRegistry));

  router.get('/', asyncHandler('GET /canonical-events', async (req) => {
    const {
      tenant_id, event_type, correlation_id,
      from, to, limit, offset,
    } = req.query;

    if (!tenant_id || !/^[a-z0-9-]{1,64}$/.test(tenant_id)) {
      throw new Error('tenant_id query param is required (tenant isolation fail-closed)');
    }

    const events = await canonicalEventEnvelope.executeQueryEvents({
      tenantId: tenant_id,
      eventType: event_type,
      correlationId: correlation_id,
      from,
      to,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return { events, count: events.length };
  }));

  router.get('/stats', asyncHandler('GET /canonical-events/stats', async (req) => {
    const { tenant_id } = req.query;
    if (!tenant_id || !/^[a-z0-9-]{1,64}$/.test(tenant_id)) {
      throw new Error('tenant_id query param is required (tenant isolation fail-closed)');
    }
    const stats = await canonicalEventEnvelope.executeGetStats(tenant_id);
    return { stats };
  }));

  router.get('/unprocessed', asyncHandler('GET /canonical-events/unprocessed', async (req) => {
    const { tenant_id, limit } = req.query;
    if (!tenant_id || !/^[a-z0-9-]{1,64}$/.test(tenant_id)) {
      throw new Error('tenant_id is required (tenant isolation fail-closed)');
    }
    const events = await canonicalEventEnvelope.executeGetUnprocessed(
      tenant_id,
      limit ? parseInt(limit) : undefined
    );
    return { events, count: events.length };
  }));

  router.post('/:id/processed', denyUnadmittedMutation);
  router.post('/:id/failed', denyUnadmittedMutation);

  return router;
}

module.exports = createCanonicalEventRoutes;
