import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SYSTEM_METADATA, AUDIT_TRACE_TX, SYSTEM_INVARIANTS, THAI_CUSTODIANS } from '../data/canonicalData';
import { GOLD_MASTER_FORENSIC_REPORT } from '../data/goldMasterForensicReport';
import { X, CheckCircle2, ShieldAlert, Award, Copy, Check, Terminal, ExternalLink, Download, FileCheck2, Eye, Scale, Coins, Play, FileText, CheckCircle, QrCode } from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { generateMasterForensicAuditPdf, generateMasterAuditJsonLd } from '../utils/masterForensicAuditPackage';
import { generateSovereignForensicAttestationPdf } from '../utils/sovereignForensicAttestationPdf';
import {
  computeTreasuryBudget,
  downloadTreasuryAuditJson,
  generateTreasuryForensicPdf,
} from '../utils/treasuryBudgetAuditExport';
import { copyToClipboard } from '../utils/clipboard';
import QRCode from 'qrcode';
import { InteractivePdfPreviewModal } from './InteractivePdfPreviewModal';
import { OfflineSealChainQrGenerator } from './OfflineSealChainQrGenerator';

interface AuditCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditCertificateModal: React.FC<AuditCertificateModalProps> = ({ isOpen, onClose }) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedProof, setCopiedProof] = useState(false);
  const [activeTab, setActiveTab] = useState<'certificate' | 'goldMaster' | 'treasury' | 'invariants' | 'stages' | 'custodians' | 'qrGenerator'>('goldMaster');
  const [isDossierPreviewOpen, setIsDossierPreviewOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const treasuryReport = computeTreasuryBudget();

  if (!isOpen) return null;

  const handleShowQrCode = async () => {
    try {
      playTone(600, 0.05);
      const uri = `zyrquen:seal:${SYSTEM_METADATA.merkleRoot}`;
      const dataUrl = await QRCode.toDataURL(uri, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeDataUrl(dataUrl);
      setIsQrModalOpen(true);
    } catch (err) {
      console.error('Failed to generate QR Code', err);
    }
  };

  const copyMerkle = () => {
    copyToClipboard(SYSTEM_METADATA.merkleRoot);
    setCopiedHash(true);
    playAuditChime();
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const downloadJson = () => {
    const jsonLdContent = generateMasterAuditJsonLd();
    const blob = new Blob([jsonLdContent], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN-MASTER-AUDIT-PACKAGE-${SYSTEM_METADATA.sealedBlock}.jsonld`;
    a.click();
    URL.revokeObjectURL(url);
    playAuditChime();
  };

  const downloadMasterPdf = () => {
    playTone(650, 0.04);
    generateMasterForensicAuditPdf();
    playAuditChime();
  };

  const downloadCourtAttestationPdf = () => {
    playTone(720, 0.05);
    generateSovereignForensicAttestationPdf();
    playAuditChime();
  };

  const downloadTreasuryPdf = () => {
    playTone(680, 0.05);
    generateTreasuryForensicPdf(treasuryReport);
    playAuditChime();
  };

  const downloadTreasuryJson = () => {
    playTone(600, 0.03);
    downloadTreasuryAuditJson(treasuryReport);
    playAuditChime();
  };

  const downloadCertificateCsv = () => {
    playTone(600, 0.04);
    
    // Construct CSV content
    const headers = ["Category", "Metric", "Value"];
    const summaryRows = [
      ["Executive Summary", "Report Type", GOLD_MASTER_FORENSIC_REPORT.reportType],
      ["Executive Summary", "Credential ID", GOLD_MASTER_FORENSIC_REPORT.credentialId],
      ["Executive Summary", "Sovereign Principal", GOLD_MASTER_FORENSIC_REPORT.executiveSummary.sovereignPrincipal],
      ["Executive Summary", "Canonical Core Mutation", GOLD_MASTER_FORENSIC_REPORT.executiveSummary.canonicalCoreMutationDelta],
      ["Executive Summary", "Genesis Block Height", GOLD_MASTER_FORENSIC_REPORT.executiveSummary.genesisBlockHeight],
      ["Executive Summary", "Canonical Seals Count", GOLD_MASTER_FORENSIC_REPORT.executiveSummary.canonicalSealsCount.toString()],
      ["Executive Summary", "Merkle Root", GOLD_MASTER_FORENSIC_REPORT.executiveSummary.merkleRoot],
      ["Executive Summary", "Reconciliation Status", GOLD_MASTER_FORENSIC_REPORT.executiveSummary.reconciliationStatus],
    ];

    const passportHeaders = ["Passport ID", "Name", "Role", "Clearance", "Status", "SHA-256 Hash"];
    const passportRows = GOLD_MASTER_FORENSIC_REPORT.passportsMatrix.map(p => 
      [p.id, p.name, p.role, p.clearance, p.status, p.sha256]
    );

    let csvContent = "";
    csvContent += headers.join(",") + "\\n";
    summaryRows.forEach(row => {
      csvContent += row.map(v => `"${v}"`).join(",") + "\\n";
    });

    csvContent += "\\n" + passportHeaders.join(",") + "\\n";
    passportRows.forEach(row => {
      csvContent += row.map(v => `"${v}"`).join(",") + "\\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN_CERTIFICATE_AUDIT_${SYSTEM_METADATA.sealedBlock}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    playAuditChime();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="modal-slide-in relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0b0d18] border border-white/12 rounded-[28px] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Subtle Forensic Shimmer Entrance Sweep */}
        <motion.div
          initial={{ x: '-120%', opacity: 0 }}
          animate={{ x: '180%', opacity: [0, 0.45, 0] }}
          transition={{ duration: 1.3, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent skew-x-12"
        />
        {/* Modal Header */}
        <div className="stagger-1 p-6 border-b border-white/8 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-mono font-bold text-white tracking-wide">
                  GOLD MASTER CERTIFICATE & DEPLOYMENT GATE
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                  100% VERIFIED
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                ZYRQUEN Ω∞ FROZEN v1.2 LTS • Merkle Root Attestation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playTone(600, 0.04);
                setActiveTab('qrGenerator');
              }}
              className={`p-2 rounded-xl border font-mono text-xs flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] ${
                activeTab === 'qrGenerator'
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border-cyan-500/30'
              }`}
              title="Generate Offline Seal Chain Verification QR Code for External Auditors"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Offline QR</span>
            </button>
            <button
              onClick={() => {
                playTone(620, 0.04);
                setIsDossierPreviewOpen(true);
              }}
              className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/30 font-mono text-xs flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              title="Open Interactive Sovereign Dossier & PDF Preview"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Preview Dossier</span>
            </button>
            <button
              onClick={downloadCourtAttestationPdf}
              className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 font-mono text-xs flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              title="Download Court-Admissible Sovereign Forensic Attestation PDF"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Court Attestation PDF</span>
            </button>
            <button
              onClick={downloadMasterPdf}
              className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-mono text-xs flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              title="Download Master Forensic Audit PDF"
            >
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Master PDF</span>
            </button>
            <button
              onClick={downloadCertificateCsv}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-300 border border-white/10 font-mono text-xs flex items-center gap-1.5 transition-all"
              title="Export to CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={downloadJson}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 font-mono text-xs flex items-center gap-1.5 transition-all"
              title="Download Certificate JSON-LD"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Export JSON-LD</span>
            </button>
            <button
              onClick={() => {
                playTone(450, 0.04);
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="stagger-2 px-6 border-b border-white/8 bg-black/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'goldMaster', label: '🏆 Gold Master Forensic (10/10)' },
            { id: 'qrGenerator', label: '📱 Offline Verification QR' },
            { id: 'certificate', label: 'Gold Master Seal' },
            { id: 'treasury', label: 'FIOS Treasury & SSoT Δ0' },
            { id: 'invariants', label: '10 System Invariants' },
            { id: 'stages', label: '12-Stage Forensics' },
            { id: 'custodians', label: 'Thai Custodian Passports' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playTone(550, 0.04);
                setActiveTab(tab.id as any);
              }}
              className={`py-3 px-4 text-xs font-mono border-b-2 font-medium transition-all ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 bg-white/[0.02]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="stagger-3 p-6 overflow-y-auto space-y-6 flex-1 text-sm font-mono text-zinc-300">
          {activeTab === 'goldMaster' && (
            <div className="space-y-6">
              {/* Header Badge & Credential Banner */}
              <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-[#06B6D4]/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold">
                      🏆 GOLD MASTER FULL QUORUM (10/10)
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      🔓 PROMOTION G11-G13 UNLOCKED
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px]">
                      {GOLD_MASTER_FORENSIC_REPORT.engineVersion}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="./zyrquen_master_forensic_audit_agentic_artifact_1_4e1b77b4ffb8.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-xs flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Open Standalone HTML</span>
                    </a>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    {GOLD_MASTER_FORENSIC_REPORT.reportType}
                  </h3>
                  <div className="text-xs text-cyan-400 mt-1 break-all select-all">
                    Credential ID: {GOLD_MASTER_FORENSIC_REPORT.credentialId}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Standard: {GOLD_MASTER_FORENSIC_REPORT.auditStandard}
                  </div>
                </div>
              </div>

              {/* 6 Metric Forensics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#070a12] border border-white/8 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Sovereign Principal</div>
                  <div className="text-sm font-bold text-[#D4AF37]">
                    {GOLD_MASTER_FORENSIC_REPORT.executiveSummary.sovereignPrincipal}
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    {GOLD_MASTER_FORENSIC_REPORT.executiveSummary.clearance}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#070a12] border border-white/8 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Canonical Core Mutation</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {GOLD_MASTER_FORENSIC_REPORT.executiveSummary.canonicalCoreMutationDelta}
                  </div>
                  <div className="text-[11px] text-zinc-400">Zero Mutation / SSoT Δ0 Invariant Safe</div>
                </div>

                <div className="p-4 rounded-xl bg-[#070a12] border border-white/8 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Genesis Block Height</div>
                  <div className="text-sm font-bold text-white">
                    {GOLD_MASTER_FORENSIC_REPORT.executiveSummary.genesisBlockHeight}
                  </div>
                  <div className="text-[11px] text-zinc-400">Frozen Epoch Anchor (LOCKED)</div>
                </div>

                <div className="p-4 rounded-xl bg-[#070a12] border border-white/8 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Canonical Seals Verified</div>
                  <div className="text-sm font-bold text-cyan-300">
                    {GOLD_MASTER_FORENSIC_REPORT.executiveSummary.canonicalSealsCount.toLocaleString()} Seals
                  </div>
                  <div className="text-[11px] text-emerald-400">100% Immutable Verified</div>
                </div>

                <div className="p-4 rounded-xl bg-[#070a12] border border-white/8 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Forensic Quarantine (Ring-04)</div>
                  <div className="text-sm font-bold text-amber-300">
                    {GOLD_MASTER_FORENSIC_REPORT.executiveSummary.forensicQuarantineRange}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {GOLD_MASTER_FORENSIC_REPORT.executiveSummary.quarantineIsolation}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#070a12] border border-white/8 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Reconciliation Status</div>
                  <div className="text-xs font-bold text-emerald-300 truncate">
                    {GOLD_MASTER_FORENSIC_REPORT.executiveSummary.reconciliationStatus}
                  </div>
                  <div className="text-[11px] text-cyan-400">Zero Core Intrusion</div>
                </div>
              </div>

              {/* Merkle Root Box */}
              <div className="p-4 rounded-xl bg-[#070a12] border border-[#06B6D4]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <span>🔗</span>
                    <span>CANONICAL MERKLE ROOT</span>
                  </span>
                  <button
                    onClick={() => {
                      copyToClipboard(GOLD_MASTER_FORENSIC_REPORT.executiveSummary.merkleRoot);
                      setCopiedHash(true);
                      playAuditChime();
                      setTimeout(() => setCopiedHash(false), 2000);
                    }}
                    className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 bg-black/60 rounded-lg text-xs font-mono text-cyan-300 break-all select-all">
                  {GOLD_MASTER_FORENSIC_REPORT.executiveSummary.merkleRoot}
                </div>
              </div>

              {/* 10 Passports Table */}
              <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>👑</span>
                    <span>10 Official Gold Master Custodian Passports (10/10 VERIFIED)</span>
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">100% Attested</span>
                </div>

                <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[#D4AF37] text-[11px]">
                        <th className="py-2.5 px-3">PASSPORT ID</th>
                        <th className="py-2.5 px-3">CUSTODIAN NAME & ROLE</th>
                        <th className="py-2.5 px-3">CLEARANCE</th>
                        <th className="py-2.5 px-3">KEY HASH SIGNATURE (SHA-256)</th>
                        <th className="py-2.5 px-3">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {GOLD_MASTER_FORENSIC_REPORT.passportsMatrix.map((p) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-3 font-bold text-[#D4AF37] whitespace-nowrap">
                            {p.id}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-200">
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-[11px] text-zinc-400">{p.role}</div>
                          </td>
                          <td className="py-2.5 px-3 text-cyan-300 whitespace-nowrap text-[11px]">
                            {p.clearance}
                          </td>
                          <td className="py-2.5 px-3 text-cyan-400 font-mono text-[10px] break-all max-w-[280px]">
                            SHA256:{p.sha256}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              🟢 {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Master Proof & Dilithium-5 JWS */}
              <div className="p-5 rounded-2xl bg-[#070a12] border border-[#06B6D4]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔐</span>
                    <span>Post-Quantum Master Proof & JWS Attestation</span>
                  </span>
                  <button
                    onClick={() => {
                      copyToClipboard(JSON.stringify(GOLD_MASTER_FORENSIC_REPORT.masterProof, null, 2));
                      setCopiedProof(true);
                      playAuditChime();
                      setTimeout(() => setCopiedProof(false), 2000);
                    }}
                    className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
                  >
                    {copiedProof ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedProof ? 'Copied Proof' : 'Copy JSON'}</span>
                  </button>
                </div>
                <div className="p-3.5 bg-black/70 rounded-xl text-xs font-mono text-cyan-300 space-y-1">
                  <div><span className="text-zinc-500">type:</span> {GOLD_MASTER_FORENSIC_REPORT.masterProof.type}</div>
                  <div><span className="text-zinc-500">verificationMethod:</span> {GOLD_MASTER_FORENSIC_REPORT.masterProof.verificationMethod}</div>
                  <div className="break-all"><span className="text-zinc-500">jws:</span> {GOLD_MASTER_FORENSIC_REPORT.masterProof.jws}</div>
                  <div className="break-all"><span className="text-zinc-500">merkleLeafProof:</span> {GOLD_MASTER_FORENSIC_REPORT.masterProof.merkleLeafProof}</div>
                </div>
              </div>

              {/* Evidence Source Files List */}
              <div className="p-4 rounded-xl bg-[#070a12] border border-white/8 space-y-2">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📑</span>
                  <span>Consolidated Evidence Source Files (7 Files)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                  {GOLD_MASTER_FORENSIC_REPORT.sourceFiles.map((sf, idx) => (
                    <div key={idx} className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-center gap-2">
                      <span className="text-cyan-400">📄</span>
                      <span className="font-mono text-[11px] truncate">{sf}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signer Footer */}
              <div className="p-4 rounded-xl bg-[#0a0f1e] border border-[#D4AF37]/30 text-xs text-[#D4AF37] flex items-center justify-between">
                <div>
                  <strong>Signed & Sealed By:</strong> {GOLD_MASTER_FORENSIC_REPORT.signedBy}
                </div>
                <div className="text-emerald-400 font-bold">
                  PASS 10/10
                </div>
              </div>
            </div>
          )}

          {activeTab === 'certificate' && (
            <div className="space-y-6">
              {/* Master Merkle Hash Banner */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Merkle Root Hash (SHA-256)</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShowQrCode}
                      className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 transition-all"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR Code</span>
                    </button>
                    <button
                      onClick={copyMerkle}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/20"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-black/60 rounded-xl border border-white/5 font-mono text-xs sm:text-sm text-cyan-300 break-all select-all">
                  {SYSTEM_METADATA.merkleRoot}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="text-zinc-500 text-[10px]">SEALED BLOCK</div>
                    <div className="text-zinc-100 font-bold mt-0.5">#{SYSTEM_METADATA.sealedBlock}</div>
                  </div>
                  <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="text-zinc-500 text-[10px]">TOTAL SEALS</div>
                    <div className="text-emerald-400 font-bold mt-0.5">{SYSTEM_METADATA.totalVerifiedSeals.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="text-zinc-500 text-[10px]">BASELINE DRIFT</div>
                    <div className="text-zinc-100 font-bold mt-0.5">{SYSTEM_METADATA.baselineDrift}</div>
                  </div>
                  <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="text-zinc-500 text-[10px]">SSOT MUTATION</div>
                    <div className="text-emerald-400 font-bold mt-0.5">{SYSTEM_METADATA.ssotMutation}</div>
                  </div>
                </div>
              </div>

              {/* 4-Layer Manifesto Envelope */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/8 space-y-3">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  THE 4-LAYER ARCHITECTURAL MANIFESTO (V1.21 PROTOCOL)
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  "TEST COVERAGE ↑ ≠ CANONICAL TRUTH ↑" — All verification, telemetry, analytics, visualization,
                  governance, recovery, and export operations are non-authoritative with respect to the Canonical
                  Truth Plane (v1.2 LTS). Extension plane expansions occur without mutating the locked core state.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                    <span className="text-zinc-400">Layer 1: Canonical SSoT Core</span>
                    <span className="text-emerald-400 font-semibold">🔒 FROZEN</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                    <span className="text-zinc-400">Layer 2: Verification Engine</span>
                    <span className="text-cyan-400 font-semibold">31 PHASES</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                    <span className="text-zinc-400">Layer 3: Adversarial Shield</span>
                    <span className="text-violet-400 font-semibold">5 BLOCKED (SIM)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                    <span className="text-zinc-400">Layer 4: Extension Plane</span>
                    <span className="text-amber-400 font-semibold">NON-AUTHORITATIVE</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'treasury' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Treasury Summary Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-indigo-500/10 border border-amber-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                        SSoT Δ0 ZERO-DRIFT VERIFIED (0.00%)
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                        10/10 REAL_HSM RATIFIED
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 pt-1">
                      <Coins className="w-4 h-4 text-amber-400" />
                      FIOS Treasury Budget Allocation & Mathematical Proof ($N_c \times V_c$)
                    </h3>
                    <p className="text-xs text-zinc-400 font-sans">
                      การจัดสรรงบประมาณ Gas Pool ฿12,500,000.00 THB บนฐานประชากร 70,000,000 คน โดยมีความคลาดเคลื่อนสัมบูรณ์ ฿0.0000000000 THB
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={downloadTreasuryPdf}
                      className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] font-sans"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Export Treasury PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadTreasuryJson}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all font-sans"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>JSON Proof</span>
                    </button>
                  </div>
                </div>

                {/* 4 Metric Boxes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                    <span className="text-zinc-500 text-[10px] block">TOTAL POPULATION</span>
                    <span className="text-white font-bold mt-0.5 block">70,000,000 Users</span>
                  </div>
                  <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                    <span className="text-zinc-500 text-[10px] block">TOTAL PORTFOLIO VALUE</span>
                    <span className="text-amber-300 font-bold mt-0.5 block">฿1,424,080,000.00 THB</span>
                  </div>
                  <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                    <span className="text-zinc-500 text-[10px] block">TOTAL GAS POOL FUND</span>
                    <span className="text-cyan-300 font-bold mt-0.5 block">฿12,500,000.00 THB</span>
                  </div>
                  <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                    <span className="text-zinc-500 text-[10px] block">ABSOLUTE DRIFT DELTA</span>
                    <span className="text-emerald-400 font-bold mt-0.5 block">0.0000% (Δ0.00 THB)</span>
                  </div>
                </div>
              </div>

              {/* Allocations Table */}
              <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Chain Model Segment Allocations (Nc x Vc)
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold">100.00% Fully Distributed</span>
                </div>

                <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                  <table className="w-full min-w-[700px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-500 text-[10px]">
                        <th className="py-2 px-3">SEGMENT</th>
                        <th className="py-2 px-3">TARGET USERS (Nc)</th>
                        <th className="py-2 px-3">RATE (Vc)</th>
                        <th className="py-2 px-3">MARKET VALUE (THB)</th>
                        <th className="py-2 px-3">WEIGHT</th>
                        <th className="py-2 px-3">ALLOCATED GAS (THB)</th>
                        <th className="py-2 px-3">REFUND/USER</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {treasuryReport.allocations.map((row) => (
                        <tr key={row.segment} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-3 font-medium text-white">
                            <div>{row.segment}</div>
                            <div className="text-[10px] text-zinc-500 font-sans">{row.nameTh}</div>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400">
                            {row.nc.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300">
                            ฿{row.vc.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-amber-300 font-mono">
                            ฿{row.segmentValueThb.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300">
                            {row.weightPct.toFixed(4)}%
                          </td>
                          <td className="py-2.5 px-3 text-cyan-300 font-bold font-mono">
                            ฿{row.allocatedGasThb.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-emerald-400 font-mono">
                            ฿{row.perCapitaRefundThb.toFixed(5)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-white/[0.03] font-bold text-white border-t border-white/10">
                        <td className="py-2.5 px-3 text-emerald-300">SUM (SSoT Δ0)</td>
                        <td className="py-2.5 px-3">36,225,000</td>
                        <td className="py-2.5 px-3">—</td>
                        <td className="py-2.5 px-3 text-amber-300">฿1,424,080,000.00</td>
                        <td className="py-2.5 px-3">100.00%</td>
                        <td className="py-2.5 px-3 text-cyan-300">฿12,500,000.00</td>
                        <td className="py-2.5 px-3 text-emerald-300">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legal Admissibility Box */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/8 space-y-3">
                <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  Thai Statutory Compliance & Court Admissibility (ETDA B.E. 2544)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-300 font-bold">ETDA Section 9 (General e-Signature)</span>
                      <span className="text-emerald-400 font-bold text-[10px]">PASSED</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Identity Bound & Explicit Sovereign Principal Consent (#EP-SOVEREIGN-01)
                    </p>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-300 font-bold">ETDA Section 26 (Secure Digital Signature)</span>
                      <span className="text-emerald-400 font-bold text-[10px]">PASSED</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      NIST FIPS 204 ML-DSA-87 Dilithium-5 Post-Quantum Cryptographic Proof
                    </p>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-300 font-bold">ETDA Section 28 (Sovereign CA & Ledger)</span>
                      <span className="text-emerald-400 font-bold text-[10px]">PASSED</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      10/10 Hardware Deca-Key Quorum (FIPS 140-3 Level 4 HSM Sealed)
                    </p>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-300 font-bold">PDPA B.E. 2562 (Sections 9, 26, 28)</span>
                      <span className="text-emerald-400 font-bold text-[10px]">PASSED</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Zero-Knowledge Privacy Proofs & Immutable Merkle Attestation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invariants' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span>10 / 10 Canonical Invariants Fully Satisfied</span>
                <span className="text-emerald-400">0 Violations</span>
              </div>
              {SYSTEM_INVARIANTS.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/6 hover:border-white/12 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-zinc-200">{inv.code}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">
                        {inv.layer}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-sans pl-6">{inv.description}</p>
                  </div>
                  <div className="pl-6 sm:pl-0 font-mono text-[11px] text-cyan-400/80 shrink-0">
                    {inv.verificationHash}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stages' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
                <div className="font-bold text-cyan-300">Transaction: {AUDIT_TRACE_TX.txId}</div>
                <div className="text-zinc-400 mt-0.5">
                  {AUDIT_TRACE_TX.title} • Latency: {AUDIT_TRACE_TX.totalLatencyMs}ms • Sealed Block #{AUDIT_TRACE_TX.sealedLedgerBlock}
                </div>
              </div>
              <div className="space-y-2">
                {AUDIT_TRACE_TX.stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/6 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[11px] text-cyan-300">
                        {stage.stageNumber}
                      </span>
                      <div>
                        <div className="font-bold text-zinc-200">{stage.name}</div>
                        <div className="text-zinc-400 text-[11px] font-sans">{stage.shortDesc}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-mono">
                      <span>{stage.durationMs}ms</span>
                      <span className="text-cyan-400">{stage.outputHash.slice(0, 16)}...</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                        {stage.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'custodians' && (
            <div className="space-y-3">
              {THAI_CUSTODIANS.map((cust) => (
                <div
                  key={cust.id}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🇹🇭</span>
                      <span className="text-sm font-bold text-zinc-100">{cust.nameTh}</span>
                      <span className="text-xs text-zinc-400 font-mono">({cust.nameEn})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                      {cust.passportNumber}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400">{cust.roleTh}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] text-zinc-500">
                    <div>
                      <span className="text-zinc-400">Clearance:</span> {cust.clearanceLevel}
                    </div>
                    <div className="truncate">
                      <span className="text-zinc-400">Key:</span> {cust.keyFingerprint}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'qrGenerator' && (
            <OfflineSealChainQrGenerator />
          )}
        </div>
      </motion.div>

      {/* QR Code Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsQrModalOpen(false)}>
          <div className="bg-[#0b0d18] border border-cyan-500/30 p-6 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col items-center gap-4 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsQrModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-1">
              <h3 className="text-cyan-400 font-bold text-sm tracking-widest">CRYPTOGRAPHIC SEAL URI</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Scan to verify Sovereign Block #{SYSTEM_METADATA.sealedBlock}</p>
            </div>
            <div className="p-3 bg-white rounded-xl">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Merkle Root QR Code" className="w-48 h-48 object-contain" />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center animate-pulse rounded-xl" />
              )}
            </div>
            <div className="text-[9px] text-zinc-500 font-mono text-center max-w-[200px] break-all">
              zyrquen:seal:{SYSTEM_METADATA.merkleRoot}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Sovereign PDF Dossier Preview Modal */}
      <InteractivePdfPreviewModal
        isOpen={isDossierPreviewOpen}
        onClose={() => setIsDossierPreviewOpen(false)}
      />
    </div>
  );
};
