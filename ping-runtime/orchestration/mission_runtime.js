/**
 * Mission Runtime — PING Core v1
 * 
 * Single canonical mission system. Missions are work units dispatched by Orca,
 * executed by workers, tracked here. Replaces 12 dead mission implementations.
 * 
 * Mission lifecycle: created → assigned → running → completed/failed → archived
 *
 * Retry lifecycle (F-01 repair): running → retry_pending →(reclaimRetryPending,
 * backoff-gated)→ created → assigned → running … → failed (exhaustion).
 * retry_pending rows are NEVER dispatched directly: they re-enter through the
 * conditional claim, so every attempt is counted and retries stay bounded.
 * 
 * Mission Control navigates these via events/queues, not CRUD.
 */

// W3 MISSION tenant binding. Missions carry an immutable tenant_id set at
// creation from trusted execution context (options.tenant_id). Missing or
// invalid tenant fails closed (throws); it is never defaulted from, and never
// taken from, the mission payload (spoof surface). Tenant joins the
// idempotency key so the same event_id in two tenants never collides into
// ON CONFLICT DO NOTHING silence.
const MISSION_TENANT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,63}$/;
const { isDeepStrictEqual } = require('node:util');

function requireMissionTenantId(tenantId) {
  if (typeof tenantId !== 'string' || !MISSION_TENANT_ID_PATTERN.test(tenantId)) {
    throw new Error('MissionRuntime: valid options.tenant_id is required (tenant isolation fail-closed)');
  }
  return tenantId;
}

function missionError(code, message = code, status = 'UNKNOWN') {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function jsonValue(value) {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (_) { return value; }
  }
  return value;
}

function sameMissionSemantics(row, expected) {
  return row && row.tenant_id === expected.tenant_id &&
    row.mission_type === expected.mission_type &&
    row.priority === expected.priority &&
    row.created_by === expected.created_by &&
    isDeepStrictEqual(jsonValue(row.payload), expected.payload);
}

function sameCreatedEvent(event, expected) {
  return event && event.event_type === 'MISSION_CREATED' &&
    event.source === 'mission-runtime' && event.tenant_id === expected.tenant_id &&
    isDeepStrictEqual(jsonValue(event.payload), expected.eventPayload);
}

class MissionRuntime {
  /**
   * @param {object} options
   * @param {object} options.pool — pg.Pool
   * @param {object} options.eventRuntime — UnifiedEventRuntime instance
   */
  constructor(options = {}) {
    this._pool = options.pool || null;
    this._eventRuntime = options.eventRuntime || null;
    this._tenantRegistry = options.tenantRegistry || null;
    this._activeMissions = new Map();
  }

  /** Preserve the existing durable mission identity rule exactly. */
  static missionIdFor(tenantId, missionType, payload = {}) {
    const tenant = requireMissionTenantId(tenantId);
    const crypto = require('crypto');
    const idempotencyKey = payload.event_id
      ? `${tenant}:${missionType}:${payload.event_id}`
      : `${tenant}:${missionType}:${JSON.stringify(payload)}`;
    return crypto.createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 16);
  }

  async _withCreateTransaction(action) {
    if (!this._pool || typeof this._pool.connect !== 'function') {
      throw new Error('MissionRuntime: PostgreSQL transaction connection is required');
    }
    const client = await this._pool.connect();
    let began = false;
    let broken = false;
    let committing = false;
    try {
      await client.query('BEGIN');
      began = true;
      await client.query(`SELECT set_config('statement_timeout','5000ms',true),
        set_config('lock_timeout','5000ms',true),
        set_config('idle_in_transaction_session_timeout','5000ms',true)`);
      const result = await action(client);
      committing = true;
      await client.query('COMMIT');
      return result;
    } catch (error) {
      if (committing) {
        // A failed COMMIT acknowledgement cannot distinguish rollback from a
        // commit whose response was lost. Evict this connection and expose UNKNOWN.
        broken = true;
        throw missionError('mission_outcome_unknown', 'Mission creation commit outcome is unknown');
      }
      if (!began) broken = true;
      if (began) {
        let timer;
        try {
          const rolledBack = await Promise.race([
            client.query('ROLLBACK').then(() => true, () => false),
            new Promise(resolve => { timer = setTimeout(() => resolve(false), 1000); }),
          ]);
          if (!rolledBack) broken = true;
        } catch (_) { broken = true; }
        finally { if (timer) clearTimeout(timer); }
      }
      throw error;
    } finally {
      try { client.release(broken); }
      catch (releaseError) {
        // Preserve the operation's commit/rollback result; a pool release
        // fault must not turn a known commit into a retryable create failure.
        console.error('[MissionRuntime] Transaction client release failed:', releaseError.message);
      }
    }
  }

  async _readMission(client, missionId) {
    const result = await client.query(
      `SELECT mission_id, mission_type, payload, priority, created_by, tenant_id
       FROM ping_missions WHERE mission_id = $1 FOR UPDATE`,
      [missionId]
    );
    return result.rows[0] || null;
  }

  async _findCreatedEvent(client, expected) {
    const result = await client.query(
      `SELECT event_id, event_type, source, tenant_id, payload
       FROM ping_events
       WHERE tenant_id = $1 AND event_type = 'MISSION_CREATED'
         AND source = 'mission-runtime' AND payload->>'missionId' = $2
       ORDER BY event_id LIMIT 2`,
      [expected.tenant_id, expected.mission_id]
    );
    if (result.rows.length !== 1 || !sameCreatedEvent(result.rows[0], expected)) {
      throw missionError('mission_evidence_unproven', 'Existing mission lacks one matching durable MISSION_CREATED event');
    }
    return result.rows[0];
  }

  async _findAdmittedMissionEvidence(client, expected, intent) {
    const actorId = intent.authenticated_actor;
    const result = await client.query(
      `SELECT r.tenant_id AS receipt_tenant_id, r.actor_id AS receipt_actor_id,
              r.logical_operation_id AS receipt_logical_operation_id,
              r.operation_digest AS receipt_operation_digest, r.grant_id AS receipt_grant_id,
              r.grant_revision AS receipt_grant_revision,
              r.authorization_decision_at AS receipt_decision_at,
              r.event_id, r.receipt,
              e.event_type, e.source, e.tenant_id, e.payload, e.metadata
       FROM tenant_admission_receipts r
       JOIN ping_events e ON e.event_id = r.event_id
       WHERE r.tenant_id = $1 AND r.actor_id = $2
         AND r.receipt->>'operation' = 'MISSION_CREATE'
         AND r.receipt->>'resource_id' = $3
         AND r.receipt->>'controller_id' = $4
         AND r.receipt->>'commissioning_project_id' = $5
         AND r.receipt->>'site_id' = $6
         AND r.receipt->>'tenant_id' = $1
         AND r.receipt->>'authenticated_actor' = $2
         AND e.event_type = 'MISSION_CREATED' AND e.source = 'mission-runtime'
         AND e.tenant_id = $1 AND e.payload->>'missionId' = $7
         AND EXISTS (
           SELECT 1 FROM tenant_admission_receipts anchor
           WHERE anchor.tenant_id = $1 AND anchor.actor_id = $2 AND anchor.event_id = e.event_id
             AND anchor.receipt->>'schema' = 'commissioning-admission-receipt@2'
             AND anchor.receipt->>'operation' = 'MISSION_CREATE'
             AND anchor.receipt->>'authenticated_actor' = $2
             AND anchor.receipt->>'tenant_id' = $1
             AND anchor.receipt->>'controller_id' = $4
             AND anchor.receipt->>'commissioning_project_id' = $5
             AND anchor.receipt->>'site_id' = $6
             AND anchor.receipt->>'resource_id' = $3
             AND anchor.receipt->>'event_id' = anchor.event_id
             AND anchor.receipt->>'operation_digest' = anchor.operation_digest
             AND anchor.receipt->>'grant_id' = anchor.grant_id
             AND anchor.receipt->>'grant_revision' = anchor.grant_revision::text
             AND anchor.grant_id = e.metadata->'commissioning'->>'grant_id'
             AND anchor.grant_revision::text = e.metadata->'commissioning'->>'grant_revision'
             AND anchor.operation_digest = e.metadata->'commissioning'->>'operation_digest'
         )
       ORDER BY r.authorization_decision_at DESC LIMIT 2`,
      [expected.tenant_id, actorId, expected.resource_id, intent.controller_id,
        intent.commissioning_project_id, intent.site_id, expected.mission_id]
    );
    const matching = result.rows.filter(row => {
      const receipt = jsonValue(row.receipt);
      const commissioning = row.metadata && row.metadata.commissioning;
      const decisionTime = receipt && Date.parse(receipt.authorization_decision_at);
      const storedDecisionTime = row.receipt_decision_at && new Date(row.receipt_decision_at).getTime();
      return receipt && receipt.schema === 'commissioning-admission-receipt@2' &&
        receipt.operation === 'MISSION_CREATE' &&
        receipt.authenticated_actor === actorId &&
        ['tenant_id', 'controller_id', 'commissioning_project_id', 'site_id', 'resource_id']
          .every(key => receipt[key] === intent[key]) &&
        row.receipt_tenant_id === receipt.tenant_id && row.receipt_actor_id === receipt.authenticated_actor &&
        row.receipt_logical_operation_id === receipt.logical_operation_id &&
        row.receipt_grant_id === receipt.grant_id && row.receipt_grant_revision === receipt.grant_revision &&
        receipt.event_id === row.event_id &&
        /^[a-f0-9]{64}$/.test(row.receipt_operation_digest || '') &&
        receipt.operation_digest === row.receipt_operation_digest &&
        Number.isFinite(decisionTime) && decisionTime === storedDecisionTime &&
        receipt.command_result?.mission_id === expected.mission_id &&
        row.metadata?.authenticated_actor === actorId &&
        typeof commissioning?.grant_id === 'string' &&
        Number.isSafeInteger(commissioning?.grant_revision) &&
        /^[a-f0-9]{64}$/.test(commissioning?.operation_digest || '') &&
        sameCreatedEvent(row, expected);
    });
    if (matching.length !== result.rows.length || matching.length === 0 ||
        new Set(matching.map(row => row.event_id)).size !== 1) {
      throw missionError('mission_evidence_unproven', 'Existing mission lacks matching admitted MISSION_CREATE receipt and event');
    }
    return matching[0];
  }

  /**
   * Atomicity contract for processor state transitions — P2 write-authority
   * closure (2026-10-11).
   *
   * Closes the reproduced mission write-before-event class: the conditional
   * row UPDATE and the required MISSION_* evidence append share ONE bounded
   * transaction. If the evidence append fails (or is not durably persisted),
   * the transaction rolls back and this method throws — the business
   * mutation can never silently succeed while required durable evidence
   * fails. Post-commit the event is dispatched; a dispatch failure is
   * reported as mission_dispatch_outcome_unknown (durable, delivery
   * unknown), never as silent success.
   *
   * AUTHORIZATION BEFORE MUTATION: when the caller declares
   * spec.tenantId, the mission row is locked (FOR UPDATE) and its tenant
   * compared BEFORE the conditional UPDATE executes. A mismatch throws
   * `tenant_mismatch` with no mutation and no evidence. When the caller
   * declares nothing, the tenant is resolved server-side from the updated
   * row (RETURNING tenant_id) — it is never taken from a request body.
   *
   * spec = { missionId, tenantId?, updateSql, updateParams, eventType,
   *          eventPayload, prepare? }.
   * updateSql MUST be a conditional UPDATE ... RETURNING tenant_id (plus any
   * columns the caller needs back). eventType must be in the UER
   * MISSION_TRANSITION_EVENTS whitelist. Alternatively, spec.prepare(client)
   * may compute { updateSql, updateParams, eventPayload, extra } inside the
   * transaction (for read-then-write transitions); `extra` is passed through
   * on the outcome for the caller's own bookkeeping.
   *
   * Returns { matched:boolean, tenantId?, row?, event?, extra? }. matched=false means the
   * conditional UPDATE matched zero rows: nothing mutated, nothing appended.
   */
  async _transitionInTransaction(spec) {
    const { missionId, tenantId = null, eventType } = spec;
    if (!this._pool || typeof this._pool.connect !== 'function') {
      throw new Error('MissionRuntime: PostgreSQL transaction connection is required');
    }
    if (!this._eventRuntime || this._eventRuntime._pool !== this._pool ||
        typeof this._eventRuntime.appendMissionTransitionInTransaction !== 'function' ||
        typeof this._eventRuntime.dispatchMissionTransition !== 'function') {
      throw new Error('MissionRuntime: same-pool transactional event runtime is required');
    }
    const outcome = await this._withCreateTransaction(async client => {
      if (tenantId !== null && tenantId !== undefined) {
        const locked = await client.query(
          'SELECT tenant_id FROM ping_missions WHERE mission_id = $1 FOR UPDATE',
          [missionId]
        );
        const rowTenant = locked.rows[0] && locked.rows[0].tenant_id;
        if (!rowTenant || rowTenant !== tenantId) {
          throw missionError('tenant_mismatch', 'Mission tenant does not match caller-declared tenant');
        }
      }
      // Optional prepare step for read-then-write transitions (e.g.
      // failWithRetry's attempt counter): runs inside the same transaction.
      let updateSql = spec.updateSql;
      let updateParams = spec.updateParams;
      let eventPayload = spec.eventPayload;
      let extra;
      if (typeof spec.prepare === 'function') {
        const p = await spec.prepare(client);
        updateSql = p.updateSql; updateParams = p.updateParams;
        eventPayload = p.eventPayload; extra = p.extra;
      }
      const updated = await client.query(updateSql, updateParams);
      if ((updated.rowCount || 0) === 0) return { matched: false, extra };
      const rowTenant = updated.rows[0] && updated.rows[0].tenant_id;
      // Legacy tolerance: rows predating the W3 tenant model carry no
      // tenant_id; their evidence is appended without a tenant scope exactly
      // as before (the spine resolves UNKNOWN). Tenanted rows always carry
      // their server-resolved tenant — never a caller claim.
      const appended = await this._eventRuntime.appendMissionTransitionInTransaction(
        client, eventType, eventPayload, rowTenant ? { tenant_id: rowTenant } : {});
      if (!appended || appended.status !== 'ok' || !appended.event) {
        throw missionError('mission_event_persist_failed',
          `Evidence append failed for ${eventType}: ${(appended && appended.error) || 'unknown'}`);
      }
      return { matched: true, tenantId: rowTenant || null, row: updated.rows[0], event: appended, extra };
    });
    if (outcome.matched) {
      try {
        await this._eventRuntime.dispatchMissionTransition(outcome.event);
      } catch (_) {
        throw missionError('mission_dispatch_outcome_unknown',
          'Transition is durable; post-commit delivery outcome is unknown');
      }
    }
    return outcome;
  }

  /**
   * Initialize mission tables.
   */
  async initialize() {
    if (!this._pool) return;
    await this._pool.query(`
      CREATE TABLE IF NOT EXISTS ping_missions (
        mission_id VARCHAR(255) PRIMARY KEY,
        mission_type VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'created',
        priority INTEGER DEFAULT 0,
        payload JSONB NOT NULL DEFAULT '{}',
        result JSONB,
        assigned_to VARCHAR(255),
        created_by VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        error TEXT,
        retries INTEGER DEFAULT 0,
        retry_at TIMESTAMPTZ,
        lease_until TIMESTAMPTZ,
        claimed_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_pm_status ON ping_missions(status);
      CREATE INDEX IF NOT EXISTS idx_pm_type ON ping_missions(mission_type);
      CREATE INDEX IF NOT EXISTS idx_pm_priority ON ping_missions(priority DESC);
      CREATE INDEX IF NOT EXISTS idx_pm_assigned ON ping_missions(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_pm_retry_at ON ping_missions(retry_at);
      CREATE INDEX IF NOT EXISTS idx_pm_lease_until ON ping_missions(lease_until);
      ALTER TABLE ping_missions ADD COLUMN IF NOT EXISTS retry_at TIMESTAMPTZ;
      ALTER TABLE ping_missions ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ;
      ALTER TABLE ping_missions ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
      ALTER TABLE ping_missions ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
      UPDATE ping_missions SET tenant_id = 'UNKNOWN' WHERE tenant_id IS NULL;
      CREATE INDEX IF NOT EXISTS idx_pm_tenant_id ON ping_missions(tenant_id);
      ALTER TABLE ping_missions ADD COLUMN IF NOT EXISTS hold_at TIMESTAMPTZ;
      ALTER TABLE ping_missions ADD COLUMN IF NOT EXISTS hold_reason TEXT;
      CREATE INDEX IF NOT EXISTS idx_pm_hold_at ON ping_missions(hold_at);
      ALTER TABLE ping_missions ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);
      ALTER TABLE ping_missions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
      ALTER TABLE ping_missions ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(255);
      ALTER TABLE ping_missions ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
      ALTER TABLE ping_missions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    `);
  }

  /**
   * Resolve a mission's tenant_id for lifecycle events (HOLD/retry/reaper
   * paths preserve tenant context by re-reading the immutable row value).
   * @private
   */
  async _missionTenant(missionId) {
    if (!this._pool) return null;
    const row = await this._pool.query(
      `SELECT tenant_id FROM ping_missions WHERE mission_id = $1`,
      [missionId]
    );
    return (row.rows[0] && row.rows[0].tenant_id) || null;
  }

  /**
   * Create a new mission.
   *
   * mission_id is deterministic: hash(tenant:missionType:event_id) when
   * event_id is present in payload, otherwise hash(tenant:missionType:
   * canonical_payload). Tenant joins the key: the same event_id in two
   * tenants is two missions, never an ON CONFLICT silence. Same
   * (tenant, event) always produces the same mission — idempotent by
   * construction. options.tenant_id is REQUIRED (fail closed).
   */
  async create(missionType, payload = {}, options = {}) {
    const tenantId = requireMissionTenantId(options.tenant_id);
    if (!this._eventRuntime || this._eventRuntime._pool !== this._pool ||
        typeof this._eventRuntime.appendMissionCreatedInTransaction !== 'function' ||
        typeof this._eventRuntime.dispatchMissionCreated !== 'function') {
      throw new Error('MissionRuntime: same-pool transactional event runtime is required');
    }
    const priority = options.priority || 0;
    const createdBy = options.createdBy || null;
    const missionId = MissionRuntime.missionIdFor(tenantId, missionType, payload);
    const expected = {
      mission_id: missionId,
      mission_type: missionType,
      payload,
      priority,
      created_by: createdBy,
      tenant_id: tenantId,
      eventPayload: { missionId, missionType, payload, priority },
    };

    const outcome = await this._withCreateTransaction(async client => {
      const inserted = await client.query(
        `INSERT INTO ping_missions (mission_id, mission_type, payload, priority, created_by, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (mission_id) DO NOTHING RETURNING mission_id`,
        [missionId, missionType, JSON.stringify(payload), priority, createdBy, tenantId]
      );
      if ((inserted.rowCount || 0) === 0) {
        const existing = await this._readMission(client, missionId);
        if (!sameMissionSemantics(existing, expected)) {
          throw missionError('mission_id_conflict', 'Existing mission has different persisted semantics');
        }
        await this._findCreatedEvent(client, expected);
        return { missionId, inserted: false, event: null };
      }

      const event = await this._eventRuntime.appendMissionCreatedInTransaction(
        client, expected.eventPayload, { tenant_id: tenantId }
      );
      if (!event || event.status !== 'ok' || !event.eventId || !event.event || !event.inserted) {
        throw missionError('mission_event_persist_failed', 'MISSION_CREATED was not durably appended');
      }
      return { missionId, inserted: true, event };
    });

    if (outcome.inserted) {
      try { await this._eventRuntime.dispatchMissionCreated(outcome.event); }
      catch (_) { throw missionError('mission_dispatch_outcome_unknown', 'Mission is durable; post-commit delivery outcome is unknown'); }
    }
    return outcome.missionId;
  }

  /** Execute a signed, tenant-scoped MISSION_CREATE command in the existing
   * commissioning transaction. Object commands remain a separate operation.
   */
  async createAdmitted(context, submission) {
    if (!this._tenantRegistry || !this._eventRuntime ||
        this._tenantRegistry._commissioningPool !== this._pool ||
        this._eventRuntime._pool !== this._pool ||
        typeof this._eventRuntime.admitCommand !== 'function') {
      throw new Error('MissionRuntime: admitted command authorities must share the mission pool');
    }
    return this._eventRuntime.admitCommand(this._tenantRegistry, context, submission,
      async (client, data, append) => {
        const intent = data && data.intent;
        const typed = data && data.payload;
        const actorId = intent && intent.authenticated_actor;
        if (!intent || intent.operation !== 'MISSION_CREATE' || !actorId) {
          throw missionError('admission_denied', 'Verified MISSION_CREATE intent is required', 'REJECTED');
        }
        const tenantId = requireMissionTenantId(intent.tenant_id);
        if (!typed || typed.tenant_id !== tenantId || typeof typed.missionType !== 'string' ||
            !typed.missionType || !typed.payload || typeof typed.payload !== 'object' ||
            Array.isArray(typed.payload) || typed.payload.namespace !== `tenant::${tenantId}` ||
            !Number.isSafeInteger(typed.priority) || intent.resource_id == null) {
          throw missionError('invalid_mission_command', 'Typed mission command is invalid', 'REJECTED');
        }
        const missionId = MissionRuntime.missionIdFor(tenantId, typed.missionType, typed.payload);
        const resourceId = `mission://${tenantId}/${missionId}`;
        if (intent.resource_id !== resourceId) {
          throw missionError('resource_scope_mismatch', 'MISSION_CREATE resource does not match mission identity', 'REJECTED');
        }
        const expected = {
          mission_id: missionId,
          mission_type: typed.missionType,
          payload: typed.payload,
          priority: typed.priority,
          created_by: actorId,
          tenant_id: tenantId,
          resource_id: resourceId,
          eventPayload: {
            missionId,
            missionType: typed.missionType,
            payload: typed.payload,
            priority: typed.priority,
          },
        };

        const inserted = await client.query(
          `INSERT INTO ping_missions (mission_id, mission_type, payload, priority, created_by, tenant_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (mission_id) DO NOTHING RETURNING mission_id`,
          [missionId, typed.missionType, JSON.stringify(typed.payload), typed.priority, actorId, tenantId]
        );
        if ((inserted.rowCount || 0) === 0) {
          const existing = await this._readMission(client, missionId);
          if (!sameMissionSemantics(existing, expected)) {
            throw missionError('mission_id_conflict', 'Existing mission has different persisted semantics');
          }
          const evidence = await this._findAdmittedMissionEvidence(client, expected, intent);
          return {
            status: 'ok',
            eventId: evidence.event_id,
            inserted: false,
            commandResult: { mission_id: missionId },
          };
        }

        const evidence = await append('MISSION_CREATED', expected.eventPayload);
        if (!evidence || evidence.status !== 'ok' || !evidence.eventId || !evidence.event || !evidence.inserted) {
          throw missionError('mission_event_persist_failed', 'MISSION_CREATED was not durably appended');
        }
        return {
          status: 'ok',
          eventId: evidence.eventId,
          event: evidence.event,
          inserted: true,
          commandResult: { mission_id: missionId },
        };
      });
  }

  /**
   * Assign (claim) a mission to a worker.
   *
   * P0-1: conditional transition. Claim state, claimed_at and lease_until are
   * set in the SAME mutation, and the UPDATE only matches missions still in
   * status 'created'. A second claim on an already-claimed mission is rejected
   * (rowCount 0) — the assignment can never be stolen by a concurrent scheduler.
   *
   * P2 write-authority closure (2026-10-11): the UPDATE and the
   * MISSION_ASSIGNED evidence append share one transaction
   * (_transitionInTransaction). options.tenantId, when declared by the
   * caller, is verified against the row BEFORE the mutation.
   *
   * @returns {Promise<number>} rowCount — 1 if claimed, 0 if not claimable
   */
  async assign(missionId, workerName, options = {}) {
    const outcome = await this._transitionInTransaction({
      missionId,
      tenantId: options.tenantId,
      updateSql: `UPDATE ping_missions SET status = 'assigned', assigned_to = $1, claimed_at = NOW(), lease_until = NOW() + INTERVAL '60 seconds' WHERE mission_id = $2 AND status = 'created' AND hold_at IS NULL RETURNING tenant_id`,
      updateParams: [workerName, missionId],
      eventType: 'MISSION_ASSIGNED',
      eventPayload: { missionId, assignedTo: workerName },
    });
    return outcome.matched ? 1 : 0;
  }

  /**
   * Start a mission.
   *
   * Conditional: only transitions from 'assigned' to 'running'. A mission
   * that is already completed, failed, or retry_pending is never restarted.
   *
   * P2 write-authority closure (2026-10-11): UPDATE + MISSION_STARTED
   * evidence in one transaction (_transitionInTransaction).
   */
  async start(missionId, options = {}) {
    await this._transitionInTransaction({
      missionId,
      tenantId: options.tenantId,
      updateSql: `UPDATE ping_missions SET status = 'running', started_at = NOW() WHERE mission_id = $1 AND status = 'assigned' RETURNING tenant_id`,
      updateParams: [missionId],
      eventType: 'MISSION_STARTED',
      eventPayload: { missionId },
    });
  }

  /**
   * Complete a mission.
   *
   * Conditional: transitions from 'running' to 'completed', and also
   * completes a HELD mission in a holdable non-running status ('assigned',
   * 'created'). A mission that is failed, retry_pending, or already
   * completed is never overwritten, and a mission whose hold was already
   * resolved is not touched by the held-row disjunct.
   *
   * E3 H3 repair (2026-09-27): the held-row disjunct lets a late worker ack
   * land on a mission the C1-recovery path re-held as 'created' (or held in
   * 'assigned'). Without it the ack matched 0 rows and the hold was
   * permanent by construction: the held-resolution sweep only resolves
   * status='completed' rows. `hold_at IS NOT NULL` scopes the disjunct to
   * the live hold episode (only resolveHold clears hold_at), so a stale ack
   * can never complete a mission an operator already released: after
   * PROVEN_NOT_OCCURRED the row is 'created' with hold_at NULL and the ack
   * still matches 0 rows, exactly as before.
   */
  async complete(missionId, result = {}, options = {}) {
    // Calculate duration from started_at
    let duration_ms = null;
    try {
      const row = await this._pool.query(
        `SELECT started_at FROM ping_missions WHERE mission_id = $1`,
        [missionId]
      );
      if (row.rows[0] && row.rows[0].started_at) {
        duration_ms = Date.now() - new Date(row.rows[0].started_at).getTime();
      }
    } catch (_) {}

    // P2 write-authority closure (2026-10-11): UPDATE + MISSION_COMPLETED
    // evidence in one transaction (_transitionInTransaction).
    await this._transitionInTransaction({
      missionId,
      tenantId: options.tenantId,
      updateSql: `UPDATE ping_missions SET status = 'completed', result = $1, completed_at = NOW() WHERE mission_id = $2 AND (status = 'running' OR (hold_at IS NOT NULL AND status IN ('assigned', 'created'))) RETURNING tenant_id`,
      updateParams: [JSON.stringify({ ...result, duration_ms }), missionId],
      eventType: 'MISSION_COMPLETED',
      eventPayload: { missionId, result, duration_ms },
    });
  }

  /**
   * Fail a mission.
   *
   * P2 write-authority closure (2026-10-11): UPDATE + MISSION_FAILED
   * evidence in one transaction (_transitionInTransaction).
   */
  async fail(missionId, error, options = {}) {
    await this._transitionInTransaction({
      missionId,
      tenantId: options.tenantId,
      updateSql: `UPDATE ping_missions SET status = 'failed', error = $1, completed_at = NOW()
       WHERE mission_id = $2 AND status IN ('running', 'assigned', 'retry_pending') RETURNING tenant_id`,
      updateParams: [error, missionId],
      eventType: 'MISSION_FAILED',
      eventPayload: { missionId, error },
    });
  }

  /**
   * Approve a proposed mission (Mission Control approval surface).
   *
   * Approval authority chain: the approver MUST be the authenticated caller
   * identity (req.authenticatedAgent.agentId at the route layer) — never a
   * body-claimed value. Conditional transition: only a mission still in
   * status 'created' and not held can be approved. Emits MISSION_APPROVED.
   *
   * @param {string} missionId
   * @param {string} approver - authenticated agent id (required)
   * @returns {Promise<{mission_id, status, approved_by, approved_at}>}
   * @throws {Error} code MISSION_NOT_FOUND / MISSION_NOT_APPROVABLE / APPROVER_REQUIRED
   */
  async approve(missionId, approver) {
    if (!approver || typeof approver !== 'string') {
      const err = new Error('approver_required: approver must be the authenticated caller identity');
      err.code = 'APPROVER_REQUIRED';
      throw err;
    }
    const existing = await this._pool.query(
      `SELECT mission_id, status FROM ping_missions WHERE mission_id = $1`,
      [missionId]
    );
    if (existing.rows.length === 0) {
      const err = new Error(`mission not found: ${missionId}`);
      err.code = 'MISSION_NOT_FOUND';
      throw err;
    }
    // P2 write-authority closure (2026-10-11): UPDATE + MISSION_APPROVED
    // evidence in one transaction (_transitionInTransaction). The approver
    // identity stays the authenticated caller (route layer); the tenant
    // scope is authorized at the route layer against the row's tenant.
    const outcome = await this._transitionInTransaction({
      missionId,
      updateSql: `UPDATE ping_missions
         SET status = 'approved', approved_by = $1, approved_at = NOW()
       WHERE mission_id = $2 AND status = 'created' AND hold_at IS NULL
       RETURNING tenant_id, approved_at`,
      updateParams: [approver, missionId],
      eventType: 'MISSION_APPROVED',
      eventPayload: { missionId, approved_by: approver },
    });
    if (!outcome.matched) {
      const err = new Error(`mission ${missionId} is not approvable (status=${existing.rows[0].status})`);
      err.code = 'MISSION_NOT_APPROVABLE';
      err.currentStatus = existing.rows[0].status;
      throw err;
    }
    return {
      mission_id: missionId,
      status: 'approved',
      approved_by: approver,
      approved_at: outcome.row.approved_at,
    };
  }

  /**
   * Reject a proposed mission (Mission Control approval surface).
   *
   * Same authority posture as approve(): rejecter is the authenticated caller
   * identity. Records the human-readable reason. Conditional transition from
   * 'created' only. Emits MISSION_REJECTED.
   *
   * @param {string} missionId
   * @param {string} rejecter - authenticated agent id (required)
   * @param {string|null} reason - optional human-readable reason
   * @returns {Promise<{mission_id, status, rejected_by, rejected_at, reason}>}
   * @throws {Error} code MISSION_NOT_FOUND / MISSION_NOT_REJECTABLE / REJECTER_REQUIRED
   */
  async reject(missionId, rejecter, reason = null) {
    if (!rejecter || typeof rejecter !== 'string') {
      const err = new Error('rejecter_required: rejecter must be the authenticated caller identity');
      err.code = 'REJECTER_REQUIRED';
      throw err;
    }
    const existing = await this._pool.query(
      `SELECT mission_id, status FROM ping_missions WHERE mission_id = $1`,
      [missionId]
    );
    if (existing.rows.length === 0) {
      const err = new Error(`mission not found: ${missionId}`);
      err.code = 'MISSION_NOT_FOUND';
      throw err;
    }
    // P2 write-authority closure (2026-10-11): UPDATE + MISSION_REJECTED
    // evidence in one transaction (_transitionInTransaction).
    const outcome = await this._transitionInTransaction({
      missionId,
      updateSql: `UPDATE ping_missions
         SET status = 'rejected', rejected_by = $1, rejected_at = NOW(), rejection_reason = $2
       WHERE mission_id = $3 AND status = 'created' AND hold_at IS NULL
       RETURNING tenant_id, rejected_at`,
      updateParams: [rejecter, reason, missionId],
      eventType: 'MISSION_REJECTED',
      eventPayload: { missionId, rejected_by: rejecter, reason },
    });
    if (!outcome.matched) {
      const err = new Error(`mission ${missionId} is not rejectable (status=${existing.rows[0].status})`);
      err.code = 'MISSION_NOT_REJECTABLE';
      err.currentStatus = existing.rows[0].status;
      throw err;
    }
    return {
      mission_id: missionId,
      status: 'rejected',
      rejected_by: rejecter,
      rejected_at: outcome.row.rejected_at,
      reason,
    };
  }

  /**
   * Fail with retry — P0-4.
   *
   * Increments `retries`, sets `retry_pending` status and `retry_at` to enforce
   * a backoff gate.  When `retries >= max_attempts`, the mission is marked
   * `failed` instead (exhaustion).
   *
   * `getPending()` only returns `created` missions, so retry_pending missions
   * are invisible until `retry_at` is reached and `reclaimRetryPending()`
   * moves them back to `created` through the normal conditional-claim path.
   * The `retries` counter is never reset by a reclaim: every failure advances
   * it, so retries are bounded and exhaustion is always reachable (F-01).
   *
   * @param {string} missionId
   * @param {string} error — error description
   * @param {object} options
   * @param {number} options.max_attempts — total attempts before exhaustion (default 3)
   * @param {number} options.backoff_delay_ms — base delay before retry (default 5000)
   */
  async failWithRetry(missionId, error, options = {}) {
    const maxAttempts = options.max_attempts || 3;
    const backoffMs = options.backoff_delay_ms || 5000;

    // P2 write-authority closure (2026-10-11): the attempt-count read, the
    // conditional UPDATE and the MISSION_FAILED evidence append share one
    // transaction. The SELECT ... FOR UPDATE serializes concurrent failures
    // against the same mission, so the retries counter cannot lose an
    // increment; the F-01 bounded-exhaustion invariant is preserved exactly.
    const outcome = await this._transitionInTransaction({
      missionId,
      tenantId: options.tenantId,
      eventType: 'MISSION_FAILED',
      prepare: async (client) => {
        const row = await client.query(
          'SELECT retries FROM ping_missions WHERE mission_id = $1 FOR UPDATE',
          [missionId]
        );
        const nextRetry = ((row.rows[0] && row.rows[0].retries) || 0) + 1;
        const eventPayload = { missionId, error, retries: nextRetry };
        const extra = { nextRetry };
        if (nextRetry >= maxAttempts) {
          // Exhausted — mark failed permanently
          return {
            updateSql: `UPDATE ping_missions SET status = 'failed', error = $1, retries = $2, completed_at = NOW()
             WHERE mission_id = $3 AND status IN ('running', 'assigned', 'retry_pending') RETURNING tenant_id`,
            updateParams: [error, nextRetry, missionId],
            eventPayload, extra,
          };
        }
        // Schedule retry. The IN-list deliberately includes 'retry_pending': a
        // failure recorded against an already-retry_pending row must still
        // advance the attempt counter (state progress). Without it the UPDATE
        // matches zero rows and the mission re-executes forever with retries
        // frozen — the F-01 infinite loop.
        const retryAt = new Date(Date.now() + backoffMs);
        return {
          updateSql: `UPDATE ping_missions SET status = 'retry_pending', error = $1, retries = $2, retry_at = $3
           WHERE mission_id = $4 AND status IN ('running', 'assigned', 'retry_pending') RETURNING tenant_id`,
          updateParams: [error, nextRetry, retryAt.toISOString(), missionId],
          eventPayload, extra,
        };
      },
    });
    if (outcome.extra && typeof outcome.extra.nextRetry === 'number') {
      return outcome.extra.nextRetry;
    }
    // No rows matched: preserve the legacy return contract (attempt count
    // read without a state change).
    const row = await this._pool.query(
      'SELECT retries FROM ping_missions WHERE mission_id = $1', [missionId]);
    return ((row.rows[0] && row.rows[0].retries) || 0) + 1;
  }

  /**
   * Renew a lease for a mission still being processed by the scheduler.
   *
   * Extends lease_until by `durationSeconds` from now. Only renews missions
   * still in 'running' or 'assigned' status — completed/failed missions are
   * untouched. Called by the scheduler on each poll cycle for every mission
   * in its _processing set, preventing the reaper from resetting in-progress
   * missions while still catching orphaned ones from crashed schedulers.
   *
   * P2 write-authority note (2026-10-11): single conditional UPDATE, emits
   * no evidence event — outside the UPDATE-then-emit divergence class.
   * Internal scheduler callers only (PROCESSOR classification).
   *
   * @param {string} missionId
   * @param {number} durationSeconds — lease extension (default 60)
   * @returns {Promise<number>} rowCount — 1 if renewed, 0 if not renewable
   */
  async renewLease(missionId, durationSeconds = 60) {
    const result = await this._pool.query(
      `UPDATE ping_missions
       SET lease_until = NOW() + INTERVAL '1 second' * $1
       WHERE mission_id = $2
         AND status IN ('running', 'assigned')
         AND lease_until IS NOT NULL`,
      [durationSeconds, missionId]
    );
    return result.rowCount || 0;
  }

  /**
   * Reclaim expired leases — P0-6.
   *
   * Finds missions with status IN ('running', 'assigned') whose `lease_until`
   * has passed, resets them to `created` (AVAILABLE) so the scheduler can
   * re-claim them. Only catches missions NOT being actively renewed by the
   * scheduler (orphans from crashed schedulers or stuck workers beyond the
   * lease renewal window).
   *
   * HOLD CONSTITUTIONAL (locked 2026-09-27): missions with hold_at IS NOT
   * NULL are NEVER reclaimed. A lease expiring is evidence that ownership of
   * execution became stale — it is not evidence that an external effect did
   * not occur. UNKNOWN EFFECT -> HOLD -> RECONCILE -> NEVER LEASE-EXPIRY
   * REDISPATCH. Only the reconciler moves a mission out of HOLD (resolveHold).
   *
   * @returns {Promise<number>} count of reclaimed missions
   */
  async reapExpiredLeases() {
    // P2 write-authority closure (2026-10-11): each reclaimed row's UPDATE
    // and its MISSION_LEASE_EXPIRED evidence share one transaction. Candidate
    // discovery is a plain SELECT; the conditional UPDATE inside the
    // transaction is the authority — a row that changed between discovery
    // and claim is skipped (matched:false), never half-recorded.
    const candidates = await this._pool.query(
      `SELECT mission_id FROM ping_missions
       WHERE status IN ('running', 'assigned')
         AND lease_until IS NOT NULL
         AND lease_until < NOW()
         AND hold_at IS NULL`
    );

    let reclaimed = 0;
    for (const { mission_id } of candidates.rows) {
      const outcome = await this._transitionInTransaction({
        missionId: mission_id,
        updateSql: `UPDATE ping_missions
         SET status = 'created', assigned_to = NULL, lease_until = NULL, claimed_at = NULL, retry_at = NOW()
         WHERE mission_id = $1
           AND status IN ('running', 'assigned')
           AND lease_until IS NOT NULL
           AND lease_until < NOW()
           AND hold_at IS NULL
         RETURNING tenant_id`,
        updateParams: [mission_id],
        eventType: 'MISSION_LEASE_EXPIRED',
        eventPayload: { missionId: mission_id },
      });
      if (outcome.matched) reclaimed++;
    }

    if (reclaimed > 0) {
      console.log(`[MissionRuntime] Reclaimed ${reclaimed} expired lease(s)`);
    }

    return reclaimed;
  }

  /**
   * Mark a mission HOLD — durable record of an unknown-outcome reconciliation.
   *
   * Written by the reconciler (MissionScheduler._reconcileUnknown) when an
   * attempt's outcome is UNKNOWN (dispatch timeout, no result, stuck worker).
   * Sets hold_at, which makes the mission non-dispatchable across the whole
   * dispatch-eligibility surface: reapExpiredLeases, reclaimRetryPending,
   * getPending and assign all exclude held missions.
   *
   * Conditional and idempotent: only matches un-held rows in a holdable
   * status. HOLD is an overlay on dispatch eligibility, not a lifecycle
   * status — the row keeps its status. HOLD's meaning is unchanged
   * (UNKNOWN EFFECT -> HOLD -> RECONCILE); this only makes the record durable
   * so the reaper can honor it.
   *
   * E2 RACE REPAIR (2026-09-27): the holdable statuses include 'created' so
   * the hold still lands when reapExpiredLeases() won the commit race and
   * already reclaimed the row to 'created' before this UPDATE ran. Without
   * this, the reaper-wins interleaving matched 0 rows and the mission was
   * silently re-dispatched (C1 falsification). markHold remains the ONLY
   * writer of hold_at.
   *
   * @returns {Promise<number>} 1 if the hold was recorded, 0 if already held or not holdable
   *
   * P2 write-authority note (2026-10-11): single conditional UPDATE, emits
   * no events by design (the reconciler's own MISSION_RECONCILE_HOLD record
   * is the evidence trail) — outside the UPDATE-then-emit divergence class.
   * Internal reconciler callers only (PROCESSOR classification).
   */
  async markHold(missionId, reason) {
    const result = await this._pool.query(
      `UPDATE ping_missions SET hold_at = NOW(), hold_reason = $2
       WHERE mission_id = $1 AND status IN ('running', 'assigned', 'created') AND hold_at IS NULL`,
      [missionId, reason || null]
    );
    return result.rowCount || 0;
  }

  /**
   * Resolve a HOLD — the ONLY way a mission leaves HOLD.
   *
   * Owned by the reconciler. Callers: the reconciler's held-resolution sweep
   * (MissionScheduler.reconcileHeldMissions) for PROVEN_OCCURRED, and
   * operator/external-verifier callers holding genuine proof for
   * PROVEN_NOT_OCCURRED / MANUAL_RESOLUTION. Resolutions (anything else
   * throws, fail closed):
   *   PROVEN_OCCURRED     — the external effect did occur: adopt the durable
   *                         result and move to 'completed'. Never re-dispatches.
   *   PROVEN_NOT_OCCURRED — the effect provably did not occur: clear the hold
   *                         and return to 'created' for exactly one new safe
   *                         attempt through the normal conditional claim. All
   *                         attempt-clock fields are reset (started_at,
   *                         claimed_at, lease_until, assigned_to, retry_at):
   *                         without the started_at reset, findStuckRunning's
   *                         COALESCE(started_at, claimed_at, created_at) would
   *                         flag the freshly re-claimed mission as stuck on
   *                         the stale started_at and spuriously re-hold it
   *                         (E2 STARTED_AT repair).
   *   MANUAL_RESOLUTION   — operator-determined terminal state; recorded in
   *                         result, never re-dispatched.
   * Each branch is conditional on hold_at IS NOT NULL: resolving a mission
   * that is not held is a no-op. Emits no events: the reconciler's own
   * MISSION_RECONCILE_HOLD record plus its resolution record are the evidence
   * trail; the row state is the dispatch-eligibility truth.
   *
   * HOLD LIFECYCLE: UNKNOWN EFFECT -> markHold (durable) ->
   * MISSION_RECONCILE_HOLD -> held (invisible to reaper/reclaim/pending/
   * assign/watchdog) -> resolveHold -> terminal, or exactly one new attempt.
   *
   * @returns {Promise<number>} 1 if a hold was resolved, 0 if the mission was not held
   *
   * P2 write-authority note (2026-10-11): single conditional UPDATE, emits
   * no events by design — outside the UPDATE-then-emit divergence class.
   * Reconciler/operator callers only (PROCESSOR classification).
   */
  async resolveHold(missionId, resolution, result = {}) {
    if (!['PROVEN_OCCURRED', 'PROVEN_NOT_OCCURRED', 'MANUAL_RESOLUTION'].includes(resolution)) {
      throw new Error(`MissionRuntime.resolveHold: unknown resolution '${resolution}' (fail closed)`);
    }
    let sql;
    let params;
    if (resolution === 'PROVEN_OCCURRED') {
      sql = `UPDATE ping_missions SET hold_at = NULL, hold_reason = NULL, status = 'completed',
               result = $2, completed_at = NOW()
             WHERE mission_id = $1 AND hold_at IS NOT NULL`;
      params = [missionId, JSON.stringify({ ...result, hold_resolution: resolution })];
    } else if (resolution === 'PROVEN_NOT_OCCURRED') {
      // E2 STARTED_AT repair: started_at is an attempt-clock field. Without
      // this reset, findStuckRunning's COALESCE(started_at, claimed_at,
      // created_at) outranks the fresh claimed_at with the stale started_at,
      // so the freshly re-claimed mission is immediately re-flagged stuck
      // and spuriously re-held. The retries counter is deliberately NOT
      // reset (F-01: retries stay bounded toward exhaustion).
      sql = `UPDATE ping_missions SET hold_at = NULL, hold_reason = NULL, status = 'created',
               assigned_to = NULL, lease_until = NULL, claimed_at = NULL, retry_at = NULL,
               started_at = NULL
             WHERE mission_id = $1 AND hold_at IS NOT NULL`;
      params = [missionId];
    } else {
      sql = `UPDATE ping_missions SET hold_at = NULL, hold_reason = NULL, status = 'completed',
               result = $2, completed_at = NOW()
             WHERE mission_id = $1 AND hold_at IS NOT NULL`;
      params = [missionId, JSON.stringify({ ...result, hold_resolution: resolution, manual: true })];
    }
    const r = await this._pool.query(sql, params);
    return r.rowCount || 0;
  }

  /**
   * Reclaim due retries — the missing link of the retry contract (F-01 repair).
   *
   * Moves `retry_pending` missions whose `retry_at` backoff gate has elapsed
   * back to `created`, so they re-enter through the normal conditional-claim
   * path (assign → start → dispatch) instead of being dispatched directly.
   * The `retries` counter is NOT reset: attempt counting persists across
   * reclaims, so retries stay bounded and exhaustion stays reachable.
   *
   * @returns {Promise<number>} count of reclaimed missions
   */
  async reclaimRetryPending() {
    // P2 write-authority closure (2026-10-11): per-row transaction — the
    // UPDATE and its MISSION_RETRY_RECLAIMED evidence are atomic, same
    // contract as reapExpiredLeases above.
    const candidates = await this._pool.query(
      `SELECT mission_id FROM ping_missions
       WHERE status = 'retry_pending'
         AND retry_at IS NOT NULL
         AND retry_at <= NOW()
         AND hold_at IS NULL`
    );

    let reclaimed = 0;
    for (const { mission_id } of candidates.rows) {
      const outcome = await this._transitionInTransaction({
        missionId: mission_id,
        updateSql: `UPDATE ping_missions
         SET status = 'created', assigned_to = NULL, lease_until = NULL, claimed_at = NULL, retry_at = NULL
         WHERE mission_id = $1
           AND status = 'retry_pending'
           AND retry_at IS NOT NULL
           AND retry_at <= NOW()
           AND hold_at IS NULL
         RETURNING tenant_id`,
        updateParams: [mission_id],
        eventType: 'MISSION_RETRY_RECLAIMED',
        eventPayload: { missionId: mission_id },
      });
      if (outcome.matched) reclaimed++;
    }

    if (reclaimed > 0) {
      console.log(`[MissionRuntime] Reclaimed ${reclaimed} due retries for redispatch`);
    }

    return reclaimed;
  }

  /**
   * Find missions stuck in an active state beyond a bounded threshold.
   *
   * Returns missions in `running`/`assigned` whose last state progress
   * (`started_at`, else `claimed_at`, else `created_at`) is older than the
   * cutoff. Feeds the scheduler's stuck-running watchdog; the caller filters
   * out missions it is actively processing.
   *
   * @param {string} olderThanIso — ISO cutoff; missions older than this qualify
   * @returns {Promise<object[]>} mission rows
   */
  async findStuckRunning(olderThanIso) {
    const result = await this._pool.query(
      `SELECT * FROM ping_missions
       WHERE status IN ('running', 'assigned')
         AND COALESCE(started_at, claimed_at, created_at) < $1
         AND hold_at IS NULL
       ORDER BY created_at ASC`,
      [olderThanIso]
    );
    return result.rows;
  }

  /**
   * Point-read a mission row by id — no state change.
   *
   * Used by the reconciler's race-recovery path (_reconcileUnknown): when
   * markHold affects 0 rows, the reconciler re-reads the row to handle its
   * ACTUAL state instead of acting on a stale snapshot. Read-only; never
   * moves a mission.
   *
   * @returns {Promise<object|null>} the mission row, or null if absent
   */
  async getMission(missionId) {
    const result = await this._pool.query(
      `SELECT * FROM ping_missions WHERE mission_id = $1`,
      [missionId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find held missions — feeds the reconciler's held-resolution sweep.
   *
   * Returns missions with hold_at IS NOT NULL, oldest hold first. Held
   * missions are invisible to every dispatch-eligibility path (reap, reclaim,
   * pending, assign, watchdog); this is the reconciler's work list for
   * proving outcomes and resolving holds via resolveHold — the ONLY exit
   * from HOLD.
   *
   * @param {number} [limit] — max rows (default 100)
   * @returns {Promise<object[]>} held mission rows
   */
  async findHeld(limit = 100) {
    const result = await this._pool.query(
      `SELECT * FROM ping_missions WHERE hold_at IS NOT NULL ORDER BY hold_at ASC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Get pending missions (for Orca scheduler).
   *
   * Returns missions in `created` status ONLY. `retry_pending` missions are
   * invisible here by design: they re-enter through `reclaimRetryPending()`,
   * which enforces the `retry_at` backoff gate and routes them back through
   * the conditional claim (assign → start), so every attempt is counted and
   * retries stay bounded. Dispatching retry_pending rows directly bypassed
   * the claim guard and froze the retry counter — the F-01 infinite loop.
   *
   * HOLD CONSTITUTIONAL (locked 2026-09-27): held missions (hold_at IS NOT
   * NULL) are never pending, even if a row ever sits in 'created' with a
   * hold. Only resolveHold clears the hold.
   */
  async getPending(limit = 10, tenantId = null) {
    if (tenantId === null) {
      const result = await this._pool.query(
        `SELECT * FROM ping_missions
         WHERE status = 'created'
           AND hold_at IS NULL
         ORDER BY priority DESC, created_at ASC LIMIT $1`,
        [limit]
      );
      return result.rows;
    }
    const tenant = requireMissionTenantId(tenantId);
    const result = await this._pool.query(
      `SELECT * FROM ping_missions
       WHERE status = 'created' AND tenant_id = $2
         AND hold_at IS NULL
       ORDER BY priority DESC, created_at ASC LIMIT $1`,
      [limit, tenant]
    );
    return result.rows;
  }

  /**
   * Get active missions. tenantId scopes the query; null = all (system use).
   */
  async getActive(tenantId = null) {
    if (tenantId === null) {
      const result = await this._pool.query(
        `SELECT * FROM ping_missions WHERE status IN ('assigned', 'running') ORDER BY priority DESC`
      );
      return result.rows;
    }
    const tenant = requireMissionTenantId(tenantId);
    const result = await this._pool.query(
      `SELECT * FROM ping_missions WHERE status IN ('assigned', 'running') AND tenant_id = $1 ORDER BY priority DESC`,
      [tenant]
    );
    return result.rows;
  }

  /**
   * Get mission stats.
   */
  async getStats() {
    const result = await this._pool.query(
      `SELECT status, COUNT(*) as count FROM ping_missions GROUP BY status`
    );
    const stats = {};
    for (const row of result.rows) {
      stats[row.status] = parseInt(row.count);
    }
    return { ...stats, scope: 'persistent' };
  }

  /**
   * Get full trace for a mission — evidence bundle.
   *
   * Resolves the correlation_id from the mission's triggering event (stored in
   * payload.event_id by EventToMissionBridge). All events in a causal chain
   * share the same correlation_id (preserved by BaseWorker._emit), so querying
   * by the triggering event's correlation_id returns the full chain.
   *
   * Previously queried by mission_id directly, which is a sha256 hash — never
   * equal to any event's correlation_id.
   */
  async getTrace(missionId) {
    const mission = await this._pool.query(
      `SELECT * FROM ping_missions WHERE mission_id = $1`,
      [missionId]
    );
    if (!mission.rows[0]) return null;

    const missionRow = mission.rows[0];
    const payload = typeof missionRow.payload === 'string'
      ? JSON.parse(missionRow.payload)
      : (missionRow.payload || {});

    // Resolve correlation_id from the triggering event's metadata.
    // The bridge stores event_id in payload; the triggering event carries
    // correlation_id in its metadata (set by UnifiedEventRuntime.emit).
    let correlationId = missionId; // fallback: query by mission_id if no event found
    if (payload.event_id) {
      const triggeringEvent = await this._pool.query(
        `SELECT metadata->>'correlation_id' AS cid FROM ping_events WHERE event_id = $1`,
        [payload.event_id]
      );
      if (triggeringEvent.rows[0]?.cid) {
        correlationId = triggeringEvent.rows[0].cid;
      } else {
        // Triggering event not in ping_events (pre-bridge or different store).
        // Fall back to using the event_id itself as correlation_id —
        // UnifiedEventRuntime defaults correlation_id to eventId when absent.
        correlationId = payload.event_id;
      }
    }

    const events = await this._pool.query(
      `SELECT * FROM ping_events WHERE metadata->>'correlation_id' = $1 ORDER BY timestamp ASC`,
      [correlationId]
    );

    return {
      mission: missionRow,
      correlation_id: correlationId,
      events: events.rows,
      eventCount: events.rowCount,
    };
  }

  /**
   * Get all traces — for evidence bundles.
   */
  async getAllTraces() {
    const missions = await this._pool.query(
      `SELECT * FROM ping_missions ORDER BY created_at ASC`
    );
    const traces = [];
    for (const m of missions.rows) {
      const trace = await this.getTrace(m.mission_id);
      if (trace) traces.push(trace);
    }
    return traces;
  }
}

module.exports = { MissionRuntime };
