// ── INFRASTRUCTURE.JS ───────────────────────────────────────────────
// V17: Evidence-bearing infrastructure. Every connection carries an evidence packet. (Copied from V16)

const { DISTRICTS } = require('./districts');

class EvidencePacket {
  constructor(config) {
    this.owner = config.owner;
    this.claim = config.claim;
    this.evidence = config.evidence;
    this.confidence = config.confidence;
    this.status = config.status;
    this.timestamp = config.timestamp;
  }

  validate() {
    const required = ['owner', 'claim', 'evidence', 'confidence', 'status', 'timestamp'];
    for (const field of required) {
      if (this[field] === undefined || this[field] === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    if (typeof this.confidence !== 'number' || this.confidence < 0 || this.confidence > 100) {
      throw new Error('Confidence must be a number between 0 and 100');
    }
    return true;
  }

  toJSON() {
    return {
      OWNER: this.owner,
      CLAIM: this.claim,
      EVIDENCE: this.evidence,
      CONFIDENCE: `${this.confidence}%`,
      STATUS: this.status,
      TIMESTAMP: this.timestamp
    };
  }
}

const INFRASTRUCTURE = {
  // Example evidence packets for each district
  gateway: {
    packets: [
      new EvidencePacket({
        owner: 'External',
        claim: 'Event Received',
        evidence: 'Hash 0xABC',
        confidence: 100,
        status: 'Received',
        timestamp: 'T+0'
      })
    ]
  },

  witness: {
    packets: [
      new EvidencePacket({
        owner: 'Kernel',
        claim: 'State Validated',
        evidence: 'Hash 0x91A',
        confidence: 99.8,
        status: 'Verified',
        timestamp: 'T+184'
      }),
      new EvidencePacket({
        owner: 'Kernel',
        claim: 'State Rejected',
        evidence: 'Hash 0xXYZ',
        confidence: 0,
        status: 'Rejected',
        timestamp: 'T+200'
      })
    ]
  },

  bedrock: {
    packets: [
      new EvidencePacket({
        owner: 'Kernel',
        claim: 'Canonical State Stored',
        evidence: 'Hash 0xDEF',
        confidence: 100,
        status: 'Stored',
        timestamp: 'T+190'
      })
    ]
  },

  replay: {
    packets: [
      new EvidencePacket({
        owner: 'Agent-RX',
        claim: 'Historical State Reconstructed',
        evidence: 'Hash 0xGHI',
        confidence: 95.5,
        status: 'Reconstructed',
        timestamp: 'T+500'
      })
    ]
  },

  builder: {
    packets: [
      new EvidencePacket({
        owner: 'Agent-BX',
        claim: 'Artifact Generated',
        evidence: 'Hash 0xJKL',
        confidence: 98.2,
        status: 'Generated',
        timestamp: 'T+750'
      })
    ]
  },

  governance: {
    packets: [
      new EvidencePacket({
        owner: 'Constitution',
        claim: 'Constraint Approved',
        evidence: 'Hash 0xMNO',
        confidence: 100,
        status: 'Approved',
        timestamp: 'T+900'
      }),
      new EvidencePacket({
        owner: 'Constitution',
        claim: 'Constraint Rejected',
        evidence: 'Hash 0xPQR',
        confidence: 0,
        status: 'Rejected',
        timestamp: 'T+950'
      })
    ]
  }
};

function createPacket(config) {
  const packet = new EvidencePacket(config);
  packet.validate();
  return packet;
}

function validatePacketOwnership(packet, sourceDistrict) {
  const district = DISTRICTS[sourceDistrict];
  if (!district) {
    throw new Error(`Unknown district: ${sourceDistrict}`);
  }
  if (packet.owner !== district.owner) {
    throw new Error(
      `Packet ownership mismatch: Packet owner is "${packet.owner}", ` +
      `but source district "${sourceDistrict}" owner is "${district.owner}"`
    );
  }
  return true;
}

module.exports = {
  EvidencePacket,
  INFRASTRUCTURE,
  createPacket,
  validatePacketOwnership
};
