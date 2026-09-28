import React, { useState } from 'react';
import { GitBranch, ShieldCheck, Hash, Copy, Check, ExternalLink } from 'lucide-react';
import { CANONICAL_MERKLE_ROOT, CANONICAL_GENESIS_BLOCK } from '../../data/canonicalData';
import { copyToClipboard } from '../../utils/clipboard';

export const MerklePathTracker: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    copyToClipboard(CANONICAL_MERKLE_ROOT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const proofSteps = [
    { label: 'Leaf #001: Hardware Seal Batch 0-1000', hash: '8f7a...3e12', verified: true },
    { label: 'Leaf #002: Chamber 00-08 Invariants', hash: '4b19...9c81', verified: true },
    { label: 'Leaf #003: Chamber 09-17 Sovereign Apex', hash: 'e2a8...7710', verified: true },
    { label: 'Root Digest: CANONICAL SSoT FROZEN', hash: CANONICAL_MERKLE_ROOT.substring(0, 16) + '...', verified: true },
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 p-4 sm:p-5 shadow-xl font-mono space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Merkle Path Tracker &amp; Gate Pipeline
            </h3>
            <p className="text-[10px] text-slate-400">Block #{CANONICAL_GENESIS_BLOCK} Cryptographic Tree</p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Root' : 'Copy Merkle'}</span>
        </button>
      </div>

      <div className="space-y-2">
        {proofSteps.map((step, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-5 h-5 rounded bg-slate-900 border border-slate-700 text-[10px] flex items-center justify-center text-cyan-400 font-bold shrink-0">
                L{idx}
              </span>
              <span className="text-slate-300 truncate">{step.label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">{step.hash}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MerklePathTracker;
