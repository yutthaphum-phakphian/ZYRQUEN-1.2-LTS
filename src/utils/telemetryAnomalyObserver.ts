import { HardwareSnapshot } from '../types';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { generateSha256Hash, logEvent, getEntropyDrift } from './telemetrySnapshot';
import { enforceFailClosed } from './writeFirewall';

export interface TelemetryAnomalyReport {
  id: string;
  metric: string;
  metricLabel: string;
  observedValue: number;
  expectedMean: number;
  standardDeviation: number;
  zScore: number;
  thresholdZ: number;
  severity: 'warning' | 'critical';
  anomalyType: 'THERMAL_OUTLIER' | 'QOPS_DEVIATION' | 'CRYO_DRIFT' | 'VOLTAGE_JITTER' | 'COHERENCE_DROP' | 'COGNITIVE_DRIFT';
  title: string;
  description: string;
  statuteRef: string;
  timestamp: string;
  fingerprintHash: string;
}

export class TelemetryAnomalyObserver {
  // Statistical outlier threshold: |Z-score| >= 2.5 is anomalous
  private static readonly Z_SCORE_THRESHOLD = 2.5;

  /**
   * Helper evaluation method returning structured anomaly metadata
   */
  public static evaluate(
    latest: HardwareSnapshot,
    history: HardwareSnapshot[]
  ): {
    hasAnomaly: boolean;
    anomalies: Array<{
      metricName: string;
      zScore: number;
      value: number;
      mean: number;
      stdDev: number;
    }>;
    report: TelemetryAnomalyReport | null;
  } {
    const report = this.evaluateSnapshot(history, latest);
    if (!report) {
      return { hasAnomaly: false, anomalies: [], report: null };
    }

    return {
      hasAnomaly: true,
      anomalies: [
        {
          metricName: report.metricLabel,
          zScore: report.zScore,
          value: report.observedValue,
          mean: report.expectedMean,
          stdDev: report.standardDeviation,
        },
      ],
      report,
    };
  }

  /**
   * Evaluates a newly ingested snapshot against historical snapshots to detect statistical outliers
   */
  public static evaluateSnapshot(
    history: HardwareSnapshot[],
    latest: HardwareSnapshot
  ): TelemetryAnomalyReport | null {
    if (!latest) return null;

    // Evaluate CPU Average
    const cpuAnomaly = this.checkMetricOutlier(
      history.map((s) => s.cpuAverage),
      latest.cpuAverage,
      'cpuAverage',
      'CPU Container Core Load',
      'THERMAL_OUTLIER',
      '°C / %',
      55.0, // Hard ceiling
      2.5
    );
    if (cpuAnomaly) return cpuAnomaly;

    // Evaluate Cryo Temperature
    const cryoAnomaly = this.checkMetricOutlier(
      history.map((s) => s.cryoTempMk),
      latest.cryoTempMk,
      'cryoTempMk',
      'Cryogenic Dilution Core Temp',
      'CRYO_DRIFT',
      'mK',
      25.0, // Cryo fail-closed ceiling
      2.4
    );
    if (cryoAnomaly) return cryoAnomaly;

    // Evaluate QOps Throughput
    const qopsAnomaly = this.checkMetricOutlier(
      history.map((s) => s.qopsThroughput),
      latest.qopsThroughput,
      'qopsThroughput',
      'Quantum Operations / Sec',
      'QOPS_DEVIATION',
      'QOps/s',
      undefined,
      2.5,
      true // Bilateral spike or collapse
    );
    if (qopsAnomaly) return qopsAnomaly;

    // Evaluate Voltage Stability
    const voltAnomaly = this.checkMetricOutlier(
      history.map((s) => s.voltageStabilityPct ?? s.Voltage_Stability ?? 99.98),
      latest.voltageStabilityPct ?? latest.Voltage_Stability ?? 99.98,
      'voltageStability',
      'Primary DC Rail Stability',
      'VOLTAGE_JITTER',
      '%',
      99.50, // Critical rail drop threshold
      2.5,
      false,
      true // Invert: lower is worse
    );
    if (voltAnomaly) return voltAnomaly;

    // Evaluate Superposition Coherence
    const coherenceAnomaly = this.checkMetricOutlier(
      history.map((s) => s.coherencePct ?? 99.98),
      latest.coherencePct ?? 99.98,
      'coherencePct',
      'Post-Quantum Coherence Ratio',
      'COHERENCE_DROP',
      '%',
      99.85,
      2.5,
      false,
      true
    );
    if (coherenceAnomaly) return coherenceAnomaly;

    // Evaluate Cognitive Drift & Simulated Reasoning Telemetry Divergence
    // Flag when simulated 'reasoning' telemetry diverges from the established baseline during high-intensity compute cycles (cpuAverage > 50 or qops > 860)
    const isHighComputeCycle = (latest.cpuAverage && latest.cpuAverage >= 48.0) || (latest.qopsThroughput && latest.qopsThroughput >= 860.0);
    const rawCognitiveDrift = latest.cognitiveDriftPct ?? (latest.reasoningScore ? (100 - latest.reasoningScore) * 0.01 : (isHighComputeCycle ? 0.0022 : 0.0016));
    const cognitiveAnomaly = this.checkMetricOutlier(
      history.map((s) => s.cognitiveDriftPct ?? (s.reasoningScore ? (100 - s.reasoningScore) * 0.01 : 0.0016)),
      rawCognitiveDrift,
      'cognitiveDrift',
      isHighComputeCycle ? 'Cognitive Drift (High-Intensity Compute Cycle)' : 'Cognitive Drift Baseline',
      'COGNITIVE_DRIFT',
      '%',
      isHighComputeCycle ? 0.0080 : 0.0120, // Hard ceiling for reasoning divergence
      isHighComputeCycle ? 1.8 : 2.5, // Tighter Z-score tolerance during intense compute
      false,
      false
    );
    if (cognitiveAnomaly) {
      if (isHighComputeCycle) {
        cognitiveAnomaly.description += ` Flagged during high-intensity compute cycle (CPU: ${latest.cpuAverage.toFixed(1)}% / QOps: ${latest.qopsThroughput.toFixed(1)} QOps/s). AI reasoning divergent from canonical baseline.`;
        cognitiveAnomaly.statuteRef = 'SSoT AI Governance & Constitutional Reasoning Alignment Invariant';
      }
      return cognitiveAnomaly;
    }

    return null;
  }

  private static checkMetricOutlier(
    values: number[],
    currentValue: number,
    metricKey: string,
    metricLabel: string,
    anomalyType: TelemetryAnomalyReport['anomalyType'],
    unit: string,
    hardThreshold?: number,
    thresholdZ: number = 2.5,
    bilateral: boolean = false,
    lowerIsWorse: boolean = false
  ): TelemetryAnomalyReport | null {
    // If not enough historical samples, use nominal baseline variance
    const cleanValues = values.filter((v) => typeof v === 'number' && !isNaN(v));
    const sampleSize = cleanValues.length;

    let mean: number;
    let stdDev: number;

    if (sampleSize >= 3) {
      mean = cleanValues.reduce((a, b) => a + b, 0) / sampleSize;
      const variance =
        cleanValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (sampleSize - 1);
      stdDev = Math.sqrt(variance);
    } else {
      // Baseline priors
      mean = currentValue;
      stdDev = Math.max(0.5, Math.abs(currentValue * 0.04));
    }

    // Protect against zero variance
    if (stdDev < 0.001) stdDev = 0.05;

    const zScore = (currentValue - mean) / stdDev;
    const absZ = Math.abs(zScore);

    const isHardThresholdBreached =
      hardThreshold !== undefined &&
      (lowerIsWorse ? currentValue < hardThreshold : currentValue > hardThreshold);

    const isStatisticalAnomaly =
      absZ >= thresholdZ &&
      (bilateral || (lowerIsWorse ? zScore <= -thresholdZ : zScore >= thresholdZ));

    if (isStatisticalAnomaly || isHardThresholdBreached) {
      const isCritical = isHardThresholdBreached || absZ >= 3.2;
      const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false }) + ' ICT';
      const fingerprintHash = generateSha256Hash(`ANOMALY_${metricKey}_${currentValue}_${Date.now()}`);

      let description = `Statistical outlier detected: ${metricLabel} shifted to ${currentValue.toFixed(
        2
      )} ${unit} (Rolling Mean: ${mean.toFixed(2)} ${unit}, StdDev: ±${stdDev.toFixed(
        3
      )}, Z-Score: ${zScore.toFixed(2)}σ).`;

      if (isHardThresholdBreached && hardThreshold !== undefined) {
        description += ` Exceeded hard safety threshold bound (${hardThreshold} ${unit}). Fail-closed circuit armed.`;
      }

      return {
        id: `anomaly-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        metric: metricKey,
        metricLabel,
        observedValue: Number(currentValue.toFixed(2)),
        expectedMean: Number(mean.toFixed(2)),
        standardDeviation: Number(stdDev.toFixed(3)),
        zScore: Number(zScore.toFixed(2)),
        thresholdZ,
        severity: isCritical ? 'critical' : 'warning',
        anomalyType,
        title: `${metricLabel} Statistical Outlier (${zScore > 0 ? '+' : ''}${zScore.toFixed(1)}σ)`,
        description,
        statuteRef: 'SSoT Δ0 Invariant (Core Temp < 85.0°C / Cryo < 25mK / ETDA Sec 28)',
        timestamp,
        fingerprintHash,
      };
    }

    return null;
  }

  /**
   * Helper to generate a test anomalous snapshot with a synthetic thermal, QOps, or cognitive drift spike
   */
  public static generateSimulatedOutlierSnapshot(
    anomalyKind: 'thermal' | 'cryo' | 'voltage' | 'qops' | 'cognitive' | 'entropy',
    baseSnapshotNumber: number,
    parentHash: string = SYSTEM_METADATA.merkleRoot
  ): HardwareSnapshot {
    const timestampIct = new Date().toLocaleDateString('en-CA') + ' ' + new Date().toLocaleTimeString('en-GB') + ' ICT';
    const timestampUtc = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    let cpuAverage = 41.2;
    let cpuCores = [41.5, 40.2, 42.1, 41.0];
    let cryoTempMk = 14.98;
    let qopsThroughput = 852.1;
    let voltageStabilityPct = 99.98;
    let coherencePct = 99.98;
    let cognitiveDriftPct = 0.0016;
    let reasoningScore = 99.84;
    let entropyDrift = 52.0;

    if (anomalyKind === 'thermal') {
      // Severe CPU thermal spike: 68.4°C
      cpuAverage = 68.4;
      cpuCores = [71.2, 69.8, 67.5, 65.1];
    } else if (anomalyKind === 'cryo') {
      // Cryo chamber thermal drift: 28.5 mK (exceeds 25 mK fail-closed bound)
      cryoTempMk = 28.5;
    } else if (anomalyKind === 'voltage') {
      // Voltage rail drop: 99.12%
      voltageStabilityPct = 99.12;
    } else if (anomalyKind === 'qops') {
      // Unexpected QOps collapse to 710 QOps/s
      qopsThroughput = 712.4;
      coherencePct = 99.72;
    } else if (anomalyKind === 'cognitive') {
      // High-intensity compute cycle with severe reasoning telemetry divergence
      cpuAverage = 58.6;
      cpuCores = [60.2, 58.4, 57.9, 58.1];
      qopsThroughput = 914.8;
      cognitiveDriftPct = 0.0145; // Surges above 0.0080 ceiling
      reasoningScore = 95.8; // Drops below 98.5%
    } else if (anomalyKind === 'entropy') {
      cognitiveDriftPct = 0.018;
      entropyDrift = 76.5;
    }

    const sealedHash = generateSha256Hash(`ANOMALOUS_SNAPSHOT_${baseSnapshotNumber}_${Date.now()}`);

    return {
      id: `SNAP-ANOMALY-${baseSnapshotNumber.toString().padStart(3, '0')}`,
      snapshotNumber: baseSnapshotNumber,
      timestampIct,
      timestampUtc,
      epoch: Date.now(),
      cpuAverage,
      cpuCores,
      memoryUsedMb: 5310,
      memoryTotalMb: 8192,
      cryoTempMk,
      heliumFlowPct: 100,
      networkRxMbps: 88.4,
      networkTxMbps: 118.2,
      qopsThroughput,
      coherencePct,
      otelSpansSec: 2510,
      ssdWearLevelPct: 0.84,
      voltageStabilityPct,
      SSD_Wear_Level: 0.84,
      Voltage_Stability: voltageStabilityPct,
      cognitiveDriftPct,
      reasoningScore,
      entropyDrift,
      'entropy-drift': entropyDrift,
      parentHash,
      sealedHash,
      actor: 'SOVEREIGN-TELEMETRY-OBSERVER (Anomaly Intake)',
      status: 'SEALED',
    };
  }
}

export const observeTelemetryAnomaly = (snapshot: HardwareSnapshot | unknown) => {
  const drift = getEntropyDrift(snapshot);
  if (drift > 78 || drift < 26) {
    enforceFailClosed('Entropy Drift Out of Range');
    logEvent('ANOMALY_DETECTED', { drift });
  }
};
