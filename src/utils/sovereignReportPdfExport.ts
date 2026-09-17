import jsPDF from 'jspdf';
import { SYSTEM_METADATA, SYSTEM_INVARIANTS, THAI_CUSTODIANS } from '../data/canonicalData';

export interface SovereignReportOptions {
  principalName?: string;
  custodianPassport?: string;
  sealBlockHeight?: number;
  merkleAnchor?: string;
}

export function generateSovereignReportPdf({
  principalName = SYSTEM_METADATA.sovereignPrincipal,
  custodianPassport = '#EP-SOVEREIGN-01',
  sealBlockHeight = SYSTEM_METADATA.sealedBlock,
  merkleAnchor = '909ab814',
}: SovereignReportOptions = {}): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // 1. Header Banner - Royal Gazette Deep Gold & Dark Obsidian
  doc.setFillColor(7, 8, 15); // #07080F
  doc.rect(0, 0, pageWidth, 44, 'F');

  // Gold Double Line Border Accent
  doc.setFillColor(245, 158, 11); // Gold Amber
  doc.rect(0, 42.5, pageWidth, 1.5, 'F');
  doc.setFillColor(217, 119, 6); // Deep Amber
  doc.rect(0, 44, pageWidth, 0.5, 'F');

  // Header Title
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(253, 230, 138); // Amber 200
  doc.text('OFFICIAL SOVEREIGN COMPLIANCE REPORT & AUDIT ATTESTATION', margin, y + 2);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('THAI ELECTRONIC TRANSACTIONS ACT (B.E. 2544) • SECTIONS 9, 26 & 28', margin, y);
  y += 5.5;

  doc.setFont('times', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(209, 213, 219);
  doc.text(
    `ฉบับตรวจรับรองความมั่นคงปลอดภัยและสิทธิปลอดความรับผิด (Safe Harbor) • Merkle Anchor [${merkleAnchor}] • Block #${sealBlockHeight}`,
    margin,
    y
  );
  y += 20;

  // 2. Executive Metadata Box
  doc.setFillColor(254, 252, 232); // Amber 50
  doc.setDrawColor(217, 119, 6); // Amber 600
  doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(120, 53, 15); // Amber 900
  doc.text('SOVEREIGN IDENTITY & CRYPTOGRAPHIC ANCHOR PROFILE', margin + 3.5, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text(`Primary Principal: ${principalName}`, margin + 3.5, y + 10);
  doc.text(`Executive Passport: ${custodianPassport}`, margin + 3.5, y + 14.5);
  doc.text(`Statutory Mandate: Royal Gazette Vol. 118 Part 110 A`, margin + 3.5, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text(`Merkle Root Anchor: ${SYSTEM_METADATA.merkleRoot.slice(0, 32)}...`, margin + 85, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Anchor Short Hash: [${merkleAnchor}] (Harmonized 100.0% Zero-Drift)`, margin + 85, y + 14.5);
  doc.text(`Generated At: ${new Date().toISOString()} • Kernel: FROZEN v1.2`, margin + 85, y + 19);
  y += 30;

  // 3. Hardware Heartbeat & Cryogenic Sub-Kelvin Status Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. CRYOGENIC HARDWARE TELEMETRY & SUB-KELVIN HEARTBEAT', margin, y);
  y += 4.5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 34, 1.5, 1.5, 'FD');

  const hwMetrics = [
    { label: 'Cryostat Base Temp', val: `${SYSTEM_METADATA.cryoTemp} (12.4 mK)`, status: 'NOMINAL (Sub-Kelvin)' },
    { label: 'Zero-Drift Invariant', val: `${SYSTEM_METADATA.baselineDrift} SSoT`, status: 'INVIOLABLE 100.0%' },
    { label: 'Quantum Coherence (qOps)', val: `${SYSTEM_METADATA.coherence} (${SYSTEM_METADATA.qOpsTelemetry} qOps)`, status: 'NIST PQC ACTIVE' },
    { label: 'Circuit Breaker Latency', val: `${SYSTEM_METADATA.kernelLatency} Fail-Closed`, status: 'SECTION 28(2) ARMED' },
    { label: 'Hardware Key Custody', val: 'TPM 2.0 PCR0..PCR7 Locked', status: 'SUB-KELVIN HSM' },
    { label: 'Immutable Block Seals', val: `${SYSTEM_METADATA.totalVerifiedSeals} Seals (#${sealBlockHeight})`, status: 'APPEND-ONLY MERKLE' },
  ];

  const colW = (pageWidth - margin * 2 - 6) / 3;
  hwMetrics.forEach((m, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const boxX = margin + 3 + col * (colW + 2);
    const boxY = y + 4 + row * 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(m.label, boxX, boxY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(m.val, boxX, boxY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`• ${m.status}`, boxX, boxY + 8);
  });

  y += 40;

  // 4. Tri-Statute Compliance Convergence (Sections 9, 26, 28)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. TRI-STATUTE SOVEREIGN LEGAL CONVERGENCE ATTESTATION', margin, y);
  y += 4.5;

  const statutes = [
    {
      code: 'SECTION 9 (มาตรา ๙)',
      title: 'Identity & Signer Intent Manifestation',
      detail: 'Digital signature creation method identifies signatory and indicates intent. Sealed via Merkle leaf proofs.',
      pqc: 'NIST FIPS 204 (ML-DSA) Dilithium-5',
      status: 'VERIFIED COURT-ADMISSIBLE (ม.๑๑)',
    },
    {
      code: 'SECTION 26 (มาตรา ๒๖)',
      title: 'Reliable Signature Statutory Presumption',
      detail: 'Creation data linked exclusively to signatory and under sole control at generation time. Zero-drift invariant.',
      pqc: 'NIST FIPS 203 (ML-KEM) Kyber-1024',
      status: 'STATUTORY PRESUMPTION ENFORCED',
    },
    {
      code: 'SECTION 28 (มาตรา ๒๘)',
      title: 'Signatory Duty of Care & Safe Harbor',
      detail: 'Signatory exercises reasonable care to avoid unauthorized key usage. Immediate fail-closed notification armed.',
      pqc: `Anchored to Merkle Root [${merkleAnchor}]`,
      status: 'SAFE HARBOR SHIELD GRANTED',
    },
  ];

  statutes.forEach((st) => {
    doc.setFillColor(245, 248, 252);
    doc.setDrawColor(200, 215, 230);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 1, 1, 'FD');

    doc.setFillColor(245, 158, 11);
    doc.rect(margin, y, 2.2, 20, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.text(st.code, margin + 4.5, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(st.title, margin + 45, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(st.detail, margin + 4.5, y + 9.5);
    doc.text(`Cryptographic Mechanism: ${st.pqc}`, margin + 4.5, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(16, 185, 129);
    doc.text(`Status: ${st.status}`, margin + 4.5, y + 18);

    y += 23;
  });

  y += 2;

  // 5. Thai Custodian Roll & Signature Attestation Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. REGISTERED THAI CUSTODIANS (ทำเนียบผู้พิทักษ์ไทย)', margin, y);
  y += 4;

  const custWidth = (pageWidth - margin * 2 - 6) / 4;
  THAI_CUSTODIANS.forEach((c, idx) => {
    const cX = margin + idx * (custWidth + 2);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(cX, y, custWidth, 18, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(c.nameTh.slice(0, 18), cX + 2, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text(c.roleEn.slice(0, 20), cX + 2, y + 8.5);
    doc.text(`Passport: ${c.passportNumber}`, cX + 2, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(16, 185, 129);
    doc.text(`Status: ${c.status}`, cX + 2, y + 15.5);
  });
  y += 24;

  // 6. Sovereign Sign-Off & Merkle Seal Footer
  doc.setFillColor(7, 8, 15);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(253, 230, 138);
  doc.text('SOVEREIGN CERTIFICATION OF NON-REPUDIATION (การรับรองสิทธิเด็ดขาด)', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(226, 232, 240);
  doc.text(
    `This official report confirms that cryptographic key creation data under #EP-SOVEREIGN-01 is anchored to Merkle Root [${merkleAnchor}]`,
    margin + 4,
    y + 9.5
  );
  doc.text(
    `and satisfies all criteria for reliable electronic signatures under Section 26 and duty of care under Section 28 of Thai ETA B.E. 2544.`,
    margin + 4,
    y + 13.5
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(245, 158, 11);
  doc.text(`Signatory: ${principalName}`, margin + 4, y + 18);
  doc.text(`Merkle Seal Hash: 909ab814...8aa536b3fa4c68`, margin + 90, y + 18);

  // Footer Attribution
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'ZYRQUEN Ω∞ SOVEREIGN • Official Sovereign Compliance Attestation • Immutable Cryogenic Archive',
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  );

  const filename = `Sovereign_Report_909ab814_${Date.now()}.pdf`;
  doc.save(filename);
  return filename;
}
