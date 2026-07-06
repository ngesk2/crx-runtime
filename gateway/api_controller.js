/**
 * API Controller
 *
 * Phase 2.7.11 — Constitutional Boundary Collapse
 *
 * Implements ApplicationPort with Express transport.
 *
 * Constitutional Constraint:
 * - Express is transport only
 * - Routes delegate to ApplicationPort
 * - ApplicationPort delegates to authorities
 */

const express = require('express');
const { ApplicationPort } = require('./application_port');
const { healthAuthority } = require('./health_authority');

class ApiController extends ApplicationPort {
  constructor(port = 3000) {
    super();
    this._port = port;
    this._app = express();
    this._server = null;
    this._setupMiddleware();
  }

  /**
   * Setup Express middleware
   */
  _setupMiddleware() {
    this._app.use(express.json());
    
    // CORS
    this._app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      
      next();
    });
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // Health check
    this._app.get('/health', async (req, res) => {
      try {
        const health = await this.getHealth();
        res.json(health);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Stats
    this._app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.getStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Chat (RAG)
    this._app.post('/api/chat', async (req, res) => {
      try {
        const response = await this.chat(req.body);
        res.json(response);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Ingest
    this._app.post('/api/ingest', async (req, res) => {
      try {
        const response = await this.ingest(req.body);
        res.json(response);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Backup
    this._app.post('/api/backup', async (req, res) => {
      try {
        const response = await this.backup();
        res.json(response);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  /**
   * Get health status (delegates to HealthAuthority)
   * @returns {Promise<Object>} Health status
   */
  async getHealth() {
    return healthAuthority.getHealth();
  }

  /**
   * Get stats
   * @returns {Promise<Object>} Stats
   */
  async getStats() {
    // Implementation would delegate to appropriate authorities
    return {
      message: 'Stats endpoint - implement with authority delegation'
    };
  }

  /**
   * Chat endpoint (RAG)
   * @param {Object} request - Chat request
   * @returns {Promise<Object>} Chat response
   */
  async chat(request) {
    // Implementation would delegate to appropriate authorities
    return {
      message: 'Chat endpoint - implement with authority delegation'
    };
  }

  /**
   * Ingest endpoint
   * @param {Object} request - Ingest request
   * @returns {Promise<Object>} Ingest response
   */
  async ingest(request) {
    // Implementation would delegate to appropriate authorities
    return {
      message: 'Ingest endpoint - implement with authority delegation'
    };
  }

  /**
   * Backup endpoint
   * @returns {Promise<Object>} Backup response
   */
  async backup() {
    // Implementation would delegate to appropriate authorities
    return {
      message: 'Backup endpoint - implement with authority delegation'
    };
  }

  /**
   * Start API server
   * @returns {Promise<void>}
   */
  async start() {
    this._server = this._app.listen(this._port, () => {
      console.log(`[ApiController] API server listening on port ${this._port}`);
    });
  }

  /**
   * Stop API server
   * @returns {Promise<void>}
   */
  async stop() {
    if (this._server) {
      this._server.close();
      this._server = null;
    }
  }

  /**
   * Get Express app (for testing)
   * @returns {Object} Express app
   */
  getApp() {
    return this._app;
  }
}

module.exports = { ApiController };
