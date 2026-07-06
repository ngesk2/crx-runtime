/**
 * Dockerode Adapter
 *
 * Phase 3.3.2 — Constitutional OSS Continuation
 *
 * dockerode implementation of DockerPort.
 *
 * Constitutional Constraint:
 * - No shell execution
 * - No direct child_process usage
 * - All Docker operations through dockerode
 */

const Docker = require('dockerode');
const { DockerPort } = require('./docker_port');

class DockerodeAdapter extends DockerPort {
  constructor(options = {}) {
    super();
    this._docker = new Docker(options);
  }

  /**
   * List all containers
   * @returns {Promise<Array>} Containers
   */
  async listContainers() {
    try {
      const containers = await this._docker.listContainers({ all: true });
      return containers.map(c => ({
        name: c.Names[0]?.replace(/^\//, '') || c.Id.substring(0, 12),
        status: c.Status,
        state: c.State,
        image: c.Image,
        ports: c.Ports.map(p => `${p.PublicPort || 'N/A'}:${p.PrivatePort}/${p.Type}`).join(', '),
        uptime: c.Status.match(/Up (.+?)\s/)?.[1] || 'N/A',
        created: c.Created,
        id: c.Id,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if Docker is available
   * @returns {Promise<boolean>} Docker availability
   */
  async isAvailable() {
    try {
      await this._docker.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get container status
   * @param {string} containerName - Container name
   * @returns {Promise<Object|null>} Container status
   */
  async getContainerStatus(containerName) {
    try {
      const container = this._docker.getContainer(containerName);
      const info = await container.inspect();
      return {
        name: info.Name.replace(/^\//, ''),
        status: info.State.Status,
        state: info.State,
        image: info.Config.Image,
        created: info.Created,
        id: info.Id,
      };
    } catch (error) {
      return null;
    }
  }
}

// Singleton instance
const dockerodeAdapter = new DockerodeAdapter();

module.exports = { DockerodeAdapter, dockerodeAdapter };
