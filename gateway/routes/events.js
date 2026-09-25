/**
 * Events Routes
 * 
 * Bounded context for event query and creation endpoints.
 * HTTP → EventReadAuthority/EventWriteAuthority → Result
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../route_middleware');
const { constitutionalTimeAuthority } = require('../../ping-runtime/authorities/constitutional_time_authority.js');

// ─── Lane L tenant isolation ─────────────────────────────────────────────
// Mirrors the proven FYD journal gateway contract: reads require an explicit
// ?tenant= (400 tenant_required); writes carry an immutable tenant_id
// (400 tenant_required when missing, 400 tenant_mismatch on contradiction).
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

function createEventRoutes(eventReadAuthority, eventRuntime, pool) {
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

  router.post('/', asyncHandler('/events', async (req, res) => {
    // Lane L: immutable tenant_id on write. Required in the body; a missing
    // or invalid tenant fails closed (400 tenant_required) and any
    // contradiction between the declared tenant and the namespace or payload
    // identity fails closed (400 tenant_mismatch). The tenant is stored once
    // and never updated.
    const writeTenant = req.body && req.body.tenant_id;
    if (!isValidTenantId(writeTenant)) {
      res.status(400).json({
        error: 'tenant_required',
        message: 'A valid tenant_id is required in the request body for tenant-isolated event writes.'
      });
      return;
    }
    const bodyNamespace = req.body && req.body.namespace;
    if (typeof bodyNamespace === 'string' && bodyNamespace.startsWith('tenant::') &&
        bodyNamespace.slice('tenant::'.length) !== writeTenant) {
      res.status(400).json({
        error: 'tenant_mismatch',
        message: 'tenant_id contradicts the tenant:: namespace slug.'
      });
      return;
    }
    // Declared payload identity must agree with the write tenant (mirrors the
    // FYD journal's spoof guard; siteId is FYD-specific and not checked here).
    const payloadTenantClash = (eventData) => {
      if (!eventData || typeof eventData !== 'object') return null;
      for (const key of ['tenant_id', 'tenantId']) {
        const v = eventData[key];
        if (typeof v === 'string' && v && v !== writeTenant) return key;
      }
      return null;
    };
    // Website-BFF practice envelope: { type, payload, proof, metadata }.
    // Normalized into canonical journal shape by the social ingest adapter
    // (BFF signature verified; vocabulary enforced; ids minted by the ONE
    // IdentityAuthority). Typed client errors return 400.
    if (req.body && req.body.type && req.body.payload && !req.body.event_type) {
      // Lane B (2026-09-21, additive): knowledge envelopes (payload.schema
      // 'ping.knowledge.*') normalize through the knowledge ingest adapter;
      // everything else keeps the proven social adapter. The social path is
      // untouched.
      const kSchema = req.body.payload && req.body.payload.schema;
      const adapter =
        typeof kSchema === 'string' && kSchema.startsWith('ping.knowledge.')
          ? require('../knowledge_ingest_adapter')
          : require('../social_ingest_adapter');
      const normalize =
        adapter.normalizeKnowledgeEnvelope || adapter.normalizeBffEnvelope;
      let norm;
      try {
        norm = await normalize(req.body, pool);
      } catch (e) {
        const code = String(e.message || 'INGEST_ERROR').split(':')[0];
        const client = /^(INVALID_|UNKNOWN_|MISSING_|UNSUPPORTED_|PREDICATE_|SECRET_|SIGNER_)/.test(code);
        res.status(client ? 400 : 500).json({ error: code, message: e.message });
        return;
      }
      const bffClash = payloadTenantClash(req.body.payload) || payloadTenantClash(norm.eventData);
      if (bffClash) {
        res.status(400).json({
          error: 'tenant_mismatch',
          message: `payload.${bffClash} contradicts the write tenant_id.`
        });
        return;
      }
      const bffResult = await eventRuntime.emit(norm.eventType, 'api', norm.eventData, {
        metadata: { aggregate_id: norm.aggregateId, aggregate_type: norm.aggregateType },
        tenant_id: writeTenant
      });
      if (bffResult.status !== 'ok') {
        throw new Error(bffResult.error || 'Event rejected');
      }
      return {
        event_id: bffResult.eventId,
        id: bffResult.eventId, // BFF-reader compatibility: the website BFF reads `id`
        event_type: norm.eventType,
        aggregate_id: norm.aggregateId,
        aggregate_type: norm.aggregateType,
        status: 'ok'
      };
    }

    const { event_type, aggregate_id, aggregate_type, event_data } = req.body;
    if (!event_type || !aggregate_id || !aggregate_type || !event_data) {
      throw new Error('event_type, aggregate_id, aggregate_type, and event_data are required');
    }
    const directClash = payloadTenantClash(event_data);
    if (directClash) {
      res.status(400).json({
        error: 'tenant_mismatch',
        message: `event_data.${directClash} contradicts the write tenant_id.`
      });
      return;
    }
    // Canonical spine: emit directly through UnifiedEventRuntime (ping_events),
    // not through the kernel pipeline (repository_events). The kernel's reducer/projection
    // registries are empty and EventBridge adds a 5s delay for no benefit.
    const result = await eventRuntime.emit(event_type, 'api', event_data, {
      metadata: { aggregate_id, aggregate_type },
      tenant_id: writeTenant
    });
    if (result.status !== 'ok') {
      throw new Error(result.error || 'Event rejected');
    }
    return { event_id: result.eventId, event_type, status: 'ok' };
  }));

  router.post('/processed', asyncHandler('/events/processed', async (req, res) => {
    const tenant = requireTenant(req, res);
    if (!tenant) return;
    const { event_id, worker } = req.body;
    if (!event_id) throw new Error('event_id is required');
    // Lane L: cross-tenant mutation guard. An event known to ping_events under
    // a different tenant is refused without touching it (typed refusal).
    if (pool) {
      const chk = await pool.query('SELECT tenant_id FROM ping_events WHERE event_id = $1', [event_id]);
      if (chk.rows.length > 0 && chk.rows[0].tenant_id && chk.rows[0].tenant_id !== tenant) {
        res.status(400).json({ error: 'tenant_mismatch', message: 'Event belongs to a different tenant; mutation refused.' });
        return;
      }
    }
    const ok = await eventReadAuthority.markProcessed(event_id, worker || 'worker_runtime');
    if (!ok) throw new Error(`Failed to mark event processed: ${event_id}`);
    return { processed: true, event_id };
  }));

  router.post('/failed', asyncHandler('/events/failed', async (req, res) => {
    const tenant = requireTenant(req, res);
    if (!tenant) return;
    const { event_id, worker, error } = req.body;
    if (!event_id) throw new Error('event_id is required');
    // Lane L: cross-tenant mutation guard (see /processed).
    if (pool) {
      const chk = await pool.query('SELECT tenant_id FROM ping_events WHERE event_id = $1', [event_id]);
      if (chk.rows.length > 0 && chk.rows[0].tenant_id && chk.rows[0].tenant_id !== tenant) {
        res.status(400).json({ error: 'tenant_mismatch', message: 'Event belongs to a different tenant; mutation refused.' });
        return;
      }
    }
    const ok = await eventReadAuthority.markFailed(event_id, worker || 'worker_runtime', error || 'unknown');
    if (!ok) throw new Error(`Failed to mark event failed: ${event_id}`);
    return { failed: true, event_id };
  }));


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
