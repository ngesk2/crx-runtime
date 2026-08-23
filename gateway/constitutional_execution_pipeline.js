const { StandardEventSchema } = require('../ping-runtime/events/standard_event_schema');
const { EventRepository } = require('./event_repository');
const { ConstitutionalDispatcher } = require('./constitutional_dispatcher');
const { ReducerExecutor } = require('./reducer_executor');
const { ProjectionExecutor } = require('./projection_executor');
const { VerificationPipeline } = require('./verification_pipeline');
const { ReplayScheduler } = require('./replay_scheduler');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class ConstitutionalExecutionPipeline {
  constructor(eventRepository, dispatcher, reducerExecutor, projectionExecutor, verificationPipeline, replayScheduler) {
    this._eventRepository = eventRepository;
    this._dispatcher = dispatcher;
    this._reducerExecutor = reducerExecutor;
    this._projectionExecutor = projectionExecutor;
    this._verificationPipeline = verificationPipeline;
    this._replayScheduler = replayScheduler;
  }

  async execute(eventType, aggregateId, aggregateType, payload, authority, options = {}) {
    const startedAt = constitutionalTimeAuthority.nowAsMillis();

    // 1. Schema — create constitutional event with all chain fields
    const event = StandardEventSchema.create(eventType, aggregateId, aggregateType, payload, authority, options);

    // 2. Repository — persist with full constitutional chain
    await this._eventRepository.appendEvent({
      event_id: event.event_id,
      object_id: aggregateId,
      event_type: eventType,
      aggregate_type: aggregateType,
      sequence: options.sequence || 1,
      payload: event.payload,
      witness: event.witness,
      timestamp: event.timestamp,
      authority: authority,
      authority_version: event.authority_version,
      causation_id: event.causation_id,
      correlation_id: event.correlation_id,
      RuntimeID: event.RuntimeID,
      PreviousEventHash: event.PreviousEventHash,
      CanonicalEventHash: event.CanonicalEventHash,
      ReducerHash: event.ReducerHash,
      WitnessHash: event.WitnessHash,
      ReplayHash: event.ReplayHash
    });

    // 3. Dispatch — route event type to reducers
    const reducerOutputs = await this._dispatcher.dispatch(event);

    // 4. Reducer — execute reducers against current state
    const reducerResults = await this._reducerExecutor.execute(event, reducerOutputs);

    // 5. Project — run all projections (summary, embedding, lineage, qdrant, etc.)
    await this._projectionExecutor.execute(event, reducerResults);

    // 6. Verify — run full verification chain
    const verificationResult = await this._verificationPipeline.verify(event, reducerResults);

    // 7. Schedule replay — decide when/how to replay
    await this._replayScheduler.schedule(event, verificationResult);

    const durationMs = constitutionalTimeAuthority.nowAsMillis() - startedAt;

    return {
      event,
      reducerResults,
      verificationResult,
      durationMs
    };
  }
}

module.exports = { ConstitutionalExecutionPipeline };
