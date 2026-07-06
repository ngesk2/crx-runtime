# Layer 0 Usage Report

## Objective

Audit remaining direct hashing, serialization, UUID generation, and runtime timestamps across all authorities.

---

## Direct Hashing Violations

### crypto.createHash() Usage

**Violations:** 12 occurrences across 8 authorities

| Authority | Line Count | Severity | Recommended Fix |
|-----------|------------|----------|------------------|
| adapter_authority.js | 4 | HIGH | Use SerializerAuthority |
| canonical_authority.js | 2 | MEDIUM | Acceptable (Layer 0 primitive) |
| deterministic_id_authority.js | 1 | MEDIUM | Acceptable (Layer 0 primitive) |
| embedding_authority.js | 1 | HIGH | Use SerializerAuthority |
| filesystem_authority.js | 1 | HIGH | Use SerializerAuthority |
| inference_authority.js | 1 | HIGH | Use SerializerAuthority |
| platform_authority.js | 1 | HIGH | Use SerializerAuthority |
| technology_authority.js | 1 | HIGH | Use SerializerAuthority |

**Analysis:**
- canonical_authority.js and deterministic_id_authority.js are acceptable (Layer 0 primitives)
- adapter_authority.js, embedding_authority.js, filesystem_authority.js, inference_authority.js, platform_authority.js, technology_authority.js must migrate to SerializerAuthority

---

## Direct Serialization Violations

### JSON.stringify() Usage

**Violations:** 30+ occurrences across 20+ authorities

| Authority | Line Count | Severity | Recommended Fix |
|-----------|------------|----------|------------------|
| adapter_authority.js | 4 | HIGH | Use SerializerAuthority |
| canonical_authority.js | 3 | MEDIUM | Acceptable (Layer 0 primitive) |
| canonical_graph_authority.js | 1 | HIGH | Use SerializerAuthority |
| canonical_symbol_authority.js | 1 | HIGH | Use SerializerAuthority |
| constitutional_schema_authority.js | 1 | HIGH | Use SerializerAuthority |
| deterministic_id_authority.js | 1 | MEDIUM | Acceptable (Layer 0 primitive) |
| event_authority.js | 2 | HIGH | Use SerializerAuthority |
| execution_plan_authority.js | 1 | HIGH | Use SerializerAuthority |
| filesystem_authority.js | 1 | HIGH | Use SerializerAuthority |
| inference_authority.js | 2 | HIGH | Use SerializerAuthority |
| mission_authority.js | 1 | HIGH | Use SerializerAuthority |
| mission_rule_authority.js | 1 | HIGH | Use SerializerAuthority |
| model_authority.js | 1 | HIGH | Use SerializerAuthority |
| parser_authority.js | 1 | HIGH | Use SerializerAuthority |
| platform_authority.js | 2 | HIGH | Use SerializerAuthority |
| proof_authority.js | 1 | HIGH | Use SerializerAuthority |
| provenance_authority.js | 1 | HIGH | Use SerializerAuthority |
| reflection_authority.js | 1 | HIGH | Use SerializerAuthority |
| repository_authority.js | 1 | HIGH | Use SerializerAuthority |
| runtime_recovery_authority.js | 1 | HIGH | Use SerializerAuthority |
| technology_authority.js | 2 | HIGH | Use SerializerAuthority |
| transcript_authority.js | 1 | MEDIUM | Acceptable (transcript formatting) |
| treesitter_parser_authority.js | 2 | HIGH | Use SerializerAuthority |

**Analysis:**
- canonical_authority.js, deterministic_id_authority.js are acceptable (Layer 0 primitives)
- transcript_authority.js is acceptable (formatting for display)
- All other authorities must migrate to SerializerAuthority

---

## Runtime Timestamp Violations

### Date.now() Usage

**Violations:** 32 occurrences across 15 authorities

| Authority | Line Count | Severity | Recommended Fix |
|-----------|------------|----------|------------------|
| adapter_authority.js | 6 | HIGH | Use ConstitutionalTimeAuthority |
| boot_authority.js | 3 | MEDIUM | Acceptable (boot coordination) |
| constitutional_time_authority.js | 1 | MEDIUM | Acceptable (fallback) |
| execution_graph_authority.js | 1 | HIGH | Use ConstitutionalTimeAuthority |
| execution_metadata_authority.js | 2 | MEDIUM | Acceptable (operational metadata) |
| model_authority.js | 1 | HIGH | Use ConstitutionalTimeAuthority |
| replay_determinism_authority.js | 1 | HIGH | Use ConstitutionalTimeAuthority |
| reproducible_build_authority.js | 1 | HIGH | Use ConstitutionalTimeAuthority |
| runtime_authority.js | 2 | MEDIUM | Acceptable (runtime coordination) |
| runtime_failure_authority.js | 2 | MEDIUM | Acceptable (operational metadata) |
| runtime_io_authority.js | 6 | MEDIUM | Acceptable (operational metadata) |
| runtime_recovery_authority.js | 1 | MEDIUM | Acceptable (operational metadata) |
| technology_authority.js | 1 | HIGH | Use ConstitutionalTimeAuthority |

**Analysis:**
- boot_authority.js, constitutional_time_authority.js, execution_metadata_authority.js, runtime_authority.js, runtime_failure_authority.js, runtime_io_authority.js, runtime_recovery_authority.js are acceptable (operational/runtime authorities)
- adapter_authority.js, execution_graph_authority.js, model_authority.js, replay_determinism_authority.js, reproducible_build_authority.js, technology_authority.js must migrate to ConstitutionalTimeAuthority

---

## UUID Generation Violations

### UUID Usage

**Violations:** 2 references in 1 authority

| Authority | Line Count | Severity | Recommended Fix |
|-----------|------------|----------|------------------|
| constitution_version_authority.js | 2 | HIGH | Use IdentityAuthority |

**Analysis:**
- constitution_version_authority.js references uuid/uuidv4 but may not be actively using them
- Must migrate to IdentityAuthority if UUID generation is active

---

## Random ID Violations

### Math.random() Usage

**Violations:** 4 occurrences across 2 authorities

| Authority | Line Count | Severity | Recommended Fix |
|-----------|------------|----------|------------------|
| adapter_authority.js | 3 | HIGH | Use IdentityAuthority |
| execution_metadata_authority.js | 1 | MEDIUM | Acceptable (operational metadata) |

**Analysis:**
- execution_metadata_authority.js is acceptable (operational metadata)
- adapter_authority.js must migrate to IdentityAuthority

---

## Summary of Violations

### Critical Violations (Must Fix)

**Direct Hashing:**
- adapter_authority.js (4)
- embedding_authority.js (1)
- filesystem_authority.js (1)
- inference_authority.js (1)
- platform_authority.js (1)
- technology_authority.js (1)

**Direct Serialization:**
- adapter_authority.js (4)
- canonical_graph_authority.js (1)
- canonical_symbol_authority.js (1)
- constitutional_schema_authority.js (1)
- event_authority.js (2)
- execution_plan_authority.js (1)
- filesystem_authority.js (1)
- inference_authority.js (2)
- mission_authority.js (1)
- mission_rule_authority.js (1)
- model_authority.js (1)
- parser_authority.js (1)
- platform_authority.js (2)
- proof_authority.js (1)
- provenance_authority.js (1)
- reflection_authority.js (1)
- repository_authority.js (1)
- runtime_recovery_authority.js (1)
- technology_authority.js (2)
- treesitter_parser_authority.js (2)

**Runtime Timestamps (Constitutional):**
- adapter_authority.js (6)
- execution_graph_authority.js (1)
- model_authority.js (1)
- replay_determinism_authority.js (1)
- reproducible_build_authority.js (1)
- technology_authority.js (1)

**UUID Generation:**
- constitution_version_authority.js (2)

**Random IDs:**
- adapter_authority.js (3)

### Acceptable Usage (Layer 0 Primitives)

**Direct Hashing:**
- canonical_authority.js (2) - Layer 0 primitive
- deterministic_id_authority.js (1) - Layer 0 primitive

**Direct Serialization:**
- canonical_authority.js (3) - Layer 0 primitive
- deterministic_id_authority.js (1) - Layer 0 primitive
- transcript_authority.js (1) - formatting only

**Runtime Timestamps (Operational):**
- boot_authority.js (3) - boot coordination
- execution_metadata_authority.js (2) - operational metadata
- runtime_authority.js (2) - runtime coordination
- runtime_failure_authority.js (2) - operational metadata
- runtime_io_authority.js (6) - operational metadata
- runtime_recovery_authority.js (1) - operational metadata

**Random IDs:**
- execution_metadata_authority.js (1) - operational metadata

---

## Migration Priority

### Priority 1 (Constitutional Authorities)
1. adapter_authority.js - 13 violations (hashing, serialization, timestamps, random IDs)
2. technology_authority.js - 4 violations (hashing, serialization, timestamps)
3. platform_authority.js - 3 violations (hashing, serialization)
4. model_authority.js - 2 violations (serialization, timestamps)
5. inference_authority.js - 3 violations (hashing, serialization)
6. embedding_authority.js - 1 violation (hashing)
7. filesystem_authority.js - 2 violations (hashing, serialization)

### Priority 2 (Compiler Passes)
1. canonical_graph_authority.js - 1 violation (serialization)
2. canonical_symbol_authority.js - 1 violation (serialization)
3. constitutional_schema_authority.js - 1 violation (serialization)
4. execution_plan_authority.js - 1 violation (serialization)
5. replay_determinism_authority.js - 1 violation (timestamps)
6. reproducible_build_authority.js - 1 violation (timestamps)

### Priority 3 (Projections)
1. execution_graph_authority.js - 1 violation (timestamps)

### Priority 4 (Adapters)
1. adapter_authority.js - already in Priority 1

### Priority 5 (Commodity Infrastructure)
1. event_authority.js - 2 violations (serialization)
2. mission_authority.js - 1 violation (serialization)
3. mission_rule_authority.js - 1 violation (serialization)
4. parser_authority.js - 1 violation (serialization)
5. proof_authority.js - 1 violation (serialization)
6. provenance_authority.js - 1 violation (serialization)
7. reflection_authority.js - 1 violation (serialization)
8. repository_authority.js - 1 violation (serialization)
9. runtime_recovery_authority.js - 1 violation (serialization)
10. treesitter_parser_authority.js - 2 violations (serialization)
11. constitution_version_authority.js - 2 violations (UUID)

---

## Next Steps

1. Migrate adapter_authority.js to Layer 0 primitives (13 violations)
2. Migrate technology_authority.js to Layer 0 primitives (4 violations)
3. Migrate platform_authority.js to Layer 0 primitives (3 violations)
4. Migrate model_authority.js to Layer 0 primitives (2 violations)
5. Migrate inference_authority.js to Layer 0 primitives (3 violations)
6. Migrate embedding_authority.js to Layer 0 primitives (1 violation)
7. Migrate filesystem_authority.js to Layer 0 primitives (2 violations)
8. Migrate compiler passes to Layer 0 primitives (6 violations)
9. Migrate projections to Layer 0 primitives (1 violation)
10. Migrate commodity infrastructure to Layer 0 primitives (12 violations)
