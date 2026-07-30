/**
 * Deployment Registry Routes
 * 
 * P004: HTTP interface for the Deployment Registry Authority.
 * 
 * POST /deployments — Register deployment
 * GET /deployments/:id — Resolve deployment
 * GET /deployments/tenant/:tenantId — List deployments
 * PUT /deployments/:id/status — Transition status
 * POST /deployments/:id/complete — Complete deployment
 * POST /deployments/:id/fail — Fail deployment
 * POST /deployments/:id/rollback — Rollback deployment
 * GET /deployments/tenant/:tenantId/active — Resolve active deployment
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../route_middleware');

function createDeploymentRoutes(deploymentRegistry) {
  router.post('/', asyncHandler('POST /deployments', async (req) => {
    const {
      tenant_id, version, git_sha, container_image,
      oracle_region, environment, metadata,
    } = req.body;

    if (!tenant_id || !version || !git_sha) {
      throw new Error('tenant_id, version, and git_sha are required');
    }

    const deployment = await deploymentRegistry.executeRegisterDeployment({
      tenantId: tenant_id,
      version,
      gitSha: git_sha,
      containerImage: container_image,
      oracleRegion: oracle_region,
      environment,
      metadata,
    });

    return { deployment };
  }));

  router.get('/:id', asyncHandler('GET /deployments/:id', async (req) => {
    const { id } = req.params;
    const deployment = await deploymentRegistry.executeResolveDeployment(id);
    if (!deployment) throw new Error(`Deployment ${id} not found`);
    return { deployment };
  }));

  router.get('/tenant/:tenantId', asyncHandler('GET /deployments/tenant/:tenantId', async (req) => {
    const { tenantId } = req.params;
    const { limit, status } = req.query;
    const deployments = await deploymentRegistry.executeListDeployments(tenantId, {
      limit: limit ? parseInt(limit) : undefined,
      status,
    });
    return { deployments, count: deployments.length };
  }));

  router.put('/:id/status', asyncHandler('PUT /deployments/:id/status', async (req) => {
    const { id } = req.params;
    const updates = req.body;
    const deployment = await deploymentRegistry.executeTransitionStatus(id, updates);
    if (!deployment) throw new Error(`Deployment ${id} not found`);
    return { deployment };
  }));

  router.post('/:id/complete', asyncHandler('POST /deployments/:id/complete', async (req) => {
    const { id } = req.params;
    const { health } = req.body;
    const deployment = await deploymentRegistry.executeCompleteDeployment(id, health);
    if (!deployment) throw new Error(`Deployment ${id} not found`);
    return { deployment };
  }));

  router.post('/:id/fail', asyncHandler('POST /deployments/:id/fail', async (req) => {
    const { id } = req.params;
    const { error } = req.body;
    const deployment = await deploymentRegistry.executeFailDeployment(id, error);
    if (!deployment) throw new Error(`Deployment ${id} not found`);
    return { deployment };
  }));

  router.post('/:id/rollback', asyncHandler('POST /deployments/:id/rollback', async (req) => {
    const { id } = req.params;
    const deployment = await deploymentRegistry.executeRollbackDeployment(id);
    if (!deployment) throw new Error(`Deployment ${id} not found`);
    return { deployment };
  }));

  router.get('/tenant/:tenantId/active', asyncHandler('GET /deployments/tenant/:tenantId/active', async (req) => {
    const { tenantId } = req.params;
    const deployment = await deploymentRegistry.executeResolveActiveDeployment(tenantId);
    return { deployment };
  }));

  return router;
}

module.exports = createDeploymentRoutes;
