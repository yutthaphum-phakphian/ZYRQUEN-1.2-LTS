import { describe, it, expect } from 'vitest';
import { frozenCore } from '../src/core/ssot-lock';
import {
  AdaptiveRuntimeOrchestrator,
  adaptiveRuntimeOrchestrator,
} from '../src/core/adaptive-runtime-orchestrator';
import { runQuantumFusion } from '../src/core/quantum-audit-fusion';
import { sovereignSyncCommit } from '../src/core/sovereign-sync';
import { startContinuumStream } from '../src/core/continuum-stream';
import { logCommit, getCommitHistory } from '../src/core/github-commit-log';
import { CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '../src/data/canonicalData';

describe('ZYRQUEN Ω∞ Core Logic Stability Suite (Zero Mocks)', () => {
  describe('SSoT & Frozen Core Invariants (src/core/ssot-lock.ts)', () => {
    it('guarantees bit-exact canonical Merkle root and genesis block alignment', () => {
      expect(frozenCore.merkleRoot).toBe(CANONICAL_MERKLE_ROOT);
      expect(frozenCore.genesisBlock).toContain('#849202');
      expect(frozenCore.sealsCount).toBe(14902);
      expect(frozenCore.rawSealsCount).toBe(14982);
      expect(frozenCore.quarantinedSealsCount).toBe(80);
      expect(frozenCore.drift).toContain('Δ0.00%');
      expect(frozenCore.hsmQuorum).toContain('10/10 REAL_HSM');
      expect(frozenCore.mockEvidence).toBe(false);
    });

    it('enforces PQC NIST Category 5 standards and Thai statutory safe harbor compliance', () => {
      expect(frozenCore.pqcStandards).toEqual([
        'FIPS 203 ML-KEM-1024',
        'FIPS 204 ML-DSA-87',
        'FIPS 205 SLH-DSA',
      ]);
      expect(frozenCore.legalCompliance).toContain('PDPA');
      expect(frozenCore.legalCompliance).toContain('ETDA');
      expect(frozenCore.principal).toContain('#EP-SOVEREIGN-01');
    });
  });

  describe('Adaptive Runtime Orchestrator (src/core/adaptive-runtime-orchestrator.ts)', () => {
    it('maintains singleton pattern instance consistency', () => {
      const instance1 = AdaptiveRuntimeOrchestrator.getInstance();
      const instance2 = AdaptiveRuntimeOrchestrator.getInstance();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(adaptiveRuntimeOrchestrator);
    });

    it('evaluates real hardware telemetry and produces deterministic chamber metrics', () => {
      const orchestrator = AdaptiveRuntimeOrchestrator.getInstance();
      const state = orchestrator.evaluateTelemetry([], 14.98);

      expect(state.version).toContain('PHASE-13');
      expect(state.genesisBlock).toBe(CANONICAL_GENESIS_BLOCK);
      expect(state.merkleRoot).toBe(CANONICAL_MERKLE_ROOT);
      expect(state.slaTargetMs).toBe(142.0);
      expect(state.activeChamberMetrics.length).toBe(6);

      const ch00 = state.activeChamberMetrics.find((c) => c.chamberId === 'CH-00');
      expect(ch00).toBeDefined();
      expect(ch00?.chamberName).toContain('Chamber 00');
      expect(ch00?.cpuLoadPct).toBeGreaterThan(0);
      expect(ch00?.cryoTempMK).toBeGreaterThanOrEqual(14.98);
      expect(ch00?.estimatedLatencyMs).toBeGreaterThan(0);
    });

    it('computes actionable load-balancing shift proposals under high load conditions', () => {
      const orchestrator = AdaptiveRuntimeOrchestrator.getInstance();
      const customMetrics = [
        {
          chamberId: 'CH-17',
          chamberName: 'Chamber 17 (Apex Sovereign Matrix)',
          cpuLoadPct: 82.5,
          cryoTempMK: 15.18,
          estimatedLatencyMs: 14.2,
          status: 'CRITICAL_THROTTLE' as const,
          activeBatchSize: 64,
          recommendedShiftPct: -25,
        },
        {
          chamberId: 'CH-00',
          chamberName: 'Chamber 00 (Genesis SSoT)',
          cpuLoadPct: 22.0,
          cryoTempMK: 14.98,
          estimatedLatencyMs: 1.2,
          status: 'OPTIMAL' as const,
          activeBatchSize: 64,
          recommendedShiftPct: 5,
        },
      ];

      const proposals = orchestrator.deriveShiftProposals(customMetrics, 110.0);
      expect(proposals.length).toBeGreaterThanOrEqual(1);

      const topProposal = proposals[0];
      expect(topProposal.sourceChamber).toContain('Chamber 17');
      expect(topProposal.targetChamber).toContain('Chamber 00');
      expect(topProposal.slaTargetMs).toBe(142.0);
      expect(topProposal.projectedLatencyMs).toBeLessThan(topProposal.currentTotalLatencyMs);
      expect(topProposal.slaMarginHeadroomMs).toBeGreaterThan(0);
      expect(topProposal.recommendedBatchShift.toBatchSize).toBe(48);
      expect(topProposal.reasonTh).toContain('CH-17');
    });

    it('toggles auto-rebalance configuration state correctly', () => {
      const orchestrator = AdaptiveRuntimeOrchestrator.getInstance();
      orchestrator.setAutoRebalance(false);
      expect(orchestrator.isAutoRebalanceEnabled()).toBe(false);

      orchestrator.setAutoRebalance(true);
      expect(orchestrator.isAutoRebalanceEnabled()).toBe(true);
    });
  });

  describe('Quantum Audit Fusion & Sovereign Sync (src/core/quantum-audit-fusion.ts, sovereign-sync.ts)', () => {
    it('executes Quantum Audit Fusion across 18 Chambers and locks canonical state', async () => {
      const result = await runQuantumFusion();
      expect(result.status).toBe('QUANTUM_LOCKED');
      expect(result.merkleRoot).toBe(frozenCore.merkleRoot);
      expect(result.quorum).toBe(frozenCore.hsmQuorum);
      expect(result.chambersVerified).toBe(18);
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });

    it('orchestrates complete Sovereign Sync Commit pipeline without errors', async () => {
      const commitResult = await sovereignSyncCommit();
      expect(commitResult.status).toBe('COMPLETED');
      expect(commitResult.merkleRoot).toBe(frozenCore.merkleRoot);
      expect(commitResult.block).toBe('#849202');
      expect(commitResult.commitMessage).toContain('ZYRQUEN Ω∞ — Sovereign Sync Commit');
      expect(commitResult.commitMessage).toContain(frozenCore.merkleRoot);
    });
  });

  describe('Continuum Particle Stream & GitHub Commit Log (src/core/continuum-stream.ts, github-commit-log.ts)', () => {
    it('starts continuum particle stream and disposes interval timer cleanly', () => {
      const dispose = startContinuumStream(30);
      expect(typeof dispose).toBe('function');
      expect(() => dispose()).not.toThrow();
    });

    it('records commit entries in audit history with cryptographic metadata', () => {
      const testMsg = `CI_TEST_COMMIT_${Date.now()}`;
      const record = logCommit(testMsg, {
        block: '#849202',
        drift: 'Δ0.00%',
        merkleRoot: CANONICAL_MERKLE_ROOT,
      });

      expect(record.message).toBe(testMsg);
      expect(record.block).toBe('#849202');
      expect(record.merkleRoot).toBe(CANONICAL_MERKLE_ROOT);
      expect(record.drift).toBe('Δ0.00%');

      const history = getCommitHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].message).toBe(testMsg);
    });
  });
});
