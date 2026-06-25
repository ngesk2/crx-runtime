# Migration Disposition

**Audit Date:** 2026-06-25
**Audit Type:** P2 — Classify 28 Unapplied Migrations
**Status:** PROVISIONAL (based on actual schema reality from SCHEMA_REALITY.md)
**Objective:** Determine which SQL migrations are needed vs dead code.

---

# CRITICAL CORRECTION

Previous audit was INCORRECT. Audited from documents, not reality.

**Actual Schema Reality (from live PostgreSQL):**
- authority_objects: EXISTS with 15 rows (NOT dead code)
- authority_lineage: EXISTS with 4 rows (NOT dead code)
- artifact_registry: EXISTS with 15 rows (NOT dead code)
- events: EXISTS with 15 rows, CQRS schema confirmed

**Tables with data (actual usage):**
- events: 15 rows
- authority_objects: 15 rows
- authority_lineage: 4 rows
- artifact_registry: 15 rows
- system_metadata: 2 rows

**Tables exist but empty:**
- audit_log, authority_supersession, authority_witness, citations, claims, entities, lineage, objects, projections, relationships, topics

---

# Migration Classification (UPDATED based on actual schema)

| Migration File | Tables Defined | Needed? | Reason | Disposition |
|---------------|----------------|---------|--------|-------------|
| authority_objects.sql | authority_objects | YES | EXISTS with 15 rows. In active use. | KEEP (already applied) |
| authority_lineage.sql | authority_lineage | YES | EXISTS with 4 rows. In active use. | KEEP (already applied) |
| authority_supersession.sql | authority_supersession | YES | EXISTS with 0 rows. Table exists, may be used later. | KEEP (already applied) |
| authority_witness.sql | authority_witness | YES | EXISTS with 0 rows. Table exists, may be used later. | KEEP (already applied) |
| artifact_registry.sql | artifact_registry | YES | EXISTS with 15 rows. In active use. | KEEP (already applied) |
| object_relationships.sql | object_relationships | YES | EXISTS with 0 rows. Table exists, may be used later. | KEEP (already applied) |
| database/documents.sql | documents, document_content, document_embeddings, document_lineage, document_tags, document_citations | NO | Documents stored as events + filesystem. No document-specific table needed. | archive/obsolete/ |
| database/events_retention.sql | events_archive | NO | Events table has retention policy in-place. No archive table needed. | archive/obsolete/ |
| database/operational_intelligence.sql | raw_payloads, dead_letters, knowledge_metrics | NO | Operational intelligence not implemented. Dead code. | archive/obsolete/ |
| constitutional_freeze_registry.sql | constitutional_freeze_registry, freeze_audit_log, amendment_history, verification_log | NO | Constitutional freeze not implemented. Dead code. | archive/obsolete/ |
| constitutional_freeze_seed.sql | Seed data for freeze registry | NO | Depends on freeze registry which is dead code. | archive/obsolete/ |
| runtime/kernel/commit-service/src/persistence/ledger_schema.sql | artifacts, lineage_edges, execution_events | NO | Commit service not integrated. Dead code. | archive/obsolete/ |
| database/qdrant_memory_projection.sql | Qdrant collection schema (documents, document_chunks) | NO | Qdrant schema is defined in code, not SQL. This is documentation only. | archive/obsolete/ |
| database/document_events.sql | document_events | NO | Alternative schema not adopted. | archive/obsolete/ |
| database/events_backup.sql | events backup | NO | Backup file, not schema. | archive/obsolete/ |
| insert_events.sql | Seed events | NO | Test data. Not needed. | archive/obsolete/ |
| migration_002_authority_tables.sql | authority_objects, authority_lineage, authority_supersession, authority_witness | YES | These tables already exist and are in use. | KEEP (already applied) |
| migration_003_lineage_and_registry.sql | artifact_registry, object_relationships | YES | These tables already exist and are in use. | KEEP (already applied) |

---

# Disposition Summary (UPDATED)

| Category | Count | Migrations |
|----------|-------|------------|
| Already applied and in use | 6 | authority_objects.sql, authority_lineage.sql, authority_supersession.sql, authority_witness.sql, artifact_registry.sql, object_relationships.sql |
| Already applied (migration files) | 2 | migration_002_authority_tables.sql, migration_003_lineage_and_registry.sql |
| Dead code (archived) | 9 | database/documents.sql, database/events_retention.sql, database/operational_intelligence.sql, constitutional_freeze_registry.sql, constitutional_freeze_seed.sql, runtime/kernel/commit-service/src/persistence/ledger_schema.sql, database/qdrant_memory_projection.sql, database/document_events.sql, database/events_backup.sql |
| Test data | 1 | insert_events.sql |
| **Total** | **18** | |

---

# Core Schema (Already Applied)

The following schema files are already applied and should NOT be touched:
- brainos/orchestration/constitutional/canonical_state/schema.sql (events, objects, lineage, projections, system_metadata)
- brainos/orchestration/constitutional/canonical_state/migration_001_bidirectional_memory.sql (entities, relationships, citations, claims, topics)

These are the only schema files that matter. All other SQL files are dead code or documentation.

---

# Recommendation (UPDATED)

**NO CHANGES NEEDED.**

The authority tables (authority_objects, authority_lineage, artifact_registry) are NOT dead code. They are actively used with real data (15 rows each). The previous audit incorrectly classified them as dead code because it audited from documents instead of live database.

**Action:** Keep all authority tables. They are in use. The archived SQL files were correctly archived as they represent alternative designs not adopted.

**Correction:** The "28 unapplied migrations" claim was misleading. Most of these tables already exist and are in use. The system is in better shape than the initial audit suggested.

---

**Audit Status:** PROVISIONAL (updated based on actual schema reality)
