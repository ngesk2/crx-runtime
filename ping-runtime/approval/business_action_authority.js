/**
 * Business Action Authority — PING Core v1
 *
 * Generic human approval gate for consequential business actions.
 */

const crypto = require('crypto');
const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');
const { CanonicalAuthority } = require('../authorities/canonical_authority.js');

class BusinessActionAuthority {
  constructor(options = {}) {
    this._storage = options.storage || null;
    this._actions = {};
  }

  generateActionId({ missionId, capability, targetIdentity }) {
    const identity = {
      mission_id: missionId,
      capability,
      target_identity: targetIdentity,
    };
    const hash = CanonicalAuthority.hash(identity);
    return 'action_' + hash.substring(0, 16);
  }

  async proposeAction({ missionId, capability, targetIdentity, preview, reason, evidence, risk, expirationSeconds = 3600 }) {
    const actionId = this.generateActionId({ missionId, capability, targetIdentity });

    const now = constitutionalTimeAuthority.nowAsISOString();
    const expiration = new Date(new Date(now).getTime() + expirationSeconds * 1000).toISOString();

    const action = {
      action_id: actionId,
      mission_id: missionId,
      capability,
      target_identity: targetIdentity,
      preview,
      reason,
      evidence: evidence || [],
      risk: risk || 'medium',
      expiration_at: expiration,
      status: 'PENDING_HUMAN',
      proposed_at: now,
      decided_at: null,
      decided_by: null,
    };

    if (this._storage) {
      await this._storage.insert('proposed_actions', action);
    } else {
      this._actions[actionId] = action;
    }

    return action;
  }

  async getAction(actionId) {
    if (this._storage) {
      return await this._storage.get('proposed_actions', actionId);
    }
    return this._actions[actionId] || null;
  }

  async approveAction(actionId, decidedBy) {
    const action = await this.getAction(actionId);
    if (!action) throw new Error('Action not found: ' + actionId);

    if (action.status !== 'PENDING_HUMAN') {
      throw new Error('Action is not pending: ' + action.status);
    }

    const now = constitutionalTimeAuthority.nowAsISOString();

    if (new Date(now) > new Date(action.expiration_at)) {
      action.status = 'EXPIRED';
      action.decided_at = now;
      action.decided_by = decidedBy;
      if (this._storage) {
        await this._storage.update('proposed_actions', actionId, action);
      } else {
        this._actions[actionId] = action;
      }
      throw new Error('Action expired');
    }

    action.status = 'APPROVED';
    action.decided_at = now;
    action.decided_by = decidedBy;

    if (this._storage) {
      await this._storage.update('proposed_actions', actionId, action);
    } else {
      this._actions[actionId] = action;
    }

    return action;
  }

  async rejectAction(actionId, decidedBy) {
    const action = await this.getAction(actionId);
    if (!action) throw new Error('Action not found: ' + actionId);

    if (action.status !== 'PENDING_HUMAN') {
      throw new Error('Action is not pending: ' + action.status);
    }

    const now = constitutionalTimeAuthority.nowAsISOString();

    action.status = 'REJECTED';
    action.decided_at = now;
    action.decided_by = decidedBy;

    if (this._storage) {
      await this._storage.update('proposed_actions', actionId, action);
    } else {
      this._actions[actionId] = action;
    }

    return action;
  }

  async listPendingActions() {
    if (this._storage) {
      return await this._storage.query('proposed_actions', { status: 'PENDING_HUMAN' });
    }
    return Object.values(this._actions).filter(a => a.status === 'PENDING_HUMAN');
  }

  async health() {
    return {
      healthy: true,
      storage: !!this._storage,
      inMemoryActions: Object.keys(this._actions).length,
    };
  }
}

module.exports = { BusinessActionAuthority };
