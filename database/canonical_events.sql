-- Canonical Event Envelope Schema
-- P001: The foundation for all tenant events

CREATE TABLE IF NOT EXISTS canonical_events (
  -- Identity
  event_id UUID PRIMARY KEY,
  event_type VARCHAR(255) NOT NULL,
  event_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  
  -- Tenant
  tenant_id VARCHAR(255) NOT NULL,
  
  -- Timing
  timestamp TIMESTAMPTZ NOT NULL,
  sequence BIGINT NOT NULL,
  
  -- Source
  source VARCHAR(255) NOT NULL,
  actor VARCHAR(255) NOT NULL,
  
  -- Causation
  causation_id UUID,
  correlation_id UUID,
  
  -- Data
  payload JSONB NOT NULL,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Processing
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  worker VARCHAR(255),
  retries INT DEFAULT 0,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE (tenant_id, sequence)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_canonical_events_tenant ON canonical_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_canonical_events_type ON canonical_events(event_type);
CREATE INDEX IF NOT EXISTS idx_canonical_events_timestamp ON canonical_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_canonical_events_correlation ON canonical_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_canonical_events_causation ON canonical_events(causation_id);
CREATE INDEX IF NOT EXISTS idx_canonical_events_unprocessed ON canonical_events(processed, tenant_id, timestamp) WHERE NOT processed;

-- Tenant Registry
CREATE TABLE IF NOT EXISTS tenant_registry (
  tenant_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domains TEXT[] DEFAULT '{}',
  
  -- Endpoints
  health_endpoint VARCHAR(512),
  metrics_endpoint VARCHAR(512),
  logs_endpoint VARCHAR(512),
  traces_endpoint VARCHAR(512),
  events_endpoint VARCHAR(512),
  
  -- Auth
  auth_token_hash VARCHAR(255),
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  version VARCHAR(50),
  git_sha VARCHAR(50),
  deployment_id VARCHAR(255),
  environment VARCHAR(50) DEFAULT 'production',
  
  -- Metadata
  capabilities TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deployment Registry
CREATE TABLE IF NOT EXISTS deployment_registry (
  deployment_id UUID PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenant_registry(tenant_id),
  
  -- Version
  version VARCHAR(50) NOT NULL,
  git_sha VARCHAR(50) NOT NULL,
  build_timestamp TIMESTAMPTZ,
  
  -- Infrastructure
  container_image VARCHAR(512),
  oracle_region VARCHAR(100),
  environment VARCHAR(50) DEFAULT 'production',
  
  -- Status
  status VARCHAR(50) DEFAULT 'deploying',
  health VARCHAR(50) DEFAULT 'unknown',
  
  -- Blue/Green
  active_slot VARCHAR(10),
  blue_version VARCHAR(50),
  green_version VARCHAR(50),
  
  -- Rollback
  rollback_target VARCHAR(50),
  
  -- Timestamps
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Uniqueness: one deployment per (tenant, version)
  UNIQUE (tenant_id, version)
);

CREATE INDEX IF NOT EXISTS idx_deployment_registry_tenant ON deployment_registry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deployment_registry_status ON deployment_registry(status);
CREATE INDEX IF NOT EXISTS idx_deployment_registry_deployed ON deployment_registry(deployed_at DESC);

-- Runtime Registry
CREATE TABLE IF NOT EXISTS runtime_registry (
  runtime_id VARCHAR(512) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenant_registry(tenant_id),
  
  -- Component
  component_type VARCHAR(100) NOT NULL,
  component_name VARCHAR(255) NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'unknown',
  health VARCHAR(50) DEFAULT 'unknown',
  health_score DECIMAL(3,2) DEFAULT 0.00,
  
  -- Versioning
  version VARCHAR(50),
  build_sha VARCHAR(50),
  compiler_sha VARCHAR(50),
  contract_hash VARCHAR(255),
  authority_version VARCHAR(50) DEFAULT '1.0.0',
  event_version VARCHAR(50) DEFAULT '1.0.0',
  schema_version VARCHAR(50) DEFAULT '1.0.0',
  
  -- Deployment
  deployment_id VARCHAR(255),
  node_id VARCHAR(255),
  
  -- Observability
  uptime_seconds BIGINT,
  memory_usage_bytes BIGINT,
  cpu_usage_percent DECIMAL(5,2),
  latency_ms DECIMAL(10,2),
  error_rate DECIMAL(5,4),
  queue_depth INT,
  
  -- Endpoints
  health_endpoint VARCHAR(512),
  metrics_endpoint VARCHAR(512),
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  UNIQUE (tenant_id, component_type, component_name)
);

CREATE INDEX IF NOT EXISTS idx_runtime_registry_tenant ON runtime_registry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_runtime_registry_type ON runtime_registry(component_type);
CREATE INDEX IF NOT EXISTS idx_runtime_registry_status ON runtime_registry(status);
CREATE INDEX IF NOT EXISTS idx_runtime_registry_heartbeat ON runtime_registry(last_heartbeat DESC);
