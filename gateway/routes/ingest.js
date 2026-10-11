/**
 * POST /ingest is an alias of the existing commissioning admission command.
 * Only original commissioning-admission@2 bytes cross this HTTP boundary.
 * Source/namespace claims in a legacy browser envelope confer no entitlement.
 */
const express = require('express');
const { commissionedWriteHandler } = require('../route_middleware');

function createIngestRoutes({ eventRuntime, tenantRegistry } = {}) {
  const router = express.Router();
  router.post('/', commissionedWriteHandler(eventRuntime, tenantRegistry));
  return router;
}

module.exports = createIngestRoutes;
