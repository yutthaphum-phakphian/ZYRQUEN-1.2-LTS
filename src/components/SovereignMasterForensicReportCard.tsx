import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Award,
  FileText,
  Download,
  Copy,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Hash,
  Scale,
  Cpu,
  Key,
} from 'lucide-react';
import { GOLD_MASTER_FORENSIC_REPORT } from '../data/goldMasterForensicReport';
import { generateMasterAuditJsonLd, generateMasterForensicAuditPdf } from '../utils/masterForensicAuditPackage';
import { copyToClipboard } from '../utils/clipboard';
import { playTone, playAuditChime } from './AudioSynthesizer';

export const SovereignMasterForensicReportCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldId: string) => {
    copyToClipboard(text);
    setCopiedField(fieldId);
    playTone(600, 0.04);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadPdf = () => {
    playAuditChime();
    const pdfDataUrl = generateMasterForensicAuditPdf();
    const link = document.createElement('a');
    link.href = pdfDataUrl;
    link.download = `ZYRQUEN_Master_Forensic_Audit_849202_${Date.now()}.pdf`;
    link.click();
  };

  const handleCopyJsonLd = () => {
    const jsonLd = generateMasterAuditJsonLd();
    copyToClipboard(jsonLd);
    setCopiedField('jsonld');
    playTone(700, 0.05);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const { executiveSummary, passportsMatrix, complianceFramework, masterProof, sourceFiles } = GOLD_MASTER_FORENSIC_REPORT;

  return (
    <section
      id="sovereign-master-forensic-report-card"
      className="p-6 rounded-[28px] bg-[#070a12] border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.12)] space-y-6 font-mono text-xs text-zinc-300"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/20 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border-emerald-500/40 flex items-center justify-center text-xl shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            🏆
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base text-white tracking-wide">
                {GOLD_MASTER_FORENSIC_REPORT.reportType}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                {GOLD_MASTER_FORENSIC_REPORT.auditStatus}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Credential ID: <code className="text-[#06B6D4]">{GOLD_MASTER_FORENSIC_REPORT.credentialId}</code></span>
              <span>•</span>
              <span>Engine: <strong className="text-white">{GOLD_MASTER_FORENSIC_REPORT.engineVersion}</strong></span>
              <span>•</span>
              <span className="text-[#D4AF37] font-bold">Promotion Gate: {GOLD_MASTER_FORENSIC_REPORT.promotionGateStatus}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyJsonLd}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-[11px] text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            {copiedField === 'jsonld' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copiedField === 'jsonld' ? 'JSON-LD Copied' : 'Copy JSON-LD'}</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-[11px] text-emerald-300 font-bold flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Audit PDF</span>
          </button>
          <button
            onClick={() => {
              playTone(isExpanded ? 480 : 640, 0.04);
              setIsExpanded(!isExpanded);
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 transition cursor-pointer"
            title={isExpanded ? 'Collapse Report' : 'Expand Report'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-[#0a0f1e] rounded-2xl border-white/10 space-y-0.5">
              <div className="text-[10px] text-zinc-500">SOVEREIGN PRINCIPAL</div>
              <div className="text-xs font-bold text-white truncate">{executiveSummary.sovereignPrincipal}</div>
              <div className="text-[9px] text-[#D4AF37]">{executiveSummary.clearance}</div>
            </div>

            <div className="p-3 bg-[#0a0f1e] rounded-2xl border-white/10 space-y-0.5">
              <div className="text-[10px] text-zinc-500">MUTATION DELTA</div>
              <div className="text-xs font-bold text-emerald-400">{executiveSummary.canonicalCoreMutationDelta}</div>
              <div className="text-[9px] text-zinc-400">Zero Invariant Safe</div>
            </div>

            <div className="p-3 bg-[#0a0f1e] rounded-2xl border-white/10 space-y-0.5">
              <div className="text-[10px] text-zinc-500">GENESIS BLOCK</div>
              <div className="text-xs font-bold text-cyan-300">{executiveSummary.genesisBlockHeight}</div>
              <div className="text-[9px] text-zinc-400">Frozen Epoch Anchor</div>
            </div>

            <div className="p-3 bg-[#0a0f1e] rounded-2xl border-white/10 space-y-0.5">
              <div className="text-[10px] text-zinc-500">CANONICAL SEALS</div>
              <div className="text-xs font-bold text-emerald-300">{executiveSummary.canonicalSealsCount.toLocaleString()}</div>
              <div className="text-[9px] text-zinc-400">100% Inviolable</div>
            </div>

            <div className="p-3 bg-[#0a0f1e] rounded-2xl border-white/10 space-y-0.5">
              <div className="text-[10px] text-zinc-500">QUARANTINE ISOLATION</div>
              <div className="text-xs font-bold text-amber-300">{executiveSummary.forensicQuarantineRange}</div>
              <div className="text-[9px] text-zinc-400">{executiveSummary.quarantineIsolation}</div>
            </div>

            <div className="p-3 bg-[#0a0f1e] rounded-2xl border-white/10 space-y-0.5">
              <div className="text-[10px] text-zinc-500">QUORUM ATTESTED</div>
              <div className="text-xs font-bold text-emerald-400">10/10 Gold Master</div>
              <div className="text-[9px] text-zinc-400">{executiveSummary.reconciliationStatus}</div>
            </div>
          </div>

          {/* Merkle Root Verification Strip */}
          <div className="p-3.5 rounded-2xl bg-black/60 border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-zinc-400">GENESIS MERKLE ROOT:</span>
              <code className="text-emerald-300 break-all select-all font-bold">{executiveSummary.merkleRoot}</code>
            </div>
            <button
              onClick={() => handleCopy(executiveSummary.merkleRoot, 'merkle')}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px] flex items-center gap-1 shrink-0 self-end sm:self-auto cursor-pointer"
            >
              {copiedField === 'merkle' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedField === 'merkle' ? 'Copied' : 'Copy Hash'}</span>
            </button>
          </div>

          {/* 10/10 Passports Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <span>📑</span>
                <span>10/10 SOVEREIGN CUSTODIAN PASSPORTS MATRIX (VERIFIED)</span>
              </span>
              <span className="text-[10px] text-emerald-400">100% REAL HSM PASS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {passportsMatrix.map((passport) => (
                <div
                  key={passport.id}
                  className="p-3.5 rounded-2xl bg-[#0a0f1e] border-white/10 space-y-2 hover:border-emerald-500/40 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border-emerald-500/30">
                        {passport.id}
                      </span>
                      <span className="font-bold text-white truncate max-w-[200px]">{passport.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {passport.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-cyan-300/90 font-sans">{passport.role}</div>

                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-white/5 text-zinc-400">
                    <span className="text-zinc-500 font-mono text-[9px] truncate max-w-[220px]" title={passport.sha256}>
                      SHA256: {passport.sha256.substring(0, 16)}...{passport.sha256.substring(passport.sha256.length - 8)}
                    </span>
                    <button
                      onClick={() => handleCopy(passport.sha256, passport.id)}
                      className="hover:text-white flex items-center gap-1 text-[9px] cursor-pointer"
                      title="Copy SHA-256 fingerprint"
                    >
                      {copiedField === passport.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Framework & Post-Quantum Proof */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Thai Legal Compliance */}
            <div className="p-4 rounded-2xl bg-black/50 border-white/10 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-white text-xs">
                <Scale className="w-4 h-4 text-[#D4AF37]" />
                <span>THAI LEGAL STATUTORY FRAMEWORK</span>
              </div>
              <div className="space-y-2 text-[11px] text-zinc-300">
                <div>
                  <strong className="text-cyan-300 block mb-1">ETA B.E. 2544 (2001/2019):</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                    {complianceFramework.ETA_B_E_2544.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <strong className="text-[#D4AF37] block mb-1">PDPA B.E. 2562 (2019):</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                    {complianceFramework.PDPA_B_E_2562.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Post-Quantum Master Proof */}
            <div className="p-4 rounded-2xl bg-black/50 border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-white text-xs">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>POST-QUANTUM MASTER PROOF</span>
                </div>
                <button
                  onClick={() => handleCopy(JSON.stringify(masterProof, null, 2), 'proof')}
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === 'proof' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Proof</span>
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-black/80 border-white/5 space-y-1 text-[10px] text-zinc-400 font-mono">
                <div><span className="text-zinc-500">type:</span> <span className="text-emerald-300">{masterProof.type}</span></div>
                <div><span className="text-zinc-500">method:</span> <span className="text-cyan-300">{masterProof.verificationMethod}</span></div>
                <div className="truncate"><span className="text-zinc-500">jws:</span> <span className="text-zinc-300">{masterProof.jws}</span></div>
                <div className="truncate"><span className="text-zinc-500">leaf:</span> <span className="text-zinc-300">{masterProof.merkleLeafProof}</span></div>
              </div>

              <div className="pt-1 text-[10px] text-zinc-400">
                <span>Signed By: <strong className="text-white">{GOLD_MASTER_FORENSIC_REPORT.signedBy}</strong></span>
              </div>
            </div>
          </div>

          {/* Source Files Strip */}
          <div className="p-3.5 rounded-2xl bg-[#0a0f1e] border-white/10 space-y-1.5">
            <div className="text-[10px] text-zinc-500 font-bold">FORENSIC ARTIFACT SOURCE FILES (7 FILES INCLUDED IN QUORUM)</div>
            <div className="flex flex-wrap gap-2 text-[10px]">
              {sourceFiles.map((file, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-black/50 text-zinc-300 border-white/10">
                  {file}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
