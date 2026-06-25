# Schema Reality

**Generated:** 2026-06-25T15:47:56.466663
**Database:** crx_runtime
**Container:** brain-postgres

---

# Tables in Public Schema

| Table | Type | Row Count | Columns |
|-------|------|-----------|---------|
| artifact_registry | BASE TABLE | 15 | 11 |
| audit_log | BASE TABLE | 0 | 10 |
| authority_lineage | BASE TABLE | 4 | 6 |
| authority_objects | BASE TABLE | 15 | 14 |
| authority_supersession | BASE TABLE | 0 | 5 |
| authority_witness | BASE TABLE | 0 | 6 |
| citations | BASE TABLE | 0 | 5 |
| claims | BASE TABLE | 0 | 4 |
| entities | BASE TABLE | 0 | 4 |
| events | BASE TABLE | 15 | 13 |
| lineage | BASE TABLE | 0 | 6 |
| objects | BASE TABLE | 0 | 14 |
| projections | BASE TABLE | 0 | 10 |
| relationships | BASE TABLE | 0 | 6 |
| system_metadata | BASE TABLE | 2 | 6 |
| topics | BASE TABLE | 0 | 3 |

---

# Detailed Schema

## artifact_registry

**Type:** BASE TABLE
**Row Count:** 15

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| artifact_id | uuid | NO |  |
| artifact_type | text | YES |  |
| canonical_path | text | YES |  |
| sha256 | text | YES |  |
| payload_hash | text | YES |  |
| source_system | text | YES |  |
| created_at | timestamp with time zone | YES | now() |
| modified_at | timestamp with time zone | YES | now() |
| lineage_root | uuid | YES |  |
| witness_root | text | YES |  |
| status | text | YES | 'active'::text |

## audit_log

**Type:** BASE TABLE
**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| audit_id | uuid | NO |  |
| action | character varying | NO |  |
| actor | character varying | NO |  |
| resource_type | character varying | NO |  |
| resource_id | uuid | NO |  |
| timestamp | timestamp with time zone | NO |  |
| details | jsonb | YES |  |
| ip_address | inet | YES |  |
| user_agent | text | YES |  |

## authority_lineage

**Type:** BASE TABLE
**Row Count:** 4

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| id | uuid | NO |  |
| ancestor | uuid | NO |  |
| descendant | uuid | NO |  |
| relation | text | YES |  |
| metadata | jsonb | YES |  |
| created_at | timestamp with time zone | YES | now() |

## authority_objects

**Type:** BASE TABLE
**Row Count:** 15

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| authority_id | uuid | NO |  |
| artifact_id | uuid | YES |  |
| authority_type | text | NO |  |
| authority_level | integer | NO | 0 |
| title | text | YES |  |
| description | text | YES |  |
| category | text | YES |  |
| sha256 | text | YES |  |
| payload_hash | text | YES |  |
| created_at | timestamp with time zone | YES | now() |
| supersedes_authority | uuid | YES |  |
| source_system | text | YES |  |
| canonical_path | text | YES |  |
| status | text | YES | 'active'::text |

## authority_supersession

**Type:** BASE TABLE
**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| id | uuid | NO |  |
| superseded | uuid | NO |  |
| superseded_by | uuid | YES |  |
| reason | text | YES |  |
| created_at | timestamp with time zone | YES | now() |

## authority_witness

**Type:** BASE TABLE
**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| id | uuid | NO |  |
| artifact_id | uuid | YES |  |
| witness_root | text | YES |  |
| witness_signature | text | YES |  |
| witness_timestamp | timestamp with time zone | YES |  |
| created_at | timestamp with time zone | YES | now() |

## citations

**Type:** BASE TABLE
**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| source_object | uuid | YES |  |
| target_object | uuid | YES |  |
| citation_type | text | YES |  |
| created_at | timestamp with time zone | YES | now() |

## claims

**Type:** BASE TABLE
**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| claim_text | text | NO |  |
| confidence | numeric | YES |  |
| created_at | timestamp with time zone | YES | now() |

## entities

**Type:** BASE TABLE
**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| name | text | NO |  |
| entity_type | text | YES |  |
| created_at | timestamp with time zone | YES | now() |

## events

**Type:** BASE TABLE
**Row Count:** 15

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| event_id | uuid | NO |  |
| event_type | character varying | NO |  |
| timestamp | timestamp with time zone | NO |  |
| aggregate_id | uuid | NO |  |
| aggregate_type | character varying | NO |  |
| event_data | jsonb | NO |  |
| causation_id | uuid | YES |  |
| correlation_id | uuid | YES |  |
| metadata | jsonb | YES |  |
| processed_at | timestamp with time zone | YES |  |
| projected_at | timestamp with time zone | YES |  |
| projected_to_qdrant | boolean | YES | false |

## lineage

**Type:** BASE TABLE
**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| lineage_id | uuid | NO |  |
| root_object_id | uuid | NO |  |
| created_at | timestamp with time zone | NO |  |
| current_version | integer | NO | 1 |
| metadata | jsonb | YES |  |

## objects

**Type:** BASE TABLE
**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| object_id | uuid | NO |  |
| content_hash | character varying | NO |  |
| created_at | timestamp with time zone | NO |  |
| version | integer | NO | 1 |
| lineage_id | uuid | NO |  |
| content_type | character varying | YES |  |
| content_size | bigint | YES |  |
| metadata | jsonb | YES |  |
| archived_at | timestamp with time zone | YES |  |
| source | text | YES |  |
| source_id | text | YES |  |
| title | text | YES |  |
| updated_at | timestamp with time zone | YES |  |

## projections

**Type:** BASE TABLE
**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| projection_id | uuid | NO |  |
| projection_type | character varying | NO |  |
| projection_name | character varying | NO |  |
| source_aggregate_id | uuid | YES |  |
| projection_data | jsonb | NO |  |
| created_at | timestamp with time zone | NO |  |
| updated_at | timestamp with time zone | NO |  |
| last_event_id | uuid | YES |  |
| status | character varying | NO | 'active'::character varying |

## relationships

**Type:** BASE TABLE
**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| source_object | uuid | YES |  |
| target_object | uuid | YES |  |
| relationship_type | text | NO |  |
| confidence | numeric | YES |  |
| created_at | timestamp with time zone | YES | now() |

## system_metadata

**Type:** BASE TABLE
**Row Count:** 2

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| key | character varying | NO |  |
| value | jsonb | NO |  |
| created_at | timestamp with time zone | NO |  |
| updated_at | timestamp with time zone | NO |  |
| version | integer | NO | 1 |

## topics

**Type:** BASE TABLE
**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| name | text | NO |  |
| created_at | timestamp with time zone | YES | now() |

