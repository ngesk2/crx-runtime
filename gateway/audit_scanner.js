/**
 * Audit Scanner
 * 
 * Ω.49 — Audit Scanner
 * 
 * Filesystem traversal for constitutional audits.
 * 
 * Separates filesystem scanning logic from audit rule evaluation and reporting.
 * This scanner only handles file discovery and content reading.
 */

const fs = require('fs').promises;
const path = require('path');

class AuditScanner {
  constructor(gatewayPath) {
    this._gatewayPath = gatewayPath;
  }

  /**
   * Scan all JavaScript files in gateway directory
   * @returns {Array} Array of file information
   */
  async scanJavaScriptFiles() {
    const files = [];
    const entries = await fs.readdir(this._gatewayPath);

    for (const entry of entries) {
      if (entry.endsWith('.js')) {
        const filePath = path.join(this._gatewayPath, entry);
        const content = await fs.readFile(filePath, 'utf-8');
        files.push({
          name: entry,
          path: filePath,
          content: content,
        });
      }
    }

    return files;
  }

  /**
   * Scan for files matching pattern
   * @param {string} pattern - File pattern (e.g., '*.js')
   * @returns {Array} Array of file information
   */
  async scanFiles(pattern = '*.js') {
    const files = [];
    const entries = await fs.readdir(this._gatewayPath);

    for (const entry of entries) {
      if (entry.endsWith(pattern.replace('*', ''))) {
        const filePath = path.join(this._gatewayPath, entry);
        const content = await fs.readFile(filePath, 'utf-8');
        files.push({
          name: entry,
          path: filePath,
          content: content,
        });
      }
    }

    return files;
  }

  /**
   * Read file content
   * @param {string} filePath - File path
   * @returns {string|null} File content or null
   */
  async readFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if file exists
   * @param {string} filePath - File path
   * @returns {boolean} File exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scan directory recursively
   * @param {string} dirPath - Directory path
   * @param {string} pattern - File pattern
   * @returns {Array} Array of file information
   */
  async scanRecursive(dirPath, pattern = '*.js') {
    const files = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await this.scanRecursive(fullPath, pattern);
        files.push(...subFiles);
      } else if (entry.name.endsWith(pattern.replace('*', ''))) {
        const content = await fs.readFile(fullPath, 'utf-8');
        files.push({
          name: entry.name,
          path: fullPath,
          content: content,
        });
      }
    }

    return files;
  }

  /**
   * Search for pattern in files
   * @param {string} pattern - Search pattern (regex string)
   * @param {string} filePattern - File pattern to search
   * @returns {Array} Array of matches
   */
  async searchPattern(pattern, filePattern = '*.js') {
    const files = await this.scanFiles(filePattern);
    const matches = [];

    for (const file of files) {
      const regex = new RegExp(pattern, 'gi');
      let match;
      while ((match = regex.exec(file.content)) !== null) {
        matches.push({
          file: file.name,
          path: file.path,
          match: match[0],
          index: match.index,
        });
      }
    }

    return matches;
  }

  /**
   * Get gateway path
   * @returns {string} Gateway path
   */
  getGatewayPath() {
    return this._gatewayPath;
  }
}

module.exports = { AuditScanner };
