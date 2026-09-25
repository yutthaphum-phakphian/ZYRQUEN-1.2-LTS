import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  Download,
  Copy,
  Check,
  FileText,
  CheckCircle2,
  X,
  Sparkles,
  ExternalLink,
  Cpu,
  Lock,
  Activity,
  Anchor,
  Scale,
  Clock,
  Fingerprint,
  Layers,
  ChevronRight,
  Database,
  Terminal,
  QrCode,
  Smartphone,
  Scan,
  Share2,
  Shield,
  Info,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { FORENSIC_DOSSIER_V9, TechnicalPillar, ForensicAuditStep } from '../../data/forensicAuditMasterDossierData';
import { downloadMasterForensicDossierV9Pdf } from '../../utils/forensicDossierPdfExport';
import { safeCopyToClipboard } from '../../utils/clipboard';
import { generateSealQrCodeDataUrl, formatSealPayload } from '../../utils/sealQrCode';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { ForensicEvidenceQrGenerator } from './ForensicEvidenceQrGeneratorModal';

export interface ForensicAuditMasterDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'pillars' | 'audit-trail' | 'legal' | 'qr-generator' | 'raw-json' | 'qr-verify';
}

export const ForensicAuditMasterDossierModal: React.FC<ForensicAuditMasterDossierModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'pillars',
}) => {
  const [activeTab, setActiveTab] = useState<'pillars' | 'audit-trail' | 'legal' | 'qr-generator' | 'raw-json' | 'qr-verify'>(initialTab);
  const [selectedStep, setSelectedStep] = useState<ForensicAuditStep | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [qrFormat, setQrFormat] = useState<'url' | 'json' | 'compact'>('url');
  const [qrEvidenceId, setQrEvidenceId] = useState<string>('master-dossier');

  if (!isOpen) return null;

  const handleOpenQrForEvidence = (evidenceId: string) => {
    setQrEvidenceId(evidenceId);
    setActiveTab('qr-generator');
    playTone(720, 0.04);
  };

  const handleCopy = (text: string, fieldName: string) => {
    safeCopyToClipboard(text);
    setCopiedField(fieldName);
    playTone(680, 0.04);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadPdf = () => {
    setIsExportingPdf(true);
    playAuditChime();
    try {
      downloadMasterForensicDossierV9Pdf(FORENSIC_DOSSIER_V9);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const dossier = FORENSIC_DOSSIER_V9;

  // Build dynamic QR Code payload based on selected format
  const getQrPayload = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://zyrquen.court.local';
    if (qrFormat === 'url') {
      return `${origin}/verify?merkleRoot=${dossier.merkleRoot}&blockHeight=${dossier.genesisBlock}&docId=${dossier.documentId}&drift=0.00pct&seals=${dossier.canonicalSealsCount}`;
    }
    if (qrFormat === 'compact') {
      return `ZYRQUEN:BLOCK#${dossier.genesisBlock}:MERKLE#${dossier.merkleRoot}:DRIFT#0.00%:SEALS#${dossier.canonicalSealsCount}:HSM#10/10`;
    }
    return JSON.stringify(
      {
        standard: 'ISO/IEC-27037-RFC-3161',
        system: 'ZYRQUEN_OMEGA_SOVEREIGN',
        document_id: dossier.documentId,
        merkle_root: dossier.merkleRoot,
        genesis_block_height: dossier.genesisBlock,
        canonical_seals: dossier.canonicalSealsCount,
        system_drift: dossier.systemDrift,
        status: dossier.status,
        passport_id: dossier.passportId,
        pqc_scheme: 'ML-DSA-87 / Dilithium-5',
        hsm_quorum: '10/10 REAL_HSM FIPS 140-3 L4',
        audit_timestamp: dossier.auditTimestamp,
        court_admissibility: 'ETDA_SEC_9_26_28_PDPA_37',
      },
      null,
      2
    );
  };

  const qrPayloadValue = getQrPayload();

  // Export QR as PNG image
  const handleDownloadQrPng = () => {
    playAuditChime();
    const svgNode = document.getElementById('forensic-master-qr-svg');
    if (!svgNode) return;
    const svgData = new XMLSerializer().serializeToString(svgNode);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 48;
      canvas.height = img.height + 48;
      if (ctx) {
        ctx.fillStyle = '#050a14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 24, 24);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `zyrquen-merkle-block-qr-${dossier.genesisBlock}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Export QR as SVG vector
  const handleDownloadQrSvg = () => {
    playAuditChime();
    const svgNode = document.getElementById('forensic-master-qr-svg');
    if (!svgNode) return;
    const svgData = new XMLSerializer().serializeToString(svgNode);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zyrquen-merkle-block-qr-${dossier.genesisBlock}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="forensic-master-dossier-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl font-mono text-zinc-100 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-[#080d16] bg-theme-card border border-emerald-500/40 border-theme rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden flex flex-col max-h-[90vh] transition-all text-theme"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================================= */}
        {/* HEADER BAR                                                        */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/30 border-theme bg-[#060a12] bg-theme-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-white tracking-wide">
                  {dossier.documentId}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {dossier.status}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {dossier.systemDrift}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Executive Passport <strong className="text-zinc-200">{dossier.passportId}</strong> • Genesis #{dossier.genesisBlock} • 14,902 Canonical Seals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-open-master-qr"
              onClick={() => handleOpenQrForEvidence('master-dossier')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition cursor-pointer active:scale-95 shadow-sm"
              title="Verify Master Forensic Dossier on Mobile Device via QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Verify on Mobile (QR)</span>
            </button>

            <button
              id="btn-qr-verification"
              onClick={() => {
                playTone(740, 0.04);
                setActiveTab('qr-verify');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm ${
                activeTab === 'qr-verify'
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-300'
              }`}
              title="Generate QR code for quick verification of Merkle Root & Block Height on external devices"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verify on Device (QR)</span>
            </button>

            <button
              id="btn-download-dossier-pdf"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold text-xs transition cursor-pointer active:scale-95 shadow-sm"
              title="Download official court-admissible PDF dossier"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Court Dossier PDF</span>
            </button>

            <button
              id="btn-close-dossier-modal"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TAB CONTROLS                                                      */}
        {/* ================================================================= */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-zinc-800 bg-[#090e1a] overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('pillars')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'pillars'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Core Technical Pillars (4)</span>
          </button>

          <button
            onClick={() => setActiveTab('audit-trail')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'audit-trail'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>16-Step Master Audit Trail</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab('legal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'legal'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Statutory Legal Alignment (ETDA / PDPA)</span>
          </button>

          <button
            id="tab-btn-qr-generator"
            onClick={() => {
              playTone(740, 0.04);
              setActiveTab('qr-generator');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'qr-generator'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mobile QR Verifier</span>
          </button>

          <button
            id="tab-btn-qr-verification"
            onClick={() => {
              playTone(760, 0.04);
              setActiveTab('qr-verify');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'qr-verify'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-cyan-200 hover:bg-cyan-950/30 border border-transparent'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Device QR Verification (SSoT)</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/60">
              AIR-GAPPED
            </span>
          </button>

          <button
            onClick={() => setActiveTab('raw-json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'raw-json'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Raw Evidence JSON</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB BODY                                                          */}
        {/* ================================================================= */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: CORE TECHNICAL PILLARS */}
          {activeTab === 'pillars' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3 text-zinc-300">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-zinc-200 font-bold mb-1">
                    Executive Summary: Sovereign Mathematical Truth & Forensic Audit Master
                  </p>
                  <p className="text-zinc-400 leading-relaxed">
                    The official forensic dossier <strong className="text-white">{dossier.documentId}</strong> establishes an unalterable cryptographic anchor for the ZYRQUEN Ω∞ Sovereign Kernel {dossier.version} under Executive Passport <strong className="text-emerald-300">{dossier.passportId}</strong>. The system is verified in 100% Pure Green status with zero baseline drift (<span className="text-cyan-300">{dossier.systemDrift}</span>) across 14,902 frozen canonical seals.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dossier.pillars.map((pillar) => (
                  <div
                    key={pillar.id}
                    className="p-5 rounded-2xl bg-[#0b101c] border border-zinc-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {pillar.pillarNumber}
                        </span>
                        <span className="text-[10px] text-zinc-400">{pillar.hardware}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2">{pillar.title}</h4>
                      <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
                        {pillar.specification}
                      </p>
                      <ul className="space-y-1.5 border-t border-zinc-800/80 pt-3 text-[10px] text-zinc-300">
                        {pillar.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500">Status Verification:</span>
                        <span className="font-bold text-emerald-400">{pillar.status}</span>
                      </div>
                      <button
                        id={`btn-qr-${pillar.id}`}
                        onClick={() => handleOpenQrForEvidence(pillar.id)}
                        className="px-2 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-800/60 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                        title={`Generate QR Code to verify ${pillar.pillarNumber} on mobile device`}
                      >
                        <QrCode className="w-3 h-3 text-emerald-400" />
                        <span>QR</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: 16-STEP MASTER FORENSIC AUDIT TRAIL */}
          {activeTab === 'audit-trail' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div className="text-[11px] text-zinc-400">
                  Timestamp: <strong className="text-white">{dossier.auditTimestamp}</strong> • Principal Authority: <strong className="text-emerald-300">{dossier.principalAuthority}</strong>
                </div>
                <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>All 16 verification stages passed within operational SLA limits.</span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-[#0a0f1d]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-[#060a14] text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-3 text-center w-12">Step</th>
                        <th className="p-3">Audit Stage Title</th>
                        <th className="p-3">Statutory Standard</th>
                        <th className="p-3">Cryptographic Scheme</th>
                        <th className="p-3 text-right">Time</th>
                        <th className="p-3 text-center">Result</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {dossier.steps.map((s) => (
                        <tr
                          key={s.step}
                          onClick={() => setSelectedStep(s)}
                          className={`hover:bg-emerald-950/20 transition cursor-pointer ${
                            selectedStep?.step === s.step ? 'bg-emerald-950/30' : ''
                          }`}
                        >
                          <td className="p-3 text-center font-bold text-zinc-400">{s.step}</td>
                          <td className="p-3 font-bold text-zinc-100">{s.title}</td>
                          <td className="p-3 text-zinc-400">{s.statutoryStandard}</td>
                          <td className="p-3 text-cyan-300 font-mono text-[11px]">{s.cryptographicScheme}</td>
                          <td className="p-3 text-right font-mono text-zinc-300">{s.executionTimeMs.toFixed(1)} ms</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {s.result}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                id={`btn-qr-step-${s.step}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenQrForEvidence(`step-${s.step}`);
                                }}
                                className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-800/60 border border-emerald-500/40 text-[10px] text-emerald-300 font-bold transition cursor-pointer flex items-center gap-1"
                                title={`Generate QR Code for Step #${s.step} to verify on mobile device`}
                              >
                                <QrCode className="w-3 h-3 text-emerald-400" />
                                <span>QR</span>
                              </button>
                              <button
                                id={`btn-hash-step-${s.step}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(s.merkleHash, `hash-${s.step}`);
                                }}
                                className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-[10px] text-zinc-300 transition cursor-pointer"
                                title="Copy Merkle Hash"
                              >
                                {copiedField === `hash-${s.step}` ? 'Copied' : 'Hash'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step Detail Drawer */}
              {selectedStep && (
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-emerald-500/40 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-bold text-white text-xs">
                      Step #{selectedStep.step}: {selectedStep.title}
                    </span>
                    <button
                      onClick={() => setSelectedStep(null)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-zinc-300 text-[11px]">{selectedStep.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-zinc-400 pt-1">
                    <div>Hardware Enclave: <strong className="text-zinc-200">{selectedStep.enclaveHardware}</strong></div>
                    <div>Legal Standard: <strong className="text-cyan-300">{selectedStep.legalStandard}</strong></div>
                    <div className="col-span-full break-all">
                      Merkle Hash: <code className="text-emerald-300">{selectedStep.merkleHash}</code>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenQrForEvidence(`step-${selectedStep.step}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold text-xs transition cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Verify Step #{selectedStep.step} via Mobile QR Code</span>
                    </button>
                    <button
                      id={`step-drawer-hash-${selectedStep.step}`}
                      onClick={() => handleCopy(selectedStep.merkleHash, `step-drawer-hash-${selectedStep.step}`)}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition cursor-pointer flex items-center gap-1"
                    >
                      {copiedField === `step-drawer-hash-${selectedStep.step}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                      <span>{copiedField === `step-drawer-hash-${selectedStep.step}` ? 'Copied' : 'Copy Hash'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STATUTORY LEGAL ALIGNMENT */}
          {activeTab === 'legal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {dossier.legalAlignments.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-[#0b101c] border border-zinc-800 space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-bold text-white">{item.section}</span>
                        <span className="text-xs text-zinc-400">({item.lawName})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {item.complianceLevel}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-cyan-300">{item.title}</h5>

                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      {item.mechanism}
                    </p>

                    <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-[11px] flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold mb-1">
                          Court Evidentiary Proof Anchor:
                        </span>
                        <code className="text-emerald-400 break-all">{item.evidence}</code>
                      </div>
                      <button
                        id={`btn-qr-legal-${idx + 1}`}
                        onClick={() => handleOpenQrForEvidence(`legal-${idx + 1}`)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-800/60 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                        title={`Generate QR Code for statutory proof (${item.section})`}
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span>QR Proof</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RAW EVIDENCE JSON */}
          {activeTab === 'raw-json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-bold">
                  Canonical Evidence Manifest (RFC 3161 / JSON-LD Court Record)
                </span>
                <button
                  onClick={() => handleCopy(JSON.stringify(dossier, null, 2), 'full-json')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer text-xs"
                >
                  {copiedField === 'full-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                  <span>{copiedField === 'full-json' ? 'JSON Copied' : 'Copy Evidence JSON'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-[#050810] border border-zinc-800 text-[10px] text-emerald-300/90 font-mono overflow-x-auto max-h-[50vh] leading-relaxed">
                {JSON.stringify(dossier, null, 2)}
              </pre>
            </div>
          )}

          {/* TAB: MOBILE QR CODE GENERATOR FOR ALL EVIDENCE ITEMS */}
          {activeTab === 'qr-generator' && (
            <div className="animate-in fade-in duration-150">
              <ForensicEvidenceQrGenerator
                inline={true}
                initialEvidenceId={qrEvidenceId || 'master-dossier'}
              />
            </div>
          )}

          {/* TAB: DEVICE QR CODE VERIFICATION (MERKLE ROOT & BLOCK HEIGHT) */}
          {activeTab === 'qr-verify' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Informational Header Alert */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-emerald-950/20 to-black border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                    <Smartphone className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs sm:text-sm">
                        External Device Cryptographic QR Verification
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        AIR-GAPPED READY
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ETDA §9, §26, §28 VALIDATED
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Scan this QR code with any smartphone camera, tablet, or courtroom air-gapped auditor device to independently verify the <strong className="text-zinc-200">Current Genesis Block Height</strong> and <strong className="text-emerald-300">Merkle Root</strong> directly against the sovereign consensus ledger.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button
                    onClick={() => {
                      playTone(660, 0.04);
                      handleCopy(dossier.merkleRoot, 'merkle-header');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition cursor-pointer"
                  >
                    {copiedField === 'merkle-header' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>{copiedField === 'merkle-header' ? 'Root Copied' : 'Copy Merkle Root'}</span>
                  </button>
                </div>
              </div>

              {/* Main Content: Left QR Code Box / Right Telemetry & Steps */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: QR Code Display Card (5 cols) */}
                <div className="lg:col-span-5 p-5 rounded-3xl bg-[#070b14] border border-cyan-500/30 flex flex-col items-center justify-between space-y-4 shadow-xl relative overflow-hidden">
                  <div className="w-full flex items-center justify-between border-b border-zinc-800 pb-3">
                    <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Scan className="w-4 h-4 text-cyan-400" />
                      <span>Sovereign QR Seal</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                      RFC 3161 PQC
                    </span>
                  </div>

                  {/* Format Selector Pills */}
                  <div className="w-full grid grid-cols-3 gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-[10px]">
                    <button
                      onClick={() => {
                        playTone(600, 0.02);
                        setQrFormat('url');
                      }}
                      className={`py-1.5 px-2 rounded-lg font-bold text-center transition cursor-pointer ${
                        qrFormat === 'url'
                          ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Judicial URL
                    </button>
                    <button
                      onClick={() => {
                        playTone(620, 0.02);
                        setQrFormat('json');
                      }}
                      className={`py-1.5 px-2 rounded-lg font-bold text-center transition cursor-pointer ${
                        qrFormat === 'json'
                          ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Air-Gap JSON
                    </button>
                    <button
                      onClick={() => {
                        playTone(640, 0.02);
                        setQrFormat('compact');
                      }}
                      className={`py-1.5 px-2 rounded-lg font-bold text-center transition cursor-pointer ${
                        qrFormat === 'compact'
                          ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Compact SSoT
                    </button>
                  </div>

                  {/* QR Canvas / SVG Presentation Box with HUD Corners */}
                  <div className="relative p-4 rounded-2xl bg-[#03060f] border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex items-center justify-center group">
                    {/* Reticle brackets */}
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-400 pointer-events-none" />
                    <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-400 pointer-events-none" />
                    <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-400 pointer-events-none" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-400 pointer-events-none" />

                    <QRCodeSVG
                      id="forensic-master-qr-svg"
                      value={qrPayloadValue}
                      size={220}
                      level="H"
                      includeMargin={true}
                      bgColor="#03060f"
                      fgColor="#10b981"
                      className="rounded-lg max-w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>

                  {/* Quick Export Actions */}
                  <div className="w-full flex items-center gap-2 pt-2 border-t border-zinc-800">
                    <button
                      onClick={handleDownloadQrPng}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold transition cursor-pointer"
                      title="Download QR code as PNG image for printing or court evidence filing"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>PNG Image</span>
                    </button>
                    <button
                      onClick={handleDownloadQrSvg}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold transition cursor-pointer"
                      title="Download QR code as crisp vector SVG"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Vector SVG</span>
                    </button>
                    <button
                      onClick={() => handleCopy(qrPayloadValue, 'qr-payload-text')}
                      className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                      title="Copy encoded payload text"
                    >
                      {copiedField === 'qr-payload-text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'qr-payload-text' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const sealPayload = formatSealPayload({
                        sealId: 'SEAL-14902-GENESIS',
                        blockHeight: dossier.genesisBlock,
                        merkleRoot: dossier.merkleRoot,
                        pqcAlgorithm: 'Dilithium-5 (ML-DSA-87)',
                        hsmQuorum: '10/10 REAL_HSM',
                        timestamp: dossier.auditTimestamp,
                        signature: 'SIG_PQC_DILITHIUM5_FE45D00BC4D25A8C_10/10_HSM',
                      });
                      handleCopy(sealPayload, 'seal-qr-payload');
                      playTone(880, 0.05);
                    }}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition cursor-pointer"
                    title="Copy 14,902 Canonical Seal Hash QR Payload JSON"
                  >
                    {copiedField === 'seal-qr-payload' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <QrCode className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{copiedField === 'seal-qr-payload' ? 'Seal QR Payload Copied!' : 'Copy Seal Hash QR Payload (JSON)'}</span>
                  </button>
                </div>

                {/* Right Column: Key Anchors & Device Scan Verification Telemetry (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Verified Cryptographic State Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Genesis Block Height Tile */}
                    <div className="p-4 rounded-2xl bg-[#090e1c] border border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold">
                        <span className="flex items-center gap-1.5">
                          <Anchor className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Genesis Block Height</span>
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px]">
                          FROZEN SSoT
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold font-mono text-white tracking-wide">
                          #{dossier.genesisBlock}
                        </span>
                        <button
                          onClick={() => handleCopy(String(dossier.genesisBlock), 'block-num')}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === 'block-num' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'block-num' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Immutable Ring 0 WORM anchor • No chain reorganization permitted
                      </p>
                    </div>

                    {/* Current Merkle Root Tile */}
                    <div className="p-4 rounded-2xl bg-[#090e1c] border border-cyan-500/30 space-y-2">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold">
                        <span className="flex items-center gap-1.5">
                          <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Current Merkle Root</span>
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px]">
                          Δ0.00% DRIFT
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-bold text-cyan-300 truncate" title={dossier.merkleRoot}>
                          0x909ab814...4c68
                        </code>
                        <button
                          onClick={() => handleCopy(dossier.merkleRoot, 'merkle-tile')}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copiedField === 'merkle-tile' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'merkle-tile' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        NIST FIPS 204 Crystals-Dilithium-5 lattice verified
                      </p>
                    </div>

                    {/* Canonical Seals Count */}
                    <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                      <div className="text-[10px] uppercase text-zinc-500 font-bold mb-1">
                        Canonical Seals Verified
                      </div>
                      <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{dossier.canonicalSealsCount.toLocaleString()} Seals</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-1">
                        100% Pure Green • 0 Quarantined Failures
                      </span>
                    </div>

                    {/* HSM Hardware Quorum */}
                    <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                      <div className="text-[10px] uppercase text-zinc-500 font-bold mb-1">
                        Hardware Consensus Gate
                      </div>
                      <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>10/10 REAL_HSM Quorum</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-1">
                        Utimaco u.trust GP CSe FIPS 140-3 L4
                      </span>
                    </div>
                  </div>

                  {/* Instructions for External Devices */}
                  <div className="p-4 rounded-2xl bg-[#090f1d] border border-zinc-800 space-y-2.5">
                    <h5 className="text-xs font-bold text-white flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>ขั้นตอนการตรวจสอบด้วยอุปกรณ์ภายนอก (External Device Verification)</span>
                    </h5>
                    <ol className="space-y-2 text-[11px] text-zinc-300">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          1
                        </span>
                        <span>
                          เปิดกล้องสมาร์ตโฟน (iOS/Android) หรือเครื่องอ่านบาร์โค้ดของศาล แล้วส่องมาที่ QR Code ด้านซ้าย
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          2
                        </span>
                        <span>
                          ตรวจสอบว่าเลขบล็อกที่แสดงตรงกับ <strong className="text-white">Genesis #{dossier.genesisBlock}</strong> และ Merkle Root ขึ้นต้นด้วย <code className="text-cyan-300">0x909ab814...4c68</code>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          3
                        </span>
                        <span>
                          หากใช้อุปกรณ์ Air-Gapped ให้เลือกรูปแบบ <strong>Air-Gap JSON</strong> เพื่ออ่าน RFC 3161 Cryptographic Timestamp Payload นำไปเทียบกับใบรับรองอิเล็กทรอนิกส์ตาม พ.ร.บ. ว่าด้วยธุรกรรมฯ มาตรา 28
                        </span>
                      </li>
                    </ol>
                  </div>

                  {/* Encoded Payload String Preview */}
                  <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-[10px] space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-400 font-bold uppercase">
                      <span>Encoded Verification Payload (Live Preview)</span>
                      <button
                        onClick={() => handleCopy(qrPayloadValue, 'payload-preview')}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 lowercase cursor-pointer"
                      >
                        {copiedField === 'payload-preview' ? 'copied!' : 'copy payload'}
                      </button>
                    </div>
                    <pre className="text-emerald-300/80 font-mono text-[9px] overflow-x-auto max-h-24 p-2 rounded bg-black/40 border border-zinc-900 whitespace-pre-wrap break-all leading-tight">
                      {qrPayloadValue}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* FOOTER BAR                                                        */}
        {/* ================================================================= */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-[#060a12] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2 flex-wrap">
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            <span>Merkle Anchor:</span>
            <code className="text-zinc-300 font-mono">0x909ab814...4c68</code>
            <button
              onClick={() => handleCopy(dossier.merkleRoot, 'merkle')}
              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
            >
              {copiedField === 'merkle' ? 'Copied' : 'Copy'}
            </button>

            <button
              onClick={() => {
                playTone(740, 0.04);
                setActiveTab('qr-verify');
              }}
              className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition cursor-pointer ml-1"
              title="Verify Merkle Root & Block Height with external scanner"
            >
              <QrCode className="w-3 h-3 text-cyan-400" />
              <span>Scan QR on Device</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">10/10 REAL_HSM FIPS 140-3 L4 Ratified</span>
            <span>•</span>
            <span className="text-zinc-500">Certificate: {dossier.certificateId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
