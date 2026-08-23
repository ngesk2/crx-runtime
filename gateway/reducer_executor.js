const { reducerAuthority } = require('./reducer_authority');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class ReducerExecutor {
  constructor() {
    this._reducers = new Map();
  }

  register(name, reducerFn, metadata = {}) {
    const registration = reducerAuthority.registerReducer(name, reducerFn, metadata);
    this._reducers.set(name, { fn: reducerFn, registration });
    return registration;
  }

  async invoke(name, event, currentState = {}) {
    const entry = this._reducers.get(name);
    if (!entry) {
      return { name, applied: false, reason: 'Reducer not registered' };
    }
    const newState = entry.fn(event, currentState);
    const stateHash = CanonicalAuthority.hash(newState);
    const verification = reducerAuthority.verifyReducer(name);
    return {
      name,
      applied: true,
      state: newState,
      stateHash,
      verified: verification.valid,
      timestamp: constitutionalTimeAuthority.now()
    };
  }

  async execute(event, reducerOutputs) {
    const results = [];
    for (const output of reducerOutputs) {
      if (output.reducerName) {
        const result = await this.invoke(output.reducerName, event);
        results.push(result);
      }
    }
    return results;
  }

  hasReducer(name) {
    return this._reducers.has(name);
  }
}

module.exports = { ReducerExecutor };
