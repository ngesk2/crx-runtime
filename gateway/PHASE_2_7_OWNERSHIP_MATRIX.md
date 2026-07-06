# Phase 2.7 Constitutional Ownership Matrix

## Constitutional Authorities

| Class | Owns | Mutable Fields | Constitutional Owner |
|-------|------|---------------|----------------------|
| **DTORegistryAuthority** | DTO registration and lookup | `_dtoFactories` (Map) | DTORegistryAuthority |
| **CompilationPolicy** | Compilation rules and mappings | None (pure functions) | CompilationPolicy |
| **WorkflowIdentityAuthority** | Workflow ID generation | None (pure functions) | WorkflowIdentityAuthority |
| **TemporalRuntime** | Temporal infrastructure lifecycle | `_connection`, `_client`, `_worker`, `_isInitialized` | TemporalRuntime |
| **HealthAuthority** | Runtime health aggregation | `_healthChecks` (Map) | HealthAuthority |
| **CompilerAuthority** | Compilation orchestration | `_authorityId`, `_authorityVersion` | CompilerAuthority |
| **CanonicalAuthority** | Canonical bytes and hashing | (immutable operations) | CanonicalAuthority |
| **IdentityAuthority** | Identity generation | (immutable operations) | IdentityAuthority |
| **ReplayAuthority** | Replay verification | (immutable operations) | ReplayAuthority |
| **WitnessAuthority** | Witness generation | (immutable operations) | WitnessAuthority |

## Ports

| Class | Owns | Mutable Fields | Constitutional Owner |
|-------|------|---------------|----------------------|
| **SchedulerPort** | Scheduling interface | `_provider`, `_portId` | SchedulerPort |
| **QueuePort** | Queue interface | (interface only) | QueuePort |
| **ApplicationPort** | Application interface | (interface only) | ApplicationPort |

## Providers

| Class | Owns | Mutable Fields | Constitutional Owner |
|-------|------|---------------|----------------------|
| **TemporalSchedulerProvider** | Temporal scheduling implementation | `_client` (injected), `_options` | TemporalSchedulerProvider |

## Bootstrap

| Class | Owns | Mutable Fields | Constitutional Owner |
|-------|------|---------------|----------------------|
| **Container** | Dependency injection | `_services` (Map), `_singletons` (Map) | Container |
| **Lifecycle** | Application lifecycle | `_container`, `_isStarted` | Lifecycle |
| **Wiring** | Dependency wiring | (factory functions only) | Wiring |

## Controllers

| Class | Owns | Mutable Fields | Constitutional Owner |
|-------|------|---------------|----------------------|
| **ApiController** | Express transport | `_port`, `_app`, `_server` | ApiController |

## Data Structures

| Class | Owns | Mutable Fields | Constitutional Owner |
|-------|------|---------------|----------------------|
| **CanonicalIR** | Intermediate representation | `irData`, `version`, `generatedAt` | CanonicalIR (pure data) |
| **SourceDTO** | Data transfer object | `sourceType`, `rawData`, `extractedAt` | SourceDTO (pure data) |
| **GitHubDTO** | GitHub-specific DTO | (inherits from SourceDTO) | GitHubDTO (pure data) |

## Success Criteria Verification

- ✅ Zero service construction outside Bootstrap
- ✅ Zero provider lifecycle ownership (moved to TemporalRuntime)
- ✅ Zero source-system knowledge inside compiler (moved to DTORegistryAuthority)
- ✅ Zero mutable runtime state without a single constitutional owner
- ✅ Zero remaining orchestration classes (SecondBrain destroyed)
- ✅ One ownership matrix with no overlaps

## Constitutional Boundary Summary

**Architecture:**
```
Bootstrap (construction + lifecycle)
  ↓
Container (dependency injection)
  ↓
Authorities (constitutional ownership)
  ↓
Ports (interfaces)
  ↓
Providers (implementations)
  ↓
Controllers (transport)
```

**Key Principles:**
1. Every mutable field has exactly one constitutional owner
2. No class constructs another service (except Bootstrap)
3. No provider owns lifecycle (moved to Runtime classes)
4. No source-system knowledge in compiler (moved to DTORegistryAuthority)
5. No orchestration classes (SecondBrain destroyed)
6. Express is transport only (ApiController delegates to ApplicationPort)
