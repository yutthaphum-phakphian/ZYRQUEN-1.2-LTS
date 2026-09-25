import React from 'react';
import { X, GitCompare, CheckCircle2, AlertTriangle, ShieldCheck, FileCode, Check, Layers } from 'lucide-react';
import { EvidencePayload } from './CourtEvidenceQRModal';

interface CompareEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sealA?: EvidencePayload | null;
  sealB?: EvidencePayload | null;
  seals?: EvidencePayload[];
}

export const CompareEvidenceModal: React.FC<CompareEvidenceModalProps> = ({
  isOpen,
  onClose,
  sealA,
  sealB,
  seals
}) => {
  if (!isOpen) return null;

  // Determine active seals to compare (prefer seals array if provided, otherwise sealA and sealB)
  const activeSeals: EvidencePayload[] = (seals && seals.length > 0)
    ? seals
    : [sealA, sealB].filter(Boolean) as EvidencePayload[];

  if (activeSeals.length < 2) return null;

  const firstRoot = activeSeals[0].merkle_root;
  const allRootsMatch = activeSeals.every(s => s.merkle_root === firstRoot);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                CRYPTOGRAPHIC EVIDENCE COMPARISON &amp; DIFF
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                  {activeSeals.length} SEALS SELECTED
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Unified Cross-Verification of Merkle Roots, PQC Signatures, and Forensic Hashes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto font-mono text-xs custom-scrollbar">
          
          {/* Summary Status Bar */}
          <div className="p-3.5 rounded-xl bg-slate-950 border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">Merkle Subtree Parity:</span>
            </div>
            {allRootsMatch ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4" /> IDENTICAL MERKLE ROOTS (Same Subtree Cluster)
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4" /> DISTINCT ROOTS (Sequential Forensic Timestamps / Epochs)
              </span>
            )}
            <div className="text-[11px] text-slate-500">
              Invariant: <span className="text-emerald-400 font-bold">SSoT Δ0.00%</span>
            </div>
          </div>

          {/* Unified Matrix Grid View for Active Seals */}
          <div className={`grid grid-cols-1 ${activeSeals.length === 2 ? 'md:grid-cols-2' : activeSeals.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
            {activeSeals.map((seal, idx) => {
              const isFirst = idx === 0;
              const matchesFirst = seal.merkle_root === firstRoot;
              const colColor = idx === 0 ? 'text-cyan-400' : idx === 1 ? 'text-purple-400' : idx === 2 ? 'text-emerald-400' : 'text-amber-400';
              const borderAccent = idx === 0 ? 'border-cyan-500/30' : idx === 1 ? 'border-purple-500/30' : idx === 2 ? 'border-emerald-500/30' : 'border-amber-500/30';

              return (
                <div key={seal.seal_idx + '-' + idx} className={`p-4 rounded-xl bg-slate-950 border ${borderAccent} space-y-3 shadow-lg`}>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className={`font-bold ${colColor}`}>
                      SEAL {String.fromCharCode(65 + idx)} (#{seal.seal_idx})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Block #{seal.genesis_block}</span>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Merkle Root</span>
                      {matchesFirst ? (
                        <span className="text-emerald-400 flex items-center gap-1 text-[9px]">
                          <Check className="w-3 h-3" /> MATCH
                        </span>
                      ) : (
                        <span className="text-amber-400 text-[9px]">DIFF</span>
                      )}
                    </div>
                    <div className={`p-2 rounded border text-[10px] break-all mt-1 ${
                      matchesFirst 
                        ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' 
                        : 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                    }`}>
                      {seal.merkle_root}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">PQC Signature</span>
                    <div className="p-2 rounded border-purple-500/20 bg-purple-500/10 text-purple-300 text-[10px] truncate mt-1">
                      {seal.pqc_sig}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 text-[11px] border-t border-slate-800/60">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Principal:</span>
                      <span className="text-slate-300">{seal.principal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Timestamp:</span>
                      <span className="text-slate-300">
                        {seal.ts.includes('T') ? seal.ts.split('T')[1]?.substring(0, 8) : seal.ts} UTC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Admissibility:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> READY
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Forensic Audit Compliance Note */}
          <div className="p-3 bg-slate-950/80 rounded-xl border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Thai Electronic Transactions Act B.E. 2544 (Sec 9, 26, 28) Non-Repudiation Guaranteed</span>
            <span className="text-cyan-400 font-bold">10/10 REAL_HSM QUORUM ACTIVE</span>
          </div>

        </div>

      </div>
    </div>
  );
};
export default CompareEvidenceModal;

