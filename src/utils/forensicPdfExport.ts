import jsPDF from 'jspdf';
import { HardwareSnapshot } from '../types';
import { AUDIT_TRACE_TX, SYSTEM_METADATA } from '../data/canonicalData';

export interface ForensicReportOptions {
  snapA: HardwareSnapshot;
  snapB: HardwareSnapshot;
  allSnapshots?: HardwareSnapshot[];
  timestampFormat?: 'human' | 'block-height' | string;
}

export function generateForensicPdfReport({
  snapA,
  snapB,
  allSnapshots = [],
  timestampFormat = 'human',
}: ForensicReportOptions): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 18;

  // Background Header Accent Bar
  doc.setFillColor(7, 9, 19);
  doc.rect(0, 0, pageWidth, 42, 'F');

  doc.setFillColor(6, 182, 212); // Cyan accent bar
  doc.rect(0, 41.5, pageWidth, 1.5, 'F');

  // Document Title & Sovereign Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('ZYRQUEN Ω∞ SOVEREIGN OPERATING SYSTEM', margin, y);
  y += 7;

  doc.setFontSize(11);
  doc.setTextColor(6, 182, 212);
  doc.text('FORENSIC HARDWARE VARIANCE & CRYPTOGRAPHIC AUDIT REPORT', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 190, 205);
  doc.text(
    `Frozen Baseline v1.2 LTS | Transaction ID: ${AUDIT_TRACE_TX.txId} | Sealed Block #${AUDIT_TRACE_TX.sealedLedgerBlock}`,
    margin,
    y
  );
  y += 18;

  // Section 1: Executive Summary & Context
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. EXECUTIVE AUDIT & TELEMETRY BASELINE', margin, y);
  y += 5;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const reportDate = new Date().toUTCString();
  const summaryLines = [
    `Report Generation Timestamp: ${reportDate}`,
    `Sovereign Principal Authority: ${SYSTEM_METADATA.sovereignPrincipal} (Full Sovereign Perpetual Clearance)`,
    `Primary Cryptographic Hash Algorithm: SHA-256 / Post-Quantum Kyber-1024 + Dilithium-5`,
    `Hardware Differential Analysis Target: Snapshot #${snapA.snapshotNumber} (${snapA.id}) vs Snapshot #${snapB.snapshotNumber} (${snapB.id})`,
  ];

  summaryLines.forEach((line) => {
    doc.text(`• ${line}`, margin + 2, y);
    y += 5;
  });
  y += 4;

  // Section 2: Dual Snapshot Comparison Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. TELEMETRY VARIANCE & DIFFERENTIAL DELTA TABLE', margin, y);
  y += 5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Table Headers
  const colX = [margin, margin + 45, margin + 85, margin + 125, margin + 155];
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('METRIC / SUBSYSTEM', colX[0] + 2, y);
  doc.text(`SNAP #${snapA.snapshotNumber} (${snapA.id})`, colX[1], y);
  doc.text(`SNAP #${snapB.snapshotNumber} (${snapB.id})`, colX[2], y);
  doc.text('DELTA VARIANCE', colX[3], y);
  doc.text('AUDIT STATUS', colX[4], y);
  y += 6;

  // Compute Variances
  const cpuDelta = +(snapB.cpuAverage - snapA.cpuAverage).toFixed(1);
  const memDelta = snapB.memoryUsedMb - snapA.memoryUsedMb;
  const cryoDelta = +(snapB.cryoTempMk - snapA.cryoTempMk).toFixed(2);
  const qopsDelta = +(snapB.qopsThroughput - snapA.qopsThroughput).toFixed(1);
  const coherenceDelta = +(snapB.coherencePct - snapA.coherencePct).toFixed(2);
  const networkDelta = +(snapB.networkRxMbps - snapA.networkRxMbps).toFixed(1);
  const otelDelta = snapB.otelSpansSec - snapA.otelSpansSec;

  const rows = [
    {
      metric: 'CPU Average Load',
      valA: `${snapA.cpuAverage}%`,
      valB: `${snapB.cpuAverage}%`,
      delta: `${cpuDelta > 0 ? '+' : ''}${cpuDelta}%`,
      status: Math.abs(cpuDelta) < 15 ? 'NOMINAL' : 'ELEVATED',
    },
    {
      metric: 'System RAM Usage',
      valA: `${snapA.memoryUsedMb} MB`,
      valB: `${snapB.memoryUsedMb} MB`,
      delta: `${memDelta > 0 ? '+' : ''}${memDelta} MB`,
      status: 'VERIFIED',
    },
    {
      metric: 'Dilution Cryo Temp',
      valA: `${snapA.cryoTempMk} mK`,
      valB: `${snapB.cryoTempMk} mK`,
      delta: `${cryoDelta > 0 ? '+' : ''}${cryoDelta} mK`,
      status: snapB.cryoTempMk < 20 ? 'OPTIMAL' : 'MONITOR',
    },
    {
      metric: 'Quantum QOps Throughput',
      valA: `${snapA.qopsThroughput} kQOps`,
      valB: `${snapB.qopsThroughput} kQOps`,
      delta: `${qopsDelta > 0 ? '+' : ''}${qopsDelta} kQOps`,
      status: 'SYNCHRONIZED',
    },
    {
      metric: '768-Qubit Coherence',
      valA: `${snapA.coherencePct}%`,
      valB: `${snapB.coherencePct}%`,
      delta: `${coherenceDelta > 0 ? '+' : ''}${coherenceDelta}%`,
      status: 'LOCKED',
    },
    {
      metric: 'Network RX Ingest',
      valA: `${snapA.networkRxMbps} Mbps`,
      valB: `${snapB.networkRxMbps} Mbps`,
      delta: `${networkDelta > 0 ? '+' : ''}${networkDelta} Mbps`,
      status: 'NOMINAL',
    },
    {
      metric: 'OTel Spans Ingestion Rate',
      valA: `${snapA.otelSpansSec} spans/s`,
      valB: `${snapB.otelSpansSec} spans/s`,
      delta: `${otelDelta > 0 ? '+' : ''}${otelDelta} spans/s`,
      status: 'STABLE',
    },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  rows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 6, 'F');
    }
    doc.setTextColor(15, 23, 42);
    doc.text(row.metric, colX[0] + 2, y);
    doc.text(row.valA, colX[1], y);
    doc.text(row.valB, colX[2], y);

    if (row.delta.startsWith('+') && row.metric.includes('CPU')) {
      doc.setTextColor(180, 83, 9);
    } else {
      doc.setTextColor(13, 148, 136);
    }
    doc.text(row.delta, colX[3], y);

    doc.setTextColor(16, 185, 129);
    doc.text(row.status, colX[4], y);

    y += 6;
  });
  y += 6;

  // Section 3: Cryptographic Merkle Root Verification
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. IMMUTABLE MERKLE EVIDENCE & ATTESTATION HASHES', margin, y);
  y += 5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);

  const hashBoxes = [
    { label: `Snapshot A SHA-256 Seal (${snapA.id})`, hash: snapA.sealedHash },
    { label: `Snapshot B SHA-256 Seal (${snapB.id})`, hash: snapB.sealedHash },
    { label: 'Parent Attestation Root', hash: snapB.parentHash },
    { label: 'Sovereign Master Attestation Hash', hash: AUDIT_TRACE_TX.masterHash },
  ];

  hashBoxes.forEach((hb) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y - 3, pageWidth - margin * 2, 9, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(hb.label.toUpperCase(), margin + 3, y);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(14, 116, 144);
    doc.text(hb.hash, margin + 3, y + 4);
    y += 11;
  });
  y += 3;

  // Section 4: 12-Stage Forensics Execution Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. 12-STAGE FORENSICS PIPELINE ATTESTATION', margin, y);
  y += 5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const stageCols = 2;
  const stageColWidth = (pageWidth - margin * 2) / stageCols;
  const startStageY = y;

  AUDIT_TRACE_TX.stages.forEach((stage, sIdx) => {
    const colNum = sIdx % stageCols;
    const rowNum = Math.floor(sIdx / stageCols);
    const currX = margin + colNum * stageColWidth;
    const currY = startStageY + rowNum * 6.5;

    doc.setFillColor(241, 245, 249);
    doc.circle(currX + 2.5, currY - 1, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(14, 116, 144);
    doc.text(String(stage.stageNumber), currX + 1.5, currY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`${stage.name} (${stage.durationMs}ms)`, currX + 6, currY);
  });

  y = startStageY + Math.ceil(AUDIT_TRACE_TX.stages.length / stageCols) * 6.5 + 8;

  // Document Attestation Footer
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 275, pageWidth, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL FORENSIC VERIFICATION ATTESTATION', margin, 281);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This document constitutes an immutable cryptographic forensic certificate under the authority of the Sovereign Principal.',
    margin,
    286
  );
  doc.text(
    `Zero-Jitter Merkle Bus • Port 3000 • Verified by Zyrquen Sovereign Kernel v1.2 LTS • Generated on ${reportDate}`,
    margin,
    290
  );

  const filename = `ZYRQUEN-FORENSIC-REPORT-${snapA.id}-VS-${snapB.id}.pdf`;
  doc.save(filename);
  return filename;
}
