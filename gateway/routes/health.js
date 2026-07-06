/**
 * Health Routes
 * 
 * Bounded context for health and system status endpoints.
 */

const express = require('express');
const router = express.Router();

// Health endpoint
router.get('/', (req, res) => {
  res.json({ status: 'healthy', service: 'gateway' });
});

module.exports = router;
