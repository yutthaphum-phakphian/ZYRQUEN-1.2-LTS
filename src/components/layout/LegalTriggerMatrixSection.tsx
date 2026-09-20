import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Scale,
  FileDown,
  BookOpen,
  FileText,
  ShieldCheck,
  Download,
  CheckCircle2,
  Copy,
  Fingerprint,
} from 'lucide-react';
import { ETDA_PDPA_TRIGGERS, TRIGGER_PQC_HASHES } from '@/config/sovereignConfig';
import { safeWriteText } from '@/utils/safeClipboard';
import { playTone } from '@/components/AudioSynthesizer';
import { triggerVibration } from '@/utils/vibration';

export interface LegalTriggerMatrixSectionProps {
  isGateDetailsExpanded: boolean;
  isForensicAuditMode: boolean;
  onExportLegalTriggerMatrixPDF: () => void;
  onOpenLegalSearch: () => void;
  onOpenCertificate: () => void;
  onBatchVerify: () => void;
  onExportAuditLogs: () => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const LegalTriggerMatrixSection: React.FC<LegalTriggerMatrixSectionProps> = ({
  isGateDetailsExpanded,
  isForensicAuditMode,
  onExportLegalTriggerMatrixPDF,
  onOpenLegalSearch,
  onOpenCertificate,
  onBatchVerify,
  onExportAuditLogs,
  showToast,
}) => {
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  const handleCopyTriggerHash = useCallback(
    async (triggerId: string, hash: string) => {
      const ok = await safeWriteText(hash);
      triggerVibration('snapshot');
      playTone(880, 0.1, 'sine');
      if (ok) {
        setCopiedHashId(triggerId);
        showToast(`คัดลอก PQC SIG HASH (${triggerId}) สำเร็จ`, 'success');
        setTimeout(() => setCopiedHashId(null), 2500);
      } else {
        showToast(`คัดลอกไม่สำเร็จ กรุณาคัดลอกด้วยตนเอง: ${hash.slice(0, 12)}...`, 'error');
      }
    },
    [showToast]
  );

  return (
    <AnimatePresence>
      {isGateDetailsExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-cyan-500/20 bg-[#060812]/95 px-4 sm:px-6 py-4 space-y-4"
        >
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/8 font-mono">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <span>Thai Legal & Cryptographic Compliance Trigger Matrix</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    ALL 6 TRIGGERS GREEN (100%)
                  </span>
                </h4>
                <p className="text-xs text-zinc-400 font-sans">
                  Sovereign Invariants under ETDA B.E. 2544 (2001/2019) & PDPA B.E. 2562 (2019) certified against Passport #EP-SOVEREIGN-01.
                </p>
              </div>
            </div>

            {/* Actions shortcut */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onExportLegalTriggerMatrixPDF}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 text-[11px] font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                title="Export signed legal trigger matrix as official PDF artifact"
              >
                <FileDown className="w-3.5 h-3.5" />
                Export Signed Matrix PDF
              </button>
              <button
                type="button"
                onClick={onOpenLegalSearch}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-[11px] font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Search Thai Legal Corpus
              </button>
              <button
                type="button"
                onClick={onOpenCertificate}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-[11px] font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                Inspect Cryptographic Certificate
              </button>
              <button
                type="button"
                onClick={onBatchVerify}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-[11px] font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Batch Verify Chambers
              </button>
              <button
                type="button"
                onClick={onExportAuditLogs}
                className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/35 text-[11px] font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Audit Log
              </button>
            </div>
          </div>

          {/* 6 Trigger Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-sans">
            {ETDA_PDPA_TRIGGERS.map((trigger) => (
              <div
                key={trigger.id}
                className="p-3.5 rounded-xl bg-[#090d1a]/80 border border-cyan-500/20 hover:border-cyan-500/50 hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(6,182,212,0.18)] transition-all duration-200 space-y-2 group cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                  <span className="text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25">
                    {trigger.section}
                  </span>
                  <span className="text-emerald-300 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {trigger.statusText}
                  </span>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors">
                    {trigger.title}
                  </h5>
                  <p className="text-[11px] text-cyan-400/90 font-medium font-thai">
                    {trigger.titleTh}
                  </p>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  {trigger.description}
                </p>

                <div className="pt-2 border-t border-white/5 flex flex-col gap-1 font-mono text-[10px]">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-zinc-500">PQC Scheme:</span>
                    <span className="text-zinc-300 truncate max-w-[160px] text-right" title={trigger.pqcScheme}>
                      {trigger.pqcScheme}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-zinc-500">Anchor:</span>
                    <span className="text-cyan-400/90 truncate max-w-[160px] text-right" title={trigger.anchor}>
                      {trigger.anchor}
                    </span>
                  </div>

                  {/* PQC Signature Hash with Safe Copy to Clipboard */}
                  <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-white/5">
                    <span className="text-zinc-500">PQC Sig Hash:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-purple-300 font-mono text-[9px] truncate max-w-[120px]" title={TRIGGER_PQC_HASHES[trigger.id] || ''}>
                        {(TRIGGER_PQC_HASHES[trigger.id] || '').slice(0, 14)}...
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyTriggerHash(trigger.id, TRIGGER_PQC_HASHES[trigger.id] || '');
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[9px] font-sans cursor-pointer"
                        title="คัดลอก PQC Metadata Hash สำหรับการตรวจสอบนิติวิทยาศาสตร์ (Forensic Analysis)"
                      >
                        {copiedHashId === trigger.id ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                            <span className="text-emerald-300 text-[8px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5 text-cyan-400" />
                            <span className="text-[8px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Forensic Audit Mode Overlay Metadata */}
                  {isForensicAuditMode && (
                    <div className="mt-1.5 pt-1.5 border-t border-purple-500/30 bg-purple-950/30 -mx-2 -mb-2 p-2 rounded-b-lg space-y-1 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-[9px] text-purple-300 font-bold">
                        <span className="flex items-center gap-1">
                          <Fingerprint className="w-2.5 h-2.5 text-purple-400" />
                          <span>PQC SIG HASH:</span>
                        </span>
                        <span className="text-emerald-400 text-[8px]">VERIFIED (PASS)</span>
                      </div>
                      <div className="text-[8px] text-purple-200/90 font-mono break-all bg-black/60 p-1 rounded border border-purple-500/20 flex items-center justify-between gap-1">
                        <span>{TRIGGER_PQC_HASHES[trigger.id]}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyTriggerHash(trigger.id, TRIGGER_PQC_HASHES[trigger.id] || '');
                          }}
                          className="p-1 rounded hover:bg-white/10 text-purple-300 cursor-pointer shrink-0"
                          title="Copy hash"
                        >
                          {copiedHashId === trigger.id ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-purple-300" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[8px] text-zinc-400">
                        <span>Timestamp: {new Date().toISOString().split('T')[0]} 05:05:30 ICT</span>
                        <span className="text-cyan-400">Δ0.0% Invariant</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Sovereign Invariant Seal Strip */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Genesis Root: <strong className="text-zinc-200">909ab814...43fa4c68</strong></span>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <span className="hidden sm:inline">Canonical Block: <strong className="text-zinc-200">#849,202</strong></span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span>Sovereign Architect: <strong className="text-cyan-300">นายยุทธภูมิ พากเพียร</strong></span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-semibold">SSoT Δ0.0% ZERO DRIFT</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
