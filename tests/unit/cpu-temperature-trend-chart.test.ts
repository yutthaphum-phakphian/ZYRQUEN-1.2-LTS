import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveChartPoints } from '../../src/components/dashboard/CpuTemperatureTrendChart';
import { INITIAL_HARDWARE_SNAPSHOTS } from '../../src/utils/telemetrySnapshot';
import { HardwareSnapshot } from '../../src/types';

describe('CPU Core Usage & Temperature Trend Derivation Suite', () => {
  it('correctly generates baseline deterministic series from INITIAL_HARDWARE_SNAPSHOTS', () => {
    const points = deriveChartPoints(INITIAL_HARDWARE_SNAPSHOTS);
    assert.ok(points.length >= 10);

    const latest = points[points.length - 1];
    assert.ok(latest.cpuAverage > 0 && latest.cpuAverage <= 100);
    assert.ok(latest.core0 > 0 && latest.core0 <= 100);
    assert.ok(latest.core1 > 0 && latest.core1 <= 100);
    assert.ok(latest.core2 > 0 && latest.core2 <= 100);
    assert.ok(latest.core3 > 0 && latest.core3 <= 100);
    assert.ok(latest.packageTempC >= 25 && latest.packageTempC <= 85);
    assert.ok(latest.cryoTempMk > 0 && latest.cryoTempMk < 50); // Sub-Kelvin cryo
    assert.ok(latest.status === 'OPTIMAL' || latest.status === 'NOMINAL');
  });

  it('correctly maps multi-snapshot hardware telemetry when multiple snapshots are provided', () => {
    const customSnapshots: HardwareSnapshot[] = [
      {
        id: 'SNAP-001',
        snapshotNumber: 1,
        timestampIct: '10:00:00 ICT',
        timestampUtc: '03:00:00 UTC',
        epoch: 1787180000000,
        cpuAverage: 35.0,
        cpuCores: [34.0, 36.0, 35.0, 35.0],
        memoryUsedMb: 5000,
        memoryTotalMb: 8192,
        cryoTempMk: 14.95,
        heliumFlowPct: 74.0,
        networkRxMbps: 50,
        networkTxMbps: 60,
        qopsThroughput: 24000,
        coherencePct: 99.99,
        otelSpansSec: 2000,
      },
      {
        id: 'SNAP-002',
        snapshotNumber: 2,
        timestampIct: '10:01:00 ICT',
        timestampUtc: '03:01:00 UTC',
        epoch: 1787180060000,
        cpuAverage: 45.0,
        cpuCores: [44.0, 46.0, 45.0, 45.0],
        memoryUsedMb: 5100,
        memoryTotalMb: 8192,
        cryoTempMk: 14.98,
        heliumFlowPct: 74.2,
        networkRxMbps: 55,
        networkTxMbps: 65,
        qopsThroughput: 24500,
        coherencePct: 99.98,
        otelSpansSec: 2100,
      },
      {
        id: 'SNAP-003',
        snapshotNumber: 3,
        timestampIct: '10:02:00 ICT',
        timestampUtc: '03:02:00 UTC',
        epoch: 1787180120000,
        cpuAverage: 55.0,
        cpuCores: [52.0, 56.0, 54.0, 58.0],
        memoryUsedMb: 5200,
        memoryTotalMb: 8192,
        cryoTempMk: 15.02,
        heliumFlowPct: 74.5,
        networkRxMbps: 60,
        networkTxMbps: 70,
        qopsThroughput: 25000,
        coherencePct: 99.95,
        otelSpansSec: 2200,
      },
      {
        id: 'SNAP-004',
        snapshotNumber: 4,
        timestampIct: '10:03:00 ICT',
        timestampUtc: '03:03:00 UTC',
        epoch: 1787180180000,
        cpuAverage: 65.0,
        cpuCores: [62.0, 66.0, 64.0, 68.0],
        memoryUsedMb: 5300,
        memoryTotalMb: 8192,
        cryoTempMk: 15.10,
        heliumFlowPct: 75.0,
        networkRxMbps: 65,
        networkTxMbps: 75,
        qopsThroughput: 25500,
        coherencePct: 99.92,
        otelSpansSec: 2300,
      },
    ];

    const points = deriveChartPoints(customSnapshots);
    assert.equal(points.length, 4);

    assert.equal(points[0].snapshotId, 'SNAP-001');
    assert.equal(points[0].core0, 34.0);
    assert.equal(points[0].core1, 36.0);
    assert.equal(points[0].core2, 35.0);
    assert.equal(points[0].core3, 35.0);
    assert.equal(points[0].cpuAverage, 35.0);
    assert.equal(points[0].status, 'OPTIMAL');

    assert.equal(points[3].snapshotId, 'SNAP-004');
    assert.equal(points[3].cpuAverage, 65.0);
    assert.equal(points[3].status, 'NOMINAL');
    assert.equal(points[3].cryoTempMk, 15.10);
  });

  it('guarantees thermal calculation strictly preserves SLA thresholds', () => {
    const points = deriveChartPoints(INITIAL_HARDWARE_SNAPSHOTS);
    for (const pt of points) {
      assert.ok(pt.packageTempC < 85, `Package temperature ${pt.packageTempC} must stay below 85°C circuit breaker limit`);
      assert.ok(pt.cryoTempMk < 25, `Cryogenic bus ${pt.cryoTempMk} mK must maintain sub-Kelvin state`);
    }
  });
});
