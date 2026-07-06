const { Pool } = require('pg');
const { EventRepository } = require('../event_repository');
const { ConstitutionalExecutionPipeline } = require('../runtime/constitutional_execution_pipeline');
const { Dispatcher } = require('../runtime/dispatcher');
const { ReducerRegistry } = require('../runtime/reducer_registry');
const { ProjectionRegistry } = require('../runtime/projection_registry');
const { ReplayDecisionAuthority } = require('../runtime/replay_decision_authority');

class ConstitutionalRuntime {
  constructor(pool) {
    this._pool = pool;
    this._reducerRegistry = new ReducerRegistry();
    this._projectionRegistry = new ProjectionRegistry();
    this._dispatcher = new Dispatcher(this._reducerRegistry);
    this._replayDecision = new ReplayDecisionAuthority();
    this._eventRepository = new EventRepository(pool);

    this._pipeline = new ConstitutionalExecutionPipeline(
      this._eventRepository,
      this._dispatcher,
      this._reducerRegistry,
      this._projectionRegistry,
      this._replayDecision,
      pool
    );
  }

  get reducerRegistry() { return this._reducerRegistry; }
  get projectionRegistry() { return this._projectionRegistry; }
  get dispatcher() { return this._dispatcher; }
  get eventRepository() { return this._eventRepository; }

  async execute(request) {
    return this._pipeline.execute(request);
  }

  async initialize() {
    await this._eventRepository.initialize();
  }
}

module.exports = { ConstitutionalRuntime };
