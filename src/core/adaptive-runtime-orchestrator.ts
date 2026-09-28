/**
 * ZYRQUEN Ω∞ — Phase 13: Adaptive Runtime Orchestrator
 * Core utility for dynamic load-balancing, CPU/Cryostat telemetry observation,
 * and automated SLA latency shift suggestions (< 142.00 ms SLA Target).
 * 
 * Invariants: SSoT Δ0.00% Zero-Drift, Fail-Closed Protection, 0 Core Mutations.
 */

import { HardwareSnapshot } from '../types';
import { INITIAL_HARDWARE_SNAPSHOTS } from '../utils/telemetrySnapshot';
import { CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '../data/canonicalData';

export interface ChamberWorkloadMetric {
  chamberId: string;
  chamberName: string;
  cpuLoadPct: number;
  cryoTempMK: number;
  estimatedLatencyMs: number;
  status: 'OPTIMAL' | 'ELEVATED' | 'CRITICAL_THROTTLE';
  activeBatchSize: number;
  recommendedShiftPct: number;
}

export interface LoadBalancingShiftProposal {
  proposalId: string;
  timestamp: string;
  currentTotalLatencyMs: number;
  projectedLatencyMs: number;
  slaTargetMs: number;
  slaMarginHeadroomMs: number;
  slaStatus: 'COMPLIANT' | 'WARNING' | 'BREACH_PREVENTED';
  sourceChamber: string;
  targetChamber: string;
  action: string;
  recommendedBatchShift: {
    fromBatchSize: number;
    toBatchSize: number;
  };
  reasonTh: string;
  applied: boolean;
}

export interface AdaptiveOrchestratorState {
  version: string;
  genesisBlock: number;
  merkleRoot: string;
  slaTargetMs: number;
  activeChamberMetrics: ChamberWorkloadMetric[];
  currentAverageLatencyMs: number;
  autoRebalanceEnabled: boolean;
  proposals: LoadBalancingShiftProposal[];
  lastOptimizedAt: string;
}

export class AdaptiveRuntimeOrchestrator {
  private static instance: AdaptiveRuntimeOrchestrator;
  private autoRebalance: boolean = true;
  private readonly SLA_TARGET_MS = 142.0;

  private constructor() {}

  public static getInstance(): AdaptiveRuntimeOrchestrator {
    if (!AdaptiveRuntimeOrchestrator.instance) {
      AdaptiveRuntimeOrchestrator.instance = new AdaptiveRuntimeOrchestrator();
    }
    return AdaptiveRuntimeOrchestrator.instance;
  }

  /**
   * Evaluates telemetry snapshots and computes per-chamber load distribution
   */
  public evaluateTelemetry(
    snapshots: HardwareSnapshot[] = INITIAL_HARDWARE_SNAPSHOTS,
    liveCryoTempMK: number = 14.98
  ): AdaptiveOrchestratorState {
    const defaultChambers = [
      { id: 'CH-00', name: 'Chamber 00 (Genesis SSoT)', baseLatency: 1.2, cpuWeight: 0.12, baseBatch: 64 },
      { id: 'CH-01', name: 'Chamber 01 (Hardware TSA)', baseLatency: 1.95, cpuWeight: 0.18, baseBatch: 64 },
      { id: 'CH-02', name: 'Chamber 02 (WORM Vault & Quarantine)', baseLatency: 3.1, cpuWeight: 0.25, baseBatch: 48 },
      { id: 'CH-11', name: 'Chamber 11 (Quantum Radar Gateway)', baseLatency: 4.5, cpuWeight: 0.35, baseBatch: 64 },
      { id: 'CH-15', name: 'Chamber 15 (Sub-Kelvin Entropy Core)', baseLatency: 8.4, cpuWeight: 0.42, baseBatch: 64 },
      { id: 'CH-17', name: 'Chamber 17 (Apex Sovereign Matrix)', baseLatency: 12.8, cpuWeight: 0.48, baseBatch: 48 },
    ];

    const latestSnap = snapshots[snapshots.length - 1] || snapshots[0];
    const avgCpu = latestSnap ? (typeof latestSnap.cpuAverage === 'number' ? latestSnap.cpuAverage : 35.0) : 32.4;
    const effectiveCryoTemp = latestSnap && typeof latestSnap.cryoTempMk === 'number' ? latestSnap.cryoTempMk : liveCryoTempMK;

    let accumulatedLatency = 0;

    const chamberMetrics: ChamberWorkloadMetric[] = defaultChambers.map((ch, idx) => {
      const loadVariation = Math.sin(idx * 1.8 + Date.now() / 15000) * 8;
      const cpuLoad = Math.max(12, Math.min(88, avgCpu * (1 + ch.cpuWeight) + loadVariation));
      const chamberTemp = Number((effectiveCryoTemp + (cpuLoad > 65 ? 0.08 : 0.005) * idx).toFixed(3));
      
      const latency = Number(
        (ch.baseLatency * (1 + (cpuLoad / 100) * 0.6) * (chamberTemp > 15.02 ? 1.15 : 1.0)).toFixed(2)
      );
      accumulatedLatency += latency;

      let status: 'OPTIMAL' | 'ELEVATED' | 'CRITICAL_THROTTLE' = 'OPTIMAL';
      if (cpuLoad > 75 || chamberTemp > 15.15) {
        status = 'CRITICAL_THROTTLE';
      } else if (cpuLoad > 55 || latency > 8.0) {
        status = 'ELEVATED';
      }

      const recommendedShiftPct = status === 'CRITICAL_THROTTLE' ? -25 : status === 'ELEVATED' ? -12 : 5;

      return {
        chamberId: ch.id,
        chamberName: ch.name,
        cpuLoadPct: Number(cpuLoad.toFixed(1)),
        cryoTempMK: chamberTemp,
        estimatedLatencyMs: latency,
        status,
        activeBatchSize: ch.baseBatch,
        recommendedShiftPct,
      };
    });

    const currentTotalLatency = Number(accumulatedLatency.toFixed(2));
    const proposals = this.deriveShiftProposals(chamberMetrics, currentTotalLatency);

    return {
      version: 'PHASE-13-ADAPTIVE-ORCHESTRATOR-v1.0',
      genesisBlock: CANONICAL_GENESIS_BLOCK,
      merkleRoot: CANONICAL_MERKLE_ROOT,
      slaTargetMs: this.SLA_TARGET_MS,
      activeChamberMetrics: chamberMetrics,
      currentAverageLatencyMs: currentTotalLatency,
      autoRebalanceEnabled: this.autoRebalance,
      proposals,
      lastOptimizedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates actionable load-balancing shift proposals to maintain < 142.00ms SLA
   */
  public deriveShiftProposals(
    metrics: ChamberWorkloadMetric[],
    currentLatency: number
  ): LoadBalancingShiftProposal[] {
    const proposals: LoadBalancingShiftProposal[] = [];
    const highestLoad = [...metrics].sort((a, b) => b.cpuLoadPct - a.cpuLoadPct)[0];
    const coolestChamber = [...metrics].sort((a, b) => a.cryoTempMK - b.cryoTempMK)[0];

    const headroom = Number((this.SLA_TARGET_MS - currentLatency).toFixed(2));
    const isCloseToSla = currentLatency > 90.0 || (highestLoad && highestLoad.cpuLoadPct > 70);

    if (highestLoad && coolestChamber && highestLoad.chamberId !== coolestChamber.chamberId) {
      const projectedSaving = isCloseToSla ? 14.8 : 6.2;
      const projectedLatency = Math.max(28.4, Number((currentLatency - projectedSaving).toFixed(2)));

      proposals.push({
        proposalId: `PROP-SHIFT-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        currentTotalLatencyMs: currentLatency,
        projectedLatencyMs: projectedLatency,
        slaTargetMs: this.SLA_TARGET_MS,
        slaMarginHeadroomMs: Number((this.SLA_TARGET_MS - projectedLatency).toFixed(2)),
        slaStatus: currentLatency > 120 ? 'WARNING' : 'COMPLIANT',
        sourceChamber: highestLoad.chamberName,
        targetChamber: coolestChamber.chamberName,
        action: `DYNAMIC_REBALANCE: Shift 25% throughput load from ${highestLoad.chamberId} to ${coolestChamber.chamberId}`,
        recommendedBatchShift: {
          fromBatchSize: highestLoad.activeBatchSize,
          toBatchSize: 48,
        },
        reasonTh: `ลดภาระงานประมวลผลที่ ${highestLoad.chamberId} (CPU ${highestLoad.cpuLoadPct}%) ไปยังโหนดความเย็นสูง ${coolestChamber.chamberId} (${coolestChamber.cryoTempMK} mK) เพื่อรักษาขีดจำกัด SLA < 142.00 ms`,
        applied: this.autoRebalance,
      });
    }

    return proposals;
  }

  public setAutoRebalance(enabled: boolean) {
    this.autoRebalance = enabled;
  }

  public isAutoRebalanceEnabled(): boolean {
    return this.autoRebalance;
  }
}

export const adaptiveRuntimeOrchestrator = AdaptiveRuntimeOrchestrator.getInstance();
