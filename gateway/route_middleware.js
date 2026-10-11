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
  denyUnadmittedMutation
};
