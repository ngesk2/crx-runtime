-- Constitutional Freeze Registry Migration
-- Purpose: Create registry for frozen constitutional documents with hash sovereignty
-- Authority: CONSTITUTIONAL_LAW
-- Status: MIGRATION ONLY - No data population
-- Version: 1.0
-- Date: 2026-06-24

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Constitutional Freeze Registry Table
CREATE TABLE IF NOT EXISTS constitutional_freeze_registry (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Document metadata
    file_path TEXT NOT NULL,
    authority_class VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    kernel_position VARCHAR(50),
    
    -- Hash sovereignty
    sha256_hash CHAR(64) NOT NULL,
    hash_algorithm VARCHAR(20) DEFAULT 'SHA256',
    hash_encoding VARCHAR(20) DEFAULT 'hexadecimal_lowercase',
    
    -- Freeze tracking
    frozen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    frozen_by VARCHAR(255) NOT NULL DEFAULT 'constitutional_audit',
    freeze_reason TEXT,
    
    -- Amendment tracking
    amendment_count INTEGER DEFAULT 0,
    last_amendment_at TIMESTAMP WITH TIME ZONE,
    amendment_history JSONB DEFAULT '[]'::jsonb,
    
    -- Verification
    verification_status VARCHAR(50) DEFAULT 'verified',
    verification_method VARCHAR(100),
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verification_metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Dependencies
    dependencies JSONB DEFAULT '[]'::jsonb,
    dependents JSONB DEFAULT '[]'::jsonb,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL DEFAULT 'constitutional_audit',
    updated_by VARCHAR(255) NOT NULL DEFAULT 'constitutional_audit',
    
    -- Constraints
    CONSTRAINT chk_sha256_length CHECK (LENGTH(sha256_hash) = 64),
    CONSTRAINT chk_sha256_hex CHECK (sha256_hash ~ '^[a-f0-9]{64}$'),
    CONSTRAINT chk_authority_class CHECK (authority_class IN (
        'CONSTITUTIONAL_LAW',
        'GOVERNANCE_AUTHORITY',
        'AGENT_CONSTITUTION',
        'CANONICAL_SPEC'
    )),
    CONSTRAINT chk_status CHECK (status IN (
        'FROZEN',
        'FOUNDATIONAL',
        'CONSTITUTIONAL_FREEZE',
        'ACTIVE',
        'DRAFT',
        'ARCHIVED'
    )),
    CONSTRAINT chk_kernel_position CHECK (kernel_position IS NULL OR kernel_position IN (
        'root_law',
        'ontological',
        'foundational'
    )),
    CONSTRAINT chk_verification_status CHECK (verification_status IN (
        'verified',
        'pending',
        'failed',
        'unknown'
    ))
);

-- Create indexes for common queries
CREATE INDEX idx_constitutional_freeze_registry_document_id ON constitutional_freeze_registry(document_id);
CREATE INDEX idx_constitutional_freeze_registry_file_path ON constitutional_freeze_registry(file_path);
CREATE INDEX idx_constitutional_freeze_registry_authority_class ON constitutional_freeze_registry(authority_class);
CREATE INDEX idx_constitutional_freeze_registry_status ON constitutional_freeze_registry(status);
CREATE INDEX idx_constitutional_freeze_registry_sha256_hash ON constitutional_freeze_registry(sha256_hash);
CREATE INDEX idx_constitutional_freeze_registry_kernel_position ON constitutional_freeze_registry(kernel_position);
CREATE INDEX idx_constitutional_freeze_registry_frozen_at ON constitutional_freeze_registry(frozen_at);
CREATE INDEX idx_constitutional_freeze_registry_verification_status ON constitutional_freeze_registry(verification_status);

-- Create GIN index for JSONB fields
CREATE INDEX idx_constitutional_freeze_registry_dependencies ON constitutional_freeze_registry USING GIN(dependencies);
CREATE INDEX idx_constitutional_freeze_registry_dependents ON constitutional_freeze_registry USING GIN(dependents);
CREATE INDEX idx_constitutional_freeze_registry_metadata ON constitutional_freeze_registry USING GIN(metadata);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_constitutional_freeze_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_constitutional_freeze_registry_updated_at
    BEFORE UPDATE ON constitutional_freeze_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_constitutional_freeze_registry_updated_at();

-- Constitutional Freeze Audit Log Table
CREATE TABLE IF NOT EXISTS constitutional_freeze_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    action_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- State before action
    old_sha256_hash CHAR(64),
    old_status VARCHAR(50),
    old_amendment_count INTEGER,
    
    -- State after action
    new_sha256_hash CHAR(64),
    new_status VARCHAR(50),
    new_amendment_count INTEGER,
    
    -- Action details
    reason TEXT,
    action_metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constitutional compliance
    constitutional_compliance BOOLEAN DEFAULT true,
    compliance_notes TEXT,
    
    -- Foreign key reference
    registry_id UUID REFERENCES constitutional_freeze_registry(id) ON DELETE SET NULL
);

-- Create indexes for audit log
CREATE INDEX idx_constitutional_freeze_audit_log_document_id ON constitutional_freeze_audit_log(document_id);
CREATE INDEX idx_constitutional_freeze_audit_log_action ON constitutional_freeze_audit_log(action);
CREATE INDEX idx_constitutional_freeze_audit_log_action_type ON constitutional_freeze_audit_log(action_type);
CREATE INDEX idx_constitutional_freeze_audit_log_actor ON constitutional_freeze_audit_log(actor);
CREATE INDEX idx_constitutional_freeze_audit_log_action_timestamp ON constitutional_freeze_audit_log(action_timestamp);
CREATE INDEX idx_constitutional_freeze_audit_log_registry_id ON constitutional_freeze_audit_log(registry_id);

-- Constitutional Amendment History Table (detailed)
CREATE TABLE IF NOT EXISTS constitutional_amendment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id VARCHAR(255) NOT NULL,
    amendment_number INTEGER NOT NULL,
    amendment_type VARCHAR(50) NOT NULL,
    
    -- Amendment metadata
    amendment_title TEXT,
    amendment_description TEXT,
    amendment_author VARCHAR(255) NOT NULL,
    amendment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Hash tracking
    previous_sha256_hash CHAR(64) NOT NULL,
    new_sha256_hash CHAR(64) NOT NULL,
    
    -- Approval tracking
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_method VARCHAR(100),
    
    -- Amendment content
    amendment_diff TEXT,
    amendment_justification TEXT,
    
    -- Constitutional compliance
    constitutional_compliance BOOLEAN DEFAULT true,
    compliance_notes TEXT,
    
    -- Foreign key reference
    registry_id UUID REFERENCES constitutional_freeze_registry(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_amendment_type CHECK (amendment_type IN (
        'patch',
        'amendment',
        'correction',
        'clarification',
        'expansion',
        'retraction'
    ))
);

-- Create unique constraint for document_id + amendment_number
CREATE UNIQUE INDEX idx_constitutional_amendment_history_doc_amendment ON constitutional_amendment_history(document_id, amendment_number);

-- Create indexes for amendment history
CREATE INDEX idx_constitutional_amendment_history_document_id ON constitutional_amendment_history(document_id);
CREATE INDEX idx_constitutional_amendment_history_amendment_date ON constitutional_amendment_history(amendment_date);
CREATE INDEX idx_constitutional_amendment_history_amendment_author ON constitutional_amendment_history(amendment_author);
CREATE INDEX idx_constitutional_amendment_history_registry_id ON constitutional_amendment_history(registry_id);

-- Constitutional Verification Log Table
CREATE TABLE IF NOT EXISTS constitutional_verification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id VARCHAR(255) NOT NULL,
    verification_type VARCHAR(50) NOT NULL,
    
    -- Verification metadata
    verified_by VARCHAR(255) NOT NULL,
    verification_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    verification_method VARCHAR(100) NOT NULL,
    
    -- Hash verification
    expected_sha256_hash CHAR(64) NOT NULL,
    actual_sha256_hash CHAR(64) NOT NULL,
    hash_match BOOLEAN NOT NULL,
    
    -- Content verification
    content_integrity BOOLEAN DEFAULT true,
    content_verification_details TEXT,
    
    -- Dependency verification
    dependency_integrity BOOLEAN DEFAULT true,
    dependency_verification_details TEXT,
    
    -- Overall result
    verification_result VARCHAR(50) NOT NULL,
    verification_notes TEXT,
    
    -- Foreign key reference
    registry_id UUID REFERENCES constitutional_freeze_registry(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_verification_type CHECK (verification_type IN (
        'hash',
        'content',
        'dependency',
        'full',
        'replay'
    )),
    CONSTRAINT chk_verification_result CHECK (verification_result IN (
        'passed',
        'failed',
        'partial',
        'unknown'
    ))
);

-- Create indexes for verification log
CREATE INDEX idx_constitutional_verification_log_document_id ON constitutional_verification_log(document_id);
CREATE INDEX idx_constitutional_verification_log_verification_type ON constitutional_verification_log(verification_type);
CREATE INDEX idx_constitutional_verification_log_verification_timestamp ON constitutional_verification_log(verification_timestamp);
CREATE INDEX idx_constitutional_verification_log_verification_result ON constitutional_verification_log(verification_result);
CREATE INDEX idx_constitutional_verification_log_registry_id ON constitutional_verification_log(registry_id);

-- Comments on tables
COMMENT ON TABLE constitutional_freeze_registry IS 'Registry for frozen constitutional documents with hash sovereignty';
COMMENT ON TABLE constitutional_freeze_audit_log IS 'Audit log for all constitutional freeze registry actions';
COMMENT ON TABLE constitutional_amendment_history IS 'Detailed history of constitutional amendments';
COMMENT ON TABLE constitutional_verification_log IS 'Verification log for constitutional document integrity';

-- Comments on important columns
COMMENT ON COLUMN constitutional_freeze_registry.document_id IS 'Unique identifier for the constitutional document';
COMMENT ON COLUMN constitutional_freeze_registry.sha256_hash IS 'SHA256 hash of the document content for hash sovereignty';
COMMENT ON COLUMN constitutional_freeze_registry.frozen_at IS 'Timestamp when document was frozen';
COMMENT ON COLUMN constitutional_freeze_registry.amendment_count IS 'Number of amendments applied to the document';
COMMENT ON COLUMN constitutional_freeze_registry.dependencies IS 'JSONB array of document IDs this document depends on';
COMMENT ON COLUMN constitutional_freeze_registry.dependents IS 'JSONB array of document IDs that depend on this document';

-- Grant permissions (adjust as needed for your system)
-- GRANT SELECT, INSERT, UPDATE ON constitutional_freeze_registry TO constitutional_admin;
-- GRANT SELECT ON constitutional_freeze_registry TO constitutional_reader;
-- GRANT SELECT, INSERT ON constitutional_freeze_audit_log TO constitutional_admin;
-- GRANT SELECT ON constitutional_freeze_audit_log TO constitutional_reader;
-- GRANT SELECT, INSERT ON constitutional_amendment_history TO constitutional_admin;
-- GRANT SELECT ON constitutional_amendment_history TO constitutional_reader;
-- GRANT SELECT, INSERT ON constitutional_verification_log TO constitutional_admin;
-- GRANT SELECT ON constitutional_verification_log TO constitutional_reader;

-- Migration complete
-- Next step: Phase 6 - Populate registry with INSERT statements (constitutional_freeze_seed.sql)
