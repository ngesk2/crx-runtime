/**
 * Events Routes
 * 
 * Bounded context for event query and creation endpoints.
 * HTTP → EventReadAuthority/EventWriteAuthority → Result
 */

const express = require('express');
const { asyncHandler, commissionedWriteHandler, admissionReceiptHandler, denyUnadmittedMutation } = require('../route_middleware');
const { constitutionalTimeAuthority } = require('../../ping-runtime/authorities/constitutional_time_authority.js');

// ─── Lane L tenant isolation ─────────────────────────────────────────────
// Reads require an explicit ?tenant=. New writes use the existing commissioned
// byte boundary; an actor/tenant label in a parsed body is not entitlement.
// The pattern extends the FYD slug shape to admit the mandated UNKNOWN
// backfill marker for unattributable history.
const TENANT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,63}$/;
function isValidTenantId(t) {
  return typeof t === 'string' && TENANT_ID_PATTERN.test(t);
}
// Resolve a row's tenant the way the runtime stamps it: explicit tenant_id,
// then the tenant::<slug> namespace slug, else UNKNOWN (never guessed).
function tenantIdOfRow(row) {
  if (!row) return 'UNKNOWN';
  const t = row.tenant_id || row.TENANT_ID;
  if (typeof t === 'string' && t) return t;
  const ns = row.namespace || row.NAMESPACE;
  if (typeof ns === 'string' && ns.startsWith('tenant::')) {
    const slug = ns.slice('tenant::'.length);
    if (isValidTenantId(slug)) return slug;
  }
  return 'UNKNOWN';
}
// Fail-closed tenant gate for reads. Sends 400 tenant_required and returns
// null when context is missing or invalid; otherwise returns the tenant.
function requireTenant(req, res) {
  const tenant = req.query && req.query.tenant;
  if (!isValidTenantId(tenant)) {
    res.status(400).json({
      error: 'tenant_required',
      message: 'A valid ?tenant=<tenant_id> query parameter is required for tenant-isolated event reads.'
    });
    return null;
  }
  return tenant;
}

function createEventRoutes(eventReadAuthority, eventRuntime, pool, { tenantRegistry } = {}) {
  const router = express.Router();
  router.get('/', asyncHandler('/events', async (req, res) => {
    const tenant = requireTenant(req, res);
    if (!tenant) return;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    // Namespace remains an optional secondary filter; tenant is the mandatory
    // partition. Namespace syntax is enforced (core::<name> | tenant::<id>).
    const namespace = req.query.namespace;
    if (namespace !== undefined && (typeof namespace !== 'string' || !/^(core|tenant)::[a-zA-Z0-9_-]+$/.test(namespace))) {
      throw new Error('Invalid namespace filter');
    }
    let events = await eventReadAuthority.getAllEvents(limit, offset);
    if (events) events = events.filter((e) => tenantIdOfRow(e) === tenant);
    if ((!events || events.length === 0) && pool) {
      const params = [limit, offset, tenant];
      let sql = 'SELECT * FROM ping_events WHERE tenant_id = $3';
      if (namespace) {
        sql += ' AND namespace = $4';
        params.push(namespace);
      }
      sql += ' ORDER BY timestamp DESC LIMIT $1 OFFSET $2';
      const result = await pool.query(sql, params);
      events = result.rows;
    }
    return { events, count: events.length, limit, offset };
  }));

  router.get('/recent', asyncHandler('/events/recent', async (req, res) => {
    const tenant = requireTenant(req, res);
    if (!tenant) return;
    const minutes = parseInt(req.query.minutes) || 60;
    const limit = parseInt(req.query.limit) || 100;
    let events = [];
    try {
      events = await eventReadAuthority.getRecentEvents(minutes, limit);
    } catch (e) {}
    if (events) events = events.filter((e) => tenantIdOfRow(e) === tenant);
    if ((!events || events.length === 0) && pool) {
      const since = new Date(constitutionalTimeAuthority.nowAsMillis() - minutes * 60 * 1000).toISOString();
      const result = await pool.query('SELECT * FROM ping_events WHERE timestamp >= $1 AND tenant_id = $2 ORDER BY timestamp DESC LIMIT $3', [since, tenant, limit]);
      events = result.rows;
    }
    return { events, count: events.length, minutes, limit };
  }));

  router.get('/stats', asyncHandler('/events/stats', async (req, res) => {
    const tenant = requireTenant(req, res);
    if (!tenant) return;
    // Lane L: public stats must always be tenant-scoped. The authority's
    // getEventStats() is global (unscoped), so the tenant-scoped pool query
    // is authoritative whenever a pool is available. Without a pool we cannot
    // produce tenant-scoped stats, so fail closed rather than leaking cross-
    // tenant aggregates.
    let stats = null;
    if (pool) {
      const result = await pool.query(`SELECT COUNT(*) as total_events, COUNT(DISTINCT event_type) as event_types, MIN(timestamp) as oldest_event, MAX(timestamp) as newest_event FROM ping_events WHERE tenant_id = $1`, [tenant]);
      const row = result.rows[0];
      stats = {
        total_events: row.total_events,
        streams: row.total_events,
        event_types: row.event_types,
        oldest_event: row.oldest_event,
        newest_event: row.newest_event
      };
    } else {
      throw new Error('tenant-scoped stats unavailable: no pool');
    }
    return { stats };
  }));

  router.get('/unprocessed', asyncHandler('/events/unprocessed', async (req, res) => {
    const tenant = requireTenant(req, res);
    if (!tenant) return;
    const limit = parseInt(req.query.limit) || 100;
    const events = (await eventReadAuthority.getUnprocessedEvents(limit))
      .filter((e) => tenantIdOfRow(e) === tenant);
    return { events, count: events.length };
  }));
  router.get('/:stream', asyncHandler('/events/:stream', async (req, res) => {
    const tenant = requireTenant(req, res);
    if (!tenant) return;
    const stream = req.params.stream;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    let events = await eventReadAuthority.getEventsByStream(stream, limit, offset);
    if (events) events = events.filter((e) => tenantIdOfRow(e) === tenant);
    if ((!events || events.length === 0) && pool) {
      const result = await pool.query('SELECT * FROM ping_events WHERE event_type = $1 AND tenant_id = $2 ORDER BY timestamp DESC LIMIT $3 OFFSET $4', [stream, tenant, limit, offset]);
      events = result.rows;
    }
    return { events, stream, count: events.length, limit, offset };
  }));

  router.post('/', commissionedWriteHandler(eventRuntime, tenantRegistry));
  // Receipt retrieval is a read of the original decision, never a new grant.
  router.post('/receipt', admissionReceiptHandler(tenantRegistry));
  router.post('/processed', denyUnadmittedMutation);
  router.post('/failed', denyUnadmittedMutation);


  // Causal traversal endpoints — query the causal tree in ping_events
  // via UnifiedEventRuntime's indexed traversal methods.

  router.get('/:eventId/children', asyncHandler('/events/:eventId/children', async (req, res) => {
    const tenant = requireTenant(req, res);
    if (!tenant) return;
    const { eventId } = req.params;
    if (!eventId) throw new Error('eventId is required');
    const limit = parseInt(req.query.limit) || 50;
    const result = await eventRuntime.getChildren(eventId, limit, tenant);
    if (result && result.events) result.events = result.events.filter((e) => tenantIdOfRow(e) === tenant);
    return result;
  }));

  router.get('/:eventId/descendants', asyncHandler('/events/:eventId/descendants', async (req, res) => {
    const tenant = requireTenant(req, res);
    if (!tenant) return;
    const { eventId } = req.params;
    if (!eventId) throw new Error('eventId is required');
    const maxDepth = parseInt(req.query.maxDepth) || 10;
    const limit = parseInt(req.query.limit) || 200;
    const result = await eventRuntime.getDescendants(eventId, maxDepth, limit, tenant);
    if (result && result.events) result.events = result.events.filter((e) => tenantIdOfRow(e) === tenant);
    return result;
  }));

  router.get('/:eventId/ancestors', asyncHandler('/events/:eventId/ancestors', async (req, res) => {
    const tenant = requireTenant(req, res);
    if (!tenant) return;
    const { eventId } = req.params;
    if (!eventId) throw new Error('eventId is required');
    const maxDepth = parseInt(req.query.maxDepth) || 20;
    const result = await eventRuntime.getAncestors(eventId, maxDepth, tenant);
    if (result && result.events) result.events = result.events.filter((e) => tenantIdOfRow(e) === tenant);
    return result;
  }));

  router.get('/correlation/:correlationId', asyncHandler('/events/correlation/:correlationId', async (req, res) => {
    const tenant = requireTenant(req, res);
    if (!tenant) return;
    const { correlationId } = req.params;
    if (!correlationId) throw new Error('correlationId is required');
    const limit = parseInt(req.query.limit) || 200;
    const result = await eventRuntime.getCorrelationGroup(correlationId, limit, tenant);
    if (result && result.events) result.events = result.events.filter((e) => tenantIdOfRow(e) === tenant);
    return result;
  }));

  return router;
}

module.exports = createEventRoutes;
