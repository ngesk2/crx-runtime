/**
 * Simple Pipeline Server
 * 
 * Minimal Express server to serve pipeline files without PostgreSQL/dependencies
 * This is a temporary solution to serve drive_index.json, placements.json, manifest.json, etc.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;
const PING_ROOT = path.resolve(__dirname, '../');

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Pipeline file routes
app.get('/cache/drive_index.json', (req, res) => {
  const filePath = path.join(PING_ROOT, 'cache', 'drive_index.json');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).json({ error: 'Drive index not found' });
});

app.get('/config/placements.json', (req, res) => {
  const filePath = path.join(PING_ROOT, 'config', 'placements.json');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).json({ error: 'Placements config not found' });
});

app.get('/content/manifest.json', (req, res) => {
  const filePath = path.join(PING_ROOT, 'content', 'manifest.json');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).json({ error: 'Manifest not found' });
});

app.get('/logs/sync.log', (req, res) => {
  const filePath = path.join(PING_ROOT, 'logs', 'sync.log');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).json({ error: 'Sync log not found' });
});

app.get('/logs/audit.json', (req, res) => {
  const filePath = path.join(PING_ROOT, 'logs', 'audit.json');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).json({ error: 'Audit log not found' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'simple-pipeline-server' });
});

// System state (minimal)
app.get('/system/state', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    services: {
      postgresql: { healthy: false, error: 'Not running' },
      qdrant: { healthy: false, error: 'Not running' },
    },
    compiler: { status: 'Ready', passes: 6 },
    replay: { status: 'Ready', entries: 0 },
    witness: { status: 'Initialized', blocks: 0 },
    objectGraph: { nodes: 0, edges: 0 },
    ollama: { status: 'Offline', model: 'None' },
    gateway: { status: 'Healthy' },
  });
});

// Ollama status (minimal)
app.get('/api/v1/ollama/status', (req, res) => {
  res.json({
    status: 'idle',
    running_jobs: 0,
    idle_since: new Date().toISOString(),
    total_jobs: 0,
    completed_jobs: 0,
    model: 'qwen2.5-coder:7b',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple Pipeline Server running on http://0.0.0.0:${PORT}`);
  console.log(`Serving pipeline files from: ${PING_ROOT}`);
});
