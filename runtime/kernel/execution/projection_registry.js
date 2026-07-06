class ProjectionRegistry {
  constructor() {
    this._projectors = new Map();
  }

  register(name, projectorFn) {
    this._projectors.set(name, projectorFn);
  }

  getAll() {
    return Array.from(this._projectors.entries()).map(([name, fn]) => ({ name, fn }));
  }

  async executeAll(event, reducerResults, context) {
    const results = {};
    for (const [name, projectorFn] of this._projectors) {
      try {
        results[name] = await projectorFn(event, reducerResults, context);
      } catch (error) {
        results[name] = { projected: false, error: error.message };
      }
    }
    return results;
  }
}

// Singleton instance
const projectionRegistry = new ProjectionRegistry();

module.exports = { ProjectionRegistry, projectionRegistry };
