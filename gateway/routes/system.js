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
const path = require('path');
const fs = require('fs');

function createSystemRoutes(eventReadAuthority) {
  const systemAuthority = new SystemAuthority(eventReadAuthority);

  // Pipeline file routes (no PostgreSQL required)
  const PING_ROOT = path.resolve(__dirname, '../../');
  
  router.get('/cache/drive_index.json', asyncHandler('/cache/drive_index.json', async (req, res) => {
    const filePath = path.join(PING_ROOT, 'cache', 'drive_index.json');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.status(404).json({ error: 'Drive index not found' });
  }));

  router.get('/config/placements.json', asyncHandler('/config/placements.json', async (req, res) => {
    const filePath = path.join(PING_ROOT, 'config', 'placements.json');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.status(404).json({ error: 'Placements config not found' });
  }));

  router.get('/content/manifest.json', asyncHandler('/content/manifest.json', async (req, res) => {
    const filePath = path.join(PING_ROOT, 'content', 'manifest.json');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.status(404).json({ error: 'Manifest not found' });
  }));

  router.get('/logs/sync.log', asyncHandler('/logs/sync.log', async (req, res) => {
    const filePath = path.join(PING_ROOT, 'logs', 'sync.log');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.status(404).json({ error: 'Sync log not found' });
  }));

  router.get('/logs/audit.json', asyncHandler('/logs/audit.json', async (req, res) => {
    const filePath = path.join(PING_ROOT, 'logs', 'audit.json');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.status(404).json({ error: 'Audit log not found' });
  }));

  router.get('/state', asyncHandler('/system/state', async (req) => {
    return await systemAuthority.getSystemState();
  }));

  return router;
}

module.exports = createSystemRoutes;
