/**
 * Tree-sitter Chunker
 * 
 * Phase 3 Refactor — Tree-sitter Chunking
 * 
 * Replace regex/paragraph chunking with tree-sitter.
 * 
 * Required dependencies:
 * - tree-sitter
 * - tree-sitter-javascript
 * - tree-sitter-typescript
 * - tree-sitter-python
 * - tree-sitter-rust
 * - tree-sitter-go
 * - tree-sitter-java
 * 
 * Chunk by:
 * - class
 * - function
 * - method
 * - interface
 * - enum
 * - namespace
 * - module
 * 
 * Never split inside:
 * - function body
 * - class body
 * - JSON object
 * - markdown code fence
 * 
 * Fallback: paragraph chunking for unsupported file types.
 * 
 * Keep current SemanticChunker API.
 */

const path = require('path');

class TreeSitterChunker {
  constructor(config = {}) {
    this._maxTokens = config.maxTokens || 500;
    this._overlap = config.overlap || 50;
    this._minChunkSize = config.minChunkSize || 50;
    
    // Lazy load tree-sitter parsers
    this._parsers = new Map();
    this._treeSitter = null;
  }

  /**
   * Initialize tree-sitter
   */
  async _initializeTreeSitter() {
    if (this._treeSitter) return;

    try {
      this._treeSitter = require('tree-sitter');
      console.log('[TreeSitterChunker] Tree-sitter loaded');
    } catch (error) {
      console.warn('[TreeSitterChunker] Tree-sitter not available, falling back to basic chunking');
      this._treeSitter = null;
    }
  }

  /**
   * Get parser for language
   */
  _getParser(ext) {
    if (!this._treeSitter) return null;

    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.rs': 'rust',
      '.go': 'go',
      '.java': 'java'
    };

    const language = languageMap[ext];
    if (!language) return null;

    // Return cached parser or load new one
    if (this._parsers.has(language)) {
      return this._parsers.get(language);
    }

    try {
      const Parser = require(`tree-sitter-${language}`);
      const parser = new Parser();
      this._parsers.set(language, parser);
      return parser;
    } catch (error) {
      console.warn(`[TreeSitterChunker] Parser for ${language} not available`);
      return null;
    }
  }

  /**
   * Chunk content based on file type
   */
  chunk(filePath, content) {
    const ext = path.extname(filePath).toLowerCase();

    // Try tree-sitter for supported languages
    const parser = this._getParser(ext);
    if (parser) {
      return this._chunkWithTreeSitter(content, parser, ext);
    }

    // Fallback to semantic chunking
    const { SemanticChunker } = require('./semantic_chunker');
    const chunker = new SemanticChunker({
      maxTokens: this._maxTokens,
      overlap: this._overlap,
      minChunkSize: this._minChunkSize
    });
    return chunker.chunk(filePath, content);
  }

  /**
   * Chunk using tree-sitter
   */
  _chunkWithTreeSitter(content, parser, ext) {
    const tree = parser.parse(content);
    const chunks = [];

    // Get root node
    const rootNode = tree.rootNode;

    // Find top-level declarations
    const declarations = this._findDeclarations(rootNode);

    for (const decl of declarations) {
      const chunkText = content.slice(decl.startIndex, decl.endIndex);
      
      if (chunkText.length >= this._minChunkSize) {
        chunks.push({
          text: chunkText,
          type: 'code',
          language: ext.replace('.', ''),
          declaration_type: decl.type,
          name: decl.name
        });
      }
    }

    // If no chunks found, fall back to paragraph chunking
    if (chunks.length === 0) {
      return this._chunkParagraphs(content);
    }

    return this._addOverlap(chunks);
  }

  /**
   * Find declarations in AST
   */
  _findDeclarations(node) {
    const declarations = [];

    // Node types to chunk by
    const declarationTypes = [
      'class_declaration',
      'function_declaration',
      'function_definition',
      'method_definition',
      'interface_declaration',
      'enum_declaration',
      'namespace_declaration',
      'module_declaration',
      'class_definition',
      'async_function_definition',
      'generator_function_definition'
    ];

    if (declarationTypes.includes(node.type)) {
      declarations.push({
        type: node.type,
        name: this._extractName(node),
        startIndex: node.startIndex,
        endIndex: node.endIndex
      });
    }

    // Recursively check children
    for (const child of node.children) {
      declarations.push(...this._findDeclarations(child));
    }

    return declarations;
  }

  /**
   * Extract name from node
   */
  _extractName(node) {
    // Try to find name field
    for (const child of node.children) {
      if (child.type === 'identifier' || child.type === 'property_identifier') {
        return child.text;
      }
    }
    return 'unnamed';
  }

  /**
   * Chunk by paragraphs (fallback)
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

    return chunks;
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
        const overlapText = prevText.slice(-this._overlap * 4);
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
   * Estimate token count
   */
  _estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }
}

module.exports = { TreeSitterChunker };
