/**
 * Tenant Registry Routes
 * 
 * P003: HTTP interface for the Tenant Registry Authority.
 * 
 * POST /tenants — Register tenant
 * GET /tenants — List tenants
 * GET /tenants/:id — Resolve tenant
 * PUT /tenants/:id — Update tenant
 * DELETE /tenants/:id — Remove tenant
 * POST /tenants/:id/heartbeat — Record heartbeat
 */

const express = require('express');
const { asyncHandler, denyLegacyMutation } = require('../route_middleware');

function createTenantRoutes(tenantRegistry) {
  const router = express.Router();
  // No compatible trusted registration contract exists at this public entrance.
  router.post('/', denyLegacyMutation);

  router.get('/', asyncHandler('GET /tenants', async (req) => {
    const { status } = req.query;
    const tenants = await tenantRegistry.executeListTenants({ status });
    return { tenants, count: tenants.length };
  }));

  router.get('/:id', asyncHandler('GET /tenants/:id', async (req) => {
    const { id } = req.params;
    const tenant = await tenantRegistry.executeResolveTenant(id);
    if (!tenant) throw new Error(`Tenant ${id} not found`);
    return { tenant };
  }));

  router.put('/:id', denyLegacyMutation);
  router.delete('/:id', denyLegacyMutation);
  router.post('/:id/heartbeat', denyLegacyMutation);

  return router;
}

module.exports = createTenantRoutes;
