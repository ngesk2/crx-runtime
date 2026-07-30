/**
 * Events Routes
 * 
 * Bounded context for event query and creation endpoints.
 * HTTP → EventReadAuthority/EventWriteAuthority → Result
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../route_middleware');

function createEventRoutes(eventReadAuthority, executeEvent, pool) {
  router.get('/', asyncHandler('/events', async (req) => {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    let events = await eventReadAuthority.getAllEvents(limit, offset);
    if ((!events || events.length === 0) && pool) {
      const result = await pool.query('SELECT * FROM ping_events ORDER BY timestamp DESC LIMIT $1 OFFSET $2', [limit, offset]);
      events = result.rows;
    }
    return { events, count: events.length, limit, offset };
  }));

  router.get('/recent', asyncHandler('/events/recent', async (req) => {
    const minutes = parseInt(req.query.minutes) || 60;
    const limit = parseInt(req.query.limit) || 100;
    let events = [];
    try {
      events = await eventReadAuthority.getRecentEvents(minutes, limit);
    } catch (e) {}
    if ((!events || events.length === 0) && pool) {
      const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      const result = await pool.query('SELECT * FROM ping_events WHERE timestamp >= $1 ORDER BY timestamp DESC LIMIT $2', [since, limit]);
      events = result.rows;
    }
    return { events, count: events.length, minutes, limit };
  }));

  router.get('/stats', asyncHandler('/events/stats', async (req) => {
    let stats;
    try {
      stats = await eventReadAuthority.getEventStats();
    } catch (e) {}
    if ((!stats || !stats.total_events || stats.total_events === '0') && pool) {
      const result = await pool.query(`SELECT COUNT(*) as total_events, COUNT(DISTINCT event_type) as event_types, MIN(timestamp) as oldest_event, MAX(timestamp) as newest_event FROM ping_events`);
      const row = result.rows[0];
      stats = {
        total_events: row.total_events,
        streams: row.total_events,
        event_types: row.event_types,
        oldest_event: row.oldest_event,
        newest_event: row.newest_event
      };
    }
    return { stats };
  }));

  router.get('/:stream', asyncHandler('/events/:stream', async (req) => {
    const stream = req.params.stream;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    let events = await eventReadAuthority.getEventsByStream(stream, limit, offset);
    if ((!events || events.length === 0) && pool) {
      const result = await pool.query('SELECT * FROM ping_events WHERE event_type = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3', [stream, limit, offset]);
      events = result.rows;
    }
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
