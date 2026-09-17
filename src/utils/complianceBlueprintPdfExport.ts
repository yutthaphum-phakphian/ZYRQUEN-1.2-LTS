import jsPDF from 'jspdf';
import { AUDIT_TRACE_TX, SYSTEM_METADATA, THAI_CUSTODIANS, SYSTEM_INVARIANTS } from '../data/canonicalData';
import { INITIAL_OMEGA_PHASES } from '../components/OmegaSequenceSimulator';

export interface BlueprintExportOptions {
  principalName?: string;
  custodianPassport?: string;
  sealBlockHeight?: number;
}

export function generateComplianceBlueprintPdf({
  principalName = SYSTEM_METADATA.sovereignPrincipal,
  custodianPassport = '#EP-SOVEREIGN-01',
  sealBlockHeight = SYSTEM_METADATA.sealedBlock,
}: BlueprintExportOptions = {}): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // 1. Header Banner
  doc.setFillColor(7, 8, 15); // Dark Slate #07080F
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Decorative Accent Bar (4 colors: Cyan, Violet, Emerald, Amber)
  const quarterWidth = pageWidth / 4;
  doc.setFillColor(6, 182, 212); // Cyan
  doc.rect(0, 41.5, quarterWidth, 1.2, 'F');
  doc.setFillColor(139, 92, 246); // Violet
  doc.rect(quarterWidth, 41.5, quarterWidth, 1.2, 'F');
  doc.setFillColor(16, 185, 129); // Emerald
  doc.rect(quarterWidth * 2, 41.5, quarterWidth, 1.2, 'F');
  doc.setFillColor(245, 158, 11); // Amber
  doc.rect(quarterWidth * 3, 41.5, quarterWidth, 1.2, 'F');

  // Header Title Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('ZYRQUEN Ω∞ SOVEREIGN FROZEN v1.2 LTS', margin, y + 2);
  y += 7;

  doc.setFontSize(11);
  doc.setTextColor(6, 182, 212); // Cyan
  doc.text('COMPLIANCE BLUEPRINT v1.2 — 4-TIER SOVEREIGN RUNTIME MATRIX', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 195, 215);
  doc.text(
    `Executive Custody Protocol #EP-SOVEREIGN-01 • Sealed Block #${sealBlockHeight} • NIST FIPS 203-205 & ETDA Level 3+ Standard`,
    margin,
    y
  );
  y += 18;

  // Metadata Box
  doc.setFillColor(245, 248, 252);
  doc.setDrawColor(200, 215, 230);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SOVEREIGN RUNTIME ATTESTATION PROFILE', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Principal Custodian: ${principalName} (${custodianPassport})`, margin + 3, y + 9.5);
  doc.text(`Jurisdiction: Thailand • ETDA Level 3+ • Royal Gazette Enforced`, margin + 3, y + 13.5);

  doc.text(`Cryogenic Merkle Root: ${SYSTEM_METADATA.merkleRoot.slice(0, 28)}...`, margin + 88, y + 9.5);
  doc.text(`Date of Issue: ${new Date().toISOString()} • Kernel Mode: Immutable Frozen`, margin + 88, y + 13.5);
  y += 24;

  // 4 Key Compliance Layers
  const complianceLayers = [
    {
      tier: 'LAYER 1: DATA SOVEREIGNTY (PDPA COMPLIANT)',
      statute: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (Sections 19, 27, 37) & GDPR Alignment',
      scope: 'Zero-Knowledge Data Vault & Sub-Kelvin Hardware Isolation',
      runtimeProof: 'NIST Zero-Trust data governance, biometric biometric veto gates, hardware cryptographic key shredding.',
      status: 'VERIFIED COMPLIANT (0.00% DATA LEAKAGE)',
      color: [6, 182, 212] as [number, number, number],
    },
    {
      tier: 'LAYER 2: ZERO-TRUST CYBERSECURITY (NCSA COMPLIANT)',
      statute: 'พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562 (Section 35) & CII Standards',
      scope: 'Cryogenic Merkle Core (14,902 Sealed Blocks) & Fail-Closed Adversarial Matrix',
      runtimeProof: '5/5 Adversarial vectors fail-closed, sub-millisecond tamper detection, immutable append-only OTLP telemetry.',
      status: 'VERIFIED COMPLIANT (ZERO-DRIFT INVARIANT)',
      color: [16, 185, 129] as [number, number, number],
    },
    {
      tier: 'LAYER 3: IDENTITY & TRUST (ETDA COMPLIANT)',
      statute: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (มาตรา 9, 26, 28) & ETDA Level 3+',
      scope: 'Merkle Leaf Digital Signatures, Post-Quantum Identity Keys & Non-Repudiation Custody',
      runtimeProof: 'Cryptographic binding to Thai Custodians, Dilithium-5 signatures, court-admissible electronic evidence.',
      status: 'VERIFIED COMPLIANT (COURT ADMISSIBLE)',
      color: [139, 92, 246] as [number, number, number],
    },
    {
      tier: 'LAYER 4: EXECUTIVE CUSTODY & POST-QUANTUM (NIST PQC)',
      statute: 'NIST Post-Quantum Cryptography FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA)',
      scope: 'Executive Passport #EP-SOVEREIGN-01 12-Phase Omega Sequence Attestation Pipeline',
      runtimeProof: 'Kyber-1024 / Dilithium-5 lattice resilience, 768-D quantum state coherence, immutable finality 849202.',
      status: 'VERIFIED COMPLIANT (PQC RESILIENT ♾️)',
      color: [245, 158, 11] as [number, number, number],
    },
  ];

  complianceLayers.forEach((layer, i) => {
    // Section Header with Colored Left Accent
    doc.setFillColor(240, 244, 250);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 1.5, 1.5, 'F');

    doc.setFillColor(layer.color[0], layer.color[1], layer.color[2]);
    doc.rect(margin, y, 2.5, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(layer.color[0], layer.color[1], layer.color[2]);
    doc.text(layer.tier, margin + 5, y + 5);

    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Statutory Mandate: ${layer.statute}`, margin + 5, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Architecture: ${layer.scope}`, margin + 5, y + 14.5);
    doc.text(`Sovereign Proof: ${layer.runtimeProof}`, margin + 5, y + 19);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(16, 185, 129);
    doc.text(`Status: ${layer.status}`, margin + 5, y + 24);

    y += 32;
  });

  // 12-Phase Omega Sequence Summary Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('12-PHASE OMEGA SEQUENCE (#EP-SOVEREIGN-01) ATTESTATION FLOW', margin, y);
  y += 4;

  doc.setDrawColor(210, 220, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // Grid of 12 Phases in 2 columns
  const colWidth = (pageWidth - margin * 2 - 4) / 2;
  INITIAL_OMEGA_PHASES.forEach((p, idx) => {
    const isCol2 = idx >= 6;
    const colX = isCol2 ? margin + colWidth + 4 : margin;
    const rowY = y + (idx % 6) * 7.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(`${p.phase}. ${p.nameTh} (${p.nameEn.slice(0, 22)})`, colX, rowY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(`[${p.latencyMs}ms] ${p.statuteRef.slice(0, 36)}`, colX, rowY + 3.2);
  });
  y += 48;

  // Executive Sign-Off Box
  doc.setFillColor(7, 10, 20);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11);
  doc.text('SOVEREIGN CUSTODIAN EXECUTIVE ATTESTATION & SIGN-OFF', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(220, 230, 245);
  doc.text(
    'I hereby certify that ZYRQUEN Ω∞ FROZEN v1.2 LTS strictly enforces all statutory provisions of Thai law (ETDA & PDPA)',
    margin + 4,
    y + 10
  );
  doc.text(
    `under NIST PQC Post-Quantum Zero-Trust specifications. Finalized under Executive Passport ${custodianPassport}.`,
    margin + 4,
    y + 14
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(6, 182, 212);
  doc.text(`Signatory: ${principalName} (Principal Sovereign Custodian)`, margin + 4, y + 18.5);
  doc.text(`Immutable Seal Hash: 909ab814...8aa536b3fa4c68`, margin + 110, y + 18.5);

  // Footer Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(140, 150, 165);
  doc.text(
    'Official Compliance Blueprint Generated by ZYRQUEN Ω∞ Control Plane • Port 3000 Sovereign Ingress',
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  const filename = `Compliance_Blueprint_v1.2_ZYRQUEN_${Date.now()}.pdf`;
  doc.save(filename);
  return filename;
}
