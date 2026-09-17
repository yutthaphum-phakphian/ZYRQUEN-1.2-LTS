import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getOpaRegoMetrics } from '../../src/data/regoMetrics.js';
import { generateLocalFallbackMetrics } from '../../src/services/regoMetricsService.js';
import { PERFORMANCE_BENCHMARK_SUITE_V12, evaluateSovereignRegoPolicy } from '../../src/data/senateRegoPolicy.js';

describe('OPA Rego /metrics & Evaluation Telemetry', () => {
  it('evaluates Performance Benchmark Suite v1.2 LTS payloads correctly and within SLA (< 50ms)', () => {
    assert.equal(PERFORMANCE_BENCHMARK_SUITE_V12.length, 4, 'Must define exactly 4 v1.2 LTS performance benchmark payloads');

    // 1. Low Risk (READ_METRICS)
    const lowCase = PERFORMANCE_BENCHMARK_SUITE_V12.find(c => c.id === 'bench-perf-low')!;
    assert.ok(lowCase, 'Must include bench-perf-low');
    const lowResult = evaluateSovereignRegoPolicy(lowCase.payload.input);
    assert.equal(lowResult.decision, 'ALLOW');
    assert.ok(lowResult.evalDurationMs < 50.0, 'Low risk evaluation latency must satisfy <50ms SLA');

    // 2. Medium Risk (CREATE_DATABASE_INDEX)
    const medCase = PERFORMANCE_BENCHMARK_SUITE_V12.find(c => c.id === 'bench-perf-med')!;
    assert.ok(medCase, 'Must include bench-perf-med');
    const medResult = evaluateSovereignRegoPolicy(medCase.payload.input);
    assert.equal(medResult.decision, 'ALLOW');
    assert.ok(medResult.evalDurationMs < 50.0, 'Medium risk evaluation latency must satisfy <50ms SLA');

    // 3. High Risk Approved (ALTER_DATABASE_SCHEMA with 3 Senate approvals)
    const highApprovedCase = PERFORMANCE_BENCHMARK_SUITE_V12.find(c => c.id === 'bench-perf-high-approved')!;
    assert.ok(highApprovedCase, 'Must include bench-perf-high-approved');
    const highApprovedResult = evaluateSovereignRegoPolicy(highApprovedCase.payload.input);
    assert.equal(highApprovedResult.decision, 'ALLOW');
    assert.ok(highApprovedResult.evalDurationMs < 50.0, 'High risk approved evaluation latency must satisfy <50ms SLA');

    // 4. Stress High Risk Denied (DROP_DATABASE with rejections)
    const highDeniedCase = PERFORMANCE_BENCHMARK_SUITE_V12.find(c => c.id === 'bench-perf-high-denied')!;
    assert.ok(highDeniedCase, 'Must include bench-perf-high-denied');
    const highDeniedResult = evaluateSovereignRegoPolicy(highDeniedCase.payload.input);
    assert.equal(highDeniedResult.decision, 'REJECT');
    assert.ok(highDeniedResult.evalDurationMs < 50.0, 'Stress denied evaluation latency must satisfy <50ms SLA');
  });
  it('server getOpaRegoMetrics returns healthy status, p99 latency gauge, and throughput trends', () => {
    const metrics = getOpaRegoMetrics();
    assert.equal(metrics.status, 'HEALTHY');
    assert.equal(metrics.engine, 'OPA Rego v0.68.0 (Sovereign Senate Gate)');
    assert.equal(metrics.policyPackage, 'zyrquen.governance.senate');
    assert.ok(metrics.p99LatencyMs > 0 && metrics.p99LatencyMs < 50.0, 'p99 latency must be well under 50ms SLA target');
    assert.ok(metrics.throughputRps >= 800, 'Throughput RPS must meet minimum baseline');
    assert.ok(metrics.totalEvaluations >= 849202);
    assert.ok(Array.isArray(metrics.throughputTrends));
    assert.equal(metrics.throughputTrends.length, 12, 'Must provide 12 historical trend points');
    assert.ok(metrics.throughputTrends[0].throughputRps > 0);
    assert.ok(metrics.throughputTrends[0].p99LatencyMs > 0);
  });

  it('client local fallback engine accurately calculates p99 latency and rule breakdown', () => {
    const local = generateLocalFallbackMetrics();
    assert.equal(local.status, 'HEALTHY');
    assert.ok(local.p99LatencyMs > 0 && local.p99LatencyMs < 50.0);
    assert.ok(local.slaCompliancePct >= 99.0);
    assert.equal(local.rulesBreakdown.length, 4);
    assert.ok(local.rulesBreakdown.some(r => r.rule === 'is_identity_authenticated'));
    assert.ok(local.rulesBreakdown.some(r => r.rule === 'senate_quorum_verification'));
  });
});
