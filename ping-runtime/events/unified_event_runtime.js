/**
 * Unified Event Runtime — PING Core v1
 * 
 * Single canonical event pipeline. Every event flows through here.
 * Replaces: Gateway CQRS, Gateway Canonical, Orchestration in-memory, BrainOS Python.
 * 
 * Flow: Emitter → EventRuntime → Persistence + Handlers + Integrations
 * 
 * Every event carries:
 * - event_id (SHA-256 deterministic)
 * - event_type (validated against event_registry.json)
 * - timestamp (ConstitutionalTimeAuthority)
 * - source (which connector/worker emitted it)
 * - payload (the data)
 * - metadata (schema_version, causation_id, correlation_id)
 */


// ─── Lane L tenant isolation ─────────────────────────────────────────────
// tenant_id is the immutable logical partition key for ping_events. It is
// never inferred: an explicit option wins, then the tenant::<slug> namespace
// slug, else the UNKNOWN marker for unattributable history. The pattern
// extends the FYD journal slug shape to admit the mandated UNKNOWN backfill.
const TENANT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,63}$/;
function isValidTenantId(t) {
  return typeof t === 'string' && TENANT_ID_PATTERN.test(t);
}
function tenantIdForNamespace(namespace) {
  if (typeof namespace === 'string' && namespace.startsWith('tenant::')) {
    const slug = namespace.slice('tenant::'.length);
    if (isValidTenantId(slug)) return slug;
  }
  return 'UNKNOWN';
}
const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');
// AUTH-CONV-06: event identity and canonicalization owned by the declared
// authorities (shims delegating to runtime/kernel). No inline ID minting,
// no ad-hoc canonical-JSON helpers on the acceptance path.
const { identityAuthority } = require('../authorities/identity_authority.js');
const { CanonicalBytes } = require('../authorities/canonical_authority.js');
// Unforgeable by JSON request options. Only the opt-in commissioned admission method sets it.
const COMMISSIONING_TRANSACTION = Symbol('commissioning-transaction');

// ─── Verdict-class admission authority ─────────────────────────────────
// A verdict-class event asserts an authoritative outcome (a replay verified,
// a witness attested, a lineage recorded, a decision evaluated). Authentication
// proves WHO called; it does not authorize WHAT semantic claim they may make.
// Only the canonical producer worker named below may emit each verdict type,
// and only with qualifying provenance. Everything else fails closed BEFORE
// persistence. This check runs before the _skipGovernance branch: bridges,
// replays, and internal callers cannot bypass it. There is exactly one
// admission choke point (UnifiedEventRuntime.emit) and this is it.
//
// Registry seam: gateway/generated/event_registry.json carries authority_owner
// per event type (ReplayWorker, WitnessWorker, LineageWorker, JevShadowWorker).
// VERDICT_PRODUCERS binds those owners to the actual worker source strings.
// (BaseWorker._emit stamps this._name as source; the string alone is not
// trust — the binding of string-to-execution-context at this choke point is.)
const VERDICT_PRODUCERS = Object.freeze({
  REPLAY_COMPLETED: 'replay',           // registry authority_owner: ReplayWorker
  WITNESS_CREATED: 'witness',           // registry authority_owner: WitnessWorker
  WITNESS_REJECTED: 'witness',          // registry authority_owner: WitnessWorker
  LINEAGE_CREATED: 'lineage',           // registry authority_owner: LineageWorker
  JEV_DECISION_EVALUATED: 'jev-shadow', // registry authority_owner: JevShadowWorker
});

// Verdict-shaped events must also carry qualifying provenance — the evidence
// the genuine producer always attaches. These are structural (shape) checks,
// not truth checks: they reject hand-built forgeries at admission while
// accepting every genuine producer path, including the failure-honest
// verified:false records (which are records, not attestations).
function verdictProvenanceOk(eventType, payload) {
  const p = payload && typeof payload === 'object' ? payload : {};
  switch (eventType) {
    case 'REPLAY_COMPLETED': {
      // The genuine ReplayWorker emits ok / no_provider / kernel_error shapes;
      // all carry a boolean verified. The authority proof is the source check
      // above (only the worker's _emit stamps source 'replay'); this is a
      // well-formedness check, not an evidence gate — the witness qualifies
      // evidence before attesting.
      const r = p.replay;
      return !!r && typeof r === 'object' && typeof r.verified === 'boolean';
    }
    case 'WITNESS_CREATED':
      return !!(p.witness && typeof p.witness === 'object'
        && typeof p.witness.attestation === 'string' && p.witness.attestation.length > 0
        && p.upstreamEventId);
    case 'WITNESS_REJECTED':
      return typeof p.reason === 'string' && p.reason.length > 0 && !!p.upstreamEventId;
    case 'LINEAGE_CREATED':
      return !!(p.lineage && typeof p.lineage === 'object' && p.upstreamEventId);
    case 'JEV_DECISION_EVALUATED':
      return p.mode === 'shadow' && Array.isArray(p.evaluations);
    default:
      return true;
  }
}

class UnifiedEventRuntime {
  /**
   * @param {object} options
   * @param {object} options.pool — pg.Pool for persistence
   * @param {object} options.eventValidator — EventValidator instance
   * @param {object} options.eventGovernance — EventGovernance instance
   * @param {object} options.integrationManager — IntegrationManager instance
   */
  constructor(options = {}) {
    this._pool = options.pool || null;
    this._eventValidator = options.eventValidator || null;
    this._eventGovernance = options.eventGovernance || null;
    this._integrationManager = options.integrationManager || null;
    // Candidate-only switch; existing production bootstrap is unchanged.
    this._requireCommissioningForObjectWrites = options.requireCommissioningForObjectWrites === true;
    this._handlers = new Map();
    this._stats = { emitted: 0, persisted: 0, deduplicated: 0, dispatched: 0, failed: 0 };
  }

  /**
   * Initialize the events table if it doesn't exist.
   */
  async initialize() {
    if (!this._pool) return;
    await this._pool.query(`
      CREATE TABLE IF NOT EXISTS ping_events (
        event_id VARCHAR(64) PRIMARY KEY,
        event_type VARCHAR(255) NOT NULL,
        source VARCHAR(255) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        payload JSONB NOT NULL DEFAULT '{}',
        metadata JSONB NOT NULL DEFAULT '{}',
        namespace VARCHAR(255) NOT NULL DEFAULT 'core::system',
        processed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE ping_events ADD COLUMN IF NOT EXISTS namespace VARCHAR(255) NOT NULL DEFAULT 'core::system';
      CREATE INDEX IF NOT EXISTS idx_ping_events_type ON ping_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_ping_events_source ON ping_events(source);
      CREATE INDEX IF NOT EXISTS idx_ping_events_namespace ON ping_events(namespace);
      CREATE INDEX IF NOT EXISTS idx_ping_events_processed ON ping_events(processed);
      CREATE INDEX IF NOT EXISTS idx_ping_events_timestamp ON ping_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_ping_events_causation ON ping_events ((metadata->>'causation_id'));
      CREATE INDEX IF NOT EXISTS idx_ping_events_correlation ON ping_events ((metadata->>'correlation_id'));
      ALTER TABLE ping_events ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
      -- Lane L: historical backfill is EXACTLY 'UNKNOWN'. Never infer tenant
      -- from namespace; namespace is not a trusted execution context.
      UPDATE ping_events SET tenant_id = 'UNKNOWN' WHERE tenant_id IS NULL;
      ALTER TABLE ping_events ALTER COLUMN tenant_id SET DEFAULT 'UNKNOWN';
      CREATE INDEX IF NOT EXISTS idx_ping_events_tenant_id ON ping_events(tenant_id);
    `);
  }

  /**
   * Emit an event. Validates, persists, dispatches to handlers, and routes to integrations.
   * @param {string} eventType — e.g., 'REVIEW_RECEIVED', 'CUSTOMER_CREATED'
   * @param {string} source — which connector/worker emitted it
   * @param {object} payload — the event data
  /**
   * Verdict-class admission authority. Returns { ok:true } for non-verdict
   * event types. For verdict-class types, the source must be the canonical
   * producer worker AND the payload must carry qualifying provenance.
   * Authentication (who called) never substitutes for this authorization
   * (what the caller may assert). Runs before _skipGovernance: unskippable.
   */
  _assertVerdictAuthority(eventType, source, payload) {
    const producer = VERDICT_PRODUCERS[eventType];
    if (!producer) return { ok: true };
    if (source !== producer) {
      return {
        ok: false,
        reason: `verdict_not_authorized: ${eventType} may only be produced by '${producer}' (got source '${source}')`,
      };
    }
    if (!verdictProvenanceOk(eventType, payload)) {
      return {
        ok: false,
        reason: `verdict_provenance_missing: ${eventType} from '${source}' lacks qualifying producer provenance`,
      };
    }
    return { ok: true };
  }

  /**
   * Emit an event. Validates, persists, dispatches to handlers, and routes to integrations.
   * @param {string} eventType — e.g., 'REVIEW_RECEIVED', 'CUSTOMER_CREATED'
   * @param {string} source — which connector/worker emitted it
   * @param {object} payload — the event data
   * @param {object} options — { causation_id, correlation_id, metadata, namespace, logical_id }
   */
  async emit(eventType, source, payload, options = {}) {
    if (this._requireCommissioningForObjectWrites &&
        ['OBJECT_CREATED','OBJECT_UPDATED','RELATIONSHIP_CREATED'].includes(eventType) &&
        !options[COMMISSIONING_TRANSACTION]) {
      this._stats.failed++;
      return {status:'error',error:'commissioning_required'};
    }
    // 1. Generate deterministic event_id (content-based, no Date.now()).
    //    Identity material = { eventType, source, [namespace], [logical_id|payload] }.
    //    Namespace + logical_id are only included when provided, so legacy callers
    //    keep their existing event IDs (idempotent retries preserved).
    //    logical_id is the timestamp-stripped logical identity — two emissions of the
    //    same logical event (even with different timestamps in payload) hash identically.
    // Lane O authority repair: tenant_id is validated fail-closed here, then the
    // event ID is minted through the declared IdentityAuthority (AUTH-CONV-06),
    // never inline. tenant_id joins the identity material only when explicitly
    // provided, so legacy callers keep byte-identical event IDs.
    if (options.tenant_id !== undefined && options.tenant_id !== null && !isValidTenantId(options.tenant_id)) {
      this._stats.failed++;
      return { status: "error", error: `invalid tenant_id: ${options.tenant_id}` };
    }
    const eventId = identityAuthority.generateSpineEventId(eventType, source, {
      namespace: options.namespace,
      logical_id: options.logical_id,
      payload,
      tenant_id: (options.tenant_id !== undefined && options.tenant_id !== null) ? options.tenant_id : undefined,
    });

    // 2. Validate event type
    if (this._eventValidator) {
      if (typeof this._eventValidator.validateEventType === 'function') {
        const validation = this._eventValidator.validateEventType(eventType);
        if (!validation.valid) {
          this._stats.failed++;
          return { status: 'error', error: validation.error, eventId };
        }
      } else if (typeof this._eventValidator.isRegistered === 'function') {
        if (!this._eventValidator.isRegistered(eventType)) {
          this._stats.failed++;
          return { status: 'error', error: `Unknown event_type: ${eventType}`, eventId };
        }
      }
    }

    // 2b. Verdict-class admission authority — fail closed before persistence.
    // Runs before the _skipGovernance branch: no caller (API, bridge, replay,
    // internal) can bypass producer authorization for verdict-class events.
    const verdictCheck = this._assertVerdictAuthority(eventType, source, payload);
    if (!verdictCheck.ok) {
      this._stats.failed++;
      return { status: 'error', error: verdictCheck.reason, eventId };
    }

    // 3. Check governance (skip for bridge-sourced events that are already governed).
    //    Namespace is resolved exactly once here — the spine is the single owner of
    //    the 'core::system' default — and passed into governance so the canonical
    //    privacy boundary (core::<name> | tenant::<id>) is validated at this one
    //    choke point rather than re-derived by every downstream caller.
    const namespace = options.namespace || 'core::system';
    // Lane L: immutable tenant partition. Explicit option wins, then the
    // tenant::<slug> namespace slug, else UNKNOWN (never guessed).
    const tenantId = (options.tenant_id !== undefined && options.tenant_id !== null)
      ? options.tenant_id
      : tenantIdForNamespace(namespace);
    if (this._eventGovernance && !options._skipGovernance) {
      const governance = this._eventGovernance.validateEvent({
        event_type: eventType,
        source,
        payload,
        namespace,
      });
      if (!governance.valid) {
        this._stats.failed++;
        // _reject() returns { errors:[reason], code } — surface the reason string.
        const reason = governance.error || (governance.errors && governance.errors[0]) || 'Governance violation';
        return { status: 'error', error: reason, code: governance.code, eventId };
      }
    }

    // 4. Build canonical event (namespace resolved in step 3)
    //    Confidence is optional — producers that compute it pass it via options.metadata.confidence.
    //    The spine carries but does NOT compute confidence; each worker re-evaluates at its hop.
    const event = {
      event_id: eventId,
      event_type: eventType,
      source,
      namespace,
      tenant_id: tenantId,
      timestamp: constitutionalTimeAuthority.nowAsISOString(),
      payload,
      metadata: {
        schema_version: '1.0.0',
        namespace,
        causation_id: options.causation_id || null,
        correlation_id: options.correlation_id || eventId,
        ...(options.metadata && options.metadata.confidence != null
          ? { confidence: options.metadata.confidence }
          : {}),
        ...options.metadata,
      },
    };

    let inserted = false;
    // 5. Persist - fail closed if no pool (never return ok without durability)
    if (!this._pool) {
      this._stats.failed++;
      return { status: "error", error: "No persistence available: event not durably stored", eventId };
    }
    {
      try {
        const persistence = options[COMMISSIONING_TRANSACTION]?.client || this._pool;
        const result = await persistence.query(
          `INSERT INTO ping_events (event_id, event_type, source, timestamp, payload, metadata, namespace, tenant_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (event_id) DO NOTHING`,
          [event.event_id, event.event_type, event.source, event.timestamp,
           JSON.stringify(event.payload), JSON.stringify(event.metadata), event.namespace, event.tenant_id]
        );
        // Only count actual inserts, not ON CONFLICT DO NOTHING no-ops
        if ((result.rowCount || 0) > 0) {
          inserted = true;
          if (!options[COMMISSIONING_TRANSACTION]) this._stats.persisted++;
        } else {
          // CONFLICT: check if this is a true duplicate or a semantic collision
          const existing = await persistence.query(
            "SELECT payload FROM ping_events WHERE event_id = $1",
            [event.event_id]
          );
          if (existing.rows.length > 0) {
            const rawPayload = existing.rows[0].payload;
            const existingPayload = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
            // Compare deep-canonical bytes for semantic equivalence
            // (AUTH-CONV-06: single canonical serializer, no ad-hoc inline canon)
            if (CanonicalBytes.serializeString(existingPayload) !== CanonicalBytes.serializeString(event.payload)) {
              // COLLISION: same ID, different semantics — fail closed
              this._stats.failed++;
              return { status: "error", error: "Event ID collision: same event_id with different payload semantics", eventId };
            }
          }
          if (!options[COMMISSIONING_TRANSACTION]) this._stats.deduplicated++;
        }
      } catch (err) {
        this._stats.failed++;
        return { status: 'error', error: `Persist failed: ${err.message}`, eventId };
      }
    }

    if (options[COMMISSIONING_TRANSACTION]) return { status: 'ok', eventId, event, inserted };
    await this._dispatchCommitted(event);
    return { status: 'ok', eventId, event };
  }

  async admitCommissionedBytes(tenantRegistry,context,raw) {
    return this.admitCommissionedEvent(tenantRegistry,context,
      require('../runtime/commissioning_wire').parseCommissioningSubmission(raw));
  }

  async admitCommissionedEvent(tenantRegistry, context, submission) {
    // No route/bootstrap is wired to this candidate. Reuses emit's one SQL writer.
    if (tenantRegistry._commissioningPool !== this._pool) throw new Error('commissioning_pool_mismatch');
    const result = await tenantRegistry.executeWithCommissioningGrant(context, submission, (client, data) =>
      this.emit(data.intent.operation, `commissioned:${data.intent.authenticated_actor}`, data.payload, {
        tenant_id: data.intent.tenant_id, namespace: `tenant::${data.intent.tenant_id}`,
        logical_id: `${data.intent.authenticated_actor}:${data.intent.logical_operation_id}`,
        metadata: { ...data.metadata, commissioning: { grant_id:data.intent.grant_id,
          grant_revision:data.intent.grant_revision, operation_digest:data.operationDigest } },
        [COMMISSIONING_TRANSACTION]: {client},
      }));
    // No derived state, handler, or integration can run before the receipt commits.
    if (!result.duplicate) {
      if (result.inserted) this._stats.persisted++;
      await this._dispatchCommitted(result.event);
    } else this._stats.deduplicated++;
    return result;
  }

  async _dispatchCommitted(event) {
    const eventType = event.event_type;
    // 6. Dispatch to handlers
    const handlers = this._handlers.get(eventType) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
        this._stats.dispatched++;
      } catch (err) {
        console.error(`[EventRuntime] Handler failed for ${eventType}:`, err.message);
      }
    }

    // 7. Route to integrations
    if (this._integrationManager) {
      try {
        await this._integrationManager.emit(event.event_type, event.payload);
      } catch (err) {
        console.error(`[EventRuntime] Integration routing failed:`, err.message);
      }
    }

    this._stats.emitted++;
  }

  /**
   * Subscribe to an event type.
   * @param {string} eventType — event type to listen for
   * @param {function} handler — async function(event)
   */
  on(eventType, handler) {
    if (!this._handlers.has(eventType)) {
      this._handlers.set(eventType, []);
    }
    this._handlers.get(eventType).push(handler);
  }

  /**
   * Query events.
   */
  async query(options = {}) {
    if (!this._pool) return { status: 'error', error: 'No pool' };

    let sql = 'SELECT * FROM ping_events WHERE 1=1';
    const params = [];
    let idx = 1;

    if (options.eventType) {
      sql += ` AND event_type = $${idx++}`;
      params.push(options.eventType);
    }
    if (options.source) {
      sql += ` AND source = $${idx++}`;
      params.push(options.source);
    }
    if (options.since) {
      sql += ` AND timestamp >= $${idx++}`;
      params.push(options.since);
    }
    if (options.unprocessed) {
      sql += ` AND processed = FALSE`;
    }
    if (options.tenantId !== undefined && options.tenantId !== null) {
      sql += ` AND tenant_id = $${idx++}`;
      params.push(options.tenantId);
    }

    sql += ` ORDER BY timestamp DESC`;
    if (options.limit) {
      sql += ` LIMIT $${idx++}`;
      params.push(options.limit);
    }

    const result = await this._pool.query(sql, params);
    return { status: 'ok', events: result.rows, count: result.rowCount };
  }

  /**
   * Get direct children of an event (events caused by it).
   * Uses the causation_id expression index for O(log n) lookup.
   * @param {string} eventId — parent event_id
   * @param {number} [limit=50]
   * @returns {{ status: string, events: Array }}
   */
  async getChildren(eventId, limit = 50, tenantId = null) {
    if (!this._pool) return { status: 'error', error: 'No pool' };
    const params = [eventId, limit];
    let tenantFilter = '';
    if (tenantId !== null && tenantId !== undefined) {
      tenantFilter = ' AND tenant_id = $3';
      params.push(tenantId);
    }
    const result = await this._pool.query(
      `SELECT event_id, event_type, source, timestamp, payload, metadata, namespace, tenant_id
       FROM ping_events
       WHERE metadata->>'causation_id' = $1${tenantFilter}
       ORDER BY created_at ASC
       LIMIT $2`,
      params
    );
    return { status: 'ok', events: result.rows };
  }

  /**
   * Get all descendants of an event (recursive tree walk via causation_id).
   * Returns the full subtree breadth-first, with depth for each node.
   * @param {string} eventId — root event_id
   * @param {number} [maxDepth=10] — safety limit
   * @param {number} [limit=200] — total event limit
   * @returns {{ status: string, events: Array }}
   */
  async getDescendants(eventId, maxDepth = 10, limit = 200, tenantId = null) {
    if (!this._pool) return { status: 'error', error: 'No pool' };
    const result = await this._pool.query(
      `WITH RECURSIVE causal_tree AS (
        SELECT event_id, event_type, source, timestamp, payload, metadata, namespace, tenant_id,
               0 AS depth, ARRAY[event_id] AS path
        FROM ping_events
        WHERE event_id = $1
        UNION ALL
        SELECT e.event_id, e.event_type, e.source, e.timestamp, e.payload, e.metadata, e.namespace, e.tenant_id,
               ct.depth + 1, ct.path || e.event_id
        FROM ping_events e
        JOIN causal_tree ct ON e.metadata->>'causation_id' = ct.event_id
        WHERE ct.depth < $3
          AND NOT e.event_id = ANY(ct.path)
      )
      SELECT event_id, event_type, source, timestamp, payload, metadata, namespace, tenant_id, depth, path
      FROM causal_tree
      WHERE ($4::text IS NULL OR tenant_id = $4)
      ORDER BY depth ASC, created_at ASC
      LIMIT $2`,
      [eventId, limit, maxDepth, tenantId]
    );
    return { status: 'ok', events: result.rows };
  }

  /**
   * Get all ancestors of an event (walk up the causation chain).
   * Returns the chain from immediate parent to root, with depth.
   * @param {string} eventId — leaf event_id
   * @param {number} [maxDepth=20] — safety limit
   * @returns {{ status: string, events: Array }}
   */
  async getAncestors(eventId, maxDepth = 20, tenantId = null) {
    if (!this._pool) return { status: 'error', error: 'No pool' };
    const result = await this._pool.query(
      `WITH RECURSIVE causal_chain AS (
        SELECT event_id, event_type, source, timestamp, payload, metadata, namespace, tenant_id,
               0 AS depth, ARRAY[event_id] AS path
        FROM ping_events
        WHERE event_id = $1
        UNION ALL
        SELECT e.event_id, e.event_type, e.source, e.timestamp, e.payload, e.metadata, e.namespace, e.tenant_id,
               cc.depth + 1, cc.path || e.event_id
        FROM ping_events e
        JOIN causal_chain cc ON e.event_id = cc.metadata->>'causation_id'
        WHERE cc.depth < $2
          AND NOT e.event_id = ANY(cc.path)
      )
      SELECT event_id, event_type, source, timestamp, payload, metadata, namespace, tenant_id, depth, path
      FROM causal_chain
      WHERE ($3::text IS NULL OR tenant_id = $3)
      ORDER BY depth ASC`,
      [eventId, maxDepth, tenantId]
    );
    return { status: 'ok', events: result.rows };
  }

  /**
   * Get full correlation group (all events sharing the same correlation_id).
   * This is the "view everything from one originating observation" query.
   * @param {string} correlationId
   * @param {number} [limit=200]
   * @returns {{ status: string, events: Array }}
   */
  async getCorrelationGroup(correlationId, limit = 200, tenantId = null) {
    if (!this._pool) return { status: 'error', error: 'No pool' };
    const result = await this._pool.query(
      `SELECT event_id, event_type, source, timestamp, payload, metadata, namespace, tenant_id
       FROM ping_events
       WHERE metadata->>'correlation_id' = $1
         AND ($3::text IS NULL OR tenant_id = $3)
       ORDER BY created_at ASC
       LIMIT $2`,
      [correlationId, limit, tenantId]
    );
    return { status: 'ok', events: result.rows };
  }

  /**
   * Get stats.
   */
  getStats() {
    return { ...this._stats, handlers: this._handlers.size };
  }
}

module.exports = { UnifiedEventRuntime };
