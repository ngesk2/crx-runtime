/**
 * Runtime Registry Routes
 * 
 * P005: HTTP interface for the Runtime Registry Authority.
 * 
 * POST /runtime — Register component
 * GET /runtime/:id — Resolve component
 * GET /runtime/tenant/:tenantId — List components
 * PUT /runtime/tenant/:tenantId/type/:type/name/:name/status — Transition status
 * POST /runtime/tenant/:tenantId/type/:type/name/:name/heartbeat — Record heartbeat
 * DELETE /runtime/tenant/:tenantId/type/:type/name/:name — Remove component
 * GET /runtime/tenant/:tenantId/unhealthy — Detect unhealthy components
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../route_middleware');

function createRuntimeRoutes(runtimeRegistry) {
  router.post('/', asyncHandler('POST /runtime', async (req) => {
    const {
      tenant_id, component_type, component_name, version,
      build_sha, compiler_sha, contract_hash, deployment_id, node_id,
      health_endpoint, metrics_endpoint, authority_version, event_version,
      schema_version, started_at, metadata,
    } = req.body;

    if (!tenant_id || !component_type || !component_name) {
      throw new Error('tenant_id, component_type, and component_name are required');
    }

    const component = await runtimeRegistry.executeRegisterComponent({
      tenantId: tenant_id,
      componentType: component_type,
      componentName: component_name,
      version,
      buildSha: build_sha,
      compilerSha: compiler_sha,
      contractHash: contract_hash,
      deploymentId: deployment_id,
      nodeId: node_id,
      healthEndpoint: health_endpoint,
      metricsEndpoint: metrics_endpoint,
      authorityVersion: authority_version,
      eventVersion: event_version,
      schemaVersion: schema_version,
      startedAt: started_at,
      metadata,
    });

    return { component };
  }));

  router.get('/:id', asyncHandler('GET /runtime/:id', async (req) => {
    const { id } = req.params;
    const component = await runtimeRegistry.executeResolveComponent(id);
    if (!component) throw new Error(`Component ${id} not found`);
    return { component };
  }));

  router.get('/tenant/:tenantId', asyncHandler('GET /runtime/tenant/:tenantId', async (req) => {
    const { tenantId } = req.params;
    const { component_type, status } = req.query;
    const components = await runtimeRegistry.executeListComponents(tenantId, {
      componentType: component_type,
      status,
    });
    return { components, count: components.length };
  }));

  router.put('/tenant/:tenantId/type/:type/name/:name/status', asyncHandler('PUT /runtime/tenant/:tenantId/type/:type/name/:name/status', async (req) => {
    const { tenantId, type, name } = req.params;
    const updates = req.body;
    const component = await runtimeRegistry.executeTransitionStatus(tenantId, type, name, updates);
    if (!component) throw new Error(`Component ${type}/${name} not found`);
    return { component };
  }));

  router.post('/tenant/:tenantId/type/:type/name/:name/heartbeat', asyncHandler('POST /runtime/tenant/:tenantId/type/:type/name/:name/heartbeat', async (req) => {
    const { tenantId, type, name } = req.params;
    const metrics = req.body;
    await runtimeRegistry.executeRecordHeartbeat(tenantId, type, name, metrics);
    return { heartbeat: true, component: `${type}/${name}` };
  }));

  router.delete('/tenant/:tenantId/type/:type/name/:name', asyncHandler('DELETE /runtime/tenant/:tenantId/type/:type/name/:name', async (req) => {
    const { tenantId, type, name } = req.params;
    await runtimeRegistry.executeRemoveComponent(tenantId, type, name);
    return { removed: true, component: `${type}/${name}` };
  }));

  router.get('/tenant/:tenantId/unhealthy', asyncHandler('GET /runtime/tenant/:tenantId/unhealthy', async (req) => {
    const { tenantId } = req.params;
    const { threshold_ms } = req.query;
    const components = await runtimeRegistry.executeDetectUnhealthy(
      tenantId,
      threshold_ms ? parseInt(threshold_ms) : undefined
    );
    return { components, count: components.length };
  }));

  return router;
}

module.exports = createRuntimeRoutes;
