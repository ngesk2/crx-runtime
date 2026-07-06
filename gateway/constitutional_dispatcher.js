class ConstitutionalDispatcher {
  constructor(reducerExecutor) {
    this._reducerExecutor = reducerExecutor;
    this._reducerMap = this._buildReducerMap();
  }

  _buildReducerMap() {
    return {
      DOCUMENT_IMPORTED: ['summary', 'lineage'],
      CLAIM_CREATED: ['summary', 'lineage'],
      CANDIDATE_CLAIM_CREATED: ['summary'],
      OBSERVATION_PROCESSED: ['lineage'],
      PROJECTION_COMPLETED: ['summary'],
      AGENT_REGISTERED: ['lineage'],
      WORKER_REGISTERED: ['lineage'],
      REPLAY_COMPLETED: ['summary']
    };
  }

  async dispatch(event) {
    const reducerNames = this._reducerMap[event.event_type] || [];
    if (reducerNames.length === 0) {
      return [];
    }
    const results = [];
    for (const name of reducerNames) {
      const result = await this._reducerExecutor.invoke(name, event);
      results.push(result);
    }
    return results;
  }

  getReducerNames(eventType) {
    return this._reducerMap[eventType] || [];
  }
}

module.exports = { ConstitutionalDispatcher };
