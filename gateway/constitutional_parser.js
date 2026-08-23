/**
 * Constitutional Parser
 * 
 * Milestone 3 — Constitutional Parser
 * 
 * Constitutional Constraint: Replace parser output with constitutional objects.
 * 
 * No parser metadata survives.
 * No timestamps.
 * No memory addresses.
 * No parser-specific IDs.
 * 
 * Pipeline:
 * GitHubBlob
 *       ↓
 * Parser
 *       ↓
 * AST
 * Node Objects
 * Symbol Objects
 * ImportGraph
 * CallGraph
 * TypeGraph
 *       ↓
 * CanonicalBytes
 *       ↓
 * CanonicalHash
 *       ↓
 * Identity
 *       ↓
 * RepositoryStore
 */

const {
  ASTObject,
  NodeObject,
  SymbolObject,
  ImportGraphObject,
  CallGraphObject,
  TypeGraphObject,
} = require('./constitutional_parser_objects');
const { constitutionalVerificationAuthority } = require('../ping-runtime/evidence/constitutional_verification_authority');

class ConstitutionalParser {
  constructor() {
    this._namespace = 'parser';
    this._version = '1.0.0';
  }

  /**
   * Parse GitHub blob into constitutional objects
   * 
   * @param {Object} blobObject - GitHub blob object
   * @param {string} sourceCode - Source code to parse
   * @returns {Object} Constitutional parser objects
   */
  parse(blobObject, sourceCode) {
    const constitutionalObjects = {
      ast: null,
      nodes: [],
      symbols: [],
      importGraph: null,
      callGraph: null,
      typeGraph: null,
    };

    // Parse source code (placeholder for actual parser)
    const rawAST = this._parseSourceCode(sourceCode);

    // Build AST object
    const astBuilder = new ASTObject(rawAST, blobObject.id);
    const astObject = astBuilder.build();
    
    const astVerification = constitutionalVerificationAuthority.verifyArtifact(astObject);
    if (!astVerification.valid) {
      throw new Error(`AST verification failed: ${astVerification.reason}`);
    }
    
    constitutionalObjects.ast = astObject;

    // Build node objects
    const nodes = this._extractNodes(rawAST);
    for (const node of nodes) {
      const nodeBuilder = new NodeObject(node, astObject.id, blobObject.id);
      const nodeObject = nodeBuilder.build();
      
      const nodeVerification = constitutionalVerificationAuthority.verifyArtifact(nodeObject);
      if (!nodeVerification.valid) {
        throw new Error(`Node verification failed: ${nodeVerification.reason}`);
      }
      
      constitutionalObjects.nodes.push(nodeObject);
    }

    // Build symbol objects
    const symbols = this._extractSymbols(rawAST);
    for (const symbol of symbols) {
      const symbolBuilder = new SymbolObject(symbol, blobObject.id);
      const symbolObject = symbolBuilder.build();
      
      const symbolVerification = constitutionalVerificationAuthority.verifyArtifact(symbolObject);
      if (!symbolVerification.valid) {
        throw new Error(`Symbol verification failed: ${symbolVerification.reason}`);
      }
      
      constitutionalObjects.symbols.push(symbolObject);
    }

    // Build import graph object
    const importData = this._extractImports(rawAST);
    const importGraphBuilder = new ImportGraphObject(importData, blobObject.id);
    const importGraphObject = importGraphBuilder.build();
    
    const importGraphVerification = constitutionalVerificationAuthority.verifyArtifact(importGraphObject);
    if (!importGraphVerification.valid) {
      throw new Error(`ImportGraph verification failed: ${importGraphVerification.reason}`);
    }
    
    constitutionalObjects.importGraph = importGraphObject;

    // Build call graph object
    const callData = this._extractCalls(rawAST);
    const callGraphBuilder = new CallGraphObject(callData, blobObject.id);
    const callGraphObject = callGraphBuilder.build();
    
    const callGraphVerification = constitutionalVerificationAuthority.verifyArtifact(callGraphObject);
    if (!callGraphVerification.valid) {
      throw new Error(`CallGraph verification failed: ${callGraphVerification.reason}`);
    }
    
    constitutionalObjects.callGraph = callGraphObject;

    // Build type graph object
    const typeData = this._extractTypes(rawAST);
    const typeGraphBuilder = new TypeGraphObject(typeData, blobObject.id);
    const typeGraphObject = typeGraphBuilder.build();
    
    const typeGraphVerification = constitutionalVerificationAuthority.verifyArtifact(typeGraphObject);
    if (!typeGraphVerification.valid) {
      throw new Error(`TypeGraph verification failed: ${typeGraphVerification.reason}`);
    }
    
    constitutionalObjects.typeGraph = typeGraphObject;

    return constitutionalObjects;
  }

  /**
   * Parse source code (placeholder for actual parser)
   * @param {string} sourceCode - Source code
   * @returns {Object} Raw AST
   */
  _parseSourceCode(sourceCode) {
    // Placeholder: In production, this would use a real parser like @babel/parser
    // For now, return a minimal AST structure
    return {
      type: 'Program',
      start: 0,
      end: sourceCode.length,
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: sourceCode.length },
      },
      sourceType: 'module',
      body: [],
    };
  }

  /**
   * Extract nodes from AST
   * @param {Object} ast - Raw AST
   * @returns {Array} Nodes
   */
  _extractNodes(ast) {
    const nodes = [];
    
    function traverse(node, path = []) {
      if (!node || typeof node !== 'object') return;
      
      nodes.push({
        type: node.type,
        node_path: path,
        parent_type: path.length > 0 ? path[path.length - 1] : null,
      });
      
      for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'start' || key === 'end') continue;
        
        if (Array.isArray(node[key])) {
          node[key].forEach((child, index) => {
            traverse(child, [...path, node.type, index]);
          });
        } else if (typeof node[key] === 'object' && node[key] !== null) {
          traverse(node[key], [...path, node.type]);
        }
      }
    }
    
    traverse(ast);
    return nodes;
  }

  /**
   * Extract symbols from AST
   * @param {Object} ast - Raw AST
   * @returns {Array} Symbols
   */
  _extractSymbols(ast) {
    const symbols = [];
    
    function traverse(node) {
      if (!node || typeof node !== 'object') return;
      
      if (node.type === 'FunctionDeclaration' && node.id) {
        symbols.push({
          name: node.id.name,
          kind: 'function',
          scope: 'module',
          is_exported: false,
          is_async: node.async || false,
          is_generator: node.generator || false,
          parameters: node.params ? node.params.map(p => p.name) : [],
          return_type: null,
        });
      }
      
      if (node.type === 'VariableDeclaration') {
        for (const decl of node.declarations) {
          if (decl.id && decl.id.name) {
            symbols.push({
              name: decl.id.name,
              kind: 'variable',
              scope: node.kind, // const, let, var
              is_exported: false,
              is_async: false,
              is_generator: false,
              parameters: [],
              return_type: null,
            });
          }
        }
      }
      
      if (node.type === 'ClassDeclaration' && node.id) {
        symbols.push({
          name: node.id.name,
          kind: 'class',
          scope: 'module',
          is_exported: false,
          is_async: false,
          is_generator: false,
          parameters: [],
          return_type: null,
        });
      }
      
      for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'start' || key === 'end') continue;
        
        if (Array.isArray(node[key])) {
          node[key].forEach(child => traverse(child));
        } else if (typeof node[key] === 'object' && node[key] !== null) {
          traverse(node[key]);
        }
      }
    }
    
    traverse(ast);
    return symbols;
  }

  /**
   * Extract imports from AST
   * @param {Object} ast - Raw AST
   * @returns {Object} Import data
   */
  _extractImports(ast) {
    const imports = [];
    
    function traverse(node) {
      if (!node || typeof node !== 'object') return;
      
      if (node.type === 'ImportDeclaration') {
        const specifiers = node.specifiers.map(spec => ({
          type: spec.type,
          local: spec.local.name,
          imported: spec.imported ? spec.imported.name : null,
        }));
        
        imports.push({
          module: node.source.value,
          specifiers,
          is_default: specifiers.some(s => s.type === 'ImportDefaultSpecifier'),
          is_namespace: specifiers.some(s => s.type === 'ImportNamespaceSpecifier'),
        });
      }
      
      for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'start' || key === 'end') continue;
        
        if (Array.isArray(node[key])) {
          node[key].forEach(child => traverse(child));
        } else if (typeof node[key] === 'object' && node[key] !== null) {
          traverse(node[key]);
        }
      }
    }
    
    traverse(ast);
    return { imports };
  }

  /**
   * Extract calls from AST
   * @param {Object} ast - Raw AST
   * @returns {Object} Call data
   */
  _extractCalls(ast) {
    const calls = [];
    
    function traverse(node, scope = null) {
      if (!node || typeof node !== 'object') return;
      
      if (node.type === 'FunctionDeclaration' && node.id) {
        scope = node.id.name;
      }
      
      if (node.type === 'CallExpression') {
        const callee = node.callee;
        const calleeName = callee.type === 'Identifier' ? callee.name : 
                          callee.type === 'MemberExpression' ? `${callee.object.name}.${callee.property.name}` : 'unknown';
        
        calls.push({
          caller: scope,
          callee: calleeName,
          call_site: node.loc ? `${node.loc.start.line}:${node.loc.start.column}` : 'unknown',
        });
      }
      
      for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'start' || key === 'end') continue;
        
        if (Array.isArray(node[key])) {
          node[key].forEach(child => traverse(child, scope));
        } else if (typeof node[key] === 'object' && node[key] !== null) {
          traverse(node[key], scope);
        }
      }
    }
    
    traverse(ast);
    return { calls };
  }

  /**
   * Extract types from AST
   * @param {Object} ast - Raw AST
   * @returns {Object} Type data
   */
  _extractTypes(ast) {
    const types = [];
    
    function traverse(node) {
      if (!node || typeof node !== 'object') return;
      
      if (node.type === 'ClassDeclaration' && node.id) {
        const properties = [];
        const methods = [];
        
        if (node.body && node.body.body) {
          for (const member of node.body.body) {
            if (member.type === 'ClassProperty' || member.type === 'PropertyDefinition') {
              if (member.key && member.key.name) {
                properties.push({
                  name: member.key.name,
                  type: member.value ? member.value.type : 'unknown',
                });
              }
            } else if (member.type === 'MethodDefinition' && member.key) {
              methods.push({
                name: member.key.name,
                kind: member.kind, // get, set, method, constructor
              });
            }
          }
        }
        
        types.push({
          name: node.id.name,
          kind: 'class',
          properties,
          methods,
          extends: node.superClass ? node.superClass.name : [],
          implements: [],
        });
      }
      
      for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'start' || key === 'end') continue;
        
        if (Array.isArray(node[key])) {
          node[key].forEach(child => traverse(child));
        } else if (typeof node[key] === 'object' && node[key] !== null) {
          traverse(node[key]);
        }
      }
    }
    
    traverse(ast);
    return { types };
  }
}

module.exports = { ConstitutionalParser };
