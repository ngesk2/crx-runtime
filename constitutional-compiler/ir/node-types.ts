/**
 * Intermediate Representation (IR) Node Types
 * 
 * All frontends must emit identical IR.
 * Nothing operates directly on ASTs.
 * 
 * Compiler IR should represent architectural semantics, not AST structure.
 * AST nodes should disappear after lowering.
 * Everything downstream consumes semantic IR only.
 */

/**
 * Stable UUID for every symbol
 * Paths change, symbols don't
 */
export type SymbolID = string;

/**
 * IR Node Types
 */
export enum IRNodeType {
  // Structural
  Module = 'Module',
  Namespace = 'Namespace',
  
  // Type Definitions
  Interface = 'Interface',
  AbstractClass = 'AbstractClass',
  ConcreteClass = 'ConcreteClass',
  
  // Behavioral
  Function = 'Function',
  Method = 'Method',
  Constructor = 'Constructor',
  Factory = 'Factory',
  Builder = 'Builder',
  
  // Constitutional
  Event = 'Event',
  Authority = 'Authority',
  Provider = 'Provider',
  Capability = 'Capability',
  
  // Data
  DTO = 'DTO',
  ValueObject = 'ValueObject',
  Primitive = 'Primitive',
  
  // Architectural
  Service = 'Service',
  Repository = 'Repository',
  Worker = 'Worker',
  Mission = 'Mission',
  Witness = 'Witness',
  Projection = 'Projection',
  Knowledge = 'Knowledge',
  Scheduler = 'Scheduler',
  Replay = 'Replay',
  Governance = 'Governance',
  Identity = 'Identity',
  
  // Operations
  Imports = 'Imports',
  Exports = 'Exports',
  Assignments = 'Assignments',
  MethodCalls = 'MethodCalls',
  FieldReads = 'FieldReads',
  FieldWrites = 'FieldWrites',
  Instantiation = 'Instantiation',
  Persistence = 'Persistence',
  Hashing = 'Hashing',
  Signing = 'Signing',
  Verification = 'Verification',
  
  // Constitutional Violations
  TimeSource = 'TimeSource',
  RandomSource = 'RandomSource',
  DynamicImport = 'DynamicImport',
  Reflection = 'Reflection',
  
  // Semantic IR Concepts (architectural semantics, not AST structure)
  AuthorityOwnership = 'AuthorityOwnership',
  CapabilityBoundary = 'CapabilityBoundary',
  ConstitutionalRoot = 'ConstitutionalRoot',
  LayerBoundary = 'LayerBoundary',
  MutationSite = 'MutationSite',
  PersistenceSite = 'PersistenceSite',
  TrustBoundary = 'TrustBoundary',
  EventPublication = 'EventPublication',
  EventSubscription = 'EventSubscription',
  ConstructionBoundary = 'ConstructionBoundary',
  RepositoryBoundary = 'RepositoryBoundary',
  IdentityBoundary = 'IdentityBoundary',
  WitnessBoundary = 'WitnessBoundary',
}

/**
 * Base IR Node
 */
export interface IRNode {
  id: SymbolID;
  type: IRNodeType;
  name: string;
  sourceFile: string;
  sourceLine: number;
  sourceColumn: number;
  metadata: Record<string, unknown>;
}

/**
 * Structural Nodes
 */
export interface ModuleNode extends IRNode {
  type: IRNodeType.Module;
  namespace: string;
  imports: ImportNode[];
  exports: ExportNode[];
}

export interface NamespaceNode extends IRNode {
  type: IRNodeType.Namespace;
  parent: SymbolID | null;
  children: SymbolID[];
}

/**
 * Type Definition Nodes
 */
export interface InterfaceNode extends IRNode {
  type: IRNodeType.Interface;
  extends: SymbolID[];
  methods: SymbolID[];
  properties: SymbolID[];
}

export interface AbstractClassNode extends IRNode {
  type: IRNodeType.AbstractClass;
  extends: SymbolID | null;
  implements: SymbolID[];
  methods: SymbolID[];
  properties: SymbolID[];
}

export interface ConcreteClassNode extends IRNode {
  type: IRNodeType.ConcreteClass;
  extends: SymbolID | null;
  implements: SymbolID[];
  methods: SymbolID[];
  properties: SymbolID[];
  constructor: SymbolID | null;
}

/**
 * Behavioral Nodes
 */
export interface FunctionNode extends IRNode {
  type: IRNodeType.Function;
  parameters: Parameter[];
  returnType: SymbolID | null;
  body: SymbolID[];
  isAsync: boolean;
}

export interface MethodNode extends IRNode {
  type: IRNodeType.Method;
  class: SymbolID;
  parameters: Parameter[];
  returnType: SymbolID | null;
  body: SymbolID[];
  isAsync: boolean;
  isStatic: boolean;
}

export interface ConstructorNode extends IRNode {
  type: IRNodeType.Constructor;
  class: SymbolID;
  parameters: Parameter[];
  body: SymbolID[];
}

export interface FactoryNode extends IRNode {
  type: IRNodeType.Factory;
  produces: SymbolID;
  parameters: Parameter[];
  body: SymbolID[];
}

export interface BuilderNode extends IRNode {
  type: IRNodeType.Builder;
  produces: SymbolID;
  methods: SymbolID[];
}

/**
 * Constitutional Nodes
 */
export interface EventNode extends IRNode {
  type: IRNodeType.Event;
  payload: SymbolID[];
  publisher: SymbolID | null;
}

export interface AuthorityNode extends IRNode {
  type: IRNodeType.Authority;
  interface: SymbolID | null;
  implementation: SymbolID | null;
  owns: SymbolID[];
}

export interface ProviderNode extends IRNode {
  type: IRNodeType.Provider;
  provides: SymbolID;
  interface: SymbolID | null;
}

export interface CapabilityNode extends IRNode {
  type: IRNodeType.Capability;
  input: SymbolID[];
  output: SymbolID[];
  executor: SymbolID | null;
}

/**
 * Data Nodes
 */
export interface DTONode extends IRNode {
  type: IRNodeType.DTO;
  fields: Field[];
}

export interface ValueObjectNode extends IRNode {
  type: IRNodeType.ValueObject;
  fields: Field[];
  isImmutable: boolean;
}

export interface PrimitiveNode extends IRNode {
  type: IRNodeType.Primitive;
  primitiveType: 'string' | 'number' | 'boolean' | 'null' | 'undefined' | 'symbol' | 'bigint';
}

/**
 * Architectural Nodes
 */
export interface ServiceNode extends IRNode {
  type: IRNodeType.Service;
  isSingleton: boolean;
}

export interface RepositoryNode extends IRNode {
  type: IRNodeType.Repository;
  entityType: SymbolID;
  persistenceType: string;
}

export interface WorkerNode extends IRNode {
  type: IRNodeType.Worker;
  capabilities: SymbolID[];
}

export interface MissionNode extends IRNode {
  type: IRNodeType.Mission;
  tasks: SymbolID[];
}

export interface WitnessNode extends IRNode {
  type: IRNodeType.Witness;
  verifies: SymbolID[];
}

export interface ProjectionNode extends IRNode {
  type: IRNodeType.Projection;
  source: SymbolID[];
  target: SymbolID[];
}

export interface KnowledgeNode extends IRNode {
  type: IRNodeType.Knowledge;
  facts: SymbolID[];
}

export interface SchedulerNode extends IRNode {
  type: IRNodeType.Scheduler;
  schedules: SymbolID[];
}

export interface ReplayNode extends IRNode {
  type: IRNodeType.Replay;
  events: SymbolID[];
}

export interface GovernanceNode extends IRNode {
  type: IRNodeType.Governance;
  policies: SymbolID[];
}

export interface IdentityNode extends IRNode {
  type: IRNodeType.Identity;
  isConstitutional: boolean;
}

/**
 * Operation Nodes
 */
export interface ImportNode extends IRNode {
  type: IRNodeType.Imports;
  source: string;
  importedSymbol: SymbolID;
  isTypeOnly: boolean;
}

export interface ExportNode extends IRNode {
  type: IRNodeType.Exports;
  exportedSymbol: SymbolID;
  isTypeOnly: boolean;
  isDefault: boolean;
}

export interface AssignmentNode extends IRNode {
  type: IRNodeType.Assignments;
  target: SymbolID;
  source: SymbolID;
}

export interface MethodCallNode extends IRNode {
  type: IRNodeType.MethodCalls;
  target: SymbolID | null;
  method: SymbolID;
  arguments: SymbolID[];
}

export interface FieldReadNode extends IRNode {
  type: IRNodeType.FieldReads;
  target: SymbolID;
  field: SymbolID;
}

export interface FieldWriteNode extends IRNode {
  type: IRNodeType.FieldWrites;
  target: SymbolID;
  field: SymbolID;
  value: SymbolID;
}

export interface InstantiationNode extends IRNode {
  type: IRNodeType.Instantiation;
  class: SymbolID;
  arguments: SymbolID[];
}

export interface PersistenceNode extends IRNode {
  type: IRNodeType.Persistence;
  target: SymbolID;
  operation: 'read' | 'write' | 'delete' | 'update';
  storageType: string;
}

export interface HashingNode extends IRNode {
  type: IRNodeType.Hashing;
  target: SymbolID;
  algorithm: string;
}

export interface SigningNode extends IRNode {
  type: IRNodeType.Signing;
  target: SymbolID;
  key: SymbolID;
}

export interface VerificationNode extends IRNode {
  type: IRNodeType.Verification;
  target: SymbolID;
  signature: SymbolID;
  key: SymbolID;
}

/**
 * Constitutional Violation Nodes
 */
export interface TimeSourceNode extends IRNode {
  type: IRNodeType.TimeSource;
  method: string;
}

export interface RandomSourceNode extends IRNode {
  type: IRNodeType.RandomSource;
  method: string;
}

export interface DynamicImportNode extends IRNode {
  type: IRNodeType.DynamicImport;
  source: string;
}

export interface ReflectionNode extends IRNode {
  type: IRNodeType.Reflection;
  method: string;
  target: SymbolID | null;
}

/**
 * Helper Types
 */
export interface Parameter {
  name: string;
  type: SymbolID | null;
  isOptional: boolean;
}

export interface Field {
  name: string;
  type: SymbolID | null;
  isReadonly: boolean;
}

/**
 * IR Document
 * Root container for all IR nodes
 */
export interface IRDocument {
  version: string;
  timestamp: string;
  sourceLanguage: string;
  nodes: Map<SymbolID, IRNode>;
  entryPoints: SymbolID[];
}
