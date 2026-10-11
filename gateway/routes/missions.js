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

  // Signed MISSION_CREATE is distinct from object admission and processor creation.
  router.post('/', require('../route_middleware').admittedCommandHandler(missionRuntime, 'createAdmitted', 'MISSION_CREATE'));

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
