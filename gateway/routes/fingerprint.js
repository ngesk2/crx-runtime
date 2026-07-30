// P039: Runtime Fingerprint Route
// GET /runtime/fingerprint — deterministic runtime state fingerprint

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../route_middleware');

function createFingerprintRoutes(fingerprint) {
  router.get('/', asyncHandler('GET /runtime/fingerprint', async () => {
    return fingerprint.getFingerprint();
  }));

  return router;
}

module.exports = createFingerprintRoutes;
