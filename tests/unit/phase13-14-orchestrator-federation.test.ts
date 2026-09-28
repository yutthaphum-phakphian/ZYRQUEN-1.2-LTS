import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { adaptiveRuntimeOrchestrator } from '../../src/core/adaptive-runtime-orchestrator';
import { identityFederationService, FEDERATED_TENANTS } from '../../src/services/identityFederationService';
import { CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '../../src/data/canonicalData';

describe('Phase 13: Adaptive Runtime Orchestrator Suite', () => {
  it('correctly evaluates telemetry and guarantees SLA latency < 142.00 ms', () => {
    const state = adaptiveRuntimeOrchestrator.evaluateTelemetry();
    assert.equal(state.genesisBlock, CANONICAL_GENESIS_BLOCK);
    assert.equal(state.slaTargetMs, 142.0);
    assert.ok(state.activeChamberMetrics.length >= 6);
    assert.ok(state.currentAverageLatencyMs <= 142.0, 'Latency must be within 142ms SLA target');
  });

  it('generates dynamic load-balancing shift proposals when required', () => {
    const metrics = [
      {
        chamberId: 'CH-11',
        chamberName: 'Chamber 11 (Quantum Radar)',
        cpuLoadPct: 82.5,
        cryoTempMK: 15.18,
        estimatedLatencyMs: 14.5,
        status: 'CRITICAL_THROTTLE' as const,
        activeBatchSize: 64,
        recommendedShiftPct: -25,
      },
      {
        chamberId: 'CH-15',
        chamberName: 'Chamber 15 (Sub-Kelvin Core)',
        cpuLoadPct: 22.0,
        cryoTempMK: 14.98,
        estimatedLatencyMs: 3.2,
        status: 'OPTIMAL' as const,
        activeBatchSize: 64,
        recommendedShiftPct: 5,
      },
    ];

    const proposals = adaptiveRuntimeOrchestrator.deriveShiftProposals(metrics, 96.5);
    assert.ok(proposals.length > 0, 'Should generate at least 1 shift proposal for high load chamber');
    assert.ok(proposals[0].projectedLatencyMs < 96.5, 'Projected latency should be lower');
    assert.equal(proposals[0].recommendedBatchShift.toBatchSize, 48);
  });
});

describe('Phase 14: Sovereign Identity Federation Suite', () => {
  it('loads all 4 federated tenant organizations with zero cross-tenant promotion', () => {
    const tenants = identityFederationService.getTenants();
    assert.equal(tenants.length, 4);
    for (const tenant of tenants) {
      assert.equal(tenant.crossTenantPromotion, 'STRICTLY_BLOCKED');
      assert.ok(tenant.keyFingerprint.length > 10);
    }
  });

  it('enforces cryptographic evidence siloing per organization (Zero Cross-Tenant Leakage)', () => {
    identityFederationService.switchTenant('TNT-TH-001');
    const isAllowedSameTenant = identityFederationService.verifyTenantEvidenceIsolation('EVD-01', 'TNT-TH-001');
    const isBlockedOtherTenant = identityFederationService.verifyTenantEvidenceIsolation('EVD-02', 'TNT-TH-002');

    assert.equal(isAllowedSameTenant, true, 'Same tenant evidence access should be granted');
    assert.equal(isBlockedOtherTenant, false, 'Cross-tenant evidence access must be strictly blocked');
  });

  it('generates quantum-resistant session tokens with FIPS 204 signature metadata', () => {
    const session = identityFederationService.switchTenant('TNT-JUDICIAL-004');
    assert.equal(session.tenantId, 'TNT-JUDICIAL-004');
    assert.ok(session.sessionTokenPqc.startsWith('SIG_PQC_DILITHIUM5_FED_'));
    assert.equal(session.etdaComplianceLevel, 'SECTION_28_GOLD');
  });
});
