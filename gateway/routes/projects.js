/**
 * Project Routes
 *
 * HPP: HTTP interface for the Project Authority.
 *
 * POST   /projects              — Create a project
 * PUT    /projects/:id          — Update a project
 * GET    /projects              — List/search projects
 * GET    /projects/stats        — Aggregate statistics
 * GET    /projects/:id          — Resolve a project
 * POST   /projects/:id/artifacts — Add an artifact to a project
 * GET    /projects/:id/artifacts — List project artifacts
 */

const express = require('express');
const { asyncHandler, requireTenantScope, denyAuthUnconfigured } = require('../route_middleware');

function createProjectRoutes(projectAuthority, auth) {
  // NOTE: per-call router (see reviews.js) — never module-level.
  const router = express.Router();
  // P2 write-authority closure (2026-10-11): mutations require exterior
  // authentication plus the tenant-scope gate. project writes previously
  // accepted a raw body with no tenant at all; they now require a declared
  // tenant inside the agent's operator-provisioned allow-list, and the
  // recorded tenant is the gate-verified one (req.authorizedTenant), never
  // a body value on trust.
  const authenticate = auth && typeof auth.middleware === 'function'
    ? auth.middleware()
    : denyAuthUnconfigured;
  const scoped = (getScope, label, handler) =>
    [authenticate, requireTenantScope(getScope), asyncHandler(label, handler)];
  const projectScope = (req) => req.body && (req.body.tenantId || req.body.tenant_id);

  router.post('/', ...scoped(projectScope, 'POST /projects', async (req, res) => {
    const result = await projectAuthority.executeCreateProject({
      ...req.body,
      tenantId: req.authorizedTenant,
    });
    res.status(201).json(result);
  }));

  router.put('/:id', ...scoped(projectScope, 'PUT /projects/:id', async (req, res) => {
    const result = await projectAuthority.executeUpdateProject({
      projectId: req.params.id,
      ...req.body,
      tenantId: req.authorizedTenant,
    });
    res.json(result);
  }));

  router.get('/stats', asyncHandler('GET /projects/stats', async (req, res) => {
    const stats = await projectAuthority.executeGetProjectStats({
      tenantId: req.query.tenantId,
    });
    res.json(stats);
  }));

  router.get('/', asyncHandler('GET /projects', async (req, res) => {
    const projects = await projectAuthority.executeListProjects({
      tenantId: req.query.tenantId,
      status: req.query.status,
      projectType: req.query.projectType,
      customerId: req.query.customerId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    });
    res.json(projects);
  }));

  router.get('/:id', asyncHandler('GET /projects/:id', async (req, res) => {
    const project = await projectAuthority.executeResolveProject({
      projectId: req.params.id,
      tenantId: req.query.tenantId,
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  }));

  router.post('/:id/artifacts', ...scoped(projectScope, 'POST /projects/:id/artifacts', async (req, res) => {
    const result = await projectAuthority.executeAddArtifact({
      projectId: req.params.id,
      ...req.body,
      tenantId: req.authorizedTenant,
    });
    res.status(201).json(result);
  }));

  router.get('/:id/artifacts', asyncHandler('GET /projects/:id/artifacts', async (req, res) => {
    const artifacts = await projectAuthority.executeListArtifacts({
      projectId: req.params.id,
      tenantId: req.query.tenantId,
    });
    res.json(artifacts);
  }));

  return router;
}

module.exports = createProjectRoutes;
