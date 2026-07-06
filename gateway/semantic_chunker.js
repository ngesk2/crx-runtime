/**
 * Semantic Chunker
 * 
 * Phase 3.3 — Proper Chunking
 * 
 * Semantic chunking instead of whitespace splitting.
 * 
 * Rules:
 * - Respect paragraphs
 * - Respect markdown headings
 * - Respect code blocks
 * - Respect JSON boundaries
 * - Respect function boundaries
 * - Preserve overlap
 * - Avoid splitting inside code
 * - Configurable max tokens
 */

const path = require('path');

class SemanticChunker {
  constructor(config = {}) {
    this._maxTokens = config.maxTokens || 500;
    this._overlap = config.overlap || 50;
    this._minChunkSize = config.minChunkSize || 50;
  }

  /**
   * Chunk content based on file type
   */
  chunk(filePath, content) {
    const ext = path.extname(filePath).toLowerCase();

    // Markdown files
    if (['.md', '.markdown'].includes(ext)) {
      return this._chunkMarkdown(content);
    }

    // Code files
    if (['.js', '.ts', '.py', '.java', '.c', '.cpp', '.go', '.rs', '.rb', '.php'].includes(ext)) {
      return this._chunkCode(content, ext);
    }

    // JSON files
    if (['.json'].includes(ext)) {
      return this._chunkJSON(content);
    }

    // Default: paragraph-based chunking
    return this._chunkParagraphs(content);
  }

  /**
   * Chunk markdown by headings
   */
  _chunkMarkdown(content) {
    const chunks = [];
    const lines = content.split('\n');
    
    let currentChunk = [];
    let currentHeading = null;
    let currentLevel = 0;

    for (const line of lines) {
      // Check for heading
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headingMatch) {
        const level = headingMatch[1].length;
        const heading = headingMatch[2];

        // If we have content and it's a top-level heading (or same level), save chunk
        if (currentChunk.length > 0 && (level <= currentLevel || currentLevel === 0)) {
          const chunkText = currentChunk.join('\n');
          if (chunkText.trim().length >= this._minChunkSize) {
            chunks.push({
              text: chunkText,
              type: 'markdown',
              heading: currentHeading,
              level: currentLevel
            });
          }
          currentChunk = [];
        }

        currentHeading = heading;
        currentLevel = level;
        currentChunk.push(line);
      } else if (line.trim() === '') {
        // Empty line - preserve for paragraph separation
        currentChunk.push(line);
      } else {
        currentChunk.push(line);
      }

      // Check if chunk is too large
      if (this._estimateTokens(currentChunk.join('\n')) > this._maxTokens) {
        const chunkText = currentChunk.join('\n');
        chunks.push({
          text: chunkText,
          type: 'markdown',
          heading: currentHeading,
          level: currentLevel
        });
        currentChunk = [];
      }
    }

    // Add remaining content
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join('\n');
      if (chunkText.trim().length >= this._minChunkSize) {
        chunks.push({
          text: chunkText,
          type: 'markdown',
          heading: currentHeading,
          level: currentLevel
        });
      }
    }

    return this._addOverlap(chunks);
  }

  /**
   * Chunk code by functions/classes
   */
  _chunkCode(content, ext) {
    const chunks = [];
    const lines = content.split('\n');
    
    let currentChunk = [];
    let currentFunction = null;
    let braceCount = 0;
    let inFunction = false;

    for (const line of lines) {
      currentChunk.push(line);

      // Detect function/class definition
      const functionMatch = line.match(/(function|class|def|func|method)\s+(\w+)/);
      if (functionMatch && braceCount === 0) {
        currentFunction = functionMatch[2];
        inFunction = true;
      }

      // Count braces for code blocks
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      // End of function/class
      if (inFunction && braceCount === 0 && currentFunction) {
        const chunkText = currentChunk.join('\n');
        if (chunkText.trim().length >= this._minChunkSize) {
          chunks.push({
            text: chunkText,
            type: 'code',
            function: currentFunction,
            language: ext.replace('.', '')
          });
        }
        currentChunk = [];
        currentFunction = null;
        inFunction = false;
      }

      // Check if chunk is too large (outside function)
      if (!inFunction && this._estimateTokens(currentChunk.join('\n')) > this._maxTokens) {
        const chunkText = currentChunk.join('\n');
        chunks.push({
          text: chunkText,
          type: 'code',
          language: ext.replace('.', '')
        });
        currentChunk = [];
      }
    }

    // Add remaining content
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join('\n');
      if (chunkText.trim().length >= this._minChunkSize) {
        chunks.push({
          text: chunkText,
          type: 'code',
          function: currentFunction,
          language: ext.replace('.', '')
        });
      }
    }

    return this._addOverlap(chunks);
  }

  /**
   * Chunk JSON by keys
   */
  _chunkJSON(content) {
    const chunks = [];
    
    try {
      const obj = JSON.parse(content);
      const keys = Object.keys(obj);
      
      // Group keys into chunks
      let currentKeys = [];
      let currentObj = {};

      for (const key of keys) {
        currentKeys.push(key);
        currentObj[key] = obj[key];

        const estimatedSize = JSON.stringify(currentObj).length;
        if (estimatedSize > this._maxTokens * 4) { // Rough token estimate
          chunks.push({
            text: JSON.stringify(currentObj, null, 2),
            type: 'json',
            keys: currentKeys
          });
          currentKeys = [];
          currentObj = {};
        }
      }

      // Add remaining
      if (currentKeys.length > 0) {
        chunks.push({
          text: JSON.stringify(currentObj, null, 2),
          type: 'json',
          keys: currentKeys
        });
      }
    } catch (error) {
      // If JSON parsing fails, fall back to paragraph chunking
      return this._chunkParagraphs(content);
    }

    return this._addOverlap(chunks);
  }

  /**
   * Chunk by paragraphs
   */
  _chunkParagraphs(content) {
    const chunks = [];
    const paragraphs = content.split(/\n\s*\n/);
    
    let currentChunk = [];

    for (const paragraph of paragraphs) {
      if (paragraph.trim().length === 0) continue;

      currentChunk.push(paragraph);

      const chunkText = currentChunk.join('\n\n');
      if (this._estimateTokens(chunkText) > this._maxTokens) {
        chunks.push({
          text: chunkText,
          type: 'text'
        });
        currentChunk = [];
      }
    }

    // Add remaining
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join('\n\n');
      if (chunkText.trim().length >= this._minChunkSize) {
        chunks.push({
          text: chunkText,
          type: 'text'
        });
      }
    }

    return this._addOverlap(chunks);
  }

  /**
   * Add overlap between chunks
   */
  _addOverlap(chunks) {
    if (chunks.length <= 1) return chunks;

    const overlappedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      let text = chunks[i].text;

      // Add overlap from previous chunk
      if (i > 0) {
        const prevText = chunks[i - 1].text;
        const overlapText = prevText.slice(-this._overlap * 4); // Rough char estimate
        text = overlapText + '\n\n' + text;
      }

      overlappedChunks.push({
        ...chunks[i],
        text: text
      });
    }

    return overlappedChunks;
  }

  /**
   * Estimate token count (rough approximation)
   */
  _estimateTokens(text) {
    // Rough approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

module.exports = { SemanticChunker };
