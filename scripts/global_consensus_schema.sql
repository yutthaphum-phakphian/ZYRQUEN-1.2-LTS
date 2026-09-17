-- =============================================================================
-- ZYRQUEN Ω∞ Senate Gate — Geo-Distributed Multi-Region Consensus Schema v5.0 LTS
-- Engine: CockroachDB / Distributed PostgreSQL with Survives-Region HA
-- =============================================================================

-- 1. Database Creation & Multi-Region Topology
CREATE DATABASE IF NOT EXISTS zyrquen_senate_global;
SET DATABASE = zyrquen_senate_global;

-- Configure Multi-Region Failover Architecture
ALTER DATABASE zyrquen_senate_global SET PRIMARY REGION "us-east-1";
ALTER DATABASE zyrquen_senate_global ADD REGION "eu-central-1";
ALTER DATABASE zyrquen_senate_global ADD REGION "ap-southeast-1";
ALTER DATABASE zyrquen_senate_global SET SURVIVE REGION FAILURE;

-- 2. Senate Epochs & Consensus Lineage (Global Table)
CREATE TABLE IF NOT EXISTS senate_epochs (
    epoch_id BIGINT PRIMARY KEY,
    raft_term BIGINT NOT NULL,
    merkle_state_root VARCHAR(64) NOT NULL,
    prev_merkle_root VARCHAR(64) NOT NULL,
    lease_holder_did VARCHAR(128) NOT NULL,
    primary_region VARCHAR(32) NOT NULL DEFAULT 'us-east-1',
    committed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    quorum_attested BOOLEAN NOT NULL DEFAULT true,
    total_proposals_evaluated INT NOT NULL DEFAULT 0,
    INDEX idx_epochs_committed (committed_at DESC)
) LOCALITY GLOBAL;

-- 3. Senate Node Cryptographic Attestation Directory
CREATE TABLE IF NOT EXISTS senate_node_attestations (
    node_did VARCHAR(128) NOT NULL,
    region VARCHAR(32) NOT NULL,
    senator_name VARCHAR(128) NOT NULL,
    role VARCHAR(64) NOT NULL,
    hsm_fips_level INT NOT NULL CHECK (hsm_fips_level >= 4),
    pqc_algorithm VARCHAR(64) NOT NULL DEFAULT 'ML-DSA-87',
    public_key_pqc TEXT NOT NULL,
    hardware_serial VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ATTESTED',
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (region, node_did)
) LOCALITY REGIONAL BY ROW;

-- 4. Sovereign Bills & Statutory Quorum Catalog
CREATE TABLE IF NOT EXISTS senate_bills_quorum (
    bill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_code VARCHAR(32) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    thai_title VARCHAR(255) NOT NULL,
    risk_level VARCHAR(16) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    statutory_framework VARCHAR(128) NOT NULL DEFAULT 'ETDA B.E. 2544',
    required_quorum_ratio NUMERIC(4,3) NOT NULL DEFAULT 0.600,
    min_core_votes INT NOT NULL DEFAULT 3,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
) LOCALITY GLOBAL;

-- 5. Immutable Append-Only Senate Vote Ledger (Partitioned by Region)
CREATE TABLE IF NOT EXISTS senate_votes_immutable (
    vote_id UUID NOT NULL DEFAULT gen_random_uuid(),
    region VARCHAR(32) NOT NULL,
    bill_code VARCHAR(32) NOT NULL REFERENCES senate_bills_quorum(bill_code),
    node_did VARCHAR(128) NOT NULL,
    decision VARCHAR(16) NOT NULL CHECK (decision IN ('APPROVE', 'REJECT', 'ABSTAIN')),
    signature_algorithm VARCHAR(64) NOT NULL,
    signature_hex TEXT NOT NULL,
    signature_verified BOOLEAN NOT NULL DEFAULT true,
    evaluation_latency_us INT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (region, vote_id),
    INDEX idx_votes_bill (bill_code, recorded_at DESC)
) LOCALITY REGIONAL BY ROW;

-- 6. OPA & Short-Circuit Policy Decision Telemetry Log
CREATE TABLE IF NOT EXISTS senate_decision_audit_logs (
    audit_id UUID NOT NULL DEFAULT gen_random_uuid(),
    region VARCHAR(32) NOT NULL,
    agent_did VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL,
    decision VARCHAR(16) NOT NULL CHECK (decision IN ('ALLOWED', 'DENIED')),
    security_severity VARCHAR(16) NOT NULL CHECK (security_severity IN ('INFO', 'CRITICAL_ALERT')),
    short_circuit_guard VARCHAR(64),
    eval_latency_us INT NOT NULL,
    raw_input_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (region, audit_id),
    INDEX idx_audit_time (created_at DESC),
    INDEX idx_audit_agent (agent_did, created_at DESC)
) LOCALITY REGIONAL BY ROW;

-- 7. Seed Initial Consensus Genesis Node Attestations
INSERT INTO senate_epochs (epoch_id, raft_term, merkle_state_root, prev_merkle_root, lease_holder_did, primary_region)
VALUES (
    849204,
    4209,
    '22fcaea30a157ccabf92159e5fe0c0ac7b3e198fae32a48b91950d8847d0e82f',
    '819920aafe301cde92a40b195fbc990172eabbccdd881902847a98bce1780001',
    'did:key:z6MkuEP_SOVEREIGN_01_FIPS140_3_HSM',
    'us-east-1'
) ON CONFLICT (epoch_id) DO NOTHING;
