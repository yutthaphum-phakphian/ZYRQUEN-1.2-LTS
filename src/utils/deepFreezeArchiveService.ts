import { DeepFreezeArchiveState, DeepFreezePartition } from '../types';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { generateSha256Hash } from './telemetrySnapshot';

const STORAGE_KEY = 'zyrquen_deep_freeze_archive_state_v1';

// Initial Canonical Partitions for the 14,902 Canonical Sealed Blocks
const INITIAL_PARTITIONS: DeepFreezePartition[] = [
  {
    partitionId: 'DF-PART-001',
    blockRangeStart: 1,
    blockRangeEnd: 5000,
    recordsCount: 5000,
    uncompressedBytes: 15420000,
    compressedBytes: 3392400,
    compressionRatio: 78.0,
    merkleBranchRoot: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68_P1',
    frozenAt: '2026-08-15 00:00:00 ICT',
    pqcSignature: 'FIPS-204-ML-DSA-87-DILITHIUM-FROZEN-SEAL-P1',
    coldStorageVault: 'VAULT-CRYO-COLD-01 (Sector 08-XF4)',
    isReadOnly: true,
  },
  {
    partitionId: 'DF-PART-002',
    blockRangeStart: 5001,
    blockRangeEnd: 10000,
    recordsCount: 5000,
    uncompressedBytes: 15420000,
    compressedBytes: 3346140,
    compressionRatio: 78.3,
    merkleBranchRoot: '0x3c99a80b18209849209840283409823094820938409283409283409283409283_P2',
    frozenAt: '2026-08-28 12:00:00 ICT',
    pqcSignature: 'FIPS-204-ML-DSA-87-DILITHIUM-FROZEN-SEAL-P2',
    coldStorageVault: 'VAULT-CRYO-COLD-02 (Sector 08-XF4)',
    isReadOnly: true,
  },
  {
    partitionId: 'DF-PART-003',
    blockRangeStart: 10001,
    blockRangeEnd: 14000,
    recordsCount: 4000,
    uncompressedBytes: 12336000,
    compressedBytes: 2652240,
    compressionRatio: 78.5,
    merkleBranchRoot: '0x7e88910283490128340918230491820394810293840192834019283401928340_P3',
    frozenAt: '2026-09-01 08:30:00 ICT',
    pqcSignature: 'FIPS-204-ML-DSA-87-DILITHIUM-FROZEN-SEAL-P3',
    coldStorageVault: 'VAULT-CRYO-COLD-03 (Sector 08-XF4)',
    isReadOnly: true,
  },
];

let globalArchiveState: DeepFreezeArchiveState = {
  totalLedgerEntries: 14902,
  activeHotEntries: 902,
  deepFrozenEntries: 14000,
  thresholdLimit: 1000,
  isDeepFreezeActive: true,
  lastFrozenAt: '2026-09-01 08:30:00 ICT',
  partitions: INITIAL_PARTITIONS,
  totalBytesSavedMb: 33.78,
};

type DeepFreezeListener = (state: DeepFreezeArchiveState) => void;
const listeners: Set<DeepFreezeListener> = new Set();

export function subscribeDeepFreeze(listener: DeepFreezeListener): () => void {
  listeners.add(listener);
  listener(globalArchiveState);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => fn({ ...globalArchiveState }));
}

/**
 * Background evaluation service: checks if total active uncompressed ledger entries exceed 1,000 threshold.
 * If exceeded, automatically packages older records into a compressed read-only simulated cold-storage partition.
 */
export function evaluateAndTriggerDeepFreeze(currentLedgerCount: number): {
  triggered: boolean;
  partition?: DeepFreezePartition;
  state: DeepFreezeArchiveState;
} {
  globalArchiveState.totalLedgerEntries = Math.max(globalArchiveState.totalLedgerEntries, currentLedgerCount);
  const hotEntries = globalArchiveState.totalLedgerEntries - globalArchiveState.deepFrozenEntries;
  globalArchiveState.activeHotEntries = hotEntries;

  if (hotEntries >= globalArchiveState.thresholdLimit) {
    // Threshold exceeded: freeze batch of older records (e.g. 500 records)
    const countToFreeze = Math.floor(hotEntries * 0.6);
    const startBlock = globalArchiveState.deepFrozenEntries + 1;
    const endBlock = globalArchiveState.deepFrozenEntries + countToFreeze;

    const uncompressedBytes = countToFreeze * 3084;
    const compressionRatio = +(77.8 + Math.random() * 1.5).toFixed(1);
    const compressedBytes = Math.round(uncompressedBytes * (1 - compressionRatio / 100));
    const bytesSavedMb = +((uncompressedBytes - compressedBytes) / (1024 * 1024)).toFixed(2);

    const partitionId = `DF-PART-${(globalArchiveState.partitions.length + 1).toString().padStart(3, '0')}`;
    const merkleBranchRoot = generateSha256Hash(`DEEP_FREEZE_BRANCH_${startBlock}_${endBlock}_${Date.now()}`);
    const timestampIct = new Date().toLocaleDateString('en-CA') + ' ' + new Date().toLocaleTimeString('en-GB') + ' ICT';

    const newPartition: DeepFreezePartition = {
      partitionId,
      blockRangeStart: startBlock,
      blockRangeEnd: endBlock,
      recordsCount: countToFreeze,
      uncompressedBytes,
      compressedBytes,
      compressionRatio,
      merkleBranchRoot: `0x${merkleBranchRoot}`,
      frozenAt: timestampIct,
      pqcSignature: `FIPS-204-ML-DSA-87-DILITHIUM-FROZEN-SEAL-${partitionId}`,
      coldStorageVault: `VAULT-CRYO-COLD-${(globalArchiveState.partitions.length + 1).toString().padStart(2, '0')} (Cryo-Array)`,
      isReadOnly: true,
    };

    globalArchiveState.deepFrozenEntries += countToFreeze;
    globalArchiveState.activeHotEntries = globalArchiveState.totalLedgerEntries - globalArchiveState.deepFrozenEntries;
    globalArchiveState.lastFrozenAt = timestampIct;
    globalArchiveState.partitions = [...globalArchiveState.partitions, newPartition];
    globalArchiveState.totalBytesSavedMb = +(globalArchiveState.totalBytesSavedMb + bytesSavedMb).toFixed(2);

    notifyListeners();

    return {
      triggered: true,
      partition: newPartition,
      state: { ...globalArchiveState },
    };
  }

  notifyListeners();
  return {
    triggered: false,
    state: { ...globalArchiveState },
  };
}

/**
 * Manually force a Deep Freeze archiving action
 */
export function triggerManualDeepFreeze(amountToFreeze: number = 400): DeepFreezePartition {
  const startBlock = globalArchiveState.deepFrozenEntries + 1;
  const endBlock = globalArchiveState.deepFrozenEntries + amountToFreeze;
  const uncompressedBytes = amountToFreeze * 3084;
  const compressionRatio = +(78.2 + Math.random() * 1.2).toFixed(1);
  const compressedBytes = Math.round(uncompressedBytes * (1 - compressionRatio / 100));
  const bytesSavedMb = +((uncompressedBytes - compressedBytes) / (1024 * 1024)).toFixed(2);

  const partitionId = `DF-PART-${(globalArchiveState.partitions.length + 1).toString().padStart(3, '0')}`;
  const merkleBranchRoot = generateSha256Hash(`DEEP_FREEZE_MANUAL_${startBlock}_${endBlock}_${Date.now()}`);
  const timestampIct = new Date().toLocaleDateString('en-CA') + ' ' + new Date().toLocaleTimeString('en-GB') + ' ICT';

  const newPartition: DeepFreezePartition = {
    partitionId,
    blockRangeStart: startBlock,
    blockRangeEnd: endBlock,
    recordsCount: amountToFreeze,
    uncompressedBytes,
    compressedBytes,
    compressionRatio,
    merkleBranchRoot: `0x${merkleBranchRoot}`,
    frozenAt: timestampIct,
    pqcSignature: `FIPS-204-ML-DSA-87-DILITHIUM-FROZEN-SEAL-${partitionId}`,
    coldStorageVault: `VAULT-CRYO-COLD-MANUAL (Cryo-Array)`,
    isReadOnly: true,
  };

  globalArchiveState.deepFrozenEntries += amountToFreeze;
  globalArchiveState.totalLedgerEntries = Math.max(globalArchiveState.totalLedgerEntries, globalArchiveState.deepFrozenEntries + 100);
  globalArchiveState.activeHotEntries = globalArchiveState.totalLedgerEntries - globalArchiveState.deepFrozenEntries;
  globalArchiveState.lastFrozenAt = timestampIct;
  globalArchiveState.partitions = [...globalArchiveState.partitions, newPartition];
  globalArchiveState.totalBytesSavedMb = +(globalArchiveState.totalBytesSavedMb + bytesSavedMb).toFixed(2);

  notifyListeners();
  return newPartition;
}

export function getDeepFreezeArchiveState(): DeepFreezeArchiveState {
  return { ...globalArchiveState };
}
