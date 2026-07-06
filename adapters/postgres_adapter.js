/**
 * PostgreSQL Adapter
 * 
 * Infrastructure adapter for PostgreSQL database
 * 
 * Responsibilities:
 * - save(table, data)
 * - load(table, id)
 * - transaction(callback)
 * 
 * This adapter is infrastructure-only. No constitutional logic.
 */

class PostgresAdapter {
  constructor(connectionString) {
    this._connectionString = connectionString;
    this._pool = null;
  }

  /**
   * Initialize connection pool
   */
  async initialize() {
    const { Pool } = require('pg');
    this._pool = new Pool({
      connectionString: this._connectionString,
    });

    await this._pool.connect();
    console.log('[PostgresAdapter] Connected to PostgreSQL');
  }

  /**
   * Save data to table
   * 
   * @param {string} table - Table name
   * @param {Object} data - Data to save
   * @returns {Object} Save result
   */
  async save(table, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const columnsStr = columns.join(', ');

    const query = `
      INSERT INTO ${table} (${columnsStr})
      VALUES (${placeholders})
      RETURNING *
    `;

    try {
      const result = await this._pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Postgres save failed: ${error.message}`);
    }
  }

  /**
   * Load data from table by ID
   * 
   * @param {string} table - Table name
   * @param {string} id - Record ID
   * @returns {Object} Loaded data
   */
  async load(table, id) {
    const query = `SELECT * FROM ${table} WHERE id = $1`;

    try {
      const result = await this._pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Postgres load failed: ${error.message}`);
    }
  }

  /**
   * Query table with conditions
   * 
   * @param {string} table - Table name
   * @param {Object} conditions - Query conditions
   * @returns {Array} Query results
   */
  async query(table, conditions = {}) {
    const whereClause = Object.keys(conditions)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(' AND ');
    const values = Object.values(conditions);

    let query = `SELECT * FROM ${table}`;
    
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }

    try {
      const result = await this._pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw new Error(`Postgres query failed: ${error.message}`);
    }
  }

  /**
   * Execute transaction
   * 
   * @param {Function} callback - Transaction callback
   * @returns {Object} Transaction result
   */
  async transaction(callback) {
    const client = await this._pool.connect();

    try {
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Postgres transaction failed: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Update data in table
   * 
   * @param {string} table - Table name
   * @param {string} id - Record ID
   * @param {Object} data - Data to update
   * @returns {Object} Update result
   */
  async update(table, id, data) {
    const setClause = Object.keys(data)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');
    const values = [id, ...Object.values(data)];

    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await this._pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Postgres update failed: ${error.message}`);
    }
  }

  /**
   * Delete data from table
   * 
   * @param {string} table - Table name
   * @param {string} id - Record ID
   * @returns {boolean} Delete success
   */
  async delete(table, id) {
    const query = `DELETE FROM ${table} WHERE id = $1`;

    try {
      const result = await this._pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Postgres delete failed: ${error.message}`);
    }
  }

  /**
   * Check health
   * 
   * @returns {Object} Health status
   */
  async health() {
    try {
      await this._pool.query('SELECT 1');
      return {
        healthy: true,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  /**
   * Close connection pool
   */
  async close() {
    if (this._pool) {
      await this._pool.end();
      console.log('[PostgresAdapter] Closed PostgreSQL connection');
    }
  }
}

module.exports = { PostgresAdapter };
