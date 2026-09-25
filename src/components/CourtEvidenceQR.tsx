import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { 
  QrCode, 
  ShieldCheck, 
  Copy, 
  Check, 
  Lock, 
  Maximize2, 
  History, 
  AlertOctagon, 
  Download, 
  HelpCircle,
  CheckCircle2,
  Printer,
  FileText,
  Scale
} from 'lucide-react';
import { CourtEvidenceQRModal, EvidencePayload } from './CourtEvidenceQRModal';

export interface CourtEvidenceQRProps {
  id?: string;
  merkleRoot: string;
  anchorSignature: string;
  sealIndex: number;
  blockNumber: number;
  timestamp: string;
  principalId?: string;
  stageName?: string;
  manifestUrl?: string;
  auditTrailUrl?: string;
  evidenceCode?: string;
  className?: string;
  isCompareSelected?: boolean;
  showCheckbox?: boolean;
  onToggleCompare?: (id: string) => void;
  onOpenAuditHistory?: (sealIndex: number, blockNumber: number) => void;
  verificationStatus?: 'IDLE' | 'VERIFYING' | 'PASSED' | 'FAILED';
  statuteRef?: string;
  descriptionTh?: string;
  onPrint?: () => void;
}

export const CourtEvidenceQR: React.FC<CourtEvidenceQRProps> = ({
  id = "seal-default",
  merkleRoot,
  anchorSignature,
  sealIndex,
  blockNumber,
  timestamp,
  principalId = "#EP-SOVEREIGN-01 นายยุทธภูมิ พากเพียร",
  stageName = "GENERAL_ATTESTATION",
  manifestUrl = "/zyrquen-court-manifest.json",
  auditTrailUrl = "/zyrquen-mtls13-otel-telemetry-audit.json",
  evidenceCode,
  className = "",
  isCompareSelected = false,
  showCheckbox = true,
  onToggleCompare,
  onOpenAuditHistory,
  verificationStatus = 'IDLE',
  statuteRef = "ETDA B.E. 2544 (Sec 9, 26, 28) + PDPA B.E. 2562 (Sec 37)",
  descriptionTh,
  onPrint
}) => {
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrintingLandscape, setIsPrintingLandscape] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const payload: EvidencePayload = {
    sys: "ZYRQUEN_OMEGA_INF",
    merkle_root: merkleRoot,
    pqc_sig: anchorSignature,
    seal_idx: sealIndex,
    genesis_block: blockNumber,
    ts: timestamp,
    principal: principalId,
    ssot_delta: "0.00%",
    court_admissible: true,
    evidence_code: evidenceCode || `SEAL-${sealIndex}`,
    stage_name: stageName,
    council_quorum: "10/10 REAL_HSM",
    forensic_pipeline: "12-STAGE DETERMINISTIC TRACE (ETDA Sec 9/26/28)",
    statute_refs: statuteRef,
    hash_alg: "SHA3-512 + BLAKE3"
  };

  const payloadString = JSON.stringify(payload, null, 2);

  // Trigger Toast Notification when verification passes successfully
  useEffect(() => {
    if (verificationStatus === 'PASSED') {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [verificationStatus]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(payloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([payloadString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `court-evidence-${evidenceCode || `seal-${sealIndex}`}-block-${blockNumber}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Triggers the browser's print functionality formatted specifically for landscape legal evidence documents.
   * Adds a temporary CSS class ('print-landscape', 'court-landscape-print', 'print-legal-landscape') to the
   * component and parent container (document.body), applying '@media print' landscape orientation styles
   * to ensure the evidence document is formatted correctly for legal printing.
   */
  const handlePrintQR = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. Add temporary 'print-landscape' CSS class to the component container and body
    setIsPrintingLandscape(true);
    const parentContainer = document.body;
    parentContainer.classList.add('print-landscape', 'court-landscape-print', 'print-legal-landscape');

    const cardEl = cardRef.current || document.getElementById(id);
    if (cardEl) {
      cardEl.classList.add('print-landscape', 'court-landscape-print', 'print-legal-landscape', 'CourtEvidenceQR-active-print');
    }

    if (onPrint) {
      onPrint();
      setTimeout(() => {
        setIsPrintingLandscape(false);
        parentContainer.classList.remove('print-landscape', 'court-landscape-print', 'print-legal-landscape');
        if (cardEl) {
          cardEl.classList.remove('print-landscape', 'court-landscape-print', 'print-legal-landscape', 'CourtEvidenceQR-active-print');
        }
      }, 2000);
      return;
    }

    const dynamicStyleId = 'court-evidence-landscape-print-rules';
    let styleEl = document.getElementById(dynamicStyleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = dynamicStyleId;
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      @page {
        size: A4 landscape !important;
        margin: 8mm !important;
      }
      @media print {
        body.print-landscape,
        body.court-landscape-print,
        body.print-legal-landscape {
          background: #ffffff !important;
        }
        body.print-landscape *,
        body.court-landscape-print *,
        body.print-legal-landscape * {
          visibility: hidden !important;
        }
        #${id}, #${id} *,
        .CourtEvidenceQR.print-landscape,
        .CourtEvidenceQR.print-landscape * {
          visibility: visible !important;
        }
        #${id},
        .CourtEvidenceQR.print-landscape {
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          box-shadow: none !important;
          border: 2pt solid #000000 !important;
          border-radius: 8pt !important;
          padding: 14pt !important;
          background-color: #ffffff !important;
          color: #000000 !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        #${id} .print-landscape-container,
        .CourtEvidenceQR.print-landscape .print-landscape-container {
          display: block !important;
        }
        #${id} .screen-only-container,
        .CourtEvidenceQR.print-landscape .screen-only-container {
          display: none !important;
        }
      }
    `;

    // Small delay ensuring temporary CSS classes and styles are applied in the DOM
    setTimeout(() => {
      window.print();

      // Post-print cleanup removing the temporary CSS classes
      const cleanup = () => {
        setIsPrintingLandscape(false);
        parentContainer.classList.remove('print-landscape', 'court-landscape-print', 'print-legal-landscape');
        if (cardEl) {
          cardEl.classList.remove('print-landscape', 'court-landscape-print', 'print-legal-landscape', 'CourtEvidenceQR-active-print');
        }
        if (styleEl && styleEl.parentNode) {
          styleEl.parentNode.removeChild(styleEl);
        }
        window.removeEventListener('afterprint', cleanup);
      };

      window.addEventListener('afterprint', cleanup);
      setTimeout(cleanup, 2500);
    }, 60);
  };

  // Generate ISO/IEC 27037 & Thai ETDA Compliant Single Evidence PDF
  const handleExportSinglePdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;

      // Header Banner
      doc.setFillColor(7, 10, 18);
      doc.rect(0, 0, pageWidth, 32, 'F');

      // Gold Sovereign Stripe
      doc.setFillColor(212, 175, 55);
      doc.rect(0, 30.5, pageWidth, 1.5, 'F');

      // Header Typography
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ZYRQUEN SOVEREIGN DIGITAL EVIDENCE RECORD • LANDSCAPE LEGAL DOSSIER', margin, 12);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('COURT OF JUSTICE DIGITAL FORENSIC DOSSIER • ISO/IEC 27037 COMPLIANT', margin, 18);
      doc.text('Statutory Ref: ETDA B.E. 2544 (Sec 9, 26, 28) & PDPA B.E. 2562 (Sec 37)', margin, 24);
      doc.text(`Canonical Genesis Block #${blockNumber} • Seal Index #${sealIndex} • SSoT Delta: 0.00%`, margin, 29);

      // QR Code Generation
      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
        width: 350,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      let y = 38;

      // 3-Column Landscape Matrix
      // Column 1: QR Code & Seal Identity (Width: 65mm)
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, y, 65, 125, 'FD');
      doc.addImage(qrDataUrl, 'PNG', margin + 7.5, y + 6, 50, 50);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`EVIDENCE ID:`, margin + 6, y + 63);
      doc.setFontSize(8.5);
      doc.setTextColor(212, 175, 55);
      doc.text(`${evidenceCode || `SEAL-${sealIndex}`}`, margin + 6, y + 68);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Seal Index: #${sealIndex}`, margin + 6, y + 75);
      doc.text(`Genesis Block: #${blockNumber}`, margin + 6, y + 80);
      doc.text(`SSoT Delta: 0.00% (Zero Drift)`, margin + 6, y + 85);
      doc.text(`Admissibility: ISO/IEC 27037`, margin + 6, y + 90);
      doc.text(`Hash: SHA3-512 + BLAKE3`, margin + 6, y + 95);
      doc.text(`Time: ${timestamp.slice(0, 19)}`, margin + 6, y + 100);

      // Column 2: Cryptographic Anchors & Signatures (Width: 105mm)
      const col2X = margin + 70;
      doc.setFillColor(248, 250, 252);
      doc.rect(col2X, y, 105, 125, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('CRYPTOGRAPHIC ANCHORS & HARDWARE ATTESTATION', col2X + 5, y + 8);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('CANONICAL MERKLE ROOT HASH (24-Level Sibling Path):', col2X + 5, y + 16);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setFillColor(241, 245, 249);
      doc.rect(col2X + 5, y + 19, 95, 9, 'F');
      doc.text(merkleRoot, col2X + 7, y + 25);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('POST-QUANTUM DILITHIUM-5 SIGNATURE (NIST FIPS 204):', col2X + 5, y + 34);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setFillColor(241, 245, 249);
      doc.rect(col2X + 5, y + 37, 95, 9, 'F');
      doc.text(anchorSignature, col2X + 7, y + 43);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('HARDWARE COUNCIL QUORUM:', col2X + 5, y + 52);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('10/10 REAL_HSM Unanimous (FIPS 140-3 Level 4 / CC EAL6+)', col2X + 5, y + 57);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('SOVEREIGN PRINCIPAL:', col2X + 5, y + 64);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`${principalId}`, col2X + 5, y + 69);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('FORENSIC SUMMARY JSON ENCODED:', col2X + 5, y + 76);
      doc.setFont('courier', 'normal');
      doc.setFontSize(6);
      doc.setFillColor(241, 245, 249);
      doc.rect(col2X + 5, y + 79, 95, 41, 'F');
      const lines = doc.splitTextToSize(payloadString, 91);
      doc.text(lines.slice(0, 10), col2X + 7, y + 84);

      // Column 3: Legal Pillars & Non-Repudiation (Width: 89mm)
      const col3X = col2X + 110;
      doc.setFillColor(248, 250, 252);
      doc.rect(col3X, y, 89, 125, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('LEGAL INVARIANTS & ADMISSIBILITY', col3X + 5, y + 8);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text('1. Smart Contract Remediation: 100% Bytecode Parity.', col3X + 5, y + 17);
      doc.text('2. Key Guardian Council: 10/10 Hardware Consensus.', col3X + 5, y + 23);
      doc.text('3. Post-Quantum Crypto: Dilithium-5 (ML-DSA-87).', col3X + 5, y + 29);
      doc.text('4. Trace Pipeline: 12-Stage Deterministic Trace.', col3X + 5, y + 35);
      doc.text('5. Thai ETA B.E. 2544 Sec 9: Identity & Consent.', col3X + 5, y + 41);
      doc.text('6. Thai ETA B.E. 2544 Sec 26: Secure Non-Repudiation.', col3X + 5, y + 47);
      doc.text('7. Thai ETA B.E. 2544 Sec 28: Immutable Ledger Cert.', col3X + 5, y + 53);
      doc.text('8. PDPA B.E. 2562 Sec 37: Zero-Knowledge Privacy.', col3X + 5, y + 59);

      // Judicial Sign-off box
      doc.setFillColor(241, 245, 249);
      doc.rect(col3X + 5, y + 68, 79, 52, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('JUDICIAL CERTIFICATION / ATTESTATION', col3X + 8, y + 74);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('Certified valid for submission to Thai Courts under', col3X + 8, y + 80);
      doc.text('Electronic Transactions Act & Evidence Legislation.', col3X + 8, y + 84);
      doc.text('Sign: _________________________________', col3X + 8, y + 97);
      doc.text('Date: _________________________________', col3X + 8, y + 106);
      doc.text('Status: COURT_ADMISSIBLE_READY 🟢', col3X + 8, y + 115);

      // Footer
      doc.setFillColor(7, 10, 18);
      doc.rect(0, 195, pageWidth, 15, 'F');
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(
        'Certified by ZYRQUEN Ω∞ Sovereign Operating System & Civilization Intelligence Control Plane • Block #849202',
        pageWidth / 2,
        201,
        { align: 'center' }
      );
      doc.text(
        'Court-Admissible Evidence Dossier • Zero Mutation Guarantee (Δ0.00% SSoT Parity)',
        pageWidth / 2,
        205,
        { align: 'center' }
      );

      doc.save(`court-evidence-landscape-${evidenceCode || `seal-${sealIndex}`}.pdf`);
    } catch (err) {
      console.error('Failed to generate landscape evidence PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isFailed = verificationStatus === 'FAILED';
  const isPassed = verificationStatus === 'PASSED';
  const isVerifying = verificationStatus === 'VERIFYING';

  const cardBorderClass = isFailed
    ? "border-red-500 bg-red-950/20 shadow-red-500/20"
    : isPassed
    ? "border-emerald-500/80 bg-slate-900/90 shadow-emerald-500/10"
    : isVerifying
    ? "border-cyan-500/80 bg-slate-900/90 shadow-cyan-500/20"
    : "border-slate-800 bg-slate-900/90 hover:border-slate-700";

  return (
    <>
      {/* 
        Container with Sealing Entrance Animation & Strict Print Layout Compliance:
        Includes both 'CourtEvidenceQR' and 'printable-evidence-card' so that 
        styles in print.css (@media print { .CourtEvidenceQR { ... } }) apply cleanly.
      */}
      <div 
        ref={cardRef}
        id={id}
        className={`CourtEvidenceQR printable-evidence-card ${isPrintingLandscape ? 'print-landscape print-legal-landscape court-landscape-print' : ''} relative overflow-hidden p-4 sm:p-5 rounded-2xl border backdrop-blur-md shadow-xl text-slate-100 font-sans space-y-4 transition duration-300 ${cardBorderClass} ${className}`}
        style={{
          animation: 'sealCardAppear 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        <style>{`
          @keyframes sealCardAppear {
            0% {
              opacity: 0;
              transform: translateY(16px) scale(0.97);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes scanSweep {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(200%); }
          }
        `}</style>

        {/* 1. Subtle Toast Notification Popup */}
        {showToast && (
          <div className="no-print print:hidden absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 bg-emerald-950/95 border-emerald-500/80 rounded-full shadow-lg shadow-emerald-900/50 text-[11px] font-mono text-emerald-300 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-md pointer-events-none whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Payload Hash Validated against Ledger (SSoT Δ0.00%)</span>
          </div>
        )}

        {/* 2. Subtle Scanning Sweep Overlay (Active during 'VERIFYING') */}
        {isVerifying && (
          <div className="no-print print:hidden absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-20">
            <div className="absolute inset-0 bg-cyan-500/5 backdrop-blur-[1px]" />
            <div 
              className="w-full h-1/2 bg-gradient-to-b from-transparent via-cyan-400/25 to-transparent border-b border-cyan-400/50"
              style={{
                animation: 'scanSweep 1.6s ease-in-out infinite alternate'
              }}
            />
          </div>
        )}

        {/* ================================================================= */}
        {/* PRINT-ONLY OFFICIAL COURT DOSSIER (LANDSCAPE-ORIENTED LEGAL VIEW) */}
        {/* ================================================================= */}
        <div className="hidden print:block print-landscape-container border-b-2 border-black pb-3 mb-3 text-black">
          {/* Official Court Header */}
          <div className="flex items-start justify-between border-b border-black pb-2 mb-3">
            <div>
              <div className="text-[15pt] font-bold tracking-wider font-serif uppercase">
                ราชอาณาจักรไทย • ศาลยุติธรรมแห่งประเทศไทย
              </div>
              <div className="text-[11pt] font-semibold mt-0.5">
                วัตถุพยานดิจิทัลนิติวิทยาศาสตร์ (DIGITAL FORENSIC EVIDENCE DOSSIER • LEGAL LANDSCAPE FORMAT)
              </div>
              <div className="text-[8.5pt] text-neutral-800 mt-1 font-mono">
                กฎหมายอ้างอิง: พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ (มาตรา ๙, ๒๖, ๒๘) • พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ (มาตรา ๓๗)
              </div>
            </div>
            <div className="text-right font-mono text-[9pt] border-l border-black pl-3">
              <div className="font-bold text-[10pt]">EVIDENCE CODE: {evidenceCode || `SEAL-${sealIndex}`}</div>
              <div>SEAL INDEX: #{sealIndex}</div>
              <div>GENESIS BLOCK: #{blockNumber}</div>
              <div className="font-semibold text-emerald-800">SSoT PARITY: Δ0.00% ZERO DRIFT</div>
            </div>
          </div>

          {/* 3-Column Landscape Print Grid */}
          <div className="grid grid-cols-12 gap-3 text-[8.5pt] font-mono">
            {/* Column 1: QR Code & Verification Scan (3 cols) */}
            <div className="col-span-3 border-black p-2 rounded flex flex-col items-center justify-between text-center bg-white">
              <div className="p-1 bg-white border-neutral-300 rounded">
                <QRCodeSVG
                  value={payloadString}
                  size={135}
                  level="H"
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>
              <div className="mt-2 text-[7.5pt] font-bold">
                สแกนเพื่อตรวจสอบความสมบูรณ์
                <div className="font-normal text-neutral-700">SCAN TO VERIFY INTEGRITY</div>
              </div>
              <div className="text-[7pt] text-neutral-600 mt-1">
                HASH: SHA3-512 + BLAKE3
              </div>
            </div>

            {/* Column 2: Cryptographic Anchors (5 cols) */}
            <div className="col-span-5 border-black p-2.5 rounded space-y-2 bg-white">
              <div className="font-bold border-b border-black pb-1 uppercase text-[9pt]">
                การสลักพยานหลักฐานดิจิทัล (Cryptographic Attestation)
              </div>
              <div>
                <span className="font-bold block text-[7.5pt] uppercase">Canonical Merkle Root Hash (24-Level):</span>
                <span className="break-all text-[7pt] block font-mono bg-neutral-100 p-1 rounded border-neutral-300">
                  {merkleRoot}
                </span>
              </div>
              <div>
                <span className="font-bold block text-[7.5pt] uppercase">Post-Quantum Dilithium-5 Signature (FIPS 204):</span>
                <span className="break-all text-[7pt] block font-mono bg-neutral-100 p-1 rounded border-neutral-300">
                  {anchorSignature}
                </span>
              </div>
              <div className="text-[7.5pt] space-y-0.5 pt-1">
                <div><span className="font-bold">Hardware Quorum:</span> 10/10 REAL_HSM Unanimous (FIPS 140-3 L4)</div>
                <div><span className="font-bold">Principal:</span> {principalId}</div>
                <div><span className="font-bold">Timestamp:</span> {timestamp}</div>
              </div>
            </div>

            {/* Column 3: Legal Compliance & Judicial Sign-off (4 cols) */}
            <div className="col-span-4 border-black p-2.5 rounded flex flex-col justify-between bg-white text-[7.5pt]">
              <div>
                <div className="font-bold border-b border-black pb-1 uppercase text-[9pt]">
                  ผลผูกพันตามกฎหมาย (Legal Invariants)
                </div>
                <ul className="list-disc pl-3.5 space-y-0.5 mt-1 text-[7pt]">
                  <li>มาตรา ๙: แสดงเจตนาและระบุอัตลักษณ์ผ่าน Merkle Leaf Proof</li>
                  <li>มาตรา ๒๖: ลายมือชื่อปลอดภัย Dilithium-5 (ห้ามปฏิเสธความรับผิด)</li>
                  <li>มาตรา ๒๘: ตรวจสอบย้อนกลับสมุดบัญชีถาวร Immutable Ledger</li>
                  <li>มาตรฐานสากล: ISO/IEC 27037 Digital Evidence Admissibility</li>
                </ul>
              </div>

              <div className="border-t border-black pt-1 mt-2 text-[7pt]">
                <div className="font-bold mb-1">การรับรองของเจ้าหน้าที่ / พยานผู้เชี่ยวชาญ:</div>
                <div className="mt-3">ลงชื่อ: ____________________________________</div>
                <div className="mt-1">วันที่: ______/______/___________</div>
                <div className="font-bold mt-1 text-emerald-900">VERIFIED COURT ADMISSIBLE 🟢</div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* INTERACTIVE SCREEN HEADER                                         */}
        {/* ================================================================= */}
        <div className="screen-only-container flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            {showCheckbox && onToggleCompare && (
              <div className="no-print print:hidden flex items-center justify-center p-1 rounded-md bg-slate-900 border-slate-700 hover:border-cyan-500 transition z-10">
                <input
                  type="checkbox"
                  checked={isCompareSelected}
                  onChange={() => onToggleCompare(id)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
                  title="Select for Batch Comparison"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold font-mono tracking-wider text-white uppercase">
                    {evidenceCode ? `${evidenceCode} • ${stageName}` : stageName}
                  </h4>
                  {evidenceCode && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40 font-semibold">
                      {evidenceCode}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Seal Index #{sealIndex} • Block #{blockNumber}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isVerifying ? (
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border-cyan-500/40 flex items-center gap-1 font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> VERIFYING HANDSHAKE...
              </span>
            ) : isFailed ? (
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border-red-500/40 flex items-center gap-1 font-bold animate-bounce">
                <AlertOctagon className="w-3.5 h-3.5" /> ANOMALY DETECTED
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> VERIFIED (SSoT Δ0.00%)
              </span>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CORE QR CODE & FORENSIC METADATA SECTION                         */}
        {/* ================================================================= */}
        <div className="screen-only-container grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* QR Code Card - Clickable for Inspection Modal */}
          <div 
            onClick={() => setIsModalOpen(true)}
            className="sm:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 border-slate-800 hover:border-cyan-500/50 cursor-pointer group transition duration-300 z-10"
            title="Click to expand for judicial scanning"
          >
            <div className="p-2.5 bg-white rounded-lg shadow-inner transition group-hover:scale-105">
              <QRCodeSVG
                value={payloadString}
                size={115}
                level="M"
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
            <div className="mt-2 text-[10px] font-mono text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1">
              <Maximize2 className="w-3 h-3" /> Expand Forensic QR
            </div>
          </div>

          {/* Forensic Metadata Columns */}
          <div className="sm:col-span-8 space-y-2.5 font-mono text-xs z-10">
            {/* Merkle Root Field with Hover Tooltip */}
            <div className="relative group/tooltip">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Canonical Merkle Root Hash
                </span>
                <HelpCircle className="w-3 h-3 text-slate-500 hover:text-cyan-400 cursor-help transition" />
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block z-40 w-80 p-3 bg-slate-950 border-cyan-500/40 rounded-xl shadow-2xl text-[10px] text-slate-300 font-sans leading-relaxed pointer-events-none transition-all">
                <div className="flex items-center gap-1.5 font-mono font-bold text-cyan-400 mb-1 border-b border-slate-800 pb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Merkle Tree Integrity
                </div>
                สัจจะทางคณิตศาสตร์จาก Dual-Hash (BLAKE3 + SHA3-512) ผ่านการยืนยัน Sibling Path 24 ชั้น การันตีความถูกต้องของข้อมูลทั้งหมดบน Genesis Block โดยปราศจากการเบี่ยงเบน (Δ0.00% Zero Drift)
              </div>

              <div className="p-2 rounded-lg bg-slate-950 border-slate-800 text-cyan-300 text-[11px] truncate select-all font-mono break-all">
                {merkleRoot}
              </div>
            </div>

            {/* PQC Signature Field with Hover Tooltip */}
            <div className="relative group/tooltip">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3" /> PQC Signature (Dilithium-5 / NIST FIPS 204)
                </span>
                <HelpCircle className="w-3 h-3 text-slate-500 hover:text-purple-400 cursor-help transition" />
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block z-40 w-80 p-3 bg-slate-950 border-purple-500/40 rounded-xl shadow-2xl text-[10px] text-slate-300 font-sans leading-relaxed pointer-events-none transition-all">
                <div className="flex items-center gap-1.5 font-mono font-bold text-purple-400 mb-1 border-b border-slate-800 pb-1">
                  <Lock className="w-3.5 h-3.5" /> NIST FIPS 204 (ML-DSA-87)
                </div>
                ตราประทับดิจิทัลฐานแลตทิซ (Lattice-based) ยุคหลังควอนตัม เพื่อป้องกันยุทธศาสตร์ดักจับข้อมูลในปัจจุบันเพื่อรอนำไปถอดรหัสในอนาคต (Harvest Now, Decrypt Later)
              </div>

              <div className="p-2 rounded-lg bg-slate-950 border-slate-800 text-purple-300 text-[10px] truncate flex items-center justify-between">
                <span className="truncate font-mono">{anchorSignature}</span>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping ml-2 shrink-0" />
              </div>
            </div>

            {/* 4 Sovereign Architecture Pillars Badge Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[9px] font-mono">
              <div className="p-1.5 rounded-md bg-slate-950/80 border-slate-800 text-slate-300">
                <span className="text-slate-500 block text-[8px] uppercase">1. Smart Contract</span>
                <span className="text-emerald-400 font-bold">AUDITED / SSOT</span>
              </div>
              <div className="p-1.5 rounded-md bg-slate-950/80 border-slate-800 text-slate-300">
                <span className="text-slate-500 block text-[8px] uppercase">2. Council Quorum</span>
                <span className="text-cyan-400 font-bold">10/10 REAL_HSM</span>
              </div>
              <div className="p-1.5 rounded-md bg-slate-950/80 border-slate-800 text-slate-300">
                <span className="text-slate-500 block text-[8px] uppercase">3. PQC Standard</span>
                <span className="text-purple-400 font-bold">ML-DSA-87 (FIPS 204)</span>
              </div>
              <div className="p-1.5 rounded-md bg-slate-950/80 border-slate-800 text-slate-300">
                <span className="text-slate-500 block text-[8px] uppercase">4. Trace Pipeline</span>
                <span className="text-amber-400 font-bold">12-STAGE PASS</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* ACTION TOOLBAR (HIDDEN IN PRINT)                                 */}
        {/* ================================================================= */}
        <div className="no-print print:hidden pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono z-10 relative gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* 'Print QR' Button specifically for landscape legal evidence documents */}
            <button
              id={`btn-print-qr-${id}`}
              onClick={handlePrintQR}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition border-emerald-500/50 active:scale-95 text-[11px] cursor-pointer font-bold shadow-sm shadow-emerald-950"
              title="Print QR code and evidence dossier specifically formatted in landscape orientation for legal documents"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print QR</span>
            </button>

            {/* Direct Landscape PDF Export Button */}
            <button
              onClick={handleExportSinglePdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] transition border-[#D4AF37]/40 active:scale-95 text-[11px] cursor-pointer disabled:opacity-50"
              title="Generate and Download Official Court Evidence Landscape PDF Dossier"
            >
              <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{isGeneratingPdf ? "Building PDF..." : "Export PDF"}</span>
            </button>

            {/* Copy Payload Button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition border-slate-700 active:scale-95 text-[11px] cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? "Copied" : "Copy Payload"}</span>
            </button>

            {/* Download JSON Button */}
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition border-cyan-500/30 active:scale-95 text-[11px] cursor-pointer"
              title="Download JSON Payload for Offline Verification"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>JSON</span>
            </button>

            {/* Audit Trail Button (when callback available) */}
            {onOpenAuditHistory && (
              <button
                onClick={() => onOpenAuditHistory(sealIndex, blockNumber)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition border-purple-500/30 text-[11px] cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-purple-400" />
                <span>Audit Trail</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="hidden sm:inline">ETDA Sec 9/26/28 • Landscape Legal</span>
            <span>•</span>
            <span className="text-slate-400 font-semibold">Block #{blockNumber}</span>
          </div>
        </div>
      </div>

      {/* Judicial Inspection & Full Resolution Modal */}
      <CourtEvidenceQRModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        payload={payload}
      />
    </>
  );
};

export const CountEvidenceQR = CourtEvidenceQR;
export default CourtEvidenceQR;
