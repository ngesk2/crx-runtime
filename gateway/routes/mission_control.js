/**
 * Mission Control Routes — PING Core v1
 *
 * Every widget answers a real business question.
 * Every widget is backed by canonical events from ping_events.
 * If a widget has no data, it returns empty with the precise upstream reason.
 * Never fabricates.
 */

function createMissionControlRoutes(services) {
  const express = require('express');
  const router = express.Router();
  const { constitutionalTimeAuthority } = require('../../ping-runtime/authorities/constitutional_time_authority.js');

  const { unifiedEventRuntime, knowledgeGraph, missionRuntime, aiRuntime,
    googleConnector, connectorRegistry, workerRuntime, missionScheduler, eventBridge,
    eventToMissionBridge } = services;

  const hasPG = !!(unifiedEventRuntime && missionRuntime);

  const requirePG = (req, res, next) => {
    if (!hasPG) return res.status(503).json({ error: 'Postgres unavailable', degraded: true });
    next();
  };

  // ─── Helper: query events by type ──────────────────────────────
  async function queryEventsByType(eventType, limit = 100) {
    const result = await unifiedEventRuntime.query({ eventType, limit });
    return result.events || [];
  }

  // ─── Helper: get all events in time window ─────────────────────
  async function queryEventsSince(since, limit = 500) {
    const result = await unifiedEventRuntime.query({ since, limit });
    return result.events || [];
  }

  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD — Projection-backed operating system overview
  // ═══════════════════════════════════════════════════════════════
  router.get('/dashboard', requirePG, async (req, res) => {
    try {
      const [missionStats, allEvents] = await Promise.all([
        missionRuntime.getStats(),
        queryEventsSince(new Date(constitutionalTimeAuthority.nowAsMillis() - 86400000).toISOString(), 500),
      ]);

      // Classify events by business category
      const counts = {};
      for (const e of allEvents) {
        counts[e.event_type] = (counts[e.event_type] || 0) + 1;
      }

      // Business metrics — derived from events, not hardcoded
      const business = {
        needsFollowup: (counts.LEAD_CREATED || 0) + (counts.ESTIMATE_SENT || 0),
        pendingReviews: (counts.REVIEW_RECEIVED || 0) - (counts.REVIEW_RESPONDED || 0),
        activeProjects: (counts.PROJECT_CREATED || 0) - (counts.PROJECT_COMPLETED || 0),
        unpaidInvoices: (counts.INVOICE_SENT || 0) - (counts.INVOICE_PAID || 0),
        aiRecommendations: counts.RECOMMENDATION_CREATED || 0,
        workerActivity: (counts.WORKER_COMPLETED || 0) + (counts.WORKER_FAILED || 0),
      };

      // Ensure no negative values
      for (const k of Object.keys(business)) {
        if (business[k] < 0) business[k] = 0;
      }

      res.json({
        status: 'ok',
        dashboard: {
          business,
          missions: missionStats,
          eventSummary: { total: allEvents.length, byType: counts },
          uptime: process.uptime(),
          timestamp: constitutionalTimeAuthority.nowAsISOString(),
        },
      });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // BUSINESS QUESTION ENDPOINTS
  // ═══════════════════════════════════════════════════════════════

  // Who needs follow-up? (leads, estimates, unanswered reviews)
  router.get('/business/who-needs-followup', requirePG, async (req, res) => {
    try {
      const since = new Date(constitutionalTimeAuthority.nowAsMillis() - 7 * 86400000).toISOString(); // 7 days
      const all = await queryEventsSince(since, 500);

      const leads = all.filter(e => e.event_type === 'LEAD_CREATED');
      const estimateSent = all.filter(e => e.event_type === 'ESTIMATE_SENT');
      const reviews = all.filter(e => e.event_type === 'REVIEW_RECEIVED');
      const reviewResponses = all.filter(e => e.event_type === 'REVIEW_RESPONDED');

      // Reviews without response
      const respondedReviewIds = new Set(reviewResponses.map(e => e.payload?.review_id));
      const unansweredReviews = reviews.filter(r => !respondedReviewIds.has(r.payload?.review_id));

      // Leads with no converted event
      const convertedLeadIds = new Set(all.filter(e => e.event_type === 'LEAD_CONVERTED').map(e => e.payload?.lead_id));
      const openLeads = leads.filter(l => !convertedLeadIds.has(l.payload?.lead_id));

      // Estimates with no accepted event
      const acceptedEstimateIds = new Set(all.filter(e => e.event_type === 'ESTIMATE_ACCEPTED').map(e => e.payload?.estimate_id));
      const pendingEstimates = estimateSent.filter(e => !acceptedEstimateIds.has(e.payload?.estimate_id));

      const items = [
        ...openLeads.map(e => ({ type: 'lead', id: e.payload?.lead_id, source: e.source, timestamp: e.timestamp })),
        ...pendingEstimates.map(e => ({ type: 'estimate', id: e.payload?.estimate_id, amount: e.payload?.amount, source: e.source, timestamp: e.timestamp })),
        ...unansweredReviews.map(e => ({ type: 'review', id: e.payload?.review_id, rating: e.payload?.rating, text: e.payload?.text, source: e.source, timestamp: e.timestamp })),
      ];

      res.json({
        status: 'ok',
        count: items.length,
        items,
        summary: { openLeads: openLeads.length, pendingEstimates: pendingEstimates.length, unansweredReviews: unansweredReviews.length },
      });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Which estimates are stalled? (sent but not accepted within N days)
  router.get('/business/stalled-estimates', requirePG, async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 48; // hours
      const since = new Date(constitutionalTimeAuthority.nowAsMillis() - days * 3600000).toISOString();
      const all = await queryEventsSince(since, 500);

      const estimateSent = all.filter(e => e.event_type === 'ESTIMATE_SENT');
      const estimateAccepted = all.filter(e => e.event_type === 'ESTIMATE_ACCEPTED');
      const acceptedIds = new Set(estimateAccepted.map(e => e.payload?.estimate_id));

      const stalled = estimateSent
        .filter(e => !acceptedIds.has(e.payload?.estimate_id))
        .map(e => ({
          estimateId: e.payload?.estimate_id,
          amount: e.payload?.amount,
          sentTo: e.payload?.sent_to,
          sentAt: e.timestamp,
          hoursSinceSent: Math.round((constitutionalTimeAuthority.nowAsMillis() - new Date(e.timestamp).getTime()) / 3600000),
        }));

      res.json({ status: 'ok', count: stalled.length, stalled });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Which reviews require responses?
  router.get('/business/pending-reviews', requirePG, async (req, res) => {
    try {
      const all = await queryEventsSince(new Date(constitutionalTimeAuthority.nowAsMillis() - 30 * 86400000).toISOString(), 500);
      const reviews = all.filter(e => e.event_type === 'REVIEW_RECEIVED');
      const responses = all.filter(e => e.event_type === 'REVIEW_RESPONDED');
      const respondedIds = new Set(responses.map(e => e.payload?.review_id));

      const pending = reviews
        .filter(r => !respondedIds.has(r.payload?.review_id))
        .map(e => ({
          reviewId: e.payload?.review_id,
          rating: e.payload?.rating,
          text: e.payload?.text,
          source: e.payload?.source,
          customerId: e.payload?.customer_id,
          receivedAt: e.timestamp,
        }));

      res.json({ status: 'ok', count: pending.length, pending });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // What is AI recommending?
  router.get('/business/ai-recommendations', requirePG, async (req, res) => {
    try {
      const all = await queryEventsSince(new Date(constitutionalTimeAuthority.nowAsMillis() - 7 * 86400000).toISOString(), 500);
      const recommendations = all.filter(e => e.event_type === 'RECOMMENDATION_CREATED');

      const items = recommendations.map(e => ({
        recommendationId: e.event_id,
        documentId: e.payload?.documentId,
        action: e.payload?.recommendation?.action,
        reason: e.payload?.recommendation?.reason,
        priority: e.payload?.recommendation?.priority,
        confidence: e.payload?.recommendation?.confidence,
        evidence: e.payload?.recommendation?.evidence,
        createdAt: e.timestamp,
      }));

      res.json({
        status: 'ok',
        count: items.length,
        recommendations: items,
        reason: items.length === 0 ? 'No RECOMMENDATION_CREATED events found — workers may not have processed observations yet' : undefined,
      });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // What work should happen today?
  router.get('/business/today-work', requirePG, async (req, res) => {
    try {
      const pending = await missionRuntime.getPending(50);
      const active = await missionRuntime.getActive();

      const items = [
        ...pending.map(m => ({ missionId: m.mission_id, type: m.mission_type, status: 'pending', priority: m.priority, createdAt: m.created_at })),
        ...active.map(m => ({ missionId: m.mission_id, type: m.mission_type, status: m.status, assignedTo: m.assigned_to, priority: m.priority, startedAt: m.started_at })),
      ];

      res.json({ status: 'ok', count: items.length, items });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Which invoices remain unpaid?
  router.get('/business/unpaid-invoices', requirePG, async (req, res) => {
    try {
      const all = await queryEventsSince(new Date(constitutionalTimeAuthority.nowAsMillis() - 90 * 86400000).toISOString(), 500);
      const invoicesSent = all.filter(e => e.event_type === 'INVOICE_SENT');
      const invoicesPaid = all.filter(e => e.event_type === 'INVOICE_PAID');
      const paidIds = new Set(invoicesPaid.map(e => e.payload?.invoice_id));

      const unpaid = invoicesSent
        .filter(e => !paidIds.has(e.payload?.invoice_id))
        .map(e => ({
          invoiceId: e.payload?.invoice_id,
          amount: e.payload?.amount,
          sentTo: e.payload?.sent_to,
          sentAt: e.timestamp,
          daysSinceSent: Math.round((constitutionalTimeAuthority.nowAsMillis() - new Date(e.timestamp).getTime()) / 86400000),
        }));

      res.json({ status: 'ok', count: unpaid.length, unpaid });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Which projects are unhealthy? (created but not completed within N days)
  router.get('/business/at-risk-projects', requirePG, async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const since = new Date(constitutionalTimeAuthority.nowAsMillis() - days * 86400000).toISOString();
      const all = await queryEventsSince(since, 500);

      const created = all.filter(e => e.event_type === 'PROJECT_CREATED');
      const completed = all.filter(e => e.event_type === 'PROJECT_COMPLETED');
      const completedIds = new Set(completed.map(e => e.payload?.project_id));

      const atRisk = created
        .filter(e => !completedIds.has(e.payload?.project_id))
        .map(e => ({
          projectId: e.payload?.project_id,
          name: e.payload?.name,
          type: e.payload?.type,
          customerId: e.payload?.customer_id,
          createdAt: e.timestamp,
          daysOpen: Math.round((constitutionalTimeAuthority.nowAsMillis() - new Date(e.timestamp).getTime()) / 86400000),
        }));

      res.json({ status: 'ok', count: atRisk.length, atRisk });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // What should marketing do today?
  router.get('/business/marketing', requirePG, async (req, res) => {
    try {
      const all = await queryEventsSince(new Date(constitutionalTimeAuthority.nowAsMillis() - 7 * 86400000).toISOString(), 500);

      // Projects completed = case study candidates
      const completed = all.filter(e => e.event_type === 'PROJECT_COMPLETED');

      // 5-star reviews = testimonial candidates
      const reviews = all.filter(e => e.event_type === 'REVIEW_RECEIVED' && e.payload?.rating === 5);

      // Leads not converted = nurture candidates
      const leads = all.filter(e => e.event_type === 'LEAD_CREATED');
      const converted = all.filter(e => e.event_type === 'LEAD_CONVERTED');
      const convertedIds = new Set(converted.map(e => e.payload?.lead_id));
      const nurtureLeads = leads.filter(l => !convertedIds.has(l.payload?.lead_id));

      const actions = [
        ...completed.map(e => ({ action: 'case_study', projectId: e.payload?.project_id, reason: 'Project completed' })),
        ...reviews.map(e => ({ action: 'testimonial_request', reviewId: e.payload?.review_id, rating: e.payload?.rating, text: e.payload?.text })),
        ...nurtureLeads.map(e => ({ action: 'nurture_sequence', leadId: e.payload?.lead_id, source: e.payload?.source, description: e.payload?.description })),
      ];

      res.json({ status: 'ok', count: actions.length, actions });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // INBOX — Unprocessed events
  // ═══════════════════════════════════════════════════════════════
  router.get('/inbox', requirePG, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 25;
      const result = await unifiedEventRuntime.query({ unprocessed: true, limit });
      res.json({ status: 'ok', inbox: result.events, count: result.count });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // QUEUES — Events grouped by type
  // ═══════════════════════════════════════════════════════════════
  router.get('/queues', requirePG, async (req, res) => {
    try {
      const since = req.query.since || new Date(constitutionalTimeAuthority.nowAsMillis() - 3600000).toISOString();
      const limit = parseInt(req.query.limit) || 50;
      const result = await unifiedEventRuntime.query({ since, limit });

      const queues = {};
      for (const event of result.events) {
        const type = event.event_type;
        if (!queues[type]) queues[type] = [];
        queues[type].push(event);
      }

      res.json({ status: 'ok', queues, totalEvents: result.count });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/queues/:eventType', requirePG, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const result = await unifiedEventRuntime.query({ eventType: req.params.eventType, limit });
      res.json({ status: 'ok', queue: result.events, count: result.count });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // MISSIONS
  // ═══════════════════════════════════════════════════════════════
  router.get('/missions/active', requirePG, async (req, res) => {
    try {
      const missions = await missionRuntime.getActive();
      res.json({ status: 'ok', missions, count: missions.length });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/missions/pending', requirePG, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const missions = await missionRuntime.getPending(limit);
      res.json({ status: 'ok', missions, count: missions.length });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/missions/stats', requirePG, async (req, res) => {
    try {
      const stats = await missionRuntime.getStats();
      res.json({ status: 'ok', stats });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // KNOWLEDGE
  // ═══════════════════════════════════════════════════════════════
  router.get('/knowledge', requirePG, async (req, res) => {
    try {
      const nodes = await knowledgeGraph.queryNodes({
        nodeType: req.query.type,
        search: req.query.q,
        limit: parseInt(req.query.limit) || 50,
      });
      res.json({ status: 'ok', nodes, count: nodes.length });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // SYSTEM — Health, connectors, workers
  // ═══════════════════════════════════════════════════════════════
  router.get('/system', async (req, res) => {
    try {
      const aiHealth = aiRuntime ? await aiRuntime.healthCheckAll() : { status: 'not_initialized' };
      const connectorHealth = googleConnector ? await googleConnector.health() : { status: 'not_initialized' };
      const workerStats = workerRuntime ? workerRuntime.getStats() : null;
      const schedulerStats = missionScheduler ? missionScheduler.getStats() : null;
      const bridgeStats = eventBridge ? eventBridge.getStats() : null;
      const eventMissionBridgeStats = eventToMissionBridge ? eventToMissionBridge.getStats() : null;

      res.json({
        status: 'ok',
        system: {
          ai: aiHealth,
          connectors: { google: connectorHealth },
          workers: workerStats,
          scheduler: schedulerStats,
          bridge: bridgeStats,
          eventMissionBridge: eventMissionBridgeStats,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: constitutionalTimeAuthority.nowAsISOString(),
        },
      });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // ACTIVITY FEED
  // ═══════════════════════════════════════════════════════════════
  router.get('/activity', requirePG, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 25;
      const since = req.query.since || new Date(constitutionalTimeAuthority.nowAsMillis() - 86400000).toISOString();
      const result = await unifiedEventRuntime.query({ since, limit });
      res.json({ status: 'ok', activity: result.events, count: result.count });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // INFRASTRUCTURE STATUS
  // ═══════════════════════════════════════════════════════════════
  router.get('/bridge', (req, res) => {
    const bridge = services.eventBridge;
    if (!bridge) return res.json({ status: 'degraded', message: 'EventBridge not initialized (PG unavailable)' });
    res.json({ status: 'ok', bridge: bridge.getStats() });
  });

  router.get('/event-mission-bridge', (req, res) => {
    const bridge = services.eventToMissionBridge;
    if (!bridge) return res.json({ status: 'degraded', message: 'EventToMissionBridge not initialized' });
    res.json({ status: 'ok', eventMissionBridge: bridge.getStats() });
  });

  router.get('/scheduler', (req, res) => {
    const scheduler = services.missionScheduler;
    if (!scheduler) return res.json({ status: 'degraded', message: 'MissionScheduler not initialized (PG unavailable)' });
    res.json({ status: 'ok', scheduler: scheduler.getStats() });
  });

  router.get('/workers', (req, res) => {
    const workers = services.workerRuntime;
    if (!workers) return res.json({ status: 'degraded', message: 'WorkerRuntime not initialized' });
    res.json({ status: 'ok', workers: workers.getStats() });
  });

  // ═══════════════════════════════════════════════════════════════
  // DEAD LETTER OBSERVABILITY
  // ═══════════════════════════════════════════════════════════════
  router.get('/dead-letters', async (req, res) => {
    const dlq = services.deadLetterAuthority;
    if (!dlq) return res.json({ status: 'degraded', message: 'DeadLetterAuthority not initialized' });
    try {
      const jobType = req.query.jobType || null;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      let letters;
      if (jobType) {
        letters = await dlq.getDeadLettersByJobType(jobType, { limit, offset, replayableOnly: false });
      } else {
        // No jobType filter — get all via stats aggregation (lighter than unbounded SELECT)
        const stats = await dlq.getStats();
        letters = { stats, message: 'Use ?jobType=<type> to list specific dead letters' };
      }
      res.json({ status: 'ok', deadLetters: letters, limit, offset });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/dead-letters/stats', async (req, res) => {
    const dlq = services.deadLetterAuthority;
    if (!dlq) return res.json({ status: 'degraded', message: 'DeadLetterAuthority not initialized' });
    try {
      const stats = await dlq.getStats();
      res.json({ status: 'ok', stats });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/dead-letters/:id', async (req, res) => {
    const dlq = services.deadLetterAuthority;
    if (!dlq) return res.json({ status: 'degraded', message: 'DeadLetterAuthority not initialized' });
    try {
      const letters = await dlq.getDeadLettersByMission(req.params.id);
      if (!letters || letters.length === 0) {
        return res.status(404).json({ status: 'not_found', message: `No dead letters for mission ${req.params.id}` });
      }
      res.json({ status: 'ok', deadLetters: letters });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  return router;
}

module.exports = createMissionControlRoutes;
