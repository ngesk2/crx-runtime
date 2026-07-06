/**
 * GitHub DTO
 *
 * Phase 3.2.3 — Constitutional OSS Continuation
 *
 * GitHub-specific Data Transfer Object.
 *
 * Moved from schema_compiler.js to adapters/github/.
 * Compiler should never import GitHub-specific code.
 */

const { SourceDTO } = require('../../schema_compiler');

class GitHubDTO extends SourceDTO {
  constructor(rawData) {
    super('github', rawData);
  }

  validate() {
    if (!this.rawData) throw new Error('Raw data required');
    return true;
  }

  toCanonicalIR() {
    return {
      source: 'github',
      source_id: this.rawData.id || this.rawData.sha || this.rawData.full_name,
      source_type: this._determineType(),
      content: this._extractContent(),
      metadata: this._extractMetadata(),
      relationships: this._extractRelationships(),
      timestamp: this.rawData.created_at || this.rawData.updated_at || new Date().toISOString(),
    };
  }

  _determineType() {
    if (this.rawData.full_name) return 'repository';
    if (this.rawData.sha && this.rawData.commit) return 'commit';
    if (this.rawData.name && this.rawData.commit) return 'branch';
    if (this.rawData.number && this.rawData.pull_request) return 'pull_request';
    if (this.rawData.number && !this.rawData.pull_request) return 'issue';
    if (this.rawData.tag_name) return 'release';
    if (this.rawData.name && !this.rawData.commit) return 'tag';
    if (this.rawData.login) return 'contributor';
    return 'unknown';
  }

  _extractContent() {
    const type = this._determineType();
    switch (type) {
      case 'repository':
        return {
          name: this.rawData.name,
          description: this.rawData.description,
          language: this.rawData.language,
          url: this.rawData.html_url,
        };
      case 'commit':
        return {
          sha: this.rawData.sha,
          message: this.rawData.commit?.message,
          author: this.rawData.commit?.author?.name,
        };
      case 'branch':
        return {
          name: this.rawData.name,
          commit: this.rawData.commit?.sha,
        };
      case 'pull_request':
      case 'issue':
        return {
          number: this.rawData.number,
          title: this.rawData.title,
          state: this.rawData.state,
        };
      case 'release':
        return {
          tag_name: this.rawData.tag_name,
          name: this.rawData.name,
        };
      default:
        return {};
    }
  }

  _extractMetadata() {
    return {
      id: this.rawData.id,
      created_at: this.rawData.created_at,
      updated_at: this.rawData.updated_at,
    };
  }

  _extractRelationships() {
    const relationships = [];
    if (this.rawData.owner) {
      relationships.push({ type: 'owned_by', target: this.rawData.owner.login });
    }
    if (this.rawData.repository) {
      relationships.push({ type: 'in_repository', target: this.rawData.repository.full_name });
    }
    return relationships;
  }
}

module.exports = { GitHubDTO };
