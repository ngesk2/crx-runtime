/**
 * Effect Authority — PING Core v1
 *
 * Owns canonical effect identity for idempotent external actions.
 */

const crypto = require('crypto');
const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');
const { CanonicalAuthority } = require('../authorities/canonical_authority.js');

class EffectAuthority {
  constructor(options = {}) {
    this._storage = options.storage || null;
    this._effects = {};
  }

  generateEffectId({ eventType, aggregateId, actionType }) {
    const identity = {
      event_type: eventType,
      aggregate_id: aggregateId,
      action_type: actionType,
    };
    const hash = CanonicalAuthority.hash(identity);
    return 'effect_' + hash.substring(0, 16);
  }

  async createEffect({ proposedActionId, approvalId, missionId, capability, targetIdentity, provider }) {
    const effectId = this.generateEffectId({
      eventType: capability.toUpperCase(),
      aggregateId: targetIdentity,
      actionType: capability.split('.')[1] || 'execute',
    });

    const effect = {
      effect_id: effectId,
      proposed_action_id: proposedActionId,
      approval_id: approvalId,
      mission_id: missionId,
      capability,
      target_identity: targetIdentity,
      status: 'AUTHORIZED',
      provider,
      provider_request_id: null,
      attempt: 1,
      result: null,
      error: null,
      created_at: constitutionalTimeAuthority.nowAsISOString(),
      authorized_at: constitutionalTimeAuthority.nowAsISOString(),
      executed_at: null,
      completed_at: null,
    };

    if (this._storage) {
      await this._storage.insert('effects', effect);
    } else {
      this._effects[effectId] = effect;
    }

    return effect;
  }

  async getEffect(effectId) {
    if (this._storage) {
      return await this._storage.get('effects', effectId);
    }
    return this._effects[effectId] || null;
  }

  async isEffectCompleted(effectId) {
    const effect = await this.getEffect(effectId);
    return effect && effect.status === 'SUCCEEDED';
  }

  async markExecuting(effectId, providerRequestId) {
    const effect = await this.getEffect(effectId);
    if (!effect) throw new Error('Effect not found: ' + effectId);

    effect.status = 'EXECUTING';
    effect.provider_request_id = providerRequestId;
    effect.executed_at = constitutionalTimeAuthority.nowAsISOString();

    if (this._storage) {
      await this._storage.update('effects', effectId, effect);
    } else {
      this._effects[effectId] = effect;
    }

    return effect;
  }

  async markSucceeded(effectId, result) {
    const effect = await this.getEffect(effectId);
    if (!effect) throw new Error('Effect not found: ' + effectId);

    effect.status = 'SUCCEEDED';
    effect.result = result;
    effect.completed_at = constitutionalTimeAuthority.nowAsISOString();

    if (this._storage) {
      await this._storage.update('effects', effectId, effect);
    } else {
      this._effects[effectId] = effect;
    }

    return effect;
  }

  async markFailed(effectId, error) {
    const effect = await this.getEffect(effectId);
    if (!effect) throw new Error('Effect not found: ' + effectId);

    effect.status = 'FAILED';
    effect.error = error;
    effect.completed_at = constitutionalTimeAuthority.nowAsISOString();

    if (this._storage) {
      await this._storage.update('effects', effectId, effect);
    } else {
      this._effects[effectId] = effect;
    }

    return effect;
  }

  async health() {
    return {
      healthy: true,
      storage: !!this._storage,
      inMemoryEffects: Object.keys(this._effects).length,
    };
  }
}

module.exports = { EffectAuthority };
