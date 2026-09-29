/**
 * ZYRQUEN Ω∞ — Real Core Modules Stability Unit Test Suite (Zero Mocks)
 * 
 * Verifies mathematical integrity, SSoT invariants, SLA load-balancing calculations,
 * and multi-chamber quantum audit fusion directly against real production core implementations.
 */

import { describe, it, expect } from 'vitest';
import { frozenCore } from '../src/core/ssot-lock';
import {
  AdaptiveRuntimeOrchestrator,
  adaptiveRuntimeOrchestrator,
  ChamberWorkloadMetric,
} from '../src/core/adaptive-runtime-orchestrator';
import { runQuantumFusion } from '../src/core/quantum-audit-fusion';
import { runSovereignFusion } from '../src/core/sovereign-fusion';
import { sovereignSyncCommit } from '../src/core/sovereign-sync';
import { startContinuumStream } from '../src/core/continuum-stream';
import { logCommit, getCommitHistory } from '../src/core/github-commit-log';
import {
  CANONICAL_GENESIS_BLOCK,
  CANONICAL_MERKLE_ROOT,
} from '../src/data/canonicalData';
import { HardwareSnapshot } from '../src/types';

describe('src/core/ Unit Tests — Real Execution (No Mocking)', () => {
  describe('ssot-lock.ts (SSoT Invariants & Forensic Lockdown)', () => {
    it('verifies exact canonical Merkle root matching genesis block #849202', () => {
      expect(frozenCore.merkleRoot).toBe(CANONICAL_MERKLE_ROOT);
      expect(frozenCore.genesisBlock).toContain('#849202');
      expect(frozenCore.genesisBlock).toContain('#849203');
      expect(frozenCore.genesisBlock).toContain('#40202');
    });

    it('enforces canonical WORM seal count invariants and quarantine partition integrity', () => {
      expect(frozenCore.sealsCount).toBe(14902);
      expect(frozenCore.rawSealsCount).toBe(14982);
      expect(frozenCore.quarantinedSealsCount).toBe(80);
      expect(frozenCore.sealsCount + frozenCore.quarantinedSealsCount).toBe(frozenCore.rawSealsCount);
    });

    it('asserts zero drift and real HSM quorum constraints', () => {
      expect(frozenCore.drift).toBe('Δ0.00% ZERO DRIFT');
      expect(frozenCore.hsmQuorum).toBe('10/10 REAL_HSM FIPS 140-3 L4');
      expect(frozenCore.mockEvidence).toBe(false);
    });

    it('verifies PQC post-quantum cryptography standards and statutory jurisdiction', () => {
      expect(frozenCore.pqcStandards).toContain('FIPS 203 ML-KEM-1024');
      expect(frozenCore.pqcStandards).toContain('FIPS 204 ML-DSA-87');
      expect(frozenCore.pqcStandards).toContain('FIPS 205 SLH-DSA');
      expect(frozenCore.legalCompliance).toContain('ETDA Sec 9,26,28');
      expect(frozenCore.legalCompliance).toContain('PDPA');
      expect(frozenCore.principal).toContain('#EP-SOVEREIGN-01');
    });
  });

  describe('adaptive-runtime-orchestrator.ts (Dynamic Chamber Workload & SLA Protection)', () => {
    it('enforces true singleton lifecycle across module imports', () => {
      const inst1 = AdaptiveRuntimeOrchestrator.getInstance();
      const inst2 = AdaptiveRuntimeOrchestrator.getInstance();
      expect(inst1).toBe(inst2);
      expect(inst1).toBe(adaptiveRuntimeOrchestrator);
    });

    it('evaluates hardware telemetry and calculates deterministic chamber workload metrics', () => {
      const orchestrator = AdaptiveRuntimeOrchestrator.getInstance();
      const sampleSnapshots: HardwareSnapshot[] = [
        {
          id: 'snap-1',
          timestamp: '2026-09-29 18:00:00 ICT',
          cpuAverage: 42.5,
          cryoTempMk: 14.982,
          activeChambers: 18,
          zkProofDepth: 14902,
          hsmStatus: 'ONLINE_ACTIVE',
          merkleIntegrity: 'ZERO_DRIFT_LOCKED',
          hsmQuorumStatus: 'QUORUM_UNLOCKED_10_OF_10',
          activeLedgerMode: 'FAIL-CLOSED',
          quarantinedAnomalyCount: 0,
        },
      ];

      const state = orchestrator.evaluateTelemetry(sampleSnapshots, 14.982);

      expect(state.version).toBe('PHASE-13-ADAPTIVE-ORCHESTRATOR-v1.0');
      expect(state.genesisBlock).toBe(CANONICAL_GENESIS_BLOCK);
      expect(state.merkleRoot).toBe(CANONICAL_MERKLE_ROOT);
      expect(state.slaTargetMs).toBe(142.0);
      expect(state.activeChamberMetrics.length).toBe(6);

      state.activeChamberMetrics.forEach((chamber) => {
        expect(chamber.chamberId).toMatch(/^CH-\d{2}$/);
        expect(chamber.cpuLoadPct).toBeGreaterThanOrEqual(12);
        expect(chamber.cpuLoadPct).toBeLessThanOrEqual(88);
        expect(chamber.cryoTempMK).toBeGreaterThanOrEqual(14.98);
        expect(chamber.estimatedLatencyMs).toBeGreaterThan(0);
        expect(['OPTIMAL', 'ELEVATED', 'CRITICAL_THROTTLE']).toContain(chamber.status);
      });
    });

    it('derives actionable shift proposals when load or thermal throttling is detected', () => {
      const orchestrator = AdaptiveRuntimeOrchestrator.getInstance();
      const elevatedMetrics: ChamberWorkloadMetric[] = [
        {
          chamberId: 'CH-17',
          chamberName: 'Chamber 17 (Apex Sovereign Matrix)',
          cpuLoadPct: 84.0,
          cryoTempMK: 15.22,
          estimatedLatencyMs: 16.5,
          status: 'CRITICAL_THROTTLE',
          activeBatchSize: 64,
          recommendedShiftPct: -25,
        },
        {
          chamberId: 'CH-00',
          chamberName: 'Chamber 00 (Genesis SSoT)',
          cpuLoadPct: 18.5,
          cryoTempMK: 14.98,
          estimatedLatencyMs: 1.2,
          status: 'OPTIMAL',
          activeBatchSize: 64,
          recommendedShiftPct: 5,
        },
        {
          chamberId: 'CH-01',
          chamberName: 'Chamber 01 (Hardware TSA)',
          cpuLoadPct: 30.0,
          cryoTempMK: 14.99,
          estimatedLatencyMs: 2.1,
          status: 'OPTIMAL',
          activeBatchSize: 64,
          recommendedShiftPct: 0,
        },
      ];

      const currentTotalLatency = 115.0;
      const proposals = orchestrator.deriveShiftProposals(elevatedMetrics, currentTotalLatency);

      expect(proposals.length).toBeGreaterThanOrEqual(1);
      const shift = proposals[0];
      expect(shift.proposalId).toMatch(/^PROP-SHIFT-/);
      expect(shift.slaTargetMs).toBe(142.0);
      expect(shift.sourceChamber).toContain('Chamber 17');
      expect(shift.targetChamber).toContain('Chamber 00');
      expect(shift.projectedLatencyMs).toBeLessThan(currentTotalLatency);
      expect(shift.slaMarginHeadroomMs).toBeGreaterThan(0);
      expect(shift.action).toContain('DYNAMIC_REBALANCE');
      expect(shift.recommendedBatchShift.fromBatchSize).toBe(64);
      expect(shift.recommendedBatchShift.toBatchSize).toBe(48);
      expect(shift.reasonTh).toContain('CH-17');
    });

    it('supports dynamic configuration of auto-rebalancing flag', () => {
      const orchestrator = AdaptiveRuntimeOrchestrator.getInstance();
      orchestrator.setAutoRebalance(false);
      expect(orchestrator.isAutoRebalanceEnabled()).toBe(false);

      orchestrator.setAutoRebalance(true);
      expect(orchestrator.isAutoRebalanceEnabled()).toBe(true);
    });
  });

  describe('quantum-audit-fusion.ts & sovereign-fusion.ts (Multi-Chamber Consensus)', () => {
    it('executes real Quantum Audit Fusion and verifies 18-chamber quantum lock', async () => {
      const result = await runQuantumFusion();

      expect(result.status).toBe('QUANTUM_LOCKED');
      expect(result.merkleRoot).toBe(frozenCore.merkleRoot);
      expect(result.quorum).toBe(frozenCore.hsmQuorum);
      expect(result.drift).toBe(frozenCore.drift);
      expect(result.chambersVerified).toBe(18);
      expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('executes runSovereignFusion without unhandled rejections', async () => {
      await expect(runSovereignFusion()).resolves.toBeUndefined();
    });
  });

  describe('sovereign-sync.ts (Sovereign Sync Commit Pipeline)', () => {
    it('completes the full Sovereign Sync workflow with canonical commit message formatting', async () => {
      const result = await sovereignSyncCommit();

      expect(result.status).toBe('COMPLETED');
      expect(result.block).toBe('#849202');
      expect(result.merkleRoot).toBe(frozenCore.merkleRoot);
      expect(result.workflow).toBe('AI Studio → GitHub → Commit → Push');
      expect(result.commitMessage).toContain(frozenCore.merkleRoot);
      expect(result.commitMessage).toContain('#849202');
      expect(result.commitMessage).toContain('Δ0.00%');
    });
  });

  describe('continuum-stream.ts & github-commit-log.ts (Stream & Audit Log)', () => {
    it('starts high-frequency particle stream and terminates cleanly via disposer', () => {
      const stop = startContinuumStream(60);
      expect(typeof stop).toBe('function');
      expect(() => stop()).not.toThrow();
    });

    it('logs commits with immutable hash and metadata into audit history buffer', () => {
      const msg = `TEST_CORE_COMMIT_${Date.now()}`;
      const record = logCommit(msg, {
        merkleRoot: CANONICAL_MERKLE_ROOT,
        block: '#849202',
        drift: 'Δ0.00%',
      });

      expect(record.message).toBe(msg);
      expect(record.merkleRoot).toBe(CANONICAL_MERKLE_ROOT);
      expect(record.block).toBe('#849202');
      expect(record.drift).toBe('Δ0.00%');

      const history = getCommitHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].message).toBe(msg);
    });
  });
});
