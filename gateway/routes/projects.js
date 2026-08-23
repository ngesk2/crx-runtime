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
const router = express.Router();
const { asyncHandler } = require('../route_middleware');

function createProjectRoutes(projectAuthority) {
  router.post('/', asyncHandler(async (req, res) => {
    const result = await projectAuthority.executeCreateProject(req.body);
    res.status(201).json(result);
  }));

  router.put('/:id', asyncHandler(async (req, res) => {
    const result = await projectAuthority.executeUpdateProject({
      projectId: req.params.id,
      ...req.body,
    });
    res.json(result);
  }));

  router.get('/stats', asyncHandler(async (req, res) => {
    const stats = await projectAuthority.executeGetProjectStats({
      tenantId: req.query.tenantId,
    });
    res.json(stats);
  }));

  router.get('/', asyncHandler(async (req, res) => {
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

  router.get('/:id', asyncHandler(async (req, res) => {
    const project = await projectAuthority.executeResolveProject({
      projectId: req.params.id,
      tenantId: req.query.tenantId,
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  }));

  router.post('/:id/artifacts', asyncHandler(async (req, res) => {
    const result = await projectAuthority.executeAddArtifact({
      projectId: req.params.id,
      ...req.body,
    });
    res.status(201).json(result);
  }));

  router.get('/:id/artifacts', asyncHandler(async (req, res) => {
    const artifacts = await projectAuthority.executeListArtifacts({
      projectId: req.params.id,
      tenantId: req.query.tenantId,
    });
    res.json(artifacts);
  }));

  return router;
}

module.exports = createProjectRoutes;
