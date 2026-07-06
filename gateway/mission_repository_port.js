/**
 * Mission Repository Port
 * 
 * Tier 2 — Constitutional Port (Domain Semantics)
 * 
 * Hides mission persistence behind a domain-specific port.
 * 
 * Constitutional Constraint: Single mission repository authority for all mission operations.
 * 
 * Mission Repository Port owns:
 * - Mission persistence
 * - Mission retrieval
 * - Mission lifecycle
 * 
 * Note: This replaces generic CRUD with constitutional mission semantics.
 * 
 * Implementations:
 * - PostgreSQLMissionRepositoryProvider (current)
 * - Future: EventStoreDB, MongoDB, etc.
 */

class MissionRepositoryPort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Save mission
   * @param {Object} mission - Mission to save
   * @param {Object} options - Save options
   * @returns {Promise<Object>} Saved mission
   */
  async saveMission(mission, options = {}) {
    return this._provider.saveMission(mission, options);
  }

  /**
   * Load mission
   * @param {string} missionId - Mission ID
   * @param {Object} options - Load options
   * @returns {Promise<Object>} Loaded mission
   */
  async loadMission(missionId, options = {}) {
    return this._provider.loadMission(missionId, options);
  }

  /**
   * Find missions by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Missions
   */
  async findMissions(criteria, options = {}) {
    return this._provider.findMissions(criteria, options);
  }

  /**
   * Delete mission
   * @param {string} missionId - Mission ID
   * @param {Object} options - Delete options
   * @returns {Promise<void>}
   */
  async deleteMission(missionId, options = {}) {
    return this._provider.deleteMission(missionId, options);
  }

  /**
   * Get port ID
   * @returns {string} Port ID
   */
  getPortId() {
    return this._portId;
  }

  /**
   * Generate port ID
   * @returns {string} Port ID
   */
  _generatePortId() {
    const providerName = this._provider.constructor.name;
    return `mission_repository.${providerName.toLowerCase()}`;
  }
}

/**
 * Mission Repository Provider Interface
 * 
 * All mission repository providers must implement this interface.
 */
class MissionRepositoryProvider {
  async saveMission(mission, options) {
    throw new Error('saveMission() must be implemented');
  }

  async loadMission(missionId, options) {
    throw new Error('loadMission() must be implemented');
  }

  async findMissions(criteria, options) {
    throw new Error('findMissions() must be implemented');
  }

  async deleteMission(missionId, options) {
    throw new Error('deleteMission() must be implemented');
  }
}

module.exports = {
  MissionRepositoryPort,
  MissionRepositoryProvider
};
