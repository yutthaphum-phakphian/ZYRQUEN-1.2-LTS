import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  CheckCircle2,
  XCircle,
  Hash,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  X,
  ExternalLink,
  Cpu,
  ChevronRight,
  Fingerprint,
} from 'lucide-react';
import {
  verifyAuditLogAgainstLedger,
  MerkleVerificationResult,
  toggleSimulateTamper,
  isTamperActive,
  subscribeToMerkleEngine,
} from '../../utils/merkleVerificationEngine';
import { playAuditChime, playTone } from '../AudioSynthesizer';

interface MerkleVerificationBadgeProps {
  className?: string;
  showInspectorButton?: boolean;
  compact?: boolean;
}

export const MerkleVerificationBadge: React.FC<MerkleVerificationBadgeProps> = ({
  className = '',
  showInspectorButton = true,
  compact = false,
}) => {
  const [result, setResult] = useState<MerkleVerificationResult>(() => verifyAuditLogAgainstLedger());
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(isTamperActive());

  const recompute = () => {
    const updated = verifyAuditLogAgainstLedger();
    setResult(updated);
  };

  useEffect(() => {
    return subscribeToMerkleEngine(() => {
      setIsSimulating(isTamperActive());
      recompute();
    });
  }, []);

  const handleToggleTamper = () => {
    const nextTamper = toggleSimulateTamper();
    setIsSimulating(nextTamper);
    recompute();

    if (nextTamper) {
      // Tamper sound warning
      playTone(280, 0.25, 'sawtooth');
      setTimeout(() => playTone(220, 0.3, 'sawtooth'), 120);
    } else {
      // Verified sound chime
      playAuditChime();
    }
  };

  const isVerified = result.status === 'VERIFIED';

  return (
    <>
      {/* Badge Pill */}
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <button
          onClick={() => {
            playTone(550, 0.08, 'sine');
            setIsInspectorOpen(true);
          }}
          className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all duration-300 shadow-lg select-none cursor-pointer ${
            isVerified
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]'
              : 'bg-red-950/80 border-red-500/80 text-red-300 hover:bg-red-900/90 hover:border-red-400 hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse'
          }`}
          title="Click to inspect Merkle Hash Chain and compare against Sovereign Ledger Sealed Block"
        >
          {/* Status Indicator Dot */}
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isVerified ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isVerified ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
          </span>

          {/* Icon */}
          {isVerified ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          )}

          {/* Label */}
          <div className="flex items-center gap-1.5 font-bold tracking-wider">
            <span>MERKLE:</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                isVerified
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                  : 'bg-red-500/30 text-red-100 border border-red-500/60'
              }`}
            >
              {result.status}
            </span>
          </div>

          {!compact && (
            <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline border-l border-zinc-700 pl-2">
              Block #{result.sealedBlockHeight}
            </span>
          )}

          {showInspectorButton && (
            <span className="text-zinc-400 group-hover:text-white transition-colors ml-0.5">
              <Eye className="w-3 h-3" />
            </span>
          )}
        </button>

        {/* Quick Tamper Simulation Trigger for Testing */}
        <button
          onClick={handleToggleTamper}
          className={`text-[10px] font-mono px-2 py-1 rounded-lg border transition-all ${
            isSimulating
              ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
              : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
          }`}
          title={isSimulating ? 'Restore Canonical Audit Log' : 'Simulate Hash Chain Tampering'}
        >
          {isSimulating ? 'RESTORE CHAIN' : 'TEST TAMPER'}
        </button>
      </div>

      {/* Merkle Verification Inspector Modal */}
      <AnimatePresence>
        {isInspectorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 text-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-2xl border ${
                      isVerified
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    {isVerified ? (
                      <ShieldCheck className="w-6 h-6" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white tracking-wide">
                        Merkle Verification Engine
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                          isVerified
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                        }`}
                      >
                        {result.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Hash Chain Continuity vs Sovereign Ledger Sealed Block Reference
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsInspectorOpen(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Alert Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  isVerified
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                    : 'bg-red-950/40 border-red-500/50 text-red-200'
                }`}
              >
                {isVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-sm block">
                    {isVerified
                      ? 'Sovereign Hash Chain Invariant Verified'
                      : 'Cryptographic Tamper / Linkage Invalidation Detected'}
                  </span>
                  <p className="text-zinc-300">
                    {isVerified
                      ? `All ${result.totalEntriesVerified} audit stages match uninterrupted parent-to-output hashes. Root matches sealed block #${result.sealedBlockHeight} with 0.00% drift.`
                      : result.tamperedDetails ||
                        'Hash linkage broken. The calculated Merkle tree does not match the immutable sovereign ledger.'}
                  </p>
                </div>
              </div>

              {/* Comparison Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Calculated Root */}
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-mono">Calculated Merkle Root</span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      SHA-256 / 256-bit
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 text-[11px] font-mono break-all select-all text-amber-300">
                    {result.calculatedRoot}
                  </div>
                </div>

                {/* Sealed Block Reference */}
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-mono">Sovereign Ledger Anchor</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Block #{result.sealedBlockHeight}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 text-[11px] font-mono break-all select-all text-emerald-300">
                    {result.expectedRoot}
                  </div>
                </div>
              </div>

              {/* Sequential Hash Chain Steps */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Audit Log Hash Chain ({result.chainLinks.length} Stages)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Parent &rarr; Output Cryptographic Link
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {result.chainLinks.map((link) => (
                    <div
                      key={link.index}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono transition-all ${
                        link.isLinkValid
                          ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                          : 'bg-red-950/40 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            link.isLinkValid
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/30 text-red-300'
                          }`}
                        >
                          {link.index + 1}
                        </span>
                        <div>
                          <span className="font-bold text-white block">{link.stageName}</span>
                          <span className="text-[10px] text-zinc-400">Actor: {link.actor}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[10px]">
                        <div className="text-right hidden md:block">
                          <span className="text-zinc-500 block">Parent:</span>
                          <span className="text-zinc-300">{link.parentHash.slice(0, 16)}...</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-zinc-600 hidden md:block" />
                        <div className="text-right">
                          <span className="text-zinc-500 block">Output Digest:</span>
                          <span
                            className={
                              link.isLinkValid ? 'text-cyan-300' : 'text-red-400 font-bold'
                            }
                          >
                            {link.outputHash.slice(0, 18)}...
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            link.isLinkValid
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/50'
                          }`}
                        >
                          {link.isLinkValid ? 'LINKED' : 'CORRUPTED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                  <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                  <span>Proof: {result.cryptographicProof.slice(0, 36)}...</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleTamper}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      isSimulating
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                        : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {isSimulating ? 'Restore Canonical Chain' : 'Inject Tamper Test'}
                  </button>
                  <button
                    onClick={() => setIsInspectorOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
