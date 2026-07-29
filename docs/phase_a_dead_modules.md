# Phase A: Dead Modules Analysis

**Status:** In Progress
**Last Updated:** 2026-07-13
**Purpose:** Repository Understanding - Dead Module Identification

---

## Dead Module Definition

A module is considered "dead" if:
1. No other module imports from it
2. No entry point references it
3. No test file references it
4. No configuration file references it
5. No documentation references it

---

## Module Usage Analysis

### High Usage Modules (Active)
**Status:** Active
**Usage:** Imported by multiple modules

- `api/main.py` - API entry point, imported by uvicorn
- `api/dto.py` - API DTOs, imported by api/main.py
- `constitution/models/mission.py` - Mission model, imported by multiple modules
- `constitution/models/event.py` - Event model, imported by api/main.py
- `constitution/models/command.py` - Command model, imported by api/main.py
- `constitution/registry/capability_registry.py` - Capability registry, imported by hermes/hermes_runtime.py
- `storage/postgres/database.py` - Database connection, imported by api/main.py
- `storage/postgres/models.py` - Database models, imported by api/main.py
- `storage/repositories.py` - Repository pattern, imported by api/main.py
- `transport/nats/transport.py` - NATS transport, imported by api/main.py
- `config/settings.py` - Configuration, imported by api/main.py
- `config/logging.py` - Logging, imported by api/main.py
- `runtime/observability.py` - Observability, imported by api/main.py
- `kernel/scheduler.py` - Scheduler, imported by hermes/hermes_runtime.py
- `hermes/hermes_runtime.py` - Hermes runtime, entry point
- `runtime/oracle/oracle.py` - Oracle subsystem, referenced in surgical fixes
- `runtime/planner/planner.py` - Planner subsystem, referenced in surgical fixes
- `runtime/executor/executor.py` - Executor subsystem, referenced in surgical fixes
- `runtime/planning/planning_ir.py` - Planning IR, referenced in surgical fixes
- `runtime/security/capability_broker.py` - Capability broker, referenced in surgical fixes
- `runtime/evidence/evidence_compiler.py` - Evidence compiler, referenced in surgical fixes
- `runtime/scheduler/constitutional_scheduler.py` - Constitutional scheduler, referenced in surgical fixes
- `runtime/planning/general_planner.py` - General planner, referenced in surgical fixes
- `runtime/registry/merge_manifest.py` - Merge manifest, referenced in surgical fixes
- `hermes/execution/executor.py` - Hermes executor, referenced in surgical fixes
- `hermes/execution/queue.py` - Mission queue, imported by hermes/hermes_runtime.py
- `hermes/execution/queue_backend.py` - Queue backend, imported by hermes/execution/queue.py

---

### Potentially Dead Modules (Low Usage)
**Status:** Potentially Dead
**Usage:** Limited or no imports found

#### 1. `apps/` Directory
**Status:** Empty
**Usage:** None
**Analysis:** Directory exists but is empty
**Recommendation:** Remove or populate with applications

#### 2. `authority/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Authority modules exist but are not actively used
**Modules:**
- `authority/aggregate_authority.py`
- `authority/migration_authority.py`
- `authority/projection_authority.py`
- `authority/registry_authority.py`
- `authority/snapshot_authority.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 3. `architecture/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Architecture modules exist but are not actively used
**Modules:**
- `architecture/canonical_events.py`
- `architecture/canonical_ir.py`
- `architecture/event_store.py`
- `architecture/ir_lowering.py`
- `architecture/migrations/mission_v1_to_v2.py`
- `architecture/schema_versioning.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 4. `bootstrap/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Bootstrap module exists but is not actively used
**Modules:**
- `bootstrap/__init__.py`
- `bootstrap/manifest.yaml`

**Recommendation:** Integrate with runtime or mark as future work

#### 5. `capabilities/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Capability definitions exist but are not actively registered
**Modules:**
- `capabilities/agent.py`
- `capabilities/connector.py`
- `capabilities/connector_interface.py`
- `capabilities/filesystem.py`
- `capabilities/github/acquire_repository.py`
- `capabilities/media.py`
- `capabilities/network.py`
- `capabilities/search.py`
- `capabilities/storage.py`
- `capabilities/tool.py`
- `capabilities/workflow.py`

**Recommendation:** Register with CapabilityRegistry or mark as future work

#### 6. `constitution/authority/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Constitutional authority modules exist but are not actively used
**Modules:**
- `constitution/authority/__init__.py`
- `constitution/authority/canonical_authority.py`
- `constitution/authority/interface.py`
- `constitution/authority/internal/__init__.py`
- `constitution/authority/internal/canonical_encoder.py`
- `constitution/authority/internal/canonical_hash.py`
- `constitution/authority/internal/failure_proof.py`
- `constitution/authority/internal/lineage.py`
- `constitution/authority/internal/merkle.py`
- `constitution/authority/internal/unicode.py`
- `constitution/authority/internal/verification_stamp.py`
- `constitution/authority/internal/witness_builder.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 7. `constitution/hashing/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Hashing modules exist but are not actively used
**Modules:**
- `constitution/hashing/merkle.py`
- `constitution/hashing.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 8. `constitution/intents.py`
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Intents module exists but is not actively used
**Recommendation:** Integrate with runtime or mark as future work

#### 9. `constitution/transcript.py`
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Transcript module exists but is not actively used
**Recommendation:** Integrate with runtime or mark as future work

#### 10. `constitution/value_objects.py`
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Value objects module exists but is not actively used
**Recommendation:** Integrate with runtime or mark as future work

#### 11. `constitution/registries.py`
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Registries module exists but is not actively used
**Recommendation:** Integrate with runtime or mark as future work

#### 12. `constitution/schema_registry.py`
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Schema registry module exists but is not actively used
**Recommendation:** Integrate with runtime or mark as future work

#### 13. `constitution/registry/` Directory (Partial)
**Status:** Mixed Usage
**Usage:** Some modules used, some not
**Analysis:**
- `constitution/registry/capability_registry.py` - Used by hermes/hermes_runtime.py
- `constitution/registry/object_registry.py` - Not used
- `constitution/registry/authority_registry.py` - Not used

**Recommendation:** Integrate unused modules or mark as future work

#### 14. `kernel/replay/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Replay modules exist but are not actively used
**Modules:**
- `kernel/replay/event_stream.py`
- `kernel/replay/replay_executor.py`
- `kernel/replay/replay_kernel.py`
- `kernel/replay/replay_planner.py`
- `kernel/replay/replay_verifier.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 15. `runtime/artifacts/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Artifacts module exists but is not actively used
**Modules:**
- `runtime/artifacts/artifact_ontology.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 16. `runtime/event_sourcing/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Event sourcing modules exist but are not actively used
**Modules:**
- `runtime/event_sourcing/projections.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 17. `runtime/execution/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Execution modules exist but are not actively used
**Modules:**
- `runtime/execution/workflow_compiler.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 18. `runtime/hermes/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Hermes runtime modules exist but are not actively used
**Modules:**
- `runtime/hermes/constitutional_citizen.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 19. `runtime/kernel/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Kernel modules exist but are not actively used
**Modules:**
- `runtime/kernel/capabilities.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 20. `runtime/knowledge/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Knowledge modules exist but are not actively used
**Modules:**
- `runtime/knowledge/knowledge_graph.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 21. `runtime/messaging/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Messaging modules exist but are not actively used
**Modules:**
- `runtime/messaging/outbox.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 22. `runtime/planning/` Directory (Partial)
**Status:** Mixed Usage
**Usage:** Some modules used, some not
**Analysis:**
- `runtime/planning/planning_ir.py` - Used by surgical fixes
- `runtime/planning/general_planner.py` - Used by surgical fixes
- `runtime/planning/compiler_stages.py` - Not used
- `runtime/planning/hierarchy.py` - Not used
- `runtime/planning/mission_compiler.py` - Not used
- `runtime/planning/objective_compiler.py` - Not used
- `runtime/planning/optimization_passes.py` - Not used
- `runtime/planning/strategy.py` - Not used
- `runtime/planning/transient_objectives.py` - Not used

**Recommendation:** Integrate unused modules or mark as future work

#### 23. `runtime/registry/` Directory (Partial)
**Status:** Mixed Usage
**Usage:** Some modules used, some not
**Analysis:**
- `runtime/registry/merge_manifest.py` - Used by surgical fixes
- `runtime/registry/agents.json` - Not used
- `runtime/registry/oracle_reviewer.py` - Not used
- `runtime/registry/oracle_sandbox.py` - Not used
- `runtime/registry/promotion_pipeline.py` - Not used
- `runtime/registry/work_claim_manager.py` - Not used
- `runtime/registry/work_claims.json` - Not used

**Recommendation:** Integrate unused modules or mark as future work

#### 24. `runtime/scheduler/` Directory (Partial)
**Status:** Mixed Usage
**Usage:** Some modules used, some not
**Analysis:**
- `runtime/scheduler/constitutional_scheduler.py` - Used by surgical fixes
- `runtime/scheduler/vps_scheduler.py` - Not used

**Recommendation:** Integrate unused modules or mark as future work

#### 25. `runtime/security/` Directory (Partial)
**Status:** Mixed Usage
**Usage:** Some modules used, some not
**Analysis:**
- `runtime/security/capability_broker.py` - Used by surgical fixes
- `runtime/security/capability_tokens.py` - Not used
- `runtime/security/execution_policy.py` - Not used
- `runtime/security/semantic_capabilities.py` - Not used
- `runtime/security/signed_policy.py` - Not used

**Recommendation:** Integrate unused modules or mark as future work

#### 26. `runtime/skills/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Skills modules exist but are not actively used
**Modules:**
- `runtime/skills/classify_existing_skills.py`
- `runtime/skills/pure_functions.py`
- `runtime/skills/skill_classification.py`
- `runtime/skills/skill_registry.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 27. `runtime/state/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** State modules exist but are not actively used
**Modules:**
- `runtime/state/state_machine.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 28. `runtime/verification/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Verification modules exist but are not actively used
**Modules:**
- `runtime/verification/verifier.py`

**Recommendation:** Integrate with runtime or mark as future work

#### 29. `sandbox/` Directory
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Sandbox directory exists but contains only README files
**Recommendation:** Remove or populate with sandbox environments

#### 30. `storage/artifact_adapter.py`
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Artifact adapter exists but is not actively used
**Recommendation:** Integrate with runtime or mark as future work

#### 31. `storage/artifact_store.py`
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Artifact store exists but is not actively used
**Recommendation:** Integrate with runtime or mark as future work

#### 32. `storage/event_store.py`
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Event store exists but is not actively used
**Recommendation:** Integrate with runtime or mark as future work

#### 33. `transport/event_bus.py`
**Status:** Low Usage
**Usage:** Not imported by main entry points
**Analysis:** Event bus exists but is not actively used
**Recommendation:** Integrate with runtime or mark as future work

---

## Dead Module Summary

### Confirmed Dead Modules
**Status:** Dead
**Action:** Remove or archive

- `apps/` - Empty directory
- `sandbox/` - Contains only README files

### Potentially Dead Modules (Future Work)
**Status:** Potentially Dead
**Action:** Integrate or mark as future work

- `authority/` - Authority implementations not integrated
- `architecture/` - Architecture modules not integrated
- `bootstrap/` - Bootstrap module not integrated
- `capabilities/` - Capability definitions not registered
- `constitution/authority/` - Constitutional authorities not integrated
- `constitution/hashing/` - Hashing modules not integrated
- `constitution/intents.py` - Intents module not integrated
- `constitution/transcript.py` - Transcript module not integrated
- `constitution/value_objects.py` - Value objects not integrated
- `constitution/registries.py` - Registries not integrated
- `constitution/schema_registry.py` - Schema registry not integrated
- `constitution/registry/object_registry.py` - Object registry not integrated
- `constitution/registry/authority_registry.py` - Authority registry not integrated
- `kernel/replay/` - Replay modules not integrated
- `runtime/artifacts/` - Artifacts module not integrated
- `runtime/event_sourcing/` - Event sourcing not integrated
- `runtime/execution/workflow_compiler.py` - Workflow compiler not integrated
- `runtime/hermes/constitutional_citizen.py` - Constitutional citizen not integrated
- `runtime/kernel/capabilities.py` - Kernel capabilities not integrated
- `runtime/knowledge/` - Knowledge modules not integrated
- `runtime/messaging/` - Messaging modules not integrated
- `runtime/planning/*` (partial) - Some planning modules not integrated
- `runtime/registry/*` (partial) - Some registry modules not integrated
- `runtime/scheduler/vps_scheduler.py` - VPS scheduler not integrated
- `runtime/security/*` (partial) - Some security modules not integrated
- `runtime/skills/` - Skills modules not integrated
- `runtime/state/` - State modules not integrated
- `runtime/verification/` - Verification modules not integrated
- `storage/artifact_adapter.py` - Artifact adapter not integrated
- `storage/artifact_store.py` - Artifact store not integrated
- `storage/event_store.py` - Event store not integrated
- `transport/event_bus.py` - Event bus not integrated

---

## Recommendations

### Immediate Actions
1. **Remove Empty Directories:** Remove `apps/` and `sandbox/` directories
2. **Archive Unused Modules:** Move unused modules to `archive/unused-modules/`
3. **Document Future Work:** Create `docs/future-work.md` listing modules for future integration

### Medium-Term Actions
1. **Integrate Authorities:** Integrate `authority/` modules with runtime
2. **Integrate Architecture:** Integrate `architecture/` modules with runtime
3. **Register Capabilities:** Register `capabilities/` modules with CapabilityRegistry
4. **Integrate Constitutional Modules:** Integrate `constitution/authority/` and `constitution/hashing/` modules

### Long-Term Actions
1. **Complete Planning Integration:** Integrate all `runtime/planning/` modules
2. **Complete Registry Integration:** Integrate all `runtime/registry/` modules
3. **Complete Security Integration:** Integrate all `runtime/security/` modules
4. **Complete Skills Integration:** Integrate all `runtime/skills/` modules

---

## Next Steps

- Remove empty directories (`apps/`, `sandbox/`)
- Archive unused modules to `archive/unused-modules/`
- Create `docs/future-work.md` documenting integration roadmap
- Integrate high-priority modules (authorities, architecture, capabilities)
