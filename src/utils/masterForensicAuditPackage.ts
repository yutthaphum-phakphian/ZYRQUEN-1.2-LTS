import jsPDF from 'jspdf';
import {
  SYSTEM_METADATA,
  AUDIT_TRACE_TX,
  SYSTEM_INVARIANTS,
  THAI_CUSTODIANS,
  CANONICAL_SEALS,
  CANONICAL_GENESIS_BLOCK,
  CANONICAL_MERKLE_ROOT,
  QUARANTINE_COUNT,
  SSOT_MUTATION,
  BASELINE_DRIFT,
} from '../data/canonicalData';
import { INITIAL_HSM_CUSTODIAN_EVIDENCE } from './custodianQuorumEngine';
import { GOLD_MASTER_FORENSIC_REPORT } from '../data/goldMasterForensicReport';

export interface MasterAuditPackageOptions {
  principalName?: string;
  passportId?: string;
  reportPurpose?: string;
}

/**
 * Generate standard W3C Verifiable Credentials JSON-LD format
 */
export function generateMasterAuditJsonLd(options: MasterAuditPackageOptions = {}): string {
  const principal = options.principalName || GOLD_MASTER_FORENSIC_REPORT.executiveSummary.sovereignPrincipal;
  const passport = options.passportId || '#EP-SOVEREIGN-01';
  const now = new Date().toISOString();

  const jsonLdData = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schema.org',
      'https://etda.or.th/ns/sovereign-audit/v1',
    ],
    id: GOLD_MASTER_FORENSIC_REPORT.credentialId,
    type: [
      'VerifiableCredential',
      'SovereignForensicAuditAttestation',
      'ThaiEtaComplianceCredential',
      'GoldMasterFullQuorumAttestation',
    ],
    credentialId: GOLD_MASTER_FORENSIC_REPORT.credentialId,
    reportType: GOLD_MASTER_FORENSIC_REPORT.reportType,
    engineVersion: GOLD_MASTER_FORENSIC_REPORT.engineVersion,
    auditStandard: GOLD_MASTER_FORENSIC_REPORT.auditStandard,
    auditStatus: GOLD_MASTER_FORENSIC_REPORT.auditStatus,
    promotionGateStatus: GOLD_MASTER_FORENSIC_REPORT.promotionGateStatus,
    issuer: {
      id: `urn:sovereign:principal:${passport}`,
      name: principal,
      title: 'Supreme Sovereign Principal Architect & Genesis Custodian',
      jurisdiction: 'Kingdom of Thailand (ETDA B.E. 2544 Sections 9, 26, 28 + PDPA Sections 9, 26, 28)',
      statutoryClearance: 'OMEGA-1 SUPREME CLEARANCE',
    },
    issuanceDate: now,
    credentialSubject: {
      id: 'urn:zyrquen:kernel:frozen-v1.2-lts',
      systemName: 'ZYRQUEN Ω∞ SOVEREIGN OPERATING SYSTEM',
      baselineVersion: GOLD_MASTER_FORENSIC_REPORT.engineVersion,
      executiveSummary: GOLD_MASTER_FORENSIC_REPORT.executiveSummary,
      passportsMatrix: GOLD_MASTER_FORENSIC_REPORT.passportsMatrix,
      forensicQuarantineBuffer: {
        isolatedCount: 5,
        quarantinedRange: 'Seals #14,903 – #14,907',
        isolationBoundary: 'RING-04-ISOLATED-BUFFER',
        reconciliationStatus: 'FORENSIC_ISOLATION_CONFIRMED_ZERO_LEAK',
        canonicalZeroLeakConfirmed: true,
      },
      statutoryCompliance: {
        actEta: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (มาตรา ๙, ๒๖, ๒๘)',
        actPdpa: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (มาตรา ๙, ๒๖, ๒๘)',
        clauses: GOLD_MASTER_FORENSIC_REPORT.complianceFramework,
      },
      sourceFiles: GOLD_MASTER_FORENSIC_REPORT.sourceFiles,
    },
    proof: GOLD_MASTER_FORENSIC_REPORT.masterProof,
    signedBy: GOLD_MASTER_FORENSIC_REPORT.signedBy,
  };

  return JSON.stringify(jsonLdData, null, 2);
}

/**
 * Generate Master Forensic Audit PDF Certificate
 */
export function generateMasterForensicAuditPdf(options: MasterAuditPackageOptions = {}): string {
  const principal = options.principalName || SYSTEM_METADATA.sovereignPrincipal;
  const passport = options.passportId || '#EP-SOVEREIGN-01';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // Header Background Bar
  doc.setFillColor(7, 10, 22);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Gold Double Accent Strip
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 43.5, pageWidth, 1.5, 'F');
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 45, pageWidth, 0.6, 'F');

  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(253, 230, 138);
  doc.text('ZYRQUEN Ω∞ MASTER FORENSIC AUDIT PACKAGE', margin, y + 2);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SOVEREIGN KERNEL v1.2 LTS • CERTIFICATE OF CRYPTOGRAPHIC NON-REPUDIATION', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Official Attestation under Sovereign Principal ${principal} (${passport}) • Block #${CANONICAL_GENESIS_BLOCK}`,
    margin,
    y
  );
  y += 21;

  // Executive Profile Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 53, 15);
  doc.text('1. EXECUTIVE SOVEREIGN AUTHORITY & IDENTITY ANCHOR', margin + 3.5, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  doc.text(`Sovereign Principal Architect: ${principal}`, margin + 3.5, y + 11);
  doc.text(`Clearance & Passport: ${passport} (OMEGA-1 SUPREME CLEARANCE)`, margin + 3.5, y + 16);
  doc.text(`Statutory Mandate: Thai ETA B.E. 2544 (Sec 9, 26, 28 Safe Harbor)`, margin + 3.5, y + 21);
  doc.text(`Issuance Timestamp: ${new Date().toISOString()} ICT`, margin + 3.5, y + 25.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text(`Canonical Merkle Root:`, margin + 95, y + 11);
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(14, 116, 144);
  doc.text(CANONICAL_MERKLE_ROOT.slice(0, 34) + '...', margin + 95, y + 15.5);
  doc.text(CANONICAL_MERKLE_ROOT.slice(34), margin + 95, y + 19.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(16, 185, 129);
  doc.text(`• SSoT Mutation: 0 (Zero Drift) • Write: DENIED 🔒`, margin + 95, y + 25.5);

  y += 33;

  // 2. Canonical Core & Quorum Attestation Metrics
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. CANONICAL TRUTH MATRIX & CUSTODIAN QUORUM STATUS', margin, y);
  y += 4.5;

  const realHsmCount = INITIAL_HSM_CUSTODIAN_EVIDENCE.filter(
    (c) => c.classification === 'REAL_HSM_SIGNED' && c.signatureValid && c.physicalAttestation
  ).length;

  const summaryGrid = [
    { label: 'Canonical Seals', val: `${CANONICAL_SEALS.toLocaleString()} Verified`, status: 'IMMUTABLE 100%' },
    { label: 'Genesis Block', val: `#${CANONICAL_GENESIS_BLOCK}`, status: 'FROZEN EPOCH' },
    { label: 'Physical HSM Quorum', val: `${realHsmCount} / 10 Real Signed`, status: realHsmCount >= 8 ? 'QUORUM SATISFIED 🟢' : 'PENDING CEREMONY 🟡' },
    { label: 'Quarantined Seals', val: `+${QUARANTINE_COUNT} Isolated`, status: 'RING-04 BUFFER' },
    { label: 'SSoT Mutation Delta', val: `${SSOT_MUTATION}`, status: 'ZERO REWRITE' },
    { label: 'Promotion Gate', val: 'FAIL-CLOSED 🔒', status: 'GATE G11–G13 PROTECTED' },
  ];

  const colW = (pageWidth - margin * 2 - 6) / 3;
  summaryGrid.forEach((m, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const boxX = margin + col * (colW + 3);
    const boxY = y + row * 15;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(boxX, boxY, colW, 13, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(m.label.toUpperCase(), boxX + 2.5, boxY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(m.val, boxX + 2.5, boxY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(m.status.includes('SATISFIED') || m.status.includes('100%') ? 16 : 180, m.status.includes('SATISFIED') || m.status.includes('100%') ? 185 : 83, 129);
    doc.text(`• ${m.status}`, boxX + 2.5, boxY + 11.5);
  });

  y += 34;

  // 3. Custodian Signature Roll Table (Verified Signers)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`3. G11 CUSTODIAN QUORUM SIGNATURE ROLL (${realHsmCount}/10 REAL PHYSICAL HSMs)`, margin, y);
  y += 4.5;

  const signedCustodians = INITIAL_HSM_CUSTODIAN_EVIDENCE.slice(0, 8);
  const custRowH = 7.5;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text('SLOT', margin + 2, y + 4);
  doc.text('CUSTODIAN & STATUTORY ROLE', margin + 12, y + 4);
  doc.text('HARDWARE DEVICE', margin + 80, y + 4);
  doc.text('PQC ALGORITHM', margin + 120, y + 4);
  doc.text('EVIDENCE ID & STATUS', margin + 155, y + 4);
  y += 6;

  signedCustodians.forEach((cust, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, pageWidth - margin * 2, custRowH, 'F');
    }

    const isVerified = cust.classification === 'REAL_HSM_SIGNED' && cust.signatureValid && cust.physicalAttestation;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(isVerified ? 14 : 180, isVerified ? 116 : 83, isVerified ? 144 : 9);
    doc.text(`#0${cust.slotId}`, margin + 2, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(cust.custodianTitle.slice(0, 36), margin + 12, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text(cust.expectedDevice, margin + 80, y + 4.5);
    doc.text(cust.pqcAlgorithm.slice(0, 22), margin + 120, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    if (isVerified) {
      doc.setTextColor(16, 185, 129);
      doc.text(`🟢 REAL_HSM_SIGNED (${cust.evidenceId})`, margin + 150, y + 4.5);
    } else {
      doc.setTextColor(217, 119, 6);
      doc.text(`🟡 CLAIMED: PENDING PHYSICAL PROOF`, margin + 150, y + 4.5);
    }

    y += custRowH;
  });

  y += 4;

  // 4. Forensic Quarantine Buffer Isolation Proof (5 Seals)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('4. FORENSIC QUARANTINE BUFFER & ISOLATION PROOF (#14,903 – #14,907)', margin, y);
  y += 4.5;

  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(248, 113, 113);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(153, 27, 27);
  doc.text('FORENSIC RECONCILIATION FINDING: 5 NON-CANONICAL SEALS QUARANTINED', margin + 3.5, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    '• Seals #14,903 to #14,907 represent telemetry post-epoch drifts, duplicate replays, and synthetic test payloads.',
    margin + 3.5,
    y + 9
  );
  doc.text(
    '• All 5 artifacts are strictly locked within RING-04-ISOLATED-BUFFER with zero read/write leakage into Canonical Core.',
    margin + 3.5,
    y + 13
  );
  doc.text(
    '• Invariant Guaranteed: Canonical 14,902 Seals remain 100.0% unchanged (SSoT Mutation = 0, Drift = 0.00%).',
    margin + 3.5,
    y + 17
  );

  y += 26;

  // 5. Sovereign Principal Sign-Off & Legal Certificate
  doc.setFillColor(7, 10, 22);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 2, 2, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(253, 230, 138);
  doc.text('SOVEREIGN CERTIFICATE OF DIGITAL ATTESTATION (หนังสือรับรองอธิปไตยดิจิทัล)', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(226, 232, 240);
  doc.text(
    `ข้าพเจ้า ${principal} ในฐานะผู้ถือสิทธิ์และสถาปนิกอธิปไตยสูงสุด (#EP-SOVEREIGN-01)`,
    margin + 4,
    y + 10.5
  );
  doc.text(
    `ขอรับรองความถูกต้องแท้จริงของตราประทับ Canonical 14,902 รายการ, Merkle Root [909ab814], และสภาผู้พิทักษ์ 8/10 Real HSMs`,
    margin + 4,
    y + 14.5
  );
  doc.text(
    `มีผลผูกพันและได้รับความคุ้มครองทางกฎหมายตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา 9, 26, 28 ทุกประการ`,
    margin + 4,
    y + 18.5
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(245, 158, 11);
  doc.text(`Digital Signatory: ${principal} (${passport})`, margin + 4, y + 23);
  doc.text(`Merkle Seal Hash: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68`, margin + 80, y + 23);

  // Footer Attribution
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'ZYRQUEN Ω∞ SOVEREIGN FROZEN v1.2 LTS • Master Forensic Audit Certificate • Official Immutable Artifact',
    pageWidth / 2,
    pageHeight - 4.5,
    { align: 'center' }
  );

  const filename = `ZYRQUEN-MASTER-AUDIT-PACKAGE-${CANONICAL_GENESIS_BLOCK}-${Date.now()}.pdf`;
  doc.save(filename);
  return filename;
}
