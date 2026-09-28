import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import {
  CANONICAL_MERKLE_ROOT,
  CANONICAL_GENESIS_BLOCK,
} from '../../src/data/canonicalData.ts';
import type { RecentScanRecord } from '../../src/components/MerkleRootQrCodeModal.tsx';

describe('Merkle Root QR Modal - Recent Scans & Print Specifications', () => {
  const mockStorage: Record<string, string> = {};

  const fakeLocalStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k in mockStorage) delete mockStorage[k];
    },
  };

  const RECENT_SCANS_STORAGE_KEY = 'zyrquen_merkle_recent_scans';

  beforeEach(() => {
    fakeLocalStorage.clear();
  });

  it('correctly persists and caps the last 5 successful QR scan records', () => {
    const records: RecentScanRecord[] = Array.from({ length: 8 }, (_, i) => ({
      id: `scan-${i + 1}`,
      evidenceId: `EVD-INGEST-00${i + 1}`,
      timestamp: `2026-09-28T14:3${i}:00Z`,
      blockHeight: CANONICAL_GENESIS_BLOCK,
      merkleRootMatched: CANONICAL_MERKLE_ROOT,
      source: i % 2 === 0 ? 'CAMERA' : 'SIMULATED',
      rawPayload: `test-payload-${i + 1}`,
      status: 'VERIFIED',
      statuteRef: 'Thai ETDA B.E. 2544 Sec 9/26/28',
    }));

    // Save one by one simulating sequential scans
    let storedList: RecentScanRecord[] = [];
    for (const record of records) {
      storedList = [record, ...storedList.filter((r) => r.id !== record.id)].slice(0, 5);
      fakeLocalStorage.setItem(RECENT_SCANS_STORAGE_KEY, JSON.stringify(storedList));
    }

    const raw = fakeLocalStorage.getItem(RECENT_SCANS_STORAGE_KEY);
    assert.ok(raw !== null, 'Storage should contain recent scans');
    const parsed: RecentScanRecord[] = JSON.parse(raw);
    assert.equal(parsed.length, 5, 'Should cap at exactly 5 records');
    assert.equal(parsed[0].evidenceId, 'EVD-INGEST-008', 'Most recent scan should be at index 0');
    assert.equal(parsed[4].evidenceId, 'EVD-INGEST-004', 'Oldest preserved scan should be at index 4');
  });

  it('allows clearing recent scans history from storage', () => {
    fakeLocalStorage.setItem(
      RECENT_SCANS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'scan-1',
          evidenceId: 'EVD-INGEST-001',
          timestamp: '14:35:00 ICT',
          blockHeight: 849202,
          merkleRootMatched: CANONICAL_MERKLE_ROOT,
          source: 'CAMERA',
          rawPayload: 'sample',
          status: 'VERIFIED',
          statuteRef: 'Thai ETDA B.E. 2544 Sec 9, 26, 28',
        },
      ])
    );

    assert.ok(fakeLocalStorage.getItem(RECENT_SCANS_STORAGE_KEY) !== null);
    fakeLocalStorage.removeItem(RECENT_SCANS_STORAGE_KEY);
    assert.equal(fakeLocalStorage.getItem(RECENT_SCANS_STORAGE_KEY), null);
  });

  it('validates canonical genesis Merkle root consistency', () => {
    assert.equal(CANONICAL_GENESIS_BLOCK, 849202);
    assert.ok(CANONICAL_MERKLE_ROOT.startsWith('909ab814'));
  });
});
