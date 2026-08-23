/**
 * Context Routes
 * 
 * Bounded context for runtime context service endpoints.
 * HTTP → EventReadAuthority → Result
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../route_middleware');
const { constitutionalTimeAuthority } = require('../../ping-runtime/authorities/constitutional_time_authority.js');

function createContextRoutes(eventReadAuthority) {
  router.get('/recent-events', asyncHandler('/context/recent-events', async (req) => {
    const limit = parseInt(req.query.limit) || 10;
    const events = await eventReadAuthority.getRecentEventsForContext(limit);
    return { events };
  }));

  router.get('/worker-status', asyncHandler('/context/worker-status', async (req) => {
    const workers = await eventReadAuthority.getWorkerStatusForContext();
    return { workers };
  }));

  router.get('/runtime-digest', asyncHandler('/context/runtime-digest', async (req) => {
    const digestDate = req.query.date || constitutionalTimeAuthority.nowAsISOString().split('T')[0];
    const digest = await eventReadAuthority.getDailyActivityForContext(digestDate);
    return { digest };
  }));

  router.get('/latest-summaries', asyncHandler('/context/latest-summaries', async (req) => {
    const limit = parseInt(req.query.limit) || 5;
    const summaries = await eventReadAuthority.getLatestSummariesForContext(limit);
    return { summaries };
  }));

  router.get('/recent-failures', asyncHandler('/context/recent-failures', async (req) => {
    const limit = parseInt(req.query.limit) || 5;
    const failures = await eventReadAuthority.getRecentFailuresForContext(limit);
    return { failures };
  }));

  router.get('/model-metrics', asyncHandler('/context/model-metrics', async (req) => {
    const metrics = await eventReadAuthority.getModelMetricsForContext();
    return { metrics };
  }));

  router.get('/daily-activity', asyncHandler('/context/daily-activity', async (req) => {
    const activityDate = req.query.date || constitutionalTimeAuthority.nowAsISOString().split('T')[0];
    const activity = await eventReadAuthority.getDailyActivityForContext(activityDate);
    return { activity };
  }));

  return router;
}

module.exports = createContextRoutes;
