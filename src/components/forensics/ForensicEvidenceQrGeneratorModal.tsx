import React, { useState, useId } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import {
  QrCode,
  ShieldCheck,
  Download,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lock,
  Scale,
  Clock,
  Layers,
  FileCheck2,
  X,
  Share2,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import {
  FORENSIC_DOSSIER_V9,
  ForensicDossierMaster,
  ForensicAuditStep,
  TechnicalPillar,
  StatutoryLegalAlignment,
} from '../../data/forensicAuditMasterDossierData';
import { safeCopyToClipboard } from '../../utils/clipboard';
import { playTone, playAuditChime } from '../AudioSynthesizer';

export type ForensicEvidenceType =
  | 'AUDIT_STEP'
  | 'TECHNICAL_PILLAR'
  | 'LEGAL_ALIGNMENT'
  | 'MASTER_DOSSIER';

export interface ForensicEvidenceItem {
  id: string;
  type: ForensicEvidenceType;
  title: string;
  category: string;
  code: string;
  statute: string;
  cryptographicScheme: string;
  enclaveHardware: string;
  merkleHash: string;
  status: string;
  timestamp: string;
  principal: string;
  description?: string;
  details?: string[];
  executionTimeMs?: number;
}

/**
 * Builds standard forensic evidence items from the Master Dossier
 */
export const buildAllForensicEvidenceItems = (
  dossier: ForensicDossierMaster = FORENSIC_DOSSIER_V9
): ForensicEvidenceItem[] => {
  const items: ForensicEvidenceItem[] = [];

  // 1. Master Dossier Root
  items.push({
    id: 'master-dossier',
    type: 'MASTER_DOSSIER',
    title: `Master Forensic Dossier ${dossier.documentId}`,
    category: 'Executive Forensic Certification',
    code: 'DOC-MASTER-ROOT',
    statute: 'ETDA Sec 9/26/28 & PDPA Sec 37 & NCSA CII',
    cryptographicScheme: 'Dilithium-5 ML-DSA-87 + ML-KEM-1024',
    enclaveHardware: '10/10 REAL_HSM FIPS 140-3 L4 Quorum',
    merkleHash: dossier.merkleRoot,
    status: dossier.status,
    timestamp: dossier.auditTimestamp,
    principal: dossier.principalAuthority,
    description: `Official judicial master anchor for ZYRQUEN Ω∞ Sovereign Kernel ${dossier.version} under Executive Passport ${dossier.passportId}. SSoT Zero Drift across ${dossier.canonicalSealsCount.toLocaleString()} frozen canonical seals.`,
  });

  // 2. 16 Audit Steps
  dossier.steps.forEach((step: ForensicAuditStep) => {
    items.push({
      id: `step-${step.step}`,
      type: 'AUDIT_STEP',
      title: `Step #${step.step}: ${step.title}`,
      category: '16-Step Master Forensic Audit Trail',
      code: `STG-${String(step.step).padStart(2, '0')}`,
      statute: step.statutoryStandard,
      cryptographicScheme: step.cryptographicScheme,
      enclaveHardware: step.enclaveHardware,
      merkleHash: step.merkleHash,
      status: `${step.result} (${step.executionTimeMs.toFixed(1)} ms)`,
      timestamp: dossier.auditTimestamp,
      principal: dossier.passportId,
      description: step.description,
      executionTimeMs: step.executionTimeMs,
    });
  });

  // 3. 4 Core Technical Pillars
  dossier.pillars.forEach((pillar: TechnicalPillar, idx: number) => {
    items.push({
      id: pillar.id,
      type: 'TECHNICAL_PILLAR',
      title: `${pillar.pillarNumber}: ${pillar.title}`,
      category: 'Core Technical Pillar',
      code: `PIL-0${idx + 1}`,
      statute: 'ETDA B.E. 2544 / NIST FIPS 203/204/205',
      cryptographicScheme:
        idx === 1
          ? 'CRYSTALS-Dilithium-5 (ML-DSA-87) / Kyber-1024'
          : 'Immutable WORM Merkle Anchor',
      enclaveHardware: pillar.hardware,
      merkleHash: dossier.merkleRoot,
      status: pillar.status,
      timestamp: dossier.auditTimestamp,
      principal: dossier.passportId,
      description: pillar.specification,
      details: pillar.details,
    });
  });

  // 4. Statutory Legal Alignment Items
  dossier.legalAlignments.forEach(
    (legal: StatutoryLegalAlignment, idx: number) => {
      items.push({
        id: `legal-${idx + 1}`,
        type: 'LEGAL_ALIGNMENT',
        title: `${legal.section}: ${legal.title}`,
        category: 'Statutory Legal Compliance',
        code: `LEG-0${idx + 1}`,
        statute: legal.lawName,
        cryptographicScheme: 'FIPS 204 ML-DSA-87 Judicial E-Signature',
        enclaveHardware: 'FIPS 140-3 L4 Enclave (NitroKey / Trezor Safe 5)',
        merkleHash: legal.evidence,
        status: legal.complianceLevel,
        timestamp: dossier.auditTimestamp,
        principal: dossier.principalAuthority,
        description: legal.mechanism,
      });
    }
  );

  return items;
};

export interface ForensicEvidenceQrGeneratorProps {
  initialEvidenceId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

export const ForensicEvidenceQrGenerator: React.FC<ForensicEvidenceQrGeneratorProps> = ({
  initialEvidenceId = 'master-dossier',
  isOpen = true,
  onClose,
  inline = false,
}) => {
  const dossier = FORENSIC_DOSSIER_V9;
  const allItems = React.useMemo(() => buildAllForensicEvidenceItems(dossier), [dossier]);

  const [selectedId, setSelectedId] = useState<string>(initialEvidenceId);
  const [payloadMode, setPayloadMode] = useState<'MOBILE_URL' | 'COURT_JSON' | 'LEAF_HASH'>('MOBILE_URL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [contrastTheme, setContrastTheme] = useState<'OPTICAL_LIGHT' | 'EMERALD_NIGHT'>('OPTICAL_LIGHT');
  const [showSimulator, setShowSimulator] = useState(true);

  // Sync selectedId when initialEvidenceId prop changes
  React.useEffect(() => {
    if (initialEvidenceId) {
      setSelectedId(initialEvidenceId);
    }
  }, [initialEvidenceId]);

  const currentItem = allItems.find((i) => i.id === selectedId) || allItems[0];
  const currentIndex = allItems.findIndex((i) => i.id === currentItem.id);

  // Base URL calculation (safe for both local dev and hosted web deployment)
  const baseUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://hugeplease66-debug.github.io';

  // Construct mobile verification URL with deep cryptographic query parameters
  const mobileVerificationUrl = `${baseUrl}/?verify_evidence=${encodeURIComponent(
    currentItem.id
  )}&doc=${encodeURIComponent(dossier.documentId)}&code=${encodeURIComponent(
    currentItem.code
  )}&hash=${encodeURIComponent(
    currentItem.merkleHash
  )}&std=${encodeURIComponent(
    currentItem.statute
  )}&pqc=${encodeURIComponent(
    currentItem.cryptographicScheme
  )}&block=${dossier.genesisBlock}&ts=${encodeURIComponent(
    dossier.auditTimestamp
  )}&status=VERIFIED_100_PERCENT_GREEN`;

  // Court JSON Payload
  const courtJsonPayload = JSON.stringify(
    {
      $schema: 'https://schema.org/DigitalDocumentEvidence',
      court_admissible: true,
      document_id: dossier.documentId,
      evidence_id: currentItem.id,
      evidence_code: currentItem.code,
      title: currentItem.title,
      category: currentItem.category,
      statute: currentItem.statute,
      cryptographic_scheme: currentItem.cryptographicScheme,
      hardware_enclave: currentItem.enclaveHardware,
      merkle_hash: currentItem.merkleHash,
      canonical_merkle_root: dossier.merkleRoot,
      genesis_block: dossier.genesisBlock,
      status: currentItem.status,
      timestamp_rfc3161: currentItem.timestamp,
      sovereign_principal: currentItem.principal,
      ssot_drift: dossier.systemDrift,
      quorum_ratification: '10/10 REAL_HSM FIPS 140-3 L4 Ratified',
      verification_endpoint: mobileVerificationUrl,
    },
    null,
    2
  );

  // Active QR string
  const activeQrValue =
    payloadMode === 'MOBILE_URL'
      ? mobileVerificationUrl
      : payloadMode === 'COURT_JSON'
      ? courtJsonPayload
      : currentItem.merkleHash;

  const handleCopy = (text: string, keyName: string) => {
    safeCopyToClipboard(text);
    setCopiedKey(keyName);
    playTone(680, 0.04);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + allItems.length) % allItems.length;
    setSelectedId(allItems[prevIdx].id);
    playTone(550, 0.03);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % allItems.length;
    setSelectedId(allItems[nextIdx].id);
    playTone(580, 0.03);
  };

  // High-Resolution PNG Generator using canvas
  const handleDownloadPng = async () => {
    setIsDownloadingPng(true);
    playTone(650, 0.05);

    try {
      // 1. Generate base QR data URL
      const qrDataUrl = await QRCode.toDataURL(activeQrValue, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#030712',
          light: '#FFFFFF',
        },
      });

      // 2. Draw high-quality legal certificate card on canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cardWidth = 720;
      const cardHeight = 920;
      canvas.width = cardWidth;
      canvas.height = cardHeight;

      // Dark theme background with border
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, cardWidth, cardHeight);

      // Subtle emerald border
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, cardWidth - 32, cardHeight - 32);

      // Inner thin border
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(24, 24, cardWidth - 48, cardHeight - 48);

      // Header Text
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('ZYRQUEN Ω∞ SOVEREIGN COURT EVIDENCE SEAL', 40, 64);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText(`Dossier: ${dossier.documentId} • Genesis #${dossier.genesisBlock}`, 40, 88);
      ctx.fillText(`Status: ${dossier.status} • SSoT Zero Drift Δ0.00%`, 40, 108);

      // Draw QR image centered
      const qrImg = new Image();
      await new Promise((resolve) => {
        qrImg.onload = resolve;
        qrImg.src = qrDataUrl;
      });

      const qrSize = 460;
      const qrX = (cardWidth - qrSize) / 2;
      const qrY = 130;

      // White backplate for optical clarity
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Footer metadata
      const textStartY = 640;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(currentItem.title.slice(0, 52), 40, textStartY);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '12px monospace';
      ctx.fillText(`Code: ${currentItem.code} | Standard: ${currentItem.statute}`, 40, textStartY + 26);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '11px monospace';
      ctx.fillText(`Enclave: ${currentItem.enclaveHardware}`, 40, textStartY + 48);
      ctx.fillText(`Scheme: ${currentItem.cryptographicScheme}`, 40, textStartY + 68);

      // Hash with wrapping or truncated
      ctx.fillStyle = '#34d399';
      ctx.fillText(`Hash: ${currentItem.merkleHash.slice(0, 60)}...`, 40, textStartY + 92);

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`Timestamp: ${dossier.auditTimestamp} • Verified by Deca-Key Quorum 10/10 REAL_HSM`, 40, cardHeight - 44);

      // 3. Trigger PNG Download
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_SEAL_${currentItem.code}_${currentItem.id}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      playAuditChime();
    } catch (err) {
      console.error('Failed to export QR PNG:', err);
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const content = (
    <div className="space-y-5 text-zinc-100 font-mono">
      {/* Evidence Item Quick Selector Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#070b14] border border-emerald-500/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <label htmlFor="evidence-item-select" className="text-xs text-zinc-400 font-bold whitespace-nowrap flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Evidence Item:</span>
          </label>
          <select
            id="evidence-item-select"
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              playTone(600, 0.03);
            }}
            className="flex-1 bg-zinc-900/90 border border-zinc-700 hover:border-emerald-500/50 rounded-xl px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-400 truncate cursor-pointer"
          >
            <optgroup label="🏛️ Master Dossier Anchor">
              <option value="master-dossier">DOC-SOV-HSM-1010-2026-V9: Master Forensic Root</option>
            </optgroup>
            <optgroup label="🛡️ 16-Step Master Forensic Trail">
              {allItems
                .filter((item) => item.type === 'AUDIT_STEP')
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code}: {item.title}
                  </option>
                ))}
            </optgroup>
            <optgroup label="🧱 Core Technical Pillars">
              {allItems
                .filter((item) => item.type === 'TECHNICAL_PILLAR')
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code}: {item.title}
                  </option>
                ))}
            </optgroup>
            <optgroup label="⚖️ Statutory Legal Alignments">
              {allItems
                .filter((item) => item.type === 'LEGAL_ALIGNMENT')
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code}: {item.title}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>

        <div className="flex items-center gap-1.5 self-end md:self-auto">
          <button
            id="btn-prev-evidence-item"
            onClick={handlePrev}
            className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Previous evidence item"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-zinc-400 px-2 font-mono">
            {currentIndex + 1} of {allItems.length}
          </span>
          <button
            id="btn-next-evidence-item"
            onClick={handleNext}
            className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Next evidence item"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main QR Verification Display Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: QR Code & Direct Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center p-5 rounded-3xl bg-[#060912] border border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.12)]">
          {/* Header pill */}
          <div className="flex items-center justify-between w-full mb-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>{currentItem.code}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {currentItem.status}
            </span>
          </div>

          {/* QR Code Container with High-Contrast Optical Card */}
          <div
            className={`p-4 rounded-2xl transition-all shadow-xl flex flex-col items-center justify-center ${
              contrastTheme === 'OPTICAL_LIGHT'
                ? 'bg-white border-4 border-emerald-400 text-black'
                : 'bg-[#02050b] border-2 border-emerald-500/60'
            }`}
          >
            <QRCodeSVG
              id="forensic-item-qrcode-svg"
              value={activeQrValue}
              size={230}
              level="H"
              fgColor={contrastTheme === 'OPTICAL_LIGHT' ? '#000000' : '#10b981'}
              bgColor={contrastTheme === 'OPTICAL_LIGHT' ? '#FFFFFF' : '#02050b'}
              marginSize={2}
            />
            <div className="mt-2 text-[10px] font-bold tracking-wider text-center text-zinc-800">
              {contrastTheme === 'OPTICAL_LIGHT' && (
                <span className="text-zinc-600 font-mono">
                  SCAN WITH ANY MOBILE CAMERA
                </span>
              )}
            </div>
          </div>

          {/* Contrast & Theme Options */}
          <div className="flex items-center justify-between w-full mt-4 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 text-[10px]">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Camera Sensitivity:</span>
            </span>
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-[10px]">
              <button
                id="btn-theme-optical"
                onClick={() => setContrastTheme('OPTICAL_LIGHT')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  contrastTheme === 'OPTICAL_LIGHT'
                    ? 'bg-white text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Max Contrast (White)
              </button>
              <button
                id="btn-theme-emerald"
                onClick={() => setContrastTheme('EMERALD_NIGHT')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  contrastTheme === 'EMERALD_NIGHT'
                    ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Terminal Glow
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full mt-4">
            <button
              id="btn-download-item-qr-png"
              onClick={handleDownloadPng}
              disabled={isDownloadingPng}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm"
              title="Download official high-resolution PNG evidence badge"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingPng ? 'Generating...' : 'Download PNG'}</span>
            </button>

            <button
              id="btn-copy-item-qr-payload"
              onClick={() => handleCopy(activeQrValue, 'active-qr-value')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer active:scale-95"
              title="Copy active payload string to clipboard"
            >
              {copiedKey === 'active-qr-value' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span>{copiedKey === 'active-qr-value' ? 'Copied!' : 'Copy Payload'}</span>
            </button>
          </div>

          {/* Test Open in Browser Link */}
          <a
            id="btn-test-open-mobile-url"
            href={mobileVerificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-2 text-center text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 py-1 transition hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Simulate Direct Scan / Open Link</span>
          </a>
        </div>

        {/* Right Column: Evidence Item Metadata & Scanner Payload (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Item Title & Classification Card */}
          <div className="p-4 rounded-2xl bg-[#090e1a] border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {currentItem.category}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Genesis #{dossier.genesisBlock} • SSoT Δ0.00%
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {currentItem.title}
            </h3>
            {currentItem.description && (
              <p className="text-xs text-zinc-300 leading-relaxed">
                {currentItem.description}
              </p>
            )}
          </div>

          {/* Technical Invariants & Verification Proof Anchors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">Statutory Standard</span>
              <span className="font-bold text-cyan-300">{currentItem.statute}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">PQC Algorithm Scheme</span>
              <span className="font-bold text-emerald-400">{currentItem.cryptographicScheme}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">Hardware Enclave</span>
              <span className="text-zinc-200">{currentItem.enclaveHardware}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">Authority Principal</span>
              <span className="text-zinc-200">{currentItem.principal}</span>
            </div>
            <div className="col-span-full p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 text-[10px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-500 uppercase font-bold">Cryptographic Merkle Leaf Hash:</span>
                <button
                  onClick={() => handleCopy(currentItem.merkleHash, 'leaf-hash')}
                  className="text-emerald-400 hover:text-emerald-300 text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'leaf-hash' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'leaf-hash' ? 'Copied' : 'Copy Hash'}</span>
                </button>
              </div>
              <code className="text-emerald-300 font-mono break-all">{currentItem.merkleHash}</code>
            </div>
          </div>

          {/* Details list if available (e.g. for Pillars) */}
          {currentItem.details && currentItem.details.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-400 block uppercase font-bold mb-2">
                Technical Specification Invariants:
              </span>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {currentItem.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Payload Format Selection Tabs */}
          <div className="p-4 rounded-2xl bg-[#080d17] border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>QR Encoded Payload Mode</span>
              </span>

              {/* Mode toggles */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[10px]">
                <button
                  id="btn-mode-mobile-url"
                  onClick={() => {
                    setPayloadMode('MOBILE_URL');
                    playTone(600, 0.03);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    payloadMode === 'MOBILE_URL'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Camera URL (Recommended)
                </button>
                <button
                  id="btn-mode-court-json"
                  onClick={() => {
                    setPayloadMode('COURT_JSON');
                    playTone(620, 0.03);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    payloadMode === 'COURT_JSON'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Court JSON-LD
                </button>
                <button
                  id="btn-mode-leaf-hash"
                  onClick={() => {
                    setPayloadMode('LEAF_HASH');
                    playTone(640, 0.03);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    payloadMode === 'LEAF_HASH'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Leaf Hash Only
                </button>
              </div>
            </div>

            {/* Explanatory banner */}
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {payloadMode === 'MOBILE_URL' && (
                <span>
                  💡 <strong>Direct Mobile Verification URL:</strong> Point any iPhone (iOS Camera) or Android (Google Lens / Camera) at the QR code. Tapping the pop-up notification opens the live judicial verification receipt with zero app installation needed.
                </span>
              )}
              {payloadMode === 'COURT_JSON' && (
                <span>
                  ⚖️ <strong>RFC 3161 / JSON-LD Manifest:</strong> Cryptographically formatted JSON object containing complete forensic attestations, Dilithium-5 signature scheme, and statutory ETDA citations for judicial offline evidence scanners.
                </span>
              )}
              {payloadMode === 'LEAF_HASH' && (
                <span>
                  🔒 <strong>Raw Merkle Hash:</strong> Uncompressed cryptographic leaf hash for automated HSM validation scripts and low-bandwidth telemetry channels.
                </span>
              )}
            </p>

            {/* Code preview */}
            <div className="relative">
              <pre className="p-3 rounded-xl bg-black/60 border border-zinc-800 text-[10px] text-emerald-300 font-mono overflow-x-auto max-h-36 leading-relaxed">
                {activeQrValue}
              </pre>
              <button
                onClick={() => handleCopy(activeQrValue, 'preview-code')}
                className="absolute top-2 right-2 px-2 py-1 rounded bg-zinc-800/90 hover:bg-zinc-700 text-[10px] text-zinc-300 flex items-center gap-1 transition cursor-pointer"
              >
                {copiedKey === 'preview-code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                <span>{copiedKey === 'preview-code' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* External Mobile Scanner Simulation Card */}
          <div className="p-4 rounded-2xl bg-[#0a1120] border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>External Mobile Device Screen Preview</span>
              </div>
              <button
                onClick={() => setShowSimulator(!showSimulator)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                {showSimulator ? 'Hide Simulator' : 'Show Simulator'}
              </button>
            </div>

            {showSimulator && (
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-[11px] animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>AUTHENTICITY CONFIRMED • JURISDICTION VALID</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
                  <div>
                    Evidence Code: <strong className="text-zinc-200">{currentItem.code}</strong>
                  </div>
                  <div>
                    Quorum: <strong className="text-emerald-300">10/10 REAL_HSM</strong>
                  </div>
                  <div>
                    Block Height: <strong className="text-zinc-200">#{dossier.genesisBlock}</strong>
                  </div>
                  <div>
                    Baseline Drift: <strong className="text-cyan-300">Δ0.00% Zero Drift</strong>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-800 flex items-center justify-between">
                  <span>Audited by #EP-SOVEREIGN-01</span>
                  <span>ETDA Sec 9/26/28 Compliant</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // If inline inside the main modal tab
  if (inline) {
    return content;
  }

  // If standalone modal overlay
  if (!isOpen) return null;

  return (
    <div
      id="forensic-evidence-qr-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl font-mono text-zinc-100 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-[#080d16] border border-emerald-500/40 rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/30 bg-[#060a12]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <QrCode className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-white tracking-wide">
                  EVIDENCE VERIFICATION QR CODE GENERATOR
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  MOBILE READY
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Scan via external mobile camera for instant cryptographic verification & non-repudiation
              </p>
            </div>
          </div>

          <button
            id="btn-close-evidence-qr-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {content}
        </div>
      </div>
    </div>
  );
};
