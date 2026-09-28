import React from 'react';
import { ShieldCheck, TrendingUp, Lock, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';

export interface IntegrityScoreCardProps {
  score?: number;
  delta?: number;
  verifiedCount?: number;
  totalCount?: number;
  onInspect?: () => void;
}

export const IntegrityScoreCard: React.FC<IntegrityScoreCardProps> = ({
  score = 99.47,
  delta = 0.04,
  verifiedCount = 14902,
  totalCount = 14982,
  onInspect,
}) => {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 p-4 sm:p-5 shadow-xl font-mono flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
            Sovereign Integrity Score
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          PURE GREEN
        </span>
      </div>

      <div className="my-3 flex items-center justify-between">
        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
              {score.toFixed(2)}%
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +{delta.toFixed(2)}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            SSoT Verified: {verifiedCount.toLocaleString()} / {totalCount.toLocaleString()} Hardware Seals
          </div>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col items-center justify-center text-center p-1">
          <Lock className="w-5 h-5 text-emerald-400 mb-0.5" />
          <span className="text-[9px] font-bold text-emerald-300">10/10 HSM</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
        <span className="text-slate-400">Zero Phase Jitter Variance</span>
        {onInspect && (
          <button
            onClick={onInspect}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <span>Inspect Audit Proof</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default IntegrityScoreCard;
