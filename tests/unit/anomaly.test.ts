import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isAnomalyEvent } from '../../src/services/anomalyDetector.js';

describe('Anomaly Detection Engine', () => {
  it('SSoT drift remains 0.00% is NOT treated as an anomaly', () => {
    const normalEvent = {
      id: 'EVT-NOMINAL-01',
      timestamp: new Date().toISOString(),
      eventType: 'POST_QUANTUM_MERKLE_ROOT_VERIFICATION',
      status: 'SUCCESS' as const,
      operator: 'dr-apichaya-sovereign',
      driftPercentage: 0.00,
    };
    assert.equal(isAnomalyEvent(normalEvent), false);
  });

  it('drift >= 15% is detected as an anomaly', () => {
    const highDriftEvent = {
      id: 'EVT-DRIFT-01',
      timestamp: new Date().toISOString(),
      eventType: 'ATMOSPHERIC_ENTROPY_DRIFT',
      status: 'SUCCESS' as const,
      operator: 'system-observer',
      driftPercentage: 15.01,
    };
    assert.equal(isAnomalyEvent(highDriftEvent), true);
  });

  it('FAILED or TAMPERED status is always flagged as anomaly', () => {
    const failedEvent = {
      id: 'EVT-FAIL-01',
      timestamp: new Date().toISOString(),
      eventType: 'STATE_RECONCILIATION',
      status: 'FAILED' as const,
      operator: 'observer',
      driftPercentage: 0.0,
    };
    const tamperedEvent = {
      id: 'EVT-TAMP-01',
      timestamp: new Date().toISOString(),
      eventType: 'CRYPTO_SEAL',
      status: 'TAMPERED' as const,
      operator: 'unknown',
      driftPercentage: 0.0,
    };
    assert.equal(isAnomalyEvent(failedEvent), true);
    assert.equal(isAnomalyEvent(tamperedEvent), true);
  });
});
