class Dispatcher {
  constructor(reducerRegistry) {
    this._reducerRegistry = reducerRegistry;
  }

  resolve(event) {
    const reducers = this._reducerRegistry.getForEvent(event.event_type);
    return reducers;
  }
}

module.exports = { Dispatcher };
