/**
 * Health Routes
 *
 * Delegates to healthAuthority — single source of truth for system health.
 */

const express = require('express');

function createHealthRoutes(healthAuthority) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      if (healthAuthority && typeof healthAuthority.getHealth === 'function') {
        const health = await healthAuthority.getHealth();
        const status = health.status === 'healthy' ? 200 : 503;
        res.status(status).json(health);
      } else {
        res.json({ status: 'healthy', service: 'gateway', note: 'healthAuthority not available' });
      }
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  return router;
}

module.exports = createHealthRoutes;
