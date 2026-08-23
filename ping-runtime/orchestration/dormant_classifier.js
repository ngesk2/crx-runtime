const fs = require('fs');
const path = require('path');

const CLASSIFICATION_DIR = path.join(__dirname, 'dormant_classifications');

class DormantClassifier {
  constructor(graph) {
    this._graph = graph;
    this._classifications = {};
    if (!fs.existsSync(CLASSIFICATION_DIR)) {
      fs.mkdirSync(CLASSIFICATION_DIR, { recursive: true });
    }
    this._load();
  }

  _load() {
    if (!fs.existsSync(CLASSIFICATION_DIR)) return;
    const files = fs.readdirSync(CLASSIFICATION_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(CLASSIFICATION_DIR, file), 'utf8'));
        this._classifications[data.path] = data;
      } catch (e) { }
    }
  }

  classifyAll() {
    const dormant = this._graph.getDormantNodes();
    for (const node of dormant) {
      if (!this._classifications[node.path]) {
        this._classifyOne(node);
      }
    }
    this._saveAll();
    return this.getSummary();
  }

  _classifyOne(node) {
    const authScore = node.path.includes('authority') || node.path.includes('runtime') ? 0.8 :
      node.path.includes('adapter') || node.path.includes('worker') ? 0.5 : 0.2;

    const replayScore = node.replay_visibility === 'full' ? 0.9 :
      node.replay_visibility === 'event' ? 0.6 :
      node.replay_visibility === 'witness' ? 0.3 : 0.1;

    const depScore = Math.min(1, (node.dependent_modules.length || 0) / 5);

    const deletionConfidence = Math.round((1 - authScore) * (1 - replayScore) * (1 - depScore) * 100);

    const migrationCandidate = authScore > 0.5 && node.classification === 'dormant';
    const resurrectionCandidate = (node.git_churn > 0 || depScore > 0.3) && node.classification === 'dormant';

    const recommendation = deletionConfidence > 80 ? 'safe_delete' :
      migrationCandidate ? 'migrate' :
      resurrectionCandidate ? 'keep_dormant' :
      'needs_review';

    this._classifications[node.path] = {
      path: node.path,
      lines: node.lines,
      authority_score: Math.round(authScore * 100),
      replay_score: Math.round(replayScore * 100),
      dependency_score: Math.round(depScore * 100),
      deletion_confidence: deletionConfidence,
      migration_candidate: migrationCandidate,
      resurrection_candidate: resurrectionCandidate,
      dependent_modules: node.dependent_modules.length,
      git_commits: node.git_commits,
      git_churn: node.git_churn,
      entropy_score: Math.round(node.entropy_score * 100),
      recommendation,
      classified_at: new Date().toISOString()
    };
  }

  getClassification(path) {
    return this._classifications[path];
  }

  getByRecommendation(recommendation) {
    return Object.values(this._classifications).filter(c => c.recommendation === recommendation);
  }

  getSummary() {
    const all = Object.values(this._classifications);

    const byRec = {};
    for (const c of all) {
      if (!byRec[c.recommendation]) byRec[c.recommendation] = [];
      byRec[c.recommendation].push(c);
    }

    return {
      total_classified: all.length,
      total_lines: all.reduce((s, c) => s + c.lines, 0),
      by_recommendation: Object.fromEntries(
        Object.entries(byRec).map(([k, v]) => [k, { count: v.length, lines: v.reduce((s, c) => s + c.lines, 0) }])
      ),
      high_confidence_deletions: all.filter(c => c.deletion_confidence > 80).length,
      migration_candidates: all.filter(c => c.migration_candidate).length,
      resurrection_candidates: all.filter(c => c.resurrection_candidate).length,
      needs_review: all.filter(c => c.recommendation === 'needs_review').length
    };
  }

  _saveAll() {
    for (const [filePath, classification] of Object.entries(this._classifications)) {
      const safeName = filePath.replace(/[\/\\]/g, '_').replace(/\.js$/, '') + '.json';
      fs.writeFileSync(
        path.join(CLASSIFICATION_DIR, safeName),
        JSON.stringify(classification, null, 2)
      );
    }
    const summaryPath = path.join(CLASSIFICATION_DIR, '_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(this.getSummary(), null, 2));
  }
}

class ReplayCertifier {
  constructor(graph, classifier) {
    this._graph = graph;
    this._classifier = classifier;
    this._certificates = {};
  }

  certifyAll() {
    const production = this._graph.getProductionNodes();
    for (const node of production) {
      this._certifyOne(node);
    }
    return this.getSummary();
  }

  _certifyOne(node) {
    const content = node.content || '';
    const lines = node.lines || 1;

    const hasReplay = node.replay_visibility !== 'none';
    const hasWitness = node.witness_score > 0.3;
    const hasAuthority = !!node.authority_owner;
    const hasImports = node.requires.length > 0;
    const hasDeterministicHash = !(/Date\.now\(\)|Math\.random\(\)/.test(content));
    const hasCleanSerialization = !(/JSON\.parse\(JSON\.stringify/.test(content));

    const passed = [hasReplay, hasWitness, hasAuthority, hasImports, hasDeterministicHash, hasCleanSerialization];
    const score = Math.round(passed.filter(Boolean).length / passed.length * 100);

    this._certificates[node.path] = {
      path: node.path,
      lines,
      classification: node.classification,
      replay_proof: {
        has_replay_visibility: hasReplay,
        replay_visibility: node.replay_visibility,
        witness_score: node.witness_score,
        entropy_score: node.entropy_score
      },
      witness_proof: {
        has_witness: hasWitness,
        witness_score: node.witness_score,
        dependent_modules: node.dependent_modules.length
      },
      authority_proof: {
        has_authority: hasAuthority,
        authority_owner: node.authority_owner || 'none'
      },
      import_proof: {
        has_imports: hasImports,
        import_count: node.requires.length
      },
      canonical_hash_proof: {
        deterministic: hasDeterministicHash,
        entropy_sources: node.entropy_score > 0.3 ? ['potential_entropy'] : []
      },
      serialization_proof: {
        clean: hasCleanSerialization,
        serialization_score: node.serialization_score
      },
      merge_proof: {
        git_commits: node.git_commits,
        git_churn: node.git_churn
      },
      certificate_score: score,
      certified_at: new Date().toISOString()
    };
  }

  getCertificate(path) {
    return this._certificates[path];
  }

  getSummary() {
    const certs = Object.values(this._certificates);

    const byScore = {};
    for (const c of certs) {
      const bucket = c.certificate_score >= 80 ? 'high' : c.certificate_score >= 50 ? 'medium' : 'low';
      if (!byScore[bucket]) byScore[bucket] = 0;
      byScore[bucket]++;
    }

    return {
      total_certified: certs.length,
      average_score: Math.round(certs.reduce((s, c) => s + c.certificate_score, 0) / certs.length),
      by_score: byScore,
      fully_certified: certs.filter(c => c.certificate_score === 100).length,
      needs_work: certs.filter(c => c.certificate_score < 50).length,
      low_witness: certs.filter(c => c.witness_proof.witness_score < 0.3).length,
      high_entropy: certs.filter(c => c.replay_proof.entropy_score > 0.3).length,
      no_authority: certs.filter(c => !c.authority_proof.has_authority).length
    };
  }
}

module.exports = { DormantClassifier, ReplayCertifier };
