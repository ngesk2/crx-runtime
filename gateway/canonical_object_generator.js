/**
 * Canonical Object Generator — Source Code Ingestion (Stage 1)
 *
 * Parses source files with tree-sitter and produces canonical
 * 'Symbol'/'File'/'Repository' objects through the shared envelope
 * (gateway/canonical_object.js).
 *
 * Constitutional constraints:
 *   - Language disappears. Identity derives only from canonical kind,
 *     name, signature, relationships. Language becomes provenance.
 *   - Every producer builds through createCanonicalObject().
 *   - AST is a disposable intermediate — only canonical objects persist.
 *
 * Run: node test_canonical_object_generator.js
 */

const path = require('path');
const { createCanonicalObject } = require('../ping-runtime/canonicalization/canonical_object');

const SUPPORTED_LANGUAGES = ['javascript', 'typescript', 'python'];

const GRAMMAR_BY_EXT = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.py': 'python',
};

const GRAMMAR_MODULE = {
  javascript: 'tree-sitter-javascript',
  typescript: 'tree-sitter-typescript',
  python: 'tree-sitter-python',
};

class CanonicalObjectGenerator {
  constructor(config = {}) {
    this._grammars = new Map();
    this._initialized = false;
    this._authority = config.authority || 'CanonicalObjectGenerator';
  }

  async initialize() {
    this._ensureInitialized();
    return { initialized: true, grammars: [...this._grammars.keys()] };
  }

  _ensureInitialized() {
    if (this._initialized) return;
    for (const language of SUPPORTED_LANGUAGES) {
      try {
        const grammarModule = require(GRAMMAR_MODULE[language]);
        const grammar = language === 'typescript' ? grammarModule.typescript : grammarModule;
        this._grammars.set(language, grammar);
      } catch (error) {
        console.warn(`[CanonicalObjectGenerator] Grammar for ${language} not available: ${error.message}`);
      }
    }
    this._initialized = true;
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return GRAMMAR_BY_EXT[ext] || null;
  }

  /**
   * Parse source and produce canonical Symbol objects.
   *
   * @param {Object} input
   * @param {string} input.filePath - Path of the file (used for lineage + language)
   * @param {string} input.content - Source content
   * @param {string} [input.language] - Optional explicit language (defaults from extension)
   * @returns {Array} Canonical Symbol objects
   */
  generateSymbols({ filePath, content, language }) {
    this._ensureInitialized();
    const lang = language || this.detectLanguage(filePath);
    if (!lang || !this._grammars.has(lang)) {
      return [];
    }
    const parser = new (require('tree-sitter'))();
    parser.setLanguage(this._grammars.get(lang));
    const tree = parser.parse(content);
    const raw = this._extractRawSymbols(tree.rootNode, lang, filePath);
    return raw.map((symbol) => this._toCanonicalSymbol(symbol, filePath, lang));
  }

  /**
   * Produce a canonical 'File' object summarizing a source file.
   */
  generateFileObject({ filePath, content, language, symbols }) {
    const lang = language || this.detectLanguage(filePath) || 'unknown';
    const lines = content.split(/\r?\n/);
    const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
    const contentHash = CanonicalAuthority.hashBytes(Buffer.from(content, 'utf8'));
    const symbolIndex = (symbols || []).map((s) => ({
      id: s.id,
      canonical_kind: s.payload.canonical_kind,
      canonical_name: s.payload.canonical_name,
      span: s.payload.span,
    }));
    return createCanonicalObject({
      kind: 'File',
      authority: this._authority,
      payload: {
        path: filePath,
        language: lang,
        size_bytes: Buffer.byteLength(content, 'utf8'),
        line_count: lines.length,
        content_hash: contentHash,
        symbol_count: (symbols || []).length,
        symbols: symbolIndex,
      },
      options: {
        source_id: filePath,
        source_kind: 'Source',
        derivation_path: ['Repository', 'File'],
        provenance_chain: [filePath],
      },
    });
  }

  /**
   * Produce a canonical 'Repository' object aggregating many files.
   */
  generateRepositoryObject({ name, url = null, defaultBranch = null, fileObjects, symbolObjects }) {
    const languageCounts = {};
    const files = [];
    for (const file of fileObjects || []) {
      const lang = file.payload.language;
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      files.push({
        id: file.id,
        path: file.payload.path,
        language: lang,
        line_count: file.payload.line_count,
        symbol_count: file.payload.symbol_count,
      });
    }
    return createCanonicalObject({
      kind: 'Repository',
      authority: this._authority,
      payload: {
        name,
        url,
        default_branch: defaultBranch,
        file_count: (fileObjects || []).length,
        symbol_count: (symbolObjects || []).length,
        language_counts: Object.fromEntries(Object.entries(languageCounts).sort()),
        files,
      },
      options: {
        source_id: name,
        source_kind: 'Repository',
        derivation_path: ['Repository'],
      },
    });
  }

  _toCanonicalSymbol(raw, filePath, language) {
    return createCanonicalObject({
      kind: 'Symbol',
      authority: this._authority,
      payload: {
        canonical_name: raw.name,
        canonical_kind: raw.canonicalKind,
        canonical_signature: raw.signature || null,
        span: raw.span,
        visibility: raw.visibility || null,
        modifiers: (raw.modifiers || []).sort(),
        parameters: raw.parameters || [],
        return_type: raw.returnType || null,
        parent: raw.parent || null,
        provenance: {
          language,
          original_kind: raw.nodeType,
          original_name: raw.originalName,
        },
      },
      options: {
        source_id: filePath,
        source_kind: 'File',
        derivation_path: ['Repository', 'File', 'Symbol'],
        provenance_chain: [filePath, raw.name],
        relationships: raw.relationships || [],
      },
    });
  }

  _extractRawSymbols(rootNode, language, filePath) {
    const out = [];
    const walk = (node, ctx) => {
      const local = this._handleNode(node, language, ctx);
      out.push(...local.decls);
      for (const child of node.namedChildren) {
        walk(child, local.nextCtx);
      }
    };
    walk(rootNode, { inClass: null, decorators: [] });
    return out;
  }

  _handleNode(node, language, ctx) {
    const type = node.type;
    const decls = [];
    let nextCtx = { ...ctx };

    if (type === 'decorated_definition') {
      const decorators = node.namedChildren.filter((c) => c.type === 'decorator').map((d) => d.text.trim());
      const def = node.childForFieldName('definition');
      if (def) {
        return this._handleNode(def, language, { ...ctx, decorators });
      }
      return { decls, nextCtx };
    }

    if (type === 'class_declaration' || type === 'class_definition') {
      const nameNode = node.childForFieldName('name');
      const name = nameNode ? nameNode.text : 'unnamed';
      const heritage = node.namedChildren.find((c) => c.type === 'class_heritage') || null;
      decls.push({
        nodeType: type,
        name,
        canonicalKind: 'Class',
        signature: heritage ? heritage.text : null,
        span: this._span(node),
        originalName: name,
        relationships: this._classRelationships(node, heritage),
        modifiers: this._classModifiers(node, ctx, language),
      });
      nextCtx = { ...ctx, inClass: name };
    } else if (type === 'function_declaration' || type === 'function_definition') {
      const inClass = ctx.inClass;
      const nameNode = node.childForFieldName('name');
      const name = nameNode ? nameNode.text : 'unnamed';
      const paramsNode = node.childForFieldName('parameters');
      const returnNode = node.childForFieldName('return_type');
      decls.push({
        nodeType: type,
        name: inClass ? `${inClass}.${name}` : name,
        canonicalKind: inClass ? 'Method' : 'Function',
        signature: this._functionSignature(paramsNode, returnNode),
        span: this._span(node),
        originalName: name,
        parent: inClass,
        parameters: this._extractParameters(paramsNode, language),
        returnType: returnNode ? this._stripAnnotation(returnNode.text) : null,
        visibility: this._visibility(node, ctx, language),
        modifiers: this._functionModifiers(node, ctx, language),
      });
    } else if (type === 'method_definition') {
      const nameNode = node.childForFieldName('name');
      const name = nameNode ? nameNode.text : 'unnamed';
      const paramsNode = node.childForFieldName('parameters');
      const returnNode = node.childForFieldName('return_type');
      const visibility = this._tsVisibility(node);
      decls.push({
        nodeType: type,
        name: ctx.inClass ? `${ctx.inClass}.${name}` : name,
        canonicalKind: 'Method',
        signature: this._functionSignature(paramsNode, returnNode),
        span: this._span(node),
        originalName: name,
        parent: ctx.inClass,
        parameters: this._extractParameters(paramsNode, language),
        returnType: returnNode ? this._stripAnnotation(returnNode.text) : null,
        visibility,
        modifiers: this._methodModifiers(node, ctx),
      });
    } else if (type === 'interface_declaration') {
      const nameNode = node.childForFieldName('name');
      const name = nameNode ? nameNode.text : 'unnamed';
      decls.push({
        nodeType: type,
        name,
        canonicalKind: 'Interface',
        signature: null,
        span: this._span(node),
        originalName: name,
        modifiers: [],
      });
    } else if (type === 'enum_declaration') {
      const nameNode = node.childForFieldName('name');
      const name = nameNode ? nameNode.text : 'unnamed';
      decls.push({
        nodeType: type,
        name,
        canonicalKind: 'Enum',
        signature: null,
        span: this._span(node),
        originalName: name,
        modifiers: [],
      });
    } else if (type === 'type_alias_declaration') {
      const nameNode = node.childForFieldName('name');
      const name = nameNode ? nameNode.text : 'unnamed';
      decls.push({
        nodeType: type,
        name,
        canonicalKind: 'TypeAlias',
        signature: null,
        span: this._span(node),
        originalName: name,
        modifiers: [],
      });
    } else if (type === 'import_statement' || type === 'import_from_statement') {
      const sourceNode = node.childForFieldName('source') || node.childForFieldName('module_name');
      const name = sourceNode ? sourceNode.text.replace(/^['"]|['"]$/g, '') : 'unknown';
      decls.push({
        nodeType: type,
        name,
        canonicalKind: 'Import',
        signature: null,
        span: this._span(node),
        originalName: name,
        modifiers: [],
      });
    } else if (type === 'lexical_declaration' || type === 'variable_declaration') {
      const keyword = this._declarationKeyword(node);
      const kind = keyword === 'const' ? 'Constant' : 'Variable';
      for (const child of node.namedChildren) {
        if (child.type === 'variable_declarator') {
          const nameNode = child.childForFieldName('name');
          const names = this._destructuredNames(nameNode);
          for (const name of names) {
            decls.push({
              nodeType: type,
              name,
              canonicalKind: kind,
              signature: null,
              span: this._span(child),
              originalName: name,
              modifiers: [],
            });
          }
        }
      }
    } else if (type === 'public_field_definition' || type === 'field_definition') {
      const nameNode = node.childForFieldName('name') || node.childForFieldName('property');
      const name = nameNode ? nameNode.text : 'unnamed';
      decls.push({
        nodeType: type,
        name: ctx.inClass ? `${ctx.inClass}.${name}` : name,
        canonicalKind: 'Property',
        signature: null,
        span: this._span(node),
        originalName: name,
        parent: ctx.inClass,
        visibility: this._tsVisibility(node) || 'public',
        modifiers: this._fieldModifiers(node),
      });
    } else if (type === 'assignment' && ctx.inClass === null && node.childForFieldName('left')) {
      const left = node.childForFieldName('left');
      if (left.type === 'identifier') {
        const name = left.text;
        decls.push({
          nodeType: type,
          name,
          canonicalKind: name === name.toUpperCase() && /^[A-Z_]+$/.test(name) ? 'Constant' : 'Variable',
          signature: null,
          span: this._span(node),
          originalName: name,
          modifiers: [],
        });
      }
    }

    return { decls, nextCtx };
  }

  _span(node) {
    return {
      start_line: node.startPosition.row + 1,
      start_col: node.startPosition.column + 1,
      end_line: node.endPosition.row + 1,
      end_col: node.endPosition.column + 1,
    };
  }

  _functionSignature(paramsNode, returnNode) {
    let sig = paramsNode ? paramsNode.text : '()';
    if (returnNode) {
      sig += ' => ' + this._stripAnnotation(returnNode.text);
    }
    return sig;
  }

  _stripAnnotation(text) {
    return text.replace(/^\s*:\s*/, '').trim();
  }

  _extractParameters(paramsNode, language) {
    if (!paramsNode) return [];
    const params = [];
    for (const child of paramsNode.namedChildren) {
      const p = {};
      if (child.type === 'typed_parameter' || child.type === 'default_parameter' || child.type === 'typed_default_parameter') {
        const nameChild = child.namedChildren.find((c) => c.type === 'identifier');
        p.name = nameChild ? nameChild.text : child.text;
        const typeChild = child.namedChildren.find((c) => c.type === 'type');
        p.type = typeChild ? typeChild.text : null;
      } else if (child.type === 'identifier' || child.type === 'property_identifier') {
        p.name = child.text;
      } else {
        const nameChild = child.childForFieldName('name') || child.namedChildren.find((c) => c.type === 'identifier' || c.type === 'property_identifier');
        p.name = nameChild ? nameChild.text : child.type;
        const typeChild = child.childForFieldName('type');
        p.type = typeChild ? this._stripAnnotation(typeChild.text) : null;
      }
      params.push(p);
    }
    return params;
  }

  _visibility(node, ctx, language) {
    if (language === 'python') {
      const name = (node.childForFieldName('name') || {}).text || '';
      if (name.startsWith('__')) return 'private';
      if (name.startsWith('_')) return 'protected';
      return 'public';
    }
    const tsVis = this._tsVisibility(node);
    if (tsVis) return tsVis;
    return 'public';
  }

  _tsVisibility(node) {
    for (const child of node.namedChildren) {
      if (child.type === 'accessibility_modifier') {
        return child.text;
      }
    }
    return null;
  }

  _declarationKeyword(node) {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child.isNamed && /^(const|let|var)$/.test(child.text)) {
        return child.text;
      }
    }
    return null;
  }

  _destructuredNames(nameNode) {
    if (!nameNode) return ['unnamed'];
    if (nameNode.type === 'identifier' || nameNode.type === 'property_identifier') {
      return [nameNode.text];
    }
    if (nameNode.type === 'object_pattern' || nameNode.type === 'array_pattern') {
      const names = [];
      const collect = (n) => {
        if (n.type === 'shorthand_property_identifier_pattern' || n.type === 'identifier' || n.type === 'property_identifier') {
          names.push(n.text);
        } else {
          n.namedChildren.forEach(collect);
        }
      };
      nameNode.namedChildren.forEach(collect);
      return names.length > 0 ? names : ['unnamed'];
    }
    return [nameNode.text];
  }

  _methodModifiers(node, ctx) {
    const mods = [];
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child.isNamed && /^(static|async|get|set|abstract|override|readonly)$/.test(child.text)) {
        mods.push(child.text);
      }
    }
    return mods;
  }

  _fieldModifiers(node) {
    const mods = [];
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child.isNamed && /^(static|readonly|abstract|override)$/.test(child.text)) {
        mods.push(child.text);
      }
    }
    return mods;
  }

  _functionModifiers(node, ctx, language) {
    const mods = [];
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child.isNamed && /^(async|static|export|abstract|override|readonly)$/.test(child.text)) {
        mods.push(child.text);
      }
    }
    if (language === 'python' && (ctx.decorators || []).length > 0) {
      for (const dec of ctx.decorators) {
        const m = dec.replace(/^@/, '').split('(')[0].trim();
        if (m) mods.push(m);
      }
    }
    return mods;
  }

  _classModifiers(node, ctx, language) {
    const mods = [];
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child.isNamed && /^(export|abstract|default|final|readonly)$/.test(child.text)) {
        mods.push(child.text);
      }
    }
    if (language === 'python' && (ctx.decorators || []).length > 0) {
      for (const dec of ctx.decorators) {
        const m = dec.replace(/^@/, '').split('(')[0].trim();
        if (m) mods.push(m);
      }
    }
    return mods;
  }

  _classRelationships(node, heritage) {
    const rels = [];
    if (!heritage) return rels;
    for (const child of heritage.namedChildren) {
      if (child.type === 'identifier' || child.type === 'type_identifier' || child.type === 'member_expression') {
        rels.push({ relation: child.text.startsWith('extends') ? 'extends' : 'implements', target: child.text });
      }
    }
    const extendsIdx = heritage.text.indexOf('extends');
    const implementsIdx = heritage.text.indexOf('implements');
    if (extendsIdx !== -1) {
      const rest = heritage.text.slice(extendsIdx + 'extends'.length, implementsIdx !== -1 ? implementsIdx : undefined);
      for (const tok of rest.split(',')) {
        const clean = tok.trim();
        if (clean) rels.push({ relation: 'extends', target: clean });
      }
    }
    if (implementsIdx !== -1) {
      const rest = heritage.text.slice(implementsIdx + 'implements'.length);
      for (const tok of rest.split(',')) {
        const clean = tok.trim();
        if (clean) rels.push({ relation: 'implements', target: clean });
      }
    }
    return rels;
  }
}

module.exports = { CanonicalObjectGenerator };
