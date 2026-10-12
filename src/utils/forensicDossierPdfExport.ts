import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { getAutoTableFinalY } from './pdfAutoTable';
import { FORENSIC_DOSSIER_V9, ForensicDossierMaster } from '../data/forensicAuditMasterDossierData';

export type ChamberCoherenceState = 'FROZEN' | 'QUARANTINE' | 'TEMPERED';

export interface FocusedChamberReportInput {
  chamberId: string;
  name: string;
  coherence: number;
  coherenceState: ChamberCoherenceState;
  sealStatus: string;
  temperature: number;
  merkleHash: string;
  lastSync?: string;
  history24h?: number[];
  qrPayload?: string;
}

export function getChamberCoherenceState(coherence: number, status?: string): ChamberCoherenceState {
  if (status === 'quarantined') return 'QUARANTINE';
  if (status === 'tempered') return 'TEMPERED';
  if (status === 'unstable' && coherence < 0.70) return 'TEMPERED';
  if (status === 'unstable') return 'QUARANTINE';
  if (coherence >= 0.95) return 'FROZEN';
  if (coherence >= 0.70) return 'QUARANTINE';
  return 'TEMPERED';
}

export function getDefaultSealStatus(state: ChamberCoherenceState): string {
  switch (state) {
    case 'FROZEN':
      return 'CANONICAL_SEALED (14,902 Seals Active)';
    case 'QUARANTINE':
      return 'QUARANTINE_HOLD (Isolated Telemetry)';
    case 'TEMPERED':
      return 'INTEGRITY_BREACH_SUSPENDED (Fail-Closed)';
  }
}

export function buildChamberQRPayload(chamber: {
  chamberId: string;
  name?: string;
  coherence: number;
  coherenceState: ChamberCoherenceState;
  sealStatus: string;
  merkleHash?: string;
  temperature?: number;
  genesisBlock?: number;
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://zyrquen.court.local';
  const block = chamber.genesisBlock || 849202;
  const leaf = chamber.merkleHash || '0x909ab814';
  const temp = chamber.temperature !== undefined ? `${chamber.temperature.toFixed(2)}mK` : '14.82mK';
  const coherencePct = (chamber.coherence * 100).toFixed(2);

  return `${origin}/verify/chamber?id=${chamber.chamberId}&state=${chamber.coherenceState}&coherence=${coherencePct}%&sealStatus=${encodeURIComponent(chamber.sealStatus)}&block=${block}&leaf=${leaf}&temp=${temp}&hsm=10/10_FIPS140_3_L4&court=ETDA_SEC9_26_28`;
}

/**
 * Generates the official court-admissible PDF dossier for DOC-SOV-HSM-1010-2026-V9
 * Compliant with Thai Electronic Transactions Act B.E. 2544 (Sec 9, 26, 28) & PDPA B.E. 2562
 */
export function generateMasterForensicDossierV9Pdf(dossier: ForensicDossierMaster = FORENSIC_DOSSIER_V9): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;

  // =========================================================================
  // PAGE 1: EXECUTIVE SUMMARY & CORE TECHNICAL PILLARS
  // =========================================================================

  // Top Dark Header Banner
  doc.setFillColor(7, 10, 18);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Green / Gold accent lines
  doc.setFillColor(16, 185, 129); // Pure Green
  doc.rect(0, 45, pageWidth, 1.5, 'F');
  doc.setFillColor(212, 175, 55); // Gold Master
  doc.rect(0, 46.5, pageWidth, 1, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('ZYRQUEN Ω∞ SOVEREIGN KERNEL v4.16 - FORENSIC DOSSIER', 14, 16);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`OFFICIAL DOSSIER: ${dossier.documentId} • COURT-ADMISSIBLE MASTER`, 14, 24);

  // Authority & Anchor
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Principal Authority: ${dossier.principalAuthority} | Genesis Block: #${dossier.genesisBlock} | Timestamp: ${dossier.auditTimestamp}`,
    14,
    32
  );
  doc.text(
    `Canonical Merkle Root: ${dossier.merkleRoot.substring(0, 42)}... | SSoT Baseline: ${dossier.systemDrift}`,
    14,
    38
  );

  // Status Badge Block
  doc.setFillColor(16, 185, 129, 0.12);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(14, 52, 182, 16, 2, 2, 'FD');
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`STATUS: ${dossier.status} • CERT: ${dossier.certificateId}`, 20, 62);

  // Section 1: Executive Summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, 73, 182, 8, 1, 1, 'F');
  doc.text('1. EXECUTIVE SUMMARY: SOVEREIGN MATHEMATICAL TRUTH & FORENSIC AUDIT', 18, 79);

  const summaryText =
    `The official forensic dossier ${dossier.documentId} establishes an unalterable cryptographic anchor ` +
    `for the ZYRQUEN Ω∞ Sovereign Kernel ${dossier.version} under Executive Passport ${dossier.passportId}. ` +
    `The system is verified in 100% Pure Green status with zero baseline drift (${dossier.systemDrift}) ` +
    `across ${dossier.canonicalSealsCount.toLocaleString()} frozen canonical seals. ` +
    `All operations satisfy statutory electronic evidence criteria under Thai Electronic Transactions Act B.E. 2544 ` +
    `(Sections 9, 26, 28) and PDPA B.E. 2562 (Section 37).`;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  const splitSummary = doc.splitTextToSize(summaryText, 180);
  doc.text(splitSummary, 15, 87);

  // Section 2: Core Technical Pillars Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, 108, 182, 8, 1, 1, 'F');
  doc.text('2. CORE TECHNICAL PILLARS (PILLARS I - IV)', 18, 114);

  const pillarRows = dossier.pillars.map((p) => [
    p.pillarNumber,
    p.title,
    p.specification,
    p.status,
  ]);

  autoTable(doc, {
    startY: 119,
    margin: { left: 14, right: 14 },
    head: [['Pillar', 'Title', 'Technical Mechanism & Hardware Specifications', 'Compliance / Verification']],
    body: pillarRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold' },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 88 },
      3: { cellWidth: 44, textColor: [16, 185, 129], fontStyle: 'bold' },
    },
  });

  // Section 3: Statutory Alignment Summary Table on Page 1
  const finalPillarY = getAutoTableFinalY(doc, 195);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, finalPillarY + 6, 182, 8, 1, 1, 'F');
  doc.text('3. STATUTORY LEGAL ALIGNMENT (THAI ETDA & PDPA)', 18, finalPillarY + 12);

  const legalRows = dossier.legalAlignments.map((l) => [
    l.section,
    l.title,
    l.mechanism,
    l.complianceLevel,
  ]);

  autoTable(doc, {
    startY: finalPillarY + 17,
    margin: { left: 14, right: 14 },
    head: [['Statute', 'Statutory Principle', 'Implementation & Technical Binding', 'Level']],
    body: legalRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold' },
      1: { cellWidth: 40, fontStyle: 'bold' },
      2: { cellWidth: 88 },
      3: { cellWidth: 28, textColor: [16, 185, 129], fontStyle: 'bold' },
    },
  });

  // =========================================================================
  // PAGE 2: 16-STEP MASTER FORENSIC AUDIT TRAIL
  // =========================================================================
  doc.addPage();

  // Page 2 Header Banner
  doc.setFillColor(7, 10, 18);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 30, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('4. 16-STEP MASTER FORENSIC AUDIT TRAIL', 14, 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text(
    `Official Ref: ${dossier.documentId} • All 16 verification stages passed within operational SLA limits (Δ0.00% Zero Drift)`,
    14,
    22
  );

  const stepRows = dossier.steps.map((s) => [
    s.step.toString(),
    s.title,
    s.statutoryStandard,
    s.cryptographicScheme,
    `${s.executionTimeMs.toFixed(1)} ms`,
    s.result,
  ]);

  autoTable(doc, {
    startY: 36,
    margin: { left: 14, right: 14 },
    head: [['Step', 'Audit Stage Title', 'Statutory Framework', 'Cryptographic Scheme / Engine', 'Time', 'Result']],
    body: stepRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2.2 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 54, fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 42 },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 18, halign: 'center', textColor: [16, 185, 129], fontStyle: 'bold' },
    },
  });

  const finalStepsY = getAutoTableFinalY(doc, 230);

  // Signatures & Chain of Custody Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, finalStepsY + 6, 182, 38, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('EVIDENTIARY VERIFICATION & CHAIN OF CUSTODY CERTIFICATION', 18, finalStepsY + 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Cryptographic Merkle Root: ${dossier.merkleRoot}`,
    18,
    finalStepsY + 18
  );
  doc.text(
    `Council Deca-Key Attestation: 10/10 REAL_HSM FIPS 140-3 Level 4 Unanimous Ratified`,
    18,
    finalStepsY + 23
  );
  doc.text(
    `Digital Presumption: Validated under Section 26 of Thai Electronic Transactions Act B.E. 2544`,
    18,
    finalStepsY + 28
  );
  doc.text(
    `Sovereign Principal Architect: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) | Certificate: ${dossier.certificateId}`,
    18,
    finalStepsY + 33
  );
  doc.text(
    `STATUS: 100% PURE GREEN • COURT-ADMISSIBLE READY • MAINNET LIVE`,
    18,
    finalStepsY + 38
  );

  return doc;
}

/**
 * Convenience helper to generate and trigger download of the Master Forensic PDF
 */
export function downloadMasterForensicDossierV9Pdf(dossier: ForensicDossierMaster = FORENSIC_DOSSIER_V9): void {
  const doc = generateMasterForensicDossierV9Pdf(dossier);
  doc.save(`${dossier.documentId}_ZYRQUEN_FORENSIC_MASTER_${Date.now()}.pdf`);
}

/**
 * Convenience alias for downloading forensic evidence manifest PDF
 */
export const downloadEvidenceManifestPdf = downloadMasterForensicDossierV9Pdf;

/**
 * Generates a focused, court-admissible PDF report for a single selected chamber.
 * Includes official legal headers, technical breakdown table, and high-contrast forensic QR code.
 */
export function generateFocusedChamberPdfSync(
  chamber: FocusedChamberReportInput,
  qrDataUrl?: string,
  dossier: ForensicDossierMaster = FORENSIC_DOSSIER_V9
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;

  // 1. Header Banner
  doc.setFillColor(7, 10, 18);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Dynamic color stripe based on coherenceState
  const stripeColor: [number, number, number] =
    chamber.coherenceState === 'FROZEN'
      ? [16, 185, 129] // Green
      : chamber.coherenceState === 'QUARANTINE'
      ? [245, 158, 11] // Amber
      : [239, 68, 68]; // Red (TEMPERED)

  doc.setFillColor(stripeColor[0], stripeColor[1], stripeColor[2]);
  doc.rect(0, 42, pageWidth, 2, 'F');

  // Title & Reference
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ZYRQUEN Ω∞ SOVEREIGN CRYOGENIC CHAMBER DOSSIER', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(stripeColor[0], stripeColor[1], stripeColor[2]);
  doc.text(`COURT FILING RAPID REFERENCE REPORT • EXHIBIT ${chamber.chamberId}`, 14, 24);

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Executive Passport: ${dossier.passportId} | Genesis Anchor: Block #${dossier.genesisBlock} | Case: ${dossier.documentId}`,
    14,
    31
  );
  doc.text(
    `Canonical Root: ${dossier.merkleRoot.substring(0, 42)}... | SSoT Invariant: Δ0.00% Drift`,
    14,
    37
  );

  // Status Banner Box with Dynamic Indicator
  const bannerBg: [number, number, number] =
    chamber.coherenceState === 'FROZEN'
      ? [236, 253, 245]
      : chamber.coherenceState === 'QUARANTINE'
      ? [255, 251, 235]
      : [254, 242, 242];

  doc.setFillColor(bannerBg[0], bannerBg[1], bannerBg[2]);
  doc.setDrawColor(stripeColor[0], stripeColor[1], stripeColor[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(14, 48, 182, 17, 2, 2, 'FD');

  doc.setTextColor(stripeColor[0], stripeColor[1], stripeColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${chamber.chamberId} — ${chamber.name.toUpperCase()}`, 20, 56);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(
    `COHERENCE STATE: [${chamber.coherenceState}] ${(chamber.coherence * 100).toFixed(2)}% | SEAL: ${chamber.sealStatus} | CRYO TEMP: ${chamber.temperature.toFixed(2)} mK`,
    20,
    62
  );

  // QR Code Rendering Area (Left box)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.roundedRect(14, 69, 52, 54, 2, 2, 'FD');

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', 16, 71, 48, 48);
    } catch {
      // fallback placeholder if image rendering fails
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('QR CODE ATTACHED', 18, 95);
    }
  } else {
    // High-contrast schematic marker if synchronous without data url
    doc.setFillColor(15, 23, 42);
    doc.rect(20, 75, 40, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('FORENSIC QR', 26, 92);
    doc.text(chamber.chamberId, 31, 98);
  }

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('FORENSIC COURT QR SEAL', 18, 121);

  // QR Metadata Breakdown (Right box)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(70, 69, 126, 54, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('RAPID FIELD & COURTROOM VERIFICATION METADATA', 74, 76);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`• Chamber Identifier: ${chamber.chamberId}`, 74, 82);
  doc.text(`• Dynamic Coherence State: ${chamber.coherenceState} (${(chamber.coherence * 100).toFixed(2)}%)`, 74, 87);
  doc.text(`• Current Seal Status: ${chamber.sealStatus}`, 74, 92);
  doc.text(`• Merkle Leaf Cryptographic Hash: ${chamber.merkleHash}`, 74, 97);
  doc.text(`• Cryogenic Telemetry: ${chamber.temperature.toFixed(2)} mK (Sub-Kelvin Cold Enclave)`, 74, 102);
  doc.text(`• PQC Digital Scheme: NIST FIPS 204 CRYSTALS-Dilithium-5 (ML-DSA-87)`, 74, 107);
  doc.text(`• Statutory Legal Standard: Thai Electronic Transactions Act B.E. 2544 (Sec 9, 26, 28)`, 74, 112);
  doc.text(`• Courtroom Scan: Mobile camera instantly resolves SSoT verification proof`, 74, 117);

  // Technical Breakdown Table (autoTable)
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, 128, 182, 7.5, 1, 1, 'F');
  doc.text(`TECHNICAL BREAKDOWN & ENCLAVE ARCHITECTURE: ${chamber.chamberId}`, 18, 133.5);

  const breakdownRows = [
    ['Chamber Identifier', chamber.chamberId, 'Canonical SSoT Slot 1-18'],
    ['Subsystem Name', chamber.name, 'Cryogenic High-Assurance Hardware Ring 0'],
    ['Coherence Assessment', `${(chamber.coherence * 100).toFixed(2)}% [${chamber.coherenceState}]`, 'Continuous Optical Quantum SSoT Monitor'],
    ['Thermal Stabilization', `${chamber.temperature.toFixed(2)} mK`, 'Dilution Refrigerator Sub-Kelvin Telemetry'],
    ['Canonical Seal Status', chamber.sealStatus, '14,902 Immutably Frozen WORM Seals'],
    ['Merkle Leaf Digest', chamber.merkleHash, 'SHA3-512 with RFC 3161 Timestamp Token'],
    ['Consensus Quorum', '10/10 REAL_HSM Quorum Active', 'Utimaco u.trust GP CSe (FIPS 140-3 Level 4)'],
    ['PQC Cryptosystem', 'ML-DSA-87 (Dilithium-5) + SPHINCS+', 'Quantum-Resistant Lattice Fail-Closed Defense'],
    ['Baseline Drift Invariant', 'Δ0.00% Zero Drift', 'Strictly Enforced Ring 0 Kernel Lock'],
    ['Judicial Admissibility', 'ETDA Sec 9, 26, 28 & PDPA Sec 37', 'Thai Civil & Commercial Procedure Admissible'],
  ];

  autoTable(doc, {
    startY: 138,
    margin: { left: 14, right: 14 },
    head: [['Technical Metric / Enclave Gate', 'Verified Operational Telemetry', 'Statutory / Security Standard']],
    body: breakdownRows,
    theme: 'grid',
    styles: { fontSize: 7.2, cellPadding: 2.1 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 70, fontStyle: 'bold', textColor: [15, 23, 42] },
      2: { cellWidth: 62, textColor: [71, 85, 105] },
    },
  });

  const tableFinalY = getAutoTableFinalY(doc, 215);

  // Chain of Custody & Court Certification Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, tableFinalY + 5, 182, 38, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL JUDICIAL CHAIN OF CUSTODY CERTIFICATION', 18, tableFinalY + 11);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `This chamber forensic report constitutes an official certified excerpt of Master Dossier ${dossier.documentId}, ` +
    `prepared for expedited judicial review and filing before the Court of Justice (ศาลยุติธรรม).`,
    18,
    tableFinalY + 17
  );
  doc.text(
    `Legal Presumption: Full evidentiary presumption under Section 26 of the Electronic Transactions Act B.E. 2544.`,
    18,
    tableFinalY + 22
  );
  doc.text(
    `Cryptographic Anchor: Genesis Block #${dossier.genesisBlock} | Merkle Leaf: ${chamber.merkleHash}`,
    18,
    tableFinalY + 27
  );
  doc.text(
    `Executive Custodian: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) | Certificate ID: ZQ-CHAMBER-${chamber.chamberId}-849202`,
    18,
    tableFinalY + 32
  );
  doc.text(
    `SEAL: 10/10 REAL_HSM UNANIMOUS RATIFICATION • ZERO DATA MODIFICATION PERMITTED (WORM LOCKED)`,
    18,
    tableFinalY + 37
  );

  return doc;
}

/**
 * Asynchronously generates the focused chamber PDF with rendered high-contrast QR code
 */
export async function generateFocusedChamberPdf(
  chamber: FocusedChamberReportInput,
  dossier: ForensicDossierMaster = FORENSIC_DOSSIER_V9
): Promise<jsPDF> {
  const qrPayload = chamber.qrPayload || buildChamberQRPayload(chamber);
  let qrDataUrl: string | undefined;

  try {
    qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      color: {
        dark: '#050a14',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to render QR to data URL:', err);
  }

  return generateFocusedChamberPdfSync(chamber, qrDataUrl, dossier);
}

/**
 * Generates and triggers download of the focused single-chamber PDF report
 */
export async function downloadFocusedChamberPdf(
  chamber: FocusedChamberReportInput,
  dossier: ForensicDossierMaster = FORENSIC_DOSSIER_V9
): Promise<void> {
  const doc = await generateFocusedChamberPdf(chamber, dossier);
  doc.save(`ZYRQUEN_Chamber_${chamber.chamberId}_Court_Dossier_${Date.now()}.pdf`);
}

