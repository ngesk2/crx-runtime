-- CRX Constitutional Runtime Database Initialization
-- This script initializes the constitutional kernel database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table (append-only, immutable)
CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(255) NOT NULL,
    actor_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    payload JSONB NOT NULL,
    lineage JSONB NOT NULL DEFAULT '{}'::jsonb,
    policy_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_lineage CHECK (lineage ? 'parent_event_ids')
);

-- Indexes for event queries
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_actor ON events(actor_id);
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_events_lineage_parents ON events USING GIN ((lineage->'parent_event_ids'));
CREATE INDEX idx_events_payload ON events USING GIN (payload);

-- Policy evaluations table
CREATE TABLE IF NOT EXISTS policy_evaluations (
    evaluation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id),
    policy_id VARCHAR(255) NOT NULL,
    policy_version VARCHAR(50) NOT NULL,
    decision VARCHAR(50) NOT NULL, -- 'allow', 'deny', 'modify'
    reasoning TEXT,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, policy_id)
);

-- Lineage chains table for fast replay
CREATE TABLE IF NOT EXISTS lineage_chains (
    chain_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    root_event_id UUID NOT NULL REFERENCES events(event_id),
    leaf_event_id UUID NOT NULL REFERENCES events(event_id),
    chain_depth INTEGER NOT NULL,
    chain_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lineage_root ON lineage_chains(root_event_id);
CREATE INDEX idx_lineage_leaf ON lineage_chains(leaf_event_id);

-- Replay snapshots table
CREATE TABLE IF NOT EXISTS replay_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_name VARCHAR(255) NOT NULL,
    event_id UUID NOT NULL REFERENCES events(event_id),
    state_hash VARCHAR(64) NOT NULL,
    state_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(snapshot_name, event_id)
);

-- Constitutional violations table
CREATE TABLE IF NOT EXISTS constitutional_violations (
    violation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id),
    violation_type VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    description TEXT NOT NULL,
    remediation_status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_violations_status ON constitutional_violations(remediation_status);
CREATE INDEX idx_violations_severity ON constitutional_violations(severity);

-- Agent executions table
CREATE TABLE IF NOT EXISTS agent_executions (
    execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id),
    agent_id VARCHAR(255) NOT NULL,
    agent_type VARCHAR(255) NOT NULL,
    execution_status VARCHAR(50) NOT NULL, -- 'pending', 'running', 'completed', 'failed'
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_agent_status ON agent_executions(execution_status);
CREATE INDEX idx_agent_type ON agent_executions(agent_type);

-- Facts table (current truth)
CREATE TABLE IF NOT EXISTS facts (
    fact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fact_key VARCHAR(255) NOT NULL UNIQUE,
    fact_value JSONB NOT NULL,
    source_event_id UUID REFERENCES events(event_id),
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_current BOOLEAN DEFAULT true
);

CREATE INDEX idx_facts_key ON facts(fact_key);
CREATE INDEX idx_facts_current ON facts(is_current) WHERE is_current = true;

-- Claims table (assertions awaiting validation)
CREATE TABLE IF NOT EXISTS claims (
    claim_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_key VARCHAR(255) NOT NULL,
    claim_value JSONB NOT NULL,
    source_event_id UUID NOT NULL REFERENCES events(event_id),
    claim_status VARCHAR(50) NOT NULL, -- 'pending', 'accepted', 'rejected'
    validation_event_id UUID REFERENCES events(event_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_claims_status ON claims(claim_status);
CREATE INDEX idx_claims_key ON claims(claim_key);

-- Rules table (constitutional constraints)
CREATE TABLE IF NOT EXISTS rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_key VARCHAR(255) NOT NULL UNIQUE,
    rule_definition JSONB NOT NULL,
    rule_version VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rules_active ON rules(is_active) WHERE is_active = true;

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id),
    audit_type VARCHAR(255) NOT NULL,
    audit_data JSONB NOT NULL,
    auditor_id VARCHAR(255),
    audited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_type ON audit_log(audit_type);
CREATE INDEX idx_audit_event ON audit_log(event_id);

-- Insert initial constitutional rule
INSERT INTO rules (rule_key, rule_definition, rule_version) 
VALUES (
    'reuse_before_create',
    '{"description": "Before creating ANY file, search repository for overlapping functionality. If functionality overlaps, MERGE IT. If systems duplicate, CANONICALIZE THEM.", "severity": "critical"}'::jsonb,
    '0.1'
) ON CONFLICT (rule_key) DO NOTHING;
