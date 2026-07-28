// ── WORLD.JS ───────────────────────────────────────────────────────
// V17: Exactly six districts. Exactly one instance of each. (Copied from V16)

const { DISTRICTS } = require('./districts');

const WORLD = {
  districts: [
    DISTRICTS.gateway,
    DISTRICTS.witness,
    DISTRICTS.bedrock,
    DISTRICTS.replay,
    DISTRICTS.builder,
    DISTRICTS.governance
  ],

  // Required success topology
  successTopology: [
    { from: 'gateway', to: 'witness' },
    { from: 'witness', to: 'bedrock' },
    { from: 'bedrock', to: 'replay' },
    { from: 'replay', to: 'builder' },
    { from: 'builder', to: 'governance' },
    { from: 'governance', to: 'gateway' }
  ],

  // Required failure routes
  failureRoutes: [
    { from: 'witness', to: 'Rejection Sink', type: 'rejected' },
    { from: 'governance', to: 'Rollback', type: 'rollback' },
    { from: 'governance', to: 'Bedrock Violation Log', type: 'constraint_violation' },
    { from: 'witness', to: 'Failure Channel', type: 'ownership_conflict' },
    { from: 'builder', to: 'Verification Failure', type: 'verification_failure' }
  ],

  // Evidence packet schema
  packetSchema: {
    owner: 'string',
    claim: 'string',
    evidence: 'string',
    confidence: 'number',
    status: 'string',
    timestamp: 'string'
  }
};

module.exports = { WORLD };
