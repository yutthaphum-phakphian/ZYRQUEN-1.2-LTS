import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  telemetry,
  isGranularTelemetryEnabled,
  setGranularTelemetryEnabled,
  subscribeGranularTelemetryConfig,
  logTrace,
  recordMetric,
} from '../../src/utils/telemetry.js';

describe('Granular Performance Telemetry & CPU/Memory Optimization Toggle', () => {
  it('toggles granular telemetry state and broadcasts to config subscribers', () => {
    let notifiedState: boolean | null = null;
    const unsub = subscribeGranularTelemetryConfig((enabled) => {
      notifiedState = enabled;
    });

    setGranularTelemetryEnabled(false);
    assert.equal(isGranularTelemetryEnabled(), false, 'Must be disabled');
    assert.equal(notifiedState, false, 'Listener must be notified with false');

    setGranularTelemetryEnabled(true);
    assert.equal(isGranularTelemetryEnabled(), true, 'Must be enabled');
    assert.equal(notifiedState, true, 'Listener must be notified with true');

    unsub();
  });

  it('records routine spans and metrics when granular telemetry is enabled', () => {
    setGranularTelemetryEnabled(true);
    const initialSpansCount = telemetry.getRecentSpans(100).length;

    logTrace({
      operationName: 'ROUTINE_HIGH_FREQUENCY_OP',
      planeId: 'CRYPTO-VERIFY',
      latencyMs: 1.2,
      resultState: 'OK',
    });

    const afterSpans = telemetry.getRecentSpans(100);
    assert.ok(
      afterSpans.length >= initialSpansCount,
      'Span count must be recorded when granular telemetry is enabled'
    );
    const found = afterSpans.find((s) => s.operationName === 'ROUTINE_HIGH_FREQUENCY_OP');
    assert.ok(found, 'Must find routine span in memory buffer');
  });

  it('suppresses routine spans and metrics when granular telemetry is disabled to optimize CPU & memory throughput', () => {
    setGranularTelemetryEnabled(false);

    const span = logTrace({
      operationName: 'SUPPRESSED_ROUTINE_OP_FOR_OPTIMIZATION',
      planeId: 'HARDWARE-TRUST',
      latencyMs: 0.8,
      resultState: 'OK',
    });

    assert.equal(span.traceId, 'TRACE-LEAN-SUPPRESSED', 'Returns lean virtual span without deep allocation');

    const recent = telemetry.getRecentSpans(100);
    const found = recent.find((s) => s.operationName === 'SUPPRESSED_ROUTINE_OP_FOR_OPTIMIZATION');
    assert.equal(found, undefined, 'Routine span must NOT be added to memory buffer when disabled');

    // recordMetric should also be bypassed
    recordMetric({
      metricName: 'SUPPRESSED_METRIC_OP',
      value: 120,
      planeId: 'TENANT-MATRIX',
    });
    const foundMetric = telemetry.getRecentSpans(100).find((s) =>
      s.operationName.includes('SUPPRESSED_METRIC_OP')
    );
    assert.equal(foundMetric, undefined, 'Metric must be bypassed when disabled');
  });

  it('preserves fail-closed and error spans even when granular telemetry is disabled (Security Invariant)', () => {
    setGranularTelemetryEnabled(false);

    // Fail-Closed span must NEVER be dropped
    const blockedSpan = logTrace({
      operationName: 'TAMPER_MUTATION_INTERCEPTED',
      planeId: 'QUARANTINE-FIREWALL',
      latencyMs: 2.5,
      resultState: 'FAIL_CLOSED',
      attributes: { violation: 'CANONICAL_DRIFT_DETECTED' },
    });

    assert.notEqual(blockedSpan.traceId, 'TRACE-LEAN-SUPPRESSED', 'Critical security trace must have authentic traceId');
    assert.equal(blockedSpan.status, 'FAIL_CLOSED');

    const recent = telemetry.getRecentSpans(100);
    const foundBlocked = recent.find((s) => s.operationName === 'TAMPER_MUTATION_INTERCEPTED');
    assert.ok(foundBlocked, 'Critical FAIL_CLOSED trace must be preserved in memory for audit compliance');

    // Restore default
    setGranularTelemetryEnabled(true);
  });
});
