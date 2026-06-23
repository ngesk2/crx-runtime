# RUNTIME CRITICALITY MAP

**Date:** 2026-06-20
**Purpose:** Classify every system by runtime criticality
**Classification Types:**
- CRITICAL: System failure causes PING runtime failure
- IMPORTANT: System failure degrades PING functionality but runtime continues
- OPTIONAL: System failure has minimal impact on PING runtime
- EXPERIMENTAL: System is experimental and not production-ready

---

## CONSTITUTION

**Classification:** CRITICAL
**Justification:**
- Constitutional layer defines Layer 0 metadata and governance laws
- Failure of constitutional layer invalidates entire PING governance model
- All other systems depend on constitutional definitions
- OBSERVED: 11 constitutional documents define core governance
- INFERRED: Constitutional violations would cause runtime validation failures

**Impact of Failure:**
- Loss of governance authority
- Inability to validate Layer 0 metadata
- Constitutional law violations
- Runtime validation failures

---

## RUNTIME

**Classification:** CRITICAL
**Justification:**
- Runtime provides Layer 1 validation infrastructure
- Replay system is core to PING determinism guarantees
- Witness authority is required for constitutional validation
- OBSERVED: 30+ TypeScript files implement replay, kernel services, and event adapters
- INFERRED: Runtime failure would prevent event validation and replay

**Impact of Failure:**
- Inability to validate events
- Loss of determinism guarantees
- Replay system failure
- Constitutional validation failure

---

## GATEWAY

**Classification:** CRITICAL
**Justification:**
- Gateway is the entry point for all events into PING
- Event emission to PostgreSQL is critical for event storage
- Ollama integration is required for inference
- OBSERVED: server.js and event_emitter.js implement gateway functionality
- INFERRED: Gateway failure would prevent event ingestion and Ollama inference

**Impact of Failure:**
- Inability to ingest events
- Loss of event storage
- Ollama inference failure
- Complete runtime halt

---

## WORKERS

**Classification:** CRITICAL
**Justification:**
- Workers execute PING services
- Worker configurations define service behavior
- OBSERVED: 5 YAML worker configuration files
- INFERRED: Worker failure would prevent service execution

**Impact of Failure:**
- Service execution failure
- Inability to process events
- Loss of worker functionality

---

## KNOWLEDGE

**Classification:** CRITICAL
**Justification:**
- Knowledge fabric is the canonical storage for PING knowledge
- 110 files contain authoritative, derived, and experimental knowledge
- OBSERVED: inventory.json documents 110 knowledge files
- INFERRED: Knowledge failure would prevent knowledge retrieval and validation

**Impact of Failure:**
- Loss of knowledge storage
- Inability to retrieve knowledge
- Knowledge validation failure

---

## VOS

**Classification:** OPTIONAL
**Justification:**
- VOS infrastructure for governance, proposals, visualization, and archiving
- OBSERVED: Mostly empty directories (proposals/ is mostly empty)
- INFERRED: VOS is not actively used in current runtime
- OBSERVED: No evidence of active VOS usage

**Impact of Failure:**
- Minimal impact on current runtime
- Loss of VOS governance infrastructure
- Loss of proposal system

---

## PRESENTPING

**Classification:** OPTIONAL
**Justification:**
- PowerPoint presentation generation is not required for PING runtime
- PresentPING is a visualization tool, not a runtime component
- OBSERVED: V17 engine generates presentations but is not required for runtime
- INFERRED: PresentPING failure would not affect PING runtime

**Impact of Failure:**
- Inability to generate presentations
- No impact on PING runtime
- Visualization tool failure only

---

## BRAINOS

**Classification:** IMPORTANT
**Justification:**
- BrainOS provides newsletter digestion, RSS ingestion, research synthesis, and orchestration
- BrainOS is not required for core PING runtime but provides important functionality
- OBSERVED: 144 files in newsletter, 23 files in rss, 2 files in research, 121 files in orchestration
- INFERRED: BrainOS failure would degrade PING functionality but runtime would continue

**Impact of Failure:**
- Loss of newsletter ingestion
- Loss of RSS ingestion
- Loss of research synthesis
- Loss of orchestration layer
- PING runtime continues but with degraded functionality

**BrainOS Subsystems:**

**BrainOS Newsletter:** IMPORTANT
- Justification: Newsletter ingestion is important but not required for core PING runtime
- Impact: Loss of newsletter ingestion, PING runtime continues

**BrainOS RSS:** IMPORTANT
- Justification: RSS ingestion is important but not required for core PING runtime
- Impact: Loss of RSS ingestion, PING runtime continues

**BrainOS Research:** OPTIONAL
- Justification: Research synthesis is optional for PING runtime
- Impact: Loss of research synthesis, minimal impact on PING runtime

**BrainOS Orchestration:** IMPORTANT
- Justification: Orchestration layer is important for BrainOS coordination but not required for core PING runtime
- Impact: Loss of orchestration, PING runtime continues

---

## OBSERVATION

**Classification:** EXPERIMENTAL
**Justification:**
- Observation infrastructure is placeholder (all directories empty)
- OBSERVED: 8 empty directories (email, rss, github, youtube, arxiv, documents, chat, meetings)
- INFERRED: Observation infrastructure is not implemented and has no runtime impact

**Impact of Failure:**
- No impact (infrastructure not implemented)
- Placeholder directories only

---

## INTEGRATIONS

**Classification:** CRITICAL
**Justification:**
- Integrations provide external system connectivity (Ollama, Obsidian, GitHub)
- Ollama integration is required for inference
- OBSERVED: integrations/ollama/gateway/server.js and integrations/ollama/workers/ollama-worker.yaml
- INFERRED: Integrations failure would prevent external system connectivity

**Impact of Failure:**
- Loss of Ollama integration
- Loss of external system connectivity
- Inference failure

**Integrations Subsystems:**

**Integrations Ollama:** CRITICAL
- Justification: Ollama integration is required for inference
- Impact: Loss of Ollama inference, runtime failure

**Integrations Obsidian:** OPTIONAL
- Justification: Obsidian integration is placeholder (empty directory)
- Impact: No impact (infrastructure not implemented)

**Integrations GitHub:** OPTIONAL
- Justification: GitHub integration is placeholder (empty directory)
- Impact: No impact (infrastructure not implemented)

**Integrations External:** OPTIONAL
- Justification: External integrations is placeholder (empty directory)
- Impact: No impact (infrastructure not implemented)

---

## CRITICALITY SUMMARY

**Total Systems:** 10

**By Classification:**
- CRITICAL: 5 (constitution, runtime, gateway, workers, knowledge, integrations/ollama)
- IMPORTANT: 3 (brainos/newsletter, brainos/rss, brainos/orchestration)
- OPTIONAL: 4 (vos, presentping, brainos/research, integrations/obsidian, integrations/github, integrations/external)
- EXPERIMENTAL: 1 (observation)

**By System:**
- constitution: CRITICAL
- runtime: CRITICAL
- gateway: CRITICAL
- workers: CRITICAL
- knowledge: CRITICAL
- vos: OPTIONAL
- presentping: OPTIONAL
- brainos/newsletter: IMPORTANT
- brainos/rss: IMPORTANT
- brainos/research: OPTIONAL
- brainos/orchestration: IMPORTANT
- observation: EXPERIMENTAL
- integrations/ollama: CRITICAL
- integrations/obsidian: OPTIONAL
- integrations/github: OPTIONAL
- integrations/external: OPTIONAL

---

## CRITICALITY JUSTIFICATION SUMMARY

**CRITICAL Systems:**
- Constitution: Defines Layer 0 metadata and governance laws
- Runtime: Provides Layer 1 validation infrastructure
- Gateway: Entry point for all events and Ollama integration
- Workers: Execute PING services
- Knowledge: Canonical storage for PING knowledge
- Integrations/Ollama: Required for inference

**IMPORTANT Systems:**
- BrainOS Newsletter: Newsletter ingestion
- BrainOS RSS: RSS ingestion
- BrainOS Orchestration: Orchestration layer

**OPTIONAL Systems:**
- VOS: Governance infrastructure (not actively used)
- PresentPING: Presentation generation (visualization tool)
- BrainOS Research: Research synthesis
- Integrations/Obsidian: Placeholder
- Integrations/GitHub: Placeholder
- Integrations/External: Placeholder

**EXPERIMENTAL Systems:**
- Observation: Placeholder infrastructure (not implemented)

---

## RUNTIME DEPENDENCY GRAPH

**Core Runtime (CRITICAL):**
- constitution → runtime → gateway → workers → knowledge → integrations/ollama

**Extended Runtime (IMPORTANT):**
- brainos/newsletter → brainos/rss → brainos/orchestration

**Optional Runtime (OPTIONAL):**
- vos → presentping → brainos/research → integrations/obsidian → integrations/github → integrations/external

**Experimental Runtime (EXPERIMENTAL):**
- observation

---

## FAILURE IMPACT ANALYSIS

**Single Point of Failure:**
- Constitution: CRITICAL - failure causes complete runtime failure
- Runtime: CRITICAL - failure causes complete runtime failure
- Gateway: CRITICAL - failure causes complete runtime failure
- Workers: CRITICAL - failure causes service execution failure
- Knowledge: CRITICAL - failure causes knowledge retrieval failure
- Integrations/Ollama: CRITICAL - failure causes inference failure

**Degraded Runtime:**
- BrainOS Newsletter: IMPORTANT - failure causes loss of newsletter ingestion
- BrainOS RSS: IMPORTANT - failure causes loss of RSS ingestion
- BrainOS Orchestration: IMPORTANT - failure causes loss of orchestration

**Minimal Impact:**
- VOS: OPTIONAL - failure has minimal impact
- PresentPING: OPTIONAL - failure has no impact on runtime
- BrainOS Research: OPTIONAL - failure has minimal impact
- Integrations/Obsidian: OPTIONAL - failure has no impact (not implemented)
- Integrations/GitHub: OPTIONAL - failure has no impact (not implemented)
- Integrations/External: OPTIONAL - failure has no impact (not implemented)

**No Impact:**
- Observation: EXPERIMENTAL - failure has no impact (not implemented)
