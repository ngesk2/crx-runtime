/**
 * Canonical Symbol Objects
 * 
 * Ω.62 — Canonical Symbol Objects
 * 
 * Language-independent canonical kinds:
 * 
 * Rust: fn add()
 * TypeScript: function add()
 * Go: func Add()
 * 
 * should all produce:
 * 
 * FunctionObject
 * 
 * Constitutional Constraint: Language disappears.
 * Identity derives only from canonical kind, name, signature, relationships.
 * Language becomes provenance metadata, not authority.
 */

const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class CanonicalSymbolMapper {
  constructor() {
    this._languageKindMap = new Map();
    this._canonicalKindMap = new Map();
    this._initialized = false;
  }

  /**
   * Initialize canonical symbol mapper
   */
  initialize() {
    this._buildLanguageKindMap();
    this._buildCanonicalKindMap();
    this._initialized = true;
    console.log('[CanonicalSymbolMapper] Initialized with', this._languageKindMap.size, 'language mappings');
  }

  /**
   * Build language-to-canonical kind mapping
   */
  _buildLanguageKindMap() {
    // Rust mappings
    this._languageKindMap.set('rust:fn', 'Function');
    this._languageKindMap.set('rust:struct', 'Struct');
    this._languageKindMap.set('rust:enum', 'Enum');
    this._languageKindMap.set('rust:impl', 'Implementation');
    this._languageKindMap.set('rust:trait', 'Trait');
    this._languageKindMap.set('rust:mod', 'Module');
    this._languageKindMap.set('rust:use', 'Import');
    this._languageKindMap.set('rust:pub', 'Visibility');
    this._languageKindMap.set('rust:const', 'Constant');
    this._languageKindMap.set('rust:static', 'Static');
    this._languageKindMap.set('rust:let', 'Variable');
    this._languageKindMap.set('rust:mut', 'Mutability');
    this._languageKindMap.set('rust:ref', 'Reference');
    this._languageKindMap.set('rust:box', 'Box');
    this._languageKindMap.set('rust:arc', 'Arc');
    this._languageKindMap.set('rust:mutex', 'Mutex');
    this._languageKindMap.set('rust:channel', 'Channel');
    this._languageKindMap.set('rust:async', 'Async');
    this._languageKindMap.set('rust:await', 'Await');
    this._languageKindMap.set('rust:macro', 'Macro');

    // TypeScript/JavaScript mappings
    this._languageKindMap.set('typescript:function', 'Function');
    this._languageKindMap.set('javascript:function', 'Function');
    this._languageKindMap.set('typescript:arrow_function', 'Function');
    this._languageKindMap.set('javascript:arrow_function', 'Function');
    this._languageKindMap.set('typescript:class', 'Class');
    this._languageKindMap.set('javascript:class', 'Class');
    this._languageKindMap.set('typescript:interface', 'Interface');
    this._languageKindMap.set('typescript:type', 'TypeAlias');
    this._languageKindMap.set('typescript:enum', 'Enum');
    this._languageKindMap.set('javascript:object', 'Object');
    this._languageKindMap.set('typescript:const', 'Constant');
    this._languageKindMap.set('javascript:const', 'Constant');
    this._languageKindMap.set('typescript:let', 'Variable');
    this._languageKindMap.set('javascript:let', 'Variable');
    this._languageKindMap.set('typescript:var', 'Variable');
    this._languageKindMap.set('javascript:var', 'Variable');
    this._languageKindMap.set('typescript:import', 'Import');
    this._languageKindMap.set('javascript:import', 'Import');
    this._languageKindMap.set('typescript:export', 'Export');
    this._languageKindMap.set('javascript:export', 'Export');
    this._languageKindMap.set('typescript:default', 'Default');
    this._languageKindMap.set('javascript:default', 'Default');
    this._languageKindMap.set('typescript:async', 'Async');
    this._languageKindMap.set('javascript:async', 'Async');
    this._languageKindMap.set('typescript:await', 'Await');
    this._languageKindMap.set('javascript:await', 'Await');
    this._languageKindMap.set('typescript:decorator', 'Decorator');
    this._languageKindMap.set('javascript:decorator', 'Decorator');
    this._languageKindMap.set('typescript:generator', 'Generator');
    this._languageKindMap.set('javascript:generator', 'Generator');

    // Go mappings
    this._languageKindMap.set('go:func', 'Function');
    this._languageKindMap.set('go:struct', 'Struct');
    this._languageKindMap.set('go:interface', 'Interface');
    this._languageKindMap.set('go:method', 'Method');
    this._languageKindMap.set('go:package', 'Package');
    this._languageKindMap.set('go:import', 'Import');
    this._languageKindMap.set('go:const', 'Constant');
    this._languageKindMap.set('go:var', 'Variable');
    this._languageKindMap.set('go:type', 'TypeAlias');
    this._languageKindMap.set('go:chan', 'Channel');
    this._languageKindMap.set('go:go', 'Goroutine');
    this._languageKindMap.set('go:select', 'Select');
    this._languageKindMap.set('go:defer', 'Defer');
    this._languageKindMap.set('go:panic', 'Panic');
    this._languageKindMap.set('go:recover', 'Recover');
    this._languageKindMap.set('go:mutex', 'Mutex');
    this._languageKindMap.set('go:waitgroup', 'WaitGroup');

    // C# mappings
    this._languageKindMap.set('csharp:method', 'Method');
    this._languageKindMap.set('csharp:function', 'Function');
    this._languageKindMap.set('csharp:class', 'Class');
    this._languageKindMap.set('csharp:interface', 'Interface');
    this._languageKindMap.set('csharp:struct', 'Struct');
    this._languageKindMap.set('csharp:enum', 'Enum');
    this._languageKindMap.set('csharp:namespace', 'Namespace');
    this._languageKindMap.set('csharp:using', 'Import');
    this._languageKindMap.set('csharp:const', 'Constant');
    this._languageKindMap.set('csharp:readonly', 'ReadOnly');
    this._languageKindMap.set('csharp:property', 'Property');
    this._languageKindMap.set('csharp:event', 'Event');
    this._languageKindMap.set('csharp:delegate', 'Delegate');
    this._languageKindMap.set('csharp:async', 'Async');
    this._languageKindMap.set('csharp:await', 'Await');
    this._languageKindMap.set('csharp:task', 'Task');
    this._languageKindMap.set('csharp:attribute', 'Attribute');

    // Java mappings
    this._languageKindMap.set('java:method', 'Method');
    this._languageKindMap.set('java:function', 'Function');
    this._languageKindMap.set('java:class', 'Class');
    this._languageKindMap.set('java:interface', 'Interface');
    this._languageKindMap.set('java:enum', 'Enum');
    this._languageKindMap.set('java:package', 'Package');
    this._languageKindMap.set('java:import', 'Import');
    this._languageKindMap.set('java:final', 'Final');
    this._languageKindMap.set('java:static', 'Static');
    this._languageKindMap.set('java:abstract', 'Abstract');
    this._languageKindMap.set('java:extends', 'Extends');
    this._languageKindMap.set('java:implements', 'Implements');
    this._languageKindMap.set('java:annotation', 'Annotation');
    this._languageKindMap.set('java:generics', 'Generic');
    this._languageKindMap.set('java:exception', 'Exception');
    this._languageKindMap.set('java:throw', 'Throw');
    this._languageKindMap.set('java:throws', 'Throws');
    this._languageKindMap.set('java:try', 'Try');
    this._languageKindMap.set('java:catch', 'Catch');
    this._languageKindMap.set('java:finally', 'Finally');
    this._languageKindMap.set('java:synchronized', 'Synchronized');
    this._languageKindMap.set('java:volatile', 'Volatile');
    this._languageKindMap.set('java:transient', 'Transient');

    // Python mappings
    this._languageKindMap.set('python:def', 'Function');
    this._languageKindMap.set('python:lambda', 'Function');
    this._languageKindMap.set('python:class', 'Class');
    this._languageKindMap.set('python:method', 'Method');
    this._languageKindMap.set('python:function', 'Function');
    this._languageKindMap.set('python:import', 'Import');
    this._languageKindMap.set('python:from', 'Import');
    this._languageKindMap.set('python:module', 'Module');
    this._languageKindMap.set('python:package', 'Package');
    this._languageKindMap.set('python:const', 'Constant');
    this._languageKindMap.set('python:var', 'Variable');
    this._languageKindMap.set('python:global', 'Global');
    this._languageKindMap.set('python:nonlocal', 'NonLocal');
    this._languageKindMap.set('python:async', 'Async');
    this._languageKindMap.set('python:await', 'Await');
    this._languageKindMap.set('python:yield', 'Yield');
    this._languageKindMap.set('python:decorator', 'Decorator');
    this._languageKindMap.set('python:property', 'Property');
    this._languageKindMap.set('python:staticmethod', 'StaticMethod');
    this._languageKindMap.set('python:classmethod', 'ClassMethod');
    this._languageKindMap.set('python:exception', 'Exception');
    this._languageKindMap.set('python:try', 'Try');
    this._languageKindMap.set('python:except', 'Except');
    this._languageKindMap.set('python:finally', 'Finally');
    this._languageKindMap.set('python:with', 'ContextManager');

    // C mappings
    this._languageKindMap.set('c:function', 'Function');
    this._languageKindMap.set('c:struct', 'Struct');
    this._languageKindMap.set('c:enum', 'Enum');
    this._languageKindMap.set('c:union', 'Union');
    this._languageKindMap.set('c:typedef', 'TypeAlias');
    this._languageKindMap.set('c:const', 'Constant');
    this._languageKindMap.set('c:static', 'Static');
    this._languageKindMap.set('c:extern', 'Extern');
    this._languageKindMap.set('c:volatile', 'Volatile');
    this._languageKindMap.set('c:pointer', 'Pointer');
    this._languageKindMap.set('c:array', 'Array');
    this._languageKindMap.set('c:include', 'Import');
    this._languageKindMap.set('c:define', 'Macro');
    this._languageKindMap.set('c:ifdef', 'Conditional');
    this._languageKindMap.set('c:goto', 'Goto');
    this._languageKindMap.set('c:sizeof', 'SizeOf');

    // C++ mappings
    this._languageKindMap.set('cpp:function', 'Function');
    this._languageKindMap.set('cpp:method', 'Method');
    this._languageKindMap.set('cpp:class', 'Class');
    this._languageKindMap.set('cpp:struct', 'Struct');
    this._languageKindMap.set('cpp:enum', 'Enum');
    this._languageKindMap.set('cpp:union', 'Union');
    this._languageKindMap.set('cpp:namespace', 'Namespace');
    this._languageKindMap.set('cpp:template', 'Template');
    this._languageKindMap.set('cpp:using', 'Import');
    this._languageKindMap.set('cpp:include', 'Import');
    this._languageKindMap.set('cpp:const', 'Constant');
    this._languageKindMap.set('cpp:static', 'Static');
    this._languageKindMap.set('cpp:extern', 'Extern');
    this._languageKindMap.set('cpp:volatile', 'Volatile');
    this._languageKindMap.set('cpp:virtual', 'Virtual');
    this._languageKindMap.set('cpp:override', 'Override');
    this._languageKindMap.set('cpp:final', 'Final');
    this._languageKindMap.set('cpp:abstract', 'Abstract');
    this._languageKindMap.set('cpp:friend', 'Friend');
    this._languageKindMap.set('cpp:operator', 'Operator');
    this._languageKindMap.set('cpp:lambda', 'Function');
    this._languageKindMap.set('cpp:auto', 'TypeInference');
    this._languageKindMap.set('cpp:decltype', 'TypeInference');
    this._languageKindMap.set('cpp:constexpr', 'ConstantExpression');
    this._languageKindMap.set('cpp:noexcept', 'NoExcept');
    this._languageKindMap.set('cpp:try', 'Try');
    this._languageKindMap.set('cpp:catch', 'Catch');
    this._languageKindMap.set('cpp:throw', 'Throw');
    this._languageKindMap.set('cpp:exception', 'Exception');
    this._languageKindMap.set('cpp:smart_pointer', 'SmartPointer');
    this._languageKindMap.set('cpp:shared_ptr', 'SharedPointer');
    this._languageKindMap.set('cpp:unique_ptr', 'UniquePointer');
    this._languageKindMap.set('cpp:weak_ptr', 'WeakPointer');

    // Zig mappings
    this._languageKindMap.set('zig:fn', 'Function');
    this._languageKindMap.set('zig:struct', 'Struct');
    this._languageKindMap.set('zig:enum', 'Enum');
    this._languageKindMap.set('zig:union', 'Union');
    this._languageKindMap.set('zig:const', 'Constant');
    this._languageKindMap.set('zig:var', 'Variable');
    this._languageKindMap.set('zig:comptime', 'CompileTime');
    this._languageKindMap.set('zig:async', 'Async');
    this._languageKindMap.set('zig:await', 'Await');
    this._languageKindMap.set('zig:defer', 'Defer');
    this._languageKindMap.set('zig:error', 'Error');
    this._languageKindMap.set('zig:try', 'Try');
    this._languageKindMap.set('zig:catch', 'Catch');
    this._languageKindMap.set('zig:test', 'Test');
    this._languageKindMap.set('zig:pub', 'Visibility');
    this._languageKindMap.set('zig:usingnamespace', 'Import');

    // Swift mappings
    this._languageKindMap.set('swift:func', 'Function');
    this._languageKindMap.set('swift:class', 'Class');
    this._languageKindMap.set('swift:struct', 'Struct');
    this._languageKindMap.set('swift:enum', 'Enum');
    this._languageKindMap.set('swift:protocol', 'Interface');
    this._languageKindMap.set('swift:extension', 'Extension');
    this._languageKindMap.set('swift:import', 'Import');
    this._languageKindMap.set('swift:let', 'Constant');
    this._languageKindMap.set('swift:var', 'Variable');
    this._languageKindMap.set('swift:lazy', 'Lazy');
    this._languageKindMap.set('swift:mutating', 'Mutating');
    this._languageKindMap.set('swift:final', 'Final');
    this._languageKindMap.set('swift:private', 'Private');
    this._languageKindMap.set('swift:fileprivate', 'FilePrivate');
    this._languageKindMap.set('swift:internal', 'Internal');
    this._languageKindMap.set('swift:public', 'Public');
    this._languageKindMap.set('swift:open', 'Open');
    this._languageKindMap.set('swift:static', 'Static');
    this._languageKindMap.set('swift:class', 'Class');
    this._languageKindMap.set('swift:override', 'Override');
    this._languageKindMap.set('swift:convenience', 'Convenience');
    this._languageKindMap.set('swift:required', 'Required');
    this._languageKindMap.set('swift:optional', 'Optional');
    this._languageKindMap.set('swift:force', 'Force');
    this._languageKindMap.set('swift:try', 'Try');
    this._languageKindMap.set('swift:catch', 'Catch');
    this._languageKindMap.set('swift:throw', 'Throw');
    this._languageKindMap.set('swift:defer', 'Defer');
    this._languageKindMap.set('swift:guard', 'Guard');
    this._languageKindMap.set('swift:where', 'Where');
    this._languageKindMap.set('swift:associatedtype', 'AssociatedType');
    this._languageKindMap.set('swift:generics', 'Generic');
    this._languageKindMap.set('swift:closure', 'Function');
    this._languageKindMap.set('swift:escaping', 'Escaping');
    this._languageKindMap.set('swift:autoclosure', 'AutoClosure');
    this._languageKindMap.set('swift:@escaping', 'Escaping');
    this._languageKindMap.set('swift:@autoclosure', 'AutoClosure');

    // Kotlin mappings
    this._languageKindMap.set('kotlin:fun', 'Function');
    this._languageKindMap.set('kotlin:class', 'Class');
    this._languageKindMap.set('kotlin:interface', 'Interface');
    this._languageKindMap.set('kotlin:object', 'Object');
    this._languageKindMap.set('kotlin:enum', 'Enum');
    this._languageKindMap.set('kotlin:sealed', 'Sealed');
    this._languageKindMap.set('kotlin:data', 'DataClass');
    this._languageKindMap.set('kotlin:value', 'ValueClass');
    this._languageKindMap.set('kotlin:companion', 'CompanionObject');
    this._languageKindMap.set('kotlin:package', 'Package');
    this._languageKindMap.set('kotlin:import', 'Import');
    this._languageKindMap.set('kotlin:val', 'Constant');
    this._languageKindMap.set('kotlin:var', 'Variable');
    this._languageKindMap.set('kotlin:const', 'Constant');
    this._languageKindMap.set('kotlin:lateinit', 'LateInit');
    this._languageKindMap.set('kotlin:lazy', 'Lazy');
    this._languageKindMap.set('kotlin:init', 'Initializer');
    this._languageKindMap.set('kotlin:get', 'Getter');
    this._languageKindMap.set('kotlin:set', 'Setter');
    this._languageKindMap.set('kotlin:override', 'Override');
    this._languageKindMap.set('kotlin:open', 'Open');
    this._languageKindMap.set('kotlin:private', 'Private');
    this._languageKindMap.set('kotlin:protected', 'Protected');
    this._languageKindMap.set('kotlin:public', 'Public');
    this._languageKindMap.set('kotlin:internal', 'Internal');
    this._languageKindMap.set('kotlin:suspend', 'Suspend');
    this._languageKindMap.set('kotlin:async', 'Async');
    this._languageKindMap.set('kotlin:await', 'Await');
    this._languageKindMap.set('kotlin:coroutine', 'Coroutine');
    this._languageKindMap.set('kotlin:flow', 'Flow');
    this._languageKindMap.set('kotlin:channel', 'Channel');
    this._languageKindMap.set('kotlin:generics', 'Generic');
    this._languageKindMap.set('kotlin:reified', 'Reified');
    this._languageKindMap.set('kotlin:inline', 'Inline');
    this._languageKindMap.set('kotlin:noinline', 'NoInline');
    this._languageKindMap.set('kotlin:crossinline', 'CrossInline');
    this._languageKindMap.set('kotlin:tailrec', 'TailRecursive');
    this._languageKindMap.set('kotlin:infix', 'Infix');
    this._languageKindMap.set('kotlin:operator', 'Operator');
    this._languageKindMap.set('kotlin:extension', 'Extension');
    this._languageKindMap.set('kotlin:annotation', 'Annotation');

    // Lua mappings
    this._languageKindMap.set('lua:function', 'Function');
    this._languageKindMap.set('lua:local', 'Local');
    this._languageKindMap.set('lua:global', 'Global');
    this._languageKindMap.set('lua:require', 'Import');
    this._languageKindMap.set('lua:module', 'Module');
    this._languageKindMap.set('lua:return', 'Return');
    this._languageKindMap.set('lua:if', 'Conditional');
    this._languageKindMap.set('lua:for', 'Loop');
    this._languageKindMap.set('lua:while', 'Loop');
    this._languageKindMap.set('lua:repeat', 'Loop');
    this._languageKindMap.set('lua:do', 'Block');
    this._languageKindMap.set('lua:end', 'End');
    this._languageKindMap.set('lua:table', 'Table');
    this._languageKindMap.set('lua:metatable', 'Metatable');
    this._languageKindMap.set('lua:coroutine', 'Coroutine');
    this._languageKindMap.set('lua:yield', 'Yield');
    this._languageKindMap.set('lua:resume', 'Resume');
    this._languageKindMap.set('lua:pcall', 'ProtectedCall');
    this._languageKindMap.set('lua:xpcall', 'ExtendedProtectedCall');
    this._languageKindMap.set('lua:error', 'Error');
    this._languageKindMap.set('lua:assert', 'Assert');
    this._languageKindMap.set('lua:pair', 'Pair');
    this._languageKindMap.set('lua:ipairs', 'Iterate');
    this._languageKindMap.set('lua:pairs', 'Iterate');

    // Ruby mappings
    this._languageKindMap.set('ruby:def', 'Function');
    this._languageKindMap.set('ruby:class', 'Class');
    this._languageKindMap.set('ruby:module', 'Module');
    this._languageKindMap.set('ruby:method', 'Method');
    this._languageKindMap.set('ruby:initialize', 'Constructor');
    this._languageKindMap.set('ruby:attr_reader', 'Property');
    this._languageKindMap.set('ruby:attr_writer', 'Property');
    this._languageKindMap.set('ruby:attr_accessor', 'Property');
    this._languageKindMap.set('ruby:require', 'Import');
    this._languageKindMap.set('ruby:include', 'Mixin');
    this._languageKindMap.set('ruby:extend', 'Mixin');
    this._languageKindMap.set('ruby:prepend', 'Mixin');
    this._languageKindMap.set('ruby:private', 'Private');
    this._languageKindMap.set('ruby:protected', 'Protected');
    this._languageKindMap.set('ruby:public', 'Public');
    this._languageKindMap.set('ruby:attr', 'Attribute');
    this._languageKindMap.set('ruby:alias', 'Alias');
    this._languageKindMap.set('ruby:alias_method', 'Alias');
    this._languageKindMap.set('ruby:undef', 'Undef');
    this._languageKindMap.set('ruby:defined?', 'Defined');
    this._languageKindMap.set('ruby:block', 'Block');
    this._languageKindMap.set('ruby:proc', 'Proc');
    this._languageKindMap.set('ruby:lambda', 'Function');
    this._languageKindMap.set('ruby:yield', 'Yield');
    this._languageKindMap.set('ruby:begin', 'Begin');
    this._languageKindMap.set('ruby:rescue', 'Rescue');
    this._languageKindMap.set('ruby:ensure', 'Ensure');
    this._languageKindMap.set('ruby:raise', 'Raise');
    this._languageKindMap.set('ruby:catch', 'Catch');
    this._languageKindMap.set('ruby:throw', 'Throw');
    this._languageKindMap.set('ruby:self', 'Self');
    this._languageKindMap.set('ruby:super', 'Super');
    this._languageKindMap.set('ruby:instance_eval', 'InstanceEval');
    this._languageKindMap.set('ruby:class_eval', 'ClassEval');
    this._languageKindMap.set('ruby:module_eval', 'ModuleEval');
    this._languageKindMap.set('ruby:singleton', 'Singleton');
    this._languageKindMap.set('ruby:struct', 'Struct');
    this._languageKindMap.set('ruby:open', 'Open');
    this._languageKindMap.set('ruby:private_class_method', 'PrivateClassMethod');
    this._languageKindMap.set('ruby:public_class_method', 'PublicClassMethod');

    // PHP mappings
    this._languageKindMap.set('php:function', 'Function');
    this._languageKindMap.set('php:class', 'Class');
    this._languageKindMap.set('php:interface', 'Interface');
    this._languageKindMap.set('php:trait', 'Trait');
    this._languageKindMap.set('php:namespace', 'Namespace');
    this._languageKindMap.set('php:use', 'Import');
    this._languageKindMap.set('php:require', 'Import');
    this._languageKindMap.set('php:include', 'Import');
    this._languageKindMap.set('php:const', 'Constant');
    this._languageKindMap.set('php:var', 'Variable');
    this._languageKindMap.set('php:public', 'Public');
    this._languageKindMap.set('php:private', 'Private');
    this._languageKindMap.set('php:protected', 'Protected');
    this._languageKindMap.set('php:static', 'Static');
    this._languageKindMap.set('php:final', 'Final');
    this._languageKindMap.set('php:abstract', 'Abstract');
    this._languageKindMap.set('php:extends', 'Extends');
    this._languageKindMap.set('php:implements', 'Implements');
    this._languageKindMap.set('php:__construct', 'Constructor');
    this._languageKindMap.set('php:__destruct', 'Destructor');
    this._languageKindMap.set('php:__call', 'MagicMethod');
    this._languageKindMap.set('php:__callStatic', 'MagicMethod');
    this._languageKindMap.set('php:__get', 'MagicMethod');
    this._languageKindMap.set('php:__set', 'MagicMethod');
    this._languageKindMap.set('php:__isset', 'MagicMethod');
    this._languageKindMap.set('php:__unset', 'MagicMethod');
    this._languageKindMap.set('php:__sleep', 'MagicMethod');
    this._languageKindMap.set('php:__wakeup', 'MagicMethod');
    this._languageKindMap.set('php:__toString', 'MagicMethod');
    this._languageKindMap.set('php:__invoke', 'MagicMethod');
    this._languageKindMap.set('php:__clone', 'MagicMethod');
    this._languageKindMap.set('php:try', 'Try');
    this._languageKindMap.set('php:catch', 'Catch');
    this._languageKindMap.set('php:finally', 'Finally');
    this._languageKindMap.set('php:throw', 'Throw');
    this._languageKindMap.set('php:exception', 'Exception');
    this._languageKindMap.set('php:error', 'Error');
    this._languageKindMap.set('php:generator', 'Generator');
    this._languageKindMap.set('php:yield', 'Yield');
    this._languageKindMap.set('php:yield from', 'YieldFrom');
    this._languageKindMap.set('php:declare', 'Declare');
    this._languageKindMap.set('php:goto', 'Goto');
    this._languageKindMap.set('php:global', 'Global');
    this._languageKindMap.set('php:isset', 'IsSet');
    this._languageKindMap.set('php:empty', 'Empty');
    this._languageKindMap.set('php:unset', 'Unset');
    this._languageKindMap.set('php:array', 'Array');
    this._languageKindMap.set('php:list', 'List');
    this._languageKindMap.set('php:callable', 'Callable');
    this._languageKindMap.set('php:iterable', 'Iterable');
    this._languageKindMap.set('php:object', 'Object');
    this._languageKindMap.set('php:mixed', 'Mixed');
    this._languageKindMap.set('php:void', 'Void');
    this._languageKindMap.set('php:never', 'Never');
    this._languageKindMap.set('php:null', 'Null');
    this._languageKindMap.set('php:true', 'True');
    this._languageKindMap.set('php:false', 'False');
    this._languageKindMap.set('php:self', 'Self');
    this._languageKindMap.set('php:parent', 'Parent');
    this._languageKindMap.set('php:static', 'Static');
    this._languageKindMap.set('php:$this', 'This');
    this._languageKindMap.set('php:->', 'Arrow');
    this._languageKindMap.set('php:::', 'ScopeResolution');
    this._languageKindMap.set('php:namespace', 'Namespace');
    this._languageKindMap.set('php:use', 'Use');
  }

  /**
   * Build canonical kind mapping
   */
  _buildCanonicalKindMap() {
    // Reverse mapping: canonical kind → all language kinds
    for (const [languageKind, canonicalKind] of this._languageKindMap.entries()) {
      if (!this._canonicalKindMap.has(canonicalKind)) {
        this._canonicalKindMap.set(canonicalKind, new Set());
      }
      this._canonicalKindMap.get(canonicalKind).add(languageKind);
    }
  }

  /**
   * Map language-specific kind to canonical kind
   * 
   * @param {string} language - Programming language
   * @param {string} languageKind - Language-specific kind
   * @returns {string} Canonical kind
   */
  mapToCanonicalKind(language, languageKind) {
    const key = `${language.toLowerCase()}:${languageKind.toLowerCase()}`;
    return this._languageKindMap.get(key) || languageKind;
  }

  /**
   * Get all language kinds for a canonical kind
   * 
   * @param {string} canonicalKind - Canonical kind
   * @returns {Set<string>} Set of language kinds
   */
  getLanguageKinds(canonicalKind) {
    return this._canonicalKindMap.get(canonicalKind) || new Set();
  }

  /**
   * Check if kind is canonical
   * 
   * @param {string} kind - Kind to check
   * @returns {boolean} True if kind is canonical
   */
  isCanonicalKind(kind) {
    return this._canonicalKindMap.has(kind);
  }

  /**
   * Get all canonical kinds
   * 
   * @returns {Array<string>} Array of canonical kinds
   */
  getAllCanonicalKinds() {
    return Array.from(this._canonicalKindMap.keys()).sort();
  }

  /**
   * Get all supported languages
   * 
   * @returns {Array<string>} Array of supported languages
   */
  getSupportedLanguages() {
    const languages = new Set();
    for (const key of this._languageKindMap.keys()) {
      const language = key.split(':')[0];
      languages.add(language);
    }
    return Array.from(languages).sort();
  }
}

/**
 * Canonical Symbol Object Factory
 * 
 * Creates language-independent canonical symbol objects.
 */
class CanonicalSymbolFactory {
  constructor(canonicalSymbolMapper) {
    this._mapper = canonicalSymbolMapper;
  }

  /**
   * Create canonical symbol object
   * 
   * @param {Object} symbolData - Symbol data from language parser
   * @returns {Object} Canonical symbol object
   */
  createCanonicalSymbol(symbolData) {
    const language = symbolData.language || 'unknown';
    const languageKind = symbolData.kind || 'unknown';
    
    // Map to canonical kind
    const canonicalKind = this._mapper.mapToCanonicalKind(language, languageKind);
    
    // Generate canonical name (language-independent)
    const canonicalName = this._generateCanonicalName(symbolData);
    
    // Generate canonical signature (language-independent)
    const canonicalSignature = this._generateCanonicalSignature(symbolData);
    
    // Generate relationships hash
    const relationshipsHash = this._generateRelationshipsHash(symbolData.relationships || {});
    
    // Compute canonical hash using domain-separated function
    const canonicalHash = CanonicalAuthority.hashSymbol(
      canonicalName,
      canonicalKind,
      canonicalSignature,
      relationshipsHash
    );
    
    const canonicalSymbol = {
      id: `symbol-${canonicalHash}`,
      kind: 'Symbol',
      canonical_hash: canonicalHash,
      payload: {
        canonical_name: canonicalName,
        canonical_kind: canonicalKind,
        canonical_signature: canonicalSignature,
        relationships_hash: relationshipsHash,
        // Language as provenance, not authority
        provenance: {
          language: language,
          original_kind: languageKind,
          original_name: symbolData.name,
          original_signature: symbolData.signature,
        },
        // Canonical relationships
        relationships: this._canonicalizeRelationships(symbolData.relationships || {}),
        // Other properties (canonicalized)
        properties: this._canonicalizeProperties(symbolData.properties || {}),
      },
      authority: 'CanonicalSymbolFactory',
      identity: {
        created_at: new Date(constitutionalTimeAuthority.now()).toISOString(),
        version: '1.0.0',
      },
      lineage: {
        source_id: symbolData.source_id || null,
        source_kind: symbolData.source_kind || 'Parser',
      },
      relationships: [],
      metadata: {
        schema_version: '1.0.0',
        canonical_kind: canonicalKind,
        language: language, // Provenance only
      },
    };
    
    return canonicalSymbol;
  }

  /**
   * Generate canonical name
   * 
   * Normalizes language-specific naming conventions.
   */
  _generateCanonicalName(symbolData) {
    // Remove language-specific prefixes
    let name = symbolData.name || '';
    
    // Remove common prefixes
    name = name.replace(/^[A-Z][a-z]*::/, ''); // Remove C++/C# namespace prefix
    name = name.replace(/^[a-z_]+\./, ''); // Remove Go/Java package prefix
    name = name.replace(/^self\./, ''); // Remove Python self prefix
    name = name.replace(/^\$this->/, ''); // Remove PHP $this->
    
    // Normalize casing (camelCase to snake_case for consistency)
    name = this._normalizeNameCase(name);
    
    return name;
  }

  /**
   * Normalize name case
   */
  _normalizeNameCase(name) {
    // Convert camelCase to snake_case for canonical representation
    return name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  }

  /**
   * Generate canonical signature
   * 
   * Normalizes language-specific signatures.
   */
  _generateCanonicalSignature(symbolData) {
    if (!symbolData.signature) {
      return null;
    }
    
    // Remove language-specific syntax
    let signature = symbolData.signature;
    
    // Normalize parameter types
    signature = signature.replace(/\bfn\b/g, 'function');
    signature = signature.replace(/\bfunc\b/g, 'function');
    signature = signature.replace(/\bdef\b/g, 'function');
    signature = signature.replace(/\bfun\b/g, 'function');
    
    // Normalize visibility modifiers
    signature = signature.replace(/\bpub\b/g, 'public');
    signature = signature.replace(/\bpriv\b/g, 'private');
    signature = signature.replace(/\bprotected\b/g, 'protected');
    
    // Normalize type annotations
    signature = signature.replace(/:\s*str/g, ': string');
    signature = signature.replace(/:\s*i32/g, ': int32');
    signature = signature.replace(/:\s*i64/g, ': int64');
    signature = signature.replace(/:\s*f32/g, ': float32');
    signature = signature.replace(/:\s*f64/g, ': float64');
    signature = signature.replace(/:\s*bool/g, ': boolean');
    
    return signature;
  }

  /**
   * Generate relationships hash
   */
  _generateRelationshipsHash(relationships) {
    const canonicalRelationships = this._canonicalizeRelationships(relationships);
    return CanonicalAuthority.hash(canonicalRelationships);
  }

  /**
   * Canonicalize relationships
   */
  _canonicalizeRelationships(relationships) {
    const canonical = {};
    
    for (const [relation, targets] of Object.entries(relationships)) {
      // Normalize relation names
      const canonicalRelation = this._normalizeRelation(relation);
      
      // Sort targets for determinism
      if (Array.isArray(targets)) {
        canonical[canonicalRelation] = [...targets].sort();
      } else {
        canonical[canonicalRelation] = targets;
      }
    }
    
    // Sort keys for determinism
    const sortedCanonical = {};
    const sortedKeys = Object.keys(canonical).sort();
    for (const key of sortedKeys) {
      sortedCanonical[key] = canonical[key];
    }
    
    return sortedCanonical;
  }

  /**
   * Normalize relation name
   */
  _normalizeRelation(relation) {
    // Normalize common relation names
    const relationMap = {
      'extends': 'extends',
      'inherits': 'extends',
      'implements': 'implements',
      'uses': 'uses',
      'contains': 'contains',
      'owns': 'owns',
      'references': 'references',
      'calls': 'calls',
      'called_by': 'called_by',
      'imports': 'imports',
      'exports': 'exports',
    };
    
    return relationMap[relation.toLowerCase()] || relation.toLowerCase();
  }

  /**
   * Canonicalize properties
   */
  _canonicalizeProperties(properties) {
    const canonical = {};
    
    for (const [key, value] of Object.entries(properties)) {
      // Normalize property names
      const canonicalKey = this._normalizePropertyName(key);
      
      // Canonicalize value
      if (typeof value === 'object' && value !== null) {
        canonical[canonicalKey] = this._canonicalizeProperties(value);
      } else if (Array.isArray(value)) {
        canonical[canonicalKey] = [...value].sort();
      } else {
        canonical[canonicalKey] = value;
      }
    }
    
    // Sort keys for determinism
    const sortedCanonical = {};
    const sortedKeys = Object.keys(canonical).sort();
    for (const key of sortedKeys) {
      sortedCanonical[key] = canonical[key];
    }
    
    return sortedCanonical;
  }

  /**
   * Normalize property name
   */
  _normalizePropertyName(name) {
    // Convert camelCase to snake_case
    return name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  }
}

module.exports = {
  CanonicalSymbolMapper,
  CanonicalSymbolFactory,
};
