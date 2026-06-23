/**
 * Event Emitter for Gateway
 * PING CONSTITUTIONAL STABILIZATION PHASE D
 * Date: 2026-06-14
 * 
 * This module provides a single function emitEvent() for recording mutations
 * to the constitutional event log without modifying runtime behavior.
 */

const { Pool } = require('pg');

// PostgreSQL connection configuration
const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
const POSTGRES_PORT = process.env.POSTGRES_PORT || '5432';
const POSTGRES_DB = process.env.POSTGRES_DB || 'crx_runtime';
const POSTGRES_USER = process.env.POSTGRES_USER || 'postgres';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || '';

// Create PostgreSQL pool
const pool = new Pool({
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  database: POSTGRES_DB,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Simple hash function for request/response hashing
 * Uses SHA-256 via Node.js crypto
 */
const crypto = require('crypto');

function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Emit an event to the constitutional event log.
 * 
 * This function:
 * - Inserts into PostgreSQL
 * - Never modifies runtime behavior
 * - Never throws fatal exceptions
 * - Fails safely
 * - Logs failures
 * 
 * @param {string} stream - The event stream (e.g., 'gateway', 'ollama')
 * @param {string} eventType - The type of event (e.g., 'INFERENCE_REQUEST', 'INFERENCE_RESPONSE')
 * @param {object} payload - The event payload as a JSON object
 * @returns {boolean} - True if event was emitted successfully, False otherwise
 */
async function emitEvent(stream, eventType, payload) {
  try {
    // Validate inputs
    if (!stream) {
      console.error('Event emission failed: stream is empty');
      return false;
    }
    
    if (!eventType) {
      console.error('Event emission failed: eventType is empty');
      return false;
    }
    
    if (!payload) {
      console.error('Event emission failed: payload is empty');
      return false;
    }
    
    // Add timestamp to payload if not present
    if (!payload.timestamp) {
      payload.timestamp = new Date().toISOString();
    }
    
    // Insert event
    const query = `
      INSERT INTO events (stream, event_type, payload, created_at)
      VALUES ($1, $2, $3, $4)
    `;
    
    await pool.query(query, [
      stream,
      eventType,
      JSON.stringify(payload),
      new Date()
    ]);
    
    console.log(`Event emitted: stream=${stream}, event_type=${eventType}`);
    return true;
    
  } catch (error) {
    // This catch-all ensures we never throw fatal exceptions
    console.error(`Event emission failed: ${error.message}`);
    return false;
  }
}

/**
 * Emit an INFERENCE_REQUEST event
 * 
 * @param {string} model - The model name
 * @param {array} messages - The messages sent to the model
 * @returns {boolean} - True if event was emitted successfully
 */
async function emitInferenceRequest(model, messages) {
  const messagesString = JSON.stringify(messages);
  const requestHash = hashString(messagesString);
  const promptPreview = messagesString.substring(0, 500);  // First 500 chars
  
  return emitEvent('gateway', 'INFERENCE_REQUEST', {
    model: model,
    message_count: messages.length,
    request_hash: requestHash,
    prompt_preview: promptPreview,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit an INFERENCE_RESPONSE event
 * 
 * @param {string} model - The model name
 * @param {string} response - The response from the model
 * @param {number} durationMs - The duration of the inference in milliseconds
 * @returns {boolean} - True if event was emitted successfully
 */
async function emitInferenceResponse(model, response, durationMs) {
  const responseHash = hashString(response);
  const responsePreview = response.substring(0, 500);  // First 500 chars
  
  return emitEvent('gateway', 'INFERENCE_RESPONSE', {
    model: model,
    response_length: response.length,
    response_hash: responseHash,
    response_preview: responsePreview,
    duration_ms: durationMs,
    tokens_estimate: Math.floor(response.length / 4),  // Rough estimate
    task: 'inference',
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit an INFERENCE_FAILED event
 * 
 * @param {string} model - The model name
 * @param {string} error - The error message
 * @param {string} source - The source of the error
 * @returns {boolean} - True if event was emitted successfully
 */
async function emitInferenceFailed(model, error, source) {
  return emitEvent('gateway', 'INFERENCE_FAILED', {
    model: model,
    error: error,
    source: source,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  emitEvent,
  emitInferenceRequest,
  emitInferenceResponse,
  emitInferenceFailed,
  hashString
};
