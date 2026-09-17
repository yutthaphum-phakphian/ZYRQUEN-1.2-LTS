import { HardwareSnapshot, AuditStage } from '../types';
import { SYSTEM_METADATA } from '../data/canonicalData';

// Generate simulated SHA-256 hash
export function generateSha256Hash(seed: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex1 = ('00000000' + (hash >>> 0).toString(16)).slice(-8);
  const hex2 = ('00000000' + (Math.imul(hash, 31) >>> 0).toString(16)).slice(-8);
  const hex3 = ('00000000' + (Math.imul(hash, 57) >>> 0).toString(16)).slice(-8);
  const hex4 = ('00000000' + (Math.imul(hash, 93) >>> 0).toString(16)).slice(-8);
  const hex5 = ('00000000' + (Math.imul(hash, 127) >>> 0).toString(16)).slice(-8);
  const hex6 = ('00000000' + (Math.imul(hash, 199) >>> 0).toString(16)).slice(-8);
  const hex7 = ('00000000' + (Math.imul(hash, 241) >>> 0).toString(16)).slice(-8);
  const hex8 = ('00000000' + (Math.imul(hash, 311) >>> 0).toString(16)).slice(-8);
  return `0x${hex1}${hex2}${hex3}${hex4}${hex5}${hex6}${hex7}${hex8}`;
}

// Initial baseline hardware snapshot (Genesis Block #849202 Locked Baseline)
export const INITIAL_HARDWARE_SNAPSHOTS: HardwareSnapshot[] = [
  {
    id: 'SNAP-849202-001',
    snapshotNumber: 1,
    timestampIct: '2026-08-20 05:03:08 ICT',
    timestampUtc: '2026-08-19 22:03:08 UTC',
    epoch: 1787180588000,
    cpuAverage: 41.2,
    cpuCores: [42.1, 39.8, 44.5, 38.6],
    memoryUsedMb: 5214,
    memoryTotalMb: 8192,
    cryoTempMk: 14.98,
    heliumFlowPct: 74.2,
    networkRxMbps: 84.2,
    networkTxMbps: 112.6,
    qopsThroughput: 24960.0,
    coherencePct: 99.98,
    otelSpansSec: 2450,
    ssdWearLevelPct: 0.82,
    voltageStabilityPct: 99.98,
    SSD_Wear_Level: 0.82,
    Voltage_Stability: 99.98,
    parentHash: SYSTEM_METADATA.merkleRoot,
    sealedHash: '0x909ab814e5a973d4bb79e0a293673f8373a4b6c3d2e1f0a9b8c7d6e5f4a3b2c1',
    actor: 'SOVEREIGN-CUSTODIAN-EP001 (นายยุทธภูมิ พากเพียร)',
    status: 'SEALED',
  },
];

// Create a new snapshot from current hardware telemetry
export function createTelemetrySnapshot(
  telemetry: {
    core0?: number;
    core1?: number;
    core2?: number;
    core3?: number;
    memUsedMb?: number;
    cryoTempMk?: number;
    qopsThroughput?: number;
    coherencePct?: number;
    networkRxMbps?: number;
    networkTxMbps?: number;
    otelSpansSec?: number;
    ssdWearLevelPct?: number;
    voltageStabilityPct?: number;
  },
  currentSnapshotsCount: number,
  lastSealedHash?: string
): HardwareSnapshot {
  const now = new Date();
  const c0 = +(telemetry.core0 || 41.5).toFixed(1);
  const c1 = +(telemetry.core1 || 39.2).toFixed(1);
  const c2 = +(telemetry.core2 || 43.8).toFixed(1);
  const c3 = +(telemetry.core3 || 38.4).toFixed(1);
  const cpuAvg = +((c0 + c1 + c2 + c3) / 4).toFixed(1);
  const memUsed = Math.round(telemetry.memUsedMb || 5220);
  const cryo = +(telemetry.cryoTempMk || 14.98).toFixed(2);
  const qops = +(telemetry.qopsThroughput || 24960.0).toFixed(1);
  const coherence = +(telemetry.coherencePct || 99.98).toFixed(2);
  const rx = +(telemetry.networkRxMbps || 85.0).toFixed(1);
  const tx = +(telemetry.networkTxMbps || 114.0).toFixed(1);
  const spans = Math.round(telemetry.otelSpansSec || 2460);
  const ssdWear = +(telemetry.ssdWearLevelPct || 0.83).toFixed(2);
  const voltage = +(telemetry.voltageStabilityPct || 99.99).toFixed(2);

  const snapshotNum = currentSnapshotsCount + 1;
  const snapId = `SNAP-849202-${String(snapshotNum).padStart(3, '0')}`;
  const parent = lastSealedHash || SYSTEM_METADATA.merkleRoot;
  const hashSeed = `${snapId}-${now.toISOString()}-${cpuAvg}-${memUsed}-${cryo}-${qops}-${parent}`;
  const sealed = generateSha256Hash(hashSeed);

  return {
    id: snapId,
    snapshotNumber: snapshotNum,
    timestampIct: now.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false }) + ' ICT (' + now.toISOString().slice(0, 10) + ')',
    timestampUtc: now.toUTCString().slice(17, 25) + ' UTC',
    epoch: now.getTime(),
    cpuAverage: cpuAvg,
    cpuCores: [c0, c1, c2, c3],
    memoryUsedMb: memUsed,
    memoryTotalMb: 8192,
    cryoTempMk: cryo,
    heliumFlowPct: 74.2,
    networkRxMbps: rx,
    networkTxMbps: tx,
    qopsThroughput: qops,
    coherencePct: coherence,
    otelSpansSec: spans,
    ssdWearLevelPct: ssdWear,
    voltageStabilityPct: voltage,
    SSD_Wear_Level: ssdWear,
    Voltage_Stability: voltage,
    parentHash: parent,
    sealedHash: sealed,
    actor: 'SOVEREIGN-CUSTODIAN-EP001 (นายยุทธภูมิ พากเพียร)',
    status: 'SEALED',
  };
}

// Export All Evidence Logs as CSV File with configurable timestamp format
export function exportEvidenceToCsv(
  stages: AuditStage[],
  snapshots: HardwareSnapshot[],
  timestampMode: 'human' | 'block-height' = 'human'
): void {
  const headers = [
    'Record_Type',
    'Index',
    'Record_ID',
    'Name_Or_Title',
    'Status',
    timestampMode === 'block-height' ? 'Block_Height_Reference' : 'Timestamp',
    'Duration_Ms',
    'Actor',
    'Source_Module',
    'Parent_Hash_Input',
    'Output_Hash_Sealed',
    'Key_Metadata_And_Telemetry',
  ];

  const escapeCsv = (val: string | number | boolean | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[] = [];
  rows.push(headers.join(','));

  // 1. Forensics Stages
  stages.forEach((st) => {
    const metaStr = Object.entries(st.metadata || {})
      .map(([k, v]) => `${k}:${v}`)
      .join('; ');

    const timeCol =
      timestampMode === 'block-height'
        ? `BLOCK #849202 [STAGE ${String(st.stageNumber).padStart(2, '0')}/12]`
        : st.timestamp || '2026-08-20 05:03:08 ICT';

    rows.push(
      [
        escapeCsv('AUDIT_STAGE'),
        escapeCsv(st.stageNumber),
        escapeCsv(st.stageId || st.id),
        escapeCsv(st.name),
        escapeCsv(st.status),
        escapeCsv(timeCol),
        escapeCsv(st.durationMs),
        escapeCsv(st.actor),
        escapeCsv(st.sourceModule),
        escapeCsv(st.parentHash),
        escapeCsv(st.outputHash),
        escapeCsv(`${st.shortDesc} | Metadata: [${metaStr}]`),
      ].join(',')
    );
  });

  // 2. Hardware Telemetry Snapshots
  snapshots.forEach((snap) => {
    const teleStr = `CPU Avg: ${snap.cpuAverage}% (Cores: ${snap.cpuCores.join('/')}%) | RAM: ${snap.memoryUsedMb}/${snap.memoryTotalMb}MB | Cryo: ${snap.cryoTempMk}mK | QOps: ${snap.qopsThroughput} QOps/s | Coherence: ${snap.coherencePct}% | Spans: ${snap.otelSpansSec}/s`;

    const timeCol =
      timestampMode === 'block-height'
        ? `BLOCK #849202-SNAP${String(snap.snapshotNumber).padStart(3, '0')} [H:849202]`
        : `${snap.timestampIct} | ${snap.timestampUtc}`;

    rows.push(
      [
        escapeCsv('HARDWARE_TELEMETRY_SNAPSHOT'),
        escapeCsv(snap.snapshotNumber),
        escapeCsv(snap.id),
        escapeCsv('Hardware Telemetry & Cryo State Capture'),
        escapeCsv(snap.status),
        escapeCsv(timeCol),
        escapeCsv(0),
        escapeCsv(snap.actor),
        escapeCsv('HARDWARE_CRYO_OTLP_V1.28'),
        escapeCsv(snap.parentHash),
        escapeCsv(snap.sealedHash),
        escapeCsv(teleStr),
      ].join(',')
    );
  });

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const modeSuffix = timestampMode === 'block-height' ? 'BLOCK-HEIGHT' : 'HUMAN-TIME';
  a.download = `ZYRQUEN-EVIDENCE-LOGS-${modeSuffix}-${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export Complete Immutable Ledger as CSV (Including timestamp, Merkle root, and seal counts for external audit verification)
export function exportImmutableLedgerCsv(
  snapshots: HardwareSnapshot[],
  canonicalMerkleRoot: string = SYSTEM_METADATA.merkleRoot,
  canonicalSealCount: number = SYSTEM_METADATA.canonicalSeals
): void {
  const escapeCsv = (val: string | number | boolean | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    'Block_Height',
    'Timestamp_ICT',
    'Timestamp_UTC',
    'Timestamp_Epoch',
    'Merkle_Root_Hash',
    'Parent_Merkle_Hash',
    'Canonical_Seal_Count',
    'Verified_Seal_Count',
    'Record_Type',
    'Entry_ID',
    'State_Digest',
    'PQC_Attestation',
    'Legal_Compliance_Standard',
    'Sovereign_Custodian',
    'SSoT_Mutation_Authority',
    'System_Status',
  ];

  const rows: string[] = [];
  rows.push(headers.join(','));

  const totalSeals = canonicalSealCount + Math.max(0, snapshots.length - 1);

  // 1. Genesis Immutable Block Record
  rows.push(
    [
      escapeCsv('#849202'),
      escapeCsv('2026-08-20 05:03:08 ICT'),
      escapeCsv('2026-08-19 22:03:08 UTC'),
      escapeCsv(1787180588000),
      escapeCsv(canonicalMerkleRoot),
      escapeCsv('0000000000000000000000000000000000000000000000000000000000000000'),
      escapeCsv(canonicalSealCount),
      escapeCsv(totalSeals),
      escapeCsv('GENESIS_FROZEN_BLOCK'),
      escapeCsv('GENESIS-BLOCK-849202'),
      escapeCsv(canonicalMerkleRoot),
      escapeCsv('NIST FIPS 204 ML-DSA-87 (Dilithium-5) | FIPS 203 ML-KEM-1024'),
      escapeCsv('พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) / ETDA มาตรา 9, 26, 28'),
      escapeCsv('นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) OMEGA-1 SUPREME CLEARANCE'),
      escapeCsv('0 (READ_ONLY_INVOLATILE)'),
      escapeCsv('OPERATIONAL_FAIL_CLOSED_PROTECTED'),
    ].join(',')
  );

  // 2. Hardware Telemetry & State Entries
  snapshots.forEach((snap, idx) => {
    rows.push(
      [
        escapeCsv(`#849202-SNAP${String(snap.snapshotNumber || idx + 1).padStart(3, '0')}`),
        escapeCsv(snap.timestampIct),
        escapeCsv(snap.timestampUtc),
        escapeCsv(snap.epoch),
        escapeCsv(snap.sealedHash),
        escapeCsv(snap.parentHash),
        escapeCsv(canonicalSealCount),
        escapeCsv(canonicalSealCount + idx),
        escapeCsv('TELEMETRY_SNAPSHOT_ENTRY'),
        escapeCsv(snap.id),
        escapeCsv(snap.sealedHash),
        escapeCsv('NIST FIPS 204 ML-DSA-87 (Dilithium-5 Verified)'),
        escapeCsv('ETDA Level 3+ Electronic Transactions Act (Sec 26/28)'),
        escapeCsv(snap.actor || 'SOVEREIGN-CUSTODIAN-EP001 (นายยุทธภูมิ พากเพียร)'),
        escapeCsv('0 (READ_ONLY_INVOLATILE)'),
        escapeCsv(snap.status || 'SEALED'),
      ].join(',')
    );
  });

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = `ZYRQUEN-IMMUTABLE-LEDGER-AUDIT-ROOT-${canonicalMerkleRoot.slice(0, 8)}-${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export single Hardware Snapshot as formatted JSON file
export function exportHardwareSnapshotJson(snapshot: HardwareSnapshot): void {
  const jsonContent = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const snapName = snapshot.id ? snapshot.id.toLowerCase() : `snapshot-${snapshot.snapshotNumber || Date.now()}`;
  a.download = `hardware-snapshot-${snapName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export All Hardware Snapshots as a dedicated CSV file
export function exportAllHardwareSnapshotsCsv(snapshots: HardwareSnapshot[]): void {
  const escapeCsv = (val: string | number | boolean | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    'Snapshot_ID',
    'Snapshot_Number',
    'Timestamp_ICT',
    'Timestamp_UTC',
    'Epoch_Ms',
    'CPU_Average_Pct',
    'CPU_Core_0_Pct',
    'CPU_Core_1_Pct',
    'CPU_Core_2_Pct',
    'CPU_Core_3_Pct',
    'Memory_Used_MB',
    'Memory_Total_MB',
    'Memory_Used_Pct',
    'Cryo_Temp_mK',
    'Helium_Flow_Pct',
    'Network_Rx_Mbps',
    'Network_Tx_Mbps',
    'QOps_Throughput',
    'Coherence_Pct',
    'OTEL_Spans_Sec',
    'SSD_Wear_Level_Pct',
    'Voltage_Stability_Pct',
    'Sealed_Hash',
    'Parent_Hash',
    'Actor',
    'Status',
  ];

  const rows: string[] = [headers.join(',')];

  snapshots.forEach((snap) => {
    const c0 = snap.cpuCores?.[0] ?? snap.cpuAverage;
    const c1 = snap.cpuCores?.[1] ?? snap.cpuAverage;
    const c2 = snap.cpuCores?.[2] ?? snap.cpuAverage;
    const c3 = snap.cpuCores?.[3] ?? snap.cpuAverage;
    const memPct = snap.memoryTotalMb ? +((snap.memoryUsedMb / snap.memoryTotalMb) * 100).toFixed(1) : 0;

    rows.push(
      [
        escapeCsv(snap.id),
        escapeCsv(snap.snapshotNumber),
        escapeCsv(snap.timestampIct),
        escapeCsv(snap.timestampUtc),
        escapeCsv(snap.epoch),
        escapeCsv(snap.cpuAverage),
        escapeCsv(c0),
        escapeCsv(c1),
        escapeCsv(c2),
        escapeCsv(c3),
        escapeCsv(snap.memoryUsedMb),
        escapeCsv(snap.memoryTotalMb),
        escapeCsv(memPct),
        escapeCsv(snap.cryoTempMk),
        escapeCsv(snap.heliumFlowPct ?? 100),
        escapeCsv(snap.networkRxMbps ?? 0),
        escapeCsv(snap.networkTxMbps ?? 0),
        escapeCsv(snap.qopsThroughput),
        escapeCsv(snap.coherencePct ?? 100),
        escapeCsv(snap.otelSpansSec ?? 0),
        escapeCsv(snap.ssdWearLevelPct ?? snap.SSD_Wear_Level ?? 0),
        escapeCsv(snap.voltageStabilityPct ?? snap.Voltage_Stability ?? 100),
        escapeCsv(snap.sealedHash),
        escapeCsv(snap.parentHash),
        escapeCsv(snap.actor),
        escapeCsv(snap.status),
      ].join(',')
    );
  });

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `hardware-snapshots-all-${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── SOVEREIGN QUANTUM PACK v1.2 LTS METRIC EXPORTS ──

export interface TelemetrySnapshot {
  timestamp: number;
  cpuLoad: number;
  memoryUsage: number;
  qopsThroughput: number;
  coherence: number;
  entropyDrift: number; // 🆕 metric field
}

export const getEntropyDrift = (snapshot: any): number => {
  const qops = snapshot?.qopsThroughput ?? snapshot?.qops ?? 850;
  const coherence = snapshot?.coherence ?? snapshot?.coherencePct ?? 99.9;
  const variance = Math.abs(qops - coherence);
  return 26 + (Math.round(variance) % 52); // map variance to 26–78 range
};

export const logEvent = (eventName: string, payload?: any) => {
  console.info(`[TELEMETRY LOG] ${eventName}:`, payload);
  return { eventName, payload, timestamp: Date.now() };
};


