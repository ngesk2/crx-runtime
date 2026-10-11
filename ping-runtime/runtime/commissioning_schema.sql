-- Opt-in TenantRegistry extension. Not executed by production bootstrap.
-- Existing metadata is caller-editable and cannot safely hold trusted owner/grant rows.
-- Separate constrained rows are needed for immutable bindings, locks and receipt uniqueness.
CREATE TABLE IF NOT EXISTS tenant_owner_bindings (
  binding_id TEXT PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL REFERENCES tenant_registry(tenant_id),
  controller_id TEXT NOT NULL,
  owner_actor_id TEXT NOT NULL,
  oidc_issuer TEXT NOT NULL,
  oidc_subject TEXT NOT NULL,
  issuer_id TEXT NOT NULL,
  identity_evidence_digest TEXT NOT NULL,
  business_evidence_digest TEXT NOT NULL,
  issuance JSONB NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(binding_id,tenant_id,controller_id)
);
CREATE TABLE IF NOT EXISTS tenant_commissioning_grants (
  grant_id TEXT PRIMARY KEY,
  owner_binding_id TEXT NOT NULL,
  owner_binding_revision INTEGER NOT NULL,
  issuer_id TEXT NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  controller_id TEXT NOT NULL,
  commissioning_project_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  delegated_actor TEXT NOT NULL,
  authorized_signer TEXT NOT NULL,
  signer_public_key TEXT NOT NULL,
  operations TEXT[] NOT NULL CHECK (cardinality(operations)>0),
  purpose TEXT NOT NULL,
  consent_evidence_digest TEXT NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>0),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,
  revocation_reason_digest TEXT,
  issuance JSONB NOT NULL,
  CHECK(expires_at>valid_from),
  FOREIGN KEY(owner_binding_id,tenant_id,controller_id)
    REFERENCES tenant_owner_bindings(binding_id,tenant_id,controller_id)
);
CREATE TABLE IF NOT EXISTS tenant_admission_receipts (
  tenant_id VARCHAR(64) NOT NULL,
  actor_id TEXT NOT NULL,
  logical_operation_id TEXT NOT NULL,
  operation_digest TEXT NOT NULL,
  grant_id TEXT NOT NULL REFERENCES tenant_commissioning_grants(grant_id),
  grant_revision INTEGER NOT NULL,
  event_id VARCHAR(64) NOT NULL REFERENCES ping_events(event_id),
  receipt JSONB NOT NULL,
  authorization_decision_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(tenant_id,actor_id,logical_operation_id)
);
-- Historical receipts have no proven decision time; never invent a backfill.
ALTER TABLE tenant_admission_receipts ADD COLUMN IF NOT EXISTS authorization_decision_at TIMESTAMPTZ;
