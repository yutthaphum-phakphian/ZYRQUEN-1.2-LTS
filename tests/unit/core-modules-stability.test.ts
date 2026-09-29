import assert from 'node:assert/strict';
import test from 'node:test';

import { frozenCore } from '../../src/core/ssot-lock';
import { AdaptiveRuntimeOrchestrator, adaptiveRuntimeOrchestrator } from '../../src/core/adaptive-runtime-orchestrator';
import { runQuantumFusion } from '../../src/core/quantum-audit-fusion';
import { sovereignSyncCommit } from '../../src/core/sovereign-sync';
import { startContinuumStream } from '../../src/core/continuum-stream';
import { logCommit, getCommitHistory } from '../../src/core/github-commit-log';
import { CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '../../src/data/canonicalData';

test('SSoT & Frozen Core Invariants (src/core/ssot-lock.ts)', () => {
  assert.equal(frozenCore.merkleRoot, CANONICAL_MERKLE_ROOT);
  assert.ok(frozenCore.genesisBlock.includes('#849202'));
  assert.equal(frozenCore.sealsCount, 14902);
  assert.equal(frozenCore.rawSealsCount, 14982);
  assert.equal(frozenCore.quarantinedSealsCount, 80);
  assert.match(frozenCore.drift, /Δ0\.00%/);
  assert.match(frozenCore.hsmQuorum, /10\/10 REAL_HSM/);
  assert.equal(frozenCore.mockEvidence, false);
});

test('Adaptive Runtime Orchestrator singleton and telemetry evaluation', () => {
  const instance1 = AdaptiveRuntimeOrchestrator.getInstance();
  const instance2 = AdaptiveRuntimeOrchestrator.getInstance();
  assert.equal(instance1, instance2);
  assert.equal(instance1, adaptiveRuntimeOrchestrator);

  const state = instance1.evaluateTelemetry([], 14.98);
  assert.match(state.version, /PHASE-13/);
  assert.equal(state.genesisBlock, CANONICAL_GENESIS_BLOCK);
  assert.equal(state.merkleRoot, CANONICAL_MERKLE_ROOT);
  assert.equal(state.slaTargetMs, 142.0);
  assert.equal(state.activeChamberMetrics.length, 6);
});

test('Adaptive Runtime Orchestrator load balancing proposal derivation and toggle', () => {
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
  assert.ok(proposals.length >= 1);
  assert.equal(proposals[0].slaTargetMs, 142.0);
  assert.ok(proposals[0].projectedLatencyMs < proposals[0].currentTotalLatencyMs);

  orchestrator.setAutoRebalance(false);
  assert.equal(orchestrator.isAutoRebalanceEnabled(), false);
  orchestrator.setAutoRebalance(true);
  assert.equal(orchestrator.isAutoRebalanceEnabled(), true);
});

test('Quantum Audit Fusion and Sovereign Sync pipeline', async () => {
  const fusion = await runQuantumFusion();
  assert.equal(fusion.status, 'QUANTUM_LOCKED');
  assert.equal(fusion.merkleRoot, frozenCore.merkleRoot);
  assert.equal(fusion.chambersVerified, 18);

  const sync = await sovereignSyncCommit();
  assert.equal(sync.status, 'COMPLETED');
  assert.equal(sync.merkleRoot, frozenCore.merkleRoot);
  assert.equal(sync.block, '#849202');
});

test('Continuum stream and GitHub commit log', () => {
  const dispose = startContinuumStream(30);
  assert.equal(typeof dispose, 'function');
  assert.doesNotThrow(() => dispose());

  const testMsg = `UNIT_TEST_COMMIT_${Date.now()}`;
  const record = logCommit(testMsg, { block: '#849202', drift: 'Δ0.00%' });
  assert.equal(record.message, testMsg);

  const history = getCommitHistory();
  assert.ok(history.length > 0);
  assert.equal(history[0].message, testMsg);
});
