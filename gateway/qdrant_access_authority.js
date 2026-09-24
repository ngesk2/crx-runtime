/**
 * Qdrant Access Authority (Node path)
 *
 * SOLE construction site for the Qdrant client on the gateway's enforced
 * Node request path. Every gateway module that touches Qdrant must consume
 * this authority (getQdrantClient() or QdrantAccessAuthority#getClient())
 * instead of calling `new QdrantClient()` itself.
 *
 * This is the Node-side counterpart of the Python ProjectionAuthority
 * (runtime/authorities/projection_authority.py), which owns Qdrant access
 * on the Python worker path. A Python module cannot be the owner for the
 * Node runtime, so this module holds Node-path sovereignty.
 *
 * The shared client is a lazy singleton: the underlying client is
 * stateless (base URL + headers from QDRANT_URL / QDRANT_API_KEY), so one
 * instance serves all consumers with identical behavior to the previous
 * per-module `new QdrantClient()` calls.
 *
 * Guard: gateway/test_qdrant_access_sovereignty.js fails if any module on
 * the enforced path constructs a Qdrant client outside this file.
 */

const { QdrantClient } = require('./qdrant_client');

let _sharedClient = null;

/**
 * Return the single shared Qdrant client for this process.
 * @returns {QdrantClient}
 */
function getQdrantClient() {
  if (!_sharedClient) {
    _sharedClient = new QdrantClient();
  }
  return _sharedClient;
}

/**
 * QdrantAccessAuthority — dependency-injectable owner of Qdrant access.
 * Prefer getQdrantClient() for the simple case; use this class where the
 * PING authority container pattern (constructor injection) applies.
 */
class QdrantAccessAuthority {
  constructor() {
    this._client = null;
  }

  /**
   * Return the authority-owned Qdrant client (same process singleton).
   * @returns {QdrantClient}
   */
  getClient() {
    if (!this._client) {
      this._client = getQdrantClient();
    }
    return this._client;
  }
}

module.exports = { QdrantAccessAuthority, getQdrantClient };
