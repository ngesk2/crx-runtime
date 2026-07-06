/**
 * Events Routes
 * 
 * Bounded context for event query and creation endpoints.
 * HTTP → EventReadAuthority/EventWriteAuthority → Result
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../route_middleware');

function createEventRoutes(eventReadAuthority, executeEvent) {
  router.get('/', asyncHandler('/events', async (req) => {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const events = await eventReadAuthority.getAllEvents(limit, offset);
    return { events, count: events.length, limit, offset };
  }));

  router.get('/recent', asyncHandler('/events/recent', async (req) => {
    const minutes = parseInt(req.query.minutes) || 60;
    const limit = parseInt(req.query.limit) || 100;
    const events = await eventReadAuthority.getRecentEvents(minutes, limit);
    return { events, count: events.length, minutes, limit };
  }));

  router.get('/stats', asyncHandler('/events/stats', async (req) => {
    const stats = await eventReadAuthority.getEventStats();
    return { stats };
  }));

  router.get('/:stream', asyncHandler('/events/:stream', async (req) => {
    const stream = req.params.stream;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const events = await eventReadAuthority.getEventsByStream(stream, limit, offset);
    return { events, stream, count: events.length, limit, offset };
  }));

  router.post('/', asyncHandler('/events', async (req) => {
    const { event_type, aggregate_id, aggregate_type, event_data } = req.body;
    if (!event_type || !aggregate_id || !aggregate_type || !event_data) {
      throw new Error('event_type, aggregate_id, aggregate_type, and event_data are required');
    }
    const artifact = await executeEvent({
      event_type, aggregate_id, aggregate_type, event_data, authority: 'api', sequence: 1
    });
    if (artifact.failed) {
      throw new Error(artifact.error.message);
    }
    return artifact.toResponse();
  }));

  router.post('/processed', asyncHandler('/events/processed', async (req) => {
    const { event_id, worker } = req.body;
    if (!event_id) throw new Error('event_id is required');
    await eventReadAuthority.markProcessed(event_id, worker || 'worker_runtime');
    return { processed: true, event_id };
  }));

  router.post('/failed', asyncHandler('/events/failed', async (req) => {
    const { event_id, worker, error } = req.body;
    if (!event_id) throw new Error('event_id is required');
    await eventReadAuthority.markFailed(event_id, worker || 'worker_runtime', error || 'unknown');
    return { failed: true, event_id };
  }));

  router.get('/unprocessed', asyncHandler('/events/unprocessed', async (req) => {
    const limit = parseInt(req.query.limit) || 100;
    const events = await eventReadAuthority.getUnprocessedEvents(limit);
    return { events, count: events.length };
  }));

  return router;
}

module.exports = createEventRoutes;
