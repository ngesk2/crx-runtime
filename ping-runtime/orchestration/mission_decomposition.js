/**
 * Mission Decomposition — PING Core v1
 */

class MissionDecomposition {
  constructor(options = {}) {
    this._pool = options.pool || null;
    this._missionRuntime = options.missionRuntime || null;
  }

  async initialize() {
    if (!this._pool) return;
    await this._pool.query('ALTER TABLE ping_missions ADD COLUMN IF NOT EXISTS parent_mission_id VARCHAR(255)');
    await this._pool.query('ALTER TABLE ping_missions ADD COLUMN IF NOT EXISTS child_mission_ids JSONB DEFAULT \'[]\'::jsonb');
    await this._pool.query('CREATE TABLE IF NOT EXISTS ping_mission_dependencies (id SERIAL PRIMARY KEY, parent_mission_id VARCHAR(255) NOT NULL, child_mission_id VARCHAR(255) NOT NULL, dependency_type VARCHAR(50) DEFAULT \'required\', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(parent_mission_id, child_mission_id))');
    await this._pool.query('CREATE INDEX IF NOT EXISTS idx_pmd_parent ON ping_mission_dependencies(parent_mission_id)');
    await this._pool.query('CREATE INDEX IF NOT EXISTS idx_pmd_child ON ping_mission_dependencies(child_mission_id)');
    await this._pool.query('CREATE INDEX IF NOT EXISTS idx_pm_parent ON ping_missions(parent_mission_id)');
  }

  async createWithChildren({ parentMissionType, parentPayload, children = [] }) {
    const parentMissionId = await this._missionRuntime.create(parentMissionType, parentPayload);

    const childMissionIds = [];
    for (const child of children) {
      const childMissionId = await this._missionRuntime.create(child.missionType, child.payload);
      childMissionIds.push(childMissionId);

      await this._pool.query('INSERT INTO ping_mission_dependencies (parent_mission_id, child_mission_id, dependency_type) VALUES (, , ) ON CONFLICT (parent_mission_id, child_mission_id) DO NOTHING', [parentMissionId, childMissionId, child.dependencyType || 'required']);
    }

    await this._pool.query('UPDATE ping_missions SET child_mission_ids =  WHERE mission_id = ', [JSON.stringify(childMissionIds), parentMissionId]);

    for (const childMissionId of childMissionIds) {
      await this._pool.query('UPDATE ping_missions SET parent_mission_id =  WHERE mission_id = ', [parentMissionId, childMissionId]);
    }

    return { parentMissionId, childMissionIds };
  }

  async getChildren(parentMissionId) {
    const result = await this._pool.query('SELECT * FROM ping_missions WHERE parent_mission_id =  ORDER BY created_at ASC', [parentMissionId]);
    return result.rows;
  }

  async getDependencies(missionId) {
    const result = await this._pool.query('SELECT * FROM ping_mission_dependencies WHERE parent_mission_id = ', [missionId]);
    return result.rows;
  }

  async areRequiredChildrenCompleted(parentMissionId) {
    const children = await this.getChildren(parentMissionId);
    const dependencies = await this.getDependencies(parentMissionId);

    for (const child of children) {
      const dep = dependencies.find(d => d.child_mission_id === child.mission_id);
      if (dep && dep.dependency_type === 'required' && child.status !== 'completed') {
        return false;
      }
    }

    return true;
  }

  async hasFailedChild(parentMissionId) {
    const children = await this.getChildren(parentMissionId);
    return children.some(c => c.status === 'failed');
  }

  async markWaitingForChildren(parentMissionId) {
    await this._pool.query('UPDATE ping_missions SET status = \'waiting_for_children\' WHERE mission_id =  AND status = \'running\'', [parentMissionId]);
  }

  async completeParentWhenChildrenReady(parentMissionId) {
    if (await this.hasFailedChild(parentMissionId)) {
      await this._missionRuntime.fail(parentMissionId, 'Child mission failed');
      return false;
    }

    if (await this.areRequiredChildrenCompleted(parentMissionId)) {
      await this._missionRuntime.complete(parentMissionId, { reason: 'All required children completed' });
      return true;
    }

    return false;
  }

  async health() {
    return {
      healthy: !!this._pool,
      pool: !!this._pool,
      missionRuntime: !!this._missionRuntime,
    };
  }
}

module.exports = { MissionDecomposition };
