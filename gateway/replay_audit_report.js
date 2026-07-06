/**
 * Replay Audit Report
 * 
 * Ω.49 — Replay Audit Report
 * 
 * Reporting, scoring, and printing for constitutional audits.
 * 
 * Separates reporting logic from audit execution and classification.
 * This report handles summary generation, scoring, and console output.
 */

class ReplayAuditReport {
  constructor() {
    this._reportVersion = '1.0.0';
  }

  /**
   * Generate audit summary
   * @param {Object} auditData - Audit data
   * @returns {Object} Summary object
   */
  generateSummary(auditData) {
    const { violations, warnings, passes, classified } = auditData;
    
    return {
      total_phases: 9,
      violations: violations.length,
      warnings: warnings.length,
      passes: passes.length,
      replay_completeness_score: this._computeReplayCompletenessScore(auditData),
      // Classified counts
      classified: {
        replay: classified.replay.length,
        infrastructure: classified.infrastructure.length,
        compiler: classified.compiler.length,
        authority: classified.authority.length,
        documentation: classified.documentation.length,
      },
    };
  }

  /**
   * Compute replay completeness score
   * @param {Object} auditData - Audit data
   * @returns {number} Score (0-10)
   */
  _computeReplayCompletenessScore(auditData) {
    const { violations, warnings, passes } = auditData;
    const totalChecks = violations.length + warnings.length + passes.length;
    if (totalChecks === 0) return 10;

    const weightedViolations = violations.length * 10;
    const weightedWarnings = warnings.length * 3;
    const weightedTotal = weightedViolations + weightedWarnings;
    const maxWeighted = totalChecks * 10;

    const score = Math.max(0, 10 - (weightedTotal / maxWeighted) * 10);
    return Math.round(score * 10) / 10;
  }

  /**
   * Print audit results to console
   * @param {Object} results - Audit results
   */
  printResults(results) {
    console.log('\n=== Replay Kernel Audit Results ===');
    console.log(`Total Phases: ${results.summary.total_phases}`);
    console.log(`Violations: ${results.summary.violations}`);
    console.log(`Warnings: ${results.summary.warnings}`);
    console.log(`Passes: ${results.summary.passes}`);
    console.log(`Replay Completeness Score: ${results.summary.replay_completeness_score}/10`);

    if (results.summary.classified) {
      console.log('\n=== Classified Violations ===');
      console.log(`Replay (Critical): ${results.summary.classified.replay}`);
      console.log(`Infrastructure (Acceptable): ${results.summary.classified.infrastructure}`);
      console.log(`Compiler: ${results.summary.classified.compiler}`);
      console.log(`Authority: ${results.summary.classified.authority}`);
      console.log(`Documentation: ${results.summary.classified.documentation}`);
    }

    if (results.violations.length > 0) {
      console.log('\n=== Violations ===');
      for (const violation of results.violations) {
        console.log(`[${violation.phase}] ${violation.type}: ${violation.message}`);
        console.log(`  File: ${violation.file}${violation.line ? `:${violation.line}` : ''}`);
        console.log(`  Severity: ${violation.severity}`);
      }
    }

    if (results.warnings.length > 0) {
      console.log('\n=== Warnings ===');
      for (const warning of results.warnings) {
        console.log(`[${warning.phase}] ${warning.type}: ${warning.message}`);
        console.log(`  File: ${warning.file}${warning.line ? `:${warning.line}` : ''}`);
        console.log(`  Severity: ${warning.severity}`);
      }
    }

    if (results.hidden_state.length > 0) {
      console.log('\n=== Hidden State ===');
      for (const state of results.hidden_state) {
        console.log(`[${state.file}:${state.line}] ${state.type}: ${state.message}`);
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Audit ${results.summary.classified.replay === 0 ? 'PASSED' : 'FAILED'}`);
    console.log(`Critical Replay Violations: ${results.summary.classified.replay}`);
  }

  /**
   * Generate JSON report
   * @param {Object} results - Audit results
   * @returns {string} JSON string
   */
  generateJsonReport(results) {
    return JSON.stringify(results, null, 2);
  }

  /**
   * Generate markdown report
   * @param {Object} results - Audit results
   * @returns {string} Markdown string
   */
  generateMarkdownReport(results) {
    let md = '# Replay Kernel Audit Report\n\n';
    md += `## Summary\n\n`;
    md += `- Total Phases: ${results.summary.total_phases}\n`;
    md += `- Violations: ${results.summary.violations}\n`;
    md += `- Warnings: ${results.summary.warnings}\n`;
    md += `- Passes: ${results.summary.passes}\n`;
    md += `- Replay Completeness Score: ${results.summary.replay_completeness_score}/10\n\n`;

    if (results.summary.classified) {
      md += `## Classified Violations\n\n`;
      md += `- **Replay (Critical):** ${results.summary.classified.replay}\n`;
      md += `- **Infrastructure (Acceptable):** ${results.summary.classified.infrastructure}\n`;
      md += `- **Compiler:** ${results.summary.classified.compiler}\n`;
      md += `- **Authority:** ${results.summary.classified.authority}\n`;
      md += `- **Documentation:** ${results.summary.classified.documentation}\n\n`;
    }

    if (results.violations.length > 0) {
      md += `## Violations\n\n`;
      for (const violation of results.violations) {
        md += `### [${violation.phase}] ${violation.type}\n`;
        md += `- **File:** ${violation.file}${violation.line ? `:${violation.line}` : ''}\n`;
        md += `- **Message:** ${violation.message}\n`;
        md += `- **Severity:** ${violation.severity}\n\n`;
      }
    }

    md += `## Conclusion\n\n`;
    md += `Audit ${results.summary.classified.replay === 0 ? 'PASSED' : 'FAILED'}\n`;
    md += `Critical Replay Violations: ${results.summary.classified.replay}\n`;

    return md;
  }

  /**
   * Get report version
   * @returns {string} Report version
   */
  getReportVersion() {
    return this._reportVersion;
  }

  /**
   * Check if audit passes
   * @param {Object} results - Audit results
   * @returns {boolean} Audit passes
   */
  auditPasses(results) {
    return results.summary.classified.replay === 0;
  }
}

// Singleton instance
const replayAuditReport = new ReplayAuditReport();

module.exports = { ReplayAuditReport, replayAuditReport };
