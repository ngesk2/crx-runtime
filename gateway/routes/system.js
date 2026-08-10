/**
 * System Routes
 * 
 * Bounded context for system state and monitoring endpoints.
 * HTTP → SystemAuthority → Result
 */

const express = require('express');
const router = express.Router();
const { SystemAuthority } = require('../../ping-runtime/runtime/system_authority');
const { asyncHandler } = require('../route_middleware');

function createSystemRoutes(eventReadAuthority) {
  const systemAuthority = new SystemAuthority(eventReadAuthority);

  router.get('/state', asyncHandler('/system/state', async (req) => {
    return await systemAuthority.getSystemState();
  }));

  return router;
}

module.exports = createSystemRoutes;
