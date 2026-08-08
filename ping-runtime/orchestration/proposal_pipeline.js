const fs = require('fs');
const path = require('path');

const PROPOSAL_DIR = path.join(__dirname, 'proposals');

class ProposalPipeline {
  constructor() {
    if (!fs.existsSync(PROPOSAL_DIR)) {
      fs.mkdirSync(PROPOSAL_DIR, { recursive: true });
    }
    this._proposals = [];
    this._loadExisting();
  }

  _loadExisting() {
    if (!fs.existsSync(PROPOSAL_DIR)) return;
    const files = fs.readdirSync(PROPOSAL_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const proposal = JSON.parse(fs.readFileSync(path.join(PROPOSAL_DIR, file), 'utf8'));
        this._proposals.push(proposal);
      } catch (e) { }
    }
  }

  createProposal(workerId, workerName, assignment) {
    const id = `prop_${Date.now()}_${this._proposals.length + 1}`;
    const proposal = {
      id,
      workerId,
      worker_name: workerName,
      batchId: assignment?.batchId || null,
      objective: assignment?.objective || '',
      created_at: new Date().toISOString(),
      status: 'submitted',
      artifacts: [],
      reviews: [],
      stage_history: [
        { stage: 'submitted', timestamp: new Date().toISOString() }
      ]
    };
    this._proposals.push(proposal);
    return proposal;
  }

  addArtifact(proposalId, artifact) {
    const proposal = this._get(proposalId);
    if (!proposal) return false;

    const validated = this._validateArtifact(artifact);
    if (!validated.valid) return false;

    artifact.id = `art_${Date.now()}_${proposal.artifacts.length}`;
    artifact.added_at = new Date().toISOString();
    proposal.artifacts.push(artifact);

    if (artifact.files_affected && artifact.files_affected.length > 0) {
      proposal.files_affected = [
        ...new Set([...(proposal.files_affected || []), ...artifact.files_affected])
      ];
    }

    this._save(proposal);
    return true;
  }

  _validateArtifact(artifact) {
    const required = ['type', 'content'];
    const missing = required.filter(r => !artifact[r]);
    if (missing.length > 0) {
      return { valid: false, reason: `Missing required fields: ${missing.join(', ')}` };
    }

    const validTypes = ['audit_report', 'refactor_patch', 'excavation_report', 'graph_audit',
      'replay_proof', 'test_suite', 'documentation', 'analysis_report',
      'classification_report', 'certificate'];

    if (!validTypes.includes(artifact.type)) {
      return { valid: false, reason: `Invalid type: ${artifact.type}. Must be one of: ${validTypes.join(', ')}` };
    }

    return { valid: true };
  }

  advanceStage(proposalId, newStage) {
    const proposal = this._get(proposalId);
    if (!proposal) return false;

    const validStages = ['submitted', 'artifact_complete', 'replay_verified',
      'merge_gate', 'constitutional_review', 'merged', 'rejected', 'archived'];

    if (!validStages.includes(newStage)) return false;

    const stageOrder = validStages;
    const currentIdx = stageOrder.indexOf(proposal.status);
    const newIdx = stageOrder.indexOf(newStage);
    if (newIdx < currentIdx) return false;

    proposal.status = newStage;
    proposal.stage_history.push({
      stage: newStage,
      timestamp: new Date().toISOString()
    });
    this._save(proposal);
    return true;
  }

  addReview(proposalId, reviewer, decision, notes) {
    const proposal = this._get(proposalId);
    if (!proposal) return false;

    const review = {
      reviewer,
      decision,
      notes: notes || '',
      timestamp: new Date().toISOString()
    };
    proposal.reviews.push(review);
    this._save(proposal);
    return true;
  }

  buildArtifactFeed(proposalId, graph) {
    const proposal = this._get(proposalId);
    if (!proposal) return null;

    const files = proposal.files_affected || [];
    const fileNodes = files.map(f => graph.getNode(f)).filter(Boolean);
    const production = graph.getProductionNodes();
    const authorities = graph.getAuthorities();

    const repoSlice = {
      total_production: production.length,
      total_dormant: graph.getDormantNodes().length,
      total_authorities: authorities.length
    };

    const authoritySlice = authorities
      .filter(a => files.some(f => a.path.includes(path.dirname(f))))
      .map(a => ({ path: a.path, name: a.name, exports: a.exports }));

    const replaySlice = fileNodes.map(n => ({
      path: n.path,
      replay_visibility: n.replay_visibility,
      witness_score: n.witness_score,
      entropy_score: n.entropy_score
    }));

    const importSlice = fileNodes.map(n => ({
      path: n.path,
      imports: n.requires,
      dependents: n.dependent_modules
    }));

    const violations = [];
    for (const node of fileNodes) {
      if (node.entropy_score > 0.3) violations.push({ path: node.path, type: 'high_entropy', score: node.entropy_score });
      if (node.witness_score < 0.3 && node.replay_visibility !== 'none') violations.push({ path: node.path, type: 'low_witness', score: node.witness_score });
    }

    return {
      proposalId,
      worker_name: proposal.worker_name,
      objective: proposal.objective,
      repository_slice: repoSlice,
      authority_slice: authoritySlice,
      replay_slice: replaySlice,
      import_slice: importSlice,
      known_violations: violations,
      canonical_laws: [
        'Truth = immutable verified event',
        'Authority flows from declared class',
        'Determinism is mandatory for all replay-visible operations',
        'No module creates its own authorities',
        'Dormant code is constitutional debt until remediated or archived'
      ]
    };
  }

  getProposalsByStatus(status) {
    return this._proposals.filter(p => p.status === status);
  }

  getProposal(id) {
    return this._get(id);
  }

  listProposals() {
    return this._proposals.map(p => ({
      id: p.id,
      worker_name: p.worker_name,
      status: p.status,
      artifacts_count: p.artifacts.length,
      files_affected: (p.files_affected || []).length,
      reviews_count: p.reviews.length,
      created_at: p.created_at,
      stage_history: p.stage_history
    }));
  }

  _get(id) {
    return this._proposals.find(p => p.id === id);
  }

  _save(proposal) {
    const filePath = path.join(PROPOSAL_DIR, `${proposal.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(proposal, null, 2));
  }
}

module.exports = { ProposalPipeline };
