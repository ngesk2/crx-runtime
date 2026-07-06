const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority');

class ExecutionArtifact {
  constructor(request) {
    this._request = Object.freeze({ ...request });
    this._stages = [];
    this._startedAt = constitutionalTimeAuthority.nowAsMillis();
    this._error = null;
  }

  addStage(name, data) {
    this._stages.push({
      stage: name,
      data: Object.freeze({ ...data }),
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      sequence: this._stages.length + 1
    });
  }

  fail(error) {
    this._error = { message: error.message, name: error.name, stage: this._stages.length };
  }

  get request() {
    return this._request;
  }

  get stages() {
    return this._stages.map(s => ({ stage: s.stage, data: s.data, timestamp: s.timestamp, sequence: s.sequence }));
  }

  getStage(name) {
    const found = this._stages.find(s => s.stage === name);
    return found ? found.data : null;
  }

  get succeeded() {
    return this._error === null && this._stages.length > 0;
  }

  get failed() {
    return this._error !== null;
  }

  get error() {
    return this._error;
  }

  get durationMs() {
    return constitutionalTimeAuthority.nowAsMillis() - this._startedAt;
  }

  toResponse() {
    return {
      succeeded: this.succeeded,
      event_id: this.getStage('schema')?.event?.event_id || null,
      schema: 'constitutional',
      stages: this.stages.map(s => s.stage),
      duration_ms: this.durationMs,
      error: this._error?.message || null
    };
  }

  toFull() {
    return {
      request: this._request,
      succeeded: this.succeeded,
      stages: this.stages,
      duration_ms: this.durationMs,
      error: this._error
    };
  }
}

module.exports = { ExecutionArtifact };
