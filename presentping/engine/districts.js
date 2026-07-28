// ── DISTRICTS.JS ─────────────────────────────────────────────────────
// V17: Exactly six districts. No more. No less. (Copied from V16)

const DISTRICTS = {
  gateway: {
    id: 'gateway',
    name: 'Gateway',
    owner: 'External',
    purpose: 'Observation ingress',
    visualQuestions: [
      'What entered?',
      'Where did it come from?',
      'Who owns it?'
    ],
    internalSystems: [
      'Reality Ingress',
      'Event Intake',
      'Event Emission',
      'Ownership Attribution'
    ],
    outputs: [
      'Evidence-bearing packets only'
    ],
    color: '#00E5FF'
  },

  witness: {
    id: 'witness',
    name: 'Witness',
    owner: 'Kernel',
    purpose: 'Ground truth determination',
    visualQuestions: [
      'What is true?',
      'What changed?',
      'Why did it change?',
      'What evidence exists?',
      'How confident are we?',
      'Can it be reproduced?'
    ],
    internalSystems: [
      'State Correlation',
      'Evidence Generation',
      'Confidence Assessment',
      'Diff Analysis',
      'Causal Tracing',
      'Validation'
    ],
    outputs: [
      'Verified State',
      'Rejected State'
    ],
    contains: [
      'REJECTION CHUTE'
    ],
    color: '#FFC400',
    isLargest: true
  },

  bedrock: {
    id: 'bedrock',
    name: 'Bedrock',
    owner: 'Kernel',
    purpose: 'Canonical reality',
    visualMessage: 'IF IT IS NOT HERE, IT DID NOT HAPPEN',
    internalSystems: [
      'Raw Events',
      'Snapshots',
      'Temporal Queries',
      'Audit Trails'
    ],
    outputs: [],
    position: 'foundational',
    color: '#FFFFFF'
  },

  replay: {
    id: 'replay',
    name: 'Replay',
    owner: 'Agent-RX',
    purpose: 'Historical reconstruction',
    internalSystems: [
      'Deterministic Reconstruction',
      'Historical Recovery',
      'Fork Analysis',
      'Event Replay',
      'Evidence Reconstruction'
    ],
    outputs: [],
    isNot: [
      'Evolution',
      'AGI Training',
      'Future Simulation',
      'Self-Improvement Engine'
    ],
    color: '#C0C0C0'
  },

  builder: {
    id: 'builder',
    name: 'Builder',
    owner: 'Agent-BX',
    purpose: 'Execution and artifact generation',
    internalSystems: [
      'Task Creation',
      'Agent Execution',
      'Tool Invocation',
      'Artifact Production',
      'Deployment'
    ],
    outputs: [],
    doNotAdd: [
      'Evolution engines',
      'Fitness scoring',
      'Optimization organisms',
      'Self-directed AGI'
    ],
    color: '#00FF00'
  },

  governance: {
    id: 'governance',
    name: 'Governance',
    owner: 'Constitution',
    purpose: 'Constraint enforcement',
    internalSystems: [
      'Proposal Intake',
      'Constraint Evaluation',
      'Approval Gate',
      'Rejection Gate',
      'Rollback Trigger'
    ],
    outputs: [],
    mustDisplay: [
      'APPROVED',
      'REJECTED',
      'ROLLBACK'
    ],
    failureRouting: true,
    color: '#FFC400'
  }
};

module.exports = { DISTRICTS };
