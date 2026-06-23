// ── VERIFY_WORLD_TOPOLOGY.JS ─────────────────────────────────────────
// V17: Topology verification. 11 verification rules. (Copied from V16)

const { WORLD } = require('./world');
const { DISTRICTS } = require('./districts');
const { validatePacketOwnership } = require('./infrastructure');

class TopologyVerificationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TopologyVerificationError';
  }
}

function verifyWorldTopology() {
  const errors = [];

  // Rule 1: No duplicate district IDs
  const districtIds = WORLD.districts.map(d => d.id);
  const uniqueIds = new Set(districtIds);
  if (districtIds.length !== uniqueIds.size) {
    errors.push({
      rule: 1,
      message: 'Duplicate district IDs detected',
      severity: 'fatal'
    });
  }

  // Rule 2: Exactly six districts exist
  if (WORLD.districts.length !== 6) {
    errors.push({
      rule: 2,
      message: `Expected exactly 6 districts, found ${WORLD.districts.length}`,
      severity: 'fatal'
    });
  }

  // Rule 3: Required districts exist
  const requiredDistricts = ['gateway', 'witness', 'bedrock', 'replay', 'builder', 'governance'];
  const existingDistricts = WORLD.districts.map(d => d.id);
  for (const required of requiredDistricts) {
    if (!existingDistricts.includes(required)) {
      errors.push({
        rule: 3,
        message: `Missing required district: ${required}`,
        severity: 'fatal'
      });
    }
  }

  // Rule 4: Witness → Bedrock exists
  const witnessToBedrock = WORLD.successTopology.some(
    route => route.from === 'witness' && route.to === 'bedrock'
  );
  if (!witnessToBedrock) {
    errors.push({
      rule: 4,
      message: 'Missing required success route: Witness → Bedrock',
      severity: 'fatal'
    });
  }

  // Rule 5: Bedrock → Replay exists
  const bedrockToReplay = WORLD.successTopology.some(
    route => route.from === 'bedrock' && route.to === 'replay'
  );
  if (!bedrockToReplay) {
    errors.push({
      rule: 5,
      message: 'Missing required success route: Bedrock → Replay',
      severity: 'fatal'
    });
  }

  // Rule 6: Replay → Builder exists
  const replayToBuilder = WORLD.successTopology.some(
    route => route.from === 'replay' && route.to === 'builder'
  );
  if (!replayToBuilder) {
    errors.push({
      rule: 6,
      message: 'Missing required success route: Replay → Builder',
      severity: 'fatal'
    });
  }

  // Rule 7: Builder → Governance exists
  const builderToGovernance = WORLD.successTopology.some(
    route => route.from === 'builder' && route.to === 'governance'
  );
  if (!builderToGovernance) {
    errors.push({
      rule: 7,
      message: 'Missing required success route: Builder → Governance',
      severity: 'fatal'
    });
  }

  // Rule 8: Governance → Gateway exists
  const governanceToGateway = WORLD.successTopology.some(
    route => route.from === 'governance' && route.to === 'gateway'
  );
  if (!governanceToGateway) {
    errors.push({
      rule: 8,
      message: 'Missing required success route: Governance → Gateway',
      severity: 'fatal'
    });
  }

  // Rule 9: At least one rejection path exists
  const hasRejectionPath = WORLD.failureRoutes.some(
    route => route.type === 'rejected' || route.type === 'rollback' || route.type === 'verification_failure'
  );
  if (!hasRejectionPath) {
    errors.push({
      rule: 9,
      message: 'Missing required failure path (rejection, rollback, or verification failure)',
      severity: 'fatal'
    });
  }

  // Rule 10: Every infrastructure packet contains required fields
  const { INFRASTRUCTURE } = require('./infrastructure');
  for (const [districtKey, districtInfra] of Object.entries(INFRASTRUCTURE)) {
    for (const packet of districtInfra.packets) {
      try {
        packet.validate();
      } catch (error) {
        errors.push({
          rule: 10,
          message: `Packet validation failed in ${districtKey}: ${error.message}`,
          severity: 'fatal'
        });
      }
    }
  }

  // Rule 11: Packet owner must match source district owner
  for (const [districtKey, districtInfra] of Object.entries(INFRASTRUCTURE)) {
    for (const packet of districtInfra.packets) {
      try {
        validatePacketOwnership(packet, districtKey);
      } catch (error) {
        errors.push({
          rule: 11,
          message: `Packet ownership validation failed in ${districtKey}: ${error.message}`,
          severity: 'fatal'
        });
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    errorCount: errors.length
  };
}

function runVerification() {
  console.log('Verifying world topology...');
  const result = verifyWorldTopology();

  if (!result.passed) {
    console.error('Topology verification failed:');
    result.errors.forEach(error => {
      console.error(`  [Rule ${error.rule}] ${error.message} (${error.severity})`);
    });
    throw new TopologyVerificationError(
      `Topology verification failed: ${result.errorCount} error(s) detected`
    );
  }

  console.log('✓ World topology verification passed');
  return result;
}

module.exports = {
  verifyWorldTopology,
  runVerification,
  TopologyVerificationError
};
