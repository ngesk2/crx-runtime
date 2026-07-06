/**
 * Docker Port
 *
 * Phase 3.3.2 — Constitutional OSS Continuation
 *
 * Port interface for Docker operations.
 *
 * Constitutional Constraint:
 * - No shell execution
 * - No direct child_process usage
 * - All Docker operations through this port
 */

class DockerPort {
  /**
   * List all containers
   * @returns {Promise<Array>} Containers
   */
  async listContainers() {
    throw new Error('DockerPort.listContainers must be implemented by adapter');
  }

  /**
   * Check if Docker is available
   * @returns {Promise<boolean>} Docker availability
   */
  async isAvailable() {
    throw new Error('DockerPort.isAvailable must be implemented by adapter');
  }

  /**
   * Get container status
   * @param {string} containerName - Container name
   * @returns {Promise<Object|null>} Container status
   */
  async getContainerStatus(containerName) {
    throw new Error('DockerPort.getContainerStatus must be implemented by adapter');
  }
}

module.exports = { DockerPort };
