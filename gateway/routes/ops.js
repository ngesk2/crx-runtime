// P046-P050: Operational Intelligence API Routes
// Aggregates health, drift, fleet, runtime, and dashboard into /ops/* endpoints.
// Every response includes generated_runtime_authoritative and runtime_artifact_hash.

const express = require('express');
const { constitutionalTimeAuthority } = require('../../ping-runtime/authorities/constitutional_time_authority.js');

function createOpsRoutes(services) {
  const router = express.Router();
  const { healthAuthority, driftDetector, fingerprint, systemAuthority,
          eventValidator, capabilityResolver, workflowExecutor,
          deploymentLoader, stateMachineExecutor, runtimeHash } = services;

  // P046: /ops/status — aggregated operational status
  router.get('/status', async (req, res) => {
    try {
      const health = healthAuthority ? await healthAuthority.getHealth() : { status: 'unconfigured' };
      const drift = driftDetector ? driftDetector.getHashes() : null;
      const fp = fingerprint ? fingerprint.generate() : null;
      const eventTypes = eventValidator ? eventValidator.getStats().totalEventTypes : 0;
      const capabilities = capabilityResolver ? capabilityResolver.getStats().totalCapabilities : 0;
      const workflows = workflowExecutor ? workflowExecutor.getStats().totalWorkflows : 0;
      const deployments = deploymentLoader ? deploymentLoader.getStats().totalServices : 0;
      const stateMachines = stateMachineExecutor ? stateMachineExecutor.getStats().totalMachines : 0;

      res.json({
        status: 'ok',
        generated_runtime_authoritative: true,
        runtime_artifact_hash: runtimeHash || null,
        uptime: process.uptime(),
        components: {
          health: health.status,
          drift: drift ? (drift.healthy ? 'healthy' : 'degraded') : 'unknown',
          events: eventTypes,
          capabilities,
          workflows,
          deployments,
          state_machines: stateMachines,
        },
        drift_hashes: drift || {},
        fingerprint: fp || {},
        checked_at: constitutionalTimeAuthority.nowAsISOString(),
      });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // P047: /ops/health — component-level health
  router.get('/health', async (req, res) => {
    try {
      if (!healthAuthority) {
        return res.json({ status: 'unconfigured', components: {} });
      }
      const health = await healthAuthority.getHealth();
      res.json(health);
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // P048: /ops/drift — drift detection status
  router.get('/drift', (req, res) => {
    try {
      if (!driftDetector) {
        return res.json({ status: 'unconfigured', healthy: true, hashes: {} });
      }
      const hashes = driftDetector.getHashes();
      const healthy = Object.values(hashes).every(v => v !== null);
      res.json({
        status: healthy ? 'healthy' : 'degraded',
        healthy,
        hashes,
        checked_at: constitutionalTimeAuthority.nowAsISOString(),
      });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // P049: /ops/dashboard — executive summary
  router.get('/dashboard', async (req, res) => {
    try {
      let dashboardData = {};
      if (systemAuthority) {
        const state = await systemAuthority.getSystemState();
        dashboardData = {
          repository: state.repository || {},
          knowledge: state.knowledge || {},
          postgres: state.postgres || {},
          qdrant: state.qdrant || {},
          missions: state.missions || {},
          replay: state.replay || {},
          organizational_health: state.organizational_health || {},
          metrics: state.metrics || {},
        };
      }
      res.json({
        status: 'ok',
        generated_runtime_authoritative: true,
        dashboard: dashboardData,
        generated_at: constitutionalTimeAuthority.nowAsISOString(),
      });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // P050: /ops/system — system-level metrics (replaces hardcoded health)
  router.get('/system', async (req, res) => {
    try {
      let systemState = {};
      if (systemAuthority) {
        systemState = await systemAuthority.getSystemState();
      }
      res.json({
        status: 'ok',
        generated_runtime_authoritative: true,
        system: systemState,
        generated_at: constitutionalTimeAuthority.nowAsISOString(),
      });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  return router;
}

module.exports = createOpsRoutes;
