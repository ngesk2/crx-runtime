/**
 * Ingest Routes — PING Canonical Boundary v1
 *
 * POST /ingest — single HTTP boundary for the Canonicalization Service.
 * This route is a THIN ADAPTER only: validate → canonicalize → emit → respond.
 * No business logic lives here. The boundary is the CanonicalizationService,
 * not this route.
 *
 * Body: {
 *   source: string,         // producing source/authority ID (required)
 *   eventType: string,      // event type (required, validated against registry)
 *   payload: object,        // event data (required)
 *   namespace?: string,     // core::<name> | tenant::<id> (default core::owner)
 *   logicalId?: string,     // explicit logical identity (default: timestamp-stripped payload)
 *   confidence?: number,    // default 0.5 (observations are not knowledge)
 *   evidence?: string[],    // evidence event IDs
 *   lifecycleStage?: string // observation | candidate | knowledge
 * }
 *
 * Responses:
 *   201 — event canonicalized + emitted
 *   400 — missing/invalid fields, invalid namespace
 *   422 — event type rejected by governance/validator
 */

const express = require('express');

function createIngestRoutes(canonicalizationService) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const body = req.body || {};

    if (!body.source || typeof body.source !== 'string') {
      return res.status(400).json({ status: 'error', error: 'source (string) required' });
    }
    if (!body.eventType || typeof body.eventType !== 'string') {
      return res.status(400).json({ status: 'error', error: 'eventType (string) required' });
    }
    if (!body.payload || typeof body.payload !== 'object') {
      return res.status(400).json({ status: 'error', error: 'payload (object) required' });
    }

    try {
      // Boundary authorization: authorize against the AUTHENTICATED principal,
      // never the client-supplied body.source. Phase 3 follow-up (2026-09-17):
      // a bearer principal could otherwise claim an internal source
      // (e.g. review-authority) to reach namespaces it is not entitled to.
      // body.source remains the emitted provenance, but it grants no authority.
      // No internal HTTP callers of /ingest exist (in-process callers use the
      // service directly), so binding authorization to the bearer identity is
      // safe. Missing identity fails closed.
      const _agent = req.authenticatedAgent;
      const _principal = _agent ? ('api:' + _agent.agentId) : 'api:unknown';
      const auth = canonicalizationService.authorizeNamespace(_principal, body.namespace);
      if (!auth.authorized) {
        return res.status(400).json({ status: 'error', error: auth.reason });
      }

      const result = await canonicalizationService.canonicalizeAndEmit({
        source: body.source,
        eventType: body.eventType,
        payload: body.payload,
        namespace: body.namespace,
        logicalId: body.logicalId,
        confidence: body.confidence,
        evidence: body.evidence,
        lifecycleStage: body.lifecycleStage,
      });

      if (result.status !== 'ok') {
        const rejected = /unknown event_type|not registered|invalid event type/i.test(result.error || '');
        return res.status(rejected ? 422 : 400).json({ status: 'error', error: result.error });
      }

      return res.status(201).json({
        status: 'ok',
        eventId: result.eventId,
        objectId: result.objectId,
        canonicalHash: result.canonicalHash,
        canonicalVersion: result.canonicalVersion,
        namespace: result.namespace,
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', error: err.message });
    }
  });

  return router;
}

module.exports = createIngestRoutes;
