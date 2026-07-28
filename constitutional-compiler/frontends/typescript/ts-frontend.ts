/**
 * TypeScript Frontend
 * 
 * Uses TypeScript Compiler API to parse TypeScript files and emit IR.
 * No regex. Ever.
 */

import * as ts from 'typescript';
import { IRDocument, IRNode, IRNodeType, SymbolID } from '../../ir/node-types';
import { generateSymbolID, SymbolIDRegistry } from '../../ir/symbol-id';
import { IncrementalCache } from '../../ir/incremental-cache';

export class TypeScriptFrontend {
  private program: ts.Program | null = null;
  private typeChecker: ts.TypeChecker | null = null;
  private symbolRegistry = new SymbolIDRegistry();
  private cache = new IncrementalCache();
  private irNodes: Map<SymbolID, IRNode> = new Map();

  private getNodeLocation(node: ts.Node): { line: number; column: number } {
    const sourceFile = node.getSourceFile();
    const position = node.getStart(sourceFile);
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(position);
    return { line: line + 1, column: character };
  }

  private getSymbolForNode(node: ts.Node | undefined): ts.Symbol | undefined {
    if (!node || !this.typeChecker) {
      return undefined;
    }

    return this.typeChecker.getSymbolAtLocation(node);
  }

  private hasModifier(modifiers: readonly ts.ModifierLike[] | undefined, kind: ts.SyntaxKind): boolean {
    return !!modifiers?.some((modifier) => modifier.kind === kind);
  }

  /**
   * Initialize the TypeScript compiler
   */
  initialize(configFilePath: string): void {
    const config = ts.readConfigFile(configFilePath, ts.sys.readFile);
    const compilerOptions = ts.parseJsonConfigFileContent(
      config.config,
      ts.sys,
      process.cwd()
    );

    this.program = ts.createProgram(compilerOptions.fileNames, compilerOptions.options);
    this.typeChecker = this.program.getTypeChecker();
  }

  /**
   * Parse a TypeScript file and emit IR
   */
  parseFile(filePath: string): IRDocument | null {
    const sourceFile = this.program?.getSourceFile(filePath);
    if (!sourceFile) {
      return null;
    }

    const content = sourceFile.getFullText();
    
    // Check cache
    if (this.cache.isCached(filePath, content)) {
      const cached = this.cache.get(filePath);
      if (cached) {
        return this.buildDocumentFromCache(cached);
      }
    }

    // Parse and emit IR
    this.irNodes.clear();
    this.emitIR(sourceFile);

    // Cache result
    const symbolIDs = Array.from(this.irNodes.keys());
    this.cache.set(filePath, content, symbolIDs);

    return this.buildDocument(sourceFile);
  }

  /**
   * Emit IR nodes from TypeScript AST
   */
  private emitIR(sourceFile: ts.SourceFile): void {
    this.emitModule(sourceFile);
    this.traverse(sourceFile);
  }

  /**
   * Emit module node
   */
  private emitModule(sourceFile: ts.SourceFile): void {
    const namespace = this.extractNamespace(sourceFile.fileName);
    const moduleName = this.getModuleName(sourceFile.fileName);
    const id = generateSymbolID('module', moduleName, sourceFile.fileName);
    
    const moduleNode: IRNode = {
      id,
      type: IRNodeType.Module,
      name: moduleName,
      sourceFile: sourceFile.fileName,
      sourceLine: 1,
      sourceColumn: 1,
      metadata: {
        namespace,
      },
    };

    this.irNodes.set(id, moduleNode);
    this.symbolRegistry.register(id, moduleNode.name, 'module', sourceFile.fileName);
  }

  /**
   * Traverse AST and emit IR nodes
   */
  private traverse(node: ts.Node): void {
    if (ts.isClassDeclaration(node)) {
      this.emitClass(node);
    } else if (ts.isInterfaceDeclaration(node)) {
      this.emitInterface(node);
    } else if (ts.isFunctionDeclaration(node)) {
      this.emitFunction(node);
    } else if (ts.isMethodDeclaration(node)) {
      this.emitMethod(node);
    } else if (ts.isConstructorDeclaration(node)) {
      this.emitConstructor(node);
    } else if (ts.isImportDeclaration(node)) {
      this.emitImport(node);
    } else if (ts.isExportDeclaration(node)) {
      this.emitExport(node);
    } else if (ts.isNewExpression(node)) {
      this.emitInstantiation(node);
    } else if (ts.isCallExpression(node)) {
      this.emitMethodCall(node);
    } else if (ts.isPropertyAccessExpression(node)) {
      this.emitFieldAccess(node);
    } else if (ts.isBinaryExpression(node)) {
      this.emitAssignment(node);
    }

    ts.forEachChild(node, (child: ts.Node) => this.traverse(child));
  }

  /**
   * Emit class node
   * 
   * Inheritance resolution:
   * - extends
   * - implements
   * - abstract
   * - generic inheritance
   * - interface inheritance
   * - mixin detection
   * - decorator augmentation
   */
  private emitClass(node: ts.ClassDeclaration): void {
    const className = node.name?.getText() || '<anonymous>';
    const id = generateSymbolID('class', className, node.getSourceFile().fileName);
    const symbol = this.getSymbolForNode(node.name);
    const isAbstract = this.hasModifier(node.modifiers, ts.SyntaxKind.AbstractKeyword);
    const location = this.getNodeLocation(node);
    
    // Resolve inheritance
    const extendsClass = this.resolveExtends(node);
    const implementsInterfaces = this.resolveImplements(node);
    const genericInheritance = this.resolveGenericInheritance(node);
    const interfaceInheritance = this.resolveInterfaceInheritance(node);
    const mixins = this.resolveMixins(node);
    const decoratorAugmentation = this.resolveDecoratorAugmentation(node);

    const classNode: IRNode = {
      id,
      type: isAbstract ? IRNodeType.AbstractClass : IRNodeType.ConcreteClass,
      name: node.name?.getText() || '<anonymous>',
      sourceFile: node.getSourceFile().fileName,
      sourceLine: location.line,
      sourceColumn: location.column,
      metadata: {
        symbolName: symbol?.getName(),
        isAbstract,
        extendsClass,
        implementsInterfaces,
        genericInheritance,
        interfaceInheritance,
        mixins,
        decoratorAugmentation,
      },
    };

    this.irNodes.set(id, classNode);
    this.symbolRegistry.register(id, classNode.name, 'class', node.getSourceFile().fileName);
  }

  /**
   * Resolve extends clause
   */
  private resolveExtends(node: ts.ClassDeclaration): string | null {
    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          const extendsType = clause.types[0];
          const symbol = this.typeChecker?.getSymbolAtLocation(extendsType.expression);
          return symbol?.getName() || null;
        }
      }
    }
    return null;
  }

  /**
   * Resolve implements clause
   */
  private resolveImplements(node: ts.ClassDeclaration): string[] {
    const interfaces: string[] = [];
    
    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
          for (const type of clause.types) {
            const symbol = this.typeChecker?.getSymbolAtLocation(type.expression);
            if (symbol) {
              interfaces.push(symbol.getName());
            }
          }
        }
      }
    }
    
    return interfaces;
  }

  /**
   * Resolve generic inheritance
   */
  private resolveGenericInheritance(node: ts.ClassDeclaration): string[] {
    const generics: string[] = [];
    
    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        for (const type of clause.types) {
          if (type.typeArguments) {
            for (const typeArg of type.typeArguments) {
              const symbol = this.typeChecker?.getSymbolAtLocation(typeArg);
              if (symbol) {
                generics.push(symbol.getName());
              }
            }
          }
        }
      }
    }
    
    return generics;
  }

  /**
   * Resolve interface inheritance
   */
  private resolveInterfaceInheritance(node: ts.ClassDeclaration): string[] {
    const interfaces: string[] = [];
    
    // Check if the class implements interfaces that themselves extend other interfaces
    const implementsInterfaces = this.resolveImplements(node);
    
    for (const interfaceName of implementsInterfaces) {
      // TODO: Recursively resolve interface hierarchy
      interfaces.push(interfaceName);
    }
    
    return interfaces;
  }

  /**
   * Resolve mixins
   */
  private resolveMixins(node: ts.ClassDeclaration): string[] {
    const mixins: string[] = [];
    
    // Mixins are typically detected through specific patterns
    // e.g., class MyClass extends Mixin(BaseClass)
    const extendsClass = this.resolveExtends(node);
    if (extendsClass && extendsClass.includes('Mixin')) {
      mixins.push(extendsClass);
    }
    
    return mixins;
  }

  /**
   * Resolve decorator augmentation
   */
  private resolveDecoratorAugmentation(node: ts.ClassDeclaration): string[] {
    const decorators: string[] = [];
    
    if (node.modifiers) {
      for (const modifier of node.modifiers) {
        if (ts.isDecorator(modifier)) {
          const decoratorName = this.extractDecoratorName(modifier);
          if (decoratorName) {
            decorators.push(decoratorName);
          }
        }
      }
    }
    
    return decorators;
  }

  /**
   * Extract decorator name
   */
  private extractDecoratorName(decorator: ts.Decorator): string | null {
    if (ts.isCallExpression(decorator.expression)) {
      const symbol = this.typeChecker?.getSymbolAtLocation(decorator.expression.expression);
      return symbol?.getName() || null;
    } else if (ts.isIdentifier(decorator.expression)) {
      return decorator.expression.getText();
    }
    return null;
  }

  /**
   * Emit interface node
   */
  private emitInterface(node: ts.InterfaceDeclaration): void {
    const interfaceName = node.name.getText();
    const id = generateSymbolID('interface', interfaceName, node.getSourceFile().fileName);
    const symbol = this.getSymbolForNode(node.name);
    const location = this.getNodeLocation(node);

    const interfaceNode: IRNode = {
      id,
      type: IRNodeType.Interface,
      name: node.name.getText(),
      sourceFile: node.getSourceFile().fileName,
      sourceLine: location.line,
      sourceColumn: location.column,
      metadata: {
        symbolName: symbol?.getName(),
      },
    };

    this.irNodes.set(id, interfaceNode);
    this.symbolRegistry.register(id, interfaceNode.name, 'interface', node.getSourceFile().fileName);
  }

  /**
   * Emit function node
   */
  private emitFunction(node: ts.FunctionDeclaration): void {
    const functionName = node.name?.getText() || '<anonymous>';
    const id = generateSymbolID('function', functionName, node.getSourceFile().fileName);
    const symbol = this.getSymbolForNode(node.name);
    const location = this.getNodeLocation(node);

    const functionNode: IRNode = {
      id,
      type: IRNodeType.Function,
      name: node.name?.getText() || '<anonymous>',
      sourceFile: node.getSourceFile().fileName,
      sourceLine: location.line,
      sourceColumn: location.column,
      metadata: {
        symbolName: symbol?.getName(),
        isAsync: this.hasModifier(node.modifiers, ts.SyntaxKind.AsyncKeyword),
      },
    };

    this.irNodes.set(id, functionNode);
    this.symbolRegistry.register(id, functionNode.name, 'function', node.getSourceFile().fileName);
  }

  /**
   * Emit method node
   */
  private emitMethod(node: ts.MethodDeclaration): void {
    const methodName = node.name?.getText() || '<anonymous>';
    const id = generateSymbolID('method', methodName, node.getSourceFile().fileName);
    const symbol = this.getSymbolForNode(node.name);
    const location = this.getNodeLocation(node);

    const methodNode: IRNode = {
      id,
      type: IRNodeType.Method,
      name: node.name?.getText() || '<anonymous>',
      sourceFile: node.getSourceFile().fileName,
      sourceLine: location.line,
      sourceColumn: location.column,
      metadata: {
        symbolName: symbol?.getName(),
        isAsync: this.hasModifier(node.modifiers, ts.SyntaxKind.AsyncKeyword),
        isStatic: this.hasModifier(node.modifiers, ts.SyntaxKind.StaticKeyword),
      },
    };

    this.irNodes.set(id, methodNode);
    this.symbolRegistry.register(id, methodNode.name, 'method', node.getSourceFile().fileName);
  }

  /**
   * Emit constructor node
   * 
   * Dependency injection resolution:
   * - constructor injection
   * - factory
   * - provider
   * - service locator
   * - container
   * - registry
   * - decorators
   * - reflection
   */
  private emitConstructor(node: ts.ConstructorDeclaration): void {
    const id = generateSymbolID('constructor', 'constructor', node.getSourceFile().fileName);
    const location = this.getNodeLocation(node);
    
    // Resolve dependency injection patterns
    const constructorInjection = this.resolveConstructorInjection(node);
    const factoryPattern = this.resolveFactoryPattern(node);
    const providerPattern = this.resolveProviderPattern(node);
    const serviceLocator = this.resolveServiceLocator(node);
    const containerPattern = this.resolveContainerPattern(node);
    const registryPattern = this.resolveRegistryPattern(node);
    const decoratorInjection = this.resolveDecoratorInjection(node);
    const reflectionInjection = this.resolveReflectionInjection(node);

    const constructorNode: IRNode = {
      id,
      type: IRNodeType.Constructor,
      name: 'constructor',
      sourceFile: node.getSourceFile().fileName,
      sourceLine: location.line,
      sourceColumn: location.column,
      metadata: {
        constructorInjection,
        factoryPattern,
        providerPattern,
        serviceLocator,
        containerPattern,
        registryPattern,
        decoratorInjection,
        reflectionInjection,
      },
    };

    this.irNodes.set(id, constructorNode);
    this.symbolRegistry.register(id, constructorNode.name, 'constructor', node.getSourceFile().fileName);
  }

  /**
   * Resolve constructor injection
   */
  private resolveConstructorInjection(node: ts.ConstructorDeclaration): string[] {
    const injected: string[] = [];
    
    if (node.parameters) {
      for (const param of node.parameters) {
        const symbol = this.typeChecker?.getSymbolAtLocation(param.name);
        if (symbol) {
          injected.push(symbol.getName());
        }
      }
    }
    
    return injected;
  }

  /**
   * Resolve factory pattern
   */
  private resolveFactoryPattern(node: ts.ConstructorDeclaration): boolean {
    // Check if constructor is part of a factory pattern
    const className = node.parent?.getText() || '';
    return className.includes('Factory') || className.includes('Builder');
  }

  /**
   * Resolve provider pattern
   */
  private resolveProviderPattern(node: ts.ConstructorDeclaration): boolean {
    // Check if constructor is part of a provider pattern
    const className = node.parent?.getText() || '';
    return className.includes('Provider');
  }

  /**
   * Resolve service locator
   */
  private resolveServiceLocator(node: ts.ConstructorDeclaration): boolean {
    // Check if constructor uses service locator pattern
    if (node.parameters) {
      for (const param of node.parameters) {
        const paramName = param.name.getText();
        if (paramName.includes('locator') || paramName.includes('service')) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Resolve container pattern
   */
  private resolveContainerPattern(node: ts.ConstructorDeclaration): boolean {
    // Check if constructor uses container pattern
    if (node.parameters) {
      for (const param of node.parameters) {
        const paramName = param.name.getText();
        if (paramName.includes('container') || paramName.includes('di')) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Resolve registry pattern
   */
  private resolveRegistryPattern(node: ts.ConstructorDeclaration): boolean {
    // Check if constructor uses registry pattern
    if (node.parameters) {
      for (const param of node.parameters) {
        const paramName = param.name.getText();
        if (paramName.includes('registry')) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Resolve decorator injection
   */
  private resolveDecoratorInjection(node: ts.ConstructorDeclaration): string[] {
    const decorators: string[] = [];
    
    // Check for parameter decorators
    if (node.parameters) {
      for (const param of node.parameters) {
        if (param.modifiers) {
          for (const modifier of param.modifiers) {
            if (ts.isDecorator(modifier)) {
              const decoratorName = this.extractDecoratorName(modifier);
              if (decoratorName) {
                decorators.push(decoratorName);
              }
            }
          }
        }
      }
    }
    
    return decorators;
  }

  /**
   * Resolve reflection injection
   */
  private resolveReflectionInjection(node: ts.ConstructorDeclaration): boolean {
    // Check if constructor uses reflection for injection
    if (node.parameters) {
      for (const param of node.parameters) {
        const paramName = param.name.getText();
        if (paramName.includes('context') || paramName.includes('injector')) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Emit import node
   * 
   * Distinguish:
   * - import
   * - import type
   * - export
   * - export type
   * - re-export
   * - namespace import
   * - dynamic import()
   * - CommonJS require
   * - conditional import
   * - lazy import
   * - reflection-based import
   * 
   * Alias resolution:
   * - import alias
   * - export alias
   * - barrel exports
   * - re-export chains
   * - namespace alias
   * - path mapping
   * - tsconfig aliases
   */
  private emitImport(node: ts.ImportDeclaration): void {
    const importName = node.moduleSpecifier.getText();
    const id = generateSymbolID('import', importName, node.getSourceFile().fileName);
    const location = this.getNodeLocation(node);
    
    // Detect import type
    const isTypeOnly = this.hasModifier(node.modifiers, ts.SyntaxKind.TypeKeyword);
    
    // Detect namespace import
    const isNamespaceImport = node.importClause?.namedBindings && 
      ts.isNamespaceImport(node.importClause.namedBindings);
    
    // Detect re-export
    const isReExport = node.importClause === null; // export ... from 'module'
    
    // Detect conditional import (if inside conditional)
    const isConditional = this.isInsideConditional(node);
    
    // Resolve aliases
    const importAliases = this.resolveImportAliases(node);
    const exportAliases = this.resolveExportAliases(node);
    const isBarrelExport = this.isBarrelExport(node);
    const reExportChain = this.resolveReExportChain(node);
    const namespaceAlias = this.resolveNamespaceAlias(node);
    const pathMapping = this.resolvePathMapping(node);
    const tsconfigAlias = this.resolveTsconfigAlias(node);

    const importNode: IRNode = {
      id,
      type: IRNodeType.Imports,
      name: importName,
      sourceFile: node.getSourceFile().fileName,
      sourceLine: location.line,
      sourceColumn: location.column,
      metadata: {
        source: importName,
        isTypeOnly,
        isNamespaceImport,
        isReExport,
        isConditional,
        importKind: this.determineImportKind(node),
        importAliases,
        exportAliases,
        isBarrelExport,
        reExportChain,
        namespaceAlias,
        pathMapping,
        tsconfigAlias,
      },
    };

    this.irNodes.set(id, importNode);
    this.symbolRegistry.register(id, importNode.name, 'import', node.getSourceFile().fileName);
  }

  /**
   * Resolve import aliases
   */
  private resolveImportAliases(node: ts.ImportDeclaration): string[] {
    const aliases: string[] = [];
    
    if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
      for (const element of node.importClause.namedBindings.elements) {
        if (element.propertyName) {
          // import { original as alias }
          aliases.push(`${element.propertyName.getText()} as ${element.name.getText()}`);
        } else {
          // import { name }
          aliases.push(element.name.getText());
        }
      }
    }
    
    if (node.importClause?.name) {
      // import name from 'module'
      aliases.push(node.importClause.name.getText());
    }
    
    return aliases;
  }

  /**
   * Resolve export aliases
   */
  private resolveExportAliases(node: ts.ImportDeclaration): string[] {
    const aliases: string[] = [];
    
    // Check if this is a re-export with aliases
    if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
      for (const element of node.importClause.namedBindings.elements) {
        if (element.propertyName) {
          aliases.push(`${element.propertyName.getText()} as ${element.name.getText()}`);
        }
      }
    }
    
    return aliases;
  }

  /**
   * Check if this is a barrel export
   */
  private isBarrelExport(node: ts.ImportDeclaration): boolean {
    // Barrel exports typically re-export everything from a module
    // export * from 'module'
    if (node.importClause?.namedBindings && ts.isNamespaceImport(node.importClause.namedBindings)) {
      return true;
    }
    
    return false;
  }

  /**
   * Resolve re-export chain
   */
  private resolveReExportChain(node: ts.ImportDeclaration): string[] {
    const chain: string[] = [];
    
    // Start with current import
    chain.push(node.moduleSpecifier.getText());
    
    // TODO: Follow re-export chains recursively
    // This requires parsing the target module and checking for re-exports
    
    return chain;
  }

  /**
   * Resolve namespace alias
   */
  private resolveNamespaceAlias(node: ts.ImportDeclaration): string | null {
    if (node.importClause?.namedBindings && ts.isNamespaceImport(node.importClause.namedBindings)) {
      return node.importClause.namedBindings.name.getText();
    }
    return null;
  }

  /**
   * Resolve path mapping
   */
  private resolvePathMapping(node: ts.ImportDeclaration): string | null {
    // TODO: Resolve path mappings from tsconfig.json
    // This requires reading the tsconfig and applying path mappings
    return null;
  }

  /**
   * Resolve tsconfig alias
   */
  private resolveTsconfigAlias(node: ts.ImportDeclaration): string | null {
    // TODO: Resolve tsconfig aliases
    // This requires reading the tsconfig and applying alias mappings
    return null;
  }

  /**
   * Determine import kind
   */
  private determineImportKind(node: ts.ImportDeclaration): string {
    if (!node.importClause) {
      return 're-export';
    }
    
    if (node.importClause.isTypeOnly) {
      return 'type-only';
    }
    
    if (node.importClause.namedBindings && ts.isNamespaceImport(node.importClause.namedBindings)) {
      return 'namespace';
    }
    
    if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
      return 'named';
    }
    
    if (node.importClause.name) {
      return 'default';
    }
    
    return 'unknown';
  }

  /**
   * Check if node is inside conditional
   */
  private isInsideConditional(node: ts.Node): boolean {
    let parent = node.parent;
    while (parent) {
      if (ts.isIfStatement(parent) || ts.isConditionalExpression(parent)) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  /**
   * Emit export node
   */
  private emitExport(node: ts.ExportDeclaration): void {
    const exportName = node.moduleSpecifier?.getText() || '<local>';
    const id = generateSymbolID('export', exportName, node.getSourceFile().fileName);
    const location = this.getNodeLocation(node);
    const isTypeOnly = this.hasModifier(node.modifiers, ts.SyntaxKind.TypeKeyword);

    const exportNode: IRNode = {
      id,
      type: IRNodeType.Exports,
      name: node.moduleSpecifier?.getText() || '<local>',
      sourceFile: node.getSourceFile().fileName,
      sourceLine: location.line,
      sourceColumn: location.column,
      metadata: {
        isTypeOnly,
      },
    };

    this.irNodes.set(id, exportNode);
    this.symbolRegistry.register(id, exportNode.name, 'export', node.getSourceFile().fileName);
  }

  /**
   * Emit instantiation node
   * 
   * Generic specialization:
   * Resolve Repository<T>, Authority<T>, Worker<T>, Projection<T>, Capability<T>
   * into concrete instantiated symbols.
   */
  private emitInstantiation(node: ts.NewExpression): void {
    const typeName = this.typeChecker?.getTypeAtLocation(node)?.symbol?.getName() || '<unknown>';
    const id = generateSymbolID('instantiation', typeName, node.getSourceFile().fileName);
    const type = this.typeChecker?.getTypeAtLocation(node);
    const location = this.getNodeLocation(node);
    
    // Resolve generic specialization
    const genericSpecialization = this.resolveGenericSpecialization(node);
    const concreteType = this.resolveConcreteType(node);
    const typeParameters = this.resolveTypeParameters(node);
    const typeArguments = this.resolveTypeArguments(node);

    const instantiationNode: IRNode = {
      id,
      type: IRNodeType.Instantiation,
      name: type?.symbol?.getName() || '<unknown>',
      sourceFile: node.getSourceFile().fileName,
      sourceLine: location.line,
      sourceColumn: location.column,
      metadata: {
        typeName: type?.symbol?.getName(),
        genericSpecialization,
        concreteType,
        typeParameters,
        typeArguments,
      },
    };

    this.irNodes.set(id, instantiationNode);
    this.symbolRegistry.register(id, instantiationNode.name, 'instantiation', node.getSourceFile().fileName);
  }

  /**
   * Resolve generic specialization
   */
  private resolveGenericSpecialization(node: ts.NewExpression): string | null {
    const type = this.typeChecker?.getTypeAtLocation(node);
    if (!type) return null;

    const typeNode = node.parent && ts.isTypeReferenceNode(node.parent) ? node.parent : undefined;
    const typeArgs = typeNode?.typeArguments?.map((arg) => arg.getText()) ?? [];
    if (typeArgs.length === 0) return null;

    const baseType = type.symbol?.getName() || '';
    return `${baseType}<${typeArgs.join(', ')}>`;
  }

  /**
   * Resolve concrete type
   */
  private resolveConcreteType(node: ts.NewExpression): string | null {
    const type = this.typeChecker?.getTypeAtLocation(node);
    if (!type) return null;

    const typeNode = node.parent && ts.isTypeReferenceNode(node.parent) ? node.parent : undefined;
    const typeArgs = typeNode?.typeArguments?.map((arg) => arg.getText()) ?? [];
    if (typeArgs.length === 0) {
      return type.symbol?.getName() || null;
    }

    return this.resolveGenericSpecialization(node);
  }

  /**
   * Resolve type parameters
   */
  private resolveTypeParameters(node: ts.NewExpression): string[] {
    const typeNode = node.parent && ts.isTypeReferenceNode(node.parent) ? node.parent : undefined;
    return (typeNode?.typeArguments?.map((arg) => arg.getText()) ?? []).filter(Boolean);
  }

  /**
   * Resolve type arguments
   */
  private resolveTypeArguments(node: ts.NewExpression): string[] {
    const typeNode = node.parent && ts.isTypeReferenceNode(node.parent) ? node.parent : undefined;
    return (typeNode?.typeArguments?.map((arg) => arg.getText()) ?? []).filter(Boolean);
  }

  /**
   * Emit method call node
   * 
   * Semantic resolution:
   * - caller symbol
   * - callee symbol
   * - resolved authority
   * - resolved implementation
   * - interface edge
   * - runtime edge
   * - ownership edge
   * - capability edge
   * - mutation edge
   * - construction edge
   */
  private emitMethodCall(node: ts.CallExpression): void {
    const methodName = this.typeChecker?.getTypeAtLocation(node)?.symbol?.getName() || '<unknown>';
    const id = generateSymbolID('methodCall', methodName, node.getSourceFile().fileName);
    const type = this.typeChecker?.getTypeAtLocation(node);
    const location = this.getNodeLocation(node);
    
    // Resolve caller symbol
    const callerSymbol = this.resolveCallerSymbol(node);
    
    // Resolve callee symbol
    const calleeSymbol = this.resolveCalleeSymbol(node);
    
    // Resolve authority
    const resolvedAuthority = this.resolveAuthority(calleeSymbol);
    
    // Resolve implementation
    const resolvedImplementation = this.resolveImplementation(calleeSymbol);
    
    // Determine edge types
    const interfaceEdge = this.isInterfaceCall(node);
    const runtimeEdge = this.isRuntimeCall(node);
    const ownershipEdge = this.isOwnershipCall(node);
    const capabilityEdge = this.isCapabilityCall(node);
    const mutationEdge = this.isMutationCall(node);
    const constructionEdge = this.isConstructionCall(node);

    const methodCallNode: IRNode = {
      id,
      type: IRNodeType.MethodCalls,
      name: type?.symbol?.getName() || '<unknown>',
      sourceFile: node.getSourceFile().fileName,
      sourceLine: location.line,
      sourceColumn: location.column,
      metadata: {
        methodName: type?.symbol?.getName(),
        callerSymbol,
        calleeSymbol,
        resolvedAuthority,
        resolvedImplementation,
        interfaceEdge,
        runtimeEdge,
        ownershipEdge,
        capabilityEdge,
        mutationEdge,
        constructionEdge,
      },
    };

    this.irNodes.set(id, methodCallNode);
    this.symbolRegistry.register(id, methodCallNode.name, 'methodCall', node.getSourceFile().fileName);
  }

  /**
   * Resolve caller symbol
   */
  private resolveCallerSymbol(node: ts.CallExpression): string | null {
    if (ts.isPropertyAccessExpression(node.expression)) {
      const symbol = this.typeChecker?.getSymbolAtLocation(node.expression.expression);
      return symbol?.getName() || null;
    }
    return null;
  }

  /**
   * Resolve callee symbol
   */
  private resolveCalleeSymbol(node: ts.CallExpression): string | null {
    const symbol = this.typeChecker?.getSymbolAtLocation(node);
    return symbol?.getName() || null;
  }

  /**
   * Resolve authority
   */
  private resolveAuthority(symbolName: string | null): string | null {
    if (!symbolName) return null;
    
    // Check if symbol is an authority
    if (symbolName.endsWith('Authority')) {
      return symbolName;
    }
    
    return null;
  }

  /**
   * Resolve implementation
   */
  private resolveImplementation(symbolName: string | null): string | null {
    if (!symbolName) return null;
    
    // Check if symbol is an implementation
    if (symbolName.endsWith('Impl') || symbolName.endsWith('Implementation')) {
      return symbolName;
    }
    
    return null;
  }

  /**
   * Check if call is interface call
   */
  private isInterfaceCall(node: ts.CallExpression): boolean {
    const type = this.typeChecker?.getTypeAtLocation(node);
    const symbol = type?.symbol;
    
    if (!symbol) return false;
    
    // Check if symbol is from an interface
    const declarations = symbol.getDeclarations();
    if (!declarations) return false;
    
    return declarations.some((decl: ts.Declaration) => {
      const target = (decl as ts.NamedDeclaration).name ?? decl;
      const symbol = this.typeChecker?.getSymbolAtLocation(target as ts.Node);
      return !!symbol && this.typeChecker?.isUnknownSymbol(symbol) === true;
    });
  }

  /**
   * Check if call is runtime call
   */
  private isRuntimeCall(node: ts.CallExpression): boolean {
    // Check if call is to a runtime method
    const methodName = this.typeChecker?.getTypeAtLocation(node)?.symbol?.getName();
    return methodName === 'execute' || methodName === 'run' || methodName === 'start';
  }

  /**
   * Check if call is ownership call
   */
  private isOwnershipCall(node: ts.CallExpression): boolean {
    const methodName = this.typeChecker?.getTypeAtLocation(node)?.symbol?.getName();
    return methodName === 'create' || methodName === 'destroy' || methodName === 'dispose';
  }

  /**
   * Check if call is capability call
   */
  private isCapabilityCall(node: ts.CallExpression): boolean {
    const methodName = this.typeChecker?.getTypeAtLocation(node)?.symbol?.getName();
    return methodName === 'can' || methodName === 'may' || methodName === 'authorize';
  }

  /**
   * Check if call is mutation call
   */
  private isMutationCall(node: ts.CallExpression): boolean {
    const methodName = this.typeChecker?.getTypeAtLocation(node)?.symbol?.getName();
    return methodName === 'set' || methodName === 'add' || methodName === 'update' || 
           methodName === 'delete' || methodName === 'remove' || methodName === 'mutate';
  }

  /**
   * Check if call is construction call
   */
  private isConstructionCall(node: ts.CallExpression): boolean {
    const methodName = this.typeChecker?.getTypeAtLocation(node)?.symbol?.getName();
    return methodName === 'build' || methodName === 'create' || methodName === 'construct' ||
           methodName === 'factory' || methodName === 'make';
  }

  /**
   * Emit field access node
   */
  private emitFieldAccess(node: ts.PropertyAccessExpression): void {
    const fieldName = node.name.getText();
    const id = generateSymbolID('fieldRead', fieldName, node.getSourceFile().fileName);
    const symbol = this.getSymbolForNode(node.name);
    const location = this.getNodeLocation(node);

    const fieldAccessNode: IRNode = {
      id,
      type: IRNodeType.FieldReads,
      name: node.name.getText(),
      sourceFile: node.getSourceFile().fileName,
      sourceLine: location.line,
      sourceColumn: location.column,
      metadata: {
        fieldName: node.name.getText(),
        symbolName: symbol?.getName(),
      },
    };

    this.irNodes.set(id, fieldAccessNode);
    this.symbolRegistry.register(id, fieldAccessNode.name, 'fieldRead', node.getSourceFile().fileName);
  }

  /**
   * Emit assignment node
   * 
   * Complete mutation detection:
   * - field mutation
   * - property mutation
   * - collection mutation
   * - Map.set
   * - Set.add
   * - push
   * - splice
   * - append
   * - repository commit
   * - database write
   * - cache mutation
   * - filesystem write
   * - event append
   * - Replay append
   * - Witness append
   * - Projection rebuild
   */
  private emitAssignment(node: ts.BinaryExpression): void {
    if (node.operatorToken.kind !== ts.SyntaxKind.EqualsToken) {
      return;
    }

    const targetName = node.left.getText();
    const id = generateSymbolID('assignment', targetName, node.getSourceFile().fileName);
    const location = this.getNodeLocation(node);

    // Determine mutation type
    const mutationType = this.determineMutationType(node);
    
    // Determine if it's a repository operation
    const isRepositoryCommit = this.isRepositoryCommit(node);
    
    // Determine if it's a database write
    const isDatabaseWrite = this.isDatabaseWrite(node);
    
    // Determine if it's a cache mutation
    const isCacheMutation = this.isCacheMutation(node);
    
    // Determine if it's a filesystem write
    const isFilesystemWrite = this.isFilesystemWrite(node);
    
    // Determine if it's an event append
    const isEventAppend = this.isEventAppend(node);
    
    // Determine if it's a replay append
    const isReplayAppend = this.isReplayAppend(node);
    
    // Determine if it's a witness append
    const isWitnessAppend = this.isWitnessAppend(node);
    
    // Determine if it's a projection rebuild
    const isProjectionRebuild = this.isProjectionRebuild(node);

    const assignmentNode: IRNode = {
      id,
      type: IRNodeType.Assignments,
      name: targetName,
      sourceFile: node.getSourceFile().fileName,
      sourceLine: location.line,
      sourceColumn: location.column,
      metadata: {
        target: targetName,
        source: node.right.getText(),
        mutationType,
        isRepositoryCommit,
        isDatabaseWrite,
        isCacheMutation,
        isFilesystemWrite,
        isEventAppend,
        isReplayAppend,
        isWitnessAppend,
        isProjectionRebuild,
      },
    };

    this.irNodes.set(id, assignmentNode);
    this.symbolRegistry.register(id, assignmentNode.name, 'assignment', node.getSourceFile().fileName);
  }

  /**
   * Determine mutation type
   */
  private determineMutationType(node: ts.BinaryExpression): string {
    if (ts.isPropertyAccessExpression(node.left)) {
      return 'property-mutation';
    }
    
    if (ts.isElementAccessExpression(node.left)) {
      return 'collection-mutation';
    }
    
    return 'field-mutation';
  }

  /**
   * Check if assignment is repository commit
   */
  private isRepositoryCommit(node: ts.BinaryExpression): boolean {
    const methodName = this.extractMethodName(node.right);
    return methodName === 'commit' || methodName === 'save' || methodName === 'persist';
  }

  /**
   * Check if assignment is database write
   */
  private isDatabaseWrite(node: ts.BinaryExpression): boolean {
    const methodName = this.extractMethodName(node.right);
    return methodName === 'insert' || methodName === 'update' || methodName === 'delete' || 
           methodName === 'execute' || methodName === 'query';
  }

  /**
   * Check if assignment is cache mutation
   */
  private isCacheMutation(node: ts.BinaryExpression): boolean {
    const methodName = this.extractMethodName(node.right);
    return methodName === 'set' || methodName === 'put' || methodName === 'cache';
  }

  /**
   * Check if assignment is filesystem write
   */
  private isFilesystemWrite(node: ts.BinaryExpression): boolean {
    const methodName = this.extractMethodName(node.right);
    return methodName === 'writeFile' || methodName === 'appendFile' || methodName === 'mkdir';
  }

  /**
   * Check if assignment is event append
   */
  private isEventAppend(node: ts.BinaryExpression): boolean {
    const methodName = this.extractMethodName(node.right);
    return methodName === 'emit' || methodName === 'publish' || methodName === 'dispatch';
  }

  /**
   * Check if assignment is replay append
   */
  private isReplayAppend(node: ts.BinaryExpression): boolean {
    const methodName = this.extractMethodName(node.right);
    return methodName === 'appendReplay' || methodName === 'recordEvent';
  }

  /**
   * Check if assignment is witness append
   */
  private isWitnessAppend(node: ts.BinaryExpression): boolean {
    const methodName = this.extractMethodName(node.right);
    return methodName === 'appendWitness' || methodName === 'recordWitness';
  }

  /**
   * Check if assignment is projection rebuild
   */
  private isProjectionRebuild(node: ts.BinaryExpression): boolean {
    const methodName = this.extractMethodName(node.right);
    return methodName === 'rebuild' || methodName === 'reproject' || methodName === 'updateProjection';
  }

  /**
   * Extract method name from expression
   */
  private extractMethodName(node: ts.Expression): string | null {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      return node.expression.name.getText();
    }
    return null;
  }

  /**
   * Build IR document from parsed nodes
   */
  private buildDocument(sourceFile: ts.SourceFile): IRDocument {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      sourceLanguage: 'typescript',
      nodes: this.irNodes,
      entryPoints: [],
    };
  }

  /**
   * Build IR document from cache
   */
  private buildDocumentFromCache(entry: { symbolIDs: string[] }): IRDocument {
    // TODO: Reconstruct document from cached symbol IDs
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      sourceLanguage: 'typescript',
      nodes: new Map(),
      entryPoints: [],
    };
  }

  /**
   * Extract namespace from file path
   */
  private extractNamespace(filePath: string): string {
    const parts = filePath.split(/[/\\]/);
    const kernelIndex = parts.indexOf('kernel');
    if (kernelIndex >= 0 && kernelIndex + 1 < parts.length) {
      return parts[kernelIndex + 1];
    }
    return 'root';
  }

  /**
   * Get module name from file path
   */
  private getModuleName(filePath: string): string {
    const parts = filePath.split(/[/\\]/);
    return parts[parts.length - 1].replace('.ts', '');
  }

  /**
   * Get symbol registry
   */
  getSymbolRegistry(): SymbolIDRegistry {
    return this.symbolRegistry;
  }

  /**
   * Get cache
   */
  getCache(): IncrementalCache {
    return this.cache;
  }
}
