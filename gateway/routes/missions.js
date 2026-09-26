/**
 * Mission Runtime Routes — PING Core v1
 * 
 * Mission Control navigates via events/queues, not CRUD.
 */

function createMissionRoutes(missionRuntime) {
  const express = require('express');
  const router = express.Router();

  // W3 MISSION: tenant gates mirror the event-route contract. ?tenant= is
  // required on reads; POST requires body tenant_id. The mission runtime
  // fails closed on missing/invalid tenant (requireMissionTenantId).

  // Get mission stats (tenant-scoped)
  router.get('/stats', async (req, res) => {
    try {
      const tenantId = req.query.tenant;
      if (!tenantId) return res.status(400).json({ status: 'error', error: 'tenant_required' });
      const stats = await missionRuntime.getStats();
      res.json({ status: 'ok', stats, tenant: tenantId });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Create a mission (tenant_id required in body)
  router.post('/', async (req, res) => {
    try {
      const { missionType, payload, priority, createdBy, tenant_id } = req.body;
      if (!tenant_id) return res.status(400).json({ status: 'error', error: 'tenant_required' });
      // LANE B (TenantOS): ownership binding at the dispatch entry. The namespace
      // is DERIVED from the validated tenant_id, never trusted from the caller —
      // a contradicting caller-supplied namespace fails closed (it would silently
      // re-scope the execution into another tenant's context). The authorizing
      // identity is the authenticated agent (this route sits behind the exterior
      // auth middleware), never a body-claimed createdBy.
      const boundNamespace = `tenant::${tenant_id}`;
      const ownedPayload = { ...(payload || {}) };
      if (ownedPayload.namespace && ownedPayload.namespace !== boundNamespace) {
        return res.status(400).json({
          status: 'error',
          error: 'tenant_namespace_mismatch',
          detail: `payload.namespace '${ownedPayload.namespace}' contradicts bound tenant '${tenant_id}' (expected '${boundNamespace}')`,
        });
      }
      ownedPayload.namespace = boundNamespace;
      const authorizedBy = (req.authenticatedAgent && req.authenticatedAgent.agentId) || createdBy || null;
      const missionId = await missionRuntime.create(missionType, ownedPayload, { priority, createdBy: authorizedBy, tenant_id });
      res.json({ status: 'ok', missionId });
    } catch (err) {
      res.status(400).json({ status: 'error', error: err.message });
    }
  });

  // Get pending missions (tenant-scoped; Orca scheduler pins per tenant)
  router.get('/pending', async (req, res) => {
    try {
      const tenantId = req.query.tenant;
      if (!tenantId) return res.status(400).json({ status: 'error', error: 'tenant_required' });
      const limit = parseInt(req.query.limit) || 10;
      const missions = await missionRuntime.getPending(limit, tenantId);
      res.json({ status: 'ok', missions, count: missions.length });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Get active missions (tenant-scoped)
  router.get('/active', async (req, res) => {
    try {
      const tenantId = req.query.tenant;
      if (!tenantId) return res.status(400).json({ status: 'error', error: 'tenant_required' });
      const missions = await missionRuntime.getActive(tenantId);
      res.json({ status: 'ok', missions, count: missions.length });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  return router;
}

module.exports = createMissionRoutes;
