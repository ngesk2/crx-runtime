/**
 * Knowledge Runtime
 * 
 * Milestone 4 — Knowledge Runtime
 * 
 * Constitutional Constraint: Transform only constitutional objects.
 * Never raw code.
 * 
 * Pipeline:
 * Symbol Objects
 * AST Objects
 * TypeGraph Objects
 * ImportGraph Objects
 *       ↓
 * Knowledge Runtime
 *       ↓
 * Function
 * Class
 * Interface
 * API
 * Dependency
 * Concept
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
  FunctionKnowledgeObject,
  ClassKnowledgeObject,
  InterfaceKnowledgeObject,
  APIKnowledgeObject,
  DependencyKnowledgeObject,
  ConceptKnowledgeObject,
} = require('./knowledge_objects');
const { constitutionalVerificationAuthority } = require('./verification_authority');

class KnowledgeRuntime {
  constructor() {
    this._namespace = 'knowledge';
    this._version = '1.0.0';
  }

  /**
   * Transform constitutional parser objects into knowledge objects
   * 
   * @param {Object} parserObjects - Constitutional parser objects
   * @returns {Object} Knowledge objects
   */
  transform(parserObjects) {
    const knowledgeObjects = {
      functions: [],
      classes: [],
      interfaces: [],
      apis: [],
      dependencies: [],
      concepts: [],
    };

    // Transform symbols into knowledge objects
    for (const symbol of parserObjects.symbols) {
      const kind = symbol.payload.kind;

      if (kind === 'function') {
        // Find corresponding AST
        const ast = parserObjects.ast;
        const functionBuilder = new FunctionKnowledgeObject(symbol, ast);
        const functionObject = functionBuilder.build();
        
        const functionVerification = constitutionalVerificationAuthority.verifyArtifact(functionObject);
        if (!functionVerification.valid) {
          throw new Error(`FunctionKnowledge verification failed: ${functionVerification.reason}`);
        }
        
        knowledgeObjects.functions.push(functionObject);
      } else if (kind === 'class') {
        // Find corresponding TypeGraph
        const typeGraph = parserObjects.typeGraph;
        const classBuilder = new ClassKnowledgeObject(symbol, typeGraph);
        const classObject = classBuilder.build();
        
        const classVerification = constitutionalVerificationAuthority.verifyArtifact(classObject);
        if (!classVerification.valid) {
          throw new Error(`ClassKnowledge verification failed: ${classVerification.reason}`);
        }
        
        knowledgeObjects.classes.push(classObject);
      } else if (kind === 'interface') {
        // Find corresponding TypeGraph
        const typeGraph = parserObjects.typeGraph;
        const interfaceBuilder = new InterfaceKnowledgeObject(symbol, typeGraph);
        const interfaceObject = interfaceBuilder.build();
        
        const interfaceVerification = constitutionalVerificationAuthority.verifyArtifact(interfaceObject);
        if (!interfaceVerification.valid) {
          throw new Error(`InterfaceKnowledge verification failed: ${interfaceVerification.reason}`);
        }
        
        knowledgeObjects.interfaces.push(interfaceObject);
      }
    }

    // Transform ImportGraph into DependencyKnowledge
    if (parserObjects.importGraph) {
      const dependencyBuilder = new DependencyKnowledgeObject(parserObjects.importGraph);
      const dependencyObject = dependencyBuilder.build();
      
      const dependencyVerification = constitutionalVerificationAuthority.verifyArtifact(dependencyObject);
      if (!dependencyVerification.valid) {
        throw new Error(`DependencyKnowledge verification failed: ${dependencyVerification.reason}`);
      }
      
      knowledgeObjects.dependencies.push(dependencyObject);
    }

    // Extract API knowledge from functions (constitutional: derive from AST decorators)
    const ast = parserObjects.ast;
    for (const functionObject of knowledgeObjects.functions) {
      if (this._isAPIFunction(functionObject, ast)) {
        const apiMetadata = this._extractAPIMetadata(functionObject, ast);
        const apiBuilder = new APIKnowledgeObject(functionObject, apiMetadata);
        const apiObject = apiBuilder.build();
        
        const apiVerification = constitutionalVerificationAuthority.verifyArtifact(apiObject);
        if (!apiVerification.valid) {
          throw new Error(`APIKnowledge verification failed: ${apiVerification.reason}`);
        }
        
        knowledgeObjects.apis.push(apiObject);
      }
    }

    // Extract concepts from knowledge objects (constitutional: derive from TypeGraph)
    const typeGraph = parserObjects.typeGraph;
    const concepts = this._extractConcepts(knowledgeObjects, typeGraph);
    for (const concept of concepts) {
      const conceptBuilder = new ConceptKnowledgeObject(concept.name, concept.description, concept.relatedIds);
      const conceptObject = conceptBuilder.build();
      
      const conceptVerification = constitutionalVerificationAuthority.verifyArtifact(conceptObject);
      if (!conceptVerification.valid) {
        throw new Error(`ConceptKnowledge verification failed: ${conceptVerification.reason}`);
      }
      
      knowledgeObjects.concepts.push(conceptObject);
    }

    return knowledgeObjects;
  }

  /**
   * Check if function is an API function
   * Constitutional Constraint: Must derive from constitutional parser output, not naming conventions
   * @param {Object} functionObject - Function knowledge object
   * @param {Object} astObject - AST object (for checking decorators/annotations)
   * @returns {boolean} Is API function
   */
  _isAPIFunction(functionObject, astObject) {
    // Constitutional: Derive from AST annotations/decorators, not naming conventions
    // Check if function has API-related decorators or annotations in AST
    if (!astObject || !astObject.payload) return false;

    // Check for API decorators in AST (placeholder - would check actual AST structure)
    const hasAPIDecorator = this._hasAPIDecorator(astObject);
    
    return hasAPIDecorator;
  }

  /**
   * Check if AST has API decorator
   * @param {Object} astObject - AST object
   * @returns {boolean} Has API decorator
   */
  _hasAPIDecorator(astObject) {
    // Placeholder: Check AST for API decorators like @Get, @Post, @Route, etc.
    // In production, this would analyze the actual AST structure
    const body = astObject.payload.body || [];
    
    for (const node of body) {
      if (node.decorators && Array.isArray(node.decorators)) {
        for (const decorator of node.decorators) {
          const decoratorName = decorator.expression?.name || decorator.expression?.callee?.name;
          if (decoratorName && ['Get', 'Post', 'Put', 'Delete', 'Patch', 'Route', 'Controller'].includes(decoratorName)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Extract API metadata from function
   * Constitutional Constraint: Must derive from constitutional parser output, not naming conventions
   * @param {Object} functionObject - Function knowledge object
   * @param {Object} astObject - AST object
   * @returns {Object} API metadata
   */
  _extractAPIMetadata(functionObject, astObject) {
    // Constitutional: Extract from AST decorators, not naming conventions
    if (!astObject || !astObject.payload) {
      return {
        method: 'GET',
        path: `/${functionObject.payload.name}`,
        authentication: 'none',
        rate_limit: null,
      };
    }

    const body = astObject.payload.body || [];
    let method = 'GET';
    let path = `/${functionObject.payload.name}`;
    
    for (const node of body) {
      if (node.decorators && Array.isArray(node.decorators)) {
        for (const decorator of node.decorators) {
          const decoratorName = decorator.expression?.name || decorator.expression?.callee?.name;
          if (decoratorName) {
            if (['Get', 'Post', 'Put', 'Delete', 'Patch'].includes(decoratorName)) {
              method = decoratorName.toUpperCase();
            }
            if (decoratorName === 'Route' && decorator.arguments && decorator.arguments[0]) {
              path = decorator.arguments[0].value;
            }
          }
        }
      }
    }
    
    return {
      method,
      path,
      authentication: 'none',
      rate_limit: null,
    };
  }

  /**
   * Extract concepts from knowledge objects
   * Constitutional Constraint: Must derive from constitutional parser output, not naming conventions
   * @param {Object} knowledgeObjects - Knowledge objects
   * @param {Object} typeGraph - Type graph object
   * @returns {Array} Concepts
   */
  _extractConcepts(knowledgeObjects, typeGraph) {
    const concepts = [];
    
    // Constitutional: Derive concepts from TypeGraph relationships, not naming prefixes
    // Concepts are derived from shared interfaces, inheritance hierarchies, or explicit annotations
    
    if (!typeGraph || !typeGraph.payload) return concepts;
    
    // Extract concepts from shared interfaces
    const interfaceImplementations = new Map();
    
    for (const cls of knowledgeObjects.classes) {
      for (const implementedInterface of cls.payload.implements) {
        if (!interfaceImplementations.has(implementedInterface)) {
          interfaceImplementations.set(implementedInterface, []);
        }
        interfaceImplementations.get(implementedInterface).push(cls);
      }
    }
    
    // Create concepts from interfaces with multiple implementations
    for (const [interfaceName, implementingClasses] of interfaceImplementations) {
      if (implementingClasses.length > 1) {
        concepts.push({
          name: interfaceName,
          description: `${interfaceName} concept (shared interface)`,
          relatedIds: implementingClasses.map(c => c.id),
        });
      }
    }
    
    // Extract concepts from inheritance hierarchies
    const inheritanceMap = new Map();
    
    for (const cls of knowledgeObjects.classes) {
      for (const parentClass of cls.payload.extends) {
        if (!inheritanceMap.has(parentClass)) {
          inheritanceMap.set(parentClass, []);
        }
        inheritanceMap.get(parentClass).push(cls);
      }
    }
    
    // Create concepts from base classes with multiple children
    for (const [baseClass, childClasses] of inheritanceMap) {
      if (childClasses.length > 1) {
        concepts.push({
          name: baseClass,
          description: `${baseClass} concept (inheritance hierarchy)`,
          relatedIds: childClasses.map(c => c.id),
        });
      }
    }
    
    return concepts;
  }
}

module.exports = { KnowledgeRuntime };
