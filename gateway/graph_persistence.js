/**
 * Graph Persistence
 * 
 * Phase 21 — Persist Execution Graph for Crash Recovery
 * 
 * Persists execution graph state for crash recovery:
 * 
 * Mission
 * ↓
 * Execution Graph
 * ↓
 * Node States
 * ↓
 * Edge States
 * ↓
 * Replay
 * ↓
 * Resume
 * 
 * Enables resuming from any node after crash.
 */

const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { witnessAuthority } = require('./witness_authority');

class GraphPersistence {
  constructor(postgresPool) {
    this._postgres = postgresPool;
  }

  /**
   * Initialize persistence
   */
  async initialize() {
    await this._createTables();
  }

  /**
   * Create tables
   */
  async _createTables() {
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS execution_graphs (
        graph_id VARCHAR(64) PRIMARY KEY,
        mission_id VARCHAR(64) NOT NULL,
        graph_type VARCHAR(100) NOT NULL,
        graph_schema JSONB NOT NULL,
        graph_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        witness_hash VARCHAR(64)
      )
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_graphs_mission ON execution_graphs(mission_id)
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_graphs_status ON execution_graphs(graph_status)
    `);

    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS graph_node_states (
        node_state_id VARCHAR(64) PRIMARY KEY,
        graph_id VARCHAR(64) NOT NULL,
        node_id VARCHAR(100) NOT NULL,
        node_type VARCHAR(100) NOT NULL,
        node_status VARCHAR(50) DEFAULT 'pending',
        node_input JSONB,
        node_output JSONB,
        node_error TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW
      )
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_node_states_graph ON graph_node_states(graph_id)
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_node_states_status ON graph_node_states(node_status)
    `);
  }

  /**
   * Save graph
   * @param {Object} graph - Graph to save
   * @returns {Object} Saved graph
   */
  async saveGraph(graph) {
    const graphHash = CanonicalAuthority.hash(graph.graph_schema);

    await this._postgres.query(`
      INSERT INTO execution_graphs (graph_id, mission_id, graph_type, graph_schema, graph_status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (graph_id) DO UPDATE SET
        graph_schema = $4,
        graph_status = $5
    `, [
      graph.graph_id,
      graph.mission_id,
      graph.graph_type,
      JSON.stringify(graph.graph_schema),
      graph.graph_status || 'pending'
    ]);

    return await this.getGraph(graph.graph_id);
  }

  /**
   * Get graph
   * @param {string} graphId - Graph ID
   * @returns {Object|null} Graph
   */
  async getGraph(graphId) {
    const result = await this._postgres.query(`
      SELECT * FROM execution_graphs WHERE graph_id = $1
    `, [graphId]);

    if (result.rows.length === 0) {
      return null;
    }

    return {
      ...result.rows[0],
      graph_schema: JSON.parse(result.rows[0].graph_schema)
    };
  }

  /**
   * Update graph status
   * @param {string} graphId - Graph ID
   * @param {string} status - New status
   */
  async updateGraphStatus(graphId, status) {
    if (status === 'started') {
      await this._postgres.query(`
        UPDATE execution_graphs
        SET graph_status = $1, started_at = NOW()
        WHERE graph_id = $2
      `, [status, graphId]);
    } else if (status === 'completed') {
      await this._postgres.query(`
        UPDATE execution_graphs
        SET graph_status = $1, completed_at = NOW()
        WHERE graph_id = $2
      `, [status, graphId]);
    } else {
      await this._postgres.query(`
        UPDATE execution_graphs
        SET graph_status = $1
        WHERE graph_id = $2
      `, [status, graphId]);
    }
  }

  /**
   * Save node state
   * @param {string} graphId - Graph ID
   * @param {string} nodeId - Node ID
   * @param {string} nodeType - Node type
   * @param {string} status - Node status
   * @param {Object} input - Node input
   * @param {Object} output - Node output
   * @returns {Object} Node state
   */
  async saveNodeState(graphId, nodeId, nodeType, status, input = null, output = null) {
    const nodeStateId = this._generateNodeStateId(graphId, nodeId);

    await this._postgres.query(`
      INSERT INTO graph_node_states (node_state_id, graph_id, node_id, node_type, node_status, node_input, node_output)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (node_state_id) DO UPDATE SET
        node_status = $5,
        node_input = $6,
        node_output = $7
    `, [
      nodeStateId,
      graphId,
      nodeId,
      nodeType,
      status,
      input ? JSON.stringify(input) : null,
      output ? JSON.stringify(output) : null
    ]);

    if (status === 'started') {
      await this._postgres.query(`
        UPDATE graph_node_states
        SET started_at = NOW()
        WHERE node_state_id = $1
      `, [nodeStateId]);
    } else if (status === 'completed' || status === 'failed') {
      await this._postgres.query(`
        UPDATE graph_node_states
        SET completed_at = NOW()
        WHERE node_state_id = $1
      `, [nodeStateId]);
    }

    return await this.getNodeState(nodeStateId);
  }

  /**
   * Get node state
   * @param {string} nodeStateId - Node state ID
   * @returns {Object|null} Node state
   */
  async getNodeState(nodeStateId) {
    const result = await this._postgres.query(`
      SELECT * FROM graph_node_states WHERE node_state_id = $1
    `, [nodeStateId]);

    if (result.rows.length === 0) {
      return null;
    }

    return {
      ...result.rows[0],
      node_input: result.rows[0].node_input ? JSON.parse(result.rows[0].node_input) : null,
      node_output: result.rows[0].node_output ? JSON.parse(result.rows[0].node_output) : null
    };
  }

  /**
   * Get node states for graph
   * @param {string} graphId - Graph ID
   * @returns {Array} Node states
   */
  async getNodeStatesForGraph(graphId) {
    const result = await this._postgres.query(`
      SELECT * FROM graph_node_states WHERE graph_id = $1 ORDER BY created_at ASC
    `, [graphId]);

    return result.rows.map(row => ({
      ...row,
      node_input: row.node_input ? JSON.parse(row.node_input) : null,
      node_output: row.node_output ? JSON.parse(row.node_output) : null
    }));
  }

  /**
   * Get pending nodes for graph
   * @param {string} graphId - Graph ID
   * @returns {Array} Pending node states
   */
  async getPendingNodes(graphId) {
    const result = await this._postgres.query(`
      SELECT * FROM graph_node_states 
      WHERE graph_id = $1 AND node_status = 'pending'
 ORDER BY created_at ASC
    `, [graphId]);

    return result.rows.map(row => ({
      ...row,
      node_input: row.node_input ? JSON.parse(row.node_input) : null,
      node_output: row.node_output ? JSON.parse(row.node_output) : null
    }));
  }

  /**
   * Resume graph from last completed node
   * @param {string} graphId - Graph ID
   * @returns {Object|null} Resume state
   */
  async getResumeState(graphId) {
    const nodeStates = await this.getNodeStatesForGraph(graphId);

    // Find last completed node
    const lastCompleted = nodeStates.filter(n => n.node_status === 'completed').pop();
    
    // Find next pending node
    const nextPending = nodeStates.filter(n => n.node_status === 'pending')[0];

    if (!lastCompleted && !nextPending) {
      return null;
    }

    return {
      graph_id: graphId,
      last_completed_node: lastCompleted ? lastCompleted.node_id : null,
      next_pending_node: nextPending ? nextPending.node_id : null,
      can_resume: !!nextPending
    };
  }

  /**
   * Generate node state ID
   * @param {string} graphId - Graph ID
   * @param {string} nodeId - Node ID
   * @returns {string} Node state ID
   */
  _generateNodeStateId(graphId, nodeId) {
    const data = { graph_id: graphId, node_id: nodeId, timestamp: constitutionalTimeAuthority.now() };
    const hash = CanonicalAuthority.hash(data);
    return `node_${hash.substring(0, 16)}`;
  }
}

module.exports = { GraphPersistence };
