const { reducerAuthority } = require('../authorities/reducer_authority');
const { CanonicalAuthority } = require('../authorities/canonical_authority');

class ReducerRegistry {
  constructor() {
    this._entries = new Map();
  }

  register(eventType, name, reducerFn, metadata = {}) {
    const registration = reducerAuthority.registerReducer(name, reducerFn, metadata);
    if (!this._entries.has(eventType)) {
      this._entries.set(eventType, []);
    }
    this._entries.get(eventType).push({ name, fn: reducerFn, registration });
  }

  getForEvent(eventType) {
    return this._entries.get(eventType) || [];
  }

  async invoke(name, reducerFn, event, currentState = {}) {
    const newState = reducerFn(event, currentState);
    const stateHash = CanonicalAuthority.hash(newState);
    return { name, state: newState, stateHash };
  }

  hasReducersFor(eventType) {
    return this._entries.has(eventType) && this._entries.get(eventType).length > 0;
  }

  getAllRegistered() {
    const result = {};
    for (const [eventType, reducers] of this._entries) {
      result[eventType] = reducers.map(r => r.name);
    }
    return result;
  }
}

module.exports = { ReducerRegistry };
