import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAutoTableFinalY, getLastAutoTableFinalY } from '../../src/utils/pdfHelpers';
import { systemStateStore, SystemEvent } from '../../src/store/systemStateStore';
import { CANONICAL_MERKLE_ROOT, CANONICAL_GENESIS_BLOCK } from '../../src/data/canonicalData';
import type { jsPDF } from 'jspdf';

describe('PR #43: Typed pdfHelpers getAutoTableFinalY & EVIDENCE_INGESTED Ingestion', () => {
  it('correctly reads direct finalY from object', () => {
    const obj = { finalY: 345 };
    assert.strictEqual(getAutoTableFinalY(obj), 345);
  });

  it('correctly reads finalY from doc.lastAutoTable', () => {
    const mockDoc = {
      lastAutoTable: { finalY: 760 },
    } as unknown as jsPDF;
    assert.strictEqual(getAutoTableFinalY(mockDoc), 760);
    assert.strictEqual(getLastAutoTableFinalY(mockDoc), 760);
  });

  it('falls back to default fallbackY when finalY is missing or invalid', () => {
    const mockDoc = {} as unknown as jsPDF;
    assert.strictEqual(getAutoTableFinalY(mockDoc), 20);
    assert.strictEqual(getAutoTableFinalY(mockDoc, 50), 50);

    const mockDocWithNull = { lastAutoTable: { finalY: null } } as unknown as jsPDF;
    assert.strictEqual(getAutoTableFinalY(mockDocWithNull, 80), 80);
  });

  it('successfully logs EVIDENCE_INGESTED system event into systemStateStore', () => {
    const initialCount = systemStateStore.getState().events.length;
    const testEventId = `test-ingest-${Date.now()}`;

    systemStateStore.addSystemEvent({
      id: testEventId,
      title: `Evidence Ingested: Merkle Root QR Verified (Block #${CANONICAL_GENESIS_BLOCK})`,
      description: `Optical QR scan successfully verified against Genesis Merkle Root ${CANONICAL_MERKLE_ROOT}`,
      severity: 'EVIDENCE_INGESTED',
      handler: () => {},
    });

    const updatedEvents = systemStateStore.getState().events;
    assert.strictEqual(updatedEvents.length, initialCount + 1);
    const recorded = updatedEvents.find((e) => e.id === testEventId);
    assert.ok(recorded, 'Expected EVIDENCE_INGESTED event to be found in store');
    assert.strictEqual(recorded?.severity, 'EVIDENCE_INGESTED');
    assert.ok(recorded?.title.includes('EVIDENCE_INGESTED') || recorded?.title.includes('Evidence Ingested'));
    assert.ok(recorded?.title.includes(String(CANONICAL_GENESIS_BLOCK)));
  });
});
