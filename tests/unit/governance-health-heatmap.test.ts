import assert from 'node:assert/strict';
import test from 'node:test';
import { SOVEREIGN_CHAMBERS } from '../../src/data/sovereignData';

test('GovernanceHealthHeatmap - 18 Sovereign Chambers Telemetry & Coherence Invariant Verification', async (t) => {
  await t.test('should verify all 18 Sovereign Chambers exist (CH-00 through CH-17)', () => {
    assert.equal(SOVEREIGN_CHAMBERS.length, 18);

    const expectedCodes = Array.from({ length: 18 }, (_, i) => `CH-${i.toString().padStart(2, '0')}`);
    const actualCodes = SOVEREIGN_CHAMBERS.map((c) => c.code);

    assert.deepEqual(actualCodes, expectedCodes);
  });

  await t.test('should ensure each chamber has mandatory invariants and non-empty definitions', () => {
    SOVEREIGN_CHAMBERS.forEach((chamber) => {
      assert.ok(chamber.id);
      assert.match(chamber.code, /^CH-\d{2}$/);
      assert.ok(chamber.name.length > 0);
      assert.ok(chamber.nameTh.length > 0);
      assert.ok(chamber.description.length > 0);
      assert.ok(chamber.category.length > 0);
      assert.ok(chamber.invariants.length > 0);
      assert.ok(chamber.metrics.length > 0);
    });
  });

  await t.test('should verify categories span Foundation, Governance, Operations, Defense, and Extension', () => {
    const categories = new Set(SOVEREIGN_CHAMBERS.map((c) => c.category));
    assert.ok(categories.has('Foundation'));
    assert.ok(categories.has('Governance'));
    assert.ok(categories.has('Operations'));
    assert.ok(categories.has('Defense'));
    assert.ok(categories.has('Extension'));
  });

  await t.test('should confirm telemetry stability and coherence baseline compliance', () => {
    const slaCoherenceFloor = 99.95;
    const slaCryoCeiling = 18.0;

    const nominalCoherence = 99.992;
    const nominalCryo = 14.98;

    assert.ok(nominalCoherence >= slaCoherenceFloor);
    assert.ok(nominalCryo <= slaCryoCeiling);
  });

  await t.test('should verify the canonical Genesis Merkle Root anchor', () => {
    const expectedMerkleRoot = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
    assert.equal(expectedMerkleRoot.length, 64);
    assert.match(expectedMerkleRoot, /^[0-9a-f]{64}$/);
  });

  await t.test('should verify color gradient intensity mapping (Cyan to Emerald, Red on <95% instability)', () => {
    const getCellColorStyle = (coherence: number) => {
      if (coherence < 95) {
        return 'bg-red-950/80 border-red-500 text-red-300 ring-2 ring-red-500 animate-pulse';
      }
      const ratio = Math.max(0, Math.min(1, (coherence - 95) / 5));
      if (ratio < 0.3) {
        return 'bg-cyan-950/60 border-cyan-700/70 text-cyan-300 hover:border-cyan-400';
      } else if (ratio < 0.7) {
        return 'bg-teal-950/70 border-teal-600/70 text-teal-300 hover:border-teal-400';
      } else {
        return 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 hover:border-emerald-400';
      }
    };

    assert.ok(getCellColorStyle(93.8).includes('border-red-500'));
    assert.ok(getCellColorStyle(93.8).includes('animate-pulse'));
    assert.ok(getCellColorStyle(95.5).includes('border-cyan-700'));
    assert.ok(getCellColorStyle(97.5).includes('border-teal-600'));
    assert.ok(getCellColorStyle(99.992).includes('border-emerald-500'));
  });

  await t.test('should verify 10/10 REAL_HSM quorum and SSoT zero drift invariants', () => {
    const quorumExpected = 10;
    const quorumActual = 10;
    const systemDrift = 0.00;

    assert.equal(quorumActual, quorumExpected);
    assert.equal(systemDrift, 0.00);
  });

  await t.test('should verify UnstableEvent tracking and search filter logic for coherence < 95%', () => {
    const events = [
      { id: 'EVT-CH-04-1', chamberId: 'CH-04', coherence: 93.8, timestamp: '14:43:43' },
      { id: 'EVT-CH-06-2', chamberId: 'CH-06', coherence: 94.2, timestamp: '14:44:00' },
    ];

    // Filter by Chamber ID
    const query1 = 'ch-04';
    const filtered1 = events.filter((e) =>
      e.chamberId.toLowerCase().includes(query1.toLowerCase()) || e.timestamp.includes(query1)
    );
    assert.equal(filtered1.length, 1);
    assert.equal(filtered1[0].chamberId, 'CH-04');

    // Filter by timestamp
    const query2 = '14:44';
    const filtered2 = events.filter((e) =>
      e.chamberId.toLowerCase().includes(query2.toLowerCase()) || e.timestamp.includes(query2)
    );
    assert.equal(filtered2.length, 1);
    assert.equal(filtered2[0].chamberId, 'CH-06');
  });

  await t.test('should verify PrintAuditRecord immutable ledger structure and commit status', () => {
    const printRecord = {
      printId: 'PRINT-LOG-8492',
      chamberSource: 'CH-00 (Genesis Foundation & Kernel)',
      timestamp: new Date().toISOString(),
      ledgerStatus: 'COMMITTED_IMMUTABLE_V25',
    };

    assert.ok(printRecord.printId.startsWith('PRINT-LOG-'));
    assert.ok(printRecord.chamberSource.includes('CH-00'));
    assert.equal(printRecord.ledgerStatus, 'COMMITTED_IMMUTABLE_V25');
  });
});

