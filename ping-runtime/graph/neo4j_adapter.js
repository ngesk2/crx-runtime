/**
 * Neo4j Adapter — PING Core v1 (Priority 7)
 *
 * Thin REST adapter. No framework. No abstraction layer.
 * Uses Node.js fetch (global, no npm dependency).
 * Connects to Neo4j HTTP API at /db/neo4j/tx/commit.
 */

class Neo4jAdapter {
  constructor(options = {}) {
    this._url = options.url || process.env.NEO4J_URL || 'http://localhost:7474';
    this._user = options.user || process.env.NEO4J_USER || 'neo4j';
    this._password = options.password || process.env.NEO4J_PASSWORD || 'pingpassword';
    this._connected = false;
  }

  /**
   * Execute a Cypher query.
   * @param {string} cypher — Cypher query string
   * @param {object} params — query parameters
   * @returns {Promise<{records: Array, summary: object}>}
   */
  async query(cypher, params = {}) {
    const auth = Buffer.from(`${this._user}:${this._password}`).toString('base64');
    const statements = [{ statement: cypher, parameters: params }];

    const response = await fetch(`${this._url}/db/neo4j/tx/commit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({ statements }),
    });

    if (!response.ok) {
      throw new Error(`Neo4j query failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this._connected = true;

    // Parse Neo4j REST response format
    const records = (data.results || []).flatMap(r => r.data || []);
    const summary = (data.results || [])[0]?.summary || {};

    return { records, summary };
  }

  /**
   * Health check.
   */
  async health() {
    try {
      const response = await fetch(`${this._url}/`, {
        headers: { 'Accept': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        this._connected = true;
        return { status: 'healthy', version: data.version, connected: true };
      }
      return { status: 'error', error: `HTTP ${response.status}`, connected: false };
    } catch (err) {
      this._connected = false;
      return { status: 'error', error: err.message, connected: false };
    }
  }

  /**
   * Check if connected.
   */
  isConnected() {
    return this._connected;
  }
}

module.exports = { Neo4jAdapter };
