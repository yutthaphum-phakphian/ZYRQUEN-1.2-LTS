import jsPDF from 'jspdf';
import { SYSTEM_METADATA, CANONICAL_MERKLE_ROOT } from '../data/canonicalData';

export interface ChecklistItem {
  id: string;
  category: string;
  statuteRef: string;
  title: string;
  description: string;
  passed: boolean;
  notes?: string;
  technicalProof?: string;
  legalImplication?: string;
  hashDigest?: string;
  pqcStandard?: string;
}

export interface InspectorProfile {
  name: string;
  organization: string;
  inspectorId: string;
  inspectionDate: string;
  overallConclusion: 'PASSED' | 'CONDITIONAL' | 'FAILED';
}

export function generateDigitalEvidenceChecklistPdf(
  items: ChecklistItem[],
  inspector: InspectorProfile = {
    name: SYSTEM_METADATA.sovereignPrincipal,
    organization: 'Thai Sovereign Custodian Council & Forensic Lab',
    inspectorId: '#EP-SOVEREIGN-01',
    inspectionDate: new Date().toISOString().split('T')[0],
    overallConclusion: 'PASSED',
  }
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // Header Banner
  doc.setFillColor(7, 10, 18);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Gold accent divider
  doc.setFillColor(212, 175, 55); // #D4AF37
  doc.rect(0, 40.5, pageWidth, 1.5, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(212, 175, 55);
  doc.text('DIGITAL EVIDENCE FORENSIC INSPECTION CHECKLIST (v2.0)', margin, y + 2);
  y += 6.5;

  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ISO/IEC 27037 • ETDA (SEC 9, 26, 28) • PDPA (SEC 9, 26, 28) • NCSA CYBERSECURITY', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 190, 205);
  doc.text(
    `Official Court-Ready Evidence Verification Package • Merkle Root: ${CANONICAL_MERKLE_ROOT.slice(0, 32)}...`,
    margin,
    y
  );
  y += 20;

  // Inspector & Case Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 25, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('INSPECTOR & ATTESTATION PROFILE', margin + 3.5, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Lead Inspector: ${inspector.name}`, margin + 3.5, y + 10.5);
  doc.text(`Credential / Passport ID: ${inspector.inspectorId}`, margin + 3.5, y + 15);
  doc.text(`Organization: ${inspector.organization}`, margin + 3.5, y + 19.5);

  doc.text(`Date of Inspection: ${inspector.inspectionDate}`, margin + 95, y + 10.5);
  doc.text(`Seal Anchor Height: Block #${SYSTEM_METADATA.sealedBlock}`, margin + 95, y + 15);

  doc.setFont('helvetica', 'bold');
  const passCount = items.filter((i) => i.passed).length;
  const isAllPass = passCount === items.length;
  doc.setTextColor(isAllPass ? 16 : 185, isAllPass ? 149 : 28, isAllPass ? 100 : 28);
  doc.text(`Audit Result: ${inspector.overallConclusion} (${passCount}/${items.length} Modules Verified)`, margin + 95, y + 19.5);

  y += 29;

  // Categories Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('FORENSIC COMPLIANCE VERIFICATION MATRIX', margin, y);
  y += 4.5;

  // Table header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('STATUS', margin + 2, y + 4.5);
  doc.text('MODULE & STATUTE REFERENCE', margin + 20, y + 4.5);
  doc.text('VERIFICATION REQUIREMENT & TECHNICAL SPEC', margin + 85, y + 4.5);
  y += 8.5;

  // Table Rows
  items.forEach((item, index) => {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 15;
    }

    const rowBg = index % 2 === 0 ? 255 : 248;
    doc.setFillColor(rowBg, rowBg, rowBg);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y - 2, pageWidth - margin * 2, 10, 'FD');

    // Status Checkbox
    if (item.passed) {
      doc.setFillColor(16, 185, 129); // Emerald
      doc.roundedRect(margin + 2, y - 0.5, 12, 6, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text('[ PASS ]', margin + 3.2, y + 3.8);
    } else {
      doc.setFillColor(239, 68, 68); // Red
      doc.roundedRect(margin + 2, y - 0.5, 12, 6, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text('[ FAIL ]', margin + 3.4, y + 3.8);
    }

    // Module & Statute
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(item.title, margin + 20, y + 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${item.statuteRef} • ${item.category}`, margin + 20, y + 6);

    // Requirement & Spec
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);
    doc.text(doc.splitTextToSize(item.description, 92), margin + 85, y + 2.5);

    y += 11.5;
  });

  y += 4;
  if (y > pageHeight - 45) {
    doc.addPage();
    y = 20;
  }

  // Certification Seal & Sign-off Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('LEGAL NOTARY & FORENSIC ATTESTATION SIGN-OFF', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'I hereby attest under criminal and civil liability that the aforementioned digital evidence checklist has been executed in full compliance with ISO/IEC 27037 standards, ETDA regulations, and PDPA safeguards.',
    margin + 4,
    y + 9.5,
    { maxWidth: pageWidth - margin * 2 - 8 }
  );

  doc.text(`Lead Signer: ${inspector.name} (${inspector.inspectorId})`, margin + 4, y + 22);
  doc.text(`Authorized Signature: ___________________________`, margin + 105, y + 22);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated by ZYRQUEN Ω∞ Sovereign Operating System • SSoT Block #${SYSTEM_METADATA.sealedBlock} • No Mutation Authorized`,
    margin,
    pageHeight - 8
  );

  // Trigger download
  doc.save('digital_evidence_verification_checklist_v2.pdf');
}
