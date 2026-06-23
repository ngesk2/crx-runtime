// ── CONSTITUTIONAL OBJECT IDENTITY ─────────────────────────────────────
// Core objects persist across slides with persistentId

const CORE_OBJECTS = {
  EVENT_LOG: {
    persistentId: 'event_log',
    semanticType: 'authority',
    baseTitle: 'POSTGRES EVENT LOG',
    baseDescription: 'Immutable constitutional record'
  },
  GATEWAY: {
    persistentId: 'gateway',
    semanticType: 'gateway',
    baseTitle: 'CONSTITUTIONAL GATEWAY',
    baseDescription: 'Layer 0 enforcement rule'
  },
  AUTHORITY: {
    persistentId: 'authority',
    semanticType: 'authority',
    baseTitle: 'AUTHORITY',
    baseDescription: 'Execution Authority Reactor'
  },
  REPLAY_CORE: {
    persistentId: 'replay_core',
    semanticType: 'authority',
    baseTitle: 'REPLAY CORE',
    baseDescription: 'Constitutional authority'
  }
};

class ConstitutionalObject {
  constructor(config) {
    this.persistentId = config.persistentId;
    this.semanticType = config.semanticType;
    this.baseTitle = config.baseTitle;
    this.baseDescription = config.baseDescription;
    this.evolution = [];
    this.currentScale = 1.0;
    this.currentRole = 'initial';
  }

  evolve(slideNumber, newRole, scaleMultiplier = 1.0) {
    this.evolution.push({
      slideNumber,
      role: newRole,
      scale: this.currentScale * scaleMultiplier
    });
    this.currentScale *= scaleMultiplier;
    this.currentRole = newRole;
    return this;
  }

  getCurrentState() {
    return {
      persistentId: this.persistentId,
      semanticType: this.semanticType,
      title: this.baseTitle,
      description: this.baseDescription,
      scale: this.currentScale,
      role: this.currentRole,
      evolution: this.evolution
    };
  }
}

class ConstitutionalObjectRegistry {
  constructor() {
    this.objects = new Map();
    
    // Initialize core objects
    Object.entries(CORE_OBJECTS).forEach(([key, config]) => {
      this.objects.set(config.persistentId, new ConstitutionalObject(config));
    });
  }

  getObject(persistentId) {
    return this.objects.get(persistentId);
  }

  evolveObject(persistentId, slideNumber, newRole, scaleMultiplier = 1.0) {
    const obj = this.objects.get(persistentId);
    if (obj) {
      return obj.evolve(slideNumber, newRole, scaleMultiplier);
    }
    throw new Error(`Core object not found: ${persistentId}`);
  }

  getAllObjects() {
    return Array.from(this.objects.values()).map(obj => obj.getCurrentState());
  }
}

module.exports = {
  CORE_OBJECTS,
  ConstitutionalObject,
  ConstitutionalObjectRegistry
};
