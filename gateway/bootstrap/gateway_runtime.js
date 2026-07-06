/**
 * Gateway Runtime
 * 
 * PATCH_001: Introduce gateway-to-kernel adapter interface
 * 
 * The gateway now communicates with the kernel through the GatewayToKernelAdapter,
 * ensuring proper layer separation and constitutional ownership.
 */

const express = require('express');
const { EventReadAuthority } = require('../event_read_authority');
const { RepositoryStore } = require('../repository_store');
const { GatewayToKernelAdapter } = require('../../runtime/kernel/gateway_adapter');
const createEventRoutes = require('../routes/events');
const createRepositoryRoutes = require('../routes/repository');
const createContextRoutes = require('../routes/context');
const healthRoutes = require('../routes/health');
const createSystemRoutes = require('../routes/system');
const ollamaRoutes = require('../routes/ollama');

class GatewayRuntime {
  constructor(pool) {
    this._app = express();
    this._pool = pool;

    this._setupMiddleware();
  }

  _setupMiddleware() {
    this._app.use(express.json());
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

  async _initializeServices() {
    const eventReadAuthority = new EventReadAuthority(this._pool);
    await eventReadAuthority.initialize();
    const repoStore = new RepositoryStore(this._pool);
    await repoStore.initialize();
    
    // PATCH_002: Initialize kernel adapter (creates its own EventRepository)
    const kernelAdapter = new GatewayToKernelAdapter(this._pool);
    await kernelAdapter.initialize();
    
    return { eventReadAuthority, repoStore, kernelAdapter };
  }

  _mountRoutes(services) {
    this._app.use('/api/v1/ollama', ollamaRoutes);
    this._app.use('/health', healthRoutes);
    this._app.use('/events', createEventRoutes(services.eventReadAuthority, services.kernelAdapter.executeEvent.bind(services.kernelAdapter)));
    this._app.use('/context', createContextRoutes(services.eventReadAuthority));
    this._app.use('/api/v1/repository', createRepositoryRoutes(services.repoStore));
    this._app.use('/system', createSystemRoutes(services.eventReadAuthority));
  }

  get app() {
    return this._app;
  }

  async start(port) {
    const services = await this._initializeServices();
    this._mountRoutes(services);
    this._app.listen(port, '0.0.0.0', () => {
      console.log(`Gateway running on http://0.0.0.0:${port}`);
    });
  }

  async shutdown() {
    // PATCH_001: Shutdown kernel adapter
    if (this._kernelAdapter) {
      await this._kernelAdapter.shutdown();
    }
  }
}

module.exports = { GatewayRuntime };
