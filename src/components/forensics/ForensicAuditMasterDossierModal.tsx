import React, { useState, useMemo } from 'react';
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
  Camera,
  Search,
  FileCheck2,
  Filter,
} from 'lucide-react';
import {
  FORENSIC_DOSSIER_V9,
  TechnicalPillar,
  ForensicAuditStep,
  StatutoryLegalAlignment,
} from '../../data/forensicAuditMasterDossierData';
import {
  downloadMasterForensicDossierV9Pdf,
  downloadEvidenceManifestPdf,
} from '../../utils/forensicDossierPdfExport';
import { safeCopyToClipboard } from '../../utils/clipboard';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import {
  ForensicEvidenceQrGenerator,
  buildAllForensicEvidenceItems,
  ForensicEvidenceItem,
} from './ForensicEvidenceQrGeneratorModal';
import { ForensicEvidenceQrScanner } from './ForensicEvidenceQrScanner';

export type DossierModalTab =
  | 'pillars'
  | 'audit-trail'
  | 'manifest'
  | 'scanner'
  | 'legal'
  | 'qr-generator'
  | 'raw-json';

export interface ForensicAuditMasterDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: DossierModalTab;
}

export const ForensicAuditMasterDossierModal: React.FC<ForensicAuditMasterDossierModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'pillars',
}) => {
  const [activeTab, setActiveTab] = useState<DossierModalTab>(initialTab);
  const [selectedStep, setSelectedStep] = useState<ForensicAuditStep | null>(null);
  const [selectedManifestItem, setSelectedManifestItem] = useState<ForensicEvidenceItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isExportingDossierPdf, setIsExportingDossierPdf] = useState(false);
  const [isExportingManifestPdf, setIsExportingManifestPdf] = useState(false);
  const [qrEvidenceId, setQrEvidenceId] = useState<string>('master-dossier');
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [manifestSearch, setManifestSearch] = useState<string>('');
  const [manifestTypeFilter, setManifestTypeFilter] = useState<string>('ALL');

  const dossier = FORENSIC_DOSSIER_V9;
  const allEvidenceItems = useMemo(() => buildAllForensicEvidenceItems(dossier), [dossier]);

  // Filtered evidence items for Manifest Tab
  const filteredEvidenceItems = useMemo(() => {
    return allEvidenceItems.filter((item) => {
      const matchesType = manifestTypeFilter === 'ALL' || item.type === manifestTypeFilter;
      const matchesSearch =
        !manifestSearch.trim() ||
        item.title.toLowerCase().includes(manifestSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(manifestSearch.toLowerCase()) ||
        item.statute.toLowerCase().includes(manifestSearch.toLowerCase()) ||
        item.merkleHash.toLowerCase().includes(manifestSearch.toLowerCase()) ||
        item.cryptographicScheme.toLowerCase().includes(manifestSearch.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [allEvidenceItems, manifestTypeFilter, manifestSearch]);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    safeCopyToClipboard(text);
    setCopiedField(fieldName);
    playTone(680, 0.04);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenQrForEvidence = (evidenceId: string) => {
    setQrEvidenceId(evidenceId);
    setIsQrModalOpen(true);
    playTone(620, 0.04);
  };

  const handleDownloadDossierPdf = () => {
    setIsExportingDossierPdf(true);
    playAuditChime();
    try {
      downloadMasterForensicDossierV9Pdf(FORENSIC_DOSSIER_V9);
    } finally {
      setIsExportingDossierPdf(false);
    }
  };

  const handleDownloadManifestPdf = () => {
    setIsExportingManifestPdf(true);
    playAuditChime();
    try {
      downloadEvidenceManifestPdf(FORENSIC_DOSSIER_V9, allEvidenceItems);
    } finally {
      setIsExportingManifestPdf(false);
    }
  };

  const handleScannerEvidenceSelect = (evidenceId: string, item: ForensicEvidenceItem) => {
    setSelectedManifestItem(item);
    if (item.type === 'AUDIT_STEP') {
      const stepNumber = parseInt(item.id.replace('step-', ''), 10);
      const stepObj = dossier.steps.find((s) => s.step === stepNumber);
      if (stepObj) setSelectedStep(stepObj);
    }
  };

  return (
    <div
      id="forensic-master-dossier-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl font-mono text-zinc-100 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl bg-[#080d16] bg-theme-card border border-emerald-500/40 border-theme rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden flex flex-col max-h-[92vh] transition-all text-theme"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================================= */}
        {/* HEADER BAR                                                        */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/30 border-theme bg-[#060a12] bg-theme-surface flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
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
                Executive Passport <strong className="text-zinc-200">{dossier.passportId}</strong> • Genesis #{dossier.genesisBlock} • 14,902 Canonical Seals • 22 Evidence Anchors
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Scan Physical Label (QR) Button */}
            <button
              id="btn-scan-evidence-qr"
              onClick={() => {
                setActiveTab('scanner');
                playTone(550, 0.04);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer active:scale-95 shadow-sm ${
                activeTab === 'scanner'
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300'
              }`}
              title="Scan physical hardware QR labels using device camera"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan Label (QR)</span>
            </button>

            {/* Download Evidence Manifest Button */}
            <button
              id="btn-download-evidence-manifest"
              onClick={handleDownloadManifestPdf}
              disabled={isExportingManifestPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-bold text-xs transition cursor-pointer active:scale-95 shadow-sm"
              title="Download official signed PDF inventory of all listed evidence items (Evidence Manifest)"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Download Evidence Manifest</span>
            </button>

            {/* Export Court Dossier PDF Button */}
            <button
              id="btn-download-dossier-pdf"
              onClick={handleDownloadDossierPdf}
              disabled={isExportingDossierPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold text-xs transition cursor-pointer active:scale-95 shadow-sm"
              title="Download official court-admissible PDF dossier"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Dossier PDF</span>
            </button>

            {/* Close Button */}
            <button
              id="btn-close-dossier-modal"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TAB NAVIGATION CONTROLS                                           */}
        {/* ================================================================= */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-zinc-800 bg-[#090e1a] overflow-x-auto text-xs scrollbar-none">
          <button
            id="tab-btn-pillars"
            onClick={() => setActiveTab('pillars')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'pillars'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Core Pillars (4)</span>
          </button>

          <button
            id="tab-btn-audit-trail"
            onClick={() => setActiveTab('audit-trail')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'audit-trail'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>16-Step Audit Trail</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            id="tab-btn-manifest"
            onClick={() => setActiveTab('manifest')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'manifest'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Evidence Manifest</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {allEvidenceItems.length} ITEMS
            </span>
          </button>

          <button
            id="tab-btn-scanner"
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'scanner'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scan Evidence Label</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </button>

          <button
            id="tab-btn-legal"
            onClick={() => setActiveTab('legal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'legal'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Statutory Legal (ETDA / PDPA)</span>
          </button>

          <button
            id="tab-btn-qr-generator"
            onClick={() => setActiveTab('qr-generator')}
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
            id="tab-btn-raw-json"
            onClick={() => setActiveTab('raw-json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'raw-json'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Raw JSON</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB BODY CONTAINER                                                */}
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
                        <span className="text-zinc-500">Status Verification</span>
                        <span className="font-bold text-emerald-400">{pillar.status}</span>
                      </div>
                      <button
                        id={`btn-qr-${pillar.id}`}
                        onClick={() => handleOpenQrForEvidence(pillar.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-800/60 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] transition cursor-pointer"
                        title={`Generate QR Code to verify ${pillar.pillarNumber} on mobile device`}
                      >
                        <QrCode className="w-3 h-3" />
                        <span>QR Seal</span>
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
                                className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-800/60 border border-emerald-500/40 text-[10px] text-emerald-300 flex items-center gap-1 transition cursor-pointer"
                                title={`Generate QR Code for Step #${s.step} to verify on mobile device`}
                              >
                                <QrCode className="w-3 h-3" />
                                <span>QR</span>
                              </button>
                              <button
                                id={`btn-hash-step-${s.step}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(s.merkleHash, `hash-${s.step}`);
                                }}
                                className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-[10px] text-zinc-300 transition"
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
                      className="text-zinc-400 hover:text-white cursor-pointer"
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
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800 flex-wrap gap-2">
                    <button
                      id={`btn-drawer-qr-step-${selectedStep.step}`}
                      onClick={() => handleOpenQrForEvidence(`step-${selectedStep.step}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold text-xs transition cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Verify Step #{selectedStep.step} via Mobile QR Code</span>
                    </button>
                    <button
                      onClick={() => handleCopy(selectedStep.merkleHash, `step-drawer-hash-${selectedStep.step}`)}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition cursor-pointer flex items-center gap-1"
                    >
                      {copiedField === `step-drawer-hash-${selectedStep.step}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                      <span>{copiedField === `step-drawer-hash-${selectedStep.step}` ? 'Copied' : 'Copy Hash'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EVIDENCE MANIFEST INVENTORY (ALL LISTED EVIDENCE ITEMS) */}
          {activeTab === 'manifest' && (
            <div className="space-y-4">
              {/* Manifest Header Controls */}
              <div className="p-4 rounded-2xl bg-[#090e1c] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">
                      Signed Evidence Manifest Inventory (RFC 3161 / ETDA Standards)
                    </h3>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Full judicial inventory of {allEvidenceItems.length} verifiable proof anchors bound to Genesis Merkle Root.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-manifest-download-pdf-inner"
                    onClick={handleDownloadManifestPdf}
                    disabled={isExportingManifestPdf}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-bold text-xs transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Signed PDF Manifest</span>
                  </button>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  {[
                    { id: 'ALL', label: 'All Items' },
                    { id: 'MASTER_DOSSIER', label: 'Master Root' },
                    { id: 'AUDIT_STEP', label: '16 Audit Steps' },
                    { id: 'TECHNICAL_PILLAR', label: '4 Pillars' },
                    { id: 'LEGAL_ALIGNMENT', label: 'Statutory Legal' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setManifestTypeFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                        manifestTypeFilter === filter.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={manifestSearch}
                    onChange={(e) => setManifestSearch(e.target.value)}
                    placeholder="Search code, title, hash..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Manifest Table */}
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-[#090e1a]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-[#060a14] text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-3 text-center w-12">#</th>
                        <th className="p-3 w-28">Ref Code</th>
                        <th className="p-3">Evidence Item Title</th>
                        <th className="p-3">Statutory Anchor</th>
                        <th className="p-3">PQC Scheme / Hardware</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {filteredEvidenceItems.map((item, index) => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedManifestItem(item)}
                          className={`hover:bg-cyan-950/20 transition cursor-pointer ${
                            selectedManifestItem?.id === item.id ? 'bg-cyan-950/30' : ''
                          }`}
                        >
                          <td className="p-3 text-center text-zinc-500 font-bold">{index + 1}</td>
                          <td className="p-3 font-mono font-bold text-cyan-400">{item.code}</td>
                          <td className="p-3 font-bold text-zinc-100">
                            <div>{item.title}</div>
                            <div className="text-[10px] text-zinc-400 font-normal mt-0.5">{item.category}</div>
                          </td>
                          <td className="p-3 text-zinc-300">{item.statute}</td>
                          <td className="p-3 text-zinc-400 font-mono text-[10px]">
                            <span className="text-emerald-300 block">{item.cryptographicScheme}</span>
                            <span className="text-zinc-500">{item.enclaveHardware}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenQrForEvidence(item.id);
                                }}
                                className="px-2 py-1 rounded bg-cyan-950/60 hover:bg-cyan-800/60 border border-cyan-500/40 text-[10px] text-cyan-300 flex items-center gap-1 transition cursor-pointer"
                                title="Open QR Verifier for this item"
                              >
                                <QrCode className="w-3 h-3" />
                                <span>QR</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(item.merkleHash, `manifest-hash-${item.id}`);
                                }}
                                className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-[10px] text-zinc-300 transition"
                                title="Copy Merkle Hash"
                              >
                                {copiedField === `manifest-hash-${item.id}` ? 'Copied' : 'Hash'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Selected Manifest Item Detail Drawer */}
              {selectedManifestItem && (
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-cyan-500/40 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-bold text-white text-xs">
                      {selectedManifestItem.code}: {selectedManifestItem.title}
                    </span>
                    <button
                      onClick={() => setSelectedManifestItem(null)}
                      className="text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedManifestItem.description && (
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      {selectedManifestItem.description}
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-zinc-400 pt-1">
                    <div>Hardware Enclave: <strong className="text-zinc-200">{selectedManifestItem.enclaveHardware}</strong></div>
                    <div>Statutory Law: <strong className="text-cyan-300">{selectedManifestItem.statute}</strong></div>
                    <div className="col-span-full break-all">
                      Proof Merkle Hash: <code className="text-emerald-300">{selectedManifestItem.merkleHash}</code>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800 flex-wrap gap-2">
                    <button
                      onClick={() => handleOpenQrForEvidence(selectedManifestItem.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-bold text-xs transition cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Verify {selectedManifestItem.code} via QR Code</span>
                    </button>
                    <button
                      onClick={() => handleCopy(selectedManifestItem.merkleHash, `manifest-detail-hash-${selectedManifestItem.id}`)}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition cursor-pointer flex items-center gap-1"
                    >
                      {copiedField === `manifest-detail-hash-${selectedManifestItem.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                      <span>{copiedField === `manifest-detail-hash-${selectedManifestItem.id}` ? 'Copied' : 'Copy Hash'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PHYSICAL EVIDENCE QR CAMERA SCANNER */}
          {activeTab === 'scanner' && (
            <div className="animate-in fade-in duration-150">
              <ForensicEvidenceQrScanner
                inline={true}
                onSelectEvidence={handleScannerEvidenceSelect}
                onOpenQrGenerator={handleOpenQrForEvidence}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            </div>
          )}

          {/* TAB 5: STATUTORY LEGAL ALIGNMENT */}
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
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold text-xs transition cursor-pointer shrink-0"
                        title={`Generate QR Code to verify ${item.section} on mobile device`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Verify on Mobile (QR)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: MOBILE QR CODE GENERATOR FOR ALL EVIDENCE ITEMS */}
          {activeTab === 'qr-generator' && (
            <div className="animate-in fade-in duration-150">
              <ForensicEvidenceQrGenerator
                inline={true}
                initialEvidenceId={qrEvidenceId || 'master-dossier'}
              />
            </div>
          )}

          {/* TAB 7: RAW EVIDENCE JSON */}
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
        </div>

        {/* ================================================================= */}
        {/* FOOTER BAR                                                        */}
        {/* ================================================================= */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-[#060a12] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            <span>Merkle Anchor:</span>
            <code className="text-zinc-300 font-mono">0x909ab814...4c68</code>
            <button
              onClick={() => handleCopy(dossier.merkleRoot, 'merkle')}
              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
            >
              {copiedField === 'merkle' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">10/10 REAL_HSM FIPS 140-3 L4 Ratified</span>
            <span>•</span>
            <span className="text-zinc-500">Certificate: {dossier.certificateId}</span>
          </div>
        </div>

        {/* Standalone Focused QR Generator Modal Overlay */}
        <ForensicEvidenceQrGenerator
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          initialEvidenceId={qrEvidenceId}
        />
      </div>
    </div>
  );
};
