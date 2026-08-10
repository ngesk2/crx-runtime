/**
 * Metadata Extractor
 * 
 * Phase 3.4 — Metadata Extraction
 * 
 * Automatic metadata extraction from documents.
 * 
 * Extract:
 * - filename
 * - extension
 * - language
 * - title
 * - heading hierarchy
 * - tags
 * - file size
 * - hash
 * - created
 * - modified
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

class MetadataExtractor {
  constructor(config = {}) {
    this._defaultLanguage = config.defaultLanguage || 'en';
  }

  /**
   * Extract metadata from file
   */
  extract(filePath) {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath);
    const language = this._detectLanguage(ext);
    
    const metadata = {
      filename: filename,
      extension: ext,
      language: language,
      file_size: stats.size,
      created_at: Math.floor(stats.birthtimeMs / 1000),
      modified_at: Math.floor(stats.mtimeMs / 1000),
      accessed_at: Math.floor(stats.atimeMs / 1000),
      is_file: stats.isFile(),
      is_directory: stats.isDirectory(),
      sha256: this._computeHash(filePath)
    };

    // Extract content-specific metadata
    if (stats.isFile() && this._isTextFile(ext)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract title
      metadata.title = this._extractTitle(content, ext);
      
      // Extract headings (for markdown)
      if (['.md', '.markdown'].includes(ext)) {
        metadata.headings = this._extractHeadings(content);
      }
      
      // Extract tags
      metadata.tags = this._extractTags(content, ext);
      
      // Extract language-specific metadata
      if (['.js', '.ts', '.py', '.java', '.go', '.rs'].includes(ext)) {
        metadata.code_metadata = this._extractCodeMetadata(content, ext);
      }
    }

    return metadata;
  }

  /**
   * Compute SHA256 hash
   */
  _computeHash(filePath) {
    const buffer = fs.readFileSync(filePath);
    // Phase 36F: Use CanonicalAuthority for hash computation
    return CanonicalAuthority.hash(buffer);
  }

  /**
   * Detect language from extension
   */
  _detectLanguage(ext) {
    const languageMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.h': 'c',
      '.go': 'go',
      '.rs': 'rust',
      '.rb': 'ruby',
      '.php': 'php',
      '.sql': 'sql',
      '.sh': 'bash',
      '.bash': 'bash',
      '.zsh': 'zsh',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.xml': 'xml',
      '.json': 'json',
      '.md': 'markdown',
      '.markdown': 'markdown',
      '.html': 'html',
      '.css': 'css',
      '.txt': 'text'
    };

    return languageMap[ext] || this._defaultLanguage;
  }

  /**
   * Check if file is text file
   */
  _isTextFile(ext) {
    const textExtensions = [
      '.txt', '.md', '.markdown', '.json', '.js', '.ts', '.py',
      '.html', '.css', '.java', '.c', '.cpp', '.h', '.go', '.rs',
      '.rb', '.php', '.sql', '.sh', '.bash', '.zsh', '.yaml', '.yml',
      '.xml', '.yaml'
    ];
    return textExtensions.includes(ext);
  }

  /**
   * Extract title from content
   */
  _extractTitle(content, ext) {
    // For markdown, look for first heading
    if (['.md', '.markdown'].includes(ext)) {
      const headingMatch = content.match(/^#\s+(.+)$/m);
      if (headingMatch) {
        return headingMatch[1].trim();
      }
    }

    // For code, look for first comment or docstring
    if (['.js', '.ts', '.py', '.java', '.go', '.rs'].includes(ext)) {
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // Single-line comment
        if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
          const title = trimmed.replace(/^\/\/\s*|^#\s*/, '').trim();
          if (title.length > 0 && title.length < 100) {
            return title;
          }
        }
        // Multi-line comment start
        if (trimmed.startsWith('/*') || trimmed.startsWith('"""')) {
          break;
        }
      }
    }

    // Default: first line (truncated)
    const firstLine = content.split('\n')[0].trim();
    if (firstLine.length > 0 && firstLine.length < 100) {
      return firstLine;
    }

    return null;
  }

  /**
   * Extract headings from markdown
   */
  _extractHeadings(content) {
    const headings = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim()
        });
      }
    }

    return headings;
  }

  /**
   * Extract tags from content
   */
  _extractTags(content, ext) {
    const tags = new Set();

    // For markdown, look for #tags
    if (['.md', '.markdown'].includes(ext)) {
      const tagMatches = content.match(/#(\w+)/g);
      if (tagMatches) {
        tagMatches.forEach(tag => tags.add(tag.replace('#', '')));
      }
    }

    // For code, look for TODO/FIXME/HACK comments
    if (['.js', '.ts', '.py', '.java', '.go', '.rs'].includes(ext)) {
      const todoMatches = content.match(/(TODO|FIXME|HACK|NOTE|XXX):?\s*(.+)/gi);
      if (todoMatches) {
        todoMatches.forEach(match => {
          const tag = match.split(':')[0].trim().toLowerCase();
          tags.add(tag);
        });
      }
    }

    // Extract keywords from title/first paragraph
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const commonWords = new Set(['this', 'that', 'with', 'from', 'have', 'will', 'been', 'were', 'they', 'their', 'what', 'when', 'where', 'which', 'while', 'would', 'could', 'should']);
    
    const wordCounts = {};
    words.forEach(word => {
      if (!commonWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });

    // Add top 5 frequent words as tags
    const sortedWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
    
    sortedWords.forEach(word => tags.add(word));

    return Array.from(tags);
  }

  /**
   * Extract code-specific metadata
   */
  _extractCodeMetadata(content, ext) {
    const metadata = {
      functions: [],
      classes: [],
      imports: [],
      exports: []
    };

    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Extract imports
      if (trimmed.startsWith('import ') || trimmed.startsWith('require(')) {
        const importMatch = trimmed.match(/import\s+.*from\s+['"]([^'"]+)['"]/) ||
                          trimmed.match(/require\(['"]([^'"]+)['"]\)/);
        if (importMatch) {
          metadata.imports.push(importMatch[1]);
        }
      }

      // Extract exports
      if (trimmed.startsWith('export ') || trimmed.includes('module.exports')) {
        metadata.exports.push(trimmed);
      }

      // Extract functions
      const functionMatch = trimmed.match(/(?:function|def|func|method)\s+(\w+)/);
      if (functionMatch) {
        metadata.functions.push(functionMatch[1]);
      }

      // Extract classes
      const classMatch = trimmed.match(/class\s+(\w+)/);
      if (classMatch) {
        metadata.classes.push(classMatch[1]);
      }
    }

    return metadata;
  }
}

module.exports = { MetadataExtractor };
