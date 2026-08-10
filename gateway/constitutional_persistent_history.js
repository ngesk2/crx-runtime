/**
 * Constitutional Persistent History
 * 
 * Ω.92 — Persistent Constitutional History
 * 
 * Store:
 * - RFC
 * - Mission
 * - Replay report
 * - Witness report
 * - LOC removed
 * - Authorities eliminated
 * - Git commit SHA
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');

class ConstitutionalPersistentHistory {
  constructor(postgresPool) {
    this._postgres = postgresPool;
  }

  /**
   * Initialize persistent history
   */
  async initialize() {
    console.log('[PersistentHistory] Initializing constitutional persistent history');

    console.log('[PersistentHistory] Persistent history initialized');
  }

  /**
   * Record constitutional history
   * 
   * @param {Object} historyData - History data
   * @returns {Object} Recorded history
   */
  async recordConstitutionalHistory(historyData) {
    console.log('[PersistentHistory] Recording constitutional history');

    const historyId = deterministicIdAuthority.generateIdFromObject({
      timestamp: constitutionalTimeAuthority.now(),
    });

    const history = {
      history_id: historyId,
      rfc: historyData.rfc,
      mission: historyData.mission,
      replay_verification: historyData.replay_verification,
      gate_result: historyData.gate_result,
      integration: historyData.integration,
      git_commit_shas: historyData.git_commit_shas,
      loc_removed: await this._calculateLOCRemoved(historyData),
      authorities_eliminated: await this._identifyAuthoritiesEliminated(historyData),
      created_at: constitutionalTimeAuthority.now(),
    };

    await this._persistHistory(history);

    console.log(`[PersistentHistory] Constitutional history recorded: ${historyId}`);
    return history;
  }

  /**
   * Calculate LOC removed
   */
  async _calculateLOCRemoved(historyData) {
    let totalLOC = 0;

    if (historyData.rfc?.sections?.loc_removed) {
      totalLOC += historyData.rfc.sections.loc_removed;
    }

    if (historyData.rfc?.sections?.code_disappearance) {
      for (const disappearance of historyData.rfc.sections.code_disappearance) {
        totalLOC += disappearance.estimated_loc_removed || 0;
      }
    }

    return totalLOC;
  }

  /**
   * Identify authorities eliminated
   */
  async _identifyAuthoritiesEliminated(historyData) {
    const eliminated = [];

    if (historyData.rfc?.sections?.authority_disappearance) {
      for (const disappearance of historyData.rfc.sections.authority_disappearance) {
        eliminated.push({
          authority: disappearance.current_authority,
          replacement_authority: disappearance.replacement_authority,
          reason: disappearance.reason,
        });
      }
    }

    if (historyData.rfc?.sections?.subsystem_eliminations) {
      for (const elimination of historyData.rfc.sections.subsystem_eliminations) {
        eliminated.push({
          authority: elimination.subsystem,
          replacement_authority: null,
          reason: elimination.reason,
        });
      }
    }

    return eliminated;
  }

  /**
   * Persist history
   */
  async _persistHistory(history) {
    try {
      await this._postgres.query(`
        INSERT INTO constitutional_history (history_id, history, created_at)
        VALUES ($1, $2, NOW())
      `, [history.history_id, JSON.stringify(history)]);
    } catch (error) {
      console.error(`[PersistentHistory] Failed to persist history ${history.history_id}:`, error.message);
    }
  }

  /**
   * Get history by ID
   */
  async getHistory(historyId) {
    try {
      const result = await this._postgres.query(`
        SELECT history
        FROM constitutional_history
        WHERE history_id = $1
      `, [historyId]);

      if (result.rows.length > 0) {
        return result.rows[0].history;
      }
      return null;
    } catch (error) {
      console.error(`[PersistentHistory] Failed to get history ${historyId}:`, error.message);
      return null;
    }
  }

  /**
   * Get history by RFC number
   */
  async getHistoryByRFCNumber(rfcNumber) {
    try {
      const result = await this._postgres.query(`
        SELECT history
        FROM constitutional_history
        WHERE history->>'rfc'->>'rfc_number' = $1
      `, [rfcNumber]);

      if (result.rows.length > 0) {
        return result.rows[0].history;
      }
      return null;
    } catch (error) {
      console.error(`[PersistentHistory] Failed to get history for RFC ${rfcNumber}:`, error.message);
      return null;
    }
  }

  /**
   * Get history by mission ID
   */
  async getHistoryByMissionId(missionId) {
    try {
      const result = await this._postgres.query(`
        SELECT history
        FROM constitutional_history
        WHERE history->>'mission'->>'mission_id' = $1
      `, [missionId]);

      if (result.rows.length > 0) {
        return result.rows[0].history;
      }
      return null;
    } catch (error) {
      console.error(`[PersistentHistory] Failed to get history for mission ${missionId}:`, error.message);
      return null;
    }
  }

  /**
   * Get all history
   */
  async getAllHistory(limit = 50) {
    try {
      const result = await this._postgres.query(`
        SELECT history
        FROM constitutional_history
        ORDER BY created_at DESC
        LIMIT $1
      `, [limit]);

      return result.rows.map(row => row.history);
    } catch (error) {
      console.error('[PersistentHistory] Failed to get all history:', error.message);
      return [];
    }
  }

  /**
   * Get history statistics
   */
  async getHistoryStats() {
    try {
      const result = await this._postgres.query(`
        SELECT 
          COUNT(*) as total_history,
          SUM(history->>'loc_removed') as total_loc_removed,
          COUNT(*) FILTER (WHERE jsonb_array_length(history->>'authorities_eliminated') > 0) as with_authorities_eliminated
        FROM constitutional_history
      `);

      const stats = {
        total_history: parseInt(result.rows[0].total_history || 0, 10),
        total_loc_removed: parseInt(result.rows[0].total_loc_removed || 0, 10),
        with_authorities_eliminated: parseInt(result.rows[0].with_authorities_eliminated || 0, 10),
      };

      return stats;
    } catch (error) {
      console.error('[PersistentHistory] Failed to get history stats:', error.message);
      return {
        total_history: 0,
        total_loc_removed: 0,
        with_authorities_eliminated: 0,
      };
    }
  }

  /**
   * Get authorities eliminated history
   */
  async getAuthoritiesEliminatedHistory() {
    try {
      const result = await this._postgres.query(`
        SELECT history
        FROM constitutional_history
        WHERE jsonb_array_length(history->>'authorities_eliminated') > 0
        ORDER BY created_at DESC
      `);

      const eliminated = [];
      for (const row of result.rows) {
        const history = row.history;
        for (const authority of history.authorities_eliminated) {
          eliminated.push({
            authority: authority.authority,
            replacement_authority: authority.replacement_authority,
            reason: authority.reason,
            history_id: history.history_id,
            created_at: history.created_at,
          });
        }
      }

      return eliminated;
    } catch (error) {
      console.error('[PersistentHistory] Failed to get authorities eliminated history:', error.message);
      return [];
    }
  }

  /**
   * Get LOC removed timeline
   */
  async getLOCRemovedTimeline() {
    try {
      const result = await this._postgres.query(`
        SELECT 
          history_id,
          history->>'loc_removed' as loc_removed,
          history->>'created_at' as created_at
        FROM constitutional_history
        ORDER BY created_at ASC
      `);

      return result.rows.map(row => ({
        history_id: row.history_id,
        loc_removed: parseInt(row.loc_removed || 0, 10),
        created_at: row.created_at,
      }));
    } catch (error) {
      console.error('[PersistentHistory] Failed to get LOC removed timeline:', error.message);
      return [];
    }
  }
}

module.exports = { ConstitutionalPersistentHistory };
