/**
 * Route Middleware
 * 
 * Standardized middleware for route handlers:
 * - Request logging
 * - Error handling
 * - Response formatting
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const COMMISSIONING_BYTES = Symbol('original commissioning request bytes');

// Express verify receives bytes before JSON.parse can erase duplicate fields.
// No browser field can populate this private request property.
function captureCommissioningBytes(req, res, bytes) {
  req[COMMISSIONING_BYTES] = Buffer.from(bytes);
}

function admissionError(res, error) {
  const code = error.code || (error.message === 'malformed_input' ? error.message : null);
  if (!code || /^\d+$/.test(code)) return res.status(503).json({ status: 'UNKNOWN', error: 'admission_unavailable' });
  if (/outcome_unknown|evidence_unproven/.test(code)) return res.status(503).json({status:'UNKNOWN',error:code});
  const status = /unconfigured|pool_mismatch/.test(code) ? 503 : code === 'unauthenticated_actor' ? 401
    : /^(invalid_|malformed_input|unsupported_protocol_version)/.test(code) ? 400 : 403;
  return res.status(status).json({ status: 'error', error: code });
}

// Thin adapters only: all actor, entitlement, digest, revocation and transaction
// decisions remain with TenantRegistry and UnifiedEventRuntime.
function commissionedWriteHandler(eventRuntime, tenantRegistry) {
  return async (req, res) => {
    if (!eventRuntime?.admitCommissionedBytes || !tenantRegistry?._commissioningPool ||
        typeof tenantRegistry?._commissioningTrust?.resolveActor !== 'function') {
      return res.status(503).json({ status: 'error', error: 'commissioning_unconfigured' });
    }
    if (!Buffer.isBuffer(req[COMMISSIONING_BYTES])) return res.status(400).json({ status: 'error', error: 'original_bytes_required' });
    try {
      const result = await eventRuntime.admitCommissionedBytes(tenantRegistry, req, req[COMMISSIONING_BYTES]);
      return res.status(201).json({ status: 'ACCEPTED', eventId: result.receipt.event_id, receipt: result.receipt });
    } catch (error) { return admissionError(res, error); }
  };
}

function admittedCommandHandler(authority, method, operation) {
  return async (req, res) => {
    try {
      const registry = authority?._tenantRegistry;
      // Actor resolution belongs to the configured trust root, never body fields.
      await require('../ping-runtime/runtime/commissioning_contract').actor(registry?._commissioningTrust, req);
      if (!Buffer.isBuffer(req[COMMISSIONING_BYTES])) return res.status(400).json({status:'error',error:'original_bytes_required'});
      if (!req.body?.intent) return res.status(403).json({status:'error',error:'legacy_command_not_admitted'});
      const submission = require('../ping-runtime/runtime/commissioning_wire').parseCommandSubmission(req[COMMISSIONING_BYTES]);
      if (submission.intent.operation !== operation) return res.status(403).json({status:'error',error:'command_operation_mismatch'});
      const result = await authority[method](req, submission);
      return res.status(201).json({status:'ACCEPTED', receipt:result.receipt, ...result.commandResult});
    } catch (error) { return admissionError(res, error); }
  };
}

function denyLegacyMutation(req, res) {
  return res.status(403).json({status:'error',error:'legacy_command_not_admitted'});
}

/**
 * Fail-closed stub used when the exterior auth middleware is unavailable
 * (e.g. gateway booted without Postgres). Mutating routes mounted with this
 * deny everything instead of running unauthenticated.
 */
function denyAuthUnconfigured(req, res) {
  return res.status(503).json({ status: 'error', error: 'exterior_auth_unconfigured' });
}

/**
 * Tenant-scope authorization gate — P2 write-authority closure (2026-10-11).
 *
 * Completes the chain the exterior auth middleware starts: the middleware
 * authenticates the caller (who), this gate authorizes the tenant scope
 * (what tenant's business state the caller may touch).
 *
 * Contract:
 * - 401 MISSING_AUTH when req.authenticatedAgent is absent (defense in
 *   depth: the route refuses to run even if mounted without the middleware).
 * - 400 tenant_scope_required when the request declares no scope. A mutation
 *   with no declared tenant/namespace never reaches business SQL.
 * - 403 tenant_scope_unconfigured when the agent has no operator-provisioned
 *   allow-list. No binding installed -> fail closed, never open.
 * - 403 tenant_not_authorized when the declared scope is outside the agent's
 *   allow-list. The special entry '*' is an explicit operator grant for all
 *   scopes; it is never a default.
 * - On success stamps req.authorizedTenant (the verified scope) for handlers.
 *
 * The scope is a tenant_id or, for the knowledge graph, a namespace — both
 * are opaque scope strings the operator binds per credential.
 */
function requireTenantScope(getScope) {
  if (typeof getScope !== 'function') throw new Error('requireTenantScope: getScope(req) is required');
  return (req, res, next) => {
    const agent = req.authenticatedAgent;
    if (!agent || !agent.agentId) {
      return res.status(401).json({ status: 'denied', reason: 'Missing authentication', code: 'MISSING_AUTH' });
    }
    let scope = null;
    try { scope = getScope(req); } catch (_) { scope = null; }
    if (typeof scope !== 'string' || scope.length === 0) {
      return res.status(400).json({ status: 'error', error: 'tenant_scope_required' });
    }
    const allow = Array.isArray(agent.tenantAllowlist) ? agent.tenantAllowlist : [];
    if (allow.length === 0) {
      return res.status(403).json({ status: 'error', error: 'tenant_scope_unconfigured' });
    }
    if (!allow.includes(scope) && !allow.includes('*')) {
      return res.status(403).json({ status: 'error', error: 'tenant_not_authorized' });
    }
    req.authorizedTenant = scope;
    next();
  };
}

function admissionReceiptHandler(tenantRegistry) {
  return async (req, res) => {
    if (!tenantRegistry?._commissioningPool || typeof tenantRegistry?._commissioningTrust?.resolveActor !== 'function') {
      return res.status(503).json({ status: 'error', error: 'commissioning_unconfigured' });
    }
    if (!Buffer.isBuffer(req[COMMISSIONING_BYTES])) return res.status(400).json({ status: 'error', error: 'original_bytes_required' });
    try {
      const query = require('../ping-runtime/runtime/strict_wire_json').parseStrictJson(req[COMMISSIONING_BYTES]);
      return res.json(await tenantRegistry.executeGetAdmissionReceipt(req, query));
    } catch (error) { return admissionError(res, error); }
  };
}

function denyUnadmittedMutation(req, res) {
  return res.status(403).json({ status: 'error', error: 'commissioning_operation_unsupported' });
}

/**
 * Async route handler wrapper with logging and error handling
 * 
 * @param {string} routePath - The route path for logging
 * @param {Function} handler - The async handler function
 * @returns {Function} Express middleware function
 */
function asyncHandler(routePath, handler) {
  return async (req, res, next) => {
    const timestamp = constitutionalTimeAuthority.nowAsISOString();
    console.log(`[${timestamp}] ROUTE: ${routePath}`, { 
      method: req.method, 
      query: req.query,
      body: req.body 
    });

    try {
      const result = await handler(req, res);
      
      // If handler didn't send response, send the result
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      console.error(`[${timestamp}] ROUTE ERROR: ${routePath}`, { 
        error: error.message,
        stack: error.stack 
      });

      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  };
}

/**
 * Request logging middleware
 */
function logRequest(req, res, next) {
  const timestamp = constitutionalTimeAuthority.nowAsISOString();
  console.log(`[${timestamp}] REQUEST: ${req.method} ${req.path}`, {
    query: req.query,
    body: req.body
  });
  next();
}

/**
 * Error handling middleware
 */
function errorHandler(err, req, res, next) {
  const timestamp = constitutionalTimeAuthority.nowAsISOString();
  console.error(`[${timestamp}] ERROR: ${req.method} ${req.path}`, {
    error: err.message,
    stack: err.stack
  });

  if (!res.headersSent) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  asyncHandler,
  logRequest,
  errorHandler,
  captureCommissioningBytes,
  commissionedWriteHandler,
  admissionReceiptHandler,
  denyUnadmittedMutation,
  admittedCommandHandler,
  denyLegacyMutation,
  denyAuthUnconfigured,
  requireTenantScope
};
