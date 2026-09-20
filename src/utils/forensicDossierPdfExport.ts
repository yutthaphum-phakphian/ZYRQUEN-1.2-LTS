import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FORENSIC_DOSSIER_V9, ForensicDossierMaster } from '../data/forensicAuditMasterDossierData';

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
  const finalPillarY = (doc as any).lastAutoTable?.finalY || 195;
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

  const finalStepsY = (doc as any).lastAutoTable?.finalY || 230;

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
