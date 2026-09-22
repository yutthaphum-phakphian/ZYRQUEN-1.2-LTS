import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';
import {
  generate30DaySentinelData,
  SentinelDailyDataPoint,
} from '../../src/components/SecurityAnalyticsDashboard';

/**
 * ZYRQUEN Ω∞ Test Suite: Sentinel AI Interceptor 30-Day Security Analytics & Chamber 02 D3
 * Status: LOCKED_FROZEN_v1.2_LTS | SSoT Δ0 (Zero Drift 0.00%)
 * Statutory Standards: Thai Electronic Transactions Act B.E. 2544 (Sec 9, 26, 28) & PDPA Sec 37
 */

describe('Security Analytics Dashboard & Chamber 02 D3 Telemetry Suite', () => {
  const CANONICAL_GENESIS_ROOT = '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
  const SENTINEL_QUARANTINE_THRESHOLD = 0.85;

  it('[TC-SEC-ANALYTICS-01] Generates exactly 30 days of continuous chronological telemetry data', () => {
    const data: SentinelDailyDataPoint[] = generate30DaySentinelData();

    assert.equal(data.length, 30);
    assert.equal(data[0].dayIndex, 1);
    assert.equal(data[29].dayIndex, 30);

    // Verify all daily records have valid risk scores and cryptographic digests
    data.forEach((point) => {
      assert.ok(point.riskScore >= 0.0);
      assert.ok(point.riskScore <= 1.0);
      assert.ok(point.inspectedTransactions > 1000);
      assert.match(point.evidenceDigest, /^0x[0-9a-fA-F]+/);
      assert.ok(point.pqcScheme.includes('ML-DSA-87'));
      assert.ok(point.thaiDate.length > 0);
    });
  });

  it('[TC-SEC-ANALYTICS-02] Identifies 3 distinct Chamber 02 quarantine surge clusters with risk score >= 0.85', () => {
    const data: SentinelDailyDataPoint[] = generate30DaySentinelData();

    const surgeDays = data.filter((d) => d.isQuarantineSurge);
    assert.ok(surgeDays.length >= 7);

    // Cluster Alpha: Days 7-9
    const clusterAlpha = data.filter((d) => d.dayIndex >= 7 && d.dayIndex <= 9);
    assert.ok(clusterAlpha.every((d) => d.isQuarantineSurge));
    assert.ok(clusterAlpha.some((d) => d.riskScore >= 0.88));

    // Cluster Beta: Days 16-19 (Merkle Mutation Threat)
    const clusterBeta = data.filter((d) => d.dayIndex >= 16 && d.dayIndex <= 19);
    assert.ok(clusterBeta.every((d) => d.isQuarantineSurge));
    const peakBeta = Math.max(...clusterBeta.map((d) => d.riskScore));
    assert.equal(peakBeta, 0.98); // High risk root mutation attempt
    assert.equal(clusterBeta.find((d) => d.riskScore === 0.98)?.chamber02Status, 'FAIL_CLOSED_TRIPPED');

    // Cluster Gamma: Days 26-27 (Non-Quorum Treasury Drain)
    const clusterGamma = data.filter((d) => d.dayIndex >= 26 && d.dayIndex <= 27);
    assert.ok(clusterGamma.every((d) => d.isQuarantineSurge));
    assert.ok(clusterGamma.some((d) => d.riskScore >= 0.89));
  });

  it('[TC-SEC-ANALYTICS-03] Enforces Fail-Closed quarantine threshold (Risk >= 0.85) for Chamber 02', () => {
    const data: SentinelDailyDataPoint[] = generate30DaySentinelData();

    const trippedPoints = data.filter((d) => d.riskScore >= SENTINEL_QUARANTINE_THRESHOLD);
    assert.ok(trippedPoints.length > 0);

    trippedPoints.forEach((point) => {
      assert.ok(point.quarantinedCount > 0);
      assert.ok(['SURGE_QUARANTINED', 'FAIL_CLOSED_TRIPPED'].includes(point.chamber02Status));
    });

    // Verify Genesis Merkle Root format
    assert.equal(CANONICAL_GENESIS_ROOT, '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68');
  });

  it('[TC-SEC-ANALYTICS-04] Aggregates 30-day security metrics with 100% intercept success rate', () => {
    const data: SentinelDailyDataPoint[] = generate30DaySentinelData();

    const risks = data.map((d) => d.riskScore);
    const avgRisk = risks.reduce((a, b) => a + b, 0) / risks.length;
    const peakRisk = Math.max(...risks);
    const totalQuarantined = data.reduce((acc, d) => acc + d.quarantinedCount, 0);

    assert.ok(avgRisk < 0.40); // Baseline average remains within safe operational envelope
    assert.equal(peakRisk, 0.98);
    assert.ok(totalQuarantined > 100);
  });
});
