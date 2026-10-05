/**
 * Mission Card Routes — Mission Control mission approval surface.
 *
 * Mounted at /api/v1/missions by GatewayRuntime, BEHIND the exterior auth
 * middleware. UI contract: ui-next MissionCards component.
 *
 *   POST /cards/:id/approve  — approve a proposed mission
 *   POST /cards/:id/reject   — reject a proposed mission (body: { reason? })
 *   POST /cards/reorder      — persist card order (body: { cardIds: [...] })
 *
 * Approval authority chain (IDENTITY -> AUTHENTICATION -> CAPABILITY ->
 * PROPOSAL -> APPROVAL -> EFFECT):
 *   IDENTITY:        the decider is req.authenticatedAgent.agentId, resolved
 *                    from the verified credential. Never from the body.
 *   AUTHENTICATION:  exterior auth middleware (Bearer API key). Missing or
 *                    invalid credential -> 401, fail closed. The route also
 *                    refuses to run without an authenticated identity even if
 *                    mounted without the middleware (defense in depth).
 *   CAPABILITY:      the gateway's existing authorization boundary: only
 *                    authenticated exterior agents reach these routes, the same
 *                    posture as every other guarded mutation route.
 *   PROPOSAL:        the mission must exist in status 'created' (the proposal
 *                    awaiting decision). Anything else -> 409.
 *   APPROVAL:        conditional UPDATE created->approved/rejected, recording
 *                    the authenticated decider identity + timestamp (+ reason
 *                    for reject). A body-supplied approver identity that
 *                    contradicts the authenticated identity is REJECTED (400
 *                    fabricated_identity): a self-asserted approver identity
 *                    is never enough.
 *   EFFECT:          persisted transition + MISSION_APPROVED / MISSION_REJECTED
 *                    event on the event spine (via MissionRuntime).
 *
 * Reorder is a typed, validated operation: cardIds must be an array of
 * non-empty string ids, no duplicates, bounded length. Invalid -> 400 with
 * a typed error code. The order persists in mission_card_order and is
 * returned verbatim on success.
 */

const ORDER_KEY = 'default';
const MAX_CARD_IDS = 1000;
const MAX_REASON_CHARS = 2000;

let _schemaEnsured = false;

async function ensureCardOrderSchema(pool) {
  if (_schemaEnsured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mission_card_order (
      order_key VARCHAR(64) PRIMARY KEY,
      card_ids JSONB NOT NULL,
      updated_by VARCHAR(255),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  _schemaEnsured = true;
}

function createMissionCardRoutes({ missionRuntime, pool }) {
  const express = require('express');
  const router = express.Router();

  if (!missionRuntime) throw new Error('createMissionCardRoutes: missionRuntime required');
  if (!pool) throw new Error('createMissionCardRoutes: pool required');

  function callerIdentity(req) {
    const agent = req.authenticatedAgent;
    return agent && agent.agentId ? String(agent.agentId) : null;
  }

  function requireAuth(req, res) {
    const caller = callerIdentity(req);
    if (!caller) {
      res.status(401).json({ status: 'denied', reason: 'Missing authentication', code: 'MISSING_AUTH' });
      return null;
    }
    return caller;
  }

  // A body-supplied decider identity that contradicts the authenticated
  // identity is a fabricated identity: deny, do not ignore silently.
  function rejectFabricatedIdentity(req, res, caller) {
    const body = req.body || {};
    const claimed = body.approved_by ?? body.approver ?? body.approvedBy
      ?? body.rejected_by ?? body.rejecter ?? body.rejectedBy ?? body.decided_by;
    if (claimed !== undefined && claimed !== null && String(claimed) !== String(caller)) {
      res.status(400).json({
        status: 'error',
        error: 'fabricated_identity',
        detail: 'Decider identity is derived from the authenticated credential, never from the request body.',
      });
      return true;
    }
    return false;
  }

  function missionError(res, err, missionId) {
    if (err.code === 'MISSION_NOT_FOUND') {
      return res.status(404).json({ status: 'error', error: 'mission_not_found', mission_id: missionId });
    }
    if (err.code === 'MISSION_NOT_APPROVABLE' || err.code === 'MISSION_NOT_REJECTABLE') {
      return res.status(409).json({
        status: 'error',
        error: err.code === 'MISSION_NOT_APPROVABLE' ? 'mission_not_approvable' : 'mission_not_rejectable',
        mission_id: missionId,
        current_status: err.currentStatus || null,
      });
    }
    if (err.code === 'APPROVER_REQUIRED' || err.code === 'REJECTER_REQUIRED') {
      return res.status(401).json({ status: 'denied', reason: 'Missing authentication', code: 'MISSING_AUTH' });
    }
    return res.status(500).json({ status: 'error', error: err.message });
  }

  // POST /cards/:id/approve
  router.post('/cards/:id/approve', async (req, res) => {
    try {
      const caller = requireAuth(req, res);
      if (!caller) return;
      if (rejectFabricatedIdentity(req, res, caller)) return;
      const missionId = req.params.id;
      if (!missionId || typeof missionId !== 'string') {
        return res.status(400).json({ status: 'error', error: 'mission_id_required' });
      }
      const result = await missionRuntime.approve(missionId, caller);
      res.json({ status: 'ok', ...result });
    } catch (err) {
      missionError(res, err, req.params.id);
    }
  });

  // POST /cards/:id/reject  (body: { reason?: string })
  router.post('/cards/:id/reject', async (req, res) => {
    try {
      const caller = requireAuth(req, res);
      if (!caller) return;
      if (rejectFabricatedIdentity(req, res, caller)) return;
      const missionId = req.params.id;
      if (!missionId || typeof missionId !== 'string') {
        return res.status(400).json({ status: 'error', error: 'mission_id_required' });
      }
      const reason = req.body ? req.body.reason : undefined;
      if (reason !== undefined && reason !== null) {
        if (typeof reason !== 'string' || reason.length > MAX_REASON_CHARS) {
          return res.status(400).json({ status: 'error', error: 'reason_invalid' });
        }
      }
      const result = await missionRuntime.reject(missionId, caller, reason == null ? null : reason);
      res.json({ status: 'ok', ...result });
    } catch (err) {
      missionError(res, err, req.params.id);
    }
  });

  // POST /cards/reorder  (body: { cardIds: string[] })
  router.post('/cards/reorder', async (req, res) => {
    try {
      const caller = requireAuth(req, res);
      if (!caller) return;
      const body = req.body || {};
      if (body.cardIds === undefined || body.cardIds === null) {
        return res.status(400).json({ status: 'error', error: 'card_ids_required' });
      }
      if (!Array.isArray(body.cardIds)) {
        return res.status(400).json({ status: 'error', error: 'card_ids_not_array' });
      }
      if (body.cardIds.length > MAX_CARD_IDS) {
        return res.status(400).json({ status: 'error', error: 'card_ids_too_many', max: MAX_CARD_IDS });
      }
      const seen = new Set();
      for (let i = 0; i < body.cardIds.length; i++) {
        const id = body.cardIds[i];
        if (typeof id !== 'string' || id.trim().length === 0) {
          return res.status(400).json({ status: 'error', error: 'card_id_invalid', index: i });
        }
        if (seen.has(id)) {
          return res.status(400).json({ status: 'error', error: 'card_ids_duplicate', card_id: id });
        }
        seen.add(id);
      }

      await ensureCardOrderSchema(pool);
      const upsert = await pool.query(
        `INSERT INTO mission_card_order (order_key, card_ids, updated_by, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (order_key) DO UPDATE
           SET card_ids = EXCLUDED.card_ids, updated_by = EXCLUDED.updated_by, updated_at = NOW()
         RETURNING card_ids, updated_by, updated_at`,
        [ORDER_KEY, JSON.stringify(body.cardIds), caller]
      );
      const row = upsert.rows[0];
      res.json({
        status: 'ok',
        cardIds: row.card_ids,
        updated_by: row.updated_by,
        updated_at: row.updated_at,
      });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  return router;
}

module.exports = createMissionCardRoutes;
module.exports.ensureCardOrderSchema = ensureCardOrderSchema;
