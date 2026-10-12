import { describe, expect, it } from 'vitest';
import { ChartSnapshot, isMetricSustainedAboveThreshold } from '../src/components/HealthDashboard';

const startAt = Date.parse('2026-10-12T04:00:00.000Z');

function samplesFor(metricValues: number[], intervalMs = 60_000): ChartSnapshot[] {
  return metricValues.map((value, index) => ({
    timestamp: new Date(startAt + index * intervalMs).toISOString(),
    cpuUsage: value,
    memoryUsage: value,
    cryostatTemp: 0.015,
    observedAt: startAt + index * intervalMs,
  }));
}

describe('HealthDashboard sustained resource alerts', () => {
  it('does not alert at exactly five minutes', () => {
    const samples = samplesFor([91, 91, 91, 91, 91, 91]);
    expect(isMetricSustainedAboveThreshold(samples, 'cpuUsage', startAt + 5 * 60_000)).toBe(false);
  });

  it('alerts after usage stays above 90% for more than five minutes', () => {
    const samples = samplesFor([91, 91, 91, 91, 91, 91, 92]);
    expect(isMetricSustainedAboveThreshold(samples, 'cpuUsage', startAt + 6 * 60_000)).toBe(true);
    expect(isMetricSustainedAboveThreshold(samples, 'memoryUsage', startAt + 6 * 60_000)).toBe(true);
  });

  it('resets the visual timer when usage returns to 90% or lower', () => {
    const samples = samplesFor([91, 91, 91, 90, 92, 92, 92, 92]);
    expect(isMetricSustainedAboveThreshold(samples, 'cpuUsage', startAt + 7 * 60_000)).toBe(false);
  });

  it('does not bridge telemetry gaps longer than two minutes', () => {
    const samples = samplesFor([91, 91, 91, 91, 91, 91, 91], 3 * 60_000);
    expect(isMetricSustainedAboveThreshold(samples, 'memoryUsage', startAt + 18 * 60_000)).toBe(false);
  });

  it('does not infer an alert without timestamps', () => {
    const samples = samplesFor([91, 91, 91]);
    samples.forEach((sample) => { sample.observedAt = null; });
    expect(isMetricSustainedAboveThreshold(samples, 'cpuUsage', startAt + 10 * 60_000)).toBe(false);
  });
});
