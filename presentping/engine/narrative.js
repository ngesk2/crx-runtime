// ── NARRATIVE.JS ─────────────────────────────────────────────────────
// V17: Slide narration only. No rendering logic. (Copied from V16)

const NARRATIVE = [
  {
    slideNumber: 1,
    slideTitle: 'Gateway + Witness',
    slideSubtitle: 'Observation and Truth',
    camera: {
      position: { x: 5, y: 3.75 },
      zoom: 'out',
      focus: ['gateway', 'witness']
    },
    notes: 'Gateway receives external events. Witness validates them as ground truth. Only evidence-bearing packets flow between districts. Witness is the largest structure - a constitutional observatory.'
  },

  {
    slideNumber: 2,
    slideTitle: 'Witness Internal Systems',
    slideSubtitle: 'Evidence and Validation',
    camera: {
      position: { x: 5, y: 3.75 },
      zoom: 'in',
      focus: ['witness']
    },
    notes: 'Witness contains State Correlation, Evidence Generation, Confidence Assessment, Diff Analysis, Causal Tracing, and Validation. It outputs Verified State or Rejected State. The Rejection Chute is mandatory. Witness is a constitutional monument.'
  },

  {
    slideNumber: 3,
    slideTitle: 'Bedrock',
    slideSubtitle: 'Canonical Reality',
    camera: {
      position: { x: 5, y: 3.75 },
      zoom: 'in',
      focus: ['bedrock']
    },
    notes: 'Bedrock is the canonical reality. It contains Raw Events, Snapshots, Temporal Queries, and Audit Trails. If it is not here, it did not happen. Bedrock appears as a foundational layer beneath the system with foundation plates, archive strata, memory vault layers, historical lattice, and audit columns.'
  },

  {
    slideNumber: 4,
    slideTitle: 'Replay',
    slideSubtitle: 'Historical Reconstruction',
    camera: {
      position: { x: 5, y: 3.75 },
      zoom: 'in',
      focus: ['replay']
    },
    notes: 'Replay is owned by Agent-RX. It performs Deterministic Reconstruction, Historical Recovery, Fork Analysis, Event Replay, and Evidence Reconstruction. Replay visually shows time with timeline fragments, fork branches, reconstruction streams, and ghost paths. Replay is NOT evolution, AGI training, future simulation, or self-improvement.'
  },

  {
    slideNumber: 5,
    slideTitle: 'Builder + Governance',
    slideSubtitle: 'Execution and Constraint Enforcement',
    camera: {
      position: { x: 5, y: 3.75 },
      zoom: 'out',
      focus: ['builder', 'governance']
    },
    notes: 'Builder is owned by Agent-BX and performs Task Creation, Agent Execution, Tool Invocation, Artifact Production, and Deployment. Builder looks operational with artifact foundries, tool lanes, execution corridors, deployment tracks, build queues, and artifact capsules. Governance is owned by Constitution and enforces constraints through Proposal Intake, Constraint Evaluation, Approval Gate, Rejection Gate, and Rollback Trigger. Governance feels authoritative with constitutional gates, approval corridors, rejection corridors, rollback locks, and constraint walls.'
  },

  {
    slideNumber: 6,
    slideTitle: 'Failure Handling',
    slideSubtitle: 'Rejection, Rollback, Ownership Conflict',
    camera: {
      position: { x: 5, y: 3.75 },
      zoom: 'in',
      focus: ['witness', 'governance']
    },
    notes: 'The system visibly demonstrates failure handling. Rejected states flow to Rejection Sink. Rollbacks are triggered by Governance. Verification failures and constraint violations are logged. Ownership conflicts are routed to Failure Channel. All failure routes use red dashed lines and occupy permanent map space with dedicated destinations: Rejection Sink, Rollback Vault, Violation Log, Failure Channel, Ownership Conflict Zone.'
  },

  {
    slideNumber: 7,
    slideTitle: 'Full System Topology',
    slideSubtitle: 'All Districts, All Evidence Packets, All Paths',
    camera: {
      position: { x: 5, y: 3.75 },
      zoom: 'out',
      focus: ['gateway', 'witness', 'bedrock', 'replay', 'builder', 'governance']
    },
    notes: 'Complete view of the constitutional substrate. Success topology: Gateway → Witness → Bedrock → Replay → Builder → Governance → Gateway. Failure routes are visible. Every connection carries an evidence packet with owner, claim, evidence, confidence, status, and timestamp. Packets are infrastructure, not metadata. Witness dominates the skyline. Bedrock is the foundational layer. The world is memorable and architecturally distinct.'
  }
];

function getNarrative(slideNumber) {
  return NARRATIVE.find(n => n.slideNumber === slideNumber);
}

function getAllNarrative() {
  return NARRATIVE;
}

module.exports = {
  NARRATIVE,
  getNarrative,
  getAllNarrative
};
